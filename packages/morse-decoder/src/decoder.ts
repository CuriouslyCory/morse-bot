import type {
  DecoderConfig,
  DecoderEvents,
  MorseDecoder,
  MorseElement,
} from "./types.js";
import { DEFAULT_CONFIG } from "./constants.js";
import { createEnvelopeDetector } from "./envelope-detector.js";
import { createGoertzelFilter } from "./goertzel.js";
import { lookupMorse } from "./morse-tree.js";
import { createTimingAnalyzer } from "./timing-analyzer.js";

function buildComponents(cfg: DecoderConfig) {
  return {
    goertzel: createGoertzelFilter({
      targetFrequency: cfg.targetFrequency,
      sampleRate: cfg.sampleRate,
    }),
    envelopeDetector: createEnvelopeDetector({
      onThreshold: cfg.threshold * 1.2,
      offThreshold: cfg.threshold * 0.8,
    }),
    timingAnalyzer: createTimingAnalyzer({
      wpm: cfg.wpm,
      adaptive: cfg.adaptive,
    }),
  };
}

/**
 * Creates the main morse decoder orchestrator.
 * Orchestrates: Goertzel -> envelope detector -> timing analyzer -> morse tree lookup.
 * Fires events for decoded characters, word boundaries, elements, tone changes, and stats.
 */
export function createDecoder(
  config: DecoderConfig,
  events: DecoderEvents,
): MorseDecoder {
  let cfg: DecoderConfig = { ...DEFAULT_CONFIG, ...config };
  let { goertzel, envelopeDetector, timingAnalyzer } = buildComponents(cfg);

  let decodedText = "";
  let currentElements: MorseElement[] = [];
  let prevToneActive = false;
  let lastTransitionMs: number | null = null;

  function flushCharacter() {
    if (currentElements.length === 0) return;
    const char = lookupMorse(currentElements);
    if (char !== null) {
      decodedText += char;
      events.onCharacter?.(char);
    }
    currentElements = [];
  }

  function resetState() {
    decodedText = "";
    currentElements = [];
    prevToneActive = false;
    lastTransitionMs = null;
    ({ goertzel, envelopeDetector, timingAnalyzer } = buildComponents(cfg));
  }

  return {
    processSamples(samples: Float32Array, timestampMs: number): void {
      const goertzelResult = goertzel.process(samples);
      const envelope = envelopeDetector.process(
        goertzelResult.magnitude,
        timestampMs,
      );

      // Detect state transition
      if (envelope.toneActive !== prevToneActive) {
        if (lastTransitionMs !== null) {
          const duration = timestampMs - lastTransitionMs;

          if (!envelope.toneActive) {
            // Tone just ended: classify as dit or dah
            const element = timingAnalyzer.onToneEnd(duration);
            currentElements.push(element);
            events.onElement?.(element);
          } else {
            // Silence just ended: classify the gap type
            const gap = timingAnalyzer.onSilenceEnd(duration);
            if (gap === "character") {
              flushCharacter();
            } else if (gap === "word") {
              flushCharacter();
              decodedText += " ";
              events.onWordBoundary?.();
            }
            // "element" gap: inter-element space within a character, do nothing
          }
        }

        lastTransitionMs = timestampMs;
        prevToneActive = envelope.toneActive;
        events.onToneChange?.(envelope.toneActive);
      }

      events.onStats?.({
        signalDb: goertzelResult.magnitudeDb,
        frequency: cfg.targetFrequency,
        snrDb: envelope.snrDb,
        wpm: timingAnalyzer.getCurrentWpm(),
        toneActive: envelope.toneActive,
      });
    },

    getDecodedText(): string {
      return decodedText;
    },

    reset(): void {
      resetState();
    },

    updateConfig(partial: Partial<DecoderConfig>): void {
      cfg = { ...cfg, ...partial };
      ({ goertzel, envelopeDetector, timingAnalyzer } = buildComponents(cfg));
    },
  };
}
