# OpenITI Book Classifier (static v1)

**ADHFAIS APP{ENDIX} 2: M10 Book Classification (OpenITI, Release ver. 2023.1.8)** — the book typology of the works in the OpenITI corpus of premodern Arabic texts, in the browser: https://maximromanov.github.io/classifier/

This version runs entirely in the browser: plain HTML, CSS and JavaScript on GitHub Pages, with no server process and no build step. It is a rebuild of the R/Shiny Book Classifier as deployed in 2025 (10-type model M10). For the same book it shows the same numbers as the deployed R app (see *Agreement with the R app*). It is the companion of the [OpenITI NgramReader](https://maximromanov.github.io/ngramreader/), whose tables of books and authors link to the profiles here.

## What it shows

- **Search** over readable titles, author names, Arabic and URIs (case and diacritics ignored).
- **Book profile** (`?book=<bookURI>`): title, author, Arabic, URI and the text in the OpenITI release; the **radar** with three layers (complete text, mean of the rolling windows, types of books within ±50 years); the **rolling type plot** along the text; the **rolling entropy**; **entropy boxplots** across all types and within the book's type over time; the **TF-IDF neighbours** (top 250, with similarity); the **author section** (author radar and the author's books). Section headers (H1/H2/H3) can be drawn on the rolling plots (off by default) and listed in a table.
- **Author profile** (`?author=<authorURI>`): name, Arabic, death date, author radar and books.
- **Downloads:** the data behind every plot and table as TSV (UTF-8, double-quoted fields, doubled quotes), all data of a profile as a zip with a README; plots as SVG or PNG.
- Panels without data (9 books have no rolling windows, 53 are not in the whole-text entropy table) say "No data for this text."

## Data

- **Repository:** [`maximromanov/ngramreader-data-2023.1.8`](https://github.com/maximromanov/ngramreader-data-2023.1.8), shared with the NgramReader, read through `raw.githubusercontent.com` at a pinned commit (`js/config.js`): **`8c89e50e2a646530f05c33a12055268e864d75d0`** (the same commit as the NgramReader).
- **Classifier tables** under `classifier/` (Parquet, sorted by `bookID`, with manifests; one book's rows are read by HTTP range requests): rolling type scores, rolling entropy, TF-IDF neighbours, headers, whole-text entropy. **Shared tables:** `data_BC/` (scores of the complete texts, author scores, type labels, book metadata), `derived/book_links.tsv` (release-pinned text links), `labels/` (readable working labels).
- **Labels:** book titles and author names are working labels, generated with a language model, and may contain errors; the URI is authoritative.

## Agreement with the R app

The data behind every view was compared with the outputs of the deployed R app's own functions (`functions_comps.R`, 2025-06-14) for 14 books and 6 authors, covering small, medium and the largest book, books without rolling windows or whole-text entropy, books with H1/H2/H3 headers, a book with tied top types and a book with all scores equal: no differences (strings and integers exact, numbers within 1e-9 relative). Where the R app shows an error (empty data), this app shows "No data for this text." and, for the radar, the layers that have data.

## Code

- `index.html`, `css/app.css`, `js/main.js` (page, search, profiles, downloads), `js/compute.js` (the R app's computations, function by function), `js/charts.js` (plotly), `js/data.js` (Parquet over the raw route), `js/tables.js`, `js/download.js`, `js/config.js`; `texts/` (the deployed app's texts, rendered from its markdown with `tools/render_texts.R`).
- Copied from the NgramReader ([`maximromanov/ngramreader@77f305a`](https://github.com/maximromanov/ngramreader/tree/77f305a)): `js/tables.js`, `js/download.js`, `css/app.css` (with additions), the data reader in `js/data.js`, the chart download buttons in `js/charts.js`, the logos.
- Libraries from `cdn.jsdelivr.net` at pinned versions: `hyparquet` 1.31.2, `hyparquet-compressors` 1.1.2, `plotly.js-dist-min` 4.1.1, `fflate` 0.7.5.
- Long books: the rolling plots show at most 2,500 points per type (each point the maximum of a bin of windows); the downloads hold every window.

## Citation

Romanov, Maxim. (2025). *ADHFAIS App{endix} 2: T10 Book Classification (based on OpenITI, Release ver. 2023.1.8)* (Version 1) [Software]. Zenodo. https://doi.org/10.5281/zenodo.15663089

## License

The code of this app is released under the MIT License; see [`LICENSE`](LICENSE). The data, in [`ngramreader-data-2023.1.8`](https://github.com/maximromanov/ngramreader-data-2023.1.8), are derived from OpenITI release 2023.1.8 (https://doi.org/10.5281/zenodo.10007820) and are under CC BY-NC-SA 4.0.
