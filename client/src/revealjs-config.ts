// As stated in the _Dependencies_ section of Reveal.js's documentation at
// <https://github.com/hakimel/reveal.js#dependencies>, Reveal.js uses head.js to dynamically load scripts. And
// head.js must loaded prior to Reveal.js, so SystemJS has been configured to accomplish that.
import 'reveal.js';

// More info https://github.com/hakimel/reveal.js#configuration
Reveal.initialize({
    // Use a 16:9 aspect ratio.
    width: 1600,
    height: 900,
    // margin: 0,

    // Maintain the history in the browser to enable back/forward navigation between slides.
    history: true,

    // Turn off indicators in the lower right of the slide show to give more room for slide content.
    controls: false,
    slideNumber: false,

    dependencies: [
        // Cross-browser shim that fully implements classList - https://github.com/eligrey/classList.js/
        { src: System.resolveSync('reveal.js/lib/js/classList.js'), condition: () => !document.body.classList },

        // Interpret Markdown in <section> elements
        { src: System.resolveSync('reveal.js/plugin/markdown/marked.js'), condition: () => !!document.querySelector('[data-markdown]') },
        { src: System.resolveSync('reveal.js/plugin/markdown/markdown.js'), condition: () => !!document.querySelector('[data-markdown]') },

        // Syntax highlight for <code> elements
        { src: System.resolveSync('reveal.js/plugin/highlight/highlight.js'), async: true, callback: () => window['hljs'].initHighlightingOnLoad() },

        // Zoom in and out with Alt+click
        { src: System.resolveSync('reveal.js/plugin/zoom-js/zoom.js'), async: true },

        // Speaker notes
        // { src: System.resolveSync('reveal.js/plugin/notes/notes.js'), async: true },

        // MathJax
        // { src: System.resolveSync('reveal.js/plugin/math/math.js'), async: true }
    ]
});
