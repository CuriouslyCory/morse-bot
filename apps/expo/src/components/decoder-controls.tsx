import type { DecoderConfig } from "@morse-bot/morse-decoder";
import { useCallback, useState } from "react";
import { Pressable, Switch, Text, View } from "react-native";
import Slider from "@react-native-community/slider";

import { DEFAULT_CONFIG } from "@morse-bot/morse-decoder";

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
    (value: number) => {
      const rounded = Math.round(value / 10) * 10;
      setFrequency(rounded);
      onUpdateConfig({ targetFrequency: rounded });
    },
    [onUpdateConfig],
  );

  const handleThresholdChange = useCallback(
    (value: number) => {
      const rounded = Math.round(value * 1000) / 1000;
      setThreshold(rounded);
      onUpdateConfig({ threshold: rounded });
    },
    [onUpdateConfig],
  );

  const handleAdaptiveChange = useCallback(
    (value: boolean) => {
      setAdaptive(value);
      onUpdateConfig({ adaptive: value });
    },
    [onUpdateConfig],
  );

  const handleWpmPress = useCallback(
    (preset: number) => {
      setWpm(preset);
      onUpdateConfig({ wpm: preset });
    },
    [onUpdateConfig],
  );

  return (
    <View className="gap-4">
      {/* Frequency */}
      <View className="gap-1">
        <Text className="text-foreground text-xs font-medium tracking-wider uppercase">
          Frequency
        </Text>
        <Slider
          minimumValue={300}
          maximumValue={1200}
          step={10}
          value={frequency}
          onValueChange={handleFrequencyChange}
          disabled={isDisabled}
        />
        <Text className="text-muted-foreground text-center font-mono text-xs tabular-nums">
          {frequency} Hz
        </Text>
      </View>

      {/* Speed (WPM) */}
      <View className="gap-1">
        <Text className="text-foreground text-xs font-medium tracking-wider uppercase">
          Speed
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {WPM_PRESETS.map((preset) => (
            <Pressable
              key={preset}
              onPress={() => handleWpmPress(preset)}
              disabled={isDisabled}
              className={`rounded-md px-3 py-1.5 ${wpm === preset ? "bg-primary" : "bg-muted"} ${isDisabled ? "opacity-50" : ""}`}
            >
              <Text
                className={`text-sm ${wpm === preset ? "text-primary-foreground" : "text-foreground"}`}
              >
                {preset}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text className="text-muted-foreground text-center font-mono text-xs tabular-nums">
          {wpm} WPM
        </Text>
      </View>

      {/* Threshold */}
      <View className="gap-1">
        <Text className="text-foreground text-xs font-medium tracking-wider uppercase">
          Threshold
        </Text>
        <Slider
          minimumValue={0.001}
          maximumValue={0.1}
          step={0.001}
          value={threshold}
          onValueChange={handleThresholdChange}
          disabled={isDisabled}
        />
        <Text className="text-muted-foreground text-center font-mono text-xs tabular-nums">
          {threshold.toFixed(3)}
        </Text>
      </View>

      {/* Adaptive */}
      <View className="flex-row items-center justify-between gap-2">
        <Text className="text-foreground text-xs font-medium tracking-wider uppercase">
          Adaptive
        </Text>
        <Switch
          value={adaptive}
          onValueChange={handleAdaptiveChange}
          disabled={isDisabled}
        />
      </View>

      {/* Clear/Reset */}
      <Pressable
        onPress={onReset}
        disabled={isDisabled}
        className={`border-border items-center rounded-full border py-2 ${isDisabled ? "opacity-50" : ""}`}
      >
        <Text className="text-foreground">Clear</Text>
      </Pressable>
    </View>
  );
}
