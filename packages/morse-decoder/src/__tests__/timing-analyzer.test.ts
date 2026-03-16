import { describe, expect, it } from "vitest";

import { ditDurationMs } from "../constants";
import { createTimingAnalyzer } from "../timing-analyzer";

describe("createTimingAnalyzer", () => {
  describe("onToneEnd - dit/dah classification", () => {
    it("classifies short tones as dit", () => {
      const analyzer = createTimingAnalyzer({ wpm: 20, adaptive: false });
      const ditMs = ditDurationMs(20); // 60ms
      expect(analyzer.onToneEnd(ditMs)).toBe("dit");
      expect(analyzer.onToneEnd(ditMs * 0.5)).toBe("dit");
    });

    it("classifies long tones as dah", () => {
      const analyzer = createTimingAnalyzer({ wpm: 20, adaptive: false });
      const ditMs = ditDurationMs(20); // 60ms
      expect(analyzer.onToneEnd(ditMs * 3)).toBe("dah");
      expect(analyzer.onToneEnd(ditMs * 2)).toBe("dah");
    });

    it("threshold between dit and dah is 2x dit unit", () => {
      const analyzer = createTimingAnalyzer({ wpm: 20, adaptive: false });
      const ditMs = ditDurationMs(20);
      // Below threshold should be dit
      expect(analyzer.onToneEnd(ditMs * 1.9)).toBe("dit");
      // At and above threshold should be dah
      expect(analyzer.onToneEnd(ditMs * 2)).toBe("dah");
      expect(analyzer.onToneEnd(ditMs * 2.1)).toBe("dah");
    });

    it("rejects implausibly short tones as noise", () => {
      const analyzer = createTimingAnalyzer({ wpm: 20, adaptive: false });
      const ditMs = ditDurationMs(20);
      // Less than 20% of dit unit should be rejected
      expect(analyzer.onToneEnd(ditMs * 0.1)).toBeNull();
      expect(analyzer.onToneEnd(ditMs * 0.15)).toBeNull();
    });
  });

  describe("onSilenceEnd - gap classification", () => {
    it("classifies short silences as element gaps", () => {
      const analyzer = createTimingAnalyzer({ wpm: 20, adaptive: false });
      const ditMs = ditDurationMs(20);
      expect(analyzer.onSilenceEnd(ditMs)).toBe("element");
      expect(analyzer.onSilenceEnd(ditMs * 1.4)).toBe("element");
    });

    it("classifies medium silences as character gaps", () => {
      const analyzer = createTimingAnalyzer({ wpm: 20, adaptive: false });
      const ditMs = ditDurationMs(20);
      expect(analyzer.onSilenceEnd(ditMs * 1.5)).toBe("character");
      expect(analyzer.onSilenceEnd(ditMs * 3)).toBe("character");
      expect(analyzer.onSilenceEnd(ditMs * 4.9)).toBe("character");
    });

    it("classifies long silences as word gaps", () => {
      const analyzer = createTimingAnalyzer({ wpm: 20, adaptive: false });
      const ditMs = ditDurationMs(20);
      expect(analyzer.onSilenceEnd(ditMs * 5)).toBe("word");
      expect(analyzer.onSilenceEnd(ditMs * 10)).toBe("word");
    });
  });

  describe("adaptive WPM tracking", () => {
    it("adjusts WPM based on observed dit durations", () => {
      const analyzer = createTimingAnalyzer({ wpm: 15, adaptive: true });
      const initialWpm = analyzer.getCurrentWpm();

      // Feed dits that are faster (shorter) than 15 WPM
      const fasterDitMs = ditDurationMs(25); // 48ms
      for (let i = 0; i < 20; i++) {
        analyzer.onToneEnd(fasterDitMs);
      }

      // WPM should have increased towards 25
      expect(analyzer.getCurrentWpm()).toBeGreaterThan(initialWpm);
    });

    it("does not adapt when adaptive is false", () => {
      const analyzer = createTimingAnalyzer({ wpm: 15, adaptive: false });

      const fasterDitMs = ditDurationMs(25);
      for (let i = 0; i < 20; i++) {
        analyzer.onToneEnd(fasterDitMs);
      }

      expect(analyzer.getCurrentWpm()).toBe(15);
    });

    it("adapts using dah observations too", () => {
      const analyzer = createTimingAnalyzer({ wpm: 15, adaptive: true });
      const initialWpm = analyzer.getCurrentWpm();

      // Feed dahs consistent with 20 WPM (dit=60ms, dah=180ms)
      // At 15 WPM, ditUnit=80ms, threshold=160ms, so 180ms > threshold → classified as dah
      // Inferred dit = 180/3 = 60ms, pushing WPM toward 20
      const fasterDahMs = ditDurationMs(20) * 3;
      for (let i = 0; i < 20; i++) {
        analyzer.onToneEnd(fasterDahMs);
      }

      // WPM should have increased since dahs imply faster speed
      expect(analyzer.getCurrentWpm()).toBeGreaterThan(initialWpm);
    });
  });

  describe("ditDurationMs", () => {
    it("returns correct duration at standard speeds", () => {
      expect(ditDurationMs(15)).toBeCloseTo(80);
      expect(ditDurationMs(20)).toBeCloseTo(60);
      expect(ditDurationMs(25)).toBeCloseTo(48);
    });
  });
});
