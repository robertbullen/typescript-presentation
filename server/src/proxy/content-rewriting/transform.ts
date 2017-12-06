import * as fsep   from 'fs-extra-promise';
import * as path   from 'path';
import * as stream from 'stream';

import {Context,
        Rule} from './rule';

export class Transform extends stream.Transform {
    private buffer: Buffer | null;

    public constructor(
        private readonly context: Context,
        private readonly rules: ReadonlyArray<Rule>,
        private readonly rewritesDirectoryPath: string = ''
    ) {
        super();
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
        console.group(`Rewriting ${this.context.path}`);
        for (const rule of this.rules) {
            const preRewriteContent: string = newContent;
            const postRewriteContent: string = rule.rewriteContent(this.context, preRewriteContent);
            newContent = postRewriteContent;

            const changed: boolean = postRewriteContent !== preRewriteContent;
            console.log(`${rule.description}...${changed ? 'changed' : 'unchanged'}.`);
        }
        console.groupEnd();

        // Write before and after files if called for and changes were made.
        if (this.rewritesDirectoryPath) {
            fsep.mkdirpAsync(this.rewritesDirectoryPath).then(async () => {
                try {
                    const rewritesFilePath: string = path.join(this.rewritesDirectoryPath, this.context.path.replace(/[:/.]+/g, '_').replace(/\?.*$/, ''));
                    const beforeFilePath: string = rewritesFilePath + '.0.txt';
                    const afterFilePath: string = rewritesFilePath + '.1.txt';

                    let beforeFileContent: string = oldContent;
                    let afterFileContent: string = newContent;
                    const newlineIndex: number = beforeFileContent.indexOf('\n');
                    if (newlineIndex < 0 || newlineIndex > 1000) {
                        beforeFileContent = beforeFileContent.replace(/;/g, ';\n');
                        afterFileContent = afterFileContent.replace(/;/g, ';\n');
                    }
                    await Promise.all([
                        fsep.writeFileAsync(beforeFilePath, beforeFileContent),
                        fsep.writeFileAsync(afterFilePath, afterFileContent)
                    ]);
                } catch (error) {
                    console.error(error);
                }
            });
        }

        // Commit the changed content to the stream.
        this.push(newContent);
        callback();
    }
}
