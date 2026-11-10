// A small Markdown renderer for CHANGES.md (shared by both apps; keep both copies the same). It knows only what that file
// uses: headings (#, ##, ###; ## 2.03 — … gets the anchor #v2.03), lists (- item), paragraphs, **bold**, *italics*, `code`, [text](url) and bare https links.
const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
function inline(text) {
  const code = []
  let s = esc(text).replace(/`([^`]+)`/g, (m, c) => `\u0000${code.push(c) - 1}\u0000`)
  s = s.replace(/\[([^\]]+)\]\((https?:[^)\s]+|[\w./#-]+)\)/g, '<a href="$2">$1</a>')
    .replace(/(^|[\s(])(https?:\/\/[^\s<)]+[^\s<).,;:])/g, '$1<a href="$2">$2</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/\*([^*]+)\*/g, '<i>$1</i>')
  return s.replace(/\u0000(\d+)\u0000/g, (m, i) => `<code>${code[i]}</code>`)
}
export function markdown(src) {
  const out = []; let para = [], list = null
  const flush = () => { if (para.length) out.push(`<p>${inline(para.join(' '))}</p>`); para = []; if (list) out.push(`<ul>${list.map(i => `<li>${inline(i)}</li>`).join('')}</ul>`); list = null }
  for (const line of src.replace(/\r/g, '').split('\n')) {
    const h = /^(#{1,3})\s+(.*)$/.exec(line), li = /^\s*-\s+(.*)$/.exec(line)
    if (h) { flush(); const n = h[1].length, id = h[2].split(/\s/)[0].replace(/[^\w.]+/g, ''); out.push(`<h${n}${n > 1 ? ` id="v${id}"` : ''}>${inline(h[2])}</h${n}>`) }
    else if (li) { if (para.length) flush(); (list ??= []).push(li[1]) }
    else if (!line.trim()) flush()
    else if (list && /^\s+\S/.test(line)) list[list.length - 1] += ' ' + line.trim()
    else { if (list) flush(); para.push(line.trim()) }
  }
  flush(); return out.join('\n')
}
