import { Pressable, Text, useColorScheme, View } from "react-native";
import { Link, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClientProvider } from "@tanstack/react-query";

import { queryClient } from "~/utils/api";
import { authClient } from "~/utils/auth";

import "../styles.css";

function HeaderRight() {
  const { data: session } = authClient.useSession();

  if (session) {
    return (
      <View className="flex-row items-center gap-3">
        <Link href="/sessions" asChild>
          <Pressable>
            <Text className="text-white">My Sessions</Text>
          </Pressable>
        </Link>
        <Pressable
          onPress={() => authClient.signOut()}
        >
          <Text className="text-white">Sign Out</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <Pressable
      onPress={() =>
        authClient.signIn.social({ provider: "discord", callbackURL: "/" })
      }
    >
      <Text className="text-white">Sign In</Text>
    </Pressable>
  );
}

// This is the main layout of the app
// It wraps your pages with the providers they need
export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <QueryClientProvider client={queryClient}>
      <Stack
        screenOptions={{
          title: "Morse Code Studio",
          headerStyle: {
            backgroundColor: "#c03484",
          },
          headerTitleStyle: {
            color: "#FFFFFF",
          },
          contentStyle: {
            backgroundColor: colorScheme == "dark" ? "#09090B" : "#FFFFFF",
          },
          headerRight: () => <HeaderRight />,
        }}
      />
      <StatusBar />
    </QueryClientProvider>
  );
}
