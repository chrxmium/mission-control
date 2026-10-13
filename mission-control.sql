PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
				id SERIAL PRIMARY KEY,
				hash text NOT NULL,
				created_at numeric
			);
INSERT INTO __drizzle_migrations VALUES(NULL,'70ec9ce9d1834f2d43cd108d2df1934e7b82efa30c81f61f2cc63123ae5a1230',1791264960548);
INSERT INTO __drizzle_migrations VALUES(NULL,'0d7dd12a4dbfa3022b7ab04089d71cb5d06eeaf6754fb10f6dfea17a6d38d60c',1791267368054);
INSERT INTO __drizzle_migrations VALUES(NULL,'1d86f5cf714b9dd3246b9346efb23cbf46b4c71a3afe602d6905c23915c45654',1791271557012);
INSERT INTO __drizzle_migrations VALUES(NULL,'7889a6c05b6befc880ce9d566d424126df22418e5cd05b6da97f4e970b39539f',1791274425841);
INSERT INTO __drizzle_migrations VALUES(NULL,'6f54a1f9b35ce22f6f49c8c5e9c790a985bccbef227a1db2e6e55ab7b5d32323',1791335181588);
INSERT INTO __drizzle_migrations VALUES(NULL,'86e43b932a716ff40908ed7a4b7de2eeeb06176be680b6885b0836865ae63dfe',1791338859887);
CREATE TABLE `teams` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`number` integer NOT NULL,
	`name` text NOT NULL
);
INSERT INTO teams VALUES(1,54321,'New Team');
INSERT INTO teams VALUES(2,22222,'Auth Team');
CREATE TABLE IF NOT EXISTS "scoresheets" (
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
INSERT INTO scoresheets VALUES(2,1,99,1,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,'2026-10-06T08:41:34.809Z');
INSERT INTO scoresheets VALUES(3,1,100,1,2,3,3,1,1,2,3,1,1,0,5,0,3,4,0,'2026-10-06T22:12:16.287Z');
INSERT INTO scoresheets VALUES(4,1,1,1,3,0,0,0,0,0,0,0,0,5,0,0,0,3,85,'2026-10-08T11:11:40.927Z');
INSERT INTO scoresheets VALUES(5,2,1,1,0,2,0,0,0,0,0,0,0,5,0,0,0,3,65,'2026-10-08T11:11:40.927Z');
INSERT INTO scoresheets VALUES(6,1,2,1,1,1,3,0,0,0,0,0,0,2,0,0,0,3,110,'2026-10-08T11:49:45.252Z');
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
INSERT INTO matches VALUES(1,1,1,2,'2026-10-07T18:30:00+11:00','submitted');
INSERT INTO matches VALUES(2,2,1,NULL,NULL,'submitted');
INSERT INTO sqlite_sequence VALUES('teams',2);
INSERT INTO sqlite_sequence VALUES('scoresheets',6);
INSERT INTO sqlite_sequence VALUES('matches',2);
CREATE UNIQUE INDEX `teams_number_unique` ON `teams` (`number`);
CREATE UNIQUE INDEX `scoresheets_team_match_unique` ON `scoresheets` (`team_id`,`match_number`);
CREATE UNIQUE INDEX `matches_match_number_unique`
    ON `matches` (`match_number`);
COMMIT;
