export const languagesUrl: string = '/languages';

export interface Language {
    headingStack: string[];
    description: string;
    name: string;
    url: string;
}

/*
export namespace Language {
    export function generateStackText(language: Language): string {
        return language.headingStack.reduce((previous: string, current: string) => `${previous} / ${current}`);
    }
}
*/

export type LanguagesProvider = () => Promise<Language[]>;

export function mockLanguagesProvider(): Promise<Language[]> {
    return Promise.resolve([
        {
            headingStack: ['1', '2', '3'],
            description: 'A deer, a female deer.',
            name: 'Do',
            url: 'http://do-lang.org'
        },
        {
            headingStack: ['A', 'B', 'C'],
            description: 'A drop of golden sun.',
            name: 'Re',
            url: 'http://re-lang.org'
        },
        {
            headingStack: ['Alpha', 'Bravo', 'Charlie'],
            description: 'A name I call myself',
            name: 'Mi',
            url: 'http://mi-lang.org'
        },
        {
            headingStack: ['Alpha', 'Beta', 'Gamma'],
            description: 'a long, long way to run.',
            name: 'Fa',
            url: 'http://fa-lang.org'
        }
    ]);
}
