"use client";

import { useState } from "react";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";

import { Button } from "@morse-bot/ui/button";
import { toast } from "@morse-bot/ui/toast";

import { useTRPC } from "~/trpc/react";

function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

function downloadText(text: string, filename: string) {
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function SessionsList() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: sessions } = useSuspenseQuery(trpc.session.list.queryOptions());

  const deleteSession = useMutation(
    trpc.session.delete.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.session.pathFilter());
        toast.success("Session deleted.");
      },
      onError: () => {
        toast.error("Failed to delete session.");
      },
    }),
  );

  const handleDelete = (id: string) => {
    if (!window.confirm("Delete this session?")) return;
    deleteSession.mutate(id);
  };

  if (sessions.length === 0) {
    return (
      <p className="text-muted-foreground">
        No saved sessions yet. Decode some morse code and click &quot;Save
        Session&quot;!
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {sessions.map((session) => {
        const isExpanded = expandedId === session.id;
        const preview = session.decodedText.slice(0, 100);
        const hasMore = session.decodedText.length > 100;
        const createdAt = new Date(session.createdAt).toLocaleString();
        const filename = `session-${session.id.slice(0, 8)}.txt`;

        return (
          <div key={session.id} className="rounded-lg border p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col gap-1">
                <div className="text-muted-foreground flex items-center gap-3 text-sm">
                  <span>{createdAt}</span>
                  <span>·</span>
                  <span>{formatDuration(session.durationMs)}</span>
                  <span>·</span>
                  <span className="capitalize">{session.source}</span>
                </div>
                <p className="mt-1 font-mono text-sm">
                  {isExpanded ? session.decodedText : preview}
                  {!isExpanded && hasMore && (
                    <span className="text-muted-foreground">…</span>
                  )}
                </p>
                {hasMore && (
                  <button
                    onClick={() =>
                      setExpandedId(isExpanded ? null : session.id)
                    }
                    className="text-muted-foreground mt-1 self-start text-xs underline-offset-2 hover:underline"
                  >
                    {isExpanded ? "Show less" : "Show more"}
                  </button>
                )}
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadText(session.decodedText, filename)}
                >
                  Export
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(session.id)}
                  disabled={deleteSession.isPending}
                  className="text-destructive hover:text-destructive"
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
