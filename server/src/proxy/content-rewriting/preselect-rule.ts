import * as xregexp from 'xregexp';

import {Captures,
        RegexRule} from './regex-rule';
import {Context,
        Rule} from   './rule';

export class PreselectRule extends RegexRule<RegExp> {
    public constructor(
        description: string,
        private readonly contentTypes: string | string[],
        patterns: Captures.Patterns,
        private readonly rule: Rule
    ) {
        super(description, Captures.buildRegex(patterns))
    }

    public isApplicable(context: Context): boolean {
        return typeof this.contentTypes === 'string'
            ? this.contentTypes === context.contentType
            : this.contentTypes.indexOf(context.contentType) >= 0;
    }

    public rewriteContent(context: Context, content: string): string {
        return xregexp.replace(content, this.search, (matches: Captures.Matches) => {
            return matches.prefix
                + this.rule.rewriteContent(context, matches.data)
                + matches.suffix;
        });
    }
}
