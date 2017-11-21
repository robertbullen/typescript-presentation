import * as cachedRequest from 'cached-request';
import * as express       from 'express';
import * as fsep          from 'fs-extra-promise';
import * as getStream     from 'get-stream';
import * as request       from 'request';
import * as stream        from 'stream';
import * as url           from 'url';

/**
 * Implements a caching proxy. In this project, it is used to store copies of external resources so that the
 * presentation isn't dependent on an active network connection. It is a dumb proxy, though--it doesn't read, write, or
 * understand caching-related HTTP headers.
 */
export class CachingProxyService {
    private readonly cachedRequest: cachedRequest.CachedRequest;

    public constructor(
        public readonly routeBase: string,
        public readonly directoryPath: string,
        public readonly maxAgeMilliseconds: number)
    {
        // Create and configure the caching requestor.
        this.cachedRequest = cachedRequest(request);
        this.cachedRequest.setCacheDirectory(directoryPath);
        this.cachedRequest.setValue('ttl', maxAgeMilliseconds);
    }

    /**
     * Clears the cache maintained by this proxy by deleting all files in `this.directoryPath`.
     */
    public clear(): Promise<void> {
        return fsep.emptyDir(this.directoryPath);
    }

    /**
     * Issues a request for an external resource, which may be satisfied by the local cache; failing that a request
     * will be sent to the external host. The result is a `stream.Readable` object.
     * 
     * @param externalUrl 
     * @param options 
     */
    public requestAsStream(externalUrl: string, options?: request.CoreOptions): stream.Readable {
        // Add the option to allow untrusted certs in case this request has to go through a corporate SSL-inspecting proxy.
        const cacheOptions: cachedRequest.Options = {
            ...options,
            strictSSL: false,
            url: externalUrl
        };
        return this.cachedRequest(cacheOptions);
    }

    /**
     * Issues a request for an external resource, which may be satisfied by the local cache; failing that a request
     * will be sent to the external host. The result is a `Promise` object.
     * 
     * @param externalUrl 
     * @param options 
     */
    public requestAsPromise(externalUrl: string, options?: request.CoreOptions): Promise<string> {
        return getStream(this.requestAsStream(externalUrl, options));
    }

    /**
     * Registers all required middleware with an Express application instance to enable a caching proxy of external
     * resources.
     * 
     * @param application The Express application instance with which to register the middleware.
     */
    public registerMiddleware(application: express.Application): express.Application {
        application.use(this.createMiddlewareToRedirectExternallyReferredRelativeUrls());
        application.get(this.routeBase + '*', this.createMiddlewareToProxyAndCacheExternalResources());
        return application;
    }

    private createMiddlewareToRedirectExternallyReferredRelativeUrls(): express.RequestHandler {
        return (req: express.Request, res: express.Response, next: express.NextFunction) => {
            // Ignore requests that are already for external resources.
            const requestExternalUrl: string | undefined = this.getExternalUrl(req.url);
            if (requestExternalUrl) { return next(); }

            // Ignore requests from referers that aren't external resources.
            const referer: string | undefined = req.header('referer');
            if (!referer) { return next(); }

            const refererParsedUrl: url.Url = url.parse(referer);
            if (!refererParsedUrl.path) { return next(); }

            const refererExternalUrl: string | undefined = this.getExternalUrl(refererParsedUrl.path);
            if (!refererExternalUrl) { return next(); }

            // Generate the redirect URL.
            const redirectUrl: string = this.routeBase + url.resolve(refererExternalUrl, req.url);
            console.log(`${req.url} ➡ ${redirectUrl}`);
            res.redirect(redirectUrl);
        };
    }

    private createMiddlewareToProxyAndCacheExternalResources(): express.RequestHandler {
        return (req: express.Request, res: express.Response, next: express.NextFunction) => {
            // This handler should only process resources with URLs that start with this.routeBase.
            const externalUrl: string | undefined = this.getExternalUrl(req.url);
            if (!externalUrl) { return next(); }

            // Ignore any unconventionally formatted URL. For example, source map files are sometimes requested with a URL
            // having only a single slash, like "http:/www.example.com". The request package will throw an error with such
            // URLs, and that should be avoided so as to not crash this server.
            const externalParsedUrl: url.Url = url.parse(externalUrl);
            if (!externalParsedUrl.host) { return next(); }

            // Request the external resource as a stream, passing certain headers through.
            const headers: request.Headers = {};
            for (const name of CachingProxyService.requestPassthroughHeaders) {
                const value: string | undefined = req.header(name);
                if (value) { headers[name] = value; }
            }
            const options: request.CoreOptions = { headers };
            const responseStream: stream.Readable = this.requestAsStream(externalUrl, options);

            // Copy the status code and headers, then pipe the body to the express response.
            responseStream
                .on('response', (response: cachedRequest.Response) => {
                    res.status(response.statusCode);
                    for (const key in response.headers) {
                        if (!response.headers.hasOwnProperty(key)) continue;
                        const value: number | string | string[] = response.headers[key] || '';
                        res.setHeader(key, value);
                    }
                })
                .on('error', (error: Error) => next(error))
                .pipe(res);
        }
    }

    /**
     * Extracts the portion of the URL immediately following `this.routeBase`. Returns undefined if `url` doesn't start
     * with that pattern.
     * 
     * @param url 
     */
    private getExternalUrl(url: string | undefined): string | undefined {
        return url && url.startsWith(this.routeBase)
            ? url.substring(this.routeBase.length)
            : undefined;
    }

    /**
     * This are HTTP headers that are passed from the client on to the server. All others are effectively blacklisted.
     */
    private static readonly requestPassthroughHeaders: ReadonlyArray<string> = Object.freeze([
        'Accept',
        'Accept-Encoding',
        'Accept-Language',
        'DNT',
        'Range',
        'Upgrade-Insecure-Requests',
        'User-Agent'
    ]);
}
