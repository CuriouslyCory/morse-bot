"use client";

import { useEffect, useRef } from "react";

import type { MorseElement } from "@moris-bot/morse-decoder";

interface DecodedTextProps {
  decodedText: string;
  currentElements: MorseElement[];
  isRecording: boolean;
}

function elementsToSymbols(elements: MorseElement[]): string {
  return elements.map((e) => (e === "dit" ? "." : "-")).join("");
}

export function DecodedText({
  decodedText,
  currentElements,
  isRecording,
}: DecodedTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new text arrives
  useEffect(() => {
    const el = containerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [decodedText, currentElements]);

  const inProgress = elementsToSymbols(currentElements);

  return (
    <div
      ref={containerRef}
      className="min-h-48 w-full overflow-y-auto rounded border bg-muted p-4 font-mono text-lg dark:bg-zinc-950 dark:text-green-400"
    >
      {decodedText || inProgress ? (
        <span>
          {decodedText}
          {inProgress && (
            <span className="text-muted-foreground dark:text-green-700">
              {inProgress}
            </span>
          )}
        </span>
      ) : (
        <span className="text-muted-foreground">
          {isRecording
            ? "Listening for morse code..."
            : "Press Start to begin decoding"}
        </span>
      )}
    </div>
  );
}
