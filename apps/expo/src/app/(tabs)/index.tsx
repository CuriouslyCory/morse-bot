import { SafeAreaView } from "react-native";
import { Stack } from "expo-router";

import { DecoderPanel } from "~/components/decoder-panel";

export default function DecoderScreen() {
  return (
    <SafeAreaView className="flex-1">
      <Stack.Screen options={{ title: "Morse Decoder" }} />
      <DecoderPanel />
    </SafeAreaView>
  );
}
