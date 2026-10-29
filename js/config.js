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

export const APP = {
  name: 'OpenITI Book Classifier',
  title: 'ADHFAIS APP{ENDIX} 2: M10 Book Classification, 2025 (OpenITI, Release ver. 2023.1.8)',
  version: 'static v1',
  repo: 'maximromanov/classifier',
  ngramreader: 'https://maximromanov.github.io/ngramreader/',
}

// pinned library versions (loaded from cdn.jsdelivr.net), as in the NgramReader
export const LIBS = {
  hyparquet: 'https://cdn.jsdelivr.net/npm/hyparquet@1.31.2/+esm',
  compressors: 'https://cdn.jsdelivr.net/npm/hyparquet-compressors@1.1.2/+esm',
  plotly: 'https://cdn.jsdelivr.net/npm/plotly.js-dist-min@4.1.1/plotly.min.js',
  fflate: 'https://cdn.jsdelivr.net/npm/fflate@0.7.5/+esm',
}

export const dataBase = rel => `https://raw.githubusercontent.com/${rel.repo}/${rel.commit}/`
