// OpenITI Book Classifier — page controller: search panel, book profile (?book=<bookURI>), author profile
// (?author=<authorURI>), each with tabs. The active tab and header choices are in the hash (see share.js).
import { APP, DEV, CITATION, SHOW_UNCONFIRMED_HEADERS, RELEASES, DEFAULT_RELEASE, dataBase, dataCommit, ngramreaderURL } from './config.js'
import { loadStatic, readByKey } from './data.js'
import { prepare, radarBook, rollingSeries, entropyAcrossTypes, entropyTypeTime, tfidfTable, radarAuthor, authorBooksTable, authorBooksMatrix, authorTopTypes, undefinedWindow, headersTable, authorOfURI, TYPES } from './compute.js'
import { radarBookChart, radarAuthorChart, bookBarsChart, rankedTypesChart, allBooksChart, topTypesChart, rollingChart, entropyLineChart, boxTypesChart, boxTypeTimeChart, headerShapes } from './charts.js'
import { redraw, setShapes, exportBar, setTypeCodes, typeLabel } from './chartkit.js'
import { createTours, cleanLink } from './tour.js'
import { renderTable, esc, fold } from './tables.js'
import { toTSV, saveText, saveBlob, zipFiles, stamp } from './download.js'
import { panel, tabs, dialogs, citeDialog, copyText, fontControls, bandMenu, themeControl } from './ui.js'
import { packState, unpackState } from './share.js'
import { chartCitation } from './cite.js'
import { keyboardButton, cleanField } from './arkb.js'

const $ = s => document.querySelector(s)
const NO_DATA = 'No data for this text.'
const UNCERTAIN = 'Label uncertain; see URI.'
const S = { release: RELEASES[DEFAULT_RELEASE], appCommit: null, P: null, view: null, timing: null, index: null, dirty: new Set() }
window.__cls = S                                     // exposed for automated tests

// ---- labels (same rendering as the NgramReader) ----------------------------------------------------------------
const italics = s => esc(s).replace(/\*([^*]+)\*/g, '<i>$1</i>')
const bookLabel = uri => S.P.labels.books.get(uri)
const authorLabel = a => S.P.labels.authors.get(a)
const bookTitleHTML = uri => { const l = bookLabel(uri); return l ? italics(l.label) + (l.ambiguous === '1' ? `<sup class="uncertain" title="${UNCERTAIN}">?</sup>` : '') : esc(uri) }
const bookTitleText = uri => bookLabel(uri)?.label ?? uri
const authorNameText = a => authorLabel(a)?.authorName ?? a
const ar = s => (s ? `<span dir="rtl" lang="ar" class="ar">${esc(s)}</span>` : '')
const bookHref = uri => `?book=${encodeURIComponent(uri)}`
const authorHref = a => `?author=${encodeURIComponent(a)}`
const bookLink = uri => `<a href="${bookHref(uri)}" data-nav>${bookTitleHTML(uri)}</a>`
const asCaption = s => s.replace(/\*([^*]+)\*/g, '<i>$1</i>')      // *title* -> italics in a chart caption

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
  const q = cleanField($('#q').value), box = $('#results-list')
  if (!q.trim()) { box.innerHTML = ''; return }
  const r = search(q), cur = S.view?.bookURI ?? S.view?.authorURI
  box.innerHTML = r.total ? `
    ${r.authors.length ? `<h3>Authors (${r.nAuthors.toLocaleString('en')})</h3>${r.authors.map(h => { const l = authorLabel(h.key)
      return `<a class="hit${h.key === cur ? ' current' : ''}" href="${authorHref(h.key)}" data-nav><span>${esc(authorNameText(h.key))}${l?.deathCE ? ` <span class="note">(d. ${esc(l.deathCE)})</span>` : ''}</span>${ar(l?.authorAR)}<code>${esc(h.key)}</code></a>` }).join('')}` : ''}
    ${r.books.length ? `<h3>Books (${r.nBooks.toLocaleString('en')}${r.nBooks > r.books.length ? `, first ${r.books.length} shown` : ''})</h3>${r.books.map(h => { const l = bookLabel(h.key)
      return `<a class="hit${h.key === cur ? ' current' : ''}" href="${bookHref(h.key)}" data-nav><span>${bookTitleHTML(h.key)}</span>${ar(l?.titleAR)}<code>${esc(h.key)}</code></a>` }).join('')}` : ''}`
    : '<p class="note">No book or author matches.</p>'
}

// ---- navigation and URL state --------------------------------------------------------------------------------------
function navigate(href) { history.pushState(null, '', href); S.wanted = {}; route() }
document.addEventListener('click', e => {
  const a = e.target.closest('a[data-nav]'); if (!a || e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return
  e.preventDefault(); navigate(a.getAttribute('href')); UI.autoFold()
})
addEventListener('popstate', async () => { S.wanted = await readHash(); route() })
const readHash = async () => { const o = await unpackState(location.hash); return { tab: o?.t, levels: o?.h, bookChart: o?.v, authorChart: o?.a } }
async function updateURL() {
  const V = S.view; if (!V) return
  const defaultLevels = V.headerLevels?.includes(1) ? '1' : ''
  const h = V.levelsOn ? [...V.levelsOn].sort().join('') : defaultLevels
  const st = { ...(T && T.active !== 'overview' && T.active !== 'a-overview' ? { t: T.active } : {}), ...(V.kind === 'book' && h !== defaultLevels ? { h } : {}), ...(V.kind === 'book' && V.bookChart !== 'bars' ? { v: V.bookChart } : {}), ...(V.authorChart !== 'ranked' ? { a: V.authorChart } : {}) }
  history.replaceState(null, '', location.pathname + location.search + (Object.keys(st).length ? await packState(st) : ''))
}

async function route() {
  const p = new URLSearchParams(location.search), book = p.get('book'), author = p.get('author')
  $('#messages').innerHTML = ''
  const on = !!(book || author)
  $('#empty').hidden = on; $('#howto').hidden = on; for (const id of ['cite', 'copy-link', 'download-all']) $('#' + id).disabled = !on
  if (!on) { document.title = APP.name; S.view = null; document.querySelectorAll('[data-pane]').forEach(x => { x.hidden = true }); $('#tabs').innerHTML = ''; $('#what').innerHTML = '<span class="note">No book or author chosen.</span>'; return }
  try {
    if (book) { if (!S.P.idOf.has(book)) { fail(`Unknown book URI: ${book}`); return } await renderBook(book) }
    else { if (!S.P.authorBooks.has(author)) { fail(`Unknown author URI: ${author}`); return } await renderAuthor(author) }
    showResults()
  } catch (e) { fail(e) } finally { status('') }
}

// ---- captions -----------------------------------------------------------------------------------------------------
const today = () => new Date().toISOString().slice(0, 10)
const footer = () => chartCitation(citation(), dataCommit(S.release).slice(0, 7))
const bookLine = uri => `${asCaption(bookTitleText(uri))} · ${uri}`

// ---- book profile ---------------------------------------------------------------------------------------------------
const BOOK_TABS = [{ id: 'overview', label: 'Overview' }, { id: 'text', label: 'Through the text' }, { id: 'entropy', label: 'Entropy compared' }, { id: 'similar', label: 'Similar books' }, { id: 'author', label: 'Author' }]
const AUTHOR_TABS = [{ id: 'a-overview', label: 'Overview' }, { id: 'a-books', label: 'Books' }]
let T = null
function setTabs(list, wanted, enabled) {
  paintSwitches()
  T = tabs($('#tabs'), list, async id => { await updateURL(); await drawTab(id); activeCharts().forEach(el => redraw(el)) })
  T.enable(enabled); T.set(wanted && enabled[wanted] !== false ? wanted : list[0].id, true)
}
async function text(name) { return (S.texts ??= {})[name] ??= await (await fetch(`texts/${name}.html`)).text() }

async function bookRows(id) {
  const base = dataBase(S.release) + 'classifier/'
  const headerRows = readByKey(base + 'header_texts/', [id]).catch(() => readByKey(base + 'headers/', [id]).then(r => r.filter(h => Number(h.level) <= 2)))   // earlier data commits have positions only
  const [rolling, entropy, tfidf, headers] = await Promise.all([...['rolling', 'rolling_entropy', 'tfidf'].map(t => readByKey(base + t + '/', [id])), headerRows])
  rolling.sort((a, b) => a.start - b.start); entropy.sort((a, b) => a.start - b.start); tfidf.sort((a, b) => a.rank - b.rank)
  headers.sort((a, b) => a.pos - b.pos || a.level - b.level)
  return {
    rolling: rolling.map(r => ({ start: Number(r.start), ...Object.fromEntries(TYPES.map(t => [t, Number(r[t]) / 1e4])) })),          // stored as score x 10^4
    entropy: entropy.map(r => ({ start: Number(r.start), ENTRPOYUNI: Number(r.ENTRPOYUNI) / 1e6, ENTROPYBI: Number(r.ENTROPYBI) / 1e6 })),  // stored x 10^6
    tfidf, headers: headersTable(headers).map((h, i) => ({ ...h, text: headers[i].text ?? null, status: headers[i].status ?? null, confirmed: headers[i].confirmed === true })),
  }
}

function fileEntry(name, rows, cols) { S.view.files[name] = { rows, cols } }
const tsv = name => { const f = S.view.files[name]; if (f) saveText(toTSV(f.rows, f.cols), `${S.view.stem}_${name}.tsv`) }

async function renderBook(uri) {
  const P = S.P, t0 = performance.now(), id = P.idOf.get(uri), author = authorOfURI(uri), l = bookLabel(uri)
  S.timing = { book: uri, start: t0 }
  status('Loading the book’s data …')
  document.title = `${bookTitleText(uri).replace(/\*/g, '')} — ${APP.name}`
  const link = P.linkOf(uri), top = P.booksClassified.filter(b => b.bookURI === uri).map(b => typeLabel(b.comparables)).join('; ')
  $('#what').innerHTML = `<h1>${bookTitleHTML(uri)}</h1><div class="line2">${l?.titleAR || l?.authorAR ? `<span>${ar(l?.titleAR)}${l?.titleAR && l?.authorAR ? ' · ' : ''}${ar(l?.authorAR)}</span>` : ''}<a href="${authorHref(author)}" data-nav>${esc(authorNameText(author))}</a><code>${esc(uri)}</code><span>Top type: <b>${esc(top)}</b></span>${link ? `<a href="${esc(link)}" target="_blank" rel="noopener">Text in release 2023.1.8 ↗</a>` : ''}</div>${l?.ambiguous === '1' && l.ambiguousNote ? `<div class="note">Label flagged as uncertain: ${esc(l.ambiguousNote)}</div>` : ''}`
  S.view = { kind: 'book', bookURI: uri, authorURI: author, stem: `Classifier_${uri}`, files: {}, ...chartChoice(), headerList: S.wanted?.headerList }
  const rows = await bookRows(id); S.timing.data = performance.now() - t0
  const V = S.view; Object.assign(V, { rollingRows: rows.rolling, entropyRows: rows.entropy, headers: rows.headers })
  // all view data first (the downloads hold every view); charts are drawn when their tab opens
  V.radar = radarBook(P, uri, rows.rolling); fileEntry('radar', V.radar.rows, ['axis', 'type', 'complete', 'rolling', 'period'])
  if (rows.rolling.length) { V.rollingSeries = rollingSeries(P, rows.rolling); fileEntry('rolling', rows.rolling.map(w => ({ ...w, undefined: undefinedWindow(w) })), ['start', ...TYPES, 'undefined']) }
  if (rows.entropy.length) fileEntry('rolling_entropy', rows.entropy, ['start', 'ENTRPOYUNI', 'ENTROPYBI'])
  for (const w of ['unigrams', 'bigrams']) {
    const a = V[`types_${w}`] = entropyAcrossTypes(P, uri, w), b = V[`time_${w}`] = entropyTypeTime(P, uri, w)
    if (a) fileEntry(`entropy_types_${w}`, a.groups.flatMap(g => g.books.map((x, i) => ({ bookURI: x, classLabel: g.classLabel, [a.col]: g.values[i], selectedType: g.selected ? 1 : 0, thisBook: x === uri ? 1 : 0 }))), ['bookURI', 'classLabel', a.col, 'selectedType', 'thisBook'])
    if (b) fileEntry(`entropy_type_time_${w}`, b.groups.flatMap(g => g.books.map((x, i) => ({ bookURI: x, classLabel: b.classLabel, period: g.period, [b.col]: g.values[i], thisBook: x === uri ? 1 : 0 }))), ['bookURI', 'classLabel', 'period', b.col, 'thisBook'])
  }
  V.tfidf = tfidfTable(P, rows.tfidf)
  V.tfidfRows = V.tfidf.map(r => ({ ...r, Book: bookTitleText(r.bookURI), Arabic: bookLabel(r.bookURI)?.titleAR || null }))
  if (V.tfidf.length) fileEntry('tfidf', V.tfidfRows, ['rank', 'Book', 'Arabic', 'bookURI', 'similarity'])
  authorData(author)
  headersState(rows.headers)
  const wanted = S.wanted ?? {}
  if (wanted.levels !== undefined && wanted.levels !== null) V.levelsOn = new Set(String(wanted.levels).split('').map(Number).filter(x => V.headerLevels.includes(x)))
  setTabs(BOOK_TABS, wanted.tab, { overview: true, text: rows.rolling.length > 0 || rows.entropy.length > 0, entropy: !!V.types_unigrams, similar: V.tfidf.length > 0, author: !!V.authorRadar })
  S.dirty = new Set(BOOK_TABS.map(t => t.id))
  await updateURL(); await drawTab(T.active)
  S.timing.done = performance.now() - t0; status('')
}

function authorData(author) {
  const P = S.P, V = S.view
  V.authorRadar = radarAuthor(P, author)
  if (V.authorRadar) fileEntry('author_radar', V.authorRadar.rows, ['axis', 'type', 'final'])
  V.authorBooks = authorBooksTable(P, author)
  V.authorRows = V.authorBooks.map(r => ({ ...r, Book: bookTitleText(r.bookURI), Arabic: bookLabel(r.bookURI)?.titleAR || null }))
  fileEntry('author_books', V.authorRows, ['Book', 'Arabic', 'bookURI', 'comparables', 'index'])
  V.authorMatrix = authorBooksMatrix(P, author); V.authorMatrix.books.forEach(b => { b.label = bookTitleText(b.bookURI).replace(/\*/g, '') })
  V.authorTop = authorTopTypes(P, author)
  fileEntry('author_all_books', V.authorMatrix.books.map(b => ({ bookURI: b.bookURI, Book: b.label, topType: b.top.join('; '), ...b.scores })), ['bookURI', 'Book', 'topType', ...V.authorMatrix.types.map(t => t.class)])
  fileEntry('author_top_types', V.authorTop.rows, ['type', 'books'])
}
// chart choices come from the link; a new profile starts from the defaults
const chartChoice = () => ({ bookChart: S.wanted?.bookChart === 'radar' ? 'radar' : 'bars', authorChart: ['books', 'radar'].includes(S.wanted?.authorChart) ? S.wanted.authorChart : 'ranked' })
async function drawAuthorChart(viewSel, radarSel) {
  const V = S.view, author = V.authorURI, radar = V.authorChart === 'radar', books = V.authorChart === 'books'; $(radarSel).hidden = !radar; $(viewSel).hidden = radar
  const who = `${authorNameText(author)} · ${author}`
  if (radar) return radarAuthorChart($(radarSel), V.authorRadar, { filename: `${author}_RADAR`, caption: authorCaption(author) })
  if (books) return allBooksChart($(viewSel), V.authorMatrix, { filename: `${author}_ALL_BOOKS`, caption: { title: 'All books at a glance', subtitle: [who], footer: footer(),
    note: `One column per book, grouped by top type; darker means a higher whole-text score (0–1). Types in alphabetical order.${V.authorMatrix.books.some(b => b.top.includes('[U] undefined') || b.top.includes('----')) ? ' Empty columns, at the end: books without a type score.' : ''}` } })
  return rankedTypesChart($(viewSel), V.authorRadar, { filename: `${author}_RANKED_TYPES`, caption: { ...authorCaption(author), note: authorCaption(author).note } })
}
const paintSwitches = () => { const V = S.view; if (!V) return
  document.querySelectorAll('.sw-bchart button').forEach(b => b.classList.toggle('on', b.dataset.v === V.bookChart))
  document.querySelectorAll('.sw-achart button').forEach(b => b.classList.toggle('on', b.dataset.v === V.authorChart)) }
const authorCaption = author => ({ title: 'Author typology: mean rolling score per book type', subtitle: [`${authorNameText(author)} · ${author}`], note: 'Summary of the rolling assessments of all the author’s books in the OpenITI corpus.', footer: footer() })
const authorBooksTableDraw = host => renderTable(host, S.view.authorRows, ['Book', 'Arabic', 'bookURI', 'comparables', 'index'], { rtl: ['Arabic'], render: { comparables: v => esc(typeLabel(v)), Book: (v, r) => bookLink(r.bookURI) } })

// headers: only stored levels H1, H2; confirmed solid, unconfirmed dashed
function headersState(all) {
  const V = S.view, H = all.filter(h => h.level <= 2 && (SHOW_UNCONFIRMED_HEADERS || h.confirmed))
  V.shownHeaders = H; V.headerLevels = [1, 2].filter(l => H.some(h => h.level === l))
  V.levelsOn = new Set(V.headerLevels.includes(1) ? [1] : [])
  const tv = H.map(h => ({ level: `H${h.level}`, header: h.text ?? 'header text not available', pos: h.pos, Confirmed: h.confirmed ? 'yes' : 'no', status: h.status ?? '' }))
  V.headerRows = tv; if (H.length) fileEntry('headers', tv, ['level', 'header', 'pos', 'Confirmed', 'status'])
}
const headerKind = H => { const c = H.filter(h => h.confirmed).length; return c === H.length ? 'solid lines: headers of an annotated version' : c === 0 ? 'dashed lines: headers from a not yet annotated version; may be unreliable' : 'solid lines: confirmed headers; dashed: unconfirmed' }
function textCaptions(uri) {
  const V = S.view, on = V.shownHeaders.filter(h => V.levelsOn.has(h.level))
  const lines = on.length ? ` Vertical lines: ${[...V.levelsOn].sort().map(l => `H${l}`).join(', ')} headers (${headerKind(on)}).` : ''
  return { rolling: { title: 'Book types along the text', subtitle: [bookLine(uri)], note: `Type scores (0–1) in rolling windows every 200 tokens; [U] undefined: windows whose ten scores are all equal.${lines}`, footer: footer() },
    entropy: { title: 'Entropy along the text', subtitle: [bookLine(uri)], note: `Unigram and bigram entropy in rolling windows every 200 tokens.${lines}`, footer: footer() } }
}
const textCharts = () => ['#chart-rolling', '#chart-entropy'].map(q => $(q)).filter(el => el._kit)
function drawHeaderControls() {
  const V = S.view, box = $('#hdr-ctl'), H = V.shownHeaders
  $('#hdr-note').hidden = !H.some(h => !h.confirmed)
  box.innerHTML = H.length ? `<span>Headers:</span>${V.headerLevels.map(l => `<label><input type="checkbox" class="hdr-lv" value="${l}" ${V.levelsOn.has(l) ? 'checked' : ''}> H${l} (${H.filter(h => h.level === l).length})</label>`).join('')}` : ''
  box.querySelectorAll('.hdr-lv').forEach(c => c.onchange = async () => {
    V.levelsOn = new Set([...box.querySelectorAll('.hdr-lv:checked')].map(x => Number(x.value)))
    await updateURL(); const cap = textCaptions(V.bookURI), shapes = headerShapes(H, V.levelsOn)
    for (const [el, c] of [[$('#chart-rolling'), cap.rolling], [$('#chart-entropy'), cap.entropy]]) if (el._kit) { el._kit.caption = c; el._kit.layout = { ...el._kit.layout, shapes }; await redraw(el) }
  })
  const d = $('#hdr-table'); d.hidden = !H.length
  if (H.length) { const nText = V.headerRows.filter(r => r.header !== 'header text not available').length
    d.querySelector('summary').textContent = `Headers in this book (${H.length}; with text ${nText})`
    renderTable($('#tbl-headers'), V.headerRows, ['level', 'header', 'pos', 'Confirmed'], { rtl: ['header'], quick: V.headerLevels.length > 1 ? V.headerLevels.map(l => ({ label: `H${l}`, test: r => r.level === `H${l}` })) : [], quickOn: V.headerLevels.length > 1 ? V.headerLevels.indexOf(V.headerList) : -1 }); d.open = !!V.headerList }
}

async function drawTab(id) {
  if (!S.view || !S.dirty.has(id)) return
  S.dirty.delete(id); const V = S.view, P = S.P, uri = V.bookURI, author = V.authorURI
  if (id === 'overview') {
    $('#note-radar').innerHTML = await text('assessment_book')
    const radar = V.bookChart === 'radar'; $('#chart-radar').hidden = !radar; $('#chart-bars').hidden = radar
    const opts = { filename: `${uri}_${radar ? 'RADAR' : 'BARS'}`, caption: { title: 'Book typology: complete text, rolling windows and the period',
      subtitle: [bookLine(uri)], note: radar ? `Blue: complete text; ${V.radar.hasRolling ? 'orange: mean of the rolling windows; ' : ''}green: types of the books within ±50 lunar years.` : `Blue, solid: complete text; ${V.radar.hasRolling ? 'orange, hatched: mean of the rolling windows; ' : ''}green, light: share of each top type among the books within ±50 lunar years.`, footer: footer() } }
    await (radar ? radarBookChart($('#chart-radar'), V.radar, opts) : bookBarsChart($('#chart-bars'), V.radar, opts))
    const nd = $('#nodata-radar'); nd.hidden = V.radar.hasRolling; nd.textContent = `Rolling Assessment: ${NO_DATA}`
    const rows = [...V.radar.rows].sort((a, b) => b.complete - a.complete)
    renderTable($('#tbl-top'), rows, ['type', 'complete', 'rolling', 'period'], { render: { type: v => esc(typeLabel(v)) } })
  } else if (id === 'text') {
    $('#note-rolling').innerHTML = await text('assessment_rolling'); $('#note-entropy').innerHTML = await text('assessment_rolling_ent')
    drawHeaderControls()
    const cap = textCaptions(uri), shapes = headerShapes(V.shownHeaders, V.levelsOn), has = !!V.rollingSeries, hasE = V.entropyRows.length > 0
    const last = Math.max(...V.rollingRows.map(r => r.start), ...V.entropyRows.map(r => r.start)), range = [0, last]
    $('#chart-rolling').hidden = !has; $('#nodata-rolling').hidden = has; $('#chart-entropy').hidden = !hasE; $('#nodata-entropy').hidden = hasE
    V.textDisplay = {}
    if (has) V.textDisplay.rolling = await rollingChart($('#chart-rolling'), V.rollingSeries, { filename: `${uri}_ROLLING`, caption: cap.rolling, shapes, range })
    if (hasE) V.textDisplay.entropy = await entropyLineChart($('#chart-entropy'), V.entropyRows, { filename: `${uri}_ROLLING_ENTROPY`, caption: cap.entropy, shapes, range })
  } else if (id === 'entropy') {
    const sub = (v, what) => ({ subtitle: [bookLine(uri)], note: `${what} Unique ${v.col.includes('Uni') ? 'unigrams' : 'bigrams'} are excluded (2up). Value of this book: ${v.value.toFixed(3)}.`, footer: footer() })
    await boxTypesChart($('#chart-entuni'), V.types_unigrams, { filename: `${uri}_ENTROPY_ASSESSMENT_Unigrams2up`, caption: { title: 'Unigram entropy across all book types', ...sub(V.types_unigrams, 'Orange box: the type of this book; orange line: this book.') } })
    await boxTypesChart($('#chart-entbi'), V.types_bigrams, { filename: `${uri}_ENTROPY_ASSESSMENT_Bigrams2up`, caption: { title: 'Bigram entropy across all book types', ...sub(V.types_bigrams, 'Orange box: the type of this book; orange line: this book.') } })
    await boxTypeTimeChart($('#chart-timeuni'), V.time_unigrams, { filename: `${uri}_ENTROPY_IN_TYPE_CHRONO_CONTEXT_Unigrams2up`, caption: { title: `Unigram entropy within the type over time: ${esc(typeLabel(V.time_unigrams.classLabel))}`, ...sub(V.time_unigrams, 'Orange lines: the period (vertical) and the entropy (horizontal) of this book.') } })
    await boxTypeTimeChart($('#chart-timebi'), V.time_bigrams, { filename: `${uri}_ENTROPY_IN_TYPE_CHRONO_CONTEXT_Bigrams2up`, caption: { title: `Bigram entropy within the type over time: ${esc(typeLabel(V.time_bigrams.classLabel))}`, ...sub(V.time_bigrams, 'Orange lines: the period (vertical) and the entropy (horizontal) of this book.') } })
  } else if (id === 'similar') {
    $('#note-tfidf').innerHTML = await text('tfidf_comps')
    renderTable($('#tbl-tfidf'), V.tfidfRows, ['rank', 'Book', 'Arabic', 'bookURI', 'similarity'], { rtl: ['Arabic'], render: { Book: (v, r) => bookLink(r.bookURI) } })
  } else if (id === 'author') {
    $('#note-author').innerHTML = await text('assessment_author')
    await drawAuthorChart('#chart-author-v', '#chart-author')
    $('#author-books-title').textContent = `Books of ${authorNameText(author)} (${V.authorRows.length})`
    authorBooksTableDraw($('#tbl-author'))
  } else if (id === 'a-overview') {
    $('#note-aauthor').innerHTML = await text('assessment_author')
    if (V.authorRadar) await drawAuthorChart('#chart-aview', '#chart-aradar')
  } else if (id === 'a-books') {
    const t = V.authorTop
    await topTypesChart($('#chart-atop'), t, { filename: `${author}_TOP_TYPES`, caption: { title: 'Books by top type', subtitle: [`${authorNameText(author)} · ${author}`], footer: footer(),
      note: `Each book counted under the type with its highest whole-text score: ${t.nBooks.toLocaleString('en')} book${t.nBooks === 1 ? '' : 's'}.${t.tied ? ` A tied book counts under both types (${t.tied.toLocaleString('en')}).` : ''}${t.rows.some(r => r.type === '----') ? ' ----: no type scores 0.1 or more.' : ''}` } })
    $('#abooks-title').textContent = `Books of ${authorNameText(author)} (${V.authorRows.length})`; authorBooksTableDraw($('#tbl-abooks'))
  }
}

async function renderAuthor(author) {
  const t0 = performance.now(), l = authorLabel(author), ah = Number(author.slice(0, 4))
  S.timing = { author, start: t0 }
  document.title = `${authorNameText(author)} — ${APP.name}`
  $('#what').innerHTML = `<h1>${esc(authorNameText(author))}</h1><div class="line2">${ar(l?.authorAR)}<code>${esc(author)}</code><span>Death date: ${ah} AH${l?.deathCE ? ` / ${esc(l.deathCE)} CE` : ''}</span></div>`
  S.view = { kind: 'author', authorURI: author, stem: `Classifier_${author}`, files: {}, ...chartChoice() }
  authorData(author)
  setTabs(AUTHOR_TABS, S.wanted?.tab, { 'a-overview': !!S.view.authorRadar, 'a-books': S.view.authorRows.length > 0 })
  S.dirty = new Set(AUTHOR_TABS.map(t => t.id))
  await updateURL(); await drawTab(T.active)
  S.timing.done = performance.now() - t0
}

const activeCharts = () => [...document.querySelectorAll(`[data-pane="${T?.active}"] .js-plotly-plot:not([hidden])`)]
let resizeTimer
function onResize() { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => activeCharts().forEach(el => redraw(el)), 180) }

const DESCR = {
  radar: 'the bars and the radar: per type, complete = whole-text score (0.1 counted as 0; undefined = 1 when all ten scores are equal), rolling = mean over the rolling windows, period = share of each top type among books with a death decade within +-50 years.',
  rolling: 'the rolling type scores of every window (start = token offset of the window; scores 0-1; undefined = 1 when all ten scores of the window are equal); the plot shows a reduced number of points for long books.',
  rolling_entropy: 'the rolling unigram and bigram entropy of every window.',
  entropy_types: 'whole-text entropy (2up) of every book by its top type; selectedType = the type of this book; thisBook = 1 for this book.',
  entropy_type_time: 'whole-text entropy (2up) of the books of this book\'s type by century of death (AH/CE).',
  tfidf: 'the 250 nearest books by TF-IDF cosine similarity (unigrams and bigrams).',
  author_radar: 'the author\'s mean rolling score per type over all of the author\'s books.',
  author_all_books: 'one row per book of the author: top type(s) and the whole-text score per type (0.1 counted as 0), in the column order of the All books chart.',
  author_top_types: 'books per top type (a tied book counts under each of its top types).',
  author_books: 'the author\'s books with their top type (comparables; ties give two rows) and its score (index).',
  headers: 'section headers H1 and H2 of the book as stored for the rolling assessment (a window-sampled subset of the headers): level, text, position (token offset), Confirmed = yes for annotated versions (.completed, .mARkdown), status of the version.',
}
async function downloadAll() {
  const V = S.view; if (!V) return
  await updateURL()
  const files = {}
  for (const [name, f] of Object.entries(V.files)) files[`${name}.tsv`] = toTSV(f.rows, f.cols)
  const now = new Date()
  files['README.txt'] = [
    `${APP.name} (${APP.version}), app commit ${S.appCommit ?? 'not available'} (https://github.com/${APP.repo})`,
    `${APP.title}`,
    `Data: OpenITI release ${S.release.release}; data repository ${S.release.repo}, commit ${dataCommit(S.release)} (classifier/, data_BC/, labels/)`,
    `Downloaded: ${now.toISOString()} (${now.toString()})`,
    `Profile: ${V.kind === 'book' ? `book ${V.bookURI}` : `author ${V.authorURI}`}; page address: ${cleanLink()}`,
    '', 'Cite as:', CITE.text('chicago'),
    '', 'Book titles and author names (columns Book, Arabic) are working labels and may contain errors; the URI is authoritative.',
    '', 'Files (UTF-8, tab-separated, header row; character fields and column names in double quotes, embedded quotes doubled; NA = not available):',
    ...Object.entries(V.files).map(([n, f]) => `  ${n}.tsv: ${DESCR[n.replace(/_(unigrams|bigrams)$/, '')] ?? ''} Columns: ${f.cols.join(', ')}.`),
  ].join('\n') + '\n'
  saveBlob(await zipFiles(files), `${V.stem}_${stamp()}.zip`)
}

const citation = () => { const V = S.view, y = CITATION.year, book = V.kind === 'book'
  const title = book ? `Profile of *${(/\*([^*]+)\*/.exec(bookTitleText(V.bookURI)) ?? [0, bookTitleText(V.bookURI)])[1]}*` : `Profile of ${authorNameText(V.authorURI)}`
  return { year: y, title, app: CITATION.title, released: CITATION.released, version: CITATION.version, doi: CITATION.doi, data: CITATION.data, search: book ? `book ${V.bookURI}` : `author ${V.authorURI}`, accessed: today(), link: cleanLink(), key: `romanov${y}classifier` } }
async function versionLine() {
  try {
    const cached = sessionStorage.getItem('cls-app-commit')
    S.appCommit = cached || (DEV ? DEV.appCommit ?? 'local' : (await (await fetch(`https://api.github.com/repos/${APP.repo}/commits/main`)).json()).sha?.slice(0, 7)) || null
    if (S.appCommit) sessionStorage.setItem('cls-app-commit', S.appCommit)
  } catch { S.appCommit = null }
  const c = dataCommit(S.release)
  $('#version').innerHTML = `${APP.name} ${APP.version} · app commit <a href="https://github.com/${APP.repo}/commit/${S.appCommit ?? ''}">${S.appCommit ?? 'n/a'}</a> · data: OpenITI ${S.release.release}, <a href="https://github.com/${S.release.repo}/tree/${c}">${S.release.repo.split('/')[1]}@${c.slice(0, 7)}</a>`
}

// ---- wiring -----------------------------------------------------------------------------------------------------------
const UI = panel({ onResize })
const CITE = citeDialog(() => (!S.view ? { whole: true, year: CITATION.year, app: CITATION.title, released: CITATION.released, doi: CITATION.doi, key: `romanov${CITATION.year}classifier` } : citation()))
// a tour stop: the state of tours.json, opened as a link is
async function openStop({ panel, book, author, t, h, v, a, q, list }) {
  if (panel) UI.fold(panel === 'closed')
  const u = new URL(location.href), tour = u.searchParams.get('tour'), stop = u.searchParams.get('stop'); u.search = ''; u.hash = ''
  if (book) u.searchParams.set('book', book); if (author) u.searchParams.set('author', author); u.searchParams.set('tour', tour); u.searchParams.set('stop', stop)
  history.replaceState(null, '', u); S.wanted = { tab: t, levels: h, bookChart: v, authorChart: a, headerList: list }; await route()
  $('#q').value = q ?? ''; showResults()
}
const TOURS = createTours({ open: openStop, links: {} })
async function init() {
  versionLine(); dialogs()
  $('#link-other').href = ngramreaderURL()
  const c = CITATION; $('#citation-block').innerHTML = `<b>Citation:</b> Romanov, Maxim. <i>${esc(c.title)}</i>. Zenodo, released ${c.released}. <a href="https://doi.org/${c.doi}">https://doi.org/${c.doi}</a>.`
  const help = e => { e.preventDefault(); $('#help-dialog').showModal() }
  $('#open-help').onclick = help; document.querySelectorAll('[data-help]').forEach(a => a.onclick = help)
  $('#cite').onclick = () => CITE.open(); $('#band-cite').onclick = () => CITE.open(); bandMenu()
  $('#copy-link').onclick = async () => { await updateURL(); copyText(cleanLink(), 'Link copied') }
  $('#download-all').onclick = downloadAll
  $('#dl-tfidf').onclick = () => tsv('tfidf'); $('#dl-author').onclick = () => tsv('author_books'); $('#dl-abooks').onclick = () => tsv('author_books'); $('#dl-headers').onclick = () => tsv('headers')
  const shownOf = (...ids) => () => [ids.map(i => $(i)).find(el => !el.hidden)]
  for (const [cls, key, panes] of [['.sw-bchart', 'bookChart', ['overview']], ['.sw-achart', 'authorChart', ['author', 'a-overview']]]) document.querySelectorAll(cls).forEach(box => box.onclick = async e => {
    const b = e.target.closest('button'); if (!b || !S.view) return
    S.view[key] = b.dataset.v; paintSwitches(); panes.forEach(p => S.dirty.add(p)); await updateURL(); await drawTab(T.active) })
  const authorTSV = () => tsv(S.view.authorChart === 'books' ? 'author_all_books' : 'author_radar')
  exportBar($('#x-radar'), shownOf('#chart-bars', '#chart-radar'), () => tsv('radar'))
  exportBar($('#x-text'), textCharts, () => { tsv('rolling'); tsv('rolling_entropy') })
  exportBar($('#x-entropy'), () => ['#chart-entuni', '#chart-entbi', '#chart-timeuni', '#chart-timebi'].map(s => $(s)), () => { for (const n of ['entropy_types_unigrams', 'entropy_types_bigrams', 'entropy_type_time_unigrams', 'entropy_type_time_bigrams']) tsv(n) })
  exportBar($('#x-author'), shownOf('#chart-author-v', '#chart-author'), authorTSV)
  exportBar($('#x-aradar'), shownOf('#chart-aview', '#chart-aradar'), authorTSV)
  exportBar($('#x-atop'), () => [$('#chart-atop')], () => tsv('author_top_types'))
  new ResizeObserver(onResize).observe($('#content'))
  fontControls(() => activeCharts().forEach(el => redraw(el)))
  themeControl(() => activeCharts().forEach(el => redraw(el)))
  const [intro, comparables] = await Promise.all([text('intro_short'), text('comparables')])
  $('#intro-text').innerHTML = intro; $('#help-intro').innerHTML = intro; $('#comparables').innerHTML = comparables
  S.wanted = await readHash()
  status('Loading the classifier data …'); const t0 = performance.now()
  try { const st = await loadStatic(dataBase(S.release)); S.P = prepare(st); setTypeCodes(S.P.L.map(l => [l.classLabel, st.compsLabels.find(c => c.class === l.class)?.abbrev ?? 'UND'])) } catch (e) { status(''); fail(e); return }
  S.loadMs = performance.now() - t0
  buildIndex(); status('')
  $('#q').disabled = false; $('#q').placeholder = 'e.g. tabari tarikh'
  $('#q').after(keyboardButton($('#q'), { regex: false, what: 'Search: title, author, Arabic or URI' }))
  $('#q').oninput = showResults
  $('#q').onkeydown = e => { if (e.key === 'Enter') { const a = $('#results-list a'); if (a) navigate(a.getAttribute('href')) } }
  $('#help-howto').innerHTML = $('#howto').innerHTML
  const tq = new URLSearchParams(location.search)
  if (!(tq.get('tour') && await TOURS.start(tq.get('tour'), Number(tq.get('stop')) || 1))) { if (!location.search) UI.fold(false); await route() }
  S.ready = true
}
init()
