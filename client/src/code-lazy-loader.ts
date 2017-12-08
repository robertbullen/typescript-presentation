import * as d3 from 'd3';
import              'reveal.js';

// Some of the code samples in this presentation are actual code files from the project itself. Rather than copy and
// paste them, they are dynamically downloaded and added to the DOM by this event handler. This code follows
// Reveal.js's convention of looking for `data-src` attributes.
//
// Reveal.js uses the Highlight.js library as a plug-in, which automatically finds <pre><code> blocks and formats them.
// However, by the time Reveal.js gives the ready signal, that auto-detection has already occurred. So the newly added
// code blocks must be forcibly formatted, too.
Reveal.addEventListener('slidechanged', function onSlideChanged(event: SlideEvent): void {
    d3.select(event.currentSlide).selectAll<HTMLElement, void>('pre > code[data-src]').each(
        function visitCodeElement(this: HTMLElement): void {
            // Attempt to get the data-src attribute value.
            const codeElementSelection: d3.Selection<HTMLElement, any, null, undefined> = d3.select(this);
            const codeRemoteUrl: string = codeElementSelection.attr('data-src');
            if (!codeRemoteUrl) { return; }

            // Attempt to download the remote code file as text.
            d3.text(codeRemoteUrl, (error: any, code: string) => {
                if (error) {
                    console.error(error);
                } else {
                    // Insert the remote code file's contents as text under the element.
                    codeElementSelection.text(code);

                    // Rename the attribute to avoid doing this work again if a slide is revisited by the user.
                    codeElementSelection.attr('data-src', null);
                    codeElementSelection.attr('data-src-loaded', codeRemoteUrl);

                    // Highlight.js is loaded asynchronously, so the hljs variable could be undefined at this point.
                    // In fact, when the user (re)loads the presentation on a slide containing lazy-loaded code, it is
                    // nearly certain that hljs will be undefined. In that case, keep deferring the highlighting
                    // invocation until hljs is valid.
                    if ('hljs' in window) {
                        window['hljs'].highlightBlock(this);
                    } else {
                        const intervalHandle: number = window.setInterval(() => {
                            if ('hljs' in window) {
                                window['hljs'].highlightBlock(this);
                                window.clearInterval(intervalHandle);
                            }
                        }, 1000);
                    }
                }
            });
        }
    );
});
