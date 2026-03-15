export type MorseElement = "dit" | "dah";

export type MorseGap = "element" | "character" | "word";

export interface GoertzelResult {
  /** Linear magnitude of the detected frequency */
  magnitude: number;
  /** Magnitude in decibels full scale */
  magnitudeDb: number;
}

export interface DecoderConfig {
  /** Target frequency to detect in Hz (default: 600) */
  targetFrequency: number;
  /** Audio sample rate in Hz (default: 8000) */
  sampleRate: number;
  /** Number of samples per processing block (default: 256) */
  blockSize: number;
  /** Initial words per minute estimate (default: 15) */
  wpm: number;
  /** Whether to adaptively track sender speed (default: true) */
  adaptive: boolean;
  /** Detection threshold for tone presence (default: 0.01) */
  threshold: number;
}

export interface DecoderEvents {
  onCharacter?: (char: string) => void;
  onWordBoundary?: () => void;
  onElement?: (element: MorseElement) => void;
  onToneChange?: (active: boolean) => void;
  onStats?: (stats: DecoderStats) => void;
}

export interface DecoderStats {
  /** Current signal level in dBFS */
  signalDb: number;
  /** Target detection frequency in Hz */
  frequency: number;
  /** Signal-to-noise ratio in dB */
  snrDb: number;
  /** Current estimated words per minute */
  wpm: number;
  /** Whether a tone is currently active */
  toneActive: boolean;
}
