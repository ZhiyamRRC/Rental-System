CREATE TABLE `admin_sessions` (
	`token` varchar(128) NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`expires_at` timestamp NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `admin_sessions_token` PRIMARY KEY(`token`)
);
--> statement-breakpoint
CREATE TABLE `admin_users` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`email` varchar(191) NOT NULL,
	`name` varchar(128) NOT NULL DEFAULT 'Admin',
	`password_hash` text NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `admin_users_id` PRIMARY KEY(`id`),
	CONSTRAINT `admin_users_email_idx` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `bikes` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(191) NOT NULL,
	`slug` varchar(191) NOT NULL,
	`category` varchar(32) NOT NULL DEFAULT 'scooter',
	`tagline` text NOT NULL,
	`description` text NOT NULL,
	`engine_cc` int NOT NULL DEFAULT 125,
	`transmission` varchar(64) NOT NULL DEFAULT 'Automatic',
	`seats` int NOT NULL DEFAULT 2,
	`luggage` varchar(128) NOT NULL DEFAULT 'Under-seat storage',
	`price_per_day` int NOT NULL DEFAULT 10,
	`deposit` int NOT NULL DEFAULT 100,
	`features` json NOT NULL,
	`image_url` varchar(500) NOT NULL,
	`status` varchar(32) NOT NULL DEFAULT 'available',
	`featured` boolean NOT NULL DEFAULT false,
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bikes_id` PRIMARY KEY(`id`),
	CONSTRAINT `bikes_slug_idx` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `blog_posts` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`slug` varchar(191) NOT NULL,
	`excerpt` text NOT NULL,
	`content` text NOT NULL,
	`cover_image` varchar(500) NOT NULL,
	`author` varchar(128) NOT NULL DEFAULT 'Ceylon Ride Crew',
	`category` varchar(64) NOT NULL DEFAULT 'Routes',
	`tags` json NOT NULL,
	`read_minutes` int NOT NULL DEFAULT 4,
	`published` boolean NOT NULL DEFAULT false,
	`featured` boolean NOT NULL DEFAULT false,
	`published_at` timestamp NOT NULL DEFAULT (now()),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `blog_posts_id` PRIMARY KEY(`id`),
	CONSTRAINT `blog_posts_slug_idx` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `bookings` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`reference` varchar(32) NOT NULL,
	`bike_id` bigint unsigned NOT NULL,
	`customer_name` varchar(128) NOT NULL,
	`email` varchar(191) NOT NULL,
	`phone` varchar(48) NOT NULL,
	`pickup_date` date NOT NULL,
	`return_date` date NOT NULL,
	`pickup_location` varchar(128) NOT NULL DEFAULT 'Nuwara Eliya Town (HQ)',
	`license_country` varchar(80) NOT NULL DEFAULT '',
	`party_size` int NOT NULL DEFAULT 1,
	`message` text NOT NULL,
	`total_days` int NOT NULL,
	`total_price` int NOT NULL,
	`status` varchar(32) NOT NULL DEFAULT 'pending',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bookings_id` PRIMARY KEY(`id`),
	CONSTRAINT `bookings_reference_idx` UNIQUE(`reference`)
);
--> statement-breakpoint
CREATE TABLE `site_settings` (
	`key` varchar(128) NOT NULL,
	`value` json NOT NULL,
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `site_settings_key` PRIMARY KEY(`key`)
);
--> statement-breakpoint
CREATE TABLE `testimonials` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`country` varchar(128) NOT NULL,
	`rating` int NOT NULL DEFAULT 5,
	`content` text NOT NULL,
	`bike_name` varchar(128) NOT NULL,
	`approved` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `testimonials_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `admin_sessions` ADD CONSTRAINT `admin_sessions_user_id_admin_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `admin_users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_bike_id_bikes_id_fk` FOREIGN KEY (`bike_id`) REFERENCES `bikes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `admin_sessions_user_idx` ON `admin_sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `bookings_bike_idx` ON `bookings` (`bike_id`);--> statement-breakpoint
CREATE INDEX `bookings_status_idx` ON `bookings` (`status`);