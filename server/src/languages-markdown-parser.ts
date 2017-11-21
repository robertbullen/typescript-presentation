import {Language} from '../../common/src/languages';

export interface Heading {
    level: number;
    text: string;
}

export interface HeadingRecord {
    position: number;
    stack: Heading[];
}

export function extractHeadingRecords(markdown: string): HeadingRecord[] {
    const records: HeadingRecord[] = [];

    // Loop over all headings, saving their position in the markdown string and their hierarchy as a stack.
    const regex = new RegExp(/^(#+)\s(.*)$/gm);
    const stack: Heading[] = [];

    while (true) {
        const match: RegExpExecArray | null = regex.exec(markdown);
        if (!match) { break; }

        const current: Heading = {
            level: match[1].length,
            text: match[2]
        };

        // Pop from the stack any previous headings at the same level or sublevel and push the current one.
        for (let i = stack.length - 1; i >= 0; i--) {
            const previous: Heading = stack[i];
            if (previous.level >= current.level) {
                stack.pop();
            } else {
                break;
            }
        }
        stack.push(current);
        
        // Create the heading index and save it to the array.
        const record: HeadingRecord = {
            position: match.index,
            stack: stack.slice()
        };
        records.push(record);
    }

    return records;
}

export function extractLanguages(markdown: string, records: ReadonlyArray<HeadingRecord>): Language[] {
    // Create a regex pattern that captures language names, URLs, and descriptsions. It is composed from strings, so
    // that it can be broken down into understandable pieces. Unfortunately this requires the double backslash
    // escaping, but that's still easier to understand than one big ugly line.
    const markdownTableCellDelimiterPattern: string = '\\s* \\| \\s*';
    let languagePattern: string = `^${markdownTableCellDelimiterPattern}`  // At the beginning of a line, look for the opening markdown table cell delimiter,
                                + '\\[ ([^\\]]+) \\]'                      // followed by the brackets-delimited title of a markdown link, e.g. [Language Name],
                                + '\\( ([^\\)]+) \\)'                      // followed by the parentheses-delimited url of a markdown link, e.g. (https://language.com/site),
                                + markdownTableCellDelimiterPattern        // followed by another markdown table cell delimiter,
                                + '\\s+ (.*)'                              // followed by a short description of the language,
                                + `${markdownTableCellDelimiterPattern}$`; // followed by a markdown table cell delimiter at the end of the line.

    // Remove the spaces from the pattern, so that they aren't interpreted as literals, and create a RegExp object
    // that can be used to search for all matches in the markdown text (add flags global and multi-line).
    languagePattern = languagePattern.replace(/ /g, '');
    const regex = new RegExp(languagePattern, 'gm');

    // Use a map for temporary storage to deduplicate the results.
    const languages = new Map<string, Language>();
    while (true) {
        const match: RegExpExecArray | null = regex.exec(markdown);
        if (!match) { break; }

        // If the language has already been discovered, then avoid any further work on it and skip to the next one.
        const name: string = match[1].trim();
        if (languages.has(name)) { continue; }

        const url: string = match[2].trim();

        // Some descriptions contain a reference to another occurrence in the list, which can be identified by
        // *[○](...). Strip those parts.
        let description: string = match[3];
        const referenceIndex: number = description.indexOf('*[○](');
        if (referenceIndex >= 0) description = description.substring(0, referenceIndex);
        description = description.trim();

        // Find the closest preceding heading index.
        const record: HeadingRecord | null = findClosestPrecedingHeadingRecord(records, match.index);
        const headingStack: string[] = record ? record.stack.map((heading: Heading) => heading.text) : [];

        // Add the language to the map.
        languages.set(name, {
            description,
            headingStack,
            name,
            url,
        });
    }

    // Return the map's values as an array.
    return Array.from(languages.values());
}

export function parseMarkdown(markdown: string): Language[] {
    // Strip off the tools for compiler writers at the end of the file. Those don't count as transpiled languages.
    const index: number = markdown.indexOf('### Tools for Compiler Writers');
    if (index >= 0) {
        markdown = markdown.substring(0, index);
    }

    // Build an index of headings.
    const records: HeadingRecord[] = extractHeadingRecords(markdown);

    // Build an array of languages.
    const languages: Language[] = extractLanguages(markdown, records);

    return languages;
}

function findClosestPrecedingHeadingRecord(records: ReadonlyArray<HeadingRecord>, position: number): HeadingRecord | null {
    const precedingOrderedRecords: HeadingRecord[] = records
        .filter((record: HeadingRecord) => record.position < position)
        .sort((left: HeadingRecord, right: HeadingRecord) => left.position - right.position)
    return precedingOrderedRecords.length && precedingOrderedRecords[precedingOrderedRecords.length - 1] || null;
}
