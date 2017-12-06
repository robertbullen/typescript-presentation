import * as xregexp from 'xregexp';
import * as url     from 'url';

import {MatchCaptures,
        RegexCaptures,
        RegexRule} from './regex-rule';
import {Context}   from './rule';

export class UrlRewritingRule extends RegexRule {
    public constructor(
        description: string,
        private readonly contentTypes: string | ReadonlyArray<string>,
        captures: RegexCaptures
    ) {
        super(description, captures);
    }

    public isApplicable(context: Context): boolean {
        return typeof this.contentTypes === 'string'
            ? this.contentTypes === context.contentType
            : this.contentTypes.indexOf(context.contentType) >= 0;
    }

    public rewriteContent(context: Context, content: string): string {
        return xregexp.replace(content, this.regex, (captures: MatchCaptures) => {
            return captures.prefix
                + UrlRewritingRule.rewriteUrl(context, captures.data)
                + captures.suffix;
        });
    }

    protected static rewriteUrl(context: Context, capturedUrl: string): string {
        return /^(?:https?:)?\/\/$/.test(capturedUrl)
            ? context.remoteResourceCodec.routeBase + (capturedUrl.startsWith('http') ? '' : 'https:') + capturedUrl
            : context.remoteResourceCodec.encode(new url.URL(capturedUrl, context.path).toString());
    }
}
