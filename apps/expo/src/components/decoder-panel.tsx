import { useCallback, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { authClient } from "~/utils/auth";
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

  const { data: session } = authClient.useSession();
  const isAuthenticated = !!session;

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

  const error = micError ?? fileError;
  const isActive = isRecording || isProcessing;

  // Suppress unused variable warning for lastSource
  void lastSource;

  return (
    <ScrollView className="flex-1" contentContainerClassName="gap-4 p-4">
      {/* Controls */}
      <View className="rounded-lg border border-border bg-card p-4">
        <DecoderControls
          onUpdateConfig={updateConfig}
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
          <Text className={isRecording ? "text-destructive-foreground" : "text-primary-foreground"}>
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
      <View className="rounded-lg border border-border bg-card p-4 gap-4">
        <Spectrogram stats={stats} />
        <SignalStats stats={stats} />
      </View>

      {/* Decoded output */}
      <DecodedText
        decodedText={decodedText}
        currentElements={currentElements}
        isRecording={isActive}
      />

      {/* Auth status (save session added in US-017) */}
      {!isAuthenticated ? (
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
      ) : null}
    </ScrollView>
  );
}
