# Origin: Arabic Virtual Keyboard

- **Source:** Peter Verkinderen, *Arabic Virtual Keyboard*, https://github.com/pverkind/arabicVirtualKeyboard (demo: https://pverkind.github.io/arabicVirtualKeyboard/).
- **Commit:** `2f7975e061235fff78d3acc04e6cbac0453716c1` (2021-05-12, "Add support for cmd+c copy on Mac"), cloned 2026-11-10.
- **Permission:** Peter Verkinderen agreed that his code may be reused, with acknowledgment (via Maxim Romanov, 2026-11-10). The original repository has no license file. These files are therefore **not** covered by the MIT License of the app repository. They keep their origin and are used with the author's permission.
- **Earlier origin:** his keyboard is "based on Ahmad Ismail's Arabic keyboard at http://www.arabic-keyboard.org/" (his README).
- **Acknowledgment in the apps:** the last line of the page footer in both apps, in both READMEs, and a line in the pop-up.

## Files

| File | What it is |
|---|---|
| `original/keyboard.js`, `original/keyboard.css`, `original/index.html`, `original/README.md` | His files at the commit above, **unchanged** (MD5 `81d05cf0…`, `75980ee7…`, `07801f34…`, `7cd58201…`), kept for reference; the apps do not load them. |
| `keyboard-popup.js` | His `jscript/keyboard.js` as an ES module for a pop-up, simplified (change 12). |
| `keyboard-popup.css` | Styles for the pop-up, adapted from his `css/keyboard.css`. |

His fonts (Amiri, `fonts/`) and images are not copied: both apps already load Amiri. The same files are in both apps (`ngramreader`, `classifier`).

## What was kept

- **His functions** for adding and stripping the display marks keep their bodies: `wr`, `vowelSigns`, `toPrevChar`, `toNextChar`, `getSelection`, `remove`, `arrowL`, `arrowR`, `interceptOnKeyDown`, the checkbox handler, and the stripping lines of `copy2Clipboard`. Those lines became the function `stripMarks` (U+25CC dotted circle, U+061C Arabic letter mark, U+180E Mongolian vowel separator).
- **His toggles:** "RTL regex mode" and "Separate Arabic letters".
- **His key lists `basic` and `regexchars`,** from which the keys are taken (change 12).

## What was changed, and why

1. **Scope.** Everything lives inside `createKeyboard(root, …)`. `sl(id)`, `getElementById` and `getElementsByClassName` look inside the pop-up, through `data-avk` names instead of page-wide ids. Nothing is attached to `window` or `document`: his `window.onclick` (closing his message box) and the message box itself are gone. The inline `onclick="…"` attributes became handlers attached inside the pop-up.
2. **Strict mode.** As a module the code runs in strict mode, so implicitly global variables (`i`, `srt`, `end`, `txt`, `offsetQ`, and calls such as `addKeys(cat, keyGridNo=1)`) were declared or passed as plain arguments. `console.log` calls were removed.
3. **Copying.** `document.execCommand("copy")` became `navigator.clipboard.writeText`. Ctrl/Cmd+C copies without marks and Ctrl/Cmd+Shift+C copies as is, as before. The pop-up's **Insert** button returns the text through the same `stripMarks`.
4. **Enter.** The Enter key of the hardware keyboard inserts the text into the search field. In the original it started a new line.
5. **Custom keys.** First kept in `localStorage` instead of his cookie; removed with change 12. The pop-up stores nothing.
6. **Brace keys.** The original's `{` and `}` keys insert a left-to-right mark (U+200E) after the brace. His copy function does not remove it (that line is commented out), so `\w{2,3}` written with these keys would silently fail. Since change 12 the pop-up has no brace keys. Separately, the apps remove any direction control (U+200E, U+200F, U+202A–U+202E, U+2066–U+2069) from search fields.
7. **Cheat sheet.** First converted, with two fixes: the lookbehind buttons inserted `(?>=…)`, that is `(?>=…)`, instead of `(?<=…)`, and four buttons had no label. Removed with change 12.
8. **Vowel keys.** First shown on a taṭwīl, because the Amiri the apps load has no U+25CC. Removed with change 12.
9. **Keys as elements.** Keys keep the focus in the text area (`pointerdown` does not move it) and carry `role="button"` and an `aria-label` (his alias, or the character). Their text is set with `textContent`.
10. **Without regular expressions** (the Book Classifier's search box): `createKeyboard(root, { regex: false })` hides the two regex toggles and the regex row.
11. **Look.** The styles are scoped to the pop-up and follow the apps' light and dark colours. Keys are 40 px. On phones the pop-up is a bottom sheet and the keys reflow into 8 columns. On touch screens the text area does not open the system keyboard (`inputmode="none"`), so the pop-up's keys stay in view.
12. **Simplified to what the corpus can find** (Maxim, 2026-11-10). The NgramReader finds only what survives its normalisation, so the pop-up offers only that:
    - **Letters:** those the app's conversion table keeps distinct (`js/arabic.js`, passed as `letters`), 30 in all, in the order of his `basic` layout. Letters normalised into another get no key: إ أ آ ٱ (→ ا), ؤ ئ (→ ء), ى ی (→ ي), ک (→ ك). His ligature key لا is not kept; ل and ا are keys of their own.
    - **One regex row** (NgramReader only): `[ ] ( ) | ? * + . \w - ^`, with his aliases. `\w` is added; the other ten are from his `regexchars`.
    - **Controls:** space, `_` (joins the words of a phrase), the cursor arrows (his `arrowL`, `arrowR`) and backspace (his `remove`).
    - **Toggles:** his two (NgramReader only).
    - **Removed:** the vowel, palaeographic, Persian and custom keys, the key-group toggles, "Reset keys", the cheat sheet, his digits and punctuation, and the stored keys. `wr` and `vowelSigns` are unchanged, so vowel signs typed on a hardware keyboard are still handled as before.
