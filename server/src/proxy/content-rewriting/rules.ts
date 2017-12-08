import {CodeStrippingRule} from './code-stripping-rule';
import {PreselectRule}     from './preselect-rule';
import {Rule}              from './rule';
import {UrlRewritingRule}  from './url-rewriting-rule';

export const cssUrlRewritingRule = new UrlRewritingRule(
    'Rewriting CSS url("...") from absolute to relative proxied URLs',
    'text/css',
    {
        prefix: /url\(\s*['"]?/,
        data: /(?:https?:)?\/\/[^'")]+/,
        suffix: /['"]?\s*\)/
    }
);

export const cssRules: ReadonlyArray<Rule> = Object.freeze([
    cssUrlRewritingRule
]);

const jsContentTypes: ReadonlyArray<string> = Object.freeze([
    'application/ecmascript',
    'application/javascript',
    'application/x-javascript',
    'text/ecmascript',
    'text/javascript',
    'text/x-javascript'
]);

export const jsStringUrlRewritingRule = new UrlRewritingRule(
    'Rewriting JavaScript strings from absolute to relative proxied URLs',
    jsContentTypes,
    {
        prefix: /[`'"]/,
        data: /(?:https?:)?\/\//,
        suffix: ''
    }
);

export const jsRules: ReadonlyArray<Rule> = Object.freeze([
    // jsStringUrlRewritingRule
]);

const htmlContentType: string = 'text/html';

export const htmlCssUrlRewritingRule = new PreselectRule(
    'Rewriting HTML-embedded CSS url("...") from absolute to relative proxied URLs',
    htmlContentType,
    {
        prefix: /<style[^>]*>/,
        data: /[^]*?/,
        suffix: /<\/style>/
    },
    cssUrlRewritingRule
);

export const htmlIframeSrcUrlRewritingRule = new UrlRewritingRule(
    'Rewriting HTML <iframe src="..."> from absolute to relative proxied URLs',
    htmlContentType,
    {
        prefix: /<iframe[^>]+?src\s*=\s*['"]/,
        data: /(?:https?:)?\/\/[^'"]+/,
        suffix: /['"][^]*?\/?>/
    }
);

export const htmlImgSrcUrlRewritingRule = new UrlRewritingRule(
    'Rewriting HTML <img src="..."> from absolute to relative proxied URLs',
    htmlContentType,
    {
        prefix: /<img[^>]+?src\s*=\s*['"]/,
        data: /(?:https?:)?\/\/[^'"]+/,
        suffix: /['"][^]*?\/?>/
    }
);

export const htmlJsUrlRewritingRule = new PreselectRule(
    'Rewriting HTML-embedded JavaScript strings from absolute to relative proxied URLs',
    htmlContentType,
    {
        prefix: /<script[^>]*>/,
        data: /[^]*?/,
        suffix: /<\/script>/
    },
    jsStringUrlRewritingRule
);

export const htmlLinkHrefUrlRewritingRule = new UrlRewritingRule(
    'Rewriting HTML <link href="..."> from absolute to relative proxied URLs',
    htmlContentType,
    {
        prefix: /<link[^>]+?href\s*=\s*['"]/,
        data: /(?:https?:)?\/\/[^'"]+/,
        suffix: /['"][^]*?\/?>/
    }
);

export const htmlMetaContentUrlRewritingRule = new UrlRewritingRule(
    'Rewriting HTML <meta content="..."> from absolute to relative proxied URLs',
    htmlContentType,
    {
        prefix: /<meta[^>]+?content\s*=\s*['"]/,
        data: /(?:https?:)?\/\/[^'"]+/,
        suffix: /['"][^]*?\/?>/
    }
);

export const htmlScriptSrcUrlRewritingRule = new UrlRewritingRule(
    'Rewriting HTML <script src="..."> from absolute to relative proxied URLs',
    'text/html',
    {
        prefix: /<script[^>]+?src\s*=\s*['"]/,
        data: /(?:https?:)?\/\/[^'"]+/,
        suffix: /['"][^]*?\/?>/
    }
);

export const htmlRules: ReadonlyArray<Rule> = Object.freeze([
    htmlCssUrlRewritingRule,
    htmlIframeSrcUrlRewritingRule,
    htmlImgSrcUrlRewritingRule,
    // htmlJsUrlRewritingRule,
    htmlLinkHrefUrlRewritingRule,
    htmlMetaContentUrlRewritingRule,
    htmlScriptSrcUrlRewritingRule
]);

export const githubFrameBustingCodeStrippingRule = new CodeStrippingRule(
    "Stripping GitHub's frame busting code",
    jsContentTypes,
    /^https:\/\/assets-cdn\.github\.com\/assets\/github-\w+\.js$/,
    /define\("github\/bust-frames"[^}]+}\),/
);

export const githubScriptIntegrityCodeStrippingRule = new CodeStrippingRule(
    `Stripping GitHub's <script integrity="..."> checksums`,
    htmlContentType,
    /^https:\/\/github\.com\//,
    /integrity=['"][^'"]+['"]/g
);

export const lyftFrameBustingCodeStrippingRule = new CodeStrippingRule(
    "Stripping Lyft's frame busting code",
    htmlContentType,
    'https://eng.lyft.com/typescript-at-lyft-64f0702346ea',
    'if (window.top !== window.self) window.top.location = window.self.location.href;'
);

export const stackOverflowFrameBustingCodeStrippingRule = new CodeStrippingRule(
    "Stripping StackOverflow's frame busting code",
    jsContentTypes,
    // There's a query string at the end of this URL (like "?v=c40a229bcefc") that is ignored.
    /^https:\/\/cdn\.sstatic\.net\/Js\/stub\.en\.js/,
    /,top!=self\).*?new Error;/,
    ');'
);

export const specificRules: ReadonlyArray<Rule> = Object.freeze([
    githubFrameBustingCodeStrippingRule,
    githubScriptIntegrityCodeStrippingRule,
    lyftFrameBustingCodeStrippingRule,
    stackOverflowFrameBustingCodeStrippingRule
]);

export const allRules: ReadonlyArray<Rule> = Object.freeze(new Array<Rule>().concat(
    cssRules,
    jsRules,
    htmlRules,
    specificRules
));
