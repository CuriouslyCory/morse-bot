"use client";

import { useCallback, useRef, useState } from "react";

interface UseAudioInputOptions {
  onSamples: (samples: Float32Array) => void;
  sampleRate?: number;
}

interface UseAudioInputResult {
  isRecording: boolean;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
}

export function useAudioInput({
  onSamples,
  sampleRate = 8000,
}: UseAudioInputOptions): UseAudioInputResult {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const onSamplesRef = useRef(onSamples);
  onSamplesRef.current = onSamples;

  const startRecording = useCallback(async () => {
    setError(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Microphone access is not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new AudioContext({ sampleRate });
      audioContextRef.current = audioContext;

      await audioContext.audioWorklet.addModule(
        "/audio-worklet/sample-forwarder.js",
      );

      const source = audioContext.createMediaStreamSource(stream);
      sourceNodeRef.current = source;

      const workletNode = new AudioWorkletNode(
        audioContext,
        "sample-forwarder",
      );
      workletNodeRef.current = workletNode;

      workletNode.port.onmessage = (event: MessageEvent<Float32Array>) => {
        onSamplesRef.current(event.data);
      };

      source.connect(workletNode);
      workletNode.connect(audioContext.destination);

      setIsRecording(true);
    } catch (err) {
      // Clean up any partially-initialized resources to prevent leaks
      void audioContextRef.current?.close();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      audioContextRef.current = null;
      streamRef.current = null;
      sourceNodeRef.current = null;
      workletNodeRef.current = null;

      const message =
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "Microphone permission denied."
          : err instanceof Error
            ? err.message
            : "Failed to start recording.";
      setError(message);
    }
  }, [sampleRate]);

  const stopRecording = useCallback(() => {
    workletNodeRef.current?.disconnect();
    sourceNodeRef.current?.disconnect();
    void audioContextRef.current?.close();
    streamRef.current?.getTracks().forEach((track) => track.stop());

    workletNodeRef.current = null;
    sourceNodeRef.current = null;
    audioContextRef.current = null;
    streamRef.current = null;

    setIsRecording(false);
  }, []);

  return { isRecording, error, startRecording, stopRecording };
}
