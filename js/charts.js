// Charts (plotly.js, loaded on first use), drawn from the views of compute.js. Styling stays close to the deployed
// R app (dark green type signals, grey rings, red/yellow radar layers, black/green entropy lines); a redesign for both
// apps comes later. Each chart can be saved as SVG or PNG (config() copied from maximromanov/ngramreader@77f305a).
import { LIBS } from './config.js'

let plotlyPromise
export const loadPlotly = () => (plotlyPromise ??= new Promise((resolve, reject) => {
  if (window.Plotly) return resolve(window.Plotly)
  const s = document.createElement('script'); s.src = LIBS.plotly; s.onload = () => resolve(window.Plotly); s.onerror = reject
  document.head.appendChild(s)
}))
const font = { family: 'Georgia, "Times New Roman", serif', size: 13 }
function config(filename) {
  const save = format => ({
    name: `Download ${format.toUpperCase()}`, title: `Download ${format.toUpperCase()}`,
    icon: { width: 1000, height: 1000, path: 'M500 50 L500 700 M250 450 L500 700 L750 450 M150 900 L850 900', transform: '' },
    click: gd => window.Plotly.downloadImage(gd, { format, filename, width: Math.max(gd.offsetWidth, 900), height: Math.max(gd.offsetHeight, 500) }),
  })
  return { responsive: true, displaylogo: false, modeBarButtonsToRemove: ['toImage', 'lasso2d', 'select2d'], modeBarButtonsToAdd: [save('svg'), save('png')] }
}
const narrow = () => innerWidth < 600
const kfmt = x => `${(x / 1000).toFixed(1)} k`

// ---- radars ----------------------------------------------------------------------------------------------------
const ring = (theta, r, a) => ({ type: 'scatterpolar', r: theta.map(() => r), theta, fill: 'toself', fillcolor: `rgba(200,200,200,${a})`, line: { color: 'rgba(0,0,0,0)' }, mode: 'lines', hoverinfo: 'skip', showlegend: false })
const layer = (theta, r, name, rgb) => ({ type: 'scatterpolar', r, theta, name, fill: 'toself', fillcolor: `rgba(${rgb},0.6)`, line: { color: `rgba(${rgb},0.6)` }, marker: { color: `rgb(${rgb})` }, mode: 'lines+markers',
  hovertemplate: '%{theta}: %{r:.4f}<extra>' + name + '</extra>' })
const polar = range => ({ radialaxis: { visible: true, range }, angularaxis: { tickfont: { size: narrow() ? 9 : 12 } } })

export async function radarBookChart(el, view, { filename }) {
  const Plotly = await loadPlotly(); const theta = view.rows.map(r => r.type)   // full type names on the axes
  const traces = [ring(theta, 0.8, 0.2), ring(theta, 0.6, 0.4), ring(theta, 0.4, 0.6),
    layer(theta, view.rows.map(r => r.period), 'Typology within 100 lunar years', '255,0,0')]
  if (view.hasRolling) traces.push(layer(theta, view.rows.map(r => r.rolling), 'Rolling Assessment', '255,255,0'))
  traces.push(layer(theta, view.rows.map(r => r.complete), 'Complete Text Assessment', '0,100,0'))
  await Plotly.react(el, traces, { font, polar: polar([-0.1, 1]), showlegend: true, legend: { orientation: 'h', y: -0.12 }, margin: { t: 30, b: 30, l: 40, r: 40 } }, config(filename))
}
export async function radarAuthorChart(el, view, { filename }) {
  const Plotly = await loadPlotly(); const theta = view.rows.map(r => r.type)
  const traces = []
  if (view.max > 0.8) traces.push(ring(theta, 0.8, 0.2)); if (view.max > 0.6) traces.push(ring(theta, 0.6, 0.4)); if (view.max > 0.4) traces.push(ring(theta, 0.4, 0.6))
  traces.push(layer(theta, view.rows.map(r => r.final), 'complete', '0,100,0'))
  await Plotly.react(el, traces, { font, polar: polar([-0.1, view.max]), showlegend: false, margin: { t: 30, b: 30, l: 40, r: 40 } }, config(filename))
}

// ---- rolling plots -----------------------------------------------------------------------------------------------
// display only: above MAXPTS windows, each bin of windows keeps its maximum per type (peaks stay visible); the
// downloads hold every window
const MAXPTS = 2500
function binsOf(n) { const k = Math.ceil(n / MAXPTS); return n <= MAXPTS ? null : k }
function downsample(x, ys, k) {
  if (!k) return { x, ys }
  const X = [], Y = ys.map(() => [])
  for (let i = 0; i < x.length; i += k) { X.push(x[i]); ys.forEach((y, j) => { let m = -Infinity; for (let t = i; t < Math.min(i + k, x.length); t++) if (y[t] > m) m = y[t]; Y[j].push(m) }) }
  return { x: X, ys: Y }
}
export const headerShapes = (headers, levels) => headers.filter(h => levels.has(h.level)).map(h => ({ type: 'line', xref: 'x', yref: 'paper', x0: h.pos, x1: h.pos, y0: 0, y1: 1, line: { color: 'black', width: 0.6 }, layer: 'above' }))

export async function rollingChart(el, series, { filename, bookTitle }) {
  const Plotly = await loadPlotly()
  const k = binsOf(series[0].x.length); const d = downsample(series[0].x, series.map(s => s.y), k)
  const traces = []
  series.forEach((s, j) => {
    const base = d.x.map(() => s.order), y1 = d.ys[j].map(v => v + s.order), y2 = d.ys[j].map(v => (v === 0 ? null : v + s.order))
    traces.push({ type: 'scatter', x: d.x, y: base, mode: 'lines', line: { color: 'darkgreen', width: 0.4 }, hoverinfo: 'skip', showlegend: false })
    traces.push({ type: 'scatter', x: d.x, y: y1, mode: 'lines', fill: 'tonexty', fillcolor: 'rgba(0,100,0,0.5)', line: { color: 'darkgreen', width: 0.4 }, showlegend: false,
      customdata: d.ys[j], hovertemplate: `${s.classLabel}<br>window from token %{x:,}<br>score %{customdata:.4f}<extra></extra>` })
    traces.push({ type: 'scatter', x: d.x, y: y2, mode: 'lines', line: { color: 'darkgreen', width: 1.4 }, connectgaps: false, hoverinfo: 'skip', showlegend: false })
  })
  await Plotly.react(el, traces, {
    font, title: { text: `Rolling assessment of: ${bookTitle}`, font: { size: 14 }, x: 0 }, margin: { t: 40, r: 10, b: 40, l: narrow() ? 110 : 260 },
    yaxis: { tickvals: series.map(s => s.order), ticktext: series.map(s => narrow() ? s.classLabel.slice(0, 3) : s.classLabel), tickfont: { size: 12 }, zeroline: false, showgrid: false, fixedrange: true },
    xaxis: { tickformat: '~s', ticksuffix: '', showgrid: false, title: { text: 'position in the text (tokens)', font: { size: 11 } } },
    showlegend: false, hovermode: 'closest',
  }, config(filename))
  return { downsampled: !!k, binSize: k ?? 1 }
}
export async function entropyLineChart(el, rows, { filename }) {
  const Plotly = await loadPlotly(); const x = rows.map(r => r.start)
  const k = binsOf(x.length); const d = downsample(x, [rows.map(r => r.ENTRPOYUNI), rows.map(r => r.ENTROPYBI)], k)
  await Plotly.react(el, [
    { type: 'scatter', x: d.x, y: d.ys[0], mode: 'lines', name: 'unigram entropy', line: { color: 'darkgreen', width: 1 } },
    { type: 'scatter', x: d.x, y: d.ys[1], mode: 'lines', name: 'bigram entropy', line: { color: 'black', width: 1 } },
  ], { font, margin: { t: 20, r: 10, b: 40, l: 50 }, legend: { orientation: 'h', y: 1.1 }, xaxis: { tickformat: '~s', showgrid: false, title: { text: 'position in the text (tokens)', font: { size: 11 } } }, yaxis: { gridcolor: '#e5e5e5' } }, config(filename))
  return { downsampled: !!k, binSize: k ?? 1 }
}

// ---- entropy boxplots ----------------------------------------------------------------------------------------------
// deterministic jitter (the R app uses random jitter)
const jit = (i, w) => ((Math.sin(i * 12.9898) * 43758.5453) % 1) * w
export async function boxTypesChart(el, view, { filename }) {
  const Plotly = await loadPlotly(); const traces = []
  view.groups.forEach(g => {
    traces.push({ type: 'box', orientation: 'h', x: g.values, y: g.values.map(() => g.classLabel), name: g.classLabel, boxpoints: false, fillcolor: g.selected ? 'rgba(255,0,0,0.5)' : 'rgba(0,0,0,0.5)', line: { color: 'black', width: 1 }, showlegend: false, hoverinfo: 'x' })
    traces.push({ type: 'scatter', mode: 'markers', x: g.values, y: g.values.map((_, i) => view.levels.indexOf(g.classLabel) + jit(i + 1, 0.5)), yaxis: 'y2', marker: { color: 'rgba(0,0,0,0.25)', size: 3 }, hoverinfo: 'skip', showlegend: false })
  })
  const n = view.levels.length
  await Plotly.react(el, traces, {
    font, margin: { t: 10, r: 10, b: 40, l: narrow() ? 90 : 260 }, showlegend: false,
    yaxis: { type: 'category', categoryorder: 'array', categoryarray: view.levels, range: [-0.5, n - 0.5], tickfont: { size: narrow() ? 9 : 12 } },
    yaxis2: { overlaying: 'y', range: [-0.5, n - 0.5], visible: false },
    xaxis: { title: { text: view.col, font: { size: 11 } }, gridcolor: '#e5e5e5' },
    shapes: [{ type: 'line', xref: 'x', yref: 'paper', x0: view.value, x1: view.value, y0: 0, y1: 1, line: { color: 'red', width: 2 } }],
  }, config(filename))
}
export async function boxTypeTimeChart(el, view, { filename }) {
  const Plotly = await loadPlotly(); const traces = []; const cats = view.groups.map(g => g.period)
  view.groups.forEach(g => {
    traces.push({ type: 'box', x: g.values.map(() => g.period), y: g.values, name: g.period, boxpoints: false, fillcolor: 'rgba(0,0,0,0.5)', line: { color: 'black', width: 1 }, showlegend: false, hoverinfo: 'y' })
    traces.push({ type: 'scatter', mode: 'markers', x: g.jitter.map((_, i) => cats.indexOf(g.period) + jit(i + 1, 0.5)), y: g.jitter, xaxis: 'x2', marker: { color: 'rgba(0,0,0,0.2)', size: 4 }, hoverinfo: 'skip', showlegend: false })
  })
  const n = cats.length, pi = cats.indexOf(view.period)
  await Plotly.react(el, traces, {
    font, margin: { t: 10, r: 10, b: 50, l: 50 }, showlegend: false,
    xaxis: { type: 'category', categoryorder: 'array', categoryarray: cats, range: [-0.5, n - 0.5] }, xaxis2: { overlaying: 'x', range: [-0.5, n - 0.5], visible: false },
    yaxis: { title: { text: view.col, font: { size: 11 } }, gridcolor: '#e5e5e5' },
    shapes: [{ type: 'line', xref: 'paper', yref: 'y', x0: 0, x1: 1, y0: view.value, y1: view.value, line: { color: 'red', width: 1.5, dash: 'dot' } },
      ...(pi >= 0 ? [{ type: 'line', xref: 'x2', yref: 'paper', x0: pi, x1: pi, y0: 0, y1: 1, line: { color: 'red', width: 1.5, dash: 'dot' } }] : [])],
  }, config(filename))
}
export { kfmt }
