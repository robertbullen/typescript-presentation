import * as remoteResource from '../remote-resource';

export interface Context {
    contentType: string;
    path: string;
    remoteResourceCodec: remoteResource.Codec;
}

abstract class RuleStatic {
    public static applyRules(context: Context, content: string, rules: ReadonlyArray<Rule>): string {
        // Apply rules one at a time, logging their descriptions and whether they changed the content.
        console.group(`Rewriting ${context.path}`);
        for (const rule of rules) {
            const preRewriteContent: string = content;
            const postRewriteContent: string = rule.rewriteContent(context, content);
            content = postRewriteContent;

            const changed: boolean = postRewriteContent !== preRewriteContent;
            console.log(`${rule.description}...${changed ? 'changed' : 'unchanged'}.`);
        }
        console.groupEnd();

        return content;
    }

    public static selectApplicableRules(context: Context, rules: ReadonlyArray<Rule>): Rule[] {
        return rules.filter((rule: Rule) => rule.isApplicable(context));
    }
}

export abstract class Rule extends RuleStatic {
    protected constructor(public readonly description: string) {
        super();
    }

    public abstract isApplicable(context: Context): boolean;

    public abstract rewriteContent(context: Context, content: string): string;
}
