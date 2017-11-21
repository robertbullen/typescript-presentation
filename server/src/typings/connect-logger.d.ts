declare module 'connect-logger' {
    import express = require('express');

    function logger(options?: logger.Options): express.RequestHandler;

    namespace logger {
        interface Options {
            date?: string;
            format?: string;
        }
    }

    export = logger;
}
