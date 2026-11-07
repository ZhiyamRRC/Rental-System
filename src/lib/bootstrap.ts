import { pool } from "@/db";
import { seedIfEmpty } from "@/lib/seed";

/**
 * Bulletproof bootstrap for sandbox environments: creates the schema if the
 * platform wiped/recreated the database, then seeds missing data.
 * Safe to call on every request — all statements are idempotent.
 */
/**
 * MySQL / MariaDB DDL. Table statements are idempotent (IF NOT EXISTS);
 * secondary indexes use MariaDB's CREATE INDEX IF NOT EXISTS.
 */
const DDL = `
CREATE TABLE IF NOT EXISTS bikes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT UNIQUE PRIMARY KEY,
  name varchar(191) NOT NULL,
  slug varchar(191) NOT NULL,
  category varchar(32) NOT NULL DEFAULT 'scooter',
  tagline text NOT NULL,
  description text NOT NULL,
  engine_cc int NOT NULL DEFAULT 125,
  transmission varchar(64) NOT NULL DEFAULT 'Automatic',
  seats int NOT NULL DEFAULT 2,
  luggage varchar(128) NOT NULL DEFAULT 'Under-seat storage',
  price_per_day int NOT NULL DEFAULT 10,
  deposit int NOT NULL DEFAULT 100,
  features json NOT NULL,
  image_url varchar(500) NOT NULL,
  status varchar(32) NOT NULL DEFAULT 'available',
  featured boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS bikes_slug_idx ON bikes (slug);

CREATE TABLE IF NOT EXISTS bookings (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT UNIQUE PRIMARY KEY,
  reference varchar(32) NOT NULL,
  bike_id BIGINT UNSIGNED NOT NULL,
  customer_name varchar(128) NOT NULL,
  email varchar(191) NOT NULL,
  phone varchar(48) NOT NULL,
  pickup_date date NOT NULL,
  return_date date NOT NULL,
  pickup_location varchar(128) NOT NULL DEFAULT 'Nuwara Eliya Town (HQ)',
  license_country varchar(80) NOT NULL DEFAULT '',
  party_size int NOT NULL DEFAULT 1,
  message text NOT NULL,
  total_days int NOT NULL,
  total_price int NOT NULL,
  status varchar(32) NOT NULL DEFAULT 'pending',
  whatsapp_status varchar(32) NOT NULL DEFAULT 'pending',
  whatsapp_message_id varchar(255) NOT NULL DEFAULT '',
  whatsapp_error varchar(500) NOT NULL DEFAULT '',
  whatsapp_sent_at timestamp NULL,
  customer_whatsapp_status varchar(32) NOT NULL DEFAULT 'pending',
  customer_whatsapp_message_id varchar(255) NOT NULL DEFAULT '',
  customer_whatsapp_error varchar(500) NOT NULL DEFAULT '',
  customer_notified_decision varchar(32) NOT NULL DEFAULT '',
  customer_whatsapp_sent_at timestamp NULL,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT bookings_bike_id_fk FOREIGN KEY (bike_id) REFERENCES bikes(id) ON DELETE cascade
);
CREATE UNIQUE INDEX IF NOT EXISTS bookings_reference_idx ON bookings (reference);
CREATE INDEX IF NOT EXISTS bookings_bike_idx ON bookings (bike_id);
CREATE INDEX IF NOT EXISTS bookings_status_idx ON bookings (status);

CREATE TABLE IF NOT EXISTS testimonials (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT UNIQUE PRIMARY KEY,
  name varchar(128) NOT NULL,
  country varchar(128) NOT NULL,
  rating int NOT NULL DEFAULT 5,
  content text NOT NULL,
  bike_name varchar(128) NOT NULL,
  approved boolean NOT NULL DEFAULT false,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS blog_posts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT UNIQUE PRIMARY KEY,
  title varchar(255) NOT NULL,
  slug varchar(191) NOT NULL,
  excerpt text NOT NULL,
  content text NOT NULL,
  cover_image varchar(500) NOT NULL,
  author varchar(128) NOT NULL DEFAULT 'Ceylon Ride Crew',
  category varchar(64) NOT NULL DEFAULT 'Routes',
  tags json NOT NULL,
  read_minutes int NOT NULL DEFAULT 4,
  published boolean NOT NULL DEFAULT false,
  featured boolean NOT NULL DEFAULT false,
  published_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS blog_posts_slug_idx ON blog_posts (slug);

CREATE TABLE IF NOT EXISTS site_settings (
  \`key\` varchar(128) PRIMARY KEY,
  value json NOT NULL,
  updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT UNIQUE PRIMARY KEY,
  email varchar(191) NOT NULL,
  name varchar(128) NOT NULL DEFAULT 'Admin',
  password_hash text NOT NULL,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS admin_users_email_idx ON admin_users (email);

CREATE TABLE IF NOT EXISTS admin_sessions (
  token varchar(128) PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  expires_at timestamp NOT NULL,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT admin_sessions_user_id_fk FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE cascade
);
CREATE INDEX IF NOT EXISTS admin_sessions_user_idx ON admin_sessions (user_id);
`;

let lastRun = 0;

export async function ensureDatabase() {
  // throttle: at most once every 30s per server process
  if (Date.now() - lastRun < 30_000) return;
  await pool.query(DDL);
  await seedIfEmpty();
  lastRun = Date.now();
}
