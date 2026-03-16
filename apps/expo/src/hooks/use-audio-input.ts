import { useCallback, useEffect, useRef, useState } from "react";
import { Platform, PermissionsAndroid } from "react-native";
import AudioRecord from "react-native-live-audio-stream";

interface UseAudioInputOptions {
  onSamples: (samples: Float32Array) => void;
}

interface UseAudioInputResult {
  isRecording: boolean;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
}

const SAMPLE_RATE = 8000;
const CHANNELS = 1;
const BITS_PER_SAMPLE = 16;

async function requestMicrophonePermission(): Promise<boolean> {
  if (Platform.OS === "android") {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }
  // iOS permission is handled natively via NSMicrophoneUsageDescription
  return true;
}

export function useAudioInput({
  onSamples,
}: UseAudioInputOptions): UseAudioInputResult {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onSamplesRef = useRef(onSamples);
  const isRecordingRef = useRef(false);

  // Keep onSamples callback up to date without recreating the hook
  useEffect(() => {
    onSamplesRef.current = onSamples;
  }, [onSamples]);

  const startRecording = useCallback(async () => {
    setError(null);

    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) {
      setError("Microphone permission denied");
      return;
    }

    AudioRecord.init({
      sampleRate: SAMPLE_RATE,
      channels: CHANNELS,
      bitsPerSample: BITS_PER_SAMPLE,
      wavFile: "recording.wav",
    });

    AudioRecord.on("data", (base64Data: string) => {
      if (!isRecordingRef.current) return;

      // Decode base64 -> Uint8Array -> Int16 pairs -> Float32Array
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const dataView = new DataView(bytes.buffer);
      const sampleCount = Math.floor(bytes.length / 2);
      const samples = new Float32Array(sampleCount);
      for (let i = 0; i < sampleCount; i++) {
        samples[i] = dataView.getInt16(i * 2, true) / 32768;
      }
      onSamplesRef.current(samples);
    });

    AudioRecord.start();
    isRecordingRef.current = true;
    setIsRecording(true);
  }, []);

  const stopRecording = useCallback(() => {
    isRecordingRef.current = false;
    void AudioRecord.stop();
    setIsRecording(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isRecordingRef.current) {
        isRecordingRef.current = false;
        void AudioRecord.stop();
      }
    };
  }, []);

  return { isRecording, error, startRecording, stopRecording };
}
