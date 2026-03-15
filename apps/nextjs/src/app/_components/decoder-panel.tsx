"use client";

import { useCallback, useRef } from "react";

import { useAudioInput } from "~/hooks/use-audio-input";
import { useMorseDecoder } from "~/hooks/use-morse-decoder";

export function DecoderPanel() {
  const { decodedText, processSamples, reset } = useMorseDecoder();

  const onSamples = useCallback(
    (samples: Float32Array) => {
      processSamples(samples, performance.now());
    },
    [processSamples],
  );

  const onSamplesRef = useRef(onSamples);
  onSamplesRef.current = onSamples;

  const { isRecording, error, startRecording, stopRecording } = useAudioInput({
    onSamples: (samples) => onSamplesRef.current(samples),
  });

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <button
          onClick={isRecording ? stopRecording : () => void startRecording()}
          className="rounded bg-primary px-4 py-2 font-semibold text-primary-foreground hover:bg-primary/90"
        >
          {isRecording ? "Stop" : "Start"}
        </button>
        <button
          onClick={reset}
          className="rounded border px-4 py-2 font-semibold hover:bg-muted"
        >
          Clear
        </button>
        {error && <span className="text-sm text-destructive">{error}</span>}
      </div>

      <div className="min-h-48 w-full rounded border bg-muted p-4 font-mono text-lg">
        {decodedText || (
          <span className="text-muted-foreground">
            {isRecording
              ? "Listening for morse code..."
              : "Press Start to begin decoding"}
          </span>
        )}
      </div>
    </div>
  );
}
