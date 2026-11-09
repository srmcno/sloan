# Website maintenance

This repository publishes a buildless family archive on GitHub Pages. Keep changes on the existing site and preserve its published research data.

- Family uses navy blue for the header, footer, bottom navigation and interface accents. The two sites share layouts and controls, with separate color palettes.
- The header contains only the site identity and search. Do not add section tabs or a second section-navigation row beneath the search at any viewport width.
- The single bottom navigation bar is visible at all viewport widths. Mobile has Home, Stories, Tree, Photos, Records and Timeline. Desktop adds People and Saved shortcuts. Every item, including Records, has an icon.
- Keep a little breathing room below the header search field.
- Retain comparison sliders, guided journeys, saved/continued reading, relationship paths, unified search, photo details/browsing and expanded/remembered tree views. Preserve stored preferences.
- Website requests do not authorize changing tree.json, data.json, content.json, historical claims or source media. Use existing records for interface features.
- Keep the site buildless, responsive and keyboard usable. Check changed JavaScript syntax, asset paths, and focused browser flows before publication.

## One shared codebase (all three family sites)

`index.html`, `app.js`, `adapter.js`, the `archive-*`, `tree-view`, `timeline`, `explore`, `gallery`, `relationships`, `refine` and `extras` modules, and every CSS file are identical in srmcno/family, srmcno/sloan and srmcno/rachel. Change them in one repo and copy the same files to the other two.
- Site differences live only in `site.js` (title, wording, colors via `data-site`, topics, places, featured stories, hero photos) and in the data files.
- Rachel and Sloan read `content.json` + `tree.json`. Family reads `data.json` + `tree.json` through `adapter.js`, read-only.
- Color schemes: navy (`data-site=family`), slate gray (`data-site=sloan`) and forest green (`data-site=rachel`), defined at the top of `archive.css`.
- Family and Sloan link to each other through `text.otherArchive` in `site.js` (shown in the footer). Rachel is standalone and has no cross-link.
- Sloan also has its own `ancestry.html` page (Ancestry & DNA map) linked through `text.ancestryLink`; the other sites leave that text empty.

## Gallery previews

Photo and record cards load small previews from `img/thumbs/` (same path as the image, `.jpg`). After adding or replacing images, run `python3 make_thumbs.py` (needs Pillow) and commit `img/thumbs/`. A missing preview falls back to the full image, so pages never break.
