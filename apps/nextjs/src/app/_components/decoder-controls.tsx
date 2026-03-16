"use client";

import { useCallback, useState } from "react";
import { DEFAULT_CONFIG } from "@morse-bot/morse-decoder";
import type { DecoderConfig } from "@morse-bot/morse-decoder";
import { Button } from "@morse-bot/ui/button";
import { Input } from "@morse-bot/ui/input";
import { Label } from "@morse-bot/ui/label";

const WPM_PRESETS = [5, 10, 13, 15, 20, 25, 30] as const;

interface DecoderControlsProps {
  onUpdateConfig: (partial: Partial<DecoderConfig>) => void;
  onReset: () => void;
  isDisabled?: boolean;
}

export function DecoderControls({
  onUpdateConfig,
  onReset,
  isDisabled = false,
}: DecoderControlsProps) {
  const [frequency, setFrequency] = useState(DEFAULT_CONFIG.targetFrequency);
  const [wpm, setWpm] = useState(DEFAULT_CONFIG.wpm);
  const [adaptive, setAdaptive] = useState(DEFAULT_CONFIG.adaptive);
  const [threshold, setThreshold] = useState(DEFAULT_CONFIG.threshold);

  const handleFrequencyChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = Number(e.target.value);
      setFrequency(value);
      onUpdateConfig({ targetFrequency: value });
    },
    [onUpdateConfig],
  );

  const handleWpmChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = Number(e.target.value);
      setWpm(value);
      onUpdateConfig({ wpm: value });
    },
    [onUpdateConfig],
  );

  const handleAdaptiveChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.checked;
      setAdaptive(value);
      onUpdateConfig({ adaptive: value });
    },
    [onUpdateConfig],
  );

  const handleThresholdChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = Number(e.target.value);
      setThreshold(value);
      onUpdateConfig({ threshold: value });
    },
    [onUpdateConfig],
  );

  return (
    <div className="flex flex-wrap items-end gap-4 rounded border p-3">
      <div className="flex flex-col gap-1">
        <Label htmlFor="frequency">Frequency (Hz)</Label>
        <Input
          id="frequency"
          type="range"
          min={300}
          max={1200}
          step={10}
          value={frequency}
          onChange={handleFrequencyChange}
          disabled={isDisabled}
          className="h-9 w-32 cursor-pointer px-0 py-2"
        />
        <span className="text-muted-foreground text-center font-mono text-xs tabular-nums">
          {frequency} Hz
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="wpm">Speed (WPM)</Label>
        <select
          id="wpm"
          value={wpm}
          onChange={handleWpmChange}
          disabled={isDisabled}
          className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-md border px-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50"
        >
          {WPM_PRESETS.map((preset) => (
            <option key={preset} value={preset}>
              {preset}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="threshold">Threshold</Label>
        <Input
          id="threshold"
          type="range"
          min={0.001}
          max={0.1}
          step={0.001}
          value={threshold}
          onChange={handleThresholdChange}
          disabled={isDisabled}
          className="h-9 w-28 cursor-pointer px-0 py-2"
        />
        <span className="text-muted-foreground text-center font-mono text-xs tabular-nums">
          {threshold.toFixed(3)}
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="adaptive">Adaptive</Label>
        <div className="flex h-9 items-center">
          <input
            id="adaptive"
            type="checkbox"
            checked={adaptive}
            onChange={handleAdaptiveChange}
            disabled={isDisabled}
            className="h-4 w-4 cursor-pointer accent-primary disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={onReset}
        disabled={isDisabled}
      >
        Clear
      </Button>
    </div>
  );
}
