import { useCallback, useEffect, useRef, useState } from "react";
import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";

import { parseWav } from "~/utils/wav-parser";

interface UseAudioFileOptions {
  onSamples: (samples: Float32Array, timestampMs: number) => void;
  chunkSize?: number;
}

interface UseAudioFileResult {
  isProcessing: boolean;
  progress: number;
  error: string | null;
  processFile: () => Promise<void>;
  stopProcessing: () => void;
}

export function useAudioFile({
  onSamples,
  chunkSize = 4096,
}: UseAudioFileOptions): UseAudioFileResult {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const cancelledRef = useRef(false);
  const onSamplesRef = useRef(onSamples);

  useEffect(() => {
    onSamplesRef.current = onSamples;
  }, [onSamples]);

  const processFile = useCallback(async () => {
    setError(null);
    setProgress(0);
    cancelledRef.current = false;

    const result = await DocumentPicker.getDocumentAsync({
      type: ["audio/wav", "audio/x-wav"],
    });

    if (result.canceled) return;

    const uri = result.assets[0]?.uri;
    if (!uri) return;

    setIsProcessing(true);

    let bytes: Uint8Array;
    try {
      const file = new File(uri);
      bytes = await file.bytes();
    } catch {
      setError("Failed to read file.");
      setIsProcessing(false);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (cancelledRef.current) {
      setIsProcessing(false);
      return;
    }

    let wavData: ReturnType<typeof parseWav>;
    try {
      wavData = parseWav(bytes.buffer as ArrayBuffer);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to parse WAV file.",
      );
      setIsProcessing(false);
      return;
    }

    const { samples, sampleRate } = wavData;
    const totalSamples = samples.length;

    for (let offset = 0; offset < totalSamples; offset += chunkSize) {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (cancelledRef.current) break;

      const end = Math.min(offset + chunkSize, totalSamples);
      const chunk = samples.slice(offset, end);
      const timestampMs = (offset / sampleRate) * 1000;

      onSamplesRef.current(chunk, timestampMs);
      setProgress(end / totalSamples);

      // Yield to UI thread between chunks
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
    }

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!cancelledRef.current) {
      setProgress(1);
    }
    setIsProcessing(false);
  }, [chunkSize]);

  const stopProcessing = useCallback(() => {
    cancelledRef.current = true;
    setIsProcessing(false);
    setProgress(0);
  }, []);

  return { isProcessing, progress, error, processFile, stopProcessing };
}
