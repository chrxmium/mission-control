PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_matches` (
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
INSERT INTO `__new_matches`("id", "match_number", "team_1_id", "team_2_id", "scheduled_at", "status") SELECT "id", "match_number", "team_1_id", "team_2_id", "scheduled_at", "status" FROM `matches`;--> statement-breakpoint
DROP TABLE `matches`;--> statement-breakpoint
ALTER TABLE `__new_matches` RENAME TO `matches`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `matches_match_number_unique` ON `matches` (`match_number`);