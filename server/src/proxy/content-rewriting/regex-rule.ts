import * as xregexp from 'xregexp';

import {Rule} from './rule';

interface Captures<T> {
    prefix: T;
    data: T;
    suffix: T;
}
export type RegexCaptures = Captures<string | RegExp>;
export type MatchCaptures = Captures<string>;

function propertyOf<T>(propertyName: keyof T): string { return propertyName; }

export abstract class RegexRule extends Rule {
    protected regex: RegExp;

    protected constructor(
        description: string,
        captures: RegexCaptures
    ) {
        super(description);
        this.regex = xregexp.build(`
            ({{${propertyOf<Captures<never>>('prefix')}}})
            ({{${propertyOf<Captures<never>>('data')}}})
            ({{${propertyOf<Captures<never>>('suffix')}}})`,
            captures,
            'gx'
        );
    }
}
