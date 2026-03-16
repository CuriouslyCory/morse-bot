import type { DecoderConfig } from "./types";

/** Default decoder configuration values */
export const DEFAULT_CONFIG: DecoderConfig = {
  targetFrequency: 600,
  sampleRate: 8000,
  blockSize: 256,
  wpm: 15,
  adaptive: true,
  threshold: 0.01,
};

/** Timing ratios relative to one dit unit */
export const TIMING_RATIOS = {
  dit: 1,
  elementGap: 1,
  dah: 3,
  charGap: 3,
  wordGap: 7,
} as const;

/**
 * Compute the dit duration in milliseconds from WPM.
 * Standard formula: dit_ms = 1200 / wpm
 */
export function ditDurationMs(wpm: number): number {
  return 1200 / wpm;
}
