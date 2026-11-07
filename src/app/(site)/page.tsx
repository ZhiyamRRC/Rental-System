import { asc, desc, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { bikes, blogPosts, testimonials } from "@/db/schema";
import { getSettings } from "@/lib/settings";
import { Hero } from "@/components/home/hero";
import { Marquee } from "@/components/site/marquee";
import { FeaturedFleet } from "@/components/home/featured-fleet";
import { About, CtaBand, Permit, RoutesStrip } from "@/components/home/sections";
import { Reviews } from "@/components/home/reviews";
import { JournalStrip } from "@/components/home/journal-strip";
import { Faq } from "@/components/home/faq";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [settings, fleet, approved, posts] = await Promise.all([
    getSettings(),
    db.select().from(bikes).where(ne(bikes.status, "retired")).orderBy(asc(bikes.sortOrder)),
    db.select().from(testimonials).where(eq(testimonials.approved, true)).orderBy(asc(testimonials.id)).limit(4),
    db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.published, true))
      .orderBy(desc(blogPosts.featured), desc(blogPosts.publishedAt))
      .limit(3),
  ]);

  return (
    <>
      <Hero hero={settings.hero} images={settings.images} />
      <Marquee dark />
      <FeaturedFleet bikes={fleet} />
      <RoutesStrip />
      <Permit images={settings.images} />
      <About settings={settings} />
      <Reviews testimonials={approved} />
      <JournalStrip posts={posts} />
      <Faq />
      <CtaBand whatsapp={settings.contact.whatsapp} images={settings.images} />
    </>
  );
}
