import {
  mysqlTable,
  text,
  int,
  bigint,
  varchar,
  boolean,
  timestamp,
  date,
  json,
  index,
  uniqueIndex,
} from "drizzle-orm/mysql-core";

/* ---------------------------------- Bikes --------------------------------- */

export const bikeCategories = [
  "scooter",
  "motorbike",
  "tuktuk",
  "car",
] as const;
export type BikeCategory = (typeof bikeCategories)[number];

export const bikes = mysqlTable(
  "bikes",
  {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
    name: varchar("name", { length: 191 }).notNull(),
    slug: varchar("slug", { length: 191 }).notNull(),
    category: varchar("category", { length: 32 }).notNull().default("scooter"),
    tagline: text("tagline").notNull(),
    description: text("description").notNull(),
    engineCc: int("engine_cc").notNull().default(125),
    transmission: varchar("transmission", { length: 64 }).notNull().default("Automatic"),
    seats: int("seats").notNull().default(2),
    luggage: varchar("luggage", { length: 128 }).notNull().default("Under-seat storage"),
    pricePerDay: int("price_per_day").notNull().default(10), // USD / day
    deposit: int("deposit").notNull().default(100),
    features: json("features").$type<string[]>().notNull(),
    imageUrl: varchar("image_url", { length: 500 }).notNull(),
    status: varchar("status", { length: 32 }).notNull().default("available"), // available | maintenance | retired
    featured: boolean("featured").notNull().default(false),
    sortOrder: int("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("bikes_slug_idx").on(t.slug)],
);

/* -------------------------------- Bookings -------------------------------- */

export const bookingStatuses = [
  "pending",
  "confirmed",
  "active",
  "completed",
  "cancelled",
] as const;
export type BookingStatus = (typeof bookingStatuses)[number];

export const bookings = mysqlTable(
  "bookings",
  {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
    reference: varchar("reference", { length: 32 }).notNull(),
    bikeId: bigint("bike_id", { mode: "number", unsigned: true })
      .notNull()
      .references(() => bikes.id, { onDelete: "cascade" }),
    customerName: varchar("customer_name", { length: 128 }).notNull(),
    email: varchar("email", { length: 191 }).notNull(),
    phone: varchar("phone", { length: 48 }).notNull(),
    pickupDate: date("pickup_date", { mode: "string" }).notNull(),
    returnDate: date("return_date", { mode: "string" }).notNull(),
    pickupLocation: varchar("pickup_location", { length: 128 }).notNull().default("Nuwara Eliya Town (HQ)"),
    licenseCountry: varchar("license_country", { length: 80 }).notNull().default(""),
    partySize: int("party_size").notNull().default(1),
    message: text("message").notNull(),
    totalDays: int("total_days").notNull(),
    totalPrice: int("total_price").notNull(),
    status: varchar("status", { length: 32 }).notNull().default("pending"),
    // Admin notification (fired when the booking is created)
    whatsappStatus: varchar("whatsapp_status", { length: 32 }).notNull().default("pending"),
    whatsappMessageId: varchar("whatsapp_message_id", { length: 255 }).notNull().default(""),
    whatsappError: varchar("whatsapp_error", { length: 500 }).notNull().default(""),
    whatsappSentAt: timestamp("whatsapp_sent_at", { mode: "date" }),
    // Customer notification (fired when the admin confirms or declines)
    customerWhatsappStatus: varchar("customer_whatsapp_status", { length: 32 }).notNull().default("pending"),
    customerWhatsappMessageId: varchar("customer_whatsapp_message_id", { length: 255 }).notNull().default(""),
    customerWhatsappError: varchar("customer_whatsapp_error", { length: 500 }).notNull().default(""),
    customerNotifiedDecision: varchar("customer_notified_decision", { length: 32 }).notNull().default(""),
    customerWhatsappSentAt: timestamp("customer_whatsapp_sent_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("bookings_reference_idx").on(t.reference),
    index("bookings_bike_idx").on(t.bikeId),
    index("bookings_status_idx").on(t.status),
  ],
);

/* ------------------------------- Testimonials ------------------------------ */

export const testimonials = mysqlTable("testimonials", {
  id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  country: varchar("country", { length: 128 }).notNull(),
  rating: int("rating").notNull().default(5),
  content: text("content").notNull(),
  bikeName: varchar("bike_name", { length: 128 }).notNull(),
  approved: boolean("approved").notNull().default(false),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

/* ---------------------------------- Blog ----------------------------------- */

export const blogPosts = mysqlTable(
  "blog_posts",
  {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 191 }).notNull(),
    excerpt: text("excerpt").notNull(),
    content: text("content").notNull(),
    coverImage: varchar("cover_image", { length: 500 }).notNull(),
    author: varchar("author", { length: 128 }).notNull().default("Ceylon Ride Crew"),
    category: varchar("category", { length: 64 }).notNull().default("Routes"),
    tags: json("tags").$type<string[]>().notNull(),
    readMinutes: int("read_minutes").notNull().default(4),
    published: boolean("published").notNull().default(false),
    featured: boolean("featured").notNull().default(false),
    publishedAt: timestamp("published_at", { mode: "date" }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("blog_posts_slug_idx").on(t.slug)],
);

/* ------------------------------- Site settings ----------------------------- */

export const siteSettings = mysqlTable("site_settings", {
  key: varchar("key", { length: 128 }).primaryKey(),
  value: json("value").$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

/* --------------------------------- Admin ----------------------------------- */

export const adminUsers = mysqlTable(
  "admin_users",
  {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
    email: varchar("email", { length: 191 }).notNull(),
    name: varchar("name", { length: 128 }).notNull().default("Admin"),
    passwordHash: text("password_hash").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("admin_users_email_idx").on(t.email)],
);

export const adminSessions = mysqlTable(
  "admin_sessions",
  {
    token: varchar("token", { length: 128 }).primaryKey(),
    userId: bigint("user_id", { mode: "number", unsigned: true })
      .notNull()
      .references(() => adminUsers.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [index("admin_sessions_user_idx").on(t.userId)],
);

/* ---------------------------------- Types ---------------------------------- */

export type Bike = typeof bikes.$inferSelect;
export type NewBike = typeof bikes.$inferInsert;
export type Booking = typeof bookings.$inferSelect;
export type Testimonial = typeof testimonials.$inferSelect;
export type BlogPost = typeof blogPosts.$inferSelect;
export type AdminUser = typeof adminUsers.$inferSelect;
