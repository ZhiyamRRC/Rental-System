import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { defaultSettings, type SiteSettings } from "@/lib/settings-types";

export type {
  AnnouncementSettings,
  HeroSettings,
  AboutSettings,
  ContactSettings,
  SocialSettings,
  ImageSettings,
  SiteSettings,
} from "@/lib/settings-types";
export { defaultSettings } from "@/lib/settings-types";

export async function getSettings(): Promise<SiteSettings> {
  try {
    const rows = await db.select().from(siteSettings);
    const map = new Map(rows.map((r) => [r.key, r.value]));
    const merge = <T,>(key: string, fallback: T): T => {
      const v = map.get(key);
      if (!v) return fallback;
      return { ...(fallback as object), ...(v as object) } as T;
    };
    return {
      announcement: merge("announcement", defaultSettings.announcement),
      hero: merge("hero", defaultSettings.hero),
      about: merge("about", defaultSettings.about),
      contact: merge("contact", defaultSettings.contact),
      social: merge("social", defaultSettings.social),
      images: merge("images", defaultSettings.images),
    };
  } catch {
    return defaultSettings;
  }
}
