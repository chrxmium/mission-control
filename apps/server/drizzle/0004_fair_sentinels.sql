CREATE TABLE `matches` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`match_number` integer NOT NULL,
	`team_id` integer NOT NULL,
	`scheduled_at` text,
	`status` text DEFAULT 'upcoming' NOT NULL,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `matches_match_team_unique` ON `matches` (`match_number`,`team_id`);