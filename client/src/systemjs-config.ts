// NPM is used for dependency management, so configure SystemJS to load modules
// from the browser accordingly.
const config: SystemJSLoader.Config = {
    map: {
        'd3':        'node_modules/d3',
        'd3-cloud':  'node_modules/d3-cloud',
        'reveal.js': 'node_modules/reveal.js',
        'tslib':     'node_modules/tslib'
    },
    packages: {
        'd3':        { defaultExtension: 'js', main: 'build/d3.min.js' },
        'd3-cloud':  { defaultExtension: 'js', main: 'build/d3.layout.cloud.js' },
        'dist':      { defaultExtension: 'js' },
        'reveal.js': {
            defaultExtension: 'js',
            main: 'js/reveal.js',
            meta: {
                '*': {
                     deps: [
                        'reveal.js/lib/js/head.min.js'
                     ]
                }
            }
        },
        'tslib': { defaultExtension: 'js', main: 'tslib.js' }
    }
};
SystemJS.config(config);
