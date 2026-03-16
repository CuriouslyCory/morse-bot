import { useCallback, useRef, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useMutation } from "@tanstack/react-query";

import { DEFAULT_CONFIG } from "@morse-bot/morse-decoder";
import { authClient } from "~/utils/auth";
import { trpc, queryClient } from "~/utils/api";
import { useAudioFile } from "~/hooks/use-audio-file";
import { useAudioInput } from "~/hooks/use-audio-input";
import { useMorseDecoder } from "~/hooks/use-morse-decoder";
import { DecodedText } from "./decoded-text";
import { DecoderControls } from "./decoder-controls";
import { SignalStats } from "./signal-stats";
import { Spectrogram } from "./spectrogram";

export function DecoderPanel() {
  const {
    decodedText,
    currentElements,
    stats,
    processSamples,
    reset,
    updateConfig,
  } = useMorseDecoder();

  const sessionStartRef = useRef<number | null>(null);
  const [lastSource, setLastSource] = useState<"mic" | "file">("mic");
  const [decoderFrequency, setDecoderFrequency] = useState(
    DEFAULT_CONFIG.targetFrequency,
  );
  const [decoderWpm, setDecoderWpm] = useState(DEFAULT_CONFIG.wpm);

  const { data: session } = authClient.useSession();
  const isAuthenticated = !!session;

  const saveSession = useMutation(
    trpc.session.save.mutationOptions({
      onSuccess: () => {
        Alert.alert("Success", "Session saved!");
      },
      onError: () => {
        Alert.alert("Error", "Failed to save session.");
      },
    }),
  );

  const handleUpdateConfig = useCallback(
    (partial: Parameters<typeof updateConfig>[0]) => {
      updateConfig(partial);
      if (partial.targetFrequency !== undefined) {
        setDecoderFrequency(partial.targetFrequency);
      }
      if (partial.wpm !== undefined) {
        setDecoderWpm(partial.wpm);
      }
    },
    [updateConfig],
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
    error: micError,
    startRecording,
    stopRecording,
  } = useAudioInput({ onSamples: onSamplesFromMic });

  const {
    isProcessing,
    progress,
    error: fileError,
    processFile,
    stopProcessing,
  } = useAudioFile({ onSamples: onSamplesFromFile });

  const handleStartMic = useCallback(async () => {
    sessionStartRef.current = Date.now();
    setLastSource("mic");
    await startRecording();
  }, [startRecording]);

  const handleOpenFile = useCallback(async () => {
    sessionStartRef.current = Date.now();
    setLastSource("file");
    reset();
    await processFile();
  }, [processFile, reset]);

  const handleSave = useCallback(() => {
    const durationMs = sessionStartRef.current
      ? Date.now() - sessionStartRef.current
      : 0;
    saveSession.mutate({
      decodedText,
      durationMs,
      source: lastSource,
      settings: {
        targetFrequency: decoderFrequency,
        wpm: decoderWpm,
      },
    });
  }, [
    decodedText,
    decoderFrequency,
    decoderWpm,
    lastSource,
    saveSession,
  ]);

  const error = micError ?? fileError;
  const isActive = isRecording || isProcessing;

  // Suppress unused variable (queryClient used for future invalidation)
  void queryClient;

  return (
    <ScrollView className="flex-1" contentContainerClassName="gap-4 p-4">
      {/* Controls */}
      <View className="rounded-lg border border-border bg-card p-4">
        <DecoderControls
          onUpdateConfig={handleUpdateConfig}
          onReset={reset}
          isDisabled={isActive}
        />
      </View>

      {/* Action Bar */}
      <View className="flex-row flex-wrap items-center gap-3">
        <Pressable
          onPress={isRecording ? stopRecording : () => void handleStartMic()}
          disabled={isProcessing}
          className={`rounded-full px-6 py-3 ${isRecording ? "bg-destructive" : "bg-primary"} ${isProcessing ? "opacity-50" : ""}`}
        >
          <Text
            className={
              isRecording
                ? "text-destructive-foreground"
                : "text-primary-foreground"
            }
          >
            {isRecording ? "Stop Mic" : "Start Mic"}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => void handleOpenFile()}
          disabled={isActive}
          className={`rounded-full border border-border px-6 py-3 ${isActive ? "opacity-50" : ""}`}
        >
          <Text className="text-foreground">Open File</Text>
        </Pressable>

        {isProcessing ? (
          <Pressable
            onPress={stopProcessing}
            className="rounded-full bg-destructive px-6 py-3"
          >
            <Text className="text-destructive-foreground">Stop</Text>
          </Pressable>
        ) : null}

        {error ? (
          <Text className="text-sm text-destructive">{error}</Text>
        ) : null}
      </View>

      {/* Progress bar */}
      {isProcessing ? (
        <View className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <View
            className="h-full rounded-full bg-primary"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </View>
      ) : null}

      {/* Visualization */}
      <View className="gap-4 rounded-lg border border-border bg-card p-4">
        <Spectrogram stats={stats} />
        <SignalStats stats={stats} />
      </View>

      {/* Decoded output */}
      <DecodedText
        decodedText={decodedText}
        currentElements={currentElements}
        isRecording={isActive}
      />

      {/* Save session / auth */}
      <View className="flex-row items-center gap-3">
        {isAuthenticated ? (
          <Pressable
            onPress={handleSave}
            disabled={!decodedText.trim() || saveSession.isPending}
            className={`rounded-full bg-secondary px-6 py-3 ${!decodedText.trim() || saveSession.isPending ? "opacity-50" : ""}`}
          >
            <Text className="text-secondary-foreground">
              {saveSession.isPending ? "Saving..." : "Save Session"}
            </Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={() =>
              void authClient.signIn.social({
                provider: "discord",
                callbackURL: "/",
              })
            }
          >
            <Text className="text-sm text-muted-foreground underline">
              Sign in to save sessions
            </Text>
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
}
