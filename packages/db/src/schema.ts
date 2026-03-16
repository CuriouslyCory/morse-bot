import { sql } from "drizzle-orm";
import { pgTable } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

import { user } from "./auth-schema";

export const Post = pgTable("post", (t) => ({
  id: t.uuid().notNull().primaryKey().defaultRandom(),
  title: t.varchar({ length: 256 }).notNull(),
  content: t.text().notNull(),
  createdAt: t.timestamp().defaultNow().notNull(),
  updatedAt: t
    .timestamp({ mode: "date", withTimezone: true })
    .$onUpdateFn(() => sql`now()`),
}));

export const CreatePostSchema = createInsertSchema(Post, {
  title: z.string().max(256),
  content: z.string().max(256),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const DecodedSession = pgTable("decoded_sessions", (t) => ({
  id: t.uuid().notNull().primaryKey().defaultRandom(),
  userId: t
    .text()
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  decodedText: t.text().notNull(),
  durationMs: t.integer().notNull(),
  source: t.text().$type<"mic" | "file">().notNull(),
  settings: t.jsonb().notNull(),
  createdAt: t.timestamp().defaultNow().notNull(),
}));

export const CreateDecodedSessionSchema = createInsertSchema(DecodedSession, {
  decodedText: z.string(),
  durationMs: z.number().int().nonnegative(),
  source: z.enum(["mic", "file"]),
  settings: z.record(z.string(), z.unknown()),
}).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const SelectDecodedSessionSchema = createSelectSchema(DecodedSession);

export * from "./auth-schema";
