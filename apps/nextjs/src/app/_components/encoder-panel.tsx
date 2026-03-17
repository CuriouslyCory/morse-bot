"use client";

import { useCallback, useState } from "react";

import { Button } from "@morse-bot/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@morse-bot/ui/card";
import { Label } from "@morse-bot/ui/label";

import { useMorsePlayer } from "~/hooks/use-morse-player";

const WPM_PRESETS = [5, 10, 13, 15, 20, 25, 30] as const;

interface EncoderPanelProps {
  frequency: number;
  wpm: number;
}

export function EncoderPanel({
  frequency,
  wpm: defaultWpm,
}: EncoderPanelProps) {
  const [text, setText] = useState("");
  const [playWpm, setPlayWpm] = useState(defaultWpm);

  const { isPlaying, currentCharIndex, play, stop } = useMorsePlayer({
    frequency,
    wpm: playWpm,
  });

  const handlePlay = useCallback(() => {
    play(text);
  }, [play, text]);

  const handleWpmChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setPlayWpm(Number(e.target.value));
    },
    [],
  );

  const chars = [...text];

  return (
    <div className="flex flex-col gap-6 pt-4">
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Text to Morse</CardTitle>
          <div className="flex items-center gap-3">
            <Label
              htmlFor="encoder-wpm"
              className="text-muted-foreground text-xs"
            >
              Speed
            </Label>
            <select
              id="encoder-wpm"
              value={playWpm}
              onChange={handleWpmChange}
              disabled={isPlaying}
              className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-8 rounded-lg border px-3 text-xs shadow-xs outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50"
            >
              {WPM_PRESETS.map((preset) => (
                <option key={preset} value={preset}>
                  {preset} WPM
                </option>
              ))}
            </select>
            <span className="text-muted-foreground font-mono text-xs">
              {frequency} Hz
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isPlaying}
            placeholder="Type text to encode as morse code..."
            rows={4}
            className="border-input bg-background focus-visible:ring-ring min-h-24 w-full rounded-lg border px-4 py-3 font-mono text-sm shadow-xs outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50"
          />

          {isPlaying && chars.length > 0 && (
            <div className="bg-muted mt-4 rounded-lg p-4 font-mono text-sm leading-relaxed break-all">
              {chars.map((char, i) => (
                <span
                  key={i}
                  className={
                    i === currentCharIndex
                      ? "bg-primary text-primary-foreground rounded px-0.5"
                      : ""
                  }
                >
                  {char}
                </span>
              ))}
            </div>
          )}

          <div className="mt-4 flex gap-3">
            {isPlaying ? (
              <Button
                variant="destructive"
                size="lg"
                onClick={stop}
                className="rounded-full px-8"
              >
                Stop
              </Button>
            ) : (
              <Button
                size="lg"
                onClick={handlePlay}
                disabled={!text.trim()}
                className="rounded-full px-8"
              >
                Play
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
