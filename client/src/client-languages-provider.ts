import * as d3 from 'd3';

import {Language,
        languagesUrl} from '../../common/src/languages';

/**
 * An implementation of LanguagesProvider that works from the client by issuing an AJAX request to the server.
 */
export function clientLanguagesProvider(): Promise<Language[]> {
    return new Promise<Language[]>((resolve: (value: Language[]) => void, reject: (reason?: any) => void) => {
        d3.json(languagesUrl, function onGetLanguagesCompleted(error: any, languages: Language[]): void {
            if (error) {
                reject(error);
            } else {
                resolve(languages);
            }
        });
    });
}
