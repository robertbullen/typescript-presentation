import {Context}   from './rule';
import {RegexRule} from './regex-rule';

export class CodeStrippingRule extends RegexRule<string | RegExp> {
    public constructor(
        description: string,
        private readonly contentTypes: string | ReadonlyArray<string>,
        private readonly pathPattern: string | RegExp,
        pattern: string | RegExp,
        private readonly replace: string = ''
    ) {
        super(description, pattern);
    }

    public isApplicable(context: Context): boolean {
        return (typeof this.contentTypes === 'string'
                ? this.contentTypes === context.contentType
                : this.contentTypes.indexOf(context.contentType) >= 0)
            && (typeof this.pathPattern === 'string'
                ? context.path === this.pathPattern
                : this.pathPattern.test(context.path));
    }

    public rewriteContent(_context: Context, content: string): string {
        return content.replace(this.search, this.replace);
    }
}
