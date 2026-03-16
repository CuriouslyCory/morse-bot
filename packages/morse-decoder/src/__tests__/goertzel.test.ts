import { describe, expect, it } from "vitest";
import { createGoertzelFilter } from "../goertzel";

/** Generate a sine wave at the given frequency */
function generateSineWave(
  frequency: number,
  sampleRate: number,
  durationSamples: number,
  amplitude = 1.0,
): Float32Array {
  const samples = new Float32Array(durationSamples);
  for (let i = 0; i < durationSamples; i++) {
    samples[i] = amplitude * Math.sin((2 * Math.PI * frequency * i) / sampleRate);
  }
  return samples;
}

describe("createGoertzelFilter", () => {
  const sampleRate = 8000;
  const targetFrequency = 600;
  const blockSize = 256;

  it("detects high magnitude for on-frequency signal", () => {
    const filter = createGoertzelFilter({ targetFrequency, sampleRate });
    const samples = generateSineWave(targetFrequency, sampleRate, blockSize);

    const result = filter.process(samples);
    expect(result.magnitude).toBeGreaterThan(0.5);
    expect(result.magnitudeDb).toBeGreaterThan(-10);
  });

  it("detects low magnitude for off-frequency signal", () => {
    const filter = createGoertzelFilter({ targetFrequency, sampleRate });
    // Use a frequency far from target
    const samples = generateSineWave(1500, sampleRate, blockSize);

    const result = filter.process(samples);
    expect(result.magnitude).toBeLessThan(0.1);
  });

  it("detects low magnitude for silence", () => {
    const filter = createGoertzelFilter({ targetFrequency, sampleRate });
    const samples = new Float32Array(blockSize); // all zeros

    const result = filter.process(samples);
    expect(result.magnitude).toBeLessThan(0.001);
    expect(result.magnitudeDb).toBeLessThan(-60);
  });

  it("magnitude scales with amplitude", () => {
    const filter = createGoertzelFilter({ targetFrequency, sampleRate });

    const loud = filter.process(generateSineWave(targetFrequency, sampleRate, blockSize, 1.0));
    const quiet = filter.process(generateSineWave(targetFrequency, sampleRate, blockSize, 0.1));

    expect(loud.magnitude).toBeGreaterThan(quiet.magnitude * 5);
  });

  it("works at different target frequencies", () => {
    for (const freq of [550, 600, 800]) {
      const filter = createGoertzelFilter({ targetFrequency: freq, sampleRate });
      const onTarget = filter.process(generateSineWave(freq, sampleRate, blockSize));
      const offTarget = filter.process(generateSineWave(freq + 500, sampleRate, blockSize));

      expect(onTarget.magnitude, `On-target at ${freq}Hz`).toBeGreaterThan(offTarget.magnitude * 3);
    }
  });
});
