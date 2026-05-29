# Dialect: sqlite
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`google_id` text UNIQUE,
	`email` text NOT NULL UNIQUE,
	`is_admin` numeric DEFAULT FALSE NOT NULL,
	`token_version` integer DEFAULT 1 NOT NULL
);
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL UNIQUE,
	`user_id` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`is_handwritten` numeric DEFAULT TRUE NOT NULL,
	`latitude` real NOT NULL,
	`longitude` real NOT NULL,
	`sources` text DEFAULT '' NOT NULL,
	`locale` text(10) NOT NULL,
	`year_start` integer NOT NULL,
	`year_end` integer NOT NULL,
	`type` text(32) NOT NULL,
	CONSTRAINT `belongs_to_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
);
CREATE TABLE `project_images` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`storage_key` text NOT NULL,
	`page_sequence` integer NOT NULL,
	`page_name` text,
	`height` integer NOT NULL,
	`width` integer NOT NULL,
	`created_at` integer DEFAULT unixepoch() NOT NULL,
	`blurhash` text NOT NULL,
	CONSTRAINT `belongs_to_project` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE
);