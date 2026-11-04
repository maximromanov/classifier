// Book Classifier charts, drawn from the views of compute.js with the shared chart kit (chartkit.js): style, in-chart
// captions, exports.
import { plot, styleOf, narrow, STYLES, GRID, AXIS, MUTED } from './chartkit.js'

// ---- radars ------------------------------------------------------------------------------------------------------
const ring = (theta, r, a) => ({ type: 'scatterpolar', r: theta.map(() => r), theta, fill: 'toself', fillcolor: `rgba(200,200,200,${a})`, line: { color: 'rgba(0,0,0,0)' }, mode: 'lines', hoverinfo: 'skip', showlegend: false })
const layer = (theta, r, name, st) => ({ type: 'scatterpolar', r, theta, name, fill: 'toself', fillcolor: `rgba(${st.rgb},0.3)`, line: { color: st.color, dash: st.dash, width: 2 }, marker: { color: st.color, size: 6 }, mode: 'lines+markers', hovertemplate: `%{theta}: %{r:.4f}<extra>${name}</extra>` })
const axisName = c => (narrow() ? c.replace(/ /g, '<br>').replace(/-/g, '-<br>') : c)
const polarLayout = (range, legend) => ({ margin: { b: 30, l: narrow() ? 75 : 40, r: narrow() ? 75 : 40 }, showlegend: legend, legendRoom: legend, ...(legend ? { legend: { orientation: 'h', x: 0, y: 1.02, yanchor: 'bottom', font: { size: 13 } } } : {}),
  polar: { domain: { x: [0, 1], y: [0, 0.96] }, radialaxis: { visible: true, range, tickfont: { size: 11 } }, angularaxis: { tickfont: { size: narrow() ? 9 : 12 } } } })

export async function radarBookChart(el, view, { caption, filename }) {
  const theta = view.rows.map(r => axisName(r.type))                     // full type names on the axes
  const traces = [ring(theta, 0.8, 0.2), ring(theta, 0.6, 0.4), ring(theta, 0.4, 0.6), layer(theta, view.rows.map(r => r.period), 'Typology within 100 lunar years', STYLES[2])]
  if (view.hasRolling) traces.push(layer(theta, view.rows.map(r => r.rolling), 'Rolling Assessment', STYLES[1]))
  traces.push(layer(theta, view.rows.map(r => r.complete), 'Complete Text Assessment', STYLES[0]))
  await plot(el, traces, polarLayout([-0.1, 1], true), caption, filename)
}
export async function radarAuthorChart(el, view, { caption, filename }) {
  const theta = view.rows.map(r => axisName(r.type)), traces = []
  if (view.max > 0.8) traces.push(ring(theta, 0.8, 0.2)); if (view.max > 0.6) traces.push(ring(theta, 0.6, 0.4)); if (view.max > 0.4) traces.push(ring(theta, 0.4, 0.6))
  traces.push(layer(theta, view.rows.map(r => r.final), 'complete', STYLES[0]))
  await plot(el, traces, polarLayout([-0.1, view.max], false), caption, filename)
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
export const TYPE_PANEL = 470, ENTROPY_PANEL = 400              // plot heights in px; the entropy panel: about twice its v1 height relative to the type panel
// confirmed headers: thin solid black; unconfirmed: thin dashed grey
export const headerShapes = (headers, levels) => headers.filter(h => levels.has(h.level)).map(h => ({ type: 'line', xref: 'x', yref: 'paper', x0: h.pos, x1: h.pos, y0: 0, y1: 1, layer: 'above', line: h.confirmed ? { color: 'black', width: 0.7 } : { color: '#8a8a8a', width: 0.7, dash: '3px,3px' } }))

export async function throughTextChart(el, series, entropyRows, { caption, filename, shapes }) {
  const has = series?.length && series[0].x.length, hasE = entropyRows?.length, traces = []
  const st = STYLES[0], layout = { margin: { l: narrow() ? 60 : 240, r: 14, b: 56 }, showlegend: false, hovermode: 'closest', shapes, height: 170 + (has ? TYPE_PANEL : 0) + (hasE ? ENTROPY_PANEL : 0) + 110, exportHeight: { slide: 900, paper: 1300 } }
  const gap = has && hasE ? 0.05 : 0, h1 = has ? (hasE ? (1 - gap) * TYPE_PANEL / (TYPE_PANEL + ENTROPY_PANEL) : 1) : 0
  let info = {}
  if (has) {
    const k = binsOf(series[0].x.length), d = downsample(series[0].x, series.map(s => s.y), k); info.rolling = { downsampled: !!k, binSize: k ?? 1 }
    series.forEach((s, j) => {
      const base = d.x.map(() => s.order), y1 = d.ys[j].map(v => v + s.order)
      traces.push({ type: 'scatter', x: d.x, y: base, mode: 'lines', line: { color: '#d6d6d6', width: 0.8 }, hoverinfo: 'skip', showlegend: false })
      traces.push({ type: 'scatter', x: d.x, y: y1, mode: 'lines', fill: 'tonexty', fillcolor: `rgba(${st.rgb},0.6)`, line: { color: st.color, width: 0.8 }, showlegend: false, customdata: d.ys[j], hovertemplate: `${s.classLabel}<br>window from token %{x:,}<br>score %{customdata:.4f}<extra></extra>` })
    })
    layout.yaxis = { domain: [1 - h1, 1], tickvals: series.map(s => s.order), ticktext: series.map(s => (narrow() ? s.classLabel.slice(0, 3) : s.classLabel)), tickfont: { size: 12 }, zeroline: false, showgrid: false, fixedrange: true }
  }
  if (hasE) {
    const x = entropyRows.map(r => r.start), k = binsOf(x.length), d = downsample(x, [entropyRows.map(r => r.ENTRPOYUNI), entropyRows.map(r => r.ENTROPYBI)], k); info.entropy = { downsampled: !!k, binSize: k ?? 1 }
    const ya = has ? 'y2' : 'y', [a, b] = [STYLES[0], STYLES[1]]
    traces.push({ type: 'scatter', x: d.x, y: d.ys[0], yaxis: ya, mode: 'lines', name: 'unigram entropy', line: { color: a.color, dash: a.dash, width: 1.4 } })
    traces.push({ type: 'scatter', x: d.x, y: d.ys[1], yaxis: ya, mode: 'lines', name: 'bigram entropy', line: { color: b.color, dash: b.dash, width: 1.4 } })
    layout[has ? 'yaxis2' : 'yaxis'] = { domain: [0, has ? 1 - h1 - gap : 1], gridcolor: GRID, zeroline: false, linecolor: AXIS, title: { text: 'entropy', font: { size: 12 } } }
    layout.showlegend = true; layout.legend = { orientation: 'h', x: 0, xanchor: 'left', y: (has ? 1 - h1 - gap : 1) + 0.002, yanchor: 'bottom', font: { size: 12 }, bgcolor: 'rgba(255,255,255,0.8)' }
  }
  layout.xaxis = { anchor: has && hasE ? 'y2' : 'y', tickformat: '~s', showgrid: false, linecolor: AXIS, title: { text: 'Position in the text (tokens)', font: { size: 12 } } }
  await plot(el, traces, layout, caption, filename)
  return info
}

// ---- entropy boxplots ---------------------------------------------------------------------------------------------
const jit = (i, w) => ((Math.sin(i * 12.9898) * 43758.5453) % 1) * w     // deterministic jitter (the R app's is random)
const HI = STYLES[1]
export async function boxTypesChart(el, view, { caption, filename }) {
  const traces = []
  view.groups.forEach(g => {
    traces.push({ type: 'box', orientation: 'h', x: g.values, y: g.values.map(() => g.classLabel), name: g.classLabel, boxpoints: false, fillcolor: g.selected ? `rgba(${HI.rgb},0.55)` : 'rgba(0,0,0,0.3)', line: { color: 'black', width: 1 }, showlegend: false, hoverinfo: 'x' })
    traces.push({ type: 'scatter', mode: 'markers', x: g.values, y: g.values.map((_, i) => view.levels.indexOf(g.classLabel) + jit(i + 1, 0.5)), yaxis: 'y2', marker: { color: 'rgba(0,0,0,0.25)', size: 3 }, hoverinfo: 'skip', showlegend: false })
  })
  const n = view.levels.length
  await plot(el, traces, { margin: { l: narrow() ? 92 : 240, r: 14, b: 56 }, showlegend: false, height: 600, exportHeight: { slide: 900, paper: 1100 },
    yaxis: { type: 'category', categoryorder: 'array', categoryarray: view.levels, range: [-0.5, n - 0.5], tickfont: { size: narrow() ? 9 : 12 } }, yaxis2: { overlaying: 'y', range: [-0.5, n - 0.5], visible: false },
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
