// Publically available typings for D3-Cloud are found at @types/d3.cloud.layout, but they are designed to augment the
// d3 v3.x module, which contains a `layout` namespace. d3 v4.x does not declare such a namespace, and because module
// augmentation is not allowed to add new namespaces, the augmentation attempt fails.
//
// These declarations are a workaround. The @types/d3.cloud.layout contents are pasted into a module-free and
// namespace-free declaration instead.

declare module 'd3-cloud' {
    function cloud(): cloud.Cloud<cloud.Word>;
    function cloud<T extends cloud.Word>(): cloud.Cloud<T>;

    namespace cloud {
        export interface Word {
            text?: string;
            font?: string;
            style?: string;
            weight?: string | number;
            rotate?: number;
            size?: number;
            padding?: number;
            x?: number;
            y?: number;
        }

        export interface Cloud<T extends Word> {
            start(): Cloud<T>;
            stop(): Cloud<T>;

            timeInterval(): number;
            timeInterval(interval: number): Cloud<T>;

            words(): T[];
            words(words: T[]): Cloud<T>;

            size(): [number, number];
            size(size: [number, number]): Cloud<T>;

            font(): (datum: T, index: number) => string;
            font(font: string): Cloud<T>;
            font(font: (datum: T, index: number) => string): Cloud<T>;

            fontStyle(): (datum: T, index: number) => string;
            fontStyle(style: string): Cloud<T>;
            fontStyle(style: (datum: T, index: number) => string): Cloud<T>;

            fontWeight(): (datum: T, index: number) => string | number;
            fontWeight(weight: string | number): Cloud<T>;
            fontWeight(weight: (datum: T, index: number) => string | number): Cloud<T>;

            rotate(): (datum: T, index: number) => number;
            rotate(rotate: number): Cloud<T>;
            rotate(rotate: (datum: T, index: number) => number): Cloud<T>;

            text(): (datum: T, index: number) => string;
            text(text: string): Cloud<T>;
            text(text: (datum: T, index: number) => string): Cloud<T>;

            spiral(): (size: number) => (t: number) => [number, number];
            spiral(name: string): Cloud<T>;
            spiral(spiral: (size: number) => (t: number) => [number, number]): Cloud<T>;

            fontSize(): (datum: T, index: number) => number;
            fontSize(size: number): Cloud<T>;
            fontSize(size: (datum: T, index: number) => number): Cloud<T>;

            padding(): (datum: T, index: number) => number;
            padding(padding: number): Cloud<T>;
            padding(padding: (datum: T, index: number) => number): Cloud<T>;

            on(type: "word", listener: (word: T) => void): Cloud<T>;
            on(type: "end", listener: (tags: T[], bounds: { x: number; y: number }[]) => void): Cloud<T>;
            on(type: string, listener: (...args: any[]) => void): Cloud<T>;

            on(type: "word"): (word: T) => void;
            on(type: "end"): (tags: T[], bounds: { x: number; y: number }[]) => void;
            on(type: string): (...args: any[]) => void;
        }
    }

    export = cloud;
}
