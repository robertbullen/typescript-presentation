import * as config from '../../config';

import {Codec} from '../remote-resource';

import {Context}                                from './rule';
import {githubFrameBustingCodeStrippingRule,
        githubScriptIntegrityCodeStrippingRule} from './rules';

const codec = new Codec(config.routeBase, config.refererQueryParam);

describe('githubFrameBustingCodeStrippingRule', () => {
    const context: Context = {
        contentType: 'application/javascript',
        path: 'https://assets-cdn.github.com/assets/github-441d386ccb865a1e7b3e037246dd545a3616b4246785db57a1f341c7443ec980.js',
        remoteResourceCodec: codec
    };

    it('path should be applicable', () => {
        expect(githubFrameBustingCodeStrippingRule.isApplicable(context)).toBeTruthy();
    });

    it('code should be stripped', () => {
        const content: string = 'define("github/bust-frames",[],function(){top!==window&&(alert("For security reasons, framing is not allowed."),top.location.replace(document.location))}),';
        expect(githubFrameBustingCodeStrippingRule.rewriteContent(context, content)).toEqual('');
    });
});

describe('githubScriptIntegrityCodeStrippingRule', () => {
    const context: Context = {
        contentType: 'text/html',
        path: 'https://github.com/robertbullen/typescript-presentation',
        remoteResourceCodec: codec
    };

    it('path should be applicable', () => {
        expect(githubScriptIntegrityCodeStrippingRule.isApplicable(context)).toBeTruthy();
    });

    it('code should be stripped', () => {
        const content: string = '<script integrity="sha256-RB04bMuGWh57PgNyRt1UWjYWtCRnhdtXofNBx0Q+yYA=" src="https://assets-cdn.github.com/assets/github.js"></script>';
        const expected: string = '<script  src="https://assets-cdn.github.com/assets/github.js"></script>';
        expect(githubScriptIntegrityCodeStrippingRule.rewriteContent(context, content)).toEqual(expected);
    });
})
