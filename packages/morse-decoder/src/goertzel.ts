import type { GoertzelConfig, GoertzelResult } from "./types.js";

/**
 * Creates a Goertzel single-frequency detector.
 * Uses the standard second-order IIR algorithm to detect magnitude at a
 * target frequency without computing a full FFT.
 */
export function createGoertzelFilter(config: GoertzelConfig): {
  process(samples: Float32Array): GoertzelResult;
} {
  const { targetFrequency, sampleRate } = config;
  const omega = (2 * Math.PI * targetFrequency) / sampleRate;
  const coeff = 2 * Math.cos(omega);

  return {
    process(samples: Float32Array): GoertzelResult {
      const N = samples.length;
      let s1 = 0;
      let s2 = 0;

      for (let i = 0; i < N; i++) {
        const s0 = (samples[i] ?? 0) + coeff * s1 - s2;
        s2 = s1;
        s1 = s0;
      }

      // Goertzel power formula
      const power = s1 * s1 + s2 * s2 - coeff * s1 * s2;
      const magnitude = Math.sqrt(Math.max(0, power)) / (N / 2);
      const magnitudeDb = 20 * Math.log10(magnitude + 1e-10);

      return { magnitude, magnitudeDb };
    },
  };
}
