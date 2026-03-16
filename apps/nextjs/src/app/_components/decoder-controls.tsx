"use client";

import type { DecoderConfig } from "@morse-bot/morse-decoder";
import { useCallback, useState } from "react";

import { DEFAULT_CONFIG } from "@morse-bot/morse-decoder";
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
    <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 lg:grid-cols-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="frequency" className="text-xs font-medium uppercase tracking-wider">
          Frequency
        </Label>
        <Input
          id="frequency"
          type="range"
          min={300}
          max={1200}
          step={10}
          value={frequency}
          onChange={handleFrequencyChange}
          disabled={isDisabled}
          className="h-9 cursor-pointer px-0 py-2"
        />
        <span className="text-muted-foreground text-center font-mono text-xs tabular-nums">
          {frequency} Hz
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="wpm" className="text-xs font-medium uppercase tracking-wider">
          Speed
        </Label>
        <select
          id="wpm"
          value={wpm}
          onChange={handleWpmChange}
          disabled={isDisabled}
          className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-lg border px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50"
        >
          {WPM_PRESETS.map((preset) => (
            <option key={preset} value={preset}>
              {preset} WPM
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="threshold" className="text-xs font-medium uppercase tracking-wider">
          Threshold
        </Label>
        <Input
          id="threshold"
          type="range"
          min={0.001}
          max={0.1}
          step={0.001}
          value={threshold}
          onChange={handleThresholdChange}
          disabled={isDisabled}
          className="h-9 cursor-pointer px-0 py-2"
        />
        <span className="text-muted-foreground text-center font-mono text-xs tabular-nums">
          {threshold.toFixed(3)}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="adaptive" className="text-xs font-medium uppercase tracking-wider">
          Adaptive
        </Label>
        <div className="flex h-9 items-center">
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              id="adaptive"
              type="checkbox"
              checked={adaptive}
              onChange={handleAdaptiveChange}
              disabled={isDisabled}
              className="peer sr-only"
            />
            <div className="peer-checked:bg-primary bg-muted h-6 w-11 rounded-full after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:transition-transform peer-checked:after:translate-x-5 peer-disabled:cursor-not-allowed peer-disabled:opacity-50" />
          </label>
        </div>
      </div>

      <div className="flex flex-col justify-end">
        <Button
          variant="outline"
          onClick={onReset}
          disabled={isDisabled}
          className="rounded-full"
        >
          Clear
        </Button>
      </div>
    </div>
  );
}
