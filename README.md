<p align="center"><img src="static/favicon.svg" width="96" alt=""></p>

# avenir

The Zola theme behind [die-zukunft.ch](https://die-zukunft.ch) (and [the-future.world](https://the-future.world)).

- **Look:** a ceramic ground with charcoal ink, one continuous 3D wireframe Swiss cross behind every page, hex-addressed sections and hairline layouts.
- **Brand:** the "Alpenglühen" gradient (rose `#f43f5e` → magenta `#c026d3` → violet `#6d28d9` → indigo `#4338ca`), defined once as `--brand-*` variables in `sass/_theme.scss`.
- **Features:** pins (readers bookmark sections, stored on their device only), a layered homepage, an addressable manifesto (`manifest.html`), a Vision page built as a stack (`vision.html`), and a colophon that measures page weight live.
- **No build step:** vanilla JS in `templates/base.html`, self-hosted fonts and a strict same-origin CSP.

Brand sources (icon generator, OG and GitHub images) live in [zukunft-ch/assets](https://github.com/zukunft-ch/assets).
