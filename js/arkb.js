// The Arabic keyboard and regex editor (shared by both apps; keep both copies the same): Peter Verkinderen's Arabic Virtual
// Keyboard (vendor/arabicVirtualKeyboard/, adapted with permission; see ORIGIN.md there), opened as a pop-up from a
// "⌨ Arabic" button beside a field. Insert puts the text back into the field without the display marks; Close leaves the
// field as it was.
import { createKeyboard, stripMarks } from '../vendor/arabicVirtualKeyboard/keyboard-popup.js'
import { DISTINCT_LETTERS } from './arabic.js'   // the keys: the letters the corpus keeps distinct

// the display marks of the keyboard (U+061C, U+180E, U+25CC; his stripping function), and any direction control
// (U+200E, U+200F, U+202A–U+202E, U+2066–U+2069): none belongs in a search, a link, a citation or a TSV file
const CONTROLS = /[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g
export const cleanField = s => stripMarks(String(s ?? '')).replace(CONTROLS, '')

let dlg = null, kb = null, target = null, mode = { regex: true }
function build() {
  const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = new URL('../vendor/arabicVirtualKeyboard/keyboard-popup.css', import.meta.url).href
  document.head.appendChild(css)
  dlg = document.body.appendChild(document.createElement('dialog'))
  dlg.className = 'avk-dialog'; dlg.setAttribute('aria-labelledby', 'avk-title')
  dlg.innerHTML = `<div class="avk-head"><h2 id="avk-title">${mode.regex ? 'Arabic keyboard and regex editor' : 'Arabic keyboard'}</h2><button type="button" class="close" data-avk-close aria-label="Close">×</button></div>
    <p class="avk-target"></p><div class="avk-host"></div>
    <div class="avk-actions"><button type="button" class="primary" data-avk-insert>Insert</button><button type="button" data-avk-close>Close</button><span class="grow"></span></div>
    <p class="avk-credit">Adapted, with permission, from Peter Verkinderen's <a href="https://github.com/pverkind/arabicVirtualKeyboard" target="_blank" rel="noopener">Arabic Virtual Keyboard</a>.</p>`
  kb = createKeyboard(dlg.querySelector('.avk-host'), { letters: DISTINCT_LETTERS, regex: mode.regex, onEnter: insert })
  dlg.querySelectorAll('[data-avk-close]').forEach(b => { b.onclick = () => dlg.close() })
  dlg.querySelector('[data-avk-insert]').onclick = insert
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close() })          // a click on the backdrop
  dlg.addEventListener('close', () => { const t = target; target = null; t?.focus() })
}
function insert() {
  if (!target) return
  const t = target
  t.value = kb.getValue()
  t.dispatchEvent(new Event('input', { bubbles: true }))
  dlg.close()
  t.setSelectionRange?.(t.value.length, t.value.length)
}

// open the pop-up for a field, seeded with its value; what = a short description of the field for the pop-up's heading
export function openKeyboard(input, what = '') {
  if (!dlg) build()
  target = input
  dlg.querySelector('.avk-target').textContent = what
  dlg.querySelector('.avk-target').hidden = !what
  dlg.showModal()
  kb.setValue(cleanField(input.value))
  // phones: the keys of the pop-up are the keyboard; the system keyboard would cover them
  const area = dlg.querySelector('[data-avk=area]'); area.inputMode = matchMedia('(pointer: coarse)').matches ? 'none' : 'text'
  kb.focus()
}

// the "⌨ Arabic" button for a field; regex: offer the regex tools (NgramReader items), or not (Book Classifier search)
export function keyboardButton(input, { regex = true, what = '', tabbable = true } = {}) {
  mode = { regex }
  const b = document.createElement('button')
  b.type = 'button'; b.className = 'kb'; b.textContent = '⌨ Arabic'
  b.title = regex ? 'Arabic keyboard and regex editor (Alt+K)' : 'Arabic keyboard (Alt+K)'
  b.setAttribute('aria-label', regex ? 'Arabic keyboard and regex editor' : 'Arabic keyboard')
  if (!tabbable) b.tabIndex = -1
  b.onclick = () => openKeyboard(input, typeof what === 'function' ? what() : what)
  input.addEventListener('keydown', e => { if (e.altKey && e.code === 'KeyK') { e.preventDefault(); b.click() } })
  return b
}
