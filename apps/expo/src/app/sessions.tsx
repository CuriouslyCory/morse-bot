import { useState } from "react";
import { Alert, Pressable, SafeAreaView, Text, View } from "react-native";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { LegendList } from "@legendapp/list";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { trpc } from "~/utils/api";
import { authClient } from "~/utils/auth";

function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

interface Session {
  id: string;
  decodedText: string;
  durationMs: number;
  source: string;
  createdAt: Date;
}

export default function SessionsScreen() {
  const { data: session } = authClient.useSession();
  const isAuthenticated = !!session;

  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: sessions, isLoading } = useQuery(
    trpc.session.list.queryOptions(),
  );

  const deleteSession = useMutation(
    trpc.session.delete.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.session.pathFilter());
        Alert.alert("Success", "Session deleted.");
      },
      onError: () => {
        Alert.alert("Error", "Failed to delete session.");
      },
    }),
  );

  const handleExport = async (item: Session) => {
    const filename = `session-${item.id.slice(0, 8)}.txt`;
    const file = new File(Paths.cache, filename);
    file.write(item.decodedText);
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(file.uri);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert("Delete this session?", "This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteSession.mutate(id),
      },
    ]);
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center p-4">
        <Text className="text-foreground mb-4 text-center">
          Sign in to view your saved sessions
        </Text>
        <Pressable
          onPress={() =>
            void authClient.signIn.social({
              provider: "discord",
              callbackURL: "/",
            })
          }
          className="bg-primary rounded-full px-6 py-3"
        >
          <Text className="text-primary-foreground">Sign in with Discord</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center">
        <Text className="text-foreground">Loading sessions...</Text>
      </SafeAreaView>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center p-4">
        <Text className="text-muted-foreground text-center">
          No saved sessions yet. Decode some morse code and click Save Session!
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1">
      <LegendList
        data={sessions}
        keyExtractor={(item) => item.id}
        estimatedItemSize={120}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        renderItem={({ item }) => {
          const isExpanded = expandedId === item.id;
          const preview = item.decodedText.slice(0, 100);
          const hasMore = item.decodedText.length > 100;
          const createdAt = new Date(item.createdAt).toLocaleString();

          return (
            <View className="border-border bg-card rounded-lg border p-4">
              <View className="flex-row items-start justify-between gap-2">
                <View className="flex-1 gap-1">
                  <View className="flex-row flex-wrap gap-2">
                    <Text className="text-muted-foreground text-sm">
                      {createdAt}
                    </Text>
                    <Text className="text-muted-foreground text-sm">·</Text>
                    <Text className="text-muted-foreground text-sm">
                      {formatDuration(item.durationMs)}
                    </Text>
                    <Text className="text-muted-foreground text-sm">·</Text>
                    <Text className="text-muted-foreground text-sm capitalize">
                      {item.source}
                    </Text>
                  </View>
                  <Text className="text-foreground mt-1 font-mono text-sm">
                    {isExpanded ? item.decodedText : preview}
                    {!isExpanded && hasMore ? (
                      <Text className="text-muted-foreground">…</Text>
                    ) : null}
                  </Text>
                  {hasMore ? (
                    <Pressable
                      onPress={() => setExpandedId(isExpanded ? null : item.id)}
                    >
                      <Text className="text-muted-foreground mt-1 text-xs underline">
                        {isExpanded ? "Show less" : "Show more"}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
                <View className="shrink-0 gap-2">
                  <Pressable
                    onPress={() => void handleExport(item)}
                    className="border-border rounded-md border px-3 py-1.5"
                  >
                    <Text className="text-foreground text-sm">Export</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleDelete(item.id)}
                    disabled={deleteSession.isPending}
                    className={`border-border rounded-md border px-3 py-1.5 ${deleteSession.isPending ? "opacity-50" : ""}`}
                  >
                    <Text className="text-destructive text-sm">Delete</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}
