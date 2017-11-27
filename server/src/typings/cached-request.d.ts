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

        // In cached-request.js, `Response` derives from `stream.Transform`. But `Response`'s stream functionality is
        // relevant only when the `callback` argument is supplied when making the initial request. In that case
        // `callback` is passed an instance of this type (as its second argument) and the payload has been streamed
        // to it. Note that by the time `callback` is invoked, the payload has been fully reassembled and also passed
        // to `callback` (as its third argument). So even in the `callback` scenario the reason for this type deriving
        // from `stream.Transport` is internal to cached-request. That detail could be possibly be omitted here, but it
        // is done so anyway to accurately reflect the state of things, and more closely align with the signature of
        // `request.RequestCallback`, which expects a derivation of `stream.Readable` for its second argument.
        export interface Response extends stream.Transform {
            headers: http.OutgoingHttpHeaders;
            statusCode: number;
        }
    }

    export = createCachedRequest;
}
