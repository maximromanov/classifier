// The "What's new" page (changes.html; shared by both apps, keep both copies the same): CHANGES.md, the one source of the
// changes, shown with the app's band and footer.
import { APP, CITATION } from './config.js'
import { markdown } from './md.js'
import { bandMenu, themeControl } from './ui.js'
const $ = s => document.querySelector(s)
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
themeControl(() => {}); bandMenu()
const c = CITATION
$('#citation-block').innerHTML = `<b>Citation:</b> Romanov, Maxim. <i>${esc(c.title)}</i>. Zenodo, released ${c.released}. <a href="https://doi.org/${c.doi}">https://doi.org/${c.doi}</a>.`
$('#version').innerHTML = `Version ${esc(APP.version)} · <a href="changes.html" aria-current="page">What's new</a>`
try {
  const r = await fetch('CHANGES.md', { cache: 'no-cache' }); if (!r.ok) throw new Error(r.status)
  $('#changes').innerHTML = markdown(await r.text())
  document.title = $('#changes h1')?.textContent ?? document.title
} catch (e) { $('#changes').innerHTML = `<p>The list of changes could not be loaded (${esc(e.message)}). It is in <a href="https://github.com/${APP.repo}/blob/main/CHANGES.md">CHANGES.md</a>.</p>` }
