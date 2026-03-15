"use client";

import { useCallback, useRef } from "react";

import { useAudioFile } from "~/hooks/use-audio-file";
import { useAudioInput } from "~/hooks/use-audio-input";
import { useMorseDecoder } from "~/hooks/use-morse-decoder";
import { DecoderControls } from "./decoder-controls";
import { DecodedText } from "./decoded-text";
import { SignalStats } from "./signal-stats";
import { Waterfall } from "./waterfall";

export function DecoderPanel() {
  const { decodedText, currentElements, stats, processSamples, reset, updateConfig } =
    useMorseDecoder();

  const onSamplesFromMic = useCallback(
    (samples: Float32Array) => {
      processSamples(samples, performance.now());
    },
    [processSamples],
  );

  const onSamplesFromFile = useCallback(
    (samples: Float32Array, timestampMs: number) => {
      processSamples(samples, timestampMs);
    },
    [processSamples],
  );

  const { isRecording, error: micError, startRecording, stopRecording } =
    useAudioInput({ onSamples: onSamplesFromMic });

  const {
    isProcessing,
    progress,
    error: fileError,
    processFile,
    stopProcessing,
  } = useAudioFile({ onSamples: onSamplesFromFile });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        reset();
        void processFile(file);
      }
      // Reset input so the same file can be re-selected
      e.target.value = "";
    },
    [processFile, reset],
  );

  const error = micError ?? fileError;
  const isActive = isRecording || isProcessing;

  return (
    <div className="flex flex-col gap-4 p-4">
      <DecoderControls
        onUpdateConfig={updateConfig}
        onReset={reset}
        isDisabled={isActive}
      />

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={isRecording ? stopRecording : () => void startRecording()}
          disabled={isProcessing}
          className="rounded bg-primary px-4 py-2 font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isRecording ? "Stop Mic" : "Start Mic"}
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isActive}
          className="rounded border px-4 py-2 font-semibold hover:bg-muted disabled:opacity-50"
        >
          Open File…
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".wav,.mp3,.ogg,.m4a,audio/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {isProcessing && (
          <button
            onClick={stopProcessing}
            className="rounded border border-destructive px-4 py-2 font-semibold text-destructive hover:bg-destructive/10"
          >
            Stop
          </button>
        )}

        {error && <span className="text-sm text-destructive">{error}</span>}
      </div>

      {isProcessing && (
        <div className="h-2 w-full overflow-hidden rounded bg-muted">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
      )}

      <Waterfall stats={stats} />

      <SignalStats stats={stats} />

      <DecodedText
        decodedText={decodedText}
        currentElements={currentElements}
        isRecording={isActive}
      />
    </div>
  );
}
