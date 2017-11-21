import * as express from 'express';

import {Language} from '../../common/src/languages';

import {parseMarkdown} from './languages-markdown-parser';

export type LanguagesMarkdownProvider = () => Promise<string>;

export class LanguagesService {
    private cachedMarkdown: string = '';
    private cachedLanguages: Language[] = [];

    public constructor(
        private readonly getLanguagesMarkdown: LanguagesMarkdownProvider,
        private readonly route: string
    ) { }

    public registerMiddleware(application: express.Application): express.Application {
        return application.get(this.route, this.createMiddleware());
    }

    private createMiddleware(): express.RequestHandler {
        return async (_req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> => {
            try {
                const markdown: string = await this.getLanguagesMarkdown();
                if (markdown !== this.cachedMarkdown) {
                    this.cachedMarkdown = markdown;
                    this.cachedLanguages = parseMarkdown(markdown);
                }
                res.status(200).json(this.cachedLanguages);
            } catch (error) {
                next(error);
            }
        }
    }
}
