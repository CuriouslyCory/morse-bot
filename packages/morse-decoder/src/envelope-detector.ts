import type { EnvelopeConfig, EnvelopeState } from "./types.js";

/**
 * Creates an envelope detector with dual-threshold hysteresis.
 * The separate on/off thresholds prevent jitter at the signal boundary.
 * Tracks a slow-moving noise floor estimate when tone is inactive.
 */
export function createEnvelopeDetector(config: EnvelopeConfig): {
  process(magnitude: number, timestampMs: number): EnvelopeState;
} {
  const { onThreshold, offThreshold } = config;
  let toneActive = false;
  let stateStartMs: number | null = null;
  let noiseFloor = 1e-4;

  return {
    process(magnitude: number, timestampMs: number): EnvelopeState {
      // Initialize state start on first call
      if (stateStartMs === null) {
        stateStartMs = timestampMs;
      }

      // Apply hysteresis: higher threshold to turn on, lower to turn off
      if (!toneActive && magnitude >= onThreshold) {
        toneActive = true;
        stateStartMs = timestampMs;
      } else if (toneActive && magnitude < offThreshold) {
        toneActive = false;
        stateStartMs = timestampMs;
      }

      // Update noise floor with slow EMA when tone is off
      if (!toneActive) {
        noiseFloor = noiseFloor * 0.99 + magnitude * 0.01;
      }

      const snrDb =
        20 * Math.log10((magnitude + 1e-10) / (noiseFloor + 1e-10));

      return {
        toneActive,
        durationMs: timestampMs - stateStartMs,
        snrDb,
      };
    },
  };
}
