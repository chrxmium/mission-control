CREATE TABLE `events` (
    `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    `name` text NOT NULL,
    `season` text NOT NULL,
    `location` text,
    `event_date` text,
    `status` text DEFAULT 'draft' NOT NULL,
    `ruleset` text DEFAULT 'BIOGLOW' NOT NULL,
    `table_count` integer DEFAULT 1 NOT NULL,
    `practice_matches_enabled` integer DEFAULT false NOT NULL,
    `created_at` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `events` (`name`, `season`, `status`, `ruleset`, `table_count`, `practice_matches_enabled`, `created_at`)
VALUES ('BIOGLOW Event', '2026-2027', 'active', 'BIOGLOW', 1, false, unixepoch() * 1000);
--> statement-breakpoint
DROP TABLE `scoresheets`;
--> statement-breakpoint
DROP TABLE `matches`;
--> statement-breakpoint
DROP TABLE `teams`;
--> statement-breakpoint
CREATE TABLE `teams` (
    `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    `event_id` integer NOT NULL REFERENCES `events`(`id`),
    `number` integer NOT NULL,
    `name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `teams_event_number_unique` ON `teams` (`event_id`, `number`);
--> statement-breakpoint
CREATE TABLE `matches` (
    `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    `event_id` integer NOT NULL REFERENCES `events`(`id`),
    `match_number` integer NOT NULL,
    `team_1_id` integer NOT NULL REFERENCES `teams`(`id`),
    `team_2_id` integer REFERENCES `teams`(`id`),
    `scheduled_at` text,
    `status` text DEFAULT 'upcoming' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `matches_event_match_number_unique` ON `matches` (`event_id`, `match_number`);
--> statement-breakpoint
CREATE TABLE `scoresheets` (
    `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    `event_id` integer NOT NULL REFERENCES `events`(`id`),
    `team_id` integer NOT NULL REFERENCES `teams`(`id`),
    `match_number` integer NOT NULL,
    `table_number` integer NOT NULL,
    `m01_young_forest` integer NOT NULL,
    `m01_grand_tree` integer NOT NULL,
    `m01_hollow_tree` integer NOT NULL,
    `m01_queen_knocked_down` integer NOT NULL,
    `m02_base` integer NOT NULL,
    `m02_canopy` integer NOT NULL,
    `m03_waterfall` integer NOT NULL,
    `m04_nest` integer NOT NULL,
    `m04_hollow` integer NOT NULL,
    `m05_haven` integer NOT NULL,
    `lu_added` integer NOT NULL,
    `lu_contained` integer NOT NULL,
    `interference` integer NOT NULL,
    `gp` integer NOT NULL,
    `total_score` integer NOT NULL,
    `submitted_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `scoresheets_event_team_match_unique` ON `scoresheets` (`event_id`, `team_id`, `match_number`);
