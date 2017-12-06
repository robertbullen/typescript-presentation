import * as queryString from 'querystring';

import * as config from '../config';

import {Codec,
        Components} from './remote-resource';

describe(Codec.name, () => {
    const codec = new Codec(config.routeBase, config.refererQueryParam);

    interface TestCase {
        components: Components;
        encodedUrl: string;
    }
    const testCases: ReadonlyArray<TestCase> = Object.freeze([
        {
            components: {
                externalUrl: 'http://example.com/assets/scripts.js',
                refererUrl: 'http://example.com/index.html',
                routeBase: codec.routeBase
            },
            get encodedUrl() { return `${this.components.routeBase}${this.components.externalUrl}?${queryString.stringify({ [codec.refererQueryParam]: this.components.refererUrl })}`; }
        },
        {
            components: {
                externalUrl: 'http://www.foo.bar/baz/?one=1&two=2',
                refererUrl: 'http://abc.def.com/xyz/index.html?alpha=1&beta=2',
                routeBase: codec.routeBase
            },
            get encodedUrl() { return `${this.components.routeBase}${this.components.externalUrl}&${queryString.stringify({ [codec.refererQueryParam]: this.components.refererUrl })}`; }
        },
        {
            components: {
                externalUrl: 'http://once.upon.a.com/',
                refererUrl: '',
                routeBase: codec.routeBase
            },
            get encodedUrl() { return this.components.routeBase + this.components.externalUrl; }
        }
    ] as TestCase[]);

    describe(`#${codec.encode.name}`, () => {
        for (const testCase of testCases) {
            it(`${JSON.stringify(testCase.components)} ➡ ${testCase.encodedUrl}`, () => {
                expect(codec.encode(testCase.components.externalUrl, testCase.components.refererUrl)).toEqual(testCase.encodedUrl);
            });
        }
    });

    describe(`#${codec.decode.name}`, () => {
        for (const testCase of testCases) {
            it(`${testCase.encodedUrl} ➡ ${JSON.stringify(testCase.components)}`, () => {
                expect(codec.decode(testCase.encodedUrl)).toEqual(testCase.components);
            });
        }

        it(`returns null when its argument doesn't start with '${codec.routeBase}'`, () => {
            expect(codec.decode('http://not.an.external.url.com/')).toBeNull();
        })
    });
});
