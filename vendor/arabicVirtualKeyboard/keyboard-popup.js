// Arabic Virtual Keyboard, adapted as a pop-up for the DHFAIS apps (OpenITI NgramReader, Book Classifier).
//
// Original: Peter Verkinderen, https://github.com/pverkind/arabicVirtualKeyboard (jscript/keyboard.js, commit 2f7975e,
// 2021-05-12), "an Arabic virtual keyboard for easily writing Arabic regular expressions, including palaeographic
// characters", itself based on Ahmad Ismail's Arabic keyboard, http://www.arabic-keyboard.org/.
// Adapted with Peter Verkinderen's permission (via Maxim Romanov, 2026-11-10). The unchanged original is in original/;
// every change is listed in ORIGIN.md. His functions for adding and stripping the display marks (wr, vowelSigns,
// toPrevChar, toNextChar, getSelection, remove, arrowL, arrowR and the stripping lines of copy2Clipboard) keep their
// bodies; they now look up their elements inside the pop-up (sl) instead of the whole page.
// Simplified for the apps (ORIGIN.md, change 12): only the letters the corpus keeps distinct (given by the app), one row of
// regex symbols, space, "_", backspace, the cursor arrows; no vowel, palaeographic, Persian or custom keys, no cheat sheet.

//* Define the main cosmetic markers used to force RTL
const arLet = "\u061c"; // Arabic letter mark
const vowSep = "\u180e"; // Mongolian vowel separator
const circle = "\u25cc"; // dotted circle for diacritics
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
    //temp_copyText = temp_copyText.split("\u200e").join(""); //left-to-right mark
    //temp_copyText = temp_copyText.split(" ").join(""); //hair space
    return temp_copyText;
}

//-----------------------------------------------------------------------------

// His key lists. The pop-up shows the letters of basic that the app passes (letters), in his order; of regexchars the
// row the apps use (REGEX_ROW), plus \w; and the keys for space, "_", backspace and the cursor arrows.

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
    ["\u279e", "backspace"],                                  // Row 1
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
    ['\u200c', "zero-width non-joiner (فاصله\u0654 مجازی)"],
    ['؟', "Arabic question mark"],
    ['.', "full stop"],
    ["!", "exclamation mark"],                                // Row 5
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

// the regex row of the apps, in this order: his keys and aliases, and \w (added)
var REGEX_ROW = ['[', ']', '(', ')', '|', '?', '*', '+', '.', String.raw`\w`, '-', '^'];
var WORD_CHAR = [String.raw`\w`, "word character: a letter, digit or _"];

var vowels = [
    '\u0652', //sukūn
    '\u064b', //fatḥatān
    '\u064c', //ḍammatān
    '\u064d', //kasratān
    '\u064e', //fatḥa
    '\u064f', //ḍamma
    '\u0650', //kasra
    '\u0651', //shadda
    '\u06e1', //Quranic sukūn
    '\u08f0', //Quranic open fatḥatān
    '\u08f1', //Quranic open ḍammatān
    '\u08f2', //Quranic open kasratān
    '\u0670', //dagger alif
];

function vowelSigns(txt, include=true) {
  //console.log("add vowel signs:"+include);
  if (include) {
    for (let i=0, j=vowels.length; i<j; i++) {
      txt = txt.split(vowels[i]).join(circle+vowels[i]); // add dotted circles
    }
    txt = txt.replace(/\u25cc+/g, "\u25cc");
  } else {
    txt = txt.split("\u25cc").join(""); // remove dotted circles
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

// the markup of the pop-up: the parts of the original index.html (#intro, #keyboard) that remain, with ids replaced by
// data-avk names (see ORIGIN.md)
const MARKUP = (regex) => `
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
    <div class="keyGrid keyGridBasic" data-avk="letters" aria-label="Arabic letters"></div>
    <div class="keyGrid keyGridRegex" data-avk="regex" aria-label="Regular expression symbols"${regex ? '' : ' hidden'}></div>
    <div class="keyGrid keyGridControls" data-avk="controls" aria-label="Space, underscore, cursor, backspace"></div>
</div>`

/**
 * Build the keyboard inside root (an element of the pop-up).
 *
 * @param {object} root - the element that receives the keyboard
 * @param {object} opts - letters: the Arabic letters to offer (the app's distinct letters);
 *                        regex: offer the RTL regex mode, letter separation and the regex row;
 *                        onEnter: called for the Enter key of the hardware keyboard
 */
export function createKeyboard(root, { letters = [], regex = true, onEnter = null } = {}) {
  root.classList.add('avk');
  root.innerHTML = MARKUP(regex);

  function sl(id) {
      return root.querySelector('[data-avk="' + id + '"]');
  }

  // a key: his addKey, reduced to the kinds of keys that remain
  function addKey(character, alias, grid, onclick, cls = "") {
     var keyCharacterDiv = document.createElement("div");
     keyCharacterDiv.textContent = character;
     keyCharacterDiv.setAttribute("class", "keyCharacter tooltip " + cls);
     keyCharacterDiv.setAttribute("role", "button");
     keyCharacterDiv.setAttribute("aria-label", alias || character);
     keyCharacterDiv.onclick = onclick;
     keyCharacterDiv.onpointerdown = function(e) { e.preventDefault(); };   // the text area keeps the focus and the cursor
     sl(grid).appendChild(keyCharacterDiv);
     if (alias) {
         var ttSpan = document.createElement("span");
         ttSpan.setAttribute("class", "tooltiptext");
         ttSpan.textContent = alias;
         keyCharacterDiv.appendChild(ttSpan);
     }
  }

  // the letters: his layout (basic), only the letters the app passes; any other of them after his
  var shown = basic.map(function(k) { return k[0]; }).filter(function(c) { return letters.includes(c); });
  letters.filter(function(c) { return !shown.includes(c); }).forEach(function(c) { shown.push(c); });
  shown.forEach(function(c) { addKey(c, "", "letters", function() { wr(c); }); });
  // the regex row: his keys with his aliases (the backslash of \w is inserted as typed)
  if (regex) REGEX_ROW.forEach(function(c) {
      var k = c === WORD_CHAR[0] ? WORD_CHAR : regexchars.find(function(x) { return x[0] === c; });
      addKey(c, k[1], "regex", function() { wr(c); }, "rx");
  });
  // space, underscore (joins the words of a phrase), the cursor arrows (his arrowL, arrowR), backspace (his remove)
  addKey(" ", "space", "controls", function() { wr(" "); }, "space");
  addKey("_", "underscore: joins the words of a phrase", "controls", function() { wr("_"); }, "rx");
  addKey("\u2190", "cursor left", "controls", function() { arrowL(false); }, "ctl");
  addKey("\u2192", "cursor right", "controls", function() { arrowR(false); }, "ctl");
  addKey("\u232b", "backspace", "controls", function() { remove("backspace"); }, "ctl");


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
          // add an Arabic letter mark (\u061c) before and after every character
          // to fix the display order for every character from right to left:
          item = item.split("");
          item = arLet + item.join(arLet) + arLet;
          offsetQ = 2;
      } else if (sl("regexCheck").checked) {
          // add a MONGOLIAN VOWEL SEPARATOR (\u180e) before and after
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

  // ---- the pop-up's interface -----------------------------------------------------------------------------------------
  return {
    // fill the text area with a field's value, with the marks of the current toggles
    setValue(value) { ar.value = ""; ar.setSelectionRange(0, 0); wr(value || ""); },
    // the text without any display mark (the stripping of the original's copy function), on one line
    getValue() { return stripMarks(ar.value).replace(/[\r\n]+/g, ""); },
    focus() { ar.focus(); },
  };
}
