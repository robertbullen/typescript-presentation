import * as fsep   from 'fs-extra-promise';
import * as path   from 'path';
import * as stream from 'stream';

export interface Rule {
    description: string;
    pathPattern: string | RegExp;
    contentTypes?: string | string[];
    search: RegExp;
    replace: string;
}

export namespace Rule {
    export function selectApplicable(rules: ReadonlyArray<Rule>, path: string, contentType: string): Rule[] {
        return rules.filter((rule: Rule) => {
            // Check whether path satisfies the rule.
            const pathMatch: boolean = rule.pathPattern === '*'
                || (typeof rule.pathPattern === 'string' && path === rule.pathPattern)
                || (rule.pathPattern instanceof RegExp && rule.pathPattern.test(path));
            if (!pathMatch) { return false; }

            // Check whether the contentType satisfies the rule.
            if (rule.contentTypes && contentType) {
                if (typeof rule.contentTypes === 'string') {
                    if (rule.contentTypes !== contentType) { return false; }
                } else {
                    if (rule.contentTypes.indexOf(contentType) < 0) { return false; }
                }
            }

            return true;
        });
    }
}

export class Transform extends stream.Transform {
    private buffer: Buffer | null;

    public constructor(
        private readonly contentPath: string,
        private readonly rules: ReadonlyArray<Rule>,
        private readonly beforeAndAfterDirectoryPath: string = ''
    ) {
        super();
        this._transform;
        this._flush;
    }

    public _transform(chunk: string | Buffer, encoding: string, callback: Function): void {
        chunk = Buffer.isBuffer(chunk) ? chunk : new Buffer(chunk, encoding);
        this.buffer = this.buffer ? Buffer.concat([this.buffer, chunk]) : chunk;
        callback();
    }

    public _flush(callback: Function): void {
        const oldContent: string = this.buffer ? this.buffer.toString() : '';
        let newContent: string = oldContent;

        // Perform the content modifications, one rule at a time, logging whether any changes were made.
        console.group(`Rewriting ${this.contentPath}`);
        for (const rule of this.rules) {
            const preReplaceContent: string = newContent;
            const postReplaceContent: string = newContent.replace(rule.search, rule.replace);
            newContent = postReplaceContent;

            const changed: boolean = postReplaceContent !== preReplaceContent;
            console.log(`${rule.description}...${changed ? 'changed' : 'unchanged'}.`);
        }
        console.groupEnd();

        // Write before and after files if called for and changes were made.
        if (this.beforeAndAfterDirectoryPath && newContent !== oldContent) {
            fsep.mkdirpAsync(this.beforeAndAfterDirectoryPath).then(() => {
                const beforeAndAfterFilePath: string = path.join(this.beforeAndAfterDirectoryPath, path.basename(this.contentPath));
                const beforeFilePath: string = beforeAndAfterFilePath + '.0before';
                const afterFilePath: string = beforeAndAfterFilePath + '.1after';
                fsep.writeFileAsync(beforeFilePath, oldContent);
                fsep.writeFileAsync(afterFilePath, newContent);
            });
        }

        // Commit the changed content to the stream.
        this.push(newContent);
        callback();
    }
}
