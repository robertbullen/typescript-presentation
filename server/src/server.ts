import * as connectLogger from 'connect-logger';
import * as express       from 'express';
import * as fs            from 'fs';
import * as https         from 'https';
import * as path          from 'path';

import {languagesUrl} from '../../common/src/languages';

import * as config        from './config';
import {rules}            from './content-rewriting-rules';
import {LanguagesService} from './languages-service';
import {ProxyService}     from './proxy-service';

//---------------------------------------------
// Create and Configure the Express Application
//---------------------------------------------

// Create the Express application.
const application: express.Application = express();

// Register helpful third party middleware.
application.use(connectLogger());

// Register middleware for proxying (and caching and rewriting) external resources.
const proxyService = new ProxyService(
    config.routeBase,
    config.cacheDirectoryPath,
    config.beforeAndAfterDirectoryPath,
    config.maxAgeMilliseconds,
    rules,
    config.preserveContentEncoding
);
proxyService.registerMiddleware(application);

// Register middleware for the languages endpoint.
const languagesService: LanguagesService = (() => {
    function getLanguagesMarkdown(): Promise<string> {
        const languagesMarkdownSourceUrl: string = 'https://raw.githubusercontent.com/wiki/jashkenas/coffeescript/List-of-languages-that-compile-to-JS.md';
        return proxyService.requestAsPromise(languagesMarkdownSourceUrl);
    }
    return new LanguagesService(getLanguagesMarkdown, languagesUrl);
})();
languagesService.registerMiddleware(application);

// Redirect requests for "default" to the client subdirectory.
application.use('/', function redirectForRoot(request: express.Request, response: express.Response, next: express.NextFunction): void {
    if (request.url === '/') {
        response.redirect('/client/');
    } else {
        next();
    }
});

// Serve up the project root directory statically so that source code can be retrieved by the client.
const projectRootDir: string = path.join(process.cwd(), '..');
application.use('/', express.static(projectRootDir));

//--------------------------------
// Create and Run the HTTPS Server
//--------------------------------

// Load the SSL private key and certificate from disk.
console.group('Loading HTTPS resources');

const certFilePath: string = path.join(process.cwd(), 'cert.pem');
console.log(`Using certificate at '${certFilePath}'`);

const keyFilePath: string = path.join(process.cwd(), 'key.pem');
console.log(`Using private key at '${keyFilePath}'`);

const httpsOptions = {
    cert: fs.readFileSync(certFilePath),
    key: fs.readFileSync(keyFilePath)
}

console.groupEnd();

// Use either the PORT environment variable or a reasonable default.
const port: number = Number.parseInt(process.env.PORT || '8443');

// Run the HTTPS server.
const server: https.Server = https.createServer(httpsOptions, application as any);
server.listen(port, () => console.log(`Listening with HTTPS over port ${port}`));
