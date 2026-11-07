ALTER TABLE `bookings` ADD `whatsapp_status` varchar(32) DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `bookings` ADD `whatsapp_message_id` varchar(255) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `bookings` ADD `whatsapp_error` varchar(500) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `bookings` ADD `whatsapp_sent_at` timestamp;