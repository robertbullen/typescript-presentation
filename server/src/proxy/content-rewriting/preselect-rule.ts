import * as xregexp from 'xregexp';

import {MatchCaptures,
        RegexCaptures,
        RegexRule} from './regex-rule';
import {Context,
        Rule} from   './rule';

export class PreselectRule extends RegexRule {
    public constructor(
        description: string,
        private readonly contentTypes: string | string[],
        captures: RegexCaptures,
        private readonly rule: Rule
    ) {
        super(description, captures)
    }

    public isApplicable(context: Context): boolean {
        return typeof this.contentTypes === 'string'
            ? this.contentTypes === context.contentType
            : this.contentTypes.indexOf(context.contentType) >= 0;
    }

    public rewriteContent(context: Context, content: string): string {
        return xregexp.replace(content, this.regex, (captures: MatchCaptures) => {
            return captures.prefix
                + this.rule.rewriteContent(context, captures.data)
                + captures.suffix;
        });
    }
}
