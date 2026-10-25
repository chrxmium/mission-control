CREATE TABLE `referee_matches` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`referee_id` integer NOT NULL,
	`match_id` integer NOT NULL,
	`assigned_at` integer NOT NULL,
	FOREIGN KEY (`referee_id`) REFERENCES `referees`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `referee_matches_referee_match_unique` ON `referee_matches` (`referee_id`,`match_id`);--> statement-breakpoint
ALTER TABLE `referees` ADD `table_number` integer;