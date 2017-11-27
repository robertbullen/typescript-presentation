import * as config           from './config';
import * as contentRewriting from './content-rewriting';

const githubFrameBusterPattern: string = `${config.routeBase}https://assets-cdn.github.com/assets/github-\\w+\\.js`;

export const rules: ReadonlyArray<contentRewriting.Rule> = Object.freeze([
    {
        description: 'Removing the frame busting JavaScript function employed by GitHub',
        pathPattern: new RegExp(githubFrameBusterPattern),
        // define("github/bust-frames",[],function(){top!==window&&(alert("For security reasons, framing is not allowed."),top.location.replace(document.location))}),
        search: /define\("github\/bust-frames"[^}]+}\),/,
        replace: ''
    },

    {
        description: 'Removing the integrity checksum from a <script> tag referencing GitHub\'s frame-busting code',
        pathPattern: `${config.routeBase}https://github.com/jashkenas/coffeescript/wiki/List-of-languages-that-compile-to-JS`,
        // TODO: Make this more generic in case the script and checksum change over time.
        search: /integrity="sha256-BpQoPED2obQaG8RDiTf302DlhdCCKGAlrRuRFRAAWYY="/,
        replace: ''
    },

    {
        description: 'Converting <script> tags\' src attributes from absolute to relative URLs',
        pathPattern: '*',
        contentTypes: 'text/html',
        search: /(<script.*?src=")(http(?:s)?:\/\/[^"]+)(".*?<\/script>)/g,
        replace: `$1${config.routeBase}$2$3`
    },

    {
        description: 'Converting <link> tags\' href attributes from absolute to relative URLs',
        pathPattern: '*',
        contentTypes: 'text/html',
        search: /(<link.*?href=")(http(?:s)?:\/\/[^"]+)(".*?\/?>)/g,
        replace: `$1${config.routeBase}$2$3`
    },

    // TODO: Is this necessary?
    {
        description: 'Converting <meta> tags\' content attributes from absolute to relative URLs',
        pathPattern: '*',
        contentTypes: 'text/html',
        search: /(<meta.*?content=")(http(?:s)?:\/\/[^"]+)(".*?\/?>)/g,
        replace: `$1${config.routeBase}$2$3`
    }
]);
