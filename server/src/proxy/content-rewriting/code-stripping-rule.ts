import {Context,
        Rule} from './rule';

export class CodeStrippingRule extends Rule {
    public constructor(
        description: string,
        private readonly contentTypes: string | ReadonlyArray<string>,
        private readonly pathPattern: string | RegExp,
        private readonly search: string | RegExp,
        private readonly replace: string = ''
    ) {
        super(description);
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
