// Whisper isn't a diacritization model — any tashkeel it emits is noise, not signal.
// Ranges: Quranic annotation signs, combining tashkeel, superscript alef, small high signs.
const ARABIC_DIACRITICS_RE = /[ؐ-ًؚ-ٰٟۖ-ۭ]/g;
const TATWEEL_RE = /ـ/g; // kashida/elongation character

const PUNCTUATION_MAP: Record<string, string> = {
  ",": "،", // Arabic comma
  ";": "؛", // Arabic semicolon
  "?": "؟", // Arabic question mark
};

const ARABIC_INDIC_DIGITS = "٠١٢٣٤٥٦٧٨٩".split("");

export function normalizeArabicText(text: string): string {
  return text
    .replace(ARABIC_DIACRITICS_RE, "")
    .replace(TATWEEL_RE, "")
    .replace(/[,;?]/g, (match) => PUNCTUATION_MAP[match])
    .replace(/[0-9]/g, (digit) => ARABIC_INDIC_DIGITS[Number(digit)])
    .replace(/\s+/g, " ")
    .trim();
}
