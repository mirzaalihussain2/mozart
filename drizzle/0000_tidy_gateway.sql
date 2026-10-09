CREATE TABLE "tracks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_slug" text NOT NULL,
	"mode" text NOT NULL,
	"title" text NOT NULL,
	"audio_url" text NOT NULL,
	"artwork_url" text,
	"source_track_id" uuid,
	"generation_input" jsonb NOT NULL,
	"owner_user_id" uuid,
	"anonymous_session_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tracks_public_slug_unique" UNIQUE("public_slug"),
	CONSTRAINT "tracks_mode_check" CHECK ("tracks"."mode" in ('remix', 'cover', 'rewrite', 'vibe', 'new'))
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"spotify_user_id" text,
	"display_name" text NOT NULL,
	"first_name" text NOT NULL,
	"avatar_url" text,
	"auth_provider" text NOT NULL,
	"spotify_taste" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_spotify_user_id_unique" UNIQUE("spotify_user_id"),
	CONSTRAINT "users_auth_provider_check" CHECK ("users"."auth_provider" in ('spotify', 'dummy'))
);
--> statement-breakpoint
ALTER TABLE "tracks" ADD CONSTRAINT "tracks_source_track_id_tracks_id_fk" FOREIGN KEY ("source_track_id") REFERENCES "public"."tracks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracks" ADD CONSTRAINT "tracks_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tracks_owner_created_idx" ON "tracks" USING btree ("owner_user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "tracks_anonymous_session_idx" ON "tracks" USING btree ("anonymous_session_id");