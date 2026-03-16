import { useCallback, useEffect, useRef } from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import type { MorseElement } from "@morse-bot/morse-decoder";

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
  const cursorOpacity = useRef(new Animated.Value(1)).current;

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
    <View className="overflow-hidden rounded-lg border border-border bg-card">
      <View className="flex-row items-center justify-between px-4 py-3">
        <Text className="text-sm font-medium text-card-foreground">
          Decoded Output
        </Text>
        {decodedText.trim() ? (
          <Pressable onPress={() => void handleCopy()}>
            <Text className="text-xs text-muted-foreground">Copy</Text>
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        ref={scrollViewRef}
        className="min-h-48 bg-muted p-4"
        onContentSizeChange={() =>
          scrollViewRef.current?.scrollToEnd({ animated: false })
        }
      >
        {hasContent ? (
          <View className="flex-row flex-wrap">
            <Text className="font-mono text-lg text-foreground">
              {decodedText}
            </Text>
            {inProgress ? (
              <Text className="font-mono text-lg text-muted-foreground">
                {inProgress}
              </Text>
            ) : null}
            {isRecording ? (
              <Animated.View
                style={{ opacity: cursorOpacity }}
                className="ml-0.5 h-5 w-0.5 self-center bg-foreground"
              />
            ) : null}
          </View>
        ) : (
          <Text className="font-mono text-lg text-muted-foreground">
            {isRecording
              ? "Listening for morse code..."
              : "Press Start to begin decoding"}
          </Text>
        )}
      </ScrollView>
    </View>
  );
}
