CREATE TABLE `images_table` (
	`id` text PRIMARY KEY NOT NULL,
	`filename` text NOT NULL,
	`mimetype` text NOT NULL,
	`data` text NOT NULL,
	`createdAt` integer DEFAULT 1745760976 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `notes_table` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`path` text DEFAULT '/' NOT NULL,
	`content` text NOT NULL
);
