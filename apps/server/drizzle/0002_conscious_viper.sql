PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_scoresheets` (
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
INSERT INTO `__new_scoresheets`("id", "team_id", "match_number", "table_number", "m01_young_forest", "m01_grand_tree", "m01_hollow_tree", "m01_queen_knocked_down", "m02_base", "m02_canopy", "m03_waterfall", "m04_nest", "m04_hollow", "m05_haven", "lu_added", "lu_contained", "interference", "gp", "total_score", "submitted_at") SELECT "id", "team_id", "match_number", "table_number", "m01_young_forest", "m01_grand_tree", "m01_hollow_tree", "m01_queen_knocked_down", "m02_base", "m02_canopy", "m03_waterfall", "m04_nest", "m04_hollow", "m05_haven", "lu_added", "lu_contained", "interference", "gp", "total_score", "submitted_at" FROM `scoresheets`;--> statement-breakpoint
DROP TABLE `scoresheets`;--> statement-breakpoint
ALTER TABLE `__new_scoresheets` RENAME TO `scoresheets`;--> statement-breakpoint
PRAGMA foreign_keys=ON;