import * as url     from 'url';
import * as xregexp from 'xregexp';

import {Captures,
        RegexRule} from './regex-rule';
import {Context}   from './rule';

export class UrlRewritingRule extends RegexRule<RegExp> {
    public constructor(
        description: string,
        private readonly contentTypes: string | ReadonlyArray<string>,
        patterns: Captures.Patterns
    ) {
        super(description, Captures.buildRegex(patterns));
    }

    public isApplicable(context: Context): boolean {
        return typeof this.contentTypes === 'string'
            ? this.contentTypes === context.contentType
            : this.contentTypes.indexOf(context.contentType) >= 0;
    }

    public rewriteContent(context: Context, content: string): string {
        return xregexp.replace(content, this.search, (matches: Captures.Matches) => {
            return matches.prefix
                + UrlRewritingRule.rewriteUrl(context, matches.data)
                + matches.suffix;
        });
    }

    protected static rewriteUrl(context: Context, capturedUrl: string): string {
        return /^(?:https?:)?\/\/$/.test(capturedUrl)
            ? context.remoteResourceCodec.routeBase + (capturedUrl.startsWith('http') ? '' : 'https:') + capturedUrl
            : context.remoteResourceCodec.encode(new url.URL(capturedUrl, context.path).toString());
    }
}
