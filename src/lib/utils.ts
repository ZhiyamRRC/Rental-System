import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatUsd(n: number) {
  return `$${n.toLocaleString("en-US")}`;
}

export function daysBetween(a: string, b: string) {
  const ms = new Date(b + "T00:00:00Z").getTime() - new Date(a + "T00:00:00Z").getTime();
  return Math.max(0, Math.round(ms / 86400000));
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function makeReference() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 5; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return `CR-${out}`;
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function formatDate(iso: string) {
  return new Date(iso + "T00:00:00Z").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export const categoryLabel: Record<string, string> = {
  scooter: "Scooter",
  motorbike: "Motorbike",
  tuktuk: "Tuk-Tuk",
  car: "Car & SUV",
};

export const statusLabel: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  active: "Active",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const pickupLocations = [
  "Nuwara Eliya Town (HQ)",
  "Nanu Oya Railway Station",
  "Gregory Lake Front",
  "Hotel delivery — Nuwara Eliya",
] as const;
