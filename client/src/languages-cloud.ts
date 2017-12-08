import * as d3      from 'd3';
import * as d3Cloud from 'd3-cloud';
import                   'reveal.js';

import {Language,
        LanguagesProvider,
        mockLanguagesProvider} from '../../common/src/languages';

import {clientLanguagesProvider} from './client-languages-provider';

// Choose one of the two LanguageProvider implementations.
/*const languagesProvider: LanguagesProvider = */ mockLanguagesProvider;
const languagesProvider: LanguagesProvider = clientLanguagesProvider;

/**
 * Wraps an instance of Language with an implementation of d3Cloud.Word.
 */
class LanguageComponent implements d3Cloud.Word {
    public constructor(public readonly language: Language) { }

    public font?: string;
    public rotate?: number;
    public size?: number;
    public get text(): string { return this.language.name; };
    public x?: number;
    public y?: number;
}

/**
 * A set of DOM elements that renders 
 */
export class LanguagesCloudComponent {
    private readonly spanSelection: d3.Selection<HTMLSpanElement, void, null, undefined>;
    private readonly svgSelection: d3.Selection<SVGSVGElement, void, null, undefined>;

    private readonly layoutColors: d3.ScaleOrdinal<number, string>;
    private readonly layoutEngine: d3Cloud.Cloud<LanguageComponent>;
    
    private languages: Language[] = [];

    public constructor(parentElement: HTMLElement) {
        const parentSelection: d3.Selection<HTMLElement, void, null, undefined> = d3.select<HTMLElement, void>(parentElement);

        // Append an <svg> child to the parent element.
        this.svgSelection = parentSelection
            .append<SVGSVGElement>('svg')
                .attr('xmlns', 'http://www.w3.org/2000/svg')
                .attr('xmlns:xlink', 'http://www.w3.org/1999/xlink')
                .attr('version', '1.1');

        // Append a footer consisting of a status <span> and a rearrange <button>.
        const footerSelection: d3.Selection<HTMLDivElement, void, null, undefined> = parentSelection
            .append<HTMLDivElement>('div')
                .attr('class', 'footer');

        this.spanSelection = footerSelection
            .append<HTMLSpanElement>('span');

        footerSelection
            .append<HTMLButtonElement>('button')
                .text('Rearrange')
                .on('click', () => this.setWords(this.languages));

        // Initialize the cloud layout engine and its dependencies.
        this.layoutColors = d3.scaleOrdinal<number, string>(d3.schemeCategory20c);
        this.layoutEngine = d3Cloud<LanguageComponent>()
            .font('Source Sans Pro')
            .fontSize(24)
            .padding(2)
            .rotate(() => ~~(Math.random() * 2) * 90)
            .on('end', this.onLayoutEnd.bind(this));
    }

    public setWords(languages: Language[]): void {
        // An easy way to remove all the old components (if there are any) is to remove their <g> container element.
        this.svgSelection.select<SVGGElement>('g').remove();

        // Get the SVG element's size.
        const width: number = this.svgSelection.property('clientWidth');
        const height: number = this.svgSelection.property('clientHeight');

        // Create a new <g> container element and set it's transform such that the coordinates (0, 0) are at its center
        // instead of its corner.
        this.svgSelection
            .append<SVGGElement>('g')
            .attr('transform', `translate(${width / 2.0}, ${height / 2.0})`);

        // Start the cloud layout engine.
        this.languages = languages;
        const components: LanguageComponent[] = this.languages.map((language: Language) => new LanguageComponent(language));
        this.layoutEngine
            .size([width, height])
            .words(components)
            .start();
    }

    private onLayoutEnd(
        this: LanguagesCloudComponent,
        components: LanguageComponent[],
        _bounds?: [{ x0: number, y0: number }, { x1: number, y1: number }]
    ): void {
        const animationParams = {
            initialFontSizeScale: 0.001,
            delayMilliseconds: 50,
            durationMilliseconds: 750
        };

        const update: d3.Selection<null, LanguageComponent, SVGGElement, void> = this.svgSelection
            .select<SVGGElement>('g')
            .selectAll()
            .data(components);
        update.enter()
            .append<HTMLAnchorElement>('a')
                .attr('xlink:href', (component: LanguageComponent) => component.language.url)
                .attr('target', '_blank')
            .append<SVGTextElement>('text')
                .attr('text-anchor', 'middle')
                .attr('transform', (component: LanguageComponent) => `rotate(${component.rotate}, ${component.x}, ${component.y})`)
                .attr('x', (component: LanguageComponent) => component.x || null)
                .attr('y', (component: LanguageComponent) => component.y || null)
                .style('fill', (_component: LanguageComponent, index: number) => this.layoutColors(index))
                .style('font-family', (component: LanguageComponent) => component.font || null)
                .style('font-size', (component: LanguageComponent) => `${(component.size || 1) * animationParams.initialFontSizeScale}px`)
                .text((component: LanguageComponent) => component.text)
                .transition()
                    .delay((_component: LanguageComponent, index: number) => index * animationParams.delayMilliseconds)
                    .duration(animationParams.durationMilliseconds)
                    .ease(d3.easeBackOut.overshoot(8.0))
                    .style('font-size', (component: LanguageComponent) => `${component.size!}px`)
                    .on('start', (_component: LanguageComponent, index: number) => {
                        this.spanSelection.text(`Showing ${index + 1} of ${this.languages.length}`);
                    });
    }
}

interface LanguagesCloudSlide extends Element {
    languagesCloud?: LanguagesCloudComponent | null;
}

Reveal.addEventListener('slidechanged', function onSlideChanged(event: SlideEvent): void {
    if (!event.currentSlide) { return; }

    // Skip the slide if it has already been processed.
    const slide: LanguagesCloudSlide = event.currentSlide;
    if (slide.languagesCloud !== undefined) { return; }

    // Initialize the slide's languagesCloud property assuming that it won't contain one.
    slide.languagesCloud = null;
    const slideSelection: d3.Selection<LanguagesCloudSlide, any, null, undefined> = d3.select(slide);

    // Append a language cloud to the first element that includes the special class designator.
    slideSelection.select<HTMLElement>('languages-cloud').each(
        async function visitWordCloudParentElement(this: HTMLElement): Promise<void> {
            // Create and attach the word cloud to the slide.
            const parentElement: HTMLElement = this;
            const languagesCloud = new LanguagesCloudComponent(parentElement);
            slide.languagesCloud = languagesCloud;

            // Initiate the request for languages immediately.
            const startTimestamp: Date = new Date();
            const languages: Language[] = await languagesProvider();
            const finishTimestamp: Date = new Date();

            // Determine how long until the slide has fully transitioned into view.
            let waitMilliseconds: number = 0;
            if (event.previousSlide) {
                // The transitions timings are defined in Reveal.js's CSS classes.
                let transitionMilliseconds: number = 800;
                switch (Reveal.getConfig().transitionSpeed) {
                    case 'slow':
                        transitionMilliseconds = 1200;
                        break;
                    case 'fast':
                        transitionMilliseconds = 400;
                        break;
                }

                const elapsedMilliseconds: number = finishTimestamp.getTime() - startTimestamp.getTime();
                waitMilliseconds = Math.max(0, transitionMilliseconds - elapsedMilliseconds);
            }

            // Once the slide has fully transitioned into view, populate the word cloud. This is done so that the
            // word cloud's animation can be appreciated in its entirety.
            setTimeout(() => languagesCloud.setWords(languages), waitMilliseconds);
        }
    );
});
