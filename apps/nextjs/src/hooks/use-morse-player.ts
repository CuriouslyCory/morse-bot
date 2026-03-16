"use client";

import type { MorseElement } from "@morse-bot/morse-decoder";
import { useCallback, useRef, useState } from "react";
import {
  createEncoder,
  ditDurationMs,
  getMorseForChar,
  TIMING_RATIOS,
} from "@morse-bot/morse-decoder";

interface CharTiming {
  charIndex: number;
  startMs: number;
}

/**
 * Build per-character start-time offsets that mirror createEncoder's walk logic
 * so UI highlights stay in sync with scheduled audio.
 */
function buildCharTimings(text: string, wpm: number): CharTiming[] {
  const dit = ditDurationMs(wpm);
  const dah = dit * TIMING_RATIOS.dah;
  const elementGap = dit * TIMING_RATIOS.dit;
  const charGap = dit * TIMING_RATIOS.charGap;
  const wordGap = dit * TIMING_RATIOS.wordGap;

  const timings: CharTiming[] = [];
  let ms = 0;
  let hasContent = false;
  let charIdx = 0;

  const words = text.split(" ");

  for (let wi = 0; wi < words.length; wi++) {
    const word = words[wi] ?? "";

    if (word) {
      if (wi > 0 && hasContent) ms += wordGap;

      let charEmitted = false;
      const chars = [...word];

      for (const char of chars) {
        const elements = getMorseForChar(char);

        if (!elements || elements.length === 0) {
          charIdx++;
          continue;
        }

        if (charEmitted) ms += charGap;

        timings.push({ charIndex: charIdx, startMs: ms });

        for (let ei = 0; ei < elements.length; ei++) {
          if (ei > 0) ms += elementGap;
          const elem: MorseElement | undefined = elements[ei];
          ms += elem === "dit" ? dit : dah;
        }

        charEmitted = true;
        hasContent = true;
        charIdx++;
      }
    }

    // Advance past the space separator (except after the last word)
    if (wi < words.length - 1) {
      charIdx++;
    }
  }

  return timings;
}

interface UseMorsePlayerOptions {
  frequency: number;
  wpm: number;
}

interface UseMorsePlayerResult {
  isPlaying: boolean;
  currentCharIndex: number;
  play: (text: string) => void;
  stop: () => void;
}

export function useMorsePlayer({
  frequency,
  wpm,
}: UseMorsePlayerOptions): UseMorsePlayerResult {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentCharIndex, setCurrentCharIndex] = useState(-1);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const timeoutIdsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const stop = useCallback(() => {
    for (const id of timeoutIdsRef.current) clearTimeout(id);
    timeoutIdsRef.current = [];
    void audioCtxRef.current?.close();
    audioCtxRef.current = null;
    setIsPlaying(false);
    setCurrentCharIndex(-1);
  }, []);

  const play = useCallback(
    (text: string) => {
      stop();

      const trimmed = text.trim();
      if (!trimmed) return;

      const events = createEncoder({ wpm, frequency }).encode(trimmed);
      const charTimings = buildCharTimings(trimmed, wpm);

      if (events.length === 0) return;

      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      setIsPlaying(true);

      const firstCharIdx = charTimings[0]?.charIndex ?? -1;
      setCurrentCharIndex(firstCharIdx);

      // Schedule all tone events using AudioContext.currentTime for precise timing.
      // A small lead time (50ms) ensures the first tone starts cleanly.
      const LEAD_S = 0.05;
      let t = ctx.currentTime + LEAD_S;

      for (const event of events) {
        if (event.type === "tone") {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.frequency.value = frequency;
          osc.type = "sine";
          gain.gain.value = 0.3;
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + event.durationMs / 1000);
        }
        t += event.durationMs / 1000;
      }

      // Schedule UI character highlights via setTimeout (wall-clock, relative to now)
      const newTimeoutIds: ReturnType<typeof setTimeout>[] = [];

      for (const timing of charTimings) {
        const delay = LEAD_S * 1000 + timing.startMs;
        const id = setTimeout(() => {
          setCurrentCharIndex(timing.charIndex);
        }, delay);
        newTimeoutIds.push(id);
      }

      // Cleanup when playback ends
      const totalDurationMs = events.reduce((sum, e) => sum + e.durationMs, 0);
      const cleanupId = setTimeout(
        () => {
          void audioCtxRef.current?.close();
          audioCtxRef.current = null;
          setIsPlaying(false);
          setCurrentCharIndex(-1);
        },
        LEAD_S * 1000 + totalDurationMs + 100,
      );
      newTimeoutIds.push(cleanupId);

      timeoutIdsRef.current = newTimeoutIds;
    },
    [frequency, wpm, stop],
  );

  return { isPlaying, currentCharIndex, play, stop };
}
