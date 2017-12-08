import * as xregexp from 'xregexp';

declare module 'xregexp' {
    // The public declaration specifies `subs` as an array, but XRegExp's documentation and experience dictates that it
    // accepts an object. Whether it is strictly an object or can be either an object or array is 
    function build(pattern: string, subs: Record<string, string | RegExp>, flags?: string): RegExp;

    // The public declaration returns a boolean, but returning a type assertion is more helpful.
    function isRegExp(value: any): value is RegExp;
}
