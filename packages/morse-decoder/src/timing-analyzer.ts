import type { MorseElement, MorseGap, TimingConfig } from "./types";
import { ditDurationMs } from "./constants";

/**
 * Creates a timing analyzer that classifies tone and silence durations
 * into morse elements and gap types using WPM-derived unit timing.
 *
 * Adaptive mode uses observed tone durations (both dits and dahs) to
 * track the sender's actual speed, with bounds checking to prevent
 * divergence from noise or misclassification.
 */
export function createTimingAnalyzer(config: TimingConfig): {
  onToneEnd(durationMs: number): MorseElement | null;
  onSilenceEnd(durationMs: number): MorseGap;
  getCurrentWpm(): number;
} {
  let ditUnit = ditDurationMs(config.wpm);
  let currentWpm = config.wpm;

  // Bounds for adaptive dit unit: allow 2x variation from initial estimate
  const minDitUnit = ditUnit * 0.3;
  const maxDitUnit = ditUnit * 3.0;

  return {
    onToneEnd(durationMs: number): MorseElement | null {
      // Reject implausibly short tones (noise spikes)
      // Must be at least 20% of current dit unit
      if (durationMs < ditUnit * 0.2) {
        return null;
      }

      // Threshold between dit and dah: 2x dit unit (midpoint of 1 and 3)
      const element: MorseElement = durationMs < 2 * ditUnit ? "dit" : "dah";

      // Adaptive: update dit estimate using observed elements
      if (config.adaptive) {
        let observedDit: number;
        if (element === "dit") {
          observedDit = durationMs;
        } else {
          // Dah should be ~3x dit, so infer dit from dah
          observedDit = durationMs / 3;
        }

        // Only adapt if the observed value is within reasonable bounds
        if (observedDit >= minDitUnit && observedDit <= maxDitUnit) {
          // Slow EMA to prevent rapid divergence
          ditUnit = ditUnit * 0.85 + observedDit * 0.15;
          currentWpm = 1200 / ditUnit;
        }
      }

      return element;
    },

    onSilenceEnd(durationMs: number): MorseGap {
      // Element gap: < 1.5x dit unit
      // Character gap: between 1.5x and 5x dit unit
      // Word gap: >= 5x dit unit
      // Using 1.5x (midpoint of 1 and 2) instead of 2x provides better
      // separation for audio with Farnsworth-style timing where character
      // gaps are compressed relative to standard PARIS timing.
      if (durationMs < 1.5 * ditUnit) return "element";
      if (durationMs < 5 * ditUnit) return "character";
      return "word";
    },

    getCurrentWpm(): number {
      return currentWpm;
    },
  };
}
