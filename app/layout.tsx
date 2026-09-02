import type { Metadata } from "next";
import { Mona_Sans } from "next/font/google";
import "./globals.css";
import { site } from "@/lib/site-config";

/**
 * Mona Sans, the same family landonorris.com runs on — a variable grotesque
 * loaded there across the full 200-900 range and carrying ~95% of its text.
 *
 * That site pairs it with Brier for display, which is a commercial licence we
 * don't hold. Rather than substitute a lookalike, the display role is served by
 * Mona Sans at its heavy end with tight negative tracking, which is what a
 * variable font is for and keeps the page on one family.
 */
const mona = Mona_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-mona",
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
    <html lang="en" className={mona.variable}>
      <body>{children}</body>
    </html>
  );
}
