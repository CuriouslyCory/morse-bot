import type { MorseElement } from "./types";

/**
 * ITU Morse code mapping: dot-dash sequence string -> character.
 * '.' = dit, '-' = dah
 */
const MORSE_TO_CHAR: Record<string, string> = {
  // Letters
  ".-": "A",
  "-...": "B",
  "-.-.": "C",
  "-..": "D",
  ".": "E",
  "..-.": "F",
  "--.": "G",
  "....": "H",
  "..": "I",
  ".---": "J",
  "-.-": "K",
  ".-..": "L",
  "--": "M",
  "-.": "N",
  "---": "O",
  ".--.": "P",
  "--.-": "Q",
  ".-.": "R",
  "...": "S",
  "-": "T",
  "..-": "U",
  "...-": "V",
  ".--": "W",
  "-..-": "X",
  "-.--": "Y",
  "--..": "Z",
  // Digits
  ".----": "1",
  "..---": "2",
  "...--": "3",
  "....-": "4",
  ".....": "5",
  "-....": "6",
  "--...": "7",
  "---..": "8",
  "----.": "9",
  "-----": "0",
  // Punctuation
  ".-.-.-": ".",
  "--..--": ",",
  "..--..": "?",
  ".----.": "'",
  "-.-.--": "!",
  "-..-.": "/",
  "-.--.": "(",
  "-.--.-": ")",
  ".-...": "&",
  "---...": ":",
  "-.-.-.": ";",
  "-...-": "=",
  ".-.-.": "+",
  "-....-": "-",
  "..--.-": "_",
  ".-..-.": '"',
  "...-..-": "$",
  ".--.-.": "@",
};

/** Reverse map: character -> dot-dash sequence string */
const CHAR_TO_MORSE: Record<string, string> = Object.fromEntries(
  Object.entries(MORSE_TO_CHAR).map(([code, char]) => [char, code]),
);

function elementsToCode(elements: MorseElement[]): string {
  return elements.map((e) => (e === "dit" ? "." : "-")).join("");
}

function codeToElements(code: string): MorseElement[] {
  return [...code].map((c) => (c === "." ? "dit" : "dah"));
}

/**
 * Look up the character for a given sequence of morse elements.
 * Returns null if the sequence is not recognized.
 */
export function lookupMorse(elements: MorseElement[]): string | null {
  const code = elementsToCode(elements);
  return MORSE_TO_CHAR[code] ?? null;
}

/**
 * Get the morse elements for a given character (case-insensitive).
 * Returns null if the character has no morse representation.
 */
export function getMorseForChar(char: string): MorseElement[] | null {
  const upper = char.toUpperCase();
  const code = CHAR_TO_MORSE[upper];
  if (!code) return null;
  return codeToElements(code);
}
