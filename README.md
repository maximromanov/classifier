# OpenITI Book Classifier (2.0)

**DHFAIS App{endix} 2: T10 Book Classification, Version 2 (based on OpenITI, Release ver. 2023.1.8)** — the book typology of the works in the OpenITI corpus of premodern Arabic texts, in the browser: https://maximromanov.github.io/classifier/

This version runs entirely in the browser: plain HTML, CSS and JavaScript on GitHub Pages, with no server process and no build step. It is a rebuild of the R/Shiny Book Classifier as deployed in 2025 (10-type model T10). For the same book it shows the same numbers as the deployed R app (see *Agreement with the R app*). It is the companion of the [OpenITI NgramReader](https://maximromanov.github.io/ngramreader/), whose tables of books and authors link to the profiles here.

## What it shows

- **Search** over readable titles, author names, Arabic and URIs (case and diacritics ignored). *⌨ Arabic* beside the search box opens an Arabic keyboard.
- **Book profile** (`?book=<bookURI>`), with tabs: **Overview** (radar with three layers: complete text, mean of the rolling windows, types of books within ±50 years; top types); **Through the text** (rolling type scores and, below them, rolling entropy, as two aligned figures, with section headers H1 and H2: H1 on by default; solid lines for annotated versions, dashed for others; collapsed headers table); **Entropy compared** (boxplots across all types and within the book's type over time); **Similar books** (TF-IDF neighbours, top 250, with similarity); **Author** (author radar and books).
- **Author profile** (`?author=<authorURI>`), with tabs **Overview** (name, Arabic, death date, author radar) and **Books**.
- **Top bar:** what the page shows, with *Cite these results* (Chicago, APA, BibTeX, RIS), *Copy link* and *Download all*. The active tab and header choices are in the link (`#2…`).
- **Downloads:** the data behind every plot and table as TSV (UTF-8, double-quoted fields, doubled quotes), all data of a profile as a zip with a README; plots as SVG or PNG, in three sizes (Slide 1600 × 900, Paper about 1000 px wide, As on screen), with their caption inside the image.
- Panels without data (9 books have no rolling windows, 53 are not in the whole-text entropy table) say "No data for this text."

## Data

- **Repository:** [`maximromanov/ngramreader-data-2023.1.8`](https://github.com/maximromanov/ngramreader-data-2023.1.8), shared with the NgramReader, read through `raw.githubusercontent.com` at a pinned commit (`js/config.js`): **`7b082fba49e1d1f1ce0cf115adb657208bb4dfa1`** (the same commit as the NgramReader).
- **Classifier tables** under `classifier/` (Parquet, sorted by `bookID`, with manifests; one book's rows are read by HTTP range requests): rolling type scores, rolling entropy, TF-IDF neighbours, headers, whole-text entropy. **Shared tables:** `data_BC/` (scores of the complete texts, author scores, type labels, book metadata), `derived/book_links.tsv` (release-pinned text links), `labels/` (readable working labels).
- **Labels:** book titles and author names are working labels, generated with a language model, and may contain errors; the URI is authoritative.

## Agreement with the R app

The data behind every view was compared with the outputs of the deployed R app's own functions (`functions_comps.R`, 2025-06-14) for 14 books and 6 authors, covering small, medium and the largest book, books without rolling windows or whole-text entropy, books with H1/H2/H3 headers, a book with tied top types and a book with all scores equal: no differences (strings and integers exact, numbers within 1e-9 relative). Where the R app shows an error (empty data), this app shows "No data for this text." and, for the radar, the layers that have data.

## Code

- `index.html`, `css/app.css`, `js/main.js` (page, search, profiles, downloads), `js/compute.js` (the R app's computations, function by function), `js/charts.js` (plotly), `js/chartkit.js`, `js/ui.js`, `js/share.js`, `js/cite.js` (shared with the NgramReader, same files in both repositories), `js/data.js` (Parquet over the raw route), `js/tables.js`, `js/download.js`, `js/config.js`; `texts/` (the deployed app's texts, rendered from its markdown with `tools/render_texts.R`).
- Copied from the NgramReader ([`maximromanov/ngramreader@77f305a`](https://github.com/maximromanov/ngramreader/tree/77f305a)): `js/tables.js`, `js/download.js`, `css/app.css` (with additions), the data reader in `js/data.js`, the chart download buttons in `js/charts.js`, the logos.
- Libraries from `cdn.jsdelivr.net` at pinned versions: `hyparquet` 1.31.2, `hyparquet-compressors` 1.1.2, `plotly.js-dist-min` 4.1.1, `fflate` 0.7.5.
- Long books: the rolling plots show at most 2,500 points per type (each point the maximum of a bin of windows); the downloads hold every window.

## Look and fonts

All text, in the interface and the charts, is `Brill`, with `Noto Serif` as the fallback: no web font exists for Brill, so machines without it show Noto Serif. Arabic is Amiri (Google Fonts). In exported images the text uses the fonts installed on the machine.

## Guided tours

Tours are data: `tours/tours.json`. Editing or adding a tour needs no change to the code. The tours open from the button on the start page and in Help (`data-tour="<id>"`), or by a link: `?tour=<id>&stop=<n>`.

```json
{ "tours": [ { "id": "…", "title": "…", "stops": [
  { "title": "…", "text": "First paragraph.\nSecond paragraph.", "state": { … }, "continue": { "label": "…", "app": "classifier", "tour": "…" } }
] } ] }
```

- `text`, `title`: `*…*` is italics, `` `…` `` is code, `\n` starts a new paragraph. In JSON a backslash is written twice (`\\w*`).
- `continue` (optional): a link to a tour of the other app, opened in a new tab.
- `highlight` (optional): a CSS selector, or a list of them with the main one first; these elements get a blinking frame while the stop is open, e.g. `"#lines .line input"`. Removing it removes the frame.
- `state`: the view the stop opens, through the same code as a link. `panel` is `"open"` or `"closed"`.
- `state` keys: `q` text typed into the search box, `book` or `author` (URI; without either, the start page), `t` tab (`overview`, `text`, `entropy`, `similar`, `author`; for an author `a-overview`, `a-books`), `h` header levels on (`""`, `"1"`, `"2"`, `"12"`), `v: "radar"` classic radar on the book overview, `a` author chart (`"books"`, `"radar"`), `list: 1` opens the table of headers filtered to that level (tour stops only). Keys left out take the default.

## Changes

See [`CHANGES.md`](CHANGES.md), also shown in the app as *What's new* (`changes.html`).

## Development

Run both apps and the local data copy from one server (Node, nothing to install; it supports HTTP Range requests):

```
cd /Users/romanov/MGR_PROJECTS/research/OPENITI_NGRAMREADER_2026
node apps/classifier/tools/dev_server.mjs 8001
```

Then open http://localhost:8001/classifier/. The git-ignored `js/config.local.js` points the app at the local data; it is loaded only on localhost, and without it the app reads the pinned commit from GitHub:

```js
export default { dataBase: 'http://localhost:8001/data/', commit: '<local data commit>', ngramreader: 'http://localhost:8001/ngramreader/' }
```

## Releasing a new version

1. On Zenodo, reserve the DOI of the new version.
2. In `js/config.js`, set `CITATION.doi`, `CITATION.released`, `CITATION.title` and `CITATION.year` as needed, and the same in `CITATION.cff`.
3. Move the pinned data commit in `js/config.js` if the data changed (same commit as the NgramReader).

## Citation

Romanov, Maxim. *DHFAIS App{endix} 2: T10 Book Classification, Version 2 (based on OpenITI, Release ver. 2023.1.8)*. Zenodo, released November 5, 2026. https://doi.org/10.5281/zenodo.23985062.

The Arabic keyboard and regex editor are adapted, with permission, from Peter Verkinderen's [Arabic Virtual Keyboard](https://github.com/pverkind/arabicVirtualKeyboard), itself based on Ahmad Ismail's [Arabic keyboard](http://www.arabic-keyboard.org/).

## License

Cover image © Brill; not covered by this repository's licenses.

The files in [`vendor/arabicVirtualKeyboard/`](vendor/arabicVirtualKeyboard/) keep their origin: they are Peter Verkinderen's Arabic Virtual Keyboard (itself based on Ahmad Ismail's Arabic keyboard), adapted with his permission; see [`ORIGIN.md`](vendor/arabicVirtualKeyboard/ORIGIN.md) there. The original repository has no license file, so these files are not covered by this repository's MIT License; they are used with the author's permission.

The code of this app is released under the MIT License; see [`LICENSE`](LICENSE). The data, in [`ngramreader-data-2023.1.8`](https://github.com/maximromanov/ngramreader-data-2023.1.8), are derived from OpenITI release 2023.1.8 (https://doi.org/10.5281/zenodo.10007820) and are under CC BY-NC-SA 4.0.
