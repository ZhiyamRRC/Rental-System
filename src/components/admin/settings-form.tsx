"use client";

import { useEffect, useState } from "react";
import { CircleCheck, Image as ImageIcon, KeyRound, Megaphone, Save, Sparkles, User, Phone, Share2 } from "lucide-react";
import { PasswordForm } from "./password-form";
import { ImageField } from "./image-field";
import { defaultSettings, type SiteSettings } from "@/lib/settings-types";
import { AdminButton, PageHeader, adminInput, adminLabel } from "./ui";
import { useAdminApi } from "./admin-auth";
import { apiError } from "./api-utils";

function Section({
  icon: Icon,
  title,
  hint,
  children,
}: {
  icon: React.ElementType;
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-line bg-carbon p-6 sm:p-7">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-ember/15 text-ember">
          <Icon className="size-5" />
        </span>
        <div>
          <h2 className="font-display text-lg font-bold">{title}</h2>
          <p className="text-xs text-smoke">{hint}</p>
        </div>
      </div>
      <div className="mt-6 grid gap-4">{children}</div>
    </section>
  );
}

export function SettingsForm({ initial }: { initial?: SiteSettings }) {
  const api = useAdminApi();

  const [s, setS] = useState<SiteSettings>(() => {
    const base = initial ?? defaultSettings;
    return { ...defaultSettings, ...base, images: { ...defaultSettings.images, ...(base.images ?? {}) } };
  });
  const [loaded, setLoaded] = useState(!!initial);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    api("/api/admin/settings")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((json) => setS(json.settings))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [api]);

  async function save() {
    setState("saving");
    setErrorMessage("");
    const payload = {
      ...s,
      about: {
        ...s.about,
        paragraphs: s.about.paragraphs.map((value) => value.trim()).filter(Boolean),
        bullets: s.about.bullets.map((value) => value.trim()).filter(Boolean),
      },
    };
    try {
      const res = await api("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await apiError(res, `Save failed (HTTP ${res.status}).`));
      const body = (await res.json()) as { settings?: SiteSettings };
      if (body.settings) setS(body.settings);
      setState("saved");
      setTimeout(() => setState("idle"), 2500);
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Could not save settings.");
      setState("error");
    }
  }

  return (
    <div>
      <PageHeader title="Site settings" sub="Everything here updates the live website instantly — no deploys needed.">
        <AdminButton onClick={save} disabled={state === "saving"}>
          {state === "saved" ? (
            <>
              <CircleCheck className="size-4" /> Saved
            </>
          ) : (
            <>
              <Save className="size-4" /> {state === "saving" ? "Saving…" : "Save all changes"}
            </>
          )}
        </AdminButton>
      </PageHeader>

      {state === "error" && (
        <p className="mt-4 rounded-xl border border-ember/50 bg-ember/10 px-4 py-3 text-xs text-ember">
          {errorMessage || "Could not save — please try again."}
        </p>
      )}

      {!loaded && (
        <div className="mt-8 space-y-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-3xl border border-line bg-carbon" />
          ))}
        </div>
      )}

      <div className={`mt-8 space-y-6 ${loaded ? "" : "hidden"}`}>
        <Section icon={Megaphone} title="Announcement bar" hint="The orange strip above the navigation.">
          <label className="flex items-center gap-3 rounded-xl border border-line px-4 py-3">
            <input
              type="checkbox"
              checked={s.announcement.enabled}
              onChange={(e) => setS({ ...s, announcement: { ...s.announcement, enabled: e.target.checked } })}
              className="size-4 accent-ember"
            />
            <span className="text-sm text-mist/80">Show the announcement bar</span>
          </label>
          <label className="block">
            <span className={adminLabel}>Text</span>
            <input
              value={s.announcement.text}
              onChange={(e) => setS({ ...s, announcement: { ...s.announcement, text: e.target.value } })}
              className={adminInput}
            />
          </label>
        </Section>

        <Section icon={Sparkles} title="Hero section" hint="The first thing visitors see on the homepage.">
          <label className="block">
            <span className={adminLabel}>Eyebrow</span>
            <input value={s.hero.eyebrow} onChange={(e) => setS({ ...s, hero: { ...s.hero, eyebrow: e.target.value } })} className={adminInput} />
          </label>
          <div className="grid gap-4 sm:grid-cols-3">
            {(["titleA", "titleB", "titleC"] as const).map((k, i) => (
              <label key={k} className="block">
                <span className={adminLabel}>Headline line {i + 1}</span>
                <input value={s.hero[k]} onChange={(e) => setS({ ...s, hero: { ...s.hero, [k]: e.target.value } })} className={adminInput} />
              </label>
            ))}
          </div>
          <label className="block">
            <span className={adminLabel}>Subtitle</span>
            <textarea rows={3} value={s.hero.subtitle} onChange={(e) => setS({ ...s, hero: { ...s.hero, subtitle: e.target.value } })} className={adminInput} />
          </label>
        </Section>

        <Section icon={User} title="About section" hint="Your story, shown mid-page on the homepage.">
          <label className="block">
            <span className={adminLabel}>Heading</span>
            <input value={s.about.heading} onChange={(e) => setS({ ...s, about: { ...s.about, heading: e.target.value } })} className={adminInput} />
          </label>
          <label className="block">
            <span className={adminLabel}>Paragraphs — one per line</span>
            <textarea
              rows={5}
              value={s.about.paragraphs.join("\n")}
              onChange={(e) => setS({ ...s, about: { ...s.about, paragraphs: e.target.value.split("\n") } })}
              className={adminInput}
            />
          </label>
          <label className="block">
            <span className={adminLabel}>Highlight bullets — one per line (max 8)</span>
            <textarea
              rows={5}
              value={s.about.bullets.join("\n")}
              onChange={(e) => setS({ ...s, about: { ...s.about, bullets: e.target.value.split("\n") } })}
              className={adminInput}
            />
          </label>
        </Section>

        <Section icon={Phone} title="Contact details" hint="Used in the navbar, footer, CTAs and WhatsApp links.">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={adminLabel}>Email</span>
              <input value={s.contact.email} onChange={(e) => setS({ ...s, contact: { ...s.contact, email: e.target.value } })} className={adminInput} />
            </label>
            <label className="block">
              <span className={adminLabel}>Phone</span>
              <input value={s.contact.phone} onChange={(e) => setS({ ...s, contact: { ...s.contact, phone: e.target.value } })} className={adminInput} />
            </label>
            <label className="block">
              <span className={adminLabel}>WhatsApp number</span>
              <input value={s.contact.whatsapp} onChange={(e) => setS({ ...s, contact: { ...s.contact, whatsapp: e.target.value } })} className={adminInput} />
            </label>
            <label className="block">
              <span className={adminLabel}>Opening hours</span>
              <input value={s.contact.hours} onChange={(e) => setS({ ...s, contact: { ...s.contact, hours: e.target.value } })} className={adminInput} />
            </label>
          </div>
          <label className="block">
            <span className={adminLabel}>Address</span>
            <input value={s.contact.address} onChange={(e) => setS({ ...s, contact: { ...s.contact, address: e.target.value } })} className={adminInput} />
          </label>
        </Section>

        <Section
          icon={ImageIcon}
          title="Site images"
          hint="Upload your own photos or paste image URLs — the homepage updates instantly."
        >
          <div className="grid gap-6 sm:grid-cols-2">
            {(
              [
                ["hero", "Homepage hero — big background"],
                ["about", "About section photo"],
                ["permit", "Driving permit section photo"],
                ["cta", "Closing banner background"],
              ] as const
            ).map(([key, label]) => (
              <ImageField
                key={key}
                label={label}
                value={s.images[key]}
                onChange={(url) => setS({ ...s, images: { ...s.images, [key]: url } })}
                required
                hint="Upload an image or paste a custom URL."
              />
            ))}
          </div>
        </Section>

        <Section icon={Share2} title="Social links" hint="Shown as icons in the footer.">
          <div className="grid gap-4">
            {(["instagram", "facebook", "tripadvisor"] as const).map((k) => (
              <label key={k} className="block">
                <span className={adminLabel}>{k}</span>
                <input value={s.social[k]} onChange={(e) => setS({ ...s, social: { ...s.social, [k]: e.target.value } })} className={adminInput} />
              </label>
            ))}
          </div>
        </Section>

        <Section icon={KeyRound} title="Admin credentials" hint="Rotate the password used to open this panel — applies immediately.">
          <PasswordForm />
        </Section>

        <div className="sticky bottom-4 flex justify-end pb-4">
          <AdminButton onClick={save} disabled={state === "saving"} className="shadow-[0_12px_40px_-8px_rgba(255,77,18,0.6)]">
            {state === "saved" ? (
              <>
                <CircleCheck className="size-4" /> Saved
              </>
            ) : (
              <>
                <Save className="size-4" /> {state === "saving" ? "Saving…" : "Save all changes"}
              </>
            )}
          </AdminButton>
        </div>
      </div>
    </div>
  );
}
