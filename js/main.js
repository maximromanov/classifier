// OpenITI Book Classifier, static v1 — page controller: start page with search, book profile (?book=<bookURI>),
// author profile (?author=<authorURI>).
import { APP, RELEASES, DEFAULT_RELEASE, dataBase } from './config.js'
import { loadStatic, readByKey } from './data.js'
import { prepare, radarBook, rollingSeries, entropyAcrossTypes, entropyTypeTime, tfidfTable, radarAuthor, authorBooksTable, headersTable, authorOfURI, TYPES } from './compute.js'
import { radarBookChart, radarAuthorChart, rollingChart, entropyLineChart, boxTypesChart, boxTypeTimeChart, headerShapes, loadPlotly } from './charts.js'
import { renderTable, esc, fold } from './tables.js'
import { toTSV, saveText, saveBlob, zipFiles, stamp } from './download.js'

const $ = s => document.querySelector(s)
const NO_DATA = 'No data for this text.'
const UNCERTAIN = 'Label uncertain; see URI.'
const S = { release: RELEASES[DEFAULT_RELEASE], appCommit: null, P: null, view: null, timing: null, busy: false, index: null }
window.__cls = S                                     // exposed for automated tests

// ---- labels (same rendering as the NgramReader) ----------------------------------------------------------------
const italics = s => esc(s).replace(/\*([^*]+)\*/g, '<i>$1</i>')
const bookLabel = uri => S.P.labels.books.get(uri)
const authorLabel = a => S.P.labels.authors.get(a)
const bookTitleHTML = uri => { const l = bookLabel(uri); return l ? italics(l.label) + (l.ambiguous === '1' ? `<sup class="uncertain" title="${UNCERTAIN}">?</sup>` : '') : esc(uri) }
const bookTitleText = uri => bookLabel(uri)?.label ?? uri
const authorNameText = a => authorLabel(a)?.authorName ?? a
const ar = s => s ? `<span dir="rtl" lang="ar" class="ar">${esc(s)}</span>` : ''
const bookHref = uri => `?book=${encodeURIComponent(uri)}`
const authorHref = a => `?author=${encodeURIComponent(a)}`
const bookLink = uri => `<a href="${bookHref(uri)}" data-nav>${bookTitleHTML(uri)}</a>`

// ---- status ----------------------------------------------------------------------------------------------------
const status = t => { const s = $('#status'); s.hidden = !t; s.textContent = t ?? '' }
function fail(e) { console.warn(e); $('#messages').innerHTML = `<div class="msg error">${esc(String(e && e.message || e))}</div>` }

// ---- search over books and authors ------------------------------------------------------------------------------
function buildIndex() {
  const P = S.P, items = []
  for (const uri of P.idOf.keys()) { const l = bookLabel(uri); items.push({ kind: 'book', key: uri, text: fold([l?.label, l?.titleAR, l?.authorAR, uri, authorNameText(authorOfURI(uri))].join(' ')) }) }
  for (const a of P.authorBooks.keys()) { const l = authorLabel(a); items.push({ kind: 'author', key: a, text: fold([l?.authorName, l?.authorAR, a].join(' ')) }) }
  S.index = items
}
function search(q) {
  const terms = fold(q).split(/\s+/).filter(Boolean); if (!terms.length) return { books: [], authors: [], total: 0 }
  const hits = S.index.filter(it => terms.every(t => it.text.includes(t)))
  return { books: hits.filter(h => h.kind === 'book').slice(0, 40), authors: hits.filter(h => h.kind === 'author').slice(0, 15), total: hits.length,
    nBooks: hits.filter(h => h.kind === 'book').length, nAuthors: hits.filter(h => h.kind === 'author').length }
}
function showResults() {
  const q = $('#q').value, box = $('#results-list')
  if (!q.trim()) { box.hidden = true; box.innerHTML = ''; return }
  const r = search(q)
  box.hidden = false
  box.innerHTML = r.total ? `
    ${r.authors.length ? `<h3>Authors (${r.nAuthors.toLocaleString('en')})</h3><ul>${r.authors.map(h => { const l = authorLabel(h.key)
      return `<li><a href="${authorHref(h.key)}" data-nav>${esc(authorNameText(h.key))}</a> ${ar(l?.authorAR)} <code>${esc(h.key)}</code></li>` }).join('')}</ul>` : ''}
    ${r.books.length ? `<h3>Books (${r.nBooks.toLocaleString('en')}${r.nBooks > r.books.length ? `, first ${r.books.length} shown` : ''})</h3><ul>${r.books.map(h => { const l = bookLabel(h.key)
      return `<li>${bookLink(h.key)} ${ar(l?.titleAR)} <code>${esc(h.key)}</code></li>` }).join('')}</ul>` : ''}`
    : '<p class="note">No book or author matches.</p>'
}

// ---- navigation ---------------------------------------------------------------------------------------------------
function navigate(href) { history.pushState(null, '', href); route() }
document.addEventListener('click', e => {
  const a = e.target.closest('a[data-nav]'); if (!a || e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return
  e.preventDefault(); $('#results-list').hidden = true; navigate(a.getAttribute('href'))
})
addEventListener('popstate', () => route())

async function route() {
  const p = new URLSearchParams(location.search)
  $('#messages').innerHTML = ''
  const book = p.get('book'), author = p.get('author')
  $('#start').hidden = !!(book || author); $('#profile').hidden = !(book || author)
  if (!book && !author) { document.title = APP.name; S.view = null; return }
  try {
    if (book) {
      if (!S.P.idOf.has(book)) { $('#profile').innerHTML = ''; fail(`Unknown book URI: ${book}`); return }
      await renderBook(book)
    } else {
      if (!S.P.authorBooks.has(author)) { $('#profile').innerHTML = ''; fail(`Unknown author URI: ${author}`); return }
      await renderAuthor(author)
    }
  } catch (e) { fail(e) } finally { status('') }
}

// ---- profile building blocks ----------------------------------------------------------------------------------------
const section = (id, title, intro = '') => `<section id="${id}" class="panel"><h2>${title}</h2>${intro}<div class="body"></div><p class="dl"></p></section>`
const noData = id => { const s = $(`#${id}`); s.querySelector('.body').innerHTML = `<p class="nodata">${NO_DATA}</p>`; s.querySelector('.dl').innerHTML = '' }
function chartBox(id, cls = 'chart') { const d = document.createElement('div'); d.className = cls; $(`#${id} .body`).appendChild(d); return d }
function dlButton(id, label, name, rows, cols) {
  const b = document.createElement('button'); b.type = 'button'; b.textContent = label
  b.onclick = () => saveText(toTSV(rows, cols), `${S.view.stem}_${name}.tsv`)
  $(`#${id} .dl`).appendChild(b); S.view.files[name] = { rows, cols, label }
}
async function text(name) { return (S.texts ??= {})[name] ??= await (await fetch(`texts/${name}.html`)).text() }

async function bookRows(id) {
  const base = dataBase(S.release) + 'classifier/'
  const [rolling, entropy, tfidf, headers] = await Promise.all(['rolling', 'rolling_entropy', 'tfidf', 'headers'].map(t => readByKey(base + t + '/', [id])))
  rolling.sort((a, b) => a.start - b.start); entropy.sort((a, b) => a.start - b.start); tfidf.sort((a, b) => a.rank - b.rank)
  headers.sort((a, b) => a.pos - b.pos || a.level - b.level)
  return {
    rolling: rolling.map(r => ({ start: Number(r.start), ...Object.fromEntries(TYPES.map(t => [t, Number(r[t]) / 1e4])) })),          // stored as score x 10^4
    entropy: entropy.map(r => ({ start: Number(r.start), ENTRPOYUNI: Number(r.ENTRPOYUNI) / 1e6, ENTROPYBI: Number(r.ENTROPYBI) / 1e6 })),  // stored x 10^6
    tfidf, headers: headersTable(headers),
  }
}

async function renderBook(uri) {
  const P = S.P, t0 = performance.now(), id = P.idOf.get(uri), author = authorOfURI(uri), l = bookLabel(uri), al = authorLabel(author)
  S.timing = { book: uri, start: t0 }
  status('Loading the book’s data …')
  document.title = `${bookTitleText(uri).replace(/\*/g, '')} — ${APP.name}`
  const link = P.linkOf(uri), top = P.booksClassified.filter(b => b.bookURI === uri).map(b => b.comparables).join('; ')
  $('#profile').innerHTML = `
    <header class="profile-head">
      <h1 class="book-title">${bookTitleHTML(uri)}</h1>
      <p class="ar-line">${ar(l?.titleAR)}${l?.titleAR && l?.authorAR ? ' — ' : ''}${ar(l?.authorAR)}</p>
      <p>Author: <a href="${authorHref(author)}" data-nav>${esc(authorNameText(author))}</a> · URI <code>${esc(uri)}</code>${link ? ` · <a href="${esc(link)}" target="_blank" rel="noopener">text (OpenITI release 2023.1.8)</a>` : ''}</p>
      <p class="note">Top book type: ${esc(top)}. ${l?.ambiguous === '1' ? `Label flagged as uncertain${l.ambiguousNote ? `: ${esc(l.ambiguousNote)}` : ''}.` : ''}</p>
      <p><button type="button" id="dl-all">Download all data of this profile (TSV files in a zip, with README)</button></p>
    </header>
    ${section('sec-radar', 'Book Typology: Complete Text Assessment', await text('assessment_book'))}
    ${section('sec-rolling', 'Book Typology: Rolling Text Assessment', await text('assessment_rolling'))}
    <div id="headers-ctl" class="headers-ctl" hidden></div>
    ${section('sec-rollent', 'Entropy: Rolling Assessment', await text('assessment_rolling_ent'))}
    ${section('sec-entuni', 'Entropy: Comparative Assessment — Across All Book Types: Unigram Entropy', '<p class="note">[1] Unigrams that occur only once in texts are excluded from calculations; [2] the red box marks the type to which the selected book belongs, the red line the book’s value.</p>')}
    ${section('sec-entbi', 'Entropy: Comparative Assessment — Across All Book Types: Bigram Entropy', '<p class="note">[1] Bigrams that occur only once in texts are excluded from calculations; [2] the red box marks the type to which the selected book belongs, the red line the book’s value.</p>')}
    ${section('sec-timeuni', 'Entropy: Place Within the Main Type Over Time: Unigram Entropy', '<p class="note">[1] Unigrams that occur only once in texts are excluded from calculations; [2] red lines indicate the place of the selected book: vertical line — its period; horizontal — its entropy score.</p>')}
    ${section('sec-timebi', 'Entropy: Place Within the Main Type Over Time: Bigram Entropy', '<p class="note">[1] Bigrams that occur only once in texts are excluded from calculations; [2] red lines indicate the place of the selected book: vertical line — its period; horizontal — its entropy score.</p>')}
    ${section('sec-tfidf', 'TF-IDF Neighbors: Similar Books', await text('tfidf_comps'))}
    ${section('sec-author', `Author Assessment (based on all books): ${esc(authorNameText(author))}`, await text('assessment_author'))}`
  S.view = { kind: 'book', bookURI: uri, authorURI: author, stem: `Classifier_${uri}`, files: {} }
  $('#dl-all').onclick = () => downloadAll()
  const rows = await bookRows(id); S.timing.data = performance.now() - t0
  const V = S.view; Object.assign(V, { rollingRows: rows.rolling, entropyRows: rows.entropy, headers: rows.headers })
  status('Drawing …')
  // radar
  V.radar = radarBook(P, uri, rows.rolling)
  await radarBookChart(chartBox('sec-radar', 'chart radar'), V.radar, { filename: `${uri}_RADAR` })
  if (!V.radar.hasRolling) $('#sec-radar .body').insertAdjacentHTML('beforeend', `<p class="nodata">Rolling Assessment: ${NO_DATA}</p>`)
  dlButton('sec-radar', 'Download radar data (TSV)', 'radar', V.radar.rows, ['axis', 'type', 'complete', 'rolling', 'period'])
  // rolling type plot and rolling entropy
  if (rows.rolling.length) {
    V.rollingSeries = rollingSeries(P, rows.rolling)
    V.rollingDisplay = await rollingChart(chartBox('sec-rolling', 'chart tall'), V.rollingSeries, { filename: `${uri}_ROLLING`, bookTitle: bookTitleText(uri).replace(/\*/g, '') })
    dlButton('sec-rolling', 'Download rolling scores, every window (TSV)', 'rolling', rows.rolling, ['start', ...TYPES])
  } else noData('sec-rolling')
  if (rows.entropy.length) {
    V.entropyDisplay = await entropyLineChart(chartBox('sec-rollent'), rows.entropy, { filename: `${uri}_ROLLING_ENTROPY` })
    dlButton('sec-rollent', 'Download rolling entropy, every window (TSV)', 'rolling_entropy', rows.entropy, ['start', 'ENTRPOYUNI', 'ENTROPYBI'])
  } else noData('sec-rollent')
  headersControl(rows)
  // entropy boxplots
  for (const [sec, which, kind] of [['sec-entuni', 'unigrams', 'types'], ['sec-entbi', 'bigrams', 'types'], ['sec-timeuni', 'unigrams', 'time'], ['sec-timebi', 'bigrams', 'time']]) {
    const v = kind === 'types' ? entropyAcrossTypes(P, uri, which) : entropyTypeTime(P, uri, which)
    V[`${kind}_${which}`] = v
    if (!v) { noData(sec); continue }
    if (kind === 'types') {
      await boxTypesChart(chartBox(sec, 'chart tall'), v, { filename: `${uri}_ENTROPY_ASSESSMENT_${which}` })
      dlButton(sec, 'Download the values behind this plot (TSV)', `entropy_types_${which}`, v.groups.flatMap(g => g.books.map((b, i) => ({ bookURI: b, classLabel: g.classLabel, [v.col]: g.values[i], selectedType: g.selected ? 1 : 0, thisBook: b === uri ? 1 : 0 }))), ['bookURI', 'classLabel', v.col, 'selectedType', 'thisBook'])
    } else {
      await boxTypeTimeChart(chartBox(sec), v, { filename: `${uri}_ENTROPY_IN_TYPE_CHRONO_CONTEXT_${which}` })
      dlButton(sec, 'Download the values behind this plot (TSV)', `entropy_type_time_${which}`, v.groups.flatMap(g => g.books.map((b, i) => ({ bookURI: b, classLabel: v.classLabel, period: g.period, [v.col]: g.values[i], thisBook: b === uri ? 1 : 0 }))), ['bookURI', 'classLabel', 'period', v.col, 'thisBook'])
    }
  }
  // TF-IDF neighbours
  V.tfidf = tfidfTable(P, rows.tfidf)
  if (V.tfidf.length) {
    const tv = V.tfidf.map(r => ({ ...r, Book: bookTitleText(r.bookURI), Arabic: bookLabel(r.bookURI)?.titleAR || null }))
    renderTable(chartBox('sec-tfidf', 'wide'), tv, ['rank', 'Book', 'Arabic', 'bookURI', 'similarity'], { rtl: ['Arabic'], render: { Book: (v, r) => bookLink(r.bookURI) } })
    dlButton('sec-tfidf', 'Download (TSV)', 'tfidf', tv, ['rank', 'Book', 'Arabic', 'bookURI', 'similarity'])
  } else noData('sec-tfidf')
  await authorBlock('sec-author', author)
  S.timing.done = performance.now() - t0; status('')
}

async function authorBlock(sec, author) {
  const P = S.P, V = S.view
  V.authorRadar = radarAuthor(P, author)
  if (V.authorRadar) {
    await radarAuthorChart(chartBox(sec, 'chart radar'), V.authorRadar, { filename: `${author}_RADAR` })
    dlButton(sec, 'Download author radar data (TSV)', 'author_radar', V.authorRadar.rows, ['axis', 'type', 'final'])
  } else $(`#${sec} .body`).insertAdjacentHTML('beforeend', `<p class="nodata">${NO_DATA}</p>`)
  V.authorBooks = authorBooksTable(P, author)
  const tv = V.authorBooks.map(r => ({ ...r, Book: bookTitleText(r.bookURI), Arabic: bookLabel(r.bookURI)?.titleAR || null }))
  const h = document.createElement('h3'); h.textContent = `Books of the author (${tv.length})`; $(`#${sec} .body`).appendChild(h)
  renderTable(chartBox(sec, 'wide'), tv, ['Book', 'Arabic', 'bookURI', 'comparables', 'index'], { rtl: ['Arabic'], render: { Book: (v, r) => bookLink(r.bookURI) } })
  dlButton(sec, 'Download the author’s books (TSV)', 'author_books', tv, ['Book', 'Arabic', 'bookURI', 'comparables', 'index'])
}

// headers switch: off by default; H1/H2/H3 toggles only for levels the book has; lines on both rolling plots
function headersControl(rows) {
  const box = $('#headers-ctl'), H = rows.headers, levels = [1, 2, 3].filter(l => H.some(h => h.level === l))
  S.view.headerLevels = levels; S.view.headersOn = new Set()
  if (!H.length || !rows.rolling.length) { box.hidden = true; return }
  box.hidden = false
  box.innerHTML = `<label><input type="checkbox" id="hdr-on"> Show section headers on the rolling plots</label>
    <span class="levels">${levels.map(l => `<label><input type="checkbox" class="hdr-lv" value="${l}" checked disabled> H${l} (${H.filter(h => h.level === l).length})</label>`).join(' ')}</span>
    <details class="headers-table"><summary>Headers table (${H.length})</summary><p class="note">Positions are token offsets in the text (as on the plots' x axis); milestone = position / 300. Header texts are not part of the data.</p><div class="wide"></div><p class="dl"></p></details>`
  const tv = H.map(h => ({ level: `H${h.level}`, header: null, pos: h.pos, milestone: h.milestone }))
  renderTable(box.querySelector('.headers-table .wide'), tv, ['level', 'header', 'pos', 'milestone'])
  const b = document.createElement('button'); b.type = 'button'; b.textContent = 'Download headers (TSV)'; b.onclick = () => saveText(toTSV(tv, ['level', 'header', 'pos', 'milestone']), `${S.view.stem}_headers.tsv`)
  box.querySelector('.headers-table .dl').appendChild(b); S.view.files.headers = { rows: tv, cols: ['level', 'header', 'pos', 'milestone'] }
  const apply = async () => {
    const on = $('#hdr-on').checked; box.querySelectorAll('.hdr-lv').forEach(c => c.disabled = !on)
    const lv = new Set(on ? [...box.querySelectorAll('.hdr-lv:checked')].map(c => Number(c.value)) : [])
    S.view.headersOn = lv
    const Plotly = await loadPlotly(), shapes = headerShapes(H, lv)
    for (const el of [$('#sec-rolling .chart'), $('#sec-rollent .chart')]) if (el) await Plotly.relayout(el, { shapes })
  }
  $('#hdr-on').onchange = apply; box.querySelectorAll('.hdr-lv').forEach(c => c.onchange = apply)
}

async function renderAuthor(author) {
  const P = S.P, t0 = performance.now(), l = authorLabel(author)
  S.timing = { author, start: t0 }
  document.title = `${authorNameText(author)} — ${APP.name}`
  const ah = Number(author.slice(0, 4))
  $('#profile').innerHTML = `
    <header class="profile-head">
      <h1>${esc(authorNameText(author))}</h1>
      <p class="ar-line">${ar(l?.authorAR)}</p>
      <p>URI <code>${esc(author)}</code> · death date: ${ah} AH${l?.deathCE ? ` / ${esc(l.deathCE)} CE` : ''} (from the URI${l?.deathCE ? ' and the label' : ''})</p>
      <p><button type="button" id="dl-all">Download all data of this profile (TSV files in a zip, with README)</button></p>
    </header>
    ${section('sec-author', 'Author Assessment (based on all books)', await text('assessment_author'))}`
  S.view = { kind: 'author', authorURI: author, stem: `Classifier_${author}`, files: {} }
  $('#dl-all').onclick = () => downloadAll()
  await authorBlock('sec-author', author)
  S.timing.done = performance.now() - t0
}

async function downloadAll() {
  const V = S.view; if (!V) return
  const files = {}
  for (const [name, f] of Object.entries(V.files)) files[`${name}.tsv`] = toTSV(f.rows, f.cols)
  if (V.kind === 'book' && V.rollingSeries === undefined && !files['rolling.tsv']) files['rolling.tsv'] = toTSV([], ['start', ...TYPES])
  const now = new Date()
  files['README.txt'] = [
    `${APP.name} (${APP.version}), app commit ${S.appCommit ?? 'not available'} (https://github.com/${APP.repo})`,
    `${APP.title}`,
    `Data: OpenITI release ${S.release.release}; data repository ${S.release.repo}, commit ${S.release.commit} (classifier/, data_BC/, labels/)`,
    `Downloaded: ${now.toISOString()} (${now.toString()})`,
    `Profile: ${V.kind === 'book' ? `book ${V.bookURI}` : `author ${V.authorURI}`}; page address: ${location.href}`,
    '', 'Book titles and author names (columns Book, Arabic) are working labels and may contain errors; the URI is authoritative.',
    '', 'Files (UTF-8, tab-separated, header row; character fields and column names in double quotes, embedded quotes doubled; NA = not available):',
    ...Object.entries(V.files).map(([n, f]) => `  ${n}.tsv: ${DESCR[n.replace(/_(unigrams|bigrams)$/, '')] ?? ''} Columns: ${f.cols.join(', ')}.`),
  ].join('\n') + '\n'
  saveBlob(await zipFiles(files), `${V.stem}_${stamp()}.zip`)
}
const DESCR = {
  radar: 'the radar: per axis (type), complete = whole-text score (0.1 counted as 0; undefined = 1 when all ten scores are equal), rolling = mean over the rolling windows, period = share of each top type among books with a death decade within +-50 years.',
  rolling: 'the rolling type scores of every window (start = token offset of the window; scores 0-1); the plot shows a reduced number of points for long books.',
  rolling_entropy: 'the rolling unigram and bigram entropy of every window.',
  entropy_types: 'whole-text entropy (2up) of every book by its top type; selectedType = the type of this book; thisBook = 1 for this book.',
  entropy_type_time: 'whole-text entropy (2up) of the books of this book\'s type by century of death (AH/CE).',
  tfidf: 'the 250 nearest books by TF-IDF cosine similarity (unigrams and bigrams).',
  author_radar: 'the author\'s mean rolling score per type over all of the author\'s books.',
  author_books: 'the author\'s books with their top type (comparables; ties give two rows) and its score (index).',
  headers: 'section headers of the book: level, position (token offset), milestone = position / 300; header texts are not in the data.',
}

// ---- version line ---------------------------------------------------------------------------------------------------
async function versionLine() {
  try {
    const cached = sessionStorage.getItem('cls-app-commit')
    S.appCommit = cached || (await (await fetch(`https://api.github.com/repos/${APP.repo}/commits/main`)).json()).sha?.slice(0, 7) || null
    if (S.appCommit) sessionStorage.setItem('cls-app-commit', S.appCommit)
  } catch { S.appCommit = null }
  $('#version').innerHTML = `${APP.name} ${APP.version} · app commit <a href="https://github.com/${APP.repo}/commit/${S.appCommit ?? ''}">${S.appCommit ?? 'n/a'}</a> · data: OpenITI ${S.release.release}, <a href="https://github.com/${S.release.repo}/tree/${S.release.commit}">${S.release.repo.split('/')[1]}@${S.release.commit.slice(0, 7)}</a>`
}

// ---- wiring -----------------------------------------------------------------------------------------------------------
async function init() {
  versionLine()
  $('#intro-text').innerHTML = await text('intro_short')
  $('#comparables').innerHTML = await text('comparables')
  status('Loading the classifier data …'); const t0 = performance.now()
  try { S.P = prepare(await loadStatic(dataBase(S.release))) } catch (e) { status(''); fail(e); return }
  S.loadMs = performance.now() - t0
  buildIndex(); status('')
  $('#q').disabled = false; $('#q').placeholder = 'Search books and authors: title, name, Arabic or URI'
  $('#q').oninput = showResults
  $('#q').onkeydown = e => { if (e.key === 'Enter') { const a = $('#results-list a'); if (a) { $('#results-list').hidden = true; navigate(a.getAttribute('href')) } } }
  await route()
  S.ready = true
}
init()
