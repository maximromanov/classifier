// The data behind every view, ported from the deployed R app (ADHFAIS APP{ENDIX} 2, functions_comps.R in
// adhfais_app2_local_10types.zip, 2025-06-14). Each function names the R code it follows. Plots are drawn from these
// views (charts.js) and downloads write them (main.js), so what is shown, downloaded and verified is the same data.
export const TYPES = ['balagha', 'chronicles', 'fiqh', 'greek', 'hadith', 'kalam', 'medicine', 'poetry', 'tafsir', 'tarajim']  // main_data column order
const cp = s => Array.from(s)                                   // code points (R str_sub / substr count characters)
const cmpC = (a, b) => (a < b ? -1 : a > b ? 1 : 0)             // R/dplyr arrange(): C locale = code-point order
const collate = new Intl.Collator('en').compare                 // R sort()/factor levels: locale collation
export const authorOfURI = u => u.split('.')[0]
const ahOfURI = u => Number(u.slice(0, 4))

// labelsRoll (functions_comps.R 61-72): comps_labels + types_final (MODEL types10) -> "[X] english", undefined added,
// arranged by desc(classLabel), order = (row - 1) * 1.15
export function labelsRoll(compsLabels, typesFinal) {
  const abbr = new Map(typesFinal.filter(r => r.MODEL === 'types10').map(r => [r.TYPES, r.ABBR]))
  const rows = compsLabels.map(r => ({ class: r.class, english: r.english, abbrev: `[${abbr.get(r.class)}]`, classLabel: `[${abbr.get(r.class).toUpperCase()}] ${r.english}` }))
  rows.push({ class: 'undefined', english: 'undefined', abbrev: '[U]', classLabel: '[U] undefined' })
  rows.sort((a, b) => cmpC(b.classLabel, a.classLabel))
  return rows.map((r, i) => ({ ...r, order: i * 1.15, col: cp(r.classLabel).slice(0, 3).join('') }))   // col = cols_for_radar
}

// all books / authors / entropy tables, once per session
export function prepare(st) {
  const L = labelsRoll(st.compsLabels, st.typesFinal)
  const byClass = new Map(L.map(l => [l.class, l]))
  const uriOf = new Map(st.books.map(b => [Number(b.bookID), b.bookURI]))
  const idOf = new Map(st.books.map(b => [b.bookURI, Number(b.bookID)]))
  const main = new Map(st.mainData.map(r => [r.bookURI, r]))
  // booksClassified (93-122): per book the top type(s) of dataLong (raw scores + undefined, ties kept, in dataLong row
  // order: main_data columns, then undefined); index < 0.1 -> 0 and then label "----"
  const booksClassified = []
  for (const r of st.mainData) {
    const vals = TYPES.map(t => Number(r[t])); const undef = new Set(vals).size === 1 ? 1 : 0
    const all = [...TYPES.map((t, i) => [t, vals[i]]), ['undefined', undef]]
    const top = Math.max(...all.map(x => x[1]))
    for (const [t, v] of all) if (v === top) {
      const index = v < 0.1 ? 0 : v
      booksClassified.push({ bookURI: r.bookURI, authorURI: authorOfURI(r.bookURI), comparables: index === 0 ? '----' : byClass.get(t).classLabel, index })
    }
  }
  // authors (106-112): rolling_authors.final per type
  const authors = new Map()
  for (const r of st.rollingAuthors) { if (!authors.has(r.author)) authors.set(r.author, new Map()); authors.get(r.author).set(r.comps, Number(r.final)) }
  // entropy (38, 77-79): classLabel from cilm via labelsRoll
  const entropy = st.entropy.map(r => ({ ...r, bookID: Number(r.bookID), classLabel: byClass.get(r.cilm)?.classLabel ?? null }))
  const entropyOf = new Map(entropy.map(r => [r.bookURI, r]))
  const urlOf = new Map(st.urls.map(u => [Number(u.bookID), (String(u.URL).match(/href="(https?:[^"]+)"/) ?? [])[1] ?? null]))
  const releasePath = new Map(st.bookLinks.filter(l => l.path).map(l => [l.bookURI, l.path]))
  const linkOf = uri => releasePath.has(uri) ? `https://raw.githubusercontent.com/OpenITI/RELEASE/v2023.1.8/${releasePath.get(uri)}` : (urlOf.get(idOf.get(uri)) ?? null)
  const authorBooks = new Map()
  for (const b of st.books) { const a = authorOfURI(b.bookURI); if (!authorBooks.has(a)) authorBooks.set(a, []); authorBooks.get(a).push(b.bookURI) }
  return { L, byClass, uriOf, idOf, main, booksClassified, authors, entropy, entropyOf, linkOf, authorBooks, labels: st.labels }
}

// radar of one book (radarPlotFunction, 158-363): complete text, mean of the rolling windows, types within +-50 years
export function radarBook(P, bookURI, rolling) {
  const cols = P.L.map(l => l.col).sort(cmpC)                    // theta: colnames(temp), arranged
  const colOfClass = new Map(P.L.map(l => [l.class, l.col]))
  // complete (97-104, 211-216): raw scores, undefined from raw values, then index == 0.1 -> 0
  const r = P.main.get(bookURI); const vals = TYPES.map(t => Number(r[t]))
  const complete = new Map(TYPES.map((t, i) => [colOfClass.get(t), vals[i] === 0.1 ? 0 : vals[i]]))
  complete.set(colOfClass.get('undefined'), new Set(vals).size === 1 ? 1 : 0)
  // rolling (182-201): per window undefined from raw values; index == 0.1 -> 0; mean over windows per type
  let rollingMean = null
  if (rolling.length) {
    const sum = new Map(cols.map(c => [c, 0]))
    for (const w of rolling) {
      const v = TYPES.map(t => w[t]); if (new Set(v).size === 1) sum.set(colOfClass.get('undefined'), sum.get(colOfClass.get('undefined')) + 1)
      TYPES.forEach((t, i) => { const c = colOfClass.get(t); sum.set(c, sum.get(c) + (v[i] === 0.1 ? 0 : v[i])) })
    }
    rollingMean = new Map(cols.map(c => [c, sum.get(c) / rolling.length]))
  }
  // period layer (220-242): top types of books whose death decade is within +-50 years; shares of all such rows
  const cd = Math.ceil(ahOfURI(bookURI) / 10) * 10
  const counts = new Map()
  for (const b of P.booksClassified) {
    const p = Math.ceil(ahOfURI(b.bookURI) / 10) * 10
    if (p >= cd - 50 && p <= cd + 50) { const k = cp(b.comparables).slice(0, 3).join(''); counts.set(k, (counts.get(k) ?? 0) + 1) }
  }
  const total = [...counts.values()].reduce((a, b) => a + b, 0)
  const labels = [...new Set([...counts.keys(), ...cols])].sort(cmpC)   // as R: values in sorted label order
  const period = labels.map(k => (counts.get(k) ?? 0) / total)
  const rows = cols.map((c, i) => ({ axis: c, type: P.L.find(l => l.col === c).classLabel, complete: complete.get(c), rolling: rollingMean ? rollingMean.get(c) : null, period: period[i] }))
  return { rows, hasRolling: !!rollingMean, decade: cd }
}

// rolling type plot (rollingPlotFunctionWithGGPLOT, 524-639): per type the raw scores along the text, offset by order
export function rollingSeries(P, rolling) {
  return P.L.filter(l => l.class !== 'undefined').map(l => ({ class: l.class, classLabel: l.classLabel, order: l.order,
    x: rolling.map(w => w.start), y: rolling.map(w => w[l.class]) }))
}

// entropy boxplots across types (boxPlot_Entropy, 715-767): every book's whole-text entropy by its type
export function entropyAcrossTypes(P, bookURI, which) {
  const col = which === 'unigrams' ? 'EntropyUnigrams2up' : 'EntropyBigrams2up'
  const sel = P.entropyOf.get(bookURI); if (!sel) return null
  const levels = [...new Set(P.entropy.map(r => r.classLabel))].sort(collate)
  const groups = levels.map(lv => { const g = P.entropy.filter(r => r.classLabel === lv)
    return { classLabel: lv, selected: lv === sel.classLabel, values: g.map(r => Number(r[col])), books: g.map(r => r.bookURI) } })
  return { col, levels, groups, selectedClass: sel.classLabel, value: Number(sel[col]) }
}

// entropy within the book's type over time (boxPlot_Entropy_TypeTime, 771-900)
export const PERIOD_LABELS = ['1st/7th', '2nd/8th', '3rd/9th', '4th/10th', '5th/11th', '6th/12th', '7th/13th', '8th/14th', '9th/15th', '10th/16th', '11th/17th', '12th/18th', '13th/19th', '14th/20th', '15th/21st']
const periodLabel = u => PERIOD_LABELS[Math.ceil(ahOfURI(u) / 100) - 1] ?? null
function quantile7(sorted, p) { const h = (sorted.length - 1) * p, lo = Math.floor(h); return sorted[lo] + (h - lo) * (sorted[Math.min(lo + 1, sorted.length - 1)] - sorted[lo]) }
export function entropyTypeTime(P, bookURI, which) {
  const col = which === 'unigrams' ? 'EntropyUnigrams2up' : 'EntropyBigrams2up'
  const sel = P.entropyOf.get(bookURI); if (!sel) return null
  const rows = P.entropy.filter(r => r.classLabel === sel.classLabel)
  const periods = PERIOD_LABELS.filter(pl => rows.some(r => periodLabel(r.bookURI) === pl))
  const groups = periods.map(pl => {
    const g = rows.filter(r => periodLabel(r.bookURI) === pl), values = g.map(r => Number(r[col]))
    const s = [...values].sort((a, b) => a - b), q1 = quantile7(s, 0.25), q3 = quantile7(s, 0.75), iqr = q3 - q1
    const lower = q1 - 1.5 * iqr, upper = q3 + 1.5 * iqr                 // jitter shows only points within the whiskers
    return { period: pl, values, books: g.map(r => r.bookURI), jitter: values.filter(v => v >= lower && v <= upper) }
  })
  return { col, classLabel: sel.classLabel, groups, period: periodLabel(bookURI), value: Number(sel[col]) }
}

// TF-IDF neighbours (tfidfData, 908-934): the stored top 250 in their order; neighbour URI from bookID
export const tfidfTable = (P, rows) => rows.map(r => ({ rank: Number(r.rank), bookURI: P.uriOf.get(Number(r.book2)) ?? null, similarity: Number(r.distance) }))

// author radar (radarPlotFunctionAuthor, 373-494): rolling_authors.final per type, axes in code-point order
export function radarAuthor(P, authorURI) {
  const m = P.authors.get(authorURI); if (!m) return null
  const rows = P.L.filter(l => l.class !== 'undefined').map(l => ({ axis: l.col, type: l.classLabel, final: m.get(l.class) })).sort((a, b) => cmpC(a.axis, b.axis))
  return { rows, max: Math.max(...rows.map(r => r.final)) }
}

// the author's books (authorDataBooks, 503-510): booksClassified rows of the author, arranged by bookURI (stable)
export const authorBooksTable = (P, authorURI) => P.booksClassified.filter(b => b.authorURI === authorURI)
  .map((b, i) => ({ ...b, i })).sort((a, b) => cmpC(a.bookURI, b.bookURI) || a.i - b.i).map(({ bookURI, comparables, index }) => ({ bookURI, comparables, index }))

// headers (headerLocations, 514-520, all levels): position, level, milestone = as.integer(pos / 300)
export const headersTable = rows => rows.map(r => ({ level: Number(r.level), pos: Number(r.pos), milestone: Math.trunc(Number(r.pos) / 300) }))
