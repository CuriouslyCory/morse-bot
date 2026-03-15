import type { MorseElement, MorseGap, TimingConfig } from "./types";
import { ditDurationMs } from "./constants";

/**
 * Creates a timing analyzer that classifies tone and silence durations
 * into morse elements and gap types using WPM-derived unit timing.
 * Adaptive mode uses an EMA on observed dit durations to track sender speed.
 */
export function createTimingAnalyzer(config: TimingConfig): {
  onToneEnd(durationMs: number): MorseElement;
  onSilenceEnd(durationMs: number): MorseGap;
  getCurrentWpm(): number;
} {
  let ditUnit = ditDurationMs(config.wpm);
  let currentWpm = config.wpm;

  return {
    onToneEnd(durationMs: number): MorseElement {
      // Threshold between dit and dah: 1.5x dit unit
      const element: MorseElement = durationMs <= 1.5 * ditUnit ? "dit" : "dah";

      // Adaptive: update dit estimate using observed dits (EMA)
      if (config.adaptive && element === "dit") {
        ditUnit = ditUnit * 0.9 + durationMs * 0.1;
        currentWpm = 1200 / ditUnit;
      }

      return element;
    },

    onSilenceEnd(durationMs: number): MorseGap {
      // Element gap: < 2x dit unit
      // Character gap: between 2x and 5x dit unit (midpoint of 3x and 7x)
      // Word gap: >= 5x dit unit
      if (durationMs < 2 * ditUnit) return "element";
      if (durationMs < 5 * ditUnit) return "character";
      return "word";
    },

    getCurrentWpm(): number {
      return currentWpm;
    },
  };
}
