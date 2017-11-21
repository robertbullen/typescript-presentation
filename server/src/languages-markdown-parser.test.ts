import * as fs   from 'fs';
import * as path from 'path';

import {Language} from '../../common/src/languages';

import {extractHeadingRecords,
        extractLanguages,
        HeadingRecord,
        parseMarkdown} from './languages-markdown-parser';

const fileName: string = __filename.substring(__filename.lastIndexOf('.'));
describe(fileName, () => {
    let markdown: string = '';
    beforeAll(() => {
        const markdownFilePath: string = path.join(process.cwd(), 'src/list-of-languages.test.md');
        markdown = fs.readFileSync(markdownFilePath, 'utf8');
    });

    it(`${extractHeadingRecords.name} results match the snapshot`, () => {
        const records: HeadingRecord[] = extractHeadingRecords(markdown);
        expect(records).toMatchSnapshot();
    });

    it(`${extractLanguages.name} results do not contain duplicates`, () => {
        const records: HeadingRecord[] = extractHeadingRecords(markdown);
        const languages: Language[] = extractLanguages(markdown, records);
        for (let i = 0; i < languages.length; i++) {
            for (let j = i + 1; j < languages.length; j++) {
                expect(languages[i].name).not.toEqual(languages[j].name);
            }
        }
    });

    it(`${extractLanguages.name} results match the snapshot`, () => {
        const records: HeadingRecord[] = extractHeadingRecords(markdown);
        const languages: Language[] = extractLanguages(markdown, records);
        expect(languages).toMatchSnapshot();
    });

    it(`${parseMarkdown.name} results match the snapshot`, () => {
        const languages: Language[] = parseMarkdown(markdown);
        expect(languages).toMatchSnapshot();
    });
});
