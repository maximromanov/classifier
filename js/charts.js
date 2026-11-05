// Book Classifier charts, drawn from the views of compute.js with the shared chart kit (chartkit.js): style, in-chart
// captions, exports.
import { plot, styleOf, narrow, typeBars, shortType, byType, typeLabel, STYLES, GRID, AXIS, MUTED } from './chartkit.js'

// ---- radars ------------------------------------------------------------------------------------------------------
const ring = (theta, r, a) => ({ type: 'scatterpolar', r: theta.map(() => r), theta, fill: 'toself', fillcolor: `rgba(200,200,200,${a})`, line: { color: 'rgba(0,0,0,0)' }, mode: 'lines', hoverinfo: 'skip', showlegend: false })
const layer = (theta, r, name, st) => ({ type: 'scatterpolar', r, theta, name, fill: 'toself', fillcolor: `rgba(${st.rgb},0.3)`, line: { color: st.color, dash: st.dash, width: 2 }, marker: { color: st.color, size: 6 }, mode: 'lines+markers', hovertemplate: `%{theta}: %{r:.4f}<extra>${name}</extra>` })
const axisName = c => (narrow() ? c.replace(/ /g, '<br>').replace(/-/g, '-<br>') : c)
const polarLayout = (range, legend) => ({ margin: { b: 30, l: narrow() ? 75 : 40, r: narrow() ? 75 : 40 }, showlegend: legend, legendRoom: legend ? (narrow() ? 3 : 1) : 0, ...(legend ? { legend: { orientation: 'h', x: 0, y: 1.02, yanchor: 'bottom', font: { size: 13 } } } : {}),
  polar: { domain: { x: [0, 1], y: [0, 0.96] }, radialaxis: { visible: true, range, tickfont: { size: 11 } }, angularaxis: { tickfont: { size: narrow() ? 9 : 12 } } } })

export async function radarBookChart(el, view, { caption, filename }) {
  const theta = view.rows.map(r => axisName(typeLabel(r.type)))          // full type names on the axes
  const traces = [ring(theta, 0.8, 0.2), ring(theta, 0.6, 0.4), ring(theta, 0.4, 0.6), layer(theta, view.rows.map(r => r.period), 'Typology within 100 lunar years', STYLES[2])]
  if (view.hasRolling) traces.push(layer(theta, view.rows.map(r => r.rolling), 'Rolling Assessment', STYLES[1]))
  traces.push(layer(theta, view.rows.map(r => r.complete), 'Complete Text Assessment', STYLES[0]))
  await plot(el, traces, polarLayout([-0.1, 1], true), caption, filename)
}
export async function radarAuthorChart(el, view, { caption, filename }) {
  const theta = view.rows.map(r => axisName(typeLabel(r.type))), traces = []
  if (view.max > 0.8) traces.push(ring(theta, 0.8, 0.2)); if (view.max > 0.6) traces.push(ring(theta, 0.6, 0.4)); if (view.max > 0.4) traces.push(ring(theta, 0.4, 0.6))
  traces.push(layer(theta, view.rows.map(r => r.final), 'complete', STYLES[0]))
  await plot(el, traces, polarLayout([-0.1, view.max], false), caption, filename)
}

// ---- bars: the same grouped bars as NgramReader's Together mode ----------------------------------------------------------
const num = v => (v === null || v === undefined ? 'n/a' : v.toFixed(3))
export async function bookBarsChart(el, view, { caption, filename }) {
  const layers = [['complete', 'Complete Text Assessment', 0], ...(view.hasRolling ? [['rolling', 'Rolling Assessment', 1]] : []), ['period', 'Typology within 100 lunar years', 2]]
  const rows = [...view.rows].sort((a, b) => byType(a.type, b.type))
  await typeBars(el, { types: rows.map(r => r.type), scale: 'score', xTitle: 'score (complete text, rolling windows); share of books (period)', caption, filename,
    series: layers.map(([k, name, index]) => ({ name, index, values: rows.map(r => r[k]), hover: rows.map(r => `${name}: ${num(r[k])}`) })) })
}
export async function rankedTypesChart(el, view, { caption, filename }) {
  const rows = [...view.rows].sort((a, b) => byType(a.type, b.type))
  await typeBars(el, { types: rows.map(r => r.type), scale: 'score', xTitle: 'mean rolling score', caption, filename,
    series: [{ name: 'score', index: 0, values: rows.map(r => r.final), text: rows.map(r => r.final.toFixed(2)), hover: rows.map(r => `mean rolling score ${num(r.final)}`) }] })
}
export async function topTypesChart(el, top, { caption, filename }) {
  await typeBars(el, { types: top.rows.map(r => r.type), scale: 'count', xTitle: 'books', caption, filename,
    series: [{ name: 'books', index: 0, values: top.rows.map(r => r.books), text: top.rows.map(r => r.books.toLocaleString('en')), hover: top.rows.map(r => `${r.books.toLocaleString('en')} book${r.books === 1 ? '' : 's'}`) }] })
}
// all books at a glance: one column per book, one row per type; darker = higher score
export async function allBooksChart(el, m, { caption, filename }) {
  const y = m.types.map(t => (narrow() ? shortType(typeLabel(t.type)) : typeLabel(t.type))), st = STYLES[0]
  await plot(el, [{ type: 'heatmap', x: m.books.map((_, i) => i), y, z: m.types.map(t => m.books.map(b => b.scores[t.class])), text: m.types.map(() => m.books.map(b => b.label)), zmin: 0, zmax: 1, xgap: m.books.length > 300 ? 0 : 1, ygap: 1,
    colorscale: [[0, '#ffffff'], [0.25, `rgba(${st.rgb},0.3)`], [1, '#123c63']], colorbar: { thickness: 10, len: 0.8, outlinewidth: 0, title: { text: 'score', font: { size: 12 } }, tickfont: { size: 11 } }, hovertemplate: '%{text}<br>%{y}: %{z:.3f}<extra></extra>' }],
  { margin: { l: narrow() ? 112 : 240, r: 16, b: 46 }, showlegend: false, hovermode: 'closest', plotHeight: 340, xaxis: { showticklabels: false, showgrid: false, zeroline: false, ticks: '', fixedrange: true, title: { text: `${m.books.length.toLocaleString('en')} book${m.books.length === 1 ? '' : 's'}, grouped by top type`, font: { size: 12 } } },
    yaxis: { type: 'category', autorange: 'reversed', tickfont: { size: narrow() ? 11 : 12 }, showgrid: false, fixedrange: true } }, caption, filename)
}

// ---- through the text: rolling type scores and rolling entropy on one x axis ------------------------------------------
// display only: above MAXPTS windows, each bin of windows keeps its maximum per type (peaks stay visible); the downloads
// hold every window
const MAXPTS = 2500
const binsOf = n => (n <= MAXPTS ? null : Math.ceil(n / MAXPTS))
function downsample(x, ys, k) {
  if (!k) return { x, ys }
  const X = [], Y = ys.map(() => [])
  for (let i = 0; i < x.length; i += k) { X.push(x[i]); ys.forEach((y, j) => { let m = -Infinity; for (let t = i; t < Math.min(i + k, x.length); t++) if (y[t] > m) m = y[t]; Y[j].push(m) }) }
  return { x: X, ys: Y }
}
// confirmed headers: thin solid black; unconfirmed: thin dashed grey
export const headerShapes = (headers, levels) => headers.filter(h => levels.has(h.level)).map(h => ({ type: 'line', xref: 'x', yref: 'paper', x0: h.pos, x1: h.pos, y0: 0, y1: 1, layer: 'above', line: h.confirmed ? { color: 'black', width: 0.7 } : { color: '#8a8a8a', width: 0.7, dash: '3px,3px' } }))
const TYPE_PLOT = 470, ENTROPY_PLOT = 400                       // plot heights in px
// the two plots stand one above the other: same left and right margins and x range, so positions line up
const alongText = (range, extra) => ({ margin: { l: narrow() ? 60 : 240, r: 14, b: 56 }, hovermode: 'closest', exportHeight: { slide: 900, paper: 1000 }, xaxis: { range, tickformat: '~s', showgrid: false, linecolor: AXIS, title: { text: 'Position in the text (tokens)', font: { size: 12 } } }, ...extra })

export async function rollingChart(el, series, { caption, filename, shapes, range }) {
  const sorted = [...series].sort((a, b) => byType(a.classLabel, b.classLabel)), pos = s => (sorted.length - 1 - sorted.indexOf(s)) * 1.15   // the common order, read from the top
  const st = STYLES[0], k = binsOf(series[0].x.length), d = downsample(series[0].x, series.map(s => s.y), k), traces = []
  series.forEach((s, j) => {
    const base = d.x.map(() => pos(s)), y1 = d.ys[j].map(v => v + pos(s))
    traces.push({ type: 'scatter', x: d.x, y: base, mode: 'lines', line: { color: '#d6d6d6', width: 0.8 }, hoverinfo: 'skip', showlegend: false })
    traces.push({ type: 'scatter', x: d.x, y: y1, mode: 'lines', fill: 'tonexty', fillcolor: `rgba(${st.rgb},0.6)`, line: { color: st.color, width: 0.8 }, showlegend: false, customdata: d.ys[j], hovertemplate: `${typeLabel(s.classLabel)}<br>window from token %{x:,}<br>score %{customdata:.4f}<extra></extra>` })
  })
  await plot(el, traces, alongText(range, { plotHeight: TYPE_PLOT, showlegend: false, shapes, yaxis: { tickvals: series.map(pos), ticktext: series.map(s => (narrow() ? typeLabel(s.classLabel).slice(0, 5) : typeLabel(s.classLabel))), tickfont: { size: 12 }, zeroline: false, showgrid: false, fixedrange: true } }), caption, filename)
  return { downsampled: !!k, binSize: k ?? 1 }
}
export async function entropyLineChart(el, rows, { caption, filename, shapes, range }) {
  const x = rows.map(r => r.start), k = binsOf(x.length), d = downsample(x, [rows.map(r => r.ENTRPOYUNI), rows.map(r => r.ENTROPYBI)], k), [a, b] = [STYLES[0], STYLES[1]]
  await plot(el, [{ type: 'scatter', x: d.x, y: d.ys[0], mode: 'lines', name: 'unigram entropy', line: { color: a.color, dash: a.dash, width: 1.4 } }, { type: 'scatter', x: d.x, y: d.ys[1], mode: 'lines', name: 'bigram entropy', line: { color: b.color, dash: b.dash, width: 1.4 } }],
    alongText(range, { plotHeight: ENTROPY_PLOT, showlegend: true, legendRoom: 1, legend: { orientation: 'h', x: 0, y: 1, yanchor: 'bottom', font: { size: 13 } }, shapes, yaxis: { gridcolor: GRID, zeroline: false, linecolor: AXIS, title: { text: 'entropy', font: { size: 12 } } } }), caption, filename)
  return { downsampled: !!k, binSize: k ?? 1 }
}

// ---- entropy boxplots ---------------------------------------------------------------------------------------------
const jit = (i, w) => ((Math.sin(i * 12.9898) * 43758.5453) % 1) * w     // deterministic jitter (the R app's is random)
const HI = STYLES[1]
export async function boxTypesChart(el, view, { caption, filename }) {
  const traces = [], levels = [...view.levels].sort(byType).reverse()      // the common order, read from the top
  view.groups.forEach(g => {
    traces.push({ type: 'box', orientation: 'h', x: g.values, y: g.values.map(() => typeLabel(g.classLabel)), name: typeLabel(g.classLabel), boxpoints: false, fillcolor: g.selected ? `rgba(${HI.rgb},0.55)` : 'rgba(0,0,0,0.3)', line: { color: 'black', width: 1 }, showlegend: false, hoverinfo: 'x' })
    traces.push({ type: 'scatter', mode: 'markers', x: g.values, y: g.values.map((_, i) => levels.indexOf(g.classLabel) + jit(i + 1, 0.5)), yaxis: 'y2', marker: { color: 'rgba(0,0,0,0.25)', size: 3 }, hoverinfo: 'skip', showlegend: false })
  })
  const n = levels.length
  await plot(el, traces, { margin: { l: narrow() ? 92 : 240, r: 14, b: 56 }, showlegend: false, height: 600, exportHeight: { slide: 900, paper: 1100 },
    yaxis: { type: 'category', categoryorder: 'array', categoryarray: levels.map(typeLabel), range: [-0.5, n - 0.5], tickfont: { size: narrow() ? 9 : 12 } }, yaxis2: { overlaying: 'y', range: [-0.5, n - 0.5], visible: false },
    xaxis: { title: { text: view.col, font: { size: 12 } }, gridcolor: GRID, zeroline: false },
    shapes: [{ type: 'line', xref: 'x', yref: 'paper', x0: view.value, x1: view.value, y0: 0, y1: 1, line: { color: HI.color, width: 2 } }] }, caption, filename)
}
export async function boxTypeTimeChart(el, view, { caption, filename }) {
  const traces = [], cats = view.groups.map(g => g.period)
  view.groups.forEach(g => {
    traces.push({ type: 'box', x: g.values.map(() => g.period), y: g.values, name: g.period, boxpoints: false, fillcolor: 'rgba(0,0,0,0.3)', line: { color: 'black', width: 1 }, showlegend: false, hoverinfo: 'y' })
    traces.push({ type: 'scatter', mode: 'markers', x: g.jitter.map((_, i) => cats.indexOf(g.period) + jit(i + 1, 0.5)), y: g.jitter, xaxis: 'x2', marker: { color: 'rgba(0,0,0,0.2)', size: 4 }, hoverinfo: 'skip', showlegend: false })
  })
  const n = cats.length, pi = cats.indexOf(view.period)
  await plot(el, traces, { margin: { l: 60, r: 14, b: 70 }, showlegend: false, height: 560, exportHeight: { slide: 900, paper: 1100 },
    xaxis: { type: 'category', categoryorder: 'array', categoryarray: cats, range: [-0.5, n - 0.5], title: { text: 'Century (AH/CE)', font: { size: 12 } } }, xaxis2: { overlaying: 'x', range: [-0.5, n - 0.5], visible: false },
    yaxis: { title: { text: view.col, font: { size: 12 } }, gridcolor: GRID, zeroline: false },
    shapes: [{ type: 'line', xref: 'paper', yref: 'y', x0: 0, x1: 1, y0: view.value, y1: view.value, line: { color: HI.color, width: 1.6, dash: 'dot' } },
      ...(pi >= 0 ? [{ type: 'line', xref: 'x2', yref: 'paper', x0: pi, x1: pi, y0: 0, y1: 1, line: { color: HI.color, width: 1.6, dash: 'dot' } }] : [])] }, caption, filename)
}
