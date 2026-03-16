import { readFileSync } from "node:fs";

export interface WavData {
  samples: Float32Array;
  sampleRate: number;
  channels: number;
  bitsPerSample: number;
}

/**
 * Reads a WAV file and returns raw PCM samples as Float32Array.
 * Supports 16-bit and 32-bit PCM WAV files.
 */
export function readWav(filePath: string): WavData {
  const buffer = readFileSync(filePath);
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);

  // Verify RIFF header
  const riff = String.fromCharCode(
    view.getUint8(0),
    view.getUint8(1),
    view.getUint8(2),
    view.getUint8(3),
  );
  if (riff !== "RIFF") throw new Error("Not a valid WAV file: missing RIFF header");

  const wave = String.fromCharCode(
    view.getUint8(8),
    view.getUint8(9),
    view.getUint8(10),
    view.getUint8(11),
  );
  if (wave !== "WAVE") throw new Error("Not a valid WAV file: missing WAVE format");

  // Find fmt and data chunks
  let offset = 12;
  let sampleRate = 0;
  let channels = 0;
  let bitsPerSample = 0;
  let dataOffset = 0;
  let dataSize = 0;

  while (offset < buffer.length - 8) {
    const chunkId = String.fromCharCode(
      view.getUint8(offset),
      view.getUint8(offset + 1),
      view.getUint8(offset + 2),
      view.getUint8(offset + 3),
    );
    const chunkSize = view.getUint32(offset + 4, true);

    if (chunkId === "fmt ") {
      const audioFormat = view.getUint16(offset + 8, true);
      if (audioFormat !== 1) throw new Error(`Unsupported audio format: ${audioFormat} (only PCM supported)`);
      channels = view.getUint16(offset + 10, true);
      sampleRate = view.getUint32(offset + 12, true);
      bitsPerSample = view.getUint16(offset + 22, true);
    } else if (chunkId === "data") {
      dataOffset = offset + 8;
      dataSize = chunkSize;
    }

    offset += 8 + chunkSize;
    // Chunks are word-aligned
    if (chunkSize % 2 !== 0) offset++;
  }

  if (sampleRate === 0) throw new Error("No fmt chunk found in WAV file");
  if (dataOffset === 0) throw new Error("No data chunk found in WAV file");

  const bytesPerSample = bitsPerSample / 8;
  const totalSamples = dataSize / bytesPerSample / channels;
  const samples = new Float32Array(totalSamples);

  // Extract first channel, normalize to [-1, 1]
  for (let i = 0; i < totalSamples; i++) {
    const sampleOffset = dataOffset + i * channels * bytesPerSample;
    if (bitsPerSample === 16) {
      samples[i] = view.getInt16(sampleOffset, true) / 32768;
    } else if (bitsPerSample === 32) {
      samples[i] = view.getInt32(sampleOffset, true) / 2147483648;
    } else {
      throw new Error(`Unsupported bit depth: ${bitsPerSample}`);
    }
  }

  return { samples, sampleRate, channels, bitsPerSample };
}
