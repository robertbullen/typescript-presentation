import * as url from 'url';

export interface Components {
    externalUrl: string;
    refererUrl: string;
    routeBase: string;
}

export class Codec {
    public constructor(
        public readonly routeBase: string,
        public readonly refererQueryParam: string
    ) { }

    /**
     * Combines `this.routeBase`, `externalUrl`, and optionally `refererUrl` into a single URL.
     */
    public encode(externalUrl: string, refererUrl: string = ''): string {
        const encodedParsedUrl = new url.URL(externalUrl);
        if (refererUrl) {
            encodedParsedUrl.searchParams.append(this.refererQueryParam, refererUrl);
        }
        return this.routeBase + encodedParsedUrl.toString();
    }

    /**
     * Decodes this given `encodedUrl` argument into its individual components. Returns `null` if `encodedUrl` doesn't
     * start with `this.routeBase`.
     */
    public decode(encodedUrl: string): Components | null {
        if (!encodedUrl.startsWith(this.routeBase)) { return null; }

        const encodedParsedUrl = new url.URL(encodedUrl.substring(this.routeBase.length));
        const refererUrl: string = encodedParsedUrl.searchParams.get(this.refererQueryParam) || '';
        encodedParsedUrl.searchParams.delete(this.refererQueryParam);
        
        const components: Components = {
            externalUrl: encodedParsedUrl.toString(),
            refererUrl,
            routeBase: this.routeBase
        };
        return components;
    }
}
