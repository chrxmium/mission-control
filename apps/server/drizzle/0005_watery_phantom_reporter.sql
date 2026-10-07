PRAGMA foreign_keys=OFF;--> statement-breakpoint

DROP TABLE `matches`;--> statement-breakpoint

CREATE TABLE `matches` (
                           `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                           `match_number` integer NOT NULL,
                           `team_1_id` integer NOT NULL,
                           `team_2_id` integer,
                           `scheduled_at` text,
                           `status` text DEFAULT 'upcoming' NOT NULL,
                           FOREIGN KEY (`team_1_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE no action,
                           FOREIGN KEY (`team_2_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE no action
);--> statement-breakpoint

CREATE UNIQUE INDEX `matches_match_number_unique`
    ON `matches` (`match_number`);--> statement-breakpoint

PRAGMA foreign_keys=ON;