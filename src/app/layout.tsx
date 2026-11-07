import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Ceylon Ride Co. — Bike, Scooter & Tuk-Tuk Rental in Nuwara Eliya",
    template: "%s · Ceylon Ride Co.",
  },
  description:
    "Rent scooters, motorbikes, tuk-tuks and SUVs in Nuwara Eliya, Sri Lanka's tea country. Free hotel delivery, hill-country roadside assist, permits sorted. Rent. Ride. Roam.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="grain bg-ink font-body text-mist antialiased">{children}</body>
    </html>
  );
}
