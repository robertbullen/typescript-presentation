import * as xregexp from 'xregexp';

import {Rule} from './rule';

export interface Captures<T extends string | RegExp> {
    prefix: T;
    data: T;
    suffix: T;
}

export namespace Captures {
    export type Matches = Captures<string>;
    export type Patterns = Captures<string | RegExp>;
    
    function property(name: keyof Captures<never>): string { return name; }

    export function buildRegex(patterns: Patterns): RegExp {
        return xregexp.build(
            `({{${property('prefix')}}}) ({{${property('data')}}}) ({{${property('suffix')}}})`,
            patterns,
            'gx'
        );
    }
}

export abstract class RegexRule<TSearch extends string | RegExp> extends Rule {
    protected constructor(
        description: string,
        protected readonly search: TSearch
    ) {
        super(description);
    }
}
