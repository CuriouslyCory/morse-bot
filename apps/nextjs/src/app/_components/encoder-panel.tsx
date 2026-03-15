"use client";

import { useCallback, useState } from "react";

import { Button } from "@moris-bot/ui/button";
import { Label } from "@moris-bot/ui/label";

import { useMorsePlayer } from "~/hooks/use-morse-player";

const WPM_PRESETS = [5, 10, 13, 15, 20, 25, 30] as const;

interface EncoderPanelProps {
  frequency: number;
  wpm: number;
}

export function EncoderPanel({ frequency, wpm: defaultWpm }: EncoderPanelProps) {
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
    <div className="flex flex-col gap-3 rounded border p-3">
      <div className="flex items-center justify-between">
        <Label className="font-semibold">Text to Morse</Label>
        <div className="flex items-center gap-2">
          <Label htmlFor="encoder-wpm" className="text-xs">
            WPM
          </Label>
          <select
            id="encoder-wpm"
            value={playWpm}
            onChange={handleWpmChange}
            disabled={isPlaying}
            className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-7 rounded-md border px-2 text-xs shadow-xs outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50"
          >
            {WPM_PRESETS.map((preset) => (
              <option key={preset} value={preset}>
                {preset}
              </option>
            ))}
          </select>
        </div>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={isPlaying}
        placeholder="Type text to encode as morse code…"
        rows={3}
        className="min-h-16 rounded-md border bg-background px-3 py-2 font-mono text-sm shadow-xs outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
      />

      {/* Character highlight display — shown while playing */}
      {isPlaying && chars.length > 0 && (
        <div className="break-all rounded border bg-muted px-3 py-2 font-mono text-sm leading-relaxed">
          {chars.map((char, i) => (
            <span
              key={i}
              className={
                i === currentCharIndex
                  ? "rounded bg-primary px-0.5 text-primary-foreground"
                  : ""
              }
            >
              {char}
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        {isPlaying ? (
          <Button variant="outline" size="sm" onClick={stop}>
            Stop
          </Button>
        ) : (
          <Button size="sm" onClick={handlePlay} disabled={!text.trim()}>
            Play
          </Button>
        )}
        <span className="self-center font-mono text-xs text-muted-foreground">
          {frequency} Hz
        </span>
      </div>
    </div>
  );
}
