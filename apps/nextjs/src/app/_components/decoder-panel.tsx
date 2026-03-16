"use client";

import type { DecoderConfig } from "@morse-bot/morse-decoder";
import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";

import { DEFAULT_CONFIG } from "@morse-bot/morse-decoder";
import { Button } from "@morse-bot/ui/button";
import { Card, CardContent } from "@morse-bot/ui/card";
import { toast } from "@morse-bot/ui/toast";

import { authClient } from "~/auth/client";
import { useAudioFile } from "~/hooks/use-audio-file";
import { useAudioInput } from "~/hooks/use-audio-input";
import { useMorseDecoder } from "~/hooks/use-morse-decoder";
import { useTRPC } from "~/trpc/react";
import { DecodedText } from "./decoded-text";
import { DecoderControls } from "./decoder-controls";
import { SignalStats } from "./signal-stats";
import { Spectrogram } from "./spectrogram";

interface DecoderPanelProps {
  onFrequencyChange?: (freq: number) => void;
  onWpmChange?: (wpm: number) => void;
}

export function DecoderPanel({
  onFrequencyChange,
  onWpmChange,
}: DecoderPanelProps) {
  const {
    decodedText,
    currentElements,
    stats,
    processSamples,
    reset,
    updateConfig,
  } = useMorseDecoder();

  const [encoderFrequency, setEncoderFrequency] = useState(
    DEFAULT_CONFIG.targetFrequency,
  );
  const [encoderWpm, setEncoderWpm] = useState(DEFAULT_CONFIG.wpm);

  const sessionStartRef = useRef<number | null>(null);
  const [lastSource, setLastSource] = useState<"mic" | "file">("mic");

  const { data: sessionData } = authClient.useSession();
  const isAuthenticated = !!sessionData;

  const trpc = useTRPC();
  const saveSession = useMutation(
    trpc.session.save.mutationOptions({
      onSuccess: () => {
        toast.success("Session saved!");
      },
      onError: () => {
        toast.error("Failed to save session.");
      },
    }),
  );

  const handleUpdateConfig = useCallback(
    (partial: Partial<DecoderConfig>) => {
      updateConfig(partial);
      if (partial.targetFrequency !== undefined) {
        setEncoderFrequency(partial.targetFrequency);
        onFrequencyChange?.(partial.targetFrequency);
      }
      if (partial.wpm !== undefined) {
        setEncoderWpm(partial.wpm);
        onWpmChange?.(partial.wpm);
      }
    },
    [updateConfig, onFrequencyChange, onWpmChange],
  );

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

  const {
    isRecording,
    actualSampleRate,
    error: micError,
    startRecording,
    stopRecording,
  } = useAudioInput({ onSamples: onSamplesFromMic });

  useEffect(() => {
    if (actualSampleRate !== null) {
      updateConfig({ sampleRate: actualSampleRate });
    }
  }, [actualSampleRate, updateConfig]);

  const {
    isProcessing,
    progress,
    error: fileError,
    processFile,
    stopProcessing,
  } = useAudioFile({ onSamples: onSamplesFromFile });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleStartMic = useCallback(async () => {
    sessionStartRef.current = Date.now();
    setLastSource("mic");
    await startRecording();
  }, [startRecording]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        sessionStartRef.current = Date.now();
        setLastSource("file");
        reset();
        void processFile(file);
      }
      e.target.value = "";
    },
    [processFile, reset],
  );

  const handleSave = useCallback(() => {
    const durationMs = sessionStartRef.current
      ? Date.now() - sessionStartRef.current
      : 0;
    saveSession.mutate({
      decodedText,
      durationMs,
      source: lastSource,
      settings: {
        targetFrequency: encoderFrequency,
        wpm: encoderWpm,
      },
    });
  }, [decodedText, encoderFrequency, encoderWpm, lastSource, saveSession]);

  const error = micError ?? fileError;
  const isActive = isRecording || isProcessing;

  return (
    <div className="flex flex-col gap-6 pt-4">
      {/* Controls */}
      <Card>
        <CardContent className="pt-6">
          <DecoderControls
            onUpdateConfig={handleUpdateConfig}
            onReset={reset}
            isDisabled={isActive}
          />
        </CardContent>
      </Card>

      {/* Action Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={isRecording ? stopRecording : () => void handleStartMic()}
          disabled={isProcessing}
          variant={isRecording ? "destructive" : "default"}
          size="lg"
          className="rounded-full px-6"
        >
          {isRecording ? "Stop Mic" : "Start Mic"}
        </Button>

        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={isActive}
          variant="outline"
          size="lg"
          className="rounded-full px-6"
        >
          Open File...
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".wav,.mp3,.ogg,.m4a,audio/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {isProcessing && (
          <Button
            onClick={stopProcessing}
            variant="destructive"
            size="lg"
            className="rounded-full px-6"
          >
            Stop
          </Button>
        )}

        {error && <span className="text-destructive text-sm">{error}</span>}
      </div>

      {/* Progress bar */}
      {isProcessing && (
        <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
          <div
            className="bg-primary h-full rounded-full transition-all"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
      )}

      {/* Visualization */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
            <div className="min-w-0 flex-1">
              <Spectrogram stats={stats} />
            </div>
            <div className="lg:w-60 lg:shrink-0">
              <SignalStats stats={stats} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Decoded output */}
      <DecodedText
        decodedText={decodedText}
        currentElements={currentElements}
        isRecording={isActive}
      />

      {/* Save session */}
      <div className="flex items-center gap-3">
        {isAuthenticated ? (
          <Button
            variant="secondary"
            disabled={!decodedText.trim() || saveSession.isPending}
            onClick={handleSave}
            className="rounded-full"
          >
            {saveSession.isPending ? "Saving..." : "Save Session"}
          </Button>
        ) : (
          <button
            onClick={() =>
              void authClient.signIn.social({
                provider: "discord",
                callbackURL: "/",
              })
            }
            className="text-muted-foreground text-sm underline-offset-4 hover:underline"
          >
            Sign in to save sessions
          </button>
        )}
      </div>
    </div>
  );
}
