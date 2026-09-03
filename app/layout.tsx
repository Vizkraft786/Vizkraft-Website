import type { Metadata } from "next";
import { Anton, Montserrat } from "next/font/google";
import "./globals.css";
import { site } from "@/lib/site-config";

/**
 * Anton for display, Montserrat for everything else — matched against the
 * client-supplied font reference, not picked by eye.
 *
 * The reference's heading is a heavy CONDENSED geometric grotesque (tight,
 * dense, black-weight, all-caps) — that's a materially different character
 * from Archivo's wide neutral grotesque, which is why this is a real font
 * swap rather than a weight tweak. Anton is the closest match available on
 * Google Fonts: same condensed-black density, same geometric bones.
 *
 * The reference's nav/label typography reads as a clean geometric sans at
 * matching weight to the body copy elsewhere on that reference site — rather
 * than adding a third family for "subheading" specifically, Montserrat
 * covers both roles (uppercase micro-labels at Medium/SemiBold, body copy at
 * Regular), which is also what the client asked for on body text directly.
 * Two families, not three — less visual noise, and Montserrat's own
 * geometric construction is close enough to the reference's label type that
 * splitting it out would add complexity without a visible gain.
 */
const display = Anton({
  subsets: ["latin"],
  weight: ["400"],
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
