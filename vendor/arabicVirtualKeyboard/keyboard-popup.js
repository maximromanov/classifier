// Arabic Virtual Keyboard, adapted as a pop-up for the DHFAIS apps (OpenITI NgramReader, Book Classifier).
//
// Original: Peter Verkinderen, https://github.com/pverkind/arabicVirtualKeyboard (jscript/keyboard.js, commit 2f7975e,
// 2021-05-12), "an Arabic virtual keyboard for easily writing Arabic regular expressions, including palaeographic
// characters", itself based on Ahmad Ismail's Arabic keyboard, http://www.arabic-keyboard.org/.
// Adapted with Peter Verkinderen's permission (via Maxim Romanov, 2026-11-10). The unchanged original is in original/;
// every change is listed in ORIGIN.md. His functions for adding and stripping the display marks (wr, vowelSigns,
// toPrevChar, toNextChar, getSelection, remove, arrowL, arrowR and the stripping lines of copy2Clipboard) keep their
// bodies; they now look up their elements inside the pop-up (sl) instead of the whole page.

//* Define the main cosmetic markers used to force RTL
const arLet = "؜"; // Arabic letter mark
const vowSep = "᠎"; // Mongolian vowel separator
const circle = "◌"; // dotted circle for diacritics
// */

/**
 * Remove the cosmetic marks (the lines of copy2Clipboard that prepare the text for copying, as a function of their own).
 *
 * @param {string} copyText - the text with marks
 */
export function stripMarks(copyText) {
    var temp_copyText = copyText.split(circle).join("");   // dotted circle
    temp_copyText = temp_copyText.split(arLet).join("");  // Arabic letter mark
    temp_copyText = temp_copyText.split(vowSep).join("");  // Mongolian Vowel Separator
    // previously used separators, no longer used:
    //temp_copyText = temp_copyText.split("‎").join(""); //left-to-right mark
    //temp_copyText = temp_copyText.split(" ").join(""); //hair space
    return temp_copyText;
}

//-----------------------------------------------------------------------------

// Populate the virtual keyboard's keys:

var basic = [
    ["ذ", ""],
    ["١", ""],
    ["٢", ""],
    ["٣", ""],
    ["٤", ""],
    ["٥", ""],
    ["٦", ""],
    ["٧", ""],
    ["٨", ""],
    ["٩", ""],
    ["٠", ""],
    ["➞", "backspace"],                                  // Row 1
    ["ض", ""],
    ["ص", ""],
    ["ث", ""],
    ["ق", ""],
    ["ف", ""],
    ["غ", ""],
    ["ع", ""],
    ["ه", ""],
    ["خ", ""],
    ["ح", ""],
    ["ج", ""],
    ["د", ""],                                                 //Row 2
    ["ش", ""],
    ["س", ""],
    ["ي", ""],
    ["ب", ""],
    ["ل", ""],
    ["ا", ""],
    ["ت", ""],
    ["ن", ""],
    ["م", ""],
    ["ك", ""],
    ["ط", ""],
    [String.raw`\n`, "enter"],                                // Row 3
    ["ئ", ""],
    ["ء", ""],
    ["ؤ", ""],
    ["ر", ""],
    ["لا", ""],
    ["ى", ""],
    ["ة", ""],
    ["و", ""],
    ["ز", ""],
    ["ظ", ""],
    ["ـ", "taṭwīl (kashīda)"],                                // Row 4
    ['،', "Arabic comma"],
    [':', "colon"],
    ['؛', "Arabic semicolon"],
    [" ", ""],
    ['‌', "zero-width non-joiner (فاصلهٔ مجازی)"],
    ['؟', "Arabic question mark"],
    ['.', "full stop"],
    ["!", "exclamation mark"],                                // Row 5
    ];

var additional = [
    [circle+'ْ',"sukūn"],
    [circle+'ً', "fatḥatān"],
    [circle+'ٌ',"ḍammatān"],
    [circle+'ٍ', "kasratān"],
    [circle+'َ', "fatḥa"],
    [circle+'ُ', "ḍamma"],
    [circle+'ِ',"kasra"],
    [circle+'ّ', "shadda"],
    ['آ', "alif madda"],
    ['ٱ', "alif waṣla"],
    ['أ', "alif with hamza on top"],
    ['إ', "alif with hamza below"],                           // Row 6
];
var palaeo = [
    [circle+'ۡ',"Quranic sukūn"],
    [circle+'ࣰ',"Quranic open fatḥatān"],
    [circle+'ࣱ',"Quranic open ḍammatān"],
    [circle+'ࣲ',"Quranic open kasratān"],
    [circle+'ٰ',"dagger alif"],
    ['ٮ',"dotless b"],
    ['ں',"dotless n"],
    ['ڡ',"dotless f"],
    ['ٯ',"dotless q"],
    ['ڧ',"maghrebi q"],
    ['ڢ',"maghrebi f"],
    ['ٯٜ',"qāf with dot below"],                         // Row 7
];
var persian = [
    ["۱", "Persian digit 1"],
    ["۲", "Persian digit 2"],
    ["۳", "Persian digit 3"],
    ["۴", "Persian digit 4"],
    ["۵", "Persian digit 5"],
    ["۶", "Persian digit 6"],
    ["۷", "Persian digit 7"],
    ["۸", "Persian digit 8"],
    ["۹", "Persian digit 9"],
    ["۰", "Persian digit 0"],
    ['پ', "Persian peh"],
    ['چ', "Persian cheh"],                                     //Row 8
    ['ژ', "Persian zheh"],
    ['ک', "Persian kāf"],
    ['گ', "Persian gāf"],
    ['ی', "Persian yeh"],
    ['ۂ', "Persian heh-yeh"],
];
var regexchars = [
    ['.', "dot"],
    [',', "latin comma"],
    ['?', "latin question mark"],
    ['-', "hyphen"],
    ['+', "plus"],
    ['*', "asterisk"],
    ['|', "vertical bar (pipe)"],                             // Row 9
    ['/', "forward slash"],
    [String.raw`\\`, "backslash"],
    ['(', "opening bracket"],
    [')', "closing bracket"],
    ['[', "opening square bracket"],
    [']', "closing square bracket"],
    ['{', "opening brace"],        // the original has a left-to-right mark (U+200E) after the brace; see ORIGIN.md
    ['}', "closing brace"],        // the same
    ['<', "opening angular bracket"],
    ['>', "closing angular bracket"],
    ['^', "caret / circonflex"],
    ['$', "dollar sign"],
    ['@', "ampersand"],
    ['%', "percent / modulo"],
    ['"', "double quote"],
    ["'", "single quote"],
    ["_", "underscore"],
    ["=", "equals"],
];

var vowels = [
    'ْ', //sukūn
    'ً', //fatḥatān
    'ٌ', //ḍammatān
    'ٍ', //kasratān
    'َ', //fatḥa
    'ُ', //ḍamma
    'ِ', //kasra
    'ّ', //shadda
    'ۡ', //Quranic sukūn
    'ࣰ', //Quranic open fatḥatān
    'ࣱ', //Quranic open ḍammatān
    'ࣲ', //Quranic open kasratān
    'ٰ', //dagger alif
];

function vowelSigns(txt, include=true) {
  //console.log("add vowel signs:"+include);
  if (include) {
    for (let i=0, j=vowels.length; i<j; i++) {
      txt = txt.split(vowels[i]).join(circle+vowels[i]); // add dotted circles
    }
    txt = txt.replace(/◌+/g, "◌");
  } else {
    txt = txt.split("◌").join(""); // remove dotted circles
  }
  return txt;
}


/**
 * Move the cursor position to just after the previous real character
 * (before any ALM, character separator or vowel circle)
 *
 * @param {number} pos - The position of the cursor in the text string
 * @param {string} txt - The text string.
 */

function toPrevChar(pos, txt) {
  //console.log(pos);
  while ([arLet, vowSep, circle].includes(txt.substring(pos-1, pos))) pos--;
  return pos;
}


/**
 * Move the cursor position to just before the next real character
 * (after any ALM, character separator or vowel circle)
 *
 * @param {number} pos - The position of the cursor in the text string
 * @param {string} txt - The text string.
 */

function toNextChar(pos, txt) {
  while ([arLet, vowSep, circle].includes(txt.substring(pos, pos+1))) pos++;
  return pos;
}


/**
 * Get the start and end position of the selection within the text area
 *
 * @param {object} target - The text area
 * @param {bool} prev - If prev is set to true, the position will be adjusted
 *                      to the position just after the preceding character
 *                      (i.e., before any cosmetic mark).
 */

function getSelection(target, prev=false) {
  target.focus();
  var srt = target.selectionStart;
  var end = target.selectionEnd;
  if (prev) {
    return [toPrevChar(srt, target.value), toPrevChar(end, target.value)]
  } else {
    return [srt, end];
  }
}

// the markup of the pop-up: the parts of the original index.html (#intro, #keyboard, #addNewKeyInput, #cheatsheet),
// with ids replaced by data-avk names and inline handlers by data attributes (see ORIGIN.md)
const MARKUP = (regex) => String.raw`
<div class="avk-intro"${regex ? '' : ' hidden'}>
    <label class="rgxChckbx">
        <input type="checkbox" data-avk="regexCheck0">
        <span class="tooltip dotted">RTL regex mode
            <span class="tooltiptext rgxtooltip">
                Use this mode for writing right-to-left (RTL) regular expressions.
                All characters (even latin letters) will appear in RTL order:
                e.g., abc will appear as cba. Inserting the regex
                removes the characters (U+061C (ARABIC LETTER MARK)) that
                force this behavior so that they do not impact the functioning
                of the regex.
            </span>
        </span>
    </label>
    <label class="rgxChckbx">
        <input type="checkbox" data-avk="regexCheck">
        <span class="tooltip dotted">Separate Arabic letters
            <span class="tooltiptext rgxtooltip">Arabic letters
                will be displayed as separated (by inserting the separator
                character U+180E "MONGOLIAN VOWEL SEPARATOR").
                This is especially useful for writing
                character disjunctions <code>[abc]</code> and ranges <code>[a-c]</code>.
                Inserting the regex removes these separators
                so that they do not impact the functioning of the regex.
            </span>
        </span>
    </label>
</div>
<div class="avk-keyboard">
    <textarea data-avk="area" dir="rtl" lang="ar" rows="2" spellcheck="false" autocomplete="off" aria-label="Arabic text"></textarea>
    <div class="avk-basic">
        <div class="keyGrid keyGridBasic"></div>
    </div>
    <div data-avk="extraRows" class="avk-extra">
        <div class="keyGrid"></div>
    </div>
    <div class="keyToggleRow">
      <span class="fivePxMargin"><input type="checkbox" class="keyToggle" data-cat="additional" id="avk-c1"><label for="avk-c1">Vowels</label></span>
      <span class="fivePxMargin"><input type="checkbox" class="keyToggle" data-cat="palaeo" id="avk-c2"><label for="avk-c2">Palaeo</label></span>
      <span class="fivePxMargin"><input type="checkbox" class="keyToggle" data-cat="persian" id="avk-c3"><label for="avk-c3">Persian</label></span>
      <span class="fivePxMargin"${regex ? '' : ' hidden'}><input type="checkbox" class="keyToggle" data-cat="regexchars" id="avk-c4"><label for="avk-c4">Regex</label></span>
      <span class="fivePxMargin"><input type="checkbox" class="keyToggle" data-cat="cookieKeys" id="avk-c5"><label for="avk-c5">Custom</label></span>
      <span class="fivePxMargin"><input type="checkbox" class="keyToggle" data-all id="avk-c6" data-avk="c6"><label for="avk-c6">All</label></span>
      <span class="fivePxMargin"${regex ? '' : ' hidden'}><input type="checkbox" class="keyToggle" data-toggle="cheatsheet" id="avk-c7"><label for="avk-c7">Cheatsheet</label></span>
    </div>
</div>
<div data-avk="addNewKeyInput" class="avk-addkey">
  <p>Need more special characters? Add a key with a new character (and an optional description):</p>
  <input type="text" class="extraInput fivePxMargin" data-avk="extraInput0" dir="rtl" placeholder="ک" aria-label="new character">
  <input type="text" class="extraInputDescr fivePxMargin" data-avk="extraInputDescr0" placeholder="description" aria-label="description">
  <button type="button" class="fivePxMargin" data-addkey>Add key</button>
  <button type="button" class="fivePxMargin" data-resetkeys>Reset keys</button>
</div>
<div data-avk="cheatsheet" class="avk-cheatsheet">

        <h4>Regex Cheatsheet input (<a href="https://www.rexegg.com/regex-quickstart.html" target="_blank" rel="noopener">source</a>)</h4>
        <!--
            <img src="i/regexCheatSheet.jpg"></img>
            -->

        <table>
            <tr><td></td><td></td><td><b>Sample regex</b></td><td><b>Sample match</b></td></tr>
            <tr><td><button type="button" class="regexInput" data-wr="0">.</button></td><td>Any character except line break</td><td>a.c</td><td><b><mark>abc</mark></b> <b><mark>a.c</mark></b></td></tr>
            <tr><td><button type="button" class="regexInput" data-wr="1">\</button></td><td>Escapes a special character</td><td>a\.c</td><td>abc <b><mark>a.c</mark></b></td></tr>
        </table>
        <div class="regexTitle" data-toggle-section="charGroups" role="button" tabindex="0">Character groups &or;</div>
        <div class="regexClass" data-avk="charGroups">
            <table>
                <tr><td><button type="button" class="regexInput" data-wr="2">\d</button></td><td>one Unicode digit in any script</td><td>file_\d_\d</td><td><b><mark>file_9_ ٩</mark></b></td></tr>
                <tr><td><button type="button" class="regexInput" data-wr="3">\w</button></td><td>"word character": Unicode letter, ideogram, digit, or underscore</td><td>\w-\w\w\w</td><td><b><mark>字-ま_۳</mark></b></td></tr>
                <tr><td><button type="button" class="regexInput" data-wr="4">\s</button></td><td>"whitespace character": any Unicode separator</td><td>a\sb\sc</td><td>aaa<b><mark>a b
                    c</mark></b>ccdde</td></tr>
                <tr><td><button type="button" class="regexInput" data-wr="5">\D</button></td><td>One character that is not a digit</td><td>2\D\D\D</td><td>1<b><mark>2ABC</mark></b>34</td></tr>
                <tr><td><button type="button" class="regexInput" data-wr="6">\W</button></td><td>One character that is not a word character</td><td>\W\W\W\W\W</td><td><b><mark>*-+=)</mark></b></td></tr>
                <tr><td><button type="button" class="regexInput" data-wr="7">\S</button></td><td>One character that is not a whitespace character</td><td>\S\S\S\S</td><td><b><mark>Yo3)</mark></b> Y o3</td></tr>
            </table>
        </div>
        <div class="regexTitle" data-toggle-section="whiteSpace" role="button" tabindex="0">More White-Space &or;</div>
        <div class="regexClass" data-avk="whiteSpace">
            <table>
                <tr><td><button type="button" class="regexInput" data-wr="8">\t</button></td><td>Tab</td><td>T\t\w\w</td><td>A <b><mark>T     ab</mark></b></td></tr>
                <tr><td><button type="button" class="regexInput" data-wr="9">\r</button></td><td>Carriage return character</td><td>see below</td><td></td></tr>
                <tr><td><button type="button" class="regexInput" data-wr="10">\n</button></td><td>Line feed character</td><td>see below</td><td></td></tr>
                <tr><td><button type="button" class="regexInput" data-wr="11">\r\n</button></td><td>Line separator on Windows</td><td>AB\r\nCD</td><td><b><mark>AB<br/>CD</mark></b></td></tr>
            </table>
        </div>
        <div class="regexTitle" data-toggle-section="quantifiers" role="button" tabindex="0">Quantifiers &or;</div>
        <div class="regexClass" data-avk="quantifiers">
            <table>
                <tr><td><button type="button" class="regexInput" data-wr="12">?</button></td><td>Once or none</td><td>plurals?</td><td><b><mark>plural</mark></b> and <b><mark>plurals</mark></b></td></tr>
                <tr><td><button type="button" class="regexInput" data-wr="13">*</button></td><td>Zero or more times (greedy) </td><td>aB*a bB*b aB*</td><td><b><mark>aBBa bb aBBBBB</mark></b></td></tr>
                <tr><td><button type="button" class="regexInput" data-wr="14">+</button></td><td>One or more (greedy) </td><td>Version \w-\w+</td><td><b><mark>Version A-b1_100</mark></b></td></tr>
                <tr><td><button type="button" class="regexInput" data-wr="15">{3}</button></td><td>Exactly three times</td><td>\D{3}</td><td><b><mark>ABC</mark></b></td></tr>
                <tr><td><button type="button" class="regexInput" data-wr="16">{2,4}</button></td><td>Two to four times (greedy) </td><td>\d{2,4}</td><td><b><mark>156</mark></b></td></tr>
                <tr><td><button type="button" class="regexInput" data-wr="17">{3,}</button></td><td>Three or more times (greedy) </td><td>\w{4,}</td><td><b><mark>regex_</mark></b></td></tr>
            </table>
        </div>
        <div class="regexTitle" data-toggle-section="lazyQuantifiers" role="button" tabindex="0">Lazy quantifiers (w/ question mark) &or;</div>
        <div class="regexClass" data-avk="lazyQuantifiers">
            <table>
                <tr><td><button type="button" class="regexInput" data-wr="18">?</button></td><td>Once or none (lazy)</td><td>plurals?</td><td><b><mark>plural</mark></b> and <b><mark>plural</mark></b>s</td></tr>
                <tr><td><button type="button" class="regexInput" data-wr="19">+?</button></td><td>One or more (lazy) </td><td>Version \w-\w+?</td><td><b><mark>Version A-b</mark></b>1_100</td></tr>
                <tr><td><button type="button" class="regexInput" data-wr="20">{2,4}?</button></td><td>Two to four times (lazy) </td><td>\d{2,4}?</td><td><b><mark>15</mark></b>6</td></tr>
                <tr><td><button type="button" class="regexInput" data-wr="21">{3,}?</button></td><td>Three or more times (lazy) </td><td>\w{4,}?</td><td><b><mark>rege</mark></b>x_</td></tr>
                <tr><td><button type="button" class="regexInput" data-wr="22">*?</button></td><td>Zero or more times (lazy) </td><td>aB*a b* aB*?</td><td><b><mark>aBBa bb a</mark></b>BBBBB</td></tr>
            </table>
        </div>
        <div class="regexTitle" data-toggle-section="logic" role="button" tabindex="0">Logic &or;</div>
        <div class="regexClass" data-avk="logic">
            <table>
                <tr><td><button type="button" class="regexInput" data-wr="23">|</button></td><td>Alternation / OR operand</td><td>22|33</td><td><b><mark>22</mark></b> + 11 = <b><mark>33</mark></b></td></tr>
                <tr><td><button type="button" class="regexInput" data-wr="24">( … )</button></td><td>Capturing group</td><td>A(nt|pple)</td><td>An <b><mark>A<span class="underline">nt</span></mark></b> on an <b><mark>A<span class="underline">pple</span></mark></b></td></tr>
                <tr><td><button type="button" class="regexInput" data-wr="25">\1</button></td><td>Contents of Group 1</td><td>r(\w)g\1x</td><td><b><mark>regex</mark></b> not rigex</td></tr>
                <tr><td><button type="button" class="regexInput" data-wr="26">\2</button></td><td>Contents of Group 2</td><td>(\d\d)\+(\d\d)=\2\+\1</td><td><b><mark>12+65=65+12</mark></b></td></tr>
                <tr><td><button type="button" class="regexInput" data-wr="27">(?: … )</button></td><td>Non-capturing group</td><td>A(?:nt|pple)</td><td>An <b><mark>Ant</mark></b> on an <b><mark>Apple</mark></b></td></tr>
            </table>
        </div>
        <div class="regexTitle" data-toggle-section="charClasses" role="button" tabindex="0">Character Classes &or;</div>
        <div class="regexClass" data-avk="charClasses">
            <table>
                <tr><td><button type="button" class="regexInput" data-wr="28">[ … ]</button></td><td>One of the characters in the brackets</td><td>T[ao]p</td><td><b><mark>Tap</mark></b> and <b><mark>Top</mark></b></td></tr>
                <tr><td><button type="button" class="regexInput" data-wr="29">[x-y]</button></td><td>One of the characters in the range from x to y</td><td>[A-Z]+</td><td><b><mark>UPPER</mark></b>case <b><mark>LE</mark></b>tter<b><mark>S</mark></b></td></tr>
                <tr><td><button type="button" class="regexInput" data-wr="30">[^xy]</button></td><td>One character that is not x or y</td><td>[^12]</td><td><b><mark>A</mark></b>1<b><mark>b</mark></b>2<b><mark>+</mark></b>1</td></tr>
                <tr><td><button type="button" class="regexInput" data-wr="31">[^x-y]</button></td><td>One of the characters not in the range from x to y</td><td>[^a-z]{3}</td><td>ab<b><mark>A1! </mark></b>cd</td></tr>
            </table>
        </div>
        <div class="regexTitle" data-toggle-section="anchors" role="button" tabindex="0">Anchors and Boundaries &or;</div>
        <div class="regexClass" data-avk="anchors">
            <table>
                <tr><td><button type="button" class="regexInput" data-wr="32">^</button></td><td>Start of line</td><td>^abc [1-9]*</td><td><b><mark>abc 18</mark></b> abc 19</td></tr>
                <tr><td><button type="button" class="regexInput" data-wr="33">$</button></td><td>End of line</td><td>abc [1-9]*$</td><td>abc 18 <b><mark>abc 19</mark></b></td></tr>
                <tr><td><button type="button" class="regexInput" data-wr="34">\b</button></td><td>Word boundary: position where one side only is a letter, digit or underscore</td><td>\bكتب\b</td><td><b><mark>كتب</mark></b> مكتبه كتبه</td></tr>
                <tr><td><button type="button" class="regexInput" data-wr="35">\B</button></td><td>Not a word boundary</td><td>\Bكتب\B</td><td>كتب م<b><mark>كتب</mark></b>ه كتبه</td></tr>
            </table>
        </div>
        <div class="regexTitle" data-toggle-section="lookarounds" role="button" tabindex="0">Lookarounds &or;</div>
        <div class="regexClass" data-avk="lookarounds">
            <table>
                <tr><td><button type="button" class="regexInput" data-wr="36">(?=…)</button></td><td>Positive lookahead</td><td>(?=\d{10})\d{5}</td><td><b><mark>01234</mark></b>56789</td></tr>
                <tr><td><button type="button" class="regexInput" data-wr="37">(?&lt;=…)</button></td><td>Positive lookbehind</td><td>(?&lt;=\d\s)cat</td><td>1 <b><mark>cat</mark></b> white cat</td></tr>
                <tr><td><button type="button" class="regexInput" data-wr="38">(?!…)</button></td><td>Negative lookahead</td><td>(?!theatre)the\w*</td><td><b><mark>the</mark></b> theatre <b><mark>theme</mark></b></td></tr>
                <tr><td><button type="button" class="regexInput" data-wr="39">(?&lt;!…)</button></td><td>Negative lookbehind</td><td>(?&lt;!USD)\d{3,}</td><td>USD300 = GBP<b><mark>250</mark></b></td></tr>
            </table>
        </div>
        <div class="regexTitle" data-toggle-section="arabic" role="button" tabindex="0">Arabic Unicode &or;</div>
        <div class="regexClass" data-avk="arabic">
            <table>
                <tr><td><button type="button" class="regexInput" data-wr="40">[…]</button></td><td>Any Arabic character in Unicode </td><td></td><td></td></tr>
                <tr><td><button type="button" class="regexInput" data-wr="41">[…]</button></td><td>Any Arabic punctuation character in Unicode</td><td></td><td></td></tr>
                <tr><td><button type="button" class="regexInput" data-wr="42">[…]</button></td><td>Any Arabic diacritic in Unicode</td><td></td><td></td></tr>
                <tr><td><button type="button" class="regexInput" data-wr="43">[…]</button></td><td>Any Arabic/hindi number in Unicode</td><td></td><td></td></tr>
            </table>
        </div>
</div>`

/**
 * Build the keyboard inside root (an element of the pop-up).
 *
 * @param {object} root - the element that receives the keyboard
 * @param {object} opts - regex: offer the RTL regex mode, letter separation, the regex keys and the cheat sheet;
 *                        storageKey: localStorage key of the custom keys (the original used a cookie "keys");
 *                        onEnter: called for the Enter key of the hardware keyboard and the ⤷ key
 */
export function createKeyboard(root, { regex = true, storageKey = 'avk-keys', onEnter = null } = {}) {
  root.classList.add('avk');
  root.innerHTML = MARKUP(regex);

  function sl(id) {
      return root.querySelector('[data-avk="' + id + '"]');
  }

  var shownCategories = [];

  populateInitialKeys()
  function populateInitialKeys() {
    addKeys(basic, 0);
  }

  var cookieKeys = getKeysFromCookie();
  function getKeysFromCookie() {
    var cookie_keys = getCookie("keys");
    if (cookie_keys) {
      try { return JSON.parse(cookie_keys); } catch (e) { return []; }
    } else {
      return [];
    }
  }

  var keyCategories = regex ? [additional, palaeo, persian, regexchars, cookieKeys] : [additional, palaeo, persian, cookieKeys];
  var categoryByName = { additional, palaeo, persian, regexchars, get cookieKeys() { return cookieKeys; } };

  function toggleAllKeys() {
    makeVisible('extraRows');
    var keyToggles = [...root.querySelectorAll(".keyToggle")].filter(t => !t.closest('[hidden]'));
    var last = keyToggles.length - (regex ? 1 : 0);   // all toggles except the cheatsheet
    if (shownCategories.length === keyCategories.length) { // all are displayed
      removeAllKeys();
      for (let i=0; i<last; i++) {  // switch off all toggles except cheatsheet
        keyToggles[i].checked = false;
      }
    } else {  // some or no toggles are checked
      removeAllKeys();
      // refresh the cookieKeys in the keyCategories array:
      keyCategories = keyCategories.slice(0, -1);
      keyCategories.push(cookieKeys);
      for (let i=0, j=keyCategories.length; i<j; i++) {
        var cat = keyCategories[i];
        addKeys(cat, 1);
      }
      for (let i=0; i<last; i++) {  // switch on all toggles except cheatsheet
        keyToggles[i].checked = true;
      }
    }
  }


  function addKeys(cat, keyGridNo) {
    if (keyGridNo === 1) makeVisible('extraRows');
    if (!shownCategories.includes(cat)) {
      for (let k=0, l=cat.length; k<l; k++) {
        addKey(cat[k][0], cat[k][1], keyGridNo, cat);
      }
      if (keyGridNo === 1) shownCategories.push(cat);
      if (cat === cookieKeys) makeVisible('addNewKeyInput');
    } else {
      removeKeys(cat, keyGridNo)
      if (cat === cookieKeys) toggle('addNewKeyInput');
    }
    if (shownCategories.length !== 0) {
      if (shownCategories.length === keyCategories.length) {
        sl("c6").checked = true;
      } else {
        sl("c6").checked = false;
      }
    }
  }

  function addKey(character, alias, keyGridNo=1, cat="") {
     // new character added by user:
     if (character === "none") {
         var character = sl("extraInput0").value;
         var alias = sl("extraInputDescr0").value;
         if (!character) return false;
         // add the key to the stored keys:
         var keys = getKeysFromCookie();
         keys.push([character, alias]);
         createCookie("keys", JSON.stringify(keys), 365);
         if (shownCategories.includes(cookieKeys)) removeKeys(cookieKeys, 1);
         shownCategories = shownCategories.filter(function(e) { return e !== cookieKeys});
         keyCategories = keyCategories.map(function(e) { return e === cookieKeys ? keys : e});
         cookieKeys = keys;
         addKeys(cookieKeys, 1);
         sl("extraInput0").value = ""; sl("extraInputDescr0").value = "";
         return true;
     }
     // Add the character to the grid:
     var keyCharacterDiv = document.createElement("div");
     if (character===String.raw`\n`) {
       keyCharacterDiv.innerHTML = "⤷";
       keyCharacterDiv.setAttribute("class", "keyCharacter tooltip enter");
     } else if (character===String.raw`\\`) {
       keyCharacterDiv.innerHTML = "&#92;";
       keyCharacterDiv.setAttribute("class", "keyCharacter tooltip");
     } else  if (character==='‌') {
       keyCharacterDiv.innerHTML = '<span class="zwnj">ZWNJ</span>';
       keyCharacterDiv.setAttribute("class", "keyCharacter tooltip");
     } else{
       // the key face shows a vowel sign on a taṭwīl: the dotted circle (U+25CC) is not in the Amiri the apps load, and a
       // vowel sign cannot attach to a circle from another font (see ORIGIN.md); the key still inserts his characters
       keyCharacterDiv.textContent = character.split(circle).join("\u0640");
       if (character===" ") {
         keyCharacterDiv.setAttribute("class", "keyCharacter tooltip space");
       } else {
         keyCharacterDiv.setAttribute("class", "keyCharacter tooltip");
       }
     }
     keyCharacterDiv.setAttribute("role", "button");
     keyCharacterDiv.setAttribute("aria-label", alias || (character === " " ? "space" : character));
     // the original wrote onclick="wr('<character>')": the same characters are inserted (\\ as one backslash);
     // the ⤷ key (and the Enter key) inserts the text into the search field
     if (alias==="backspace") {
         keyCharacterDiv.onclick = function() { remove('backspace'); };
     } else if (alias==="enter") {
         keyCharacterDiv.onclick = function() { if (onEnter) onEnter(); };
     } else {
         var text = character===String.raw`\\` ? "\\" : character;
         keyCharacterDiv.onclick = function() { wr(text); };
     }
     keyCharacterDiv.onpointerdown = function(e) { e.preventDefault(); };   // the text area keeps the focus and the cursor
     keyCharacterDiv.dataset.key = makeKeyId(character, alias);
     root.querySelectorAll(".keyGrid")[keyGridNo].appendChild(keyCharacterDiv);
     if (alias) {
         var ttSpan = document.createElement("span");
         ttSpan.setAttribute("class", "tooltiptext");
         ttSpan.textContent = alias;
         keyCharacterDiv.appendChild(ttSpan);
     }
     return true;
  }

  function makeKeyId(character, alias) {
    if (alias) {
      return "key_"+alias.replace(new RegExp("\W+", "g"), "_");
    } else {
      return "key_"+character; // Math.random().toString(36).substr(2, 5); // random id
    }
  }

  function removeAllKeys() {
    while (shownCategories.length > 0) {
      removeKeys(shownCategories[0], 1)
    }
  }

  function removeKeys(cat, keyGridNo) {
    for (let k=0, l=cat.length; k<l; k++) {
      removeKey(cat[k][0], cat[k][1], keyGridNo, cat);
    }
    // remove the category from the list of shown categories
    shownCategories = shownCategories.filter(function(e) { return e !== cat});
    if (shownCategories.length === 0) {
      toggle('extraRows');
    }
  }

  function removeKey(character, alias, keyGridNo=1, cat="") {
    var id = makeKeyId(character, alias);
    var key = [...root.querySelectorAll(".keyGrid")[keyGridNo].children].find(function(e) { return e.dataset.key === id });
    if (key) key.remove();
  }

  // the original kept the custom keys in a cookie; here they are kept in this browser's localStorage
  function createCookie(name, value, days) {
      try { if (value) localStorage.setItem(storageKey, value); else localStorage.removeItem(storageKey); } catch (e) {}
  }

  function getCookie(c_name) {
      try { return localStorage.getItem(storageKey) || ""; } catch (e) { return ""; }
  }

  function resetKeys() {
      createCookie("keys", "", 365);
      // the original reloaded the page; here the custom keys are removed in place
      if (shownCategories.includes(cookieKeys)) removeKeys(cookieKeys, 1);
      keyCategories = keyCategories.map(function(e) { return e === cookieKeys ? [] : e});
      cookieKeys = [];
      addKeys(cookieKeys, 1);
  }

  //-----------------------------------------------------------------------------


  /**
   * toggle an html element's visibility.
   *
   * @param {string} id - the id of the html element
   */

  function toggle(id) {
     var el = sl(id);
     if (el.style.display === "block"){
         el.style.display = "none";
     } else {
         el.style.display = "block";
     }
  }

  function makeVisible(id) {
     var el = sl(id);
     el.style.display = "block";
  }


  // adapt the paste event in the text area: use the wr() function to input the copied text:

  var ar = sl('area');
  ar.onpaste = function(e) {
    var pastedText = "";
    if (e.clipboardData && e.clipboardData.getData) {
      pastedText = e.clipboardData.getData('text/plain');
    }
    wr(pastedText);
    return false; // Prevent the default handler from running.
  };
  ar.onkeydown = interceptOnKeyDown;


  // Adapt the text area content on checkbox change:

  var checkboxids = ["regexCheck0", "regexCheck"];
  for(var i = 0; i < checkboxids.length; i++) {
    var chckbx = sl(checkboxids[i]);
    chckbx.dataset.id = checkboxids[i];
    chckbx.onchange = function() {
      var ar = sl("area");
      ar.focus();
      var cont = ar.value;
      var [srt, end] = getSelection(ar, true);
      //var srt = toPrevChar(ar.selectionStart, ar.value);
      //var end = toPrevChar(ar.selectionEnd, ar.value);
      ar.value = "";

      // insert the content into the textarea, taking checked checkboxes into account:

      wr(cont);

      // put the cursor/selection box back to where it was:

      if (this.dataset.id==="regexCheck") {  // letter separation checkbox changed
        var vowelRegex = new RegExp(vowels.join("|"), 'g');
        var vowelsBefore = (cont.substring(0,srt).match(vowelRegex) || []).length;
        var vowelsInSel = (cont.substring(srt,end).match(vowelRegex) || []).length;
        if (this.checked) {
          srt = (srt*2) + vowelsBefore;
          end = (end*2) + vowelsBefore + vowelsInSel;
        } else {
          srt =(srt - vowelsBefore) / 2;
          end = (end - vowelsBefore - vowelsInSel) / 2;
        }
      } else {  // Arabic letter order checkbox changed
        var circleRE = new RegExp(circle, "g");
        var vowelsBefore = (cont.substring(0,srt).match(circleRE) || []).length;
        var vowelsInSel = (cont.substring(srt,end).match(circleRE) || []).length;
        if (this.checked) {
          srt = ((srt - vowelsBefore) * 2) + vowelsBefore;
          end = ((end - vowelsBefore - vowelsInSel) * 2) + vowelsBefore + vowelsInSel;
        } else {
          srt = ((srt - vowelsBefore) / 2) + vowelsBefore;
          end = ((end - vowelsBefore - vowelsInSel) / 2) + vowelsBefore + vowelsInSel;
        }
      }

      // Make sure the selection does not spill over the start or end of string:

      srt = Math.max(0, toPrevChar(srt, ar.value));
      end = Math.min(ar.value.length, toPrevChar(end, ar.value));

      // set the selection range:

      ar.setSelectionRange(srt, end);
    }
  }


  //-----------------------------------------------------------------------------


  /**
   * Adapt the standard copy mechanism to remove cosmetic marks.
   * (The original copied through document.execCommand("copy") and showed a message box; here the clipboard API is used.)
   *
   * @param {string} msg - An additional message to prepend to the standard message
   * @param {bool} asIs - If false: remove fom the copied text the marks added to
   *                                force RTL and character split behavior
   *                      If true: copy the selected text as is.
   */

  function copy2Clipboard(msg="", asIs=false) {
    var ar = sl("area");
    var originalAreaContent = ar.value;

    // abort copy if the text area is empty:
    if (!originalAreaContent) {
      return false
    }

    // Get the selected characters from the text area;
    // if nothing is selected, get the entire content of the text area:
    if (ar.selectionStart === ar.selectionEnd) {
      var copyText = ar.value;
    } else {
      var copyText = (ar.value).substring(ar.selectionStart, ar.selectionEnd);
    }

    // prepare the selected text for copying:
    var temp_copyText = asIs ? copyText : stripMarks(copyText);
    try { navigator.clipboard.writeText(temp_copyText); } catch (e) {}
    return temp_copyText;
  }



  /**
   * Insert an item in the text area.
   *
   * @param {string} item - A string to be inserted into the text area
   * @param {number} [offset=0] - number of characters from the start of the item
   *                              after which the cursor should be inserted.
   *                              If offset is 0, cursor will be put after
   *                              inserted text.
   */

  function wr(item, offset=0) {
      var ar = sl('area');

      // remove all cosmetic marks:

      item = item.split(arLet).join("");
      item = item.split(vowSep).join("");
      item = item.split(circle).join("");
      //console.log("adapted item: "+item);
      //console.log("adapted item length: "+item.length);

      // add new cosmetic marks, depending on the checked checkboxes:

      var offsetQ = 1;
      if (sl("regexCheck0").checked && sl("regexCheck").checked) {
        // Add marks to fix the RTL display order (arLet)
        // and character splitting (vowSep) before and after each character.
          item = item.split("");
          var tr = vowSep+arLet+vowSep;
          item = tr + item.join(tr) + tr;
          offsetQ = 4;
      } else if (sl("regexCheck0").checked) {
          // add an Arabic letter mark (؜) before and after every character
          // to fix the display order for every character from right to left:
          item = item.split("");
          item = arLet + item.join(arLet) + arLet;
          offsetQ = 2;
      } else if (sl("regexCheck").checked) {
          // add a MONGOLIAN VOWEL SEPARATOR (᠎) before and after
          // every character to force separation of the Arabic characters:
          item = item.split("");
          item = vowSep + item.join(vowSep) + vowSep;
          offsetQ = 2;
      }
      //console.log("item after adding/deleting separators: "+item);
      //console.log("item length after adding/deleting separators: "+item.length);

      // add or remove dotted vowel circles:
      item = vowelSigns(item, sl("regexCheck").checked);
      //console.log("item after adding/deleting vowel signs: "+item);
      //console.log("item length after adding/deleting vowel signs: "+item.length);

      ar.focus();
      var srt = ar.selectionStart;
      var len = ar.selectionEnd;
      if (srt < len) srt++;
      var txt = ar.value.substring(0, srt) + item + ar.value.substring(len);
      txt = txt.replace(vowSep+vowSep, vowSep);
      txt = txt.replace(arLet+arLet, arLet);
      txt = txt.replace(vowSep+arLet+vowSep+arLet, vowSep+arLet);
      txt = txt.replace(arLet+vowSep+arLet+vowSep, arLet+vowSep);
      ar.value = txt;
      srt = toPrevChar((srt + item.length) - (offsetQ * offset), txt)
      ar.setSelectionRange(srt, srt);
      ar.focus();
      ar.scrollTop = ar.scrollHeight;
  }


  // ----------------------------------------------------------------------------


   // Define functionality of some keys of the hardware keyboard.


  /**
   * Change the functionality of some keyboard keys.
   */

  function interceptOnKeyDown(event) {
      var keyID = event.which;
      if (event.ctrlKey || event.metaKey) { // if Ctrl key (on Windows) or Cmd key (on Mac) is pressed :
        if (keyID === 67) {  // check if c key is also pressed;
          // if so, adapt the copy event:
          event.preventDefault();
          if(event.shiftKey) {  // ctrl+shift+c: copy as is
            copy2Clipboard("", true);
          } else {  // ctrl+c: copy without the separator characters
            copy2Clipboard();
          }
        } else {
          // do nothing: let the standard event happen (ctrl+v, ctrl+f, ...)
        }
      } else if (keyID === 13) { // enter: insert into the search field (added for the pop-up)
        event.preventDefault();
        if (onEnter) onEnter();
      } else if (keyID === 8) { // if backspace key is pressed:
        event.preventDefault();
        remove("backspace");
      } else if (keyID === 46) { // if delete key is pressed:
        event.preventDefault();
        remove("del");
      } else if (keyID === 37) { // if arrow left key is pressed:
        event.preventDefault();
        arrowL(event.shiftKey);
      } else if (keyID === 39) { // if arrow right key is pressed:
        event.preventDefault();
        arrowR(event.shiftKey);
      } else if (event.key.length === 1 && !event.isComposing) { // use wr() function to insert letter and number keys
        event.preventDefault();
        wr(event.key);
      } else {
        // do nothing: normal functionality of the key.
      }
  }


  /**
   * Define the functionality of the right arrow key.
   * NB both arrow keys bring the caret to immediately after a character.
   *
   * @param {bool} shiftKey - If shiftKey is set to true, the shiftKey was pressed
   *                          with the arrow key.
   */

  function arrowR(shiftKey) {
    var target = sl("area");
    var [srt, end] = getSelection(target, true);
    if (srt < end) {  // if something is selected
      if (shiftKey) { // if shift is pressed, extend the selection to the right
        srt--;
        srt = toPrevChar(srt, target.value); // include all nonChars before character
      } else {  // if shift is not pressed, move the cursor to the start of selection
        end = srt;
      }
      if (srt < 0) srt = 0; // make sure selection does not go beyond position 0
    } else {  // if nothing is selected, move cursor to  before previous character
      srt--;
      srt = toPrevChar(srt, target.value);
      if (!shiftKey) end = srt;
    }
    target.setSelectionRange(srt, end);
    target.focus();
  }



  /**
   * Define the functionality of the left arrow key.
   * NB both arrow keys bring the caret to immediately after a character.
   *
   * @param {bool} shiftKey - If shiftKey is set to true, the shiftKey was pressed
   *                          with the arrow key.
   */

  function arrowL(shiftKey) {
    // NB: both arrow keys always bring caret to immediately after a character
    var target = sl("area");
    var [srt, end] = getSelection(target, true);
    if (srt < end) {   // if something is selected
      if (shiftKey) {  // if shift is pressed, extend the selection to the left
        end = toNextChar(end, target.value);
        end++;
      } else {         // if shift is not pressed, move cursor to end of selection
        srt = end;
      }
    } else {  // if nothing is selected, move cursor to position after next character
      end = toNextChar(end, target.value);
      end++;
      if (end > target.value.length) end = 0;
      if (!shiftKey) srt = end;
    }
    target.setSelectionRange(srt, end);
    target.focus();
  }


  /**
   * Define the functionality of the delete and backspace keys.
   * NB both keys bring the caret to immediately after a character.
   *
   * @param {string} rmType - Either "backspace" or "del"
   */

  function remove(rmType) {
    var target = sl("area");
    var [srt, end] = getSelection(target, true);
    if (srt === end) { // if nothing is selected
      if (rmType === "del") {  // remove following character
        end = toNextChar(end, target.value);
        end = Math.min(target.value.length, (end+1));
      } else if (rmType === "backspace") { // remove preceding character
        srt = Math.max(0, toPrevChar(srt-1, target.value));
      }
    } else {  // if something is selected
      // do not change srt or end; selected characters will be removed.
    }
    target.value = target.value.substring(0, srt) + target.value.substring(end);
    target.setSelectionRange(srt, srt);
    target.focus();
    return true;
  }

  // ---- the handlers of the original's inline onclick attributes, attached inside the pop-up -------------------------
  root.querySelectorAll('.keyToggle[data-cat]').forEach(function(t) { t.onclick = function() { addKeys(categoryByName[t.dataset.cat], 1); }; });
  root.querySelector('.keyToggle[data-all]').onclick = function() { toggleAllKeys(); };
  root.querySelector('.keyToggle[data-toggle]').onclick = function() { toggle('cheatsheet'); };
  root.querySelector('[data-addkey]').onclick = function() { addKey("none", "none"); };
  root.querySelector('[data-resetkeys]').onclick = function() { resetKeys(); };
  var CHEAT = [
    function() { wr('.'); },
    function() { wr('\\'); },
    function() { wr(String.raw`\d`); },
    function() { wr(String.raw`\w`); },
    function() { wr(String.raw`\s`); },
    function() { wr(String.raw`\D`); },
    function() { wr(String.raw`\W`); },
    function() { wr(String.raw`\S`); },
    function() { wr(String.raw`\t`); },
    function() { wr(String.raw`\r`); },
    function() { wr(String.raw`\n`); },
    function() { wr(String.raw`\r`+'\u061C'+String.raw`\n`); },
    function() { wr('?'); },
    function() { wr('*'); },
    function() { wr('+'); },
    function() { wr('{}', 1); },
    function() { wr('{,}', 2); },
    function() { wr('{,}', 2); },
    function() { wr('??'); },
    function() { wr('+?'); },
    function() { wr('{,}?', 3); },
    function() { wr('{,}?', 3); },
    function() { wr('*?'); },
    function() { wr('|'); },
    function() { wr('()', 1); },
    function() { wr(String.raw`\1`); },
    function() { wr(String.raw`\2`); },
    function() { wr('(?:)', 1); },
    function() { wr('[]', 1); },
    function() { wr('[-]', 2); },
    function() { wr('[^]', 1); },
    function() { wr('[^-]', 2); },
    function() { wr('^'); },
    function() { wr('$'); },
    function() { wr(String.raw`\b`); },
    function() { wr(String.raw`\B`); },
    function() { wr('(?=)', 1); },
    function() { wr('(?\u003c=)', 1); },
    function() { wr('(?!)', 1); },
    function() { wr('(?\u003c!)', 1); },
    function() { wr('[\u0600-\u06ff\u08a0-\u08ff\ufb50-\ufdff\ufe70-\ufeff]'); },
    function() { wr('[،؍؎؏؛؞؟٭۔۝۞۩۽]'); },
    function() { wr('[\u25cc\u0610-\u25cc\u061A\u25cc\u064b-\u25cc\u065f\u25cc\u0670\u25cc\u06d6-\u25cc\u06dc\u25cc\u06df-\u25cc\u06e4\u25cc\u06e7\u25cc\u06e8\u25cc\u06ea-\u25cc\u06ed]'); },
    function() { wr('[\u0660-\u0669\u06f0-\u06f9]'); },
  ];
  root.querySelectorAll('[data-wr]').forEach(function(b) { b.onpointerdown = function(e) { e.preventDefault(); }; b.onclick = function() { CHEAT[Number(b.dataset.wr)](); }; });
  root.querySelectorAll('[data-toggle-section]').forEach(function(t) { t.onclick = function() { toggle(t.dataset.toggleSection); }; });

  // ---- the pop-up's interface -----------------------------------------------------------------------------------------
  return {
    // fill the text area with a field's value, with the marks of the current toggles
    setValue(value) { ar.value = ""; ar.setSelectionRange(0, 0); wr(value || ""); },
    // the text without any display mark (the stripping of the original's copy function), on one line
    getValue() { return stripMarks(ar.value).replace(/[\r\n]+/g, ""); },
    focus() { ar.focus(); },
  };
}
