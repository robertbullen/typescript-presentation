import * as cachedRequest from 'cached-request';
import * as express       from 'express';
import * as fsep          from 'fs-extra-promise';
import * as getStream     from 'get-stream';
import * as iltorb        from 'iltorb';
import * as request       from 'request';
import * as stream        from 'stream';
import * as url           from 'url';
import * as zlib          from 'zlib';

import * as contentRewriting from './content-rewriting';
import * as remoteResource   from './remote-resource';

export interface ProxyConfig {
    routeBase: string;
    refererQueryParam: string;
    cache: {
        directoryPath: string;
        maxAgeMilliseconds: number;
    };
    rewrites: {
        rules: ReadonlyArray<contentRewriting.Rule>;
        directoryPath: string;
        recompress: boolean;
    };
}

/**
 * Implements a caching proxy for external resources so that the presentation isn't dependent on an active network
 * connection. It is a dumb proxy, though--it doesn't read, write, or understand any caching-related HTTP headers.
 * It's also a little naughty--it strips certain frame-busting HTTP response headers and allows response bodies to be
 * rewritten for the purpose of absolute URL rewriting and the elimination of frame-busting code.
 */
export class ProxyService {
    private readonly cachedRequest: cachedRequest.CachedRequest;
    private readonly remoteResourceCodec: remoteResource.Codec;

    public constructor(private readonly config: ProxyConfig) {
        this.cachedRequest = cachedRequest(request);
        this.cachedRequest.setCacheDirectory(config.cache.directoryPath);
        this.cachedRequest.setValue('ttl', config.cache.maxAgeMilliseconds);

        this.remoteResourceCodec = new remoteResource.Codec(this.config.routeBase, this.config.refererQueryParam);
    }

    /**
     * Empties the cache directory maintained by this proxy.
     */
    public clearCacheDirectory(): void {
        return fsep.emptyDirSync(this.config.cache.directoryPath);
    }

    /**
     * Empties the rewrites directory maintained by this proxy.
     */
    public clearRewritesDirectory(): void {
        return fsep.emptyDirSync(this.config.rewrites.directoryPath);
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
        application.get(this.config.routeBase + '*', this.createMiddlewareToProxyAndCacheAndRewriteExternalResources());
        return application;
    }

    private createMiddlewareToRedirectExternallyReferredRelativeUrls(): express.RequestHandler {
        return (req: express.Request, res: express.Response, next: express.NextFunction) => {
            // Ignore requests that are already for external resources.
            const requestRemoteComponents: remoteResource.Components | null = this.remoteResourceCodec.decode(req.url);
            if (requestRemoteComponents) { return next(); }

            // Examine the path portion of the referer header. Ignore requests that don't originate from external
            // resources.
            const referer: string | undefined = req.header('referer');
            if (!referer) { return next(); }

            const refererParsedUrl = new url.URL(referer);
            const refererPathAndHash: string = refererParsedUrl.pathname + refererParsedUrl.search + refererParsedUrl.hash;
            const refererRemoteComponents: remoteResource.Components | null = this.remoteResourceCodec.decode(refererPathAndHash);
            if (!refererRemoteComponents) { return next(); }

            // Generate the redirect URL.
            const externalUrl: string = url.resolve(refererRemoteComponents.externalUrl, req.url);
            const redirectUrl: string = this.remoteResourceCodec.encode(externalUrl);

            console.group(`Redirecting ${req.url}`);
            console.log(`➡ ${redirectUrl}`);
            console.groupEnd();

            res.redirect(redirectUrl);
        };
    }

    private createMiddlewareToProxyAndCacheAndRewriteExternalResources(): express.RequestHandler {
        return (req: express.Request, res: express.Response, next: express.NextFunction) => {
            // This handler should only process requests for external resources.
            const requestRemoteComponents: remoteResource.Components | null = this.remoteResourceCodec.decode(req.url);
            if (!requestRemoteComponents) { return next(); }

            // Normalize any unconventionally formatted URL. For example, source map files are sometimes requested
            // with a URL having only a single slash, like "http:/www.example.com/script.map". The request package
            // will throw an error with such URLs, and that should be avoided so as to not crash this server.
            {
                const parsedUrl: url.URL = new url.URL(requestRemoteComponents.externalUrl);
                requestRemoteComponents.externalUrl = parsedUrl.toString();
            }

            // Create an error handler function that can be used on all participants in a stream pipe.
            const errorHandler = (error: Error) => next(error);

            // Request the external resource as a stream, passing whitelisted headers through.
            const headers: request.Headers = {};
            for (const name of ProxyService.requestHeadersWhitelist) {
                const value: string | undefined = req.header(name);
                if (value) { headers[name] = value; }
            }
            const options: request.CoreOptions = { headers };
            let responseStream: stream.Readable = this.requestAsStream(requestRemoteComponents.externalUrl, options).on('error', errorHandler);

            responseStream.on('response', (response: cachedRequest.Response) => {
                // Perform content rewriting if called for. This is done before copying headers because the
                // transformation pipeline may need to alter them.
                // TODO: Mutating a function argument is ugly; rewrite this to be more elegant.
                responseStream = this.createContentRewritingPipeline(requestRemoteComponents.externalUrl, responseStream, response, errorHandler);

                // Copy the status code and headers that aren't blacklisted to the Express response.
                res.status(response.statusCode);
                for (const key in response.headers) {
                    if (!response.headers.hasOwnProperty(key)
                        || ProxyService.responseHeadersBlacklist.indexOf(key.toLowerCase()) >= 0) { continue; }
                    const value: number | string | string[] = response.headers[key] || '';
                    res.setHeader(key, value);
                }

                // Pipe the content to the Express response.
                responseStream.pipe(res);
            });
        }
    }

    private createContentRewritingPipeline(
        path: string,
        responseStream: stream.Readable,
        response: cachedRequest.Response,
        errorHandler: (error: Error) => void
    ): stream.Readable {
        // Get the content type and encoding.
        const contentEncoding: string = (response.headers['content-encoding'] || '').toString();

        let contentType: string = (response.headers['content-type'] || '').toString();
        const semicolonIndex: number = contentType.indexOf(';');
        if (semicolonIndex >= 0) { contentType = contentType.substring(0, semicolonIndex); }

        // Determine which rewrite rules apply to this resource. If none do, then don't go through the expense of
        // decompressing, searching for regex matches, and possibly recompressing the stream.
        const context: contentRewriting.Context = {
            contentType,
            path,
            remoteResourceCodec: this.remoteResourceCodec
        }
        const rules: contentRewriting.Rule[] = contentRewriting.Rule.selectApplicableRules(context, this.config.rewrites.rules);
        if (rules.length === 0) { return responseStream; }

        // Create the decompression, rewrite, and recompression transforms. These could be PassThroughs or the real
        // McCoy. This is done by examining the Content-Encoding header and preserveContentEncoding member. Supported
        // content rewriting encodings are: 'gzip', 'deflate', 'br', and 'identity'. 'compress' is also a valid
        // encoding but it is so rarely used that it isn't worth the trouble of coding for it, because it's not an
        // algorithm supported by Node.js out-of-the-box and so it would require adding a third party package.
        let decompressTransform: stream.Transform;
        let rewriteTransform: stream.Transform;
        let recompressTransform: stream.Transform;
        switch (contentEncoding) {
            case 'br':
                decompressTransform = iltorb.decompressStream();
                rewriteTransform = new contentRewriting.Transform(context, rules, this.config.rewrites.directoryPath);
                recompressTransform = this.config.rewrites.recompress ? iltorb.compressStream() : new stream.PassThrough();
                break;

            case 'deflate':
                decompressTransform = zlib.createInflate();
                rewriteTransform = new contentRewriting.Transform(context, rules, this.config.rewrites.directoryPath);
                recompressTransform = this.config.rewrites.recompress ? zlib.createDeflate() : new stream.PassThrough();
                break;

            case 'gzip':
                decompressTransform = zlib.createGunzip();
                rewriteTransform = new contentRewriting.Transform(context, rules, this.config.rewrites.directoryPath);
                recompressTransform = this.config.rewrites.recompress ? zlib.createGzip() : new stream.PassThrough();
                break;

            case 'compress':
                decompressTransform = new stream.PassThrough();
                rewriteTransform = new stream.PassThrough();
                recompressTransform = new stream.PassThrough();
                break;

            case 'identity':
            default:
                decompressTransform = new stream.PassThrough();
                rewriteTransform = new contentRewriting.Transform(context, rules, this.config.rewrites.directoryPath);
                recompressTransform = new stream.PassThrough();
                break;
        }
        decompressTransform.on('error', errorHandler);
        rewriteTransform.on('error', errorHandler);
        recompressTransform.on('error', errorHandler);

        // Update the content encoding header if the payload is decompressed and not recompressed.
        if (!this.config.rewrites.recompress && !(decompressTransform instanceof stream.PassThrough)) {
            response['content-encoding'] = 'identity';
        }

        // Wire up and return the stream pipeline.
        return responseStream.on('error', (_error: Error) => decompressTransform.end())
            .pipe(decompressTransform).on('error', (_error: Error) => rewriteTransform.end())
            .pipe(rewriteTransform).on('error', (_error: Error) => recompressTransform.end())
            .pipe(recompressTransform);
    }

    /**
     * These are HTTP headers that are passed from the client request to the server. All others are effectively
     * blacklisted.
     */
    private static readonly requestHeadersWhitelist: ReadonlyArray<string> = Object.freeze([
        'accept',
        'accept-encoding',
        'accept-language',
        'dnt',
        'range',
        'upgrade-insecure-requests',
        'user-agent'
    ]);

    /**
     * These are the HTTP headers that are excluded from the server response to the client. All others are effectively
     * whitelisted.
     */
    private static readonly responseHeadersBlacklist: ReadonlyArray<string> = Object.freeze([
        'content-length',
        'content-security-policy',
        'transfer-encoding',
        'x-frame-options'
    ]);
}
