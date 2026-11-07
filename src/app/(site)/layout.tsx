import type { ReactNode } from "react";
import { getSettings } from "@/lib/settings";
import { ensureDatabase } from "@/lib/bootstrap";
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { ScrollProgress } from "@/components/effects/scroll-progress";

export default async function SiteLayout({ children }: { children: ReactNode }) {
  try {
    await ensureDatabase();
  } catch (e) {
    console.error("ensureDatabase failed:", e);
  }
  const settings = await getSettings();
  return (
    <>
      <Navbar
        announcement={settings.announcement.enabled ? settings.announcement.text : null}
        phone={settings.contact.phone}
      />
      <ScrollProgress />
      <main>{children}</main>
      <Footer settings={settings} />
    </>
  );
}
