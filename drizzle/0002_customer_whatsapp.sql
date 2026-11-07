ALTER TABLE `bookings` ADD `customer_whatsapp_status` varchar(32) DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `bookings` ADD `customer_whatsapp_message_id` varchar(255) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `bookings` ADD `customer_whatsapp_error` varchar(500) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `bookings` ADD `customer_notified_decision` varchar(32) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `bookings` ADD `customer_whatsapp_sent_at` timestamp;