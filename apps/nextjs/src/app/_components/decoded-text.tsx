"use client";

import type { MorseElement } from "@morse-bot/morse-decoder";
import { useCallback, useEffect, useRef } from "react";

import { Button } from "@morse-bot/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@morse-bot/ui/card";
import { toast } from "@morse-bot/ui/toast";

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

  useEffect(() => {
    const el = containerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [decodedText, currentElements]);

  const handleCopy = useCallback(() => {
    if (decodedText.trim()) {
      void navigator.clipboard.writeText(decodedText);
      toast.success("Copied to clipboard");
    }
  }, [decodedText]);

  const inProgress = elementsToSymbols(currentElements);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex-row items-center justify-between pb-3">
        <CardTitle className="text-sm font-medium">Decoded Output</CardTitle>
        {decodedText.trim() && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="text-muted-foreground h-7 text-xs"
          >
            Copy
          </Button>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <div
          ref={containerRef}
          className="bg-muted min-h-48 w-full overflow-y-auto rounded-lg p-4 font-mono text-lg dark:bg-zinc-950 dark:text-green-400"
        >
          {decodedText || inProgress ? (
            <span>
              {decodedText}
              {inProgress && (
                <span className="text-muted-foreground dark:text-green-700">
                  {inProgress}
                </span>
              )}
              {isRecording && (
                <span className="ml-0.5 inline-block h-5 w-0.5 animate-pulse bg-current align-text-bottom" />
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
      </CardContent>
    </Card>
  );
}
