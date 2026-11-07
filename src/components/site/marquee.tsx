import { Zap } from "lucide-react";

const items = [
  "SCOOTERS",
  "MOTORBIKES",
  "TUK-TUKS",
  "SUVS",
  "HILL-COUNTRY ASSIST",
  "PERMITS SORTED",
  "NO HIDDEN FEES",
  "HELMETS INCLUDED",
];

export function Marquee({ dark = false }: { dark?: boolean }) {
  const row = [...items, ...items];
  return (
    <div
      className={`relative overflow-hidden border-y py-3.5 select-none ${
        dark ? "border-ink/10 bg-ember text-ink" : "border-line bg-carbon text-mist"
      }`}
    >
      <div className="animate-marquee flex w-max items-center gap-8 whitespace-nowrap">
        {row.map((item, i) => (
          <span key={i} className="flex items-center gap-8 font-display text-sm font-semibold tracking-[0.25em]">
            {item}
            <Zap className="size-4 fill-current" />
          </span>
        ))}
      </div>
    </div>
  );
}
