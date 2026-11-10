// Arabic letters and their simplified Buckwalter transliteration (shared by both apps; keep both copies the same).
// One table for the NgramReader's search (query.js) and for the keys of the Arabic keyboard in both apps (arkb.js).

// simplified Buckwalter, as used by the NgramReader data (R app www/BuckwalterSimplified.txt),
// plus Persian letters that occur in Arabic texts (ی, ک) and alif wasla (normalised to A in the data).
// The first letter listed for a transliteration is the one the data keep; the letters after it are normalised into it.
export const AR2BW = {
  'ء': 'c', 'ا': 'A', 'إ': 'A', 'أ': 'A', 'آ': 'A', 'ٱ': 'A', 'ب': 'b', 'ة': 'o', 'ت': 't', 'ث': 'v', 'ج': 'j',
  'ح': 'H', 'خ': 'x', 'د': 'd', 'ذ': 'V', 'ر': 'r', 'ز': 'z', 'س': 's', 'ش': 'E', 'ص': 'S', 'ض': 'D', 'ط': 'T',
  'ظ': 'Z', 'ع': 'C', 'غ': 'g', 'ف': 'f', 'ق': 'q', 'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n', 'ه': 'h', 'ؤ': 'c',
  'و': 'w', 'ي': 'y', 'ى': 'y', 'ئ': 'c', 'ی': 'y', 'ک': 'k',
}
// the letters the data keep distinct: one per transliteration, the first listed (the keys of the Arabic keyboard)
export const DISTINCT_LETTERS = Object.entries(AR2BW).filter(([ch, bw], i, all) => all.findIndex(([, b]) => b === bw) === i).map(([ch]) => ch)
// the letters normalised into another: letter -> the letter it becomes
export const NORMALISED = Object.fromEntries(Object.entries(AR2BW).filter(([ch]) => !DISTINCT_LETTERS.includes(ch)).map(([ch, bw]) => [ch, DISTINCT_LETTERS.find(d => AR2BW[d] === bw)]))
