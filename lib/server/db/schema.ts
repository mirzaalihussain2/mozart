import { sql } from "drizzle-orm";
import {
  check,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { MODE_IDS } from "../../config/modes";
import type { SpotifyTaste } from "../../types/taste";

// Exactly two tables (AGENTS.md §3, docs/tech-spec.md §4).

export const AUTH_PROVIDERS = ["spotify", "dummy"] as const;
export type AuthProvider = (typeof AUTH_PROVIDERS)[number];

export type GenerationInput = Record<string, string>;

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    spotifyUserId: text("spotify_user_id").unique(),
    displayName: text("display_name").notNull(),
    firstName: text("first_name").notNull(),
    avatarUrl: text("avatar_url"),
    authProvider: text("auth_provider", { enum: AUTH_PROVIDERS }).notNull(),
    spotifyTaste: jsonb("spotify_taste").$type<SpotifyTaste>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [check("users_auth_provider_check", sql`${t.authProvider} in ('spotify', 'dummy')`)],
);

export const tracks = pgTable(
  "tracks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    publicSlug: text("public_slug").notNull().unique(),
    mode: text("mode", { enum: MODE_IDS }).notNull(),
    title: text("title").notNull(),
    audioUrl: text("audio_url").notNull(),
    artworkUrl: text("artwork_url"),
    sourceTrackId: uuid("source_track_id").references((): AnyPgColumn => tracks.id, {
      onDelete: "set null",
    }),
    generationInput: jsonb("generation_input").$type<GenerationInput>().notNull(),
    ownerUserId: uuid("owner_user_id").references(() => users.id, { onDelete: "set null" }),
    anonymousSessionId: text("anonymous_session_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("tracks_owner_created_idx").on(t.ownerUserId, t.createdAt.desc()),
    index("tracks_anonymous_session_idx").on(t.anonymousSessionId),
    check(
      "tracks_mode_check",
      sql`${t.mode} in ('remix', 'cover', 'rewrite', 'vibe', 'new')`,
    ),
  ],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Track = typeof tracks.$inferSelect;
export type NewTrack = typeof tracks.$inferInsert;
