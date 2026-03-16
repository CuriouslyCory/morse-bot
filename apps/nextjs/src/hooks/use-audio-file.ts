"use client";

import { useCallback, useRef, useState } from "react";

interface UseAudioFileOptions {
  onSamples: (samples: Float32Array, timestampMs: number) => void;
  sampleRate?: number;
  chunkSize?: number;
}

interface UseAudioFileResult {
  isProcessing: boolean;
  progress: number; // 0-1
  error: string | null;
  processFile: (file: File) => Promise<void>;
  stopProcessing: () => void;
}

export function useAudioFile({
  onSamples,
  sampleRate = 8000,
  chunkSize = 4096,
}: UseAudioFileOptions): UseAudioFileResult {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const cancelledRef = useRef<boolean>(false);
  const onSamplesRef = useRef(onSamples);
  onSamplesRef.current = onSamples;

  const processFile = useCallback(
    async (file: File) => {
      setError(null);
      setProgress(0);
      setIsProcessing(true);
      cancelledRef.current = false;

      let arrayBuffer: ArrayBuffer;
      try {
        arrayBuffer = await file.arrayBuffer();
      } catch {
        setError("Failed to read file.");
        return;
      }

      // cancelledRef.current may be mutated by stopProcessing() across awaits
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (cancelledRef.current) return;

      let audioContext: AudioContext | null = null;
      try {
        audioContext = new AudioContext({ sampleRate });
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (cancelledRef.current) return;

        // Use the first channel (mono)
        const channelData = audioBuffer.getChannelData(0);
        const totalSamples = channelData.length;

        for (let offset = 0; offset < totalSamples; offset += chunkSize) {
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          if (cancelledRef.current) break;

          const end = Math.min(offset + chunkSize, totalSamples);
          const chunk = channelData.slice(offset, end);

          // Derive timestamp from sample position in the audio file
          const timestampMs = (offset / audioBuffer.sampleRate) * 1000;
          onSamplesRef.current(chunk, timestampMs);

          setProgress(end / totalSamples);

          // Yield to keep the UI responsive between chunks
          await new Promise<void>((resolve) => setTimeout(resolve, 0));
        }
      } catch (err) {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (!cancelledRef.current) {
          setError(
            err instanceof Error ? err.message : "Failed to decode audio file.",
          );
        }
      } finally {
        await audioContext?.close();
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (!cancelledRef.current) {
          setProgress(1);
        }
        setIsProcessing(false);
      }
    },
    [sampleRate, chunkSize],
  );

  const stopProcessing = useCallback(() => {
    cancelledRef.current = true;
    setIsProcessing(false);
    setProgress(0);
  }, []);

  return { isProcessing, progress, error, processFile, stopProcessing };
}
