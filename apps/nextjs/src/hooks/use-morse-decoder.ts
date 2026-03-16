"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createDecoder,
  DEFAULT_CONFIG,
  type DecoderConfig,
  type DecoderStats,
  type MorseElement,
} from "@morse-bot/morse-decoder";

interface UseMorseDecoderResult {
  decodedText: string;
  stats: DecoderStats;
  currentElements: MorseElement[];
  processSamples: (samples: Float32Array, timestampMs: number) => void;
  reset: () => void;
  updateConfig: (partial: Partial<DecoderConfig>) => void;
}

const DEFAULT_STATS: DecoderStats = {
  signalDb: -Infinity,
  frequency: DEFAULT_CONFIG.targetFrequency,
  snrDb: 0,
  wpm: DEFAULT_CONFIG.wpm,
  toneActive: false,
};

export function useMorseDecoder(
  config: Partial<DecoderConfig> = {},
): UseMorseDecoderResult {
  const fullConfig: DecoderConfig = { ...DEFAULT_CONFIG, ...config };

  const [decodedText, setDecodedText] = useState("");
  const [stats, setStats] = useState<DecoderStats>(DEFAULT_STATS);
  const [currentElements, setCurrentElements] = useState<MorseElement[]>([]);

  // Pending state accumulated between rAF flushes
  const pendingTextRef = useRef("");
  const pendingStatsRef = useRef<DecoderStats>(DEFAULT_STATS);
  const pendingElementsRef = useRef<MorseElement[]>([]);
  const rafIdRef = useRef<number | null>(null);

  // Keep decoder in a ref so we can recreate it without re-rendering
  const decoderRef = useRef(
    createDecoder(fullConfig, {
      onCharacter: (char) => {
        pendingTextRef.current += char;
        pendingElementsRef.current = [];
      },
      onWordBoundary: () => {
        pendingTextRef.current += " ";
        pendingElementsRef.current = [];
      },
      onElement: (element) => {
        pendingElementsRef.current = [...pendingElementsRef.current, element];
      },
      onStats: (s) => {
        pendingStatsRef.current = s;
      },
    }),
  );

  // rAF-gated flush: batch all pending updates into a single React render
  const scheduleFlush = useCallback(() => {
    if (rafIdRef.current !== null) return;
    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null;
      const newText = pendingTextRef.current;
      const newStats = pendingStatsRef.current;
      const newElements = pendingElementsRef.current;

      if (newText !== "") {
        setDecodedText((prev) => prev + newText);
        pendingTextRef.current = "";
      }
      setStats(newStats);
      setCurrentElements(newElements);
    });
  }, []);

  const processSamples = useCallback(
    (samples: Float32Array, timestampMs: number) => {
      decoderRef.current.processSamples(samples, timestampMs);
      scheduleFlush();
    },
    [scheduleFlush],
  );

  const reset = useCallback(() => {
    decoderRef.current.reset();
    pendingTextRef.current = "";
    pendingElementsRef.current = [];
    setDecodedText("");
    setCurrentElements([]);
    setStats(DEFAULT_STATS);
  }, []);

  const updateConfig = useCallback((partial: Partial<DecoderConfig>) => {
    decoderRef.current.updateConfig(partial);
  }, []);

  // Recreate decoder when config changes (config is compared by value via JSON)
  const configKey = JSON.stringify(fullConfig);
  const prevConfigKeyRef = useRef(configKey);
  if (prevConfigKeyRef.current !== configKey) {
    prevConfigKeyRef.current = configKey;
    // Recreate decoder with new config, preserving event callbacks
    const prev = decoderRef.current;
    decoderRef.current = createDecoder(fullConfig, {
      onCharacter: (char) => {
        pendingTextRef.current += char;
        pendingElementsRef.current = [];
      },
      onWordBoundary: () => {
        pendingTextRef.current += " ";
        pendingElementsRef.current = [];
      },
      onElement: (element) => {
        pendingElementsRef.current = [...pendingElementsRef.current, element];
      },
      onStats: (s) => {
        pendingStatsRef.current = s;
      },
    });
    void prev; // previous decoder is GC'd
  }

  // Cancel any pending rAF on unmount
  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  return { decodedText, stats, currentElements, processSamples, reset, updateConfig };
}
