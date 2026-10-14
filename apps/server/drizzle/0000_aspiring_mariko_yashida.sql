CREATE TABLE `matches` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`match_number` integer NOT NULL,
	`team_1_id` integer NOT NULL,
	`team_2_id` integer,
	`scheduled_at` text,
	`status` text DEFAULT 'upcoming' NOT NULL,
	FOREIGN KEY (`team_1_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`team_2_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `matches_match_number_unique` ON `matches` (`match_number`);--> statement-breakpoint
CREATE TABLE `scoresheets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`team_id` integer NOT NULL,
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
	`submitted_at` text NOT NULL,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `scoresheets_team_match_unique` ON `scoresheets` (`team_id`,`match_number`);--> statement-breakpoint
CREATE TABLE `teams` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`number` integer NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `teams_number_unique` ON `teams` (`number`);