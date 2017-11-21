declare module 'cached-request' {
    import * as http    from 'http';
    import * as request from 'request';
    import * as stream  from 'stream';

    function createCachedRequest(requestApi: typeof request): createCachedRequest.CachedRequest;

    namespace createCachedRequest {
        export type Options = request.Options & { ttl?: number; };

        export interface CachedRequest {
            (options: Options, callback?: request.RequestCallback): stream.Readable;
            setCacheDirectory(cacheDirectory: string): void;
            setValue(key: string, value: any): void;
        }

        export interface Response extends stream.Transform {
            headers: http.OutgoingHttpHeaders;
            statusCode: number;
        }
    }

    export = createCachedRequest;
}
