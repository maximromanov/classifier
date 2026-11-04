// Data source configuration: the only place that names a data release (pattern copied from
// maximromanov/ngramreader@77f305a js/config.js). The classifier reads the same data repository and commit as the
// NgramReader: its own tables under classifier/, shared tables under data_BC/, derived/ and labels/.
export const RELEASES = {
  '2023.1.8': {
    release: '2023.1.8',                                   // OpenITI release
    repo: 'maximromanov/ngramreader-data-2023.1.8',         // GitHub data repository
    commit: '8c89e50e2a646530f05c33a12055268e864d75d0',     // pinned data commit (adds classifier/)
  },
}
export const DEFAULT_RELEASE = '2023.1.8'

// Local development only: on localhost a git-ignored js/config.local.js may point the app at a local data server
// ({ dataBase, commit, ngramreader }; see README, "Development"). On any other host this is never loaded.
export const DEV = ['localhost', '127.0.0.1'].includes(location.hostname)
  ? await import('./config.local.js').then(m => m.default).catch(() => null) : null

export const APP = {
  name: 'OpenITI Book Classifier',
  title: 'ADHFAIS APP{ENDIX} 2: M10 Book Classification, 2025 (OpenITI, Release ver. 2023.1.8)',
  version: '2.0',
  repo: 'maximromanov/classifier',
  ngramreader: 'https://maximromanov.github.io/ngramreader/',
}

// citation of the app. doi: for now the concept DOI of the Zenodo record; switch to the version DOI at release (README)
export const CITATION = { version: '2.0', doi: '10.5281/zenodo.15663088', year: 2026, title: 'ADHFAIS App{endix} 2: T10 Book Classification', data: 'OpenITI, release 2023.1.8, https://doi.org/10.5281/zenodo.10007820' }
export const ngramreaderURL = () => DEV?.ngramreader ?? APP.ngramreader
// headers from not yet annotated versions: drawn dashed (true) or left out (false)
export const SHOW_UNCONFIRMED_HEADERS = true

// pinned library versions (loaded from cdn.jsdelivr.net), as in the NgramReader
export const LIBS = {
  hyparquet: 'https://cdn.jsdelivr.net/npm/hyparquet@1.31.2/+esm',
  compressors: 'https://cdn.jsdelivr.net/npm/hyparquet-compressors@1.1.2/+esm',
  plotly: 'https://cdn.jsdelivr.net/npm/plotly.js-dist-min@4.1.1/plotly.min.js',
  fflate: 'https://cdn.jsdelivr.net/npm/fflate@0.7.5/+esm',
}

export const dataBase = rel => DEV?.dataBase ?? `https://raw.githubusercontent.com/${rel.repo}/${rel.commit}/`
export const dataCommit = rel => DEV?.commit ?? rel.commit
