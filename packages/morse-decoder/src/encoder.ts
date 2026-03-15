import { ditDurationMs, TIMING_RATIOS } from "./constants";
import { getMorseForChar } from "./morse-tree";

export interface EncoderConfig {
  wpm: number;
  frequency: number;
}

export interface ToneEvent {
  type: "tone" | "silence";
  durationMs: number;
}

export interface MorseEncoder {
  encode(text: string): ToneEvent[];
}

/**
 * Create a morse encoder that converts text to tone/silence timing events.
 * Timing derived from WPM: dit = 1200/wpm ms, dah = 3x, element gap = 1x, char gap = 3x, word gap = 7x.
 * Unknown characters are skipped without error.
 */
export function createEncoder(config: EncoderConfig): MorseEncoder {
  return {
    encode(text: string): ToneEvent[] {
      const dit = ditDurationMs(config.wpm);
      const dah = dit * TIMING_RATIOS.dah;
      const elementGap = dit * TIMING_RATIOS.elementGap;
      const charGap = dit * TIMING_RATIOS.charGap;
      const wordGap = dit * TIMING_RATIOS.wordGap;

      const events: ToneEvent[] = [];
      const words = text.split(" ");

      for (let wi = 0; wi < words.length; wi++) {
        const word = words[wi];
        if (!word) continue;

        if (wi > 0 && events.length > 0) {
          events.push({ type: "silence", durationMs: wordGap });
        }

        const chars = [...word];
        let charEmitted = false;

        for (const char of chars) {
          const elements = getMorseForChar(char);
          if (!elements || elements.length === 0) continue;

          if (charEmitted) {
            events.push({ type: "silence", durationMs: charGap });
          }

          for (let ei = 0; ei < elements.length; ei++) {
            if (ei > 0) {
              events.push({ type: "silence", durationMs: elementGap });
            }
            const elem = elements[ei];
            events.push({
              type: "tone",
              durationMs: elem === "dit" ? dit : dah,
            });
          }

          charEmitted = true;
        }
      }

      return events;
    },
  };
}
