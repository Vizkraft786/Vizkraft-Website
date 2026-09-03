import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import "./globals.css";
import { site } from "@/lib/site-config";

/**
 * Inter for display/heading/labels, Montserrat for body — matched against a
 * second, more specific font reference (superseding the earlier Anton
 * match).
 *
 * That reference's headline ("WE'RE NOT NEW HERE...") is a bold NEUTRAL
 * grotesque — normal width, tightly set, moderate-heavy (Bold/SemiBold, not
 * Black) — a genuinely different character from Anton's condensed-black
 * density. Its nav links and section labels ("HOW WE WORK", "OUR TEAM") use
 * the same family at lighter weight with restrained, close-set tracking —
 * not the wide luxury spacing this project had been using. Inter is the
 * closest match: neutral, geometric, reads correctly at both display and
 * label sizes without the condensed narrowing Anton has.
 *
 * Body stays Montserrat per explicit instruction — this reference governs
 * heading/subheading only.
 */
const display = Inter({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const sans = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: `${site.name} — ${site.discipline}`,
  description: `${site.tagline}. ${site.discipline} studio based in ${site.location}. ${site.positioning.join(" · ")}.`,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
