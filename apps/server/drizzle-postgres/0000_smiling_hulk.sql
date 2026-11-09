CREATE TABLE "auth_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"token_hash" text NOT NULL,
	"role" text NOT NULL,
	"referee_id" integer,
	"created_at" bigint NOT NULL,
	"expires_at" bigint NOT NULL,
	"revoked_at" bigint,
	CONSTRAINT "auth_sessions_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"season" text NOT NULL,
	"location" text,
	"event_date" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"ruleset" text DEFAULT 'BIOGLOW' NOT NULL,
	"table_count" integer DEFAULT 1 NOT NULL,
	"practice_matches_enabled" boolean DEFAULT false NOT NULL,
	"created_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"match_number" integer NOT NULL,
	"team_1_id" integer NOT NULL,
	"team_2_id" integer,
	"scheduled_at" text,
	"status" text DEFAULT 'upcoming' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "referee_login_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"token_hash" text NOT NULL,
	"referee_id" integer NOT NULL,
	"created_by_session_id" integer NOT NULL,
	"created_at" bigint NOT NULL,
	"expires_at" bigint NOT NULL,
	"redeemed_at" bigint,
	CONSTRAINT "referee_login_codes_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "referee_matches" (
	"id" serial PRIMARY KEY NOT NULL,
	"referee_id" integer NOT NULL,
	"match_id" integer NOT NULL,
	"assigned_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "referees" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"username" text NOT NULL,
	"table_number" integer,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" bigint NOT NULL,
	CONSTRAINT "referees_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "scoresheets" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"team_id" integer NOT NULL,
	"match_number" integer NOT NULL,
	"table_number" integer NOT NULL,
	"m01_young_forest" integer NOT NULL,
	"m01_grand_tree" integer NOT NULL,
	"m01_hollow_tree" integer NOT NULL,
	"m01_queen_knocked_down" boolean NOT NULL,
	"m02_base" integer NOT NULL,
	"m02_canopy" integer NOT NULL,
	"m03_waterfall" integer NOT NULL,
	"m04_nest" boolean NOT NULL,
	"m04_hollow" boolean NOT NULL,
	"m05_haven" integer NOT NULL,
	"lu_added" integer NOT NULL,
	"lu_contained" integer NOT NULL,
	"interference" integer NOT NULL,
	"gp" integer NOT NULL,
	"total_score" integer NOT NULL,
	"submitted_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"number" integer NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_referee_id_referees_id_fk" FOREIGN KEY ("referee_id") REFERENCES "public"."referees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_team_1_id_teams_id_fk" FOREIGN KEY ("team_1_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_team_2_id_teams_id_fk" FOREIGN KEY ("team_2_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referee_login_codes" ADD CONSTRAINT "referee_login_codes_referee_id_referees_id_fk" FOREIGN KEY ("referee_id") REFERENCES "public"."referees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referee_login_codes" ADD CONSTRAINT "referee_login_codes_created_by_session_id_auth_sessions_id_fk" FOREIGN KEY ("created_by_session_id") REFERENCES "public"."auth_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referee_matches" ADD CONSTRAINT "referee_matches_referee_id_referees_id_fk" FOREIGN KEY ("referee_id") REFERENCES "public"."referees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referee_matches" ADD CONSTRAINT "referee_matches_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scoresheets" ADD CONSTRAINT "scoresheets_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scoresheets" ADD CONSTRAINT "scoresheets_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "events_one_active_unique" ON "events" USING btree ("status") WHERE "events"."status" = 'active';--> statement-breakpoint
CREATE UNIQUE INDEX "matches_event_match_number_unique" ON "matches" USING btree ("event_id","match_number");--> statement-breakpoint
CREATE INDEX "matches_event_id_idx" ON "matches" USING btree ("event_id");--> statement-breakpoint
CREATE UNIQUE INDEX "referee_matches_referee_match_unique" ON "referee_matches" USING btree ("referee_id","match_id");--> statement-breakpoint
CREATE INDEX "referee_matches_match_id_idx" ON "referee_matches" USING btree ("match_id");--> statement-breakpoint
CREATE UNIQUE INDEX "scoresheets_event_team_match_unique" ON "scoresheets" USING btree ("event_id","team_id","match_number");--> statement-breakpoint
CREATE INDEX "scoresheets_event_id_idx" ON "scoresheets" USING btree ("event_id");--> statement-breakpoint
CREATE UNIQUE INDEX "teams_event_number_unique" ON "teams" USING btree ("event_id","number");