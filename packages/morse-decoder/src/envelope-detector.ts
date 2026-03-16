import type { EnvelopeConfig, EnvelopeState } from "./types";

/**
 * Creates an envelope detector with dual-threshold hysteresis and
 * optional adaptive thresholding.
 *
 * Features:
 * - Dual thresholds (on/off) for hysteresis to prevent jitter
 * - Adaptive mode scales thresholds with observed peak signal level
 *   but never lowers them below the initial fixed values
 * - Tracks a slow-moving noise floor estimate
 */
export function createEnvelopeDetector(config: EnvelopeConfig): {
  process(magnitude: number, timestampMs: number): EnvelopeState;
} {
  const initialOnThreshold = config.onThreshold;
  const initialOffThreshold = config.offThreshold;
  let onThreshold = initialOnThreshold;
  let offThreshold = initialOffThreshold;
  const useAdaptive = config.adaptive ?? false;

  let toneActive = false;
  let stateStartMs: number | null = null;
  let noiseFloor = 1e-4;

  // Adaptive threshold tracking
  let peakMagnitude = 0;

  return {
    process(magnitude: number, timestampMs: number): EnvelopeState {
      // Initialize state start on first call
      if (stateStartMs === null) {
        stateStartMs = timestampMs;
      }

      // Track peak of raw magnitude with slow decay
      if (magnitude > peakMagnitude) {
        peakMagnitude = magnitude;
      } else {
        peakMagnitude = peakMagnitude * 0.9995 + magnitude * 0.0005;
      }

      // Adaptive thresholds: scale with peak, never go below initial
      if (useAdaptive) {
        onThreshold = Math.max(initialOnThreshold, peakMagnitude * 0.25);
        offThreshold = Math.max(initialOffThreshold, peakMagnitude * 0.15);
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

      const snrDb = 20 * Math.log10((magnitude + 1e-10) / (noiseFloor + 1e-10));

      return {
        toneActive,
        durationMs: timestampMs - stateStartMs,
        snrDb,
      };
    },
  };
}
