import { useState } from "react";
import { SafeAreaView } from "react-native";
import { Stack } from "expo-router";

import { DEFAULT_CONFIG } from "@morse-bot/morse-decoder";

import { EncoderPanel } from "~/components/encoder-panel";

export default function EncoderScreen() {
  const [frequency] = useState(DEFAULT_CONFIG.targetFrequency);
  const [wpm] = useState(DEFAULT_CONFIG.wpm);

  return (
    <SafeAreaView className="flex-1">
      <Stack.Screen options={{ title: "Morse Encoder" }} />
      <EncoderPanel frequency={frequency} wpm={wpm} />
    </SafeAreaView>
  );
}
