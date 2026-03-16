import type {
  DecoderConfig,
  DecoderEvents,
  MorseDecoder,
  MorseElement,
} from "./types";
import { DEFAULT_CONFIG } from "./constants";
import { createEnvelopeDetector } from "./envelope-detector";
import { createGoertzelFilter } from "./goertzel";
import { lookupMorse } from "./morse-tree";
import { createTimingAnalyzer } from "./timing-analyzer";

/**
 * Compute the minimum Goertzel window size that captures at least
 * `minCycles` full cycles of the target frequency.
 */
function computeGoertzelWindowSize(
  sampleRate: number,
  targetFrequency: number,
  minCycles = 8,
): number {
  const samplesPerCycle = sampleRate / targetFrequency;
  const minSamples = Math.ceil(minCycles * samplesPerCycle);
  // Round up to nearest power of 2 for efficiency (optional but nice)
  let size = 64;
  while (size < minSamples) size *= 2;
  return size;
}

function buildComponents(cfg: DecoderConfig) {
  return {
    goertzel: createGoertzelFilter({
      targetFrequency: cfg.targetFrequency,
      sampleRate: cfg.sampleRate,
    }),
    envelopeDetector: createEnvelopeDetector({
      onThreshold: cfg.threshold * 1.2,
      offThreshold: cfg.threshold * 0.8,
      adaptive: true,
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
 *
 * Internally buffers samples to ensure the Goertzel filter always processes
 * a window large enough for reliable frequency detection, regardless of input
 * chunk size.
 */
export function createDecoder(
  config: DecoderConfig,
  events: DecoderEvents,
): MorseDecoder {
  let cfg: DecoderConfig = { ...DEFAULT_CONFIG, ...config };
  let { goertzel, envelopeDetector, timingAnalyzer } = buildComponents(cfg);

  // Compute optimal Goertzel window size
  let goertzelWindowSize = computeGoertzelWindowSize(
    cfg.sampleRate,
    cfg.targetFrequency,
  );
  // Hop size: advance by this many samples per Goertzel evaluation
  // Use the configured blockSize as hop for temporal resolution
  let hopSize = Math.min(cfg.blockSize, goertzelWindowSize);

  // Internal sample buffer for overlapping Goertzel windows
  let sampleBuffer = new Float32Array(0);
  let bufferStartSample = 0; // sample index of the start of the buffer

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

  function processGoertzelWindow(
    window: Float32Array,
    timestampMs: number,
  ): void {
    const goertzelResult = goertzel.process(window);
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
          if (element !== null) {
            currentElements.push(element);
            events.onElement?.(element);
          }
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
  }

  function resetState() {
    decodedText = "";
    currentElements = [];
    prevToneActive = false;
    lastTransitionMs = null;
    sampleBuffer = new Float32Array(0);
    bufferStartSample = 0;
    ({ goertzel, envelopeDetector, timingAnalyzer } = buildComponents(cfg));
    goertzelWindowSize = computeGoertzelWindowSize(
      cfg.sampleRate,
      cfg.targetFrequency,
    );
    hopSize = Math.min(cfg.blockSize, goertzelWindowSize);
  }

  return {
    processSamples(samples: Float32Array, _timestampMs: number): void {
      // Append incoming samples to the internal buffer
      const newBuffer = new Float32Array(sampleBuffer.length + samples.length);
      newBuffer.set(sampleBuffer);
      newBuffer.set(samples, sampleBuffer.length);
      sampleBuffer = newBuffer;

      // Process overlapping windows
      while (sampleBuffer.length >= goertzelWindowSize) {
        const window = sampleBuffer.slice(0, goertzelWindowSize);
        const windowTimestampMs = (bufferStartSample / cfg.sampleRate) * 1000;

        processGoertzelWindow(window, windowTimestampMs);

        // Advance by hopSize
        sampleBuffer = sampleBuffer.slice(hopSize);
        bufferStartSample += hopSize;
      }
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
      prevToneActive = false;
      lastTransitionMs = null;
      currentElements = [];
      sampleBuffer = new Float32Array(0);
      bufferStartSample = 0;
      goertzelWindowSize = computeGoertzelWindowSize(
        cfg.sampleRate,
        cfg.targetFrequency,
      );
      hopSize = Math.min(cfg.blockSize, goertzelWindowSize);
    },
  };
}
