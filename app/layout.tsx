import type { Metadata } from "next";
import { Archivo, Inter } from "next/font/google";
import "./globals.css";
import { site } from "@/lib/site-config";

/**
 * Archivo for display, Inter for text — both neo-grotesques, matching the
 * reference sites, which use no serif anywhere. Archivo carries the wider,
 * squarer character of the reference headline; Inter matches the neutral
 * Swiss grotesque used for body copy.
 */
const display = Archivo({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-display",
  display: "swap",
});

const sans = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
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
