// Data source configuration: the only place that names a data release (pattern copied from
// maximromanov/ngramreader@77f305a js/config.js). The classifier reads the same data repository and commit as the
// NgramReader: its own tables under classifier/, shared tables under data_BC/, derived/ and labels/.
export const RELEASES = {
  '2023.1.8': {
    release: '2023.1.8',                                   // OpenITI release
    repo: 'maximromanov/ngramreader-data-2023.1.8',         // GitHub data repository
    commit: '7b082fba49e1d1f1ce0cf115adb657208bb4dfa1',     // pinned data commit, the only commit of the data repository
  },
}
export const DEFAULT_RELEASE = '2023.1.8'

// Local development only: on localhost or a private network address a git-ignored js/config.local.js may point the app at a local data server
// ({ dataBase, commit, ngramreader }; see README, "Development"). On any other host this is never loaded.
export const DEV = /^(localhost|127\.0\.0\.1|192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(location.hostname)
  ? await import('./config.local.js').then(m => m.default).catch(() => null) : null

export const APP = {
  name: 'OpenITI Book Classifier',
  title: 'DHFAIS App{endix} 2: T10 Book Classification, Version 2 (based on OpenITI, Release ver. 2023.1.8)',
  version: '2.1',
  repo: 'maximromanov/classifier',
  ngramreader: 'https://maximromanov.github.io/ngramreader/',
}

// citation of the app: Romanov, Maxim. *title*. Zenodo, released <released>. https://doi.org/<doi>.
export const CITATION = { version: '2', doi: '10.5281/zenodo.23985062', year: 2026, released: 'November 5, 2026', title: 'DHFAIS App{endix} 2: T10 Book Classification, Version 2 (based on OpenITI, Release ver. 2023.1.8)', data: 'OpenITI, release 2023.1.8, https://doi.org/10.5281/zenodo.10007820' }
export const ngramreaderURL = () => DEV?.ngramreader ?? APP.ngramreader
// headers from not yet annotated versions: drawn dashed (true) or left out (false)
export const SHOW_UNCONFIRMED_HEADERS = true

// pinned library versions (loaded from cdn.jsdelivr.net), as in the NgramReader
export const LIBS = {
  hyparquet: 'https://cdn.jsdelivr.net/npm/hyparquet@1.31.2/+esm',
  compressors: 'https://cdn.jsdelivr.net/npm/hyparquet-compressors@1.1.2/+esm',
  plotly: 'https://cdn.jsdelivr.net/npm/plotly.js-dist-min@4.1.1/plotly.min.js',
  fflate: 'https://cdn.jsdelivr.net/npm/fflate@0.7.5/+esm',
  ...DEV?.libs,                                            // the offline package bundles its own copies
}

export const dataBase = rel => DEV?.dataBase ?? `https://raw.githubusercontent.com/${rel.repo}/${rel.commit}/`
export const dataCommit = rel => DEV?.commit ?? rel.commit
