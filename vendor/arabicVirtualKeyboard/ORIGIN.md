# Origin: Arabic Virtual Keyboard

- **Source:** Peter Verkinderen, *Arabic Virtual Keyboard*, https://github.com/pverkind/arabicVirtualKeyboard (demo: https://pverkind.github.io/arabicVirtualKeyboard/).
- **Commit:** `2f7975e061235fff78d3acc04e6cbac0453716c1` (2021-05-12, "Add support for cmd+c copy on Mac"), cloned 2026-11-10.
- **Permission:** Peter Verkinderen agreed that his code may be reused, with acknowledgment (via Maxim Romanov, 2026-11-10). The original repository has no license file. These files are therefore **not** covered by the MIT License of the app repository; they keep their origin.
- **Earlier origin:** his keyboard is "based on Ahmad Ismail's Arabic keyboard at http://www.arabic-keyboard.org/" (his README).
- **Acknowledgment in the apps:** the last line of the page footer in both apps, in both READMEs, and a line in the pop-up.

## Files

| File | What it is |
|---|---|
| `original/keyboard.js`, `original/keyboard.css`, `original/index.html`, `original/README.md` | His files at the commit above, **unchanged** (MD5 `81d05cf0…`, `75980ee7…`, `07801f34…`, `7cd58201…`), kept for reference; the apps do not load them. |
| `keyboard-popup.js` | His `jscript/keyboard.js` as an ES module for a pop-up, with the cheat sheet of his `index.html`. |
| `keyboard-popup.css` | Styles for the pop-up, adapted from his `css/keyboard.css`. |

His fonts (Amiri, `fonts/`) are not copied: both apps already load Amiri. His `img/zwnj.bmp` and `img/zwnj.jpg` (the label of the zero-width non-joiner key) are not copied either; the key is labelled "ZWNJ".

`keyboard-popup.js` is built by `tools/release/vendor_avk.py` in the project folder (not in this repository) from a template and `original/index.html`. The same files are in both apps (`ngramreader`, `classifier`).

## What was kept

His functions that add and strip the display marks keep their bodies: `wr`, `vowelSigns`, `toPrevChar`, `toNextChar`, `getSelection`, `remove`, `arrowL`, `arrowR`, `interceptOnKeyDown`, the checkbox handler, and the stripping lines of `copy2Clipboard`, which became the function `stripMarks` (U+25CC dotted circle, U+061C Arabic letter mark, U+180E Mongolian vowel separator). His key lists (basic, vowels, palaeographic, Persian, regex) are kept. So are his "RTL regex mode" and "Separate Arabic letters" toggles, the key toggles (Vowels, Palaeo, Persian, Regex, Custom, All, Cheatsheet), the custom keys and the cheat sheet with its sources.

## What was changed, and why

1. **Scope.** Everything lives inside `createKeyboard(root, …)`. `sl(id)`, `getElementById` and `getElementsByClassName` look inside the pop-up, through `data-avk` names instead of page-wide ids. Nothing is attached to `window` or `document`: his `window.onclick` (closing his message box) and the message box itself are gone. The inline `onclick="…"` attributes became handlers attached inside the pop-up.
2. **Strict mode.** As a module the code runs in strict mode, so implicitly global variables (`i`, `j`, `k`, `l`, `srt`, `end`, `txt`, `offsetQ`, and calls such as `addKeys(cat, keyGridNo=1)`) were declared or passed as plain arguments. `console.log` calls were removed.
3. **Copying.** `document.execCommand("copy")` became `navigator.clipboard.writeText`. Ctrl/Cmd+C copies without marks and Ctrl/Cmd+Shift+C copies as is, as before. The pop-up's **Insert** button returns the text through the same `stripMarks`.
4. **Enter.** The Enter key of the hardware keyboard and the ⤷ key insert the text into the search field. In the original they started a new line.
5. **Custom keys.** The original kept them in a cookie `keys`. Here they are kept in `localStorage` (key `openiti-avk-keys`), with every access in try/catch. "Reset keys" removes them in place instead of reloading the page.
6. **Brace keys.** The original's `{` and `}` keys insert a left-to-right mark (U+200E) after the brace. His copy function does not remove it (that line is commented out), so `\w{2,3}` written with these keys would silently fail. The keys here insert the brace alone. Separately, the apps remove any direction control (U+200E, U+200F, U+202A–U+202E, U+2066–U+2069) from search fields.
7. **Cheat sheet.** Each button's `wr(…)` call is kept as written, with `offset = n` passed as `n`. Two changes: the lookbehind buttons insert `(?<=…)` and `(?<!…)` (the original wrote `>`, `>`, giving `(?>=…)`), and the four unlabelled buttons of "Arabic Unicode" are labelled "[…]".
8. **Vowel keys.** On the key faces a vowel sign stands on a taṭwīl (ـ) instead of the dotted circle: Amiri, as the apps load it from Google Fonts, has no U+25CC, and a vowel sign cannot attach to a circle drawn from another font. What the keys insert is unchanged.
9. **Keys as elements.** Keys keep the focus in the text area (`pointerdown` does not move it) and carry `role="button"` and an `aria-label` (the alias, or the character). Their text is set with `textContent`, so a custom key cannot inject markup.
10. **Without regular expressions** (the Book Classifier's search box): `createKeyboard(root, { regex: false })` hides the two regex toggles, the Regex keys and the cheat sheet.
11. **Look.** The styles are scoped to the pop-up and follow the apps' light and dark colours. Keys are 40 px. On phones the pop-up is a bottom sheet and the keys reflow into 8 columns. On touch screens the text area does not open the system keyboard (`inputmode="none"`), so the pop-up's keys stay in view.
