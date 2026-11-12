// Citations of a result (shared by both apps; keep both copies the same) in Chicago, APA, BibTeX and RIS.
import { autolink } from './link.js'
// c = { title (of the result, *…* = italics), app, released, year, version, doi, data, search, accessed (YYYY-MM-DD), link, key }
const apaDate = d => { const [md, y] = d.split(', '); return `${y}, ${md}` }      // November 5, 2026 -> 2026, November 5
// asterisks of a search or a link (\w*) are text, not italics: kept apart from the *…* markers until the citation is laid out
const lit = s => s.replace(/\*/g, '\uE002')
export const unlit = s => s.replace(/\uE002/g, '*')
// a part of a search (label or item) to be shown in its own direction: between these two markers; the dialog shows <bdi>,
// every copied or downloaded text drops them (unIso)
export const ISO = ['\uE003', '\uE004']
export const unIso = s => s.replace(/[\uE003\uE004]/g, '')
const plain = s => s.replace(/\*/g, '')
const bib = s => plain(s).replace(/\\/g, '\\textbackslash{}').replace(/([&%$#_{}])/g, '\\$1')
export const FORMATS = {
  chicago: { label: 'Chicago', html: true, make: c => `Romanov, Maxim. “${c.title}.” In *${c.app}*. Zenodo, released ${c.released}. https://doi.org/${c.doi}. Data: ${c.data}. Search: ${lit(c.search)}. Accessed ${c.accessed}. ${lit(c.link)}.` },
  apa: { label: 'APA', html: true, make: c => `Romanov, M. (${apaDate(c.released)}). ${c.title}. In *${c.app}*. Zenodo. https://doi.org/${c.doi}. Data: ${c.data}. Search: ${lit(c.search)}. Retrieved ${c.accessed}, from ${lit(c.link)}` },
  bibtex: { label: 'BibTeX', make: c => `@misc{${c.key},\n  author = {Romanov, Maxim},\n  title = {${bib(c.title)}},\n  howpublished = {In ${bib(c.app)}},\n  year = {${c.year}},\n  publisher = {Zenodo},\n  doi = {${c.doi}},\n  url = {${c.link.replace(/([#%])/g, '\\$1')}},\n  urldate = {${c.accessed}},\n  note = {Data: ${bib(c.data)}. Search: ${unlit(bib(lit(c.search)))}}\n}` },
  ris: { label: 'RIS', make: c => [['TY', 'DATA'], ['AU', 'Romanov, Maxim'], ['PY', c.year], ['TI', plain(c.title)], ['T2', c.app], ['ET', c.version], ['PB', 'Zenodo'], ['DO', c.doi], ['UR', c.link], ['Y2', c.accessed.replace(/-/g, '/')], ['N1', `Data: ${c.data}. Search: ${c.search}`], ['ER', '']].map(([k, v]) => `${k}  - ${v}`).join('\n') },
}

// the app itself, when there is no result to cite yet (c.whole): the citation as ruled, and the formats derived from it
const WHOLE = {
  chicago: c => `Romanov, Maxim. *${c.app}*. Zenodo, released ${c.released}. https://doi.org/${c.doi}.`,
  apa: c => `Romanov, M. (${apaDate(c.released)}). *${c.app}*. Zenodo. https://doi.org/${c.doi}`,
  bibtex: c => `@software{${c.key},\n  author = {Romanov, Maxim},\n  title = {${bib(c.app)}},\n  year = {${c.year}},\n  publisher = {Zenodo},\n  doi = {${c.doi}},\n  url = {https://doi.org/${c.doi}}\n}`,
  ris: c => [['TY', 'COMP'], ['AU', 'Romanov, Maxim'], ['PY', c.year], ['TI', c.app], ['PB', 'Zenodo'], ['DO', c.doi], ['UR', `https://doi.org/${c.doi}`], ['ER', '']].map(([k, v]) => `${k}  - ${v}`).join('\n'),
}
for (const [k, f] of Object.entries(FORMATS)) { const make = f.make; f.make = c => (c.whole ? WHOLE[k](c) : make(c)) }

// the citation inside a chart: Chicago, without the search lines (the chart's subtitle has them), with the data commit
export const chartCitation = (c, commit) => `<b>Cite as:</b> Romanov, Maxim. “${c.title}.” In *${c.app}*. Zenodo, released ${c.released}. https://doi.org/${c.doi}. Data: ${c.data} (data commit ${commit}). Accessed ${c.accessed}. ${lit(c.link)}.`.replace(/\*([^*]+)\*/g, '<i>$1</i>').replace(/\uE002/g, '*')

// ---- Markdown (the Cite dialog's "Copy as Markdown" and "Copy all as Markdown") -------------------------------------------
// Chicago and APA: titles in *…*, the search in a code span (so \w*, _ and * survive), DOIs and the link as autolinks <…>;
// other text with the Markdown characters escaped. BibTeX and RIS: fenced code blocks, unchanged inside.
const mdEsc = s => String(s).replace(/[\\`*_[\]<>#|]/g, '\\$&')
// plain text with its URLs as autolinks
const mdText = s => String(s).split(/(https?:\/\/[^\s]+[^\s.,;)])/).map((p, i) => (i % 2 ? autolink(p) : mdEsc(p))).join('')
// a title: its *…* are italics, everything else is text
const mdTitle = s => String(s).split(/\*([^*]+)\*/).map((p, i) => (i % 2 ? `*${mdEsc(p)}*` : mdEsc(p))).join('')
// a code span long enough for any backticks inside
const mdCode = s => { const t = unIso(unlit(s)), run = Math.max(0, ...(t.match(/`+/g) ?? []).map(x => x.length)), f = '`'.repeat(run + 1), pad = /^`|`$/.test(t) ? ' ' : ''; return `${f}${pad}${t}${pad}${f}` }
const doi = c => autolink(`https://doi.org/${c.doi}`)
const MD = {
  chicago: c => (c.whole ? `Romanov, Maxim. *${mdEsc(c.app)}*. Zenodo, released ${c.released}. ${doi(c)}.`
    : `Romanov, Maxim. “${mdTitle(c.title)}.” In *${mdEsc(c.app)}*. Zenodo, released ${c.released}. ${doi(c)}. Data: ${mdText(c.data)}. Search: ${mdCode(c.search)}. Accessed ${c.accessed}. ${autolink(c.link)}.`),
  apa: c => (c.whole ? `Romanov, M. (${apaDate(c.released)}). *${mdEsc(c.app)}*. Zenodo. ${doi(c)}`
    : `Romanov, M. (${apaDate(c.released)}). ${mdTitle(c.title)}. In *${mdEsc(c.app)}*. Zenodo. ${doi(c)}. Data: ${mdText(c.data)}. Search: ${mdCode(c.search)}. Retrieved ${c.accessed}, from ${autolink(c.link)}`),
  bibtex: c => '```bibtex\n' + unIso(unlit(FORMATS.bibtex.make(c))) + '\n```',
  ris: c => '```ris\n' + unIso(unlit(FORMATS.ris.make(c))) + '\n```',
}
for (const [k, f] of Object.entries(MD)) FORMATS[k].md = f
// all four formats, each under a small heading
export const allMarkdown = c => Object.entries(FORMATS).map(([k, f]) => `#### ${f.label}\n\n${f.md(c)}`).join('\n\n') + '\n'
