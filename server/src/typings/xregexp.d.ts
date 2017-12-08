import * as xregexp from 'xregexp';

declare module 'xregexp' {
    function build(pattern: string, subs: object, flags?: string): RegExp;
    function isRegExp(value: any): value is RegExp;
}
