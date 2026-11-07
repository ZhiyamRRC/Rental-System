"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Plus } from "lucide-react";
import { Reveal } from "@/components/site/reveal";

const faqs = [
  {
    q: "Do I need an international driving permit (IDP)?",
    a: "Yes — to ride legally in Sri Lanka you need your home license, a 1949-convention IDP, and a local endorsement from the Automobile Association of Ceylon. We arrange the endorsement for $40: send your documents when you book and it's ready at pickup.",
  },
  {
    q: "How does the security deposit work?",
    a: "A refundable deposit ($100–$500 depending on the vehicle) is held in cash or by card imprint at pickup. It's returned in full at drop-off after a 5-minute joint inspection. No surprise deductions — we photograph the vehicle together on both days.",
  },
  {
    q: "What's included in the daily rate?",
    a: "Comprehensive insurance, two helmets, phone holder, unlimited kilometres within your rental period, a full toolkit, and 24/7 roadside assistance anywhere on the island. Fuel is yours — bikes leave with a full tank.",
  },
  {
    q: "Can you deliver the bike, or do one-way drop-offs?",
    a: "Yes — hotel delivery anywhere in Nuwara Eliya town is free, and we meet every train at Nanu Oya station. One-way drop-offs in Kandy or Ella carry a small relocation fee ($25–$60); mention it in the booking notes and we'll confirm.",
  },
  {
    q: "I've never driven a tuk-tuk. Can I still rent one?",
    a: "That's most of our tuk-tuk customers! Every tuk-tuk booking includes a 90-minute driving lesson with our instructor on the quiet lanes behind Gregory Lake. You'll be confidently climbing the tea estates by lunchtime.",
  },
  {
    q: "What happens if the bike breaks down?",
    a: "Call or WhatsApp our rescue line — our crew covers the whole hill country, from Ramboda to Ohiya. Most issues are fixed roadside within the hour; anything longer and we deliver a replacement ride to wherever you're stranded.",
  },
  {
    q: "Isn't Nuwara Eliya cold and rainy for riding?",
    a: "Mornings can dip under 10°C and mist rolls in fast — that's the magic. Every rental includes free rain gear, and we brief you on the day's mist windows so you catch the views before the clouds do.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="mx-auto max-w-4xl scroll-mt-28 px-4 py-24 sm:px-6">
      <Reveal className="text-center">
        <p className="font-hand text-2xl text-ember">before you ask</p>
        <h2 className="mt-2 font-display text-4xl font-bold tracking-tight sm:text-6xl">
          QUICK <span className="text-outline">ANSWERS</span>
        </h2>
      </Reveal>

      <div className="mt-12 space-y-3">
        {faqs.map((f, i) => {
          const isOpen = open === i;
          return (
            <Reveal key={f.q} delay={i * 0.05}>
              <div
                className={`overflow-hidden rounded-2xl border transition-colors duration-300 ${
                  isOpen ? "border-ember/50 bg-graphite" : "border-line bg-carbon hover:border-mist/25"
                }`}
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                >
                  <span className="font-display text-base font-bold tracking-tight sm:text-lg">{f.q}</span>
                  <motion.span
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ duration: 0.3 }}
                    className={`grid size-8 shrink-0 place-items-center rounded-full ${
                      isOpen ? "bg-ember text-ink" : "border border-line text-smoke"
                    }`}
                  >
                    <Plus className="size-4" />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <p className="px-6 pb-6 text-sm leading-relaxed text-mist/70">{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
