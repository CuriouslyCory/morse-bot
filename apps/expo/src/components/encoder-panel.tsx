import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";

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

  const chars = [...text];

  return (
    <ScrollView className="flex-1" contentContainerClassName="gap-4 p-4">
      <View className="border-border bg-card gap-4 rounded-lg border p-4">
        {/* Header */}
        <View className="flex-row flex-wrap items-center justify-between gap-2">
          <Text className="text-card-foreground text-lg font-semibold">
            Text to Morse
          </Text>
          <View className="flex-row items-center gap-3">
            <Text className="text-muted-foreground text-xs">Speed</Text>
            <View className="flex-row flex-wrap gap-1">
              {WPM_PRESETS.map((preset) => (
                <Pressable
                  key={preset}
                  onPress={() => setPlayWpm(preset)}
                  disabled={isPlaying}
                  className={`rounded-md px-2 py-1 ${playWpm === preset ? "bg-primary" : "bg-muted"} ${isPlaying ? "opacity-50" : ""}`}
                >
                  <Text
                    className={`text-xs ${playWpm === preset ? "text-primary-foreground" : "text-foreground"}`}
                  >
                    {preset}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text className="text-muted-foreground font-mono text-xs">
              {frequency} Hz
            </Text>
          </View>
        </View>

        {/* Text input */}
        <TextInput
          value={text}
          onChangeText={setText}
          editable={!isPlaying}
          placeholder="Type text to encode as morse code..."
          placeholderTextColor="#888"
          multiline
          numberOfLines={4}
          className={`border-input bg-background text-foreground min-h-24 rounded-lg border px-4 py-3 font-mono text-sm ${isPlaying ? "opacity-50" : ""}`}
        />

        {/* Character highlighting during playback */}
        {isPlaying && chars.length > 0 ? (
          <View className="bg-muted flex-row flex-wrap rounded-lg p-4">
            {chars.map((char, i) => (
              <Text
                key={i}
                className={`font-mono text-sm leading-relaxed ${
                  i === currentCharIndex
                    ? "bg-primary text-primary-foreground rounded px-0.5"
                    : "text-foreground"
                }`}
              >
                {char}
              </Text>
            ))}
          </View>
        ) : null}

        {/* Play/Stop buttons */}
        <View className="flex-row gap-3">
          {isPlaying ? (
            <Pressable
              onPress={stop}
              className="bg-destructive rounded-full px-8 py-3"
            >
              <Text className="text-destructive-foreground">Stop</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={handlePlay}
              disabled={!text.trim()}
              className={`bg-primary rounded-full px-8 py-3 ${!text.trim() ? "opacity-50" : ""}`}
            >
              <Text className="text-primary-foreground">Play</Text>
            </Pressable>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
