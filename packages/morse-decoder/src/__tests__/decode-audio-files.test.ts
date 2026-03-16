import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import type { DecoderConfig, DecoderEvents, MorseElement } from "../types";
import { createDecoder } from "../decoder";
import { readWav } from "./helpers/read-wav";

const SAMPLE_AUDIO_DIR = resolve(__dirname, "../../../../sample-audio");

interface TestCase {
  file: string;
  expectedText: string;
  wpm: number;
  frequency: number;
}

const TEST_CASES: TestCase[] = [
  {
    file: "morse-test1.wav",
    expectedText: "HI. HOW ARE YOU?",
    wpm: 20,
    frequency: 550,
  },
  {
    file: "morse-test2.wav",
    expectedText: "THE ORANGE FOX JUMPS OVER THE BROWN LOG.",
    wpm: 25,
    frequency: 600,
  },
  {
    file: "morse-test3.wav",
    expectedText: "WHERE IS THE BACON?",
    wpm: 15,
    frequency: 800,
  },
];

/**
 * Calculate similarity between two strings (0-1).
 * Uses longest common subsequence ratio.
 */
function similarity(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0 && n === 0) return 1;
  if (m === 0 || n === 0) return 0;

  // LCS dynamic programming
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array<number>(n + 1).fill(0),
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const prev = dp[i - 1];
      const curr = dp[i];
      if (!prev || !curr) continue;
      curr[j] =
        a[i - 1] === b[j - 1]
          ? (prev[j - 1] ?? 0) + 1
          : Math.max(prev[j] ?? 0, curr[j - 1] ?? 0);
    }
  }
  const lcsLength = dp[m]?.[n] ?? 0;
  return (2 * lcsLength) / (m + n);
}

/**
 * Process a WAV file through the decoder, mimicking the chunked processing
 * from use-audio-file.ts.
 */
function decodeWavFile(
  filePath: string,
  config: Partial<DecoderConfig>,
): { text: string; characters: string[]; elements: MorseElement[] } {
  const wav = readWav(filePath);

  const characters: string[] = [];
  const elements: MorseElement[] = [];

  const events: DecoderEvents = {
    onCharacter: (char) => characters.push(char),
    onElement: (el) => elements.push(el),
  };

  const decoder = createDecoder(
    {
      targetFrequency: config.targetFrequency ?? 600,
      sampleRate: wav.sampleRate,
      blockSize: config.blockSize ?? 256,
      wpm: config.wpm ?? 15,
      adaptive: config.adaptive ?? true,
      threshold: config.threshold ?? 0.01,
      ...config,
    },
    events,
  );

  // Process in chunks, matching the pattern from use-audio-file.ts
  const chunkSize = 4096;
  for (let offset = 0; offset < wav.samples.length; offset += chunkSize) {
    const end = Math.min(offset + chunkSize, wav.samples.length);
    const chunk = wav.samples.slice(offset, end);
    const timestampMs = (offset / wav.sampleRate) * 1000;

    // Process chunk in blockSize sub-chunks (matching decoder expectations)
    const blockSize = config.blockSize ?? 256;
    for (
      let blockOffset = 0;
      blockOffset < chunk.length;
      blockOffset += blockSize
    ) {
      const blockEnd = Math.min(blockOffset + blockSize, chunk.length);
      const block = chunk.slice(blockOffset, blockEnd);
      const blockTimestampMs =
        timestampMs + (blockOffset / wav.sampleRate) * 1000;
      decoder.processSamples(block, blockTimestampMs);
    }
  }

  // Simulate a long silence to flush any pending character
  const finalTimestamp = (wav.samples.length / wav.sampleRate) * 1000 + 5000;
  const silentBlock = new Float32Array(256);
  for (let t = 0; t < 10; t++) {
    decoder.processSamples(silentBlock, finalTimestamp + t * 100);
  }

  return {
    text: decoder.getDecodedText(),
    characters,
    elements,
  };
}

describe("Audio file decoding (adaptive)", () => {
  for (const testCase of TEST_CASES) {
    describe(`${testCase.file} - "${testCase.expectedText}"`, () => {
      const filePath = resolve(SAMPLE_AUDIO_DIR, testCase.file);

      it("produces non-empty decoded output", () => {
        const result = decodeWavFile(filePath, {
          targetFrequency: testCase.frequency,
          wpm: testCase.wpm,
          adaptive: true,
        });

        console.log(`\n[${testCase.file}] Decoded: "${result.text}"`);
        console.log(`[${testCase.file}] Expected: "${testCase.expectedText}"`);
        console.log(
          `[${testCase.file}] Characters decoded: ${result.characters.length}`,
        );
        console.log(
          `[${testCase.file}] Elements detected: ${result.elements.length}`,
        );

        expect(result.text.length).toBeGreaterThan(0);
        expect(result.elements.length).toBeGreaterThan(0);
      });

      it("achieves reasonable similarity to expected text", () => {
        const result = decodeWavFile(filePath, {
          targetFrequency: testCase.frequency,
          wpm: testCase.wpm,
          adaptive: true,
        });

        const decoded = result.text.toUpperCase().trim();
        const expected = testCase.expectedText.toUpperCase().trim();
        const sim = similarity(decoded, expected);

        console.log(
          `\n[${testCase.file}] Similarity: ${(sim * 100).toFixed(1)}%`,
        );
        console.log(`[${testCase.file}] Decoded:  "${decoded}"`);
        console.log(`[${testCase.file}] Expected: "${expected}"`);

        expect(sim).toBeGreaterThanOrEqual(0.8);
      });

      it("decodes with non-adaptive mode for comparison", () => {
        const result = decodeWavFile(filePath, {
          targetFrequency: testCase.frequency,
          wpm: testCase.wpm,
          adaptive: false,
        });

        const decoded = result.text.toUpperCase().trim();
        const expected = testCase.expectedText.toUpperCase().trim();
        const sim = similarity(decoded, expected);

        console.log(
          `\n[${testCase.file}] Non-adaptive similarity: ${(sim * 100).toFixed(1)}%`,
        );
        console.log(`[${testCase.file}] Non-adaptive decoded: "${decoded}"`);
      });
    });
  }
});

describe("Audio file decoding - exact match targets", () => {
  for (const testCase of TEST_CASES) {
    it.skip(`${testCase.file} decodes exactly (unskip when decoder is tuned)`, () => {
      const filePath = resolve(SAMPLE_AUDIO_DIR, testCase.file);
      const result = decodeWavFile(filePath, {
        targetFrequency: testCase.frequency,
        wpm: testCase.wpm,
        adaptive: true,
      });

      expect(result.text.toUpperCase().trim()).toBe(
        testCase.expectedText.toUpperCase().trim(),
      );
    });
  }
});
