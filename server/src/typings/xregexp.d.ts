import * as xregexp from 'xregexp';

declare module 'xregexp' {
    // The public declaration specifies `subs` as an array, but XRegExp's documentation stipulates that it is an object
    // whose property values are strings or regular expression objects, so this overload is more accurate.
    function build(pattern: string, subs: Record<string, string | RegExp>, flags?: string): RegExp;

    // The public declaration returns a boolean, but returning a type assertion is more helpful.
    function isRegExp(value: any): value is RegExp;
}
