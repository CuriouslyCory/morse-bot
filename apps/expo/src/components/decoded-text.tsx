import type { MorseElement } from "@morse-bot/morse-decoder";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Pressable, ScrollView, Text, View } from "react-native";
import * as Clipboard from "expo-clipboard";

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
  const scrollViewRef = useRef<ScrollView>(null);
  const [cursorOpacity] = useState(() => new Animated.Value(1));

  // Blinking cursor animation
  useEffect(() => {
    if (!isRecording) {
      cursorOpacity.setValue(1);
      return;
    }
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(cursorOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(cursorOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [isRecording, cursorOpacity]);

  // Auto-scroll to bottom when text changes
  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: false });
  }, [decodedText, currentElements]);

  const handleCopy = useCallback(async () => {
    if (decodedText.trim()) {
      await Clipboard.setStringAsync(decodedText);
    }
  }, [decodedText]);

  const inProgress = elementsToSymbols(currentElements);
  const hasContent = decodedText || inProgress;

  return (
    <View className="border-border bg-card overflow-hidden rounded-lg border">
      <View className="flex-row items-center justify-between px-4 py-3">
        <Text className="text-card-foreground text-sm font-medium">
          Decoded Output
        </Text>
        {decodedText.trim() ? (
          <Pressable onPress={() => void handleCopy()}>
            <Text className="text-muted-foreground text-xs">Copy</Text>
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        ref={scrollViewRef}
        className="bg-muted min-h-48 p-4"
        onContentSizeChange={() =>
          scrollViewRef.current?.scrollToEnd({ animated: false })
        }
      >
        {hasContent ? (
          <View className="flex-row flex-wrap">
            <Text className="text-foreground font-mono text-lg">
              {decodedText}
            </Text>
            {inProgress ? (
              <Text className="text-muted-foreground font-mono text-lg">
                {inProgress}
              </Text>
            ) : null}
            {isRecording ? (
              <Animated.View
                style={{ opacity: cursorOpacity }}
                className="bg-foreground ml-0.5 h-5 w-0.5 self-center"
              />
            ) : null}
          </View>
        ) : (
          <Text className="text-muted-foreground font-mono text-lg">
            {isRecording
              ? "Listening for morse code..."
              : "Press Start to begin decoding"}
          </Text>
        )}
      </ScrollView>
    </View>
  );
}
