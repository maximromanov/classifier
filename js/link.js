// Short, readable links (shared by both apps; keep both copies the same). Grammar of the address after "#":
//
//   link   = pair *( "&" pair )            pairs in a fixed order per app; a key at its default is left out
//   pair   = key "=" value
//   NgramReader:  l=<line>;<line>…          a line: label~item~item… (the fields of "#Label #item1 #item2")
//                 then x m s t v p k a q y e r (see main.js, LINK_KEYS)
//   Classifier:   b=<book URI> or a=<author URI>, then t h c w r (see main.js, LINK_KEYS)
//   value  = text with spaces written as "+"; percent-encoded are only the characters that would break the parsing:
//            % + ~ ; & # and control characters. Everything else stays as typed: \ [ ] ( ) ? * | . { } ^ $ _, Latin and
//            Arabic letters, ŧ ġ ṭ …
//   r      = the data release, only when it is not the default (OpenITI 2023.1.8): a link without r means 2023.1.8, always.
//
// Older forms are read elsewhere and keep working for good: #2z… and #2r… (share.js), #v=2&s=… (share.js), ?l=… (state.js),
// and in the Book Classifier ?book= and ?author=.

const SPECIAL = /[%+~;&#\u0000-\u001F\u007F]/g
const pct = c => '%' + c.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0')
// a value as written in a link
export const enc = s => String(s ?? '').replace(SPECIAL, pct).replace(/ /g, '+')
// a value read from a link (the browser may have percent-encoded more than we wrote: that is decoded too)
export const dec = s => { const t = String(s ?? '').replace(/\+/g, ' '); try { return decodeURIComponent(t) } catch { return t } }

// the pairs of a readable link, as raw (still encoded) values; null for any other form (#2z…, #2r…, #v=2&s=…, none)
export function readPairs(hash, first) {
  const h = String(hash ?? '').replace(/^#/, '')
  if (!first.some(k => h.startsWith(`${k}=`))) return null
  const pairs = new Map()
  for (const part of h.split('&')) { const i = part.indexOf('='); if (i > 0) pairs.set(part.slice(0, i), part.slice(i + 1)); else if (part) pairs.set(part, '') }
  return pairs
}
// the link from [key, raw value] pairs, in the order given
export const writePairs = pairs => '#' + pairs.map(([k, v]) => `${k}=${v}`).join('&')

// an address as text for people (Copy link, citations, captions, READMEs): what the browser percent-encoded is shown as the
// letters again (ŧ, Arabic, \ …); the characters of the grammar and spaces stay encoded, so the text opens the same view
export function pretty(url) {
  return String(url).replace(/(%[0-9A-Fa-f]{2})+/g, seq => {
    let d; try { d = decodeURIComponent(seq) } catch { return seq }
    // the grammar's characters with our own encoder (encodeURIComponent leaves "~" as it is), other white space as the browser does
    return [...d].map(c => (/[%+~;&#\u0000-\u001F\u007F]/.test(c) ? pct(c) : /\s/.test(c) ? encodeURIComponent(c) : c)).join('')
  })
}
// the same for a Markdown autolink <…>: also no "<", ">" or space inside
export const autolink = url => `<${pretty(url).replace(/[<>\s`]/g, c => encodeURIComponent(c))}>`
