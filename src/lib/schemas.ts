import { z } from "zod";

const imageSource = z
  .string()
  .trim()
  .min(1, "Upload an image or enter an image URL.")
  .max(500)
  .refine((value) => value.startsWith("/") || value.startsWith("https://"), {
    message: "Use an uploaded /uploads/ path or an https:// image URL.",
  });

/* Shared Zod schemas for admin mutations. Kept in a lib module because Next.js
   route files may only export HTTP handlers — and webpack route-type checking
   rejects any other exports there. */

export const bikeSchema = z.object({
  name: z.string().trim().min(2).max(120),
  category: z.enum(["scooter", "motorbike", "tuktuk", "car"]),
  tagline: z.string().trim().max(160).default(""),
  description: z.string().trim().max(4000).default(""),
  engineCc: z.coerce.number().int().min(49).max(5000),
  transmission: z.string().trim().min(2).max(60).default("Automatic"),
  seats: z.coerce.number().int().min(1).max(9),
  luggage: z.string().trim().max(120).default(""),
  pricePerDay: z.coerce.number().int().min(1).max(2000),
  deposit: z.coerce.number().int().min(0).max(10000).default(100),
  features: z.array(z.string().trim().min(1).max(80)).max(20).default([]),
  imageUrl: imageSource,
  status: z.enum(["available", "maintenance", "retired"]).default("available"),
  featured: z.boolean().default(false),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
});

export const postSchema = z.object({
  title: z.string().trim().min(3).max(180),
  slug: z.string().trim().max(200).optional(),
  excerpt: z.string().trim().max(400).default(""),
  content: z.string().trim().min(10).max(40000),
  coverImage: imageSource,
  author: z.string().trim().min(2).max(120).default("Ceylon Ride Crew"),
  category: z.string().trim().min(2).max(60).default("Routes"),
  tags: z.array(z.string().trim().min(1).max(40)).max(12).default([]),
  readMinutes: z.coerce.number().int().min(1).max(60).default(4),
  published: z.boolean().default(false),
  featured: z.boolean().default(false),
});

export const testimonialSchema = z.object({
  name: z.string().trim().min(2).max(80),
  country: z.string().trim().min(2).max(80),
  rating: z.coerce.number().int().min(1).max(5),
  content: z.string().trim().min(10).max(800),
  bikeName: z.string().trim().max(120).default(""),
  approved: z.boolean().default(true),
});
