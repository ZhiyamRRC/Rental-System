"use client";

import { useState } from "react";
import { Quote, Send, Star } from "lucide-react";
import type { Testimonial } from "@/db/schema";
import { Reveal } from "@/components/site/reveal";

function Stars({ n }: { n: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`size-3.5 ${i < n ? "fill-amber text-amber" : "text-line"}`} />
      ))}
    </div>
  );
}

export function Reviews({ testimonials }: { testimonials: Testimonial[] }) {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    setState("sending");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      setState("done");
      form.reset();
    } catch {
      setState("error");
    }
  }

  return (
    <section id="reviews" className="scroll-mt-28 border-y border-line bg-carbon py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-hand text-2xl text-ember">road stories</p>
              <h2 className="mt-2 font-display text-4xl font-bold tracking-tight sm:text-6xl">
                RIDERS <span className="text-outline">TALK</span>
              </h2>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-line bg-graphite px-5 py-3">
              <Stars n={5} />
              <p className="text-sm text-smoke">
                <span className="font-display font-bold text-mist">4.9 / 5</span> from 2,300+ riders
              </p>
            </div>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {testimonials.map((t, i) => (
            <Reveal key={t.id} delay={i * 0.1} className={i % 2 === 1 ? "lg:translate-y-6" : ""}>
              <figure className="flex h-full flex-col rounded-3xl border border-line bg-graphite p-6 transition-colors duration-500 hover:border-ember/40">
                <Quote className="size-6 fill-ember/20 text-ember" />
                <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-mist/85">
                  “{t.content}”
                </blockquote>
                <figcaption className="mt-5 border-t border-line pt-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-display text-sm font-bold">{t.name}</p>
                      <p className="text-xs text-smoke">{t.country}</p>
                    </div>
                    <Stars n={t.rating} />
                  </div>
                  {t.bikeName && (
                    <p className="mt-2 inline-block rounded-full bg-ink px-2.5 py-1 text-[10px] font-bold tracking-wider text-ember uppercase">
                      rode the {t.bikeName}
                    </p>
                  )}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>

        {/* review form */}
        <Reveal delay={0.15}>
          <div className="mt-16 overflow-hidden rounded-3xl border border-line bg-graphite">
            <div className="grid lg:grid-cols-[1fr_1.6fr]">
              <div className="border-b border-line bg-ember p-8 text-ink lg:border-r lg:border-b-0">
                <h3 className="font-display text-2xl font-bold tracking-tight">SHARE YOUR RIDE STORY</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink/75">
                  Took one of our rides somewhere worth talking about? Drop a few lines — your story goes
                  live after a quick check from the crew.
                </p>
                <p className="mt-6 rotate-[-2deg] font-hand text-2xl">we read every single one</p>
              </div>
              {state === "done" ? (
                <div className="flex flex-col items-center justify-center gap-3 p-10 text-center">
                  <span className="grid size-14 place-items-center rounded-full bg-ember/15 text-ember">
                    <Send className="size-6" />
                  </span>
                  <p className="font-display text-xl font-bold">Thanks, legend!</p>
                  <p className="max-w-sm text-sm text-smoke">
                    Your review is in the queue. Once the crew approves it, it joins the wall above.
                  </p>
                </div>
              ) : (
                <form onSubmit={submit} className="grid gap-3 p-6 sm:grid-cols-2 sm:p-8">
                  <input
                    name="name"
                    required
                    placeholder="Your name"
                    className="rounded-xl border border-line bg-ink/60 px-4 py-3 text-sm outline-none placeholder:text-smoke focus:border-ember"
                  />
                  <input
                    name="country"
                    required
                    placeholder="Country"
                    className="rounded-xl border border-line bg-ink/60 px-4 py-3 text-sm outline-none placeholder:text-smoke focus:border-ember"
                  />
                  <input
                    name="bikeName"
                    placeholder="Which ride? (optional)"
                    className="rounded-xl border border-line bg-ink/60 px-4 py-3 text-sm outline-none placeholder:text-smoke focus:border-ember"
                  />
                  <select
                    name="rating"
                    defaultValue="5"
                    className="dark-controls rounded-xl border border-line bg-ink/60 px-4 py-3 text-sm outline-none focus:border-ember"
                  >
                    {[5, 4, 3, 2, 1].map((r) => (
                      <option key={r} value={r}>
                        {r} star{r > 1 ? "s" : ""}
                      </option>
                    ))}
                  </select>
                  <textarea
                    name="content"
                    required
                    rows={3}
                    placeholder="How was the ride?"
                    className="rounded-xl border border-line bg-ink/60 px-4 py-3 text-sm outline-none placeholder:text-smoke focus:border-ember sm:col-span-2"
                  />
                  <div className="flex items-center justify-between gap-4 sm:col-span-2">
                    <p className={`text-xs ${state === "error" ? "text-ember" : "text-smoke"}`}>
                      {state === "error" ? "Something broke — try again." : "No spam, ever. Stories publish after approval."}
                    </p>
                    <button
                      type="submit"
                      disabled={state === "sending"}
                      className="flex items-center gap-2 rounded-full bg-ember px-6 py-3 font-display text-xs font-bold tracking-[0.14em] text-ink uppercase transition-colors hover:bg-amber disabled:opacity-60"
                    >
                      {state === "sending" ? "Sending…" : "Post review"} <Send className="size-3.5" />
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
