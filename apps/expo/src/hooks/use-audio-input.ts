import { useCallback, useEffect, useRef, useState } from "react";
import { PermissionsAndroid, Platform } from "react-native";
import { AudioRecorder } from "react-native-audio-api";

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
const BUFFER_LENGTH = 1024;

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
  const recorderRef = useRef<AudioRecorder | null>(null);
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

    const recorder = new AudioRecorder();
    recorderRef.current = recorder;

    const result = recorder.onAudioReady(
      {
        sampleRate: SAMPLE_RATE,
        bufferLength: BUFFER_LENGTH,
        channelCount: 1,
      },
      (event) => {
        if (!isRecordingRef.current) return;

        // Extract mono channel data from the AudioBuffer
        const samples = event.buffer.getChannelData(0);
        onSamplesRef.current(samples);
      },
    );

    if (result.status === "error") {
      setError(result.message);
      return;
    }

    recorder.onError((err) => {
      setError(err.message);
    });

    recorder.start();
    isRecordingRef.current = true;
    setIsRecording(true);
  }, []);

  const stopRecording = useCallback(() => {
    isRecordingRef.current = false;
    if (recorderRef.current) {
      recorderRef.current.clearOnAudioReady();
      recorderRef.current.clearOnError();
      recorderRef.current.stop();
      recorderRef.current = null;
    }
    setIsRecording(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isRecordingRef.current) {
        isRecordingRef.current = false;
        if (recorderRef.current) {
          recorderRef.current.clearOnAudioReady();
          recorderRef.current.clearOnError();
          recorderRef.current.stop();
          recorderRef.current = null;
        }
      }
    };
  }, []);

  return { isRecording, error, startRecording, stopRecording };
}
