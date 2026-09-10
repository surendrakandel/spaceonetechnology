CREATE TABLE `availability` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`job_id` text,
	`starts_at` text NOT NULL,
	`ends_at` text NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "availability_bounds" CHECK("availability"."ends_at">"availability"."starts_at")
);
--> statement-breakpoint
CREATE INDEX `availability_user_time` ON `availability` (`user_id`,`starts_at`);--> statement-breakpoint
CREATE TABLE `calendar_connections` (
	`user_id` text PRIMARY KEY NOT NULL,
	`refresh_token` text NOT NULL,
	`connected_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`last_synced_at` text,
	`last_error` text DEFAULT '' NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `calendar_links` (
	`interview_id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`event_id` text NOT NULL,
	`etag` text DEFAULT '' NOT NULL,
	`meet_url` text DEFAULT '' NOT NULL,
	`google_url` text DEFAULT '' NOT NULL,
	`last_synced_at` text,
	`last_error` text DEFAULT '' NOT NULL,
	FOREIGN KEY (`interview_id`) REFERENCES `interviews`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `calendar_event_owner` ON `calendar_links` (`user_id`,`event_id`);--> statement-breakpoint
CREATE TABLE `calendar_oauth` (
	`state_hash` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`verifier` text NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
