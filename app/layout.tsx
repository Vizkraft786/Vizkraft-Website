import type { Metadata } from "next";
import Script from "next/script";
import localFont from "next/font/local";
import "./globals.css";
import { site } from "@/lib/site-config";

/**
 * TWO families site-wide: The Seasons for every heading and subheading,
 * Gotham for every piece of body text.
 *
 * They are wired to --font-display and --font-sans rather than to variables
 * of their own, because those two are what the whole codebase already
 * consumes. Swapping what they point at converts the site in one move and
 * leaves Inter and Montserrat with no consumers.
 *
 * ⚠ LICENSING — BOTH FILES ARE BLOCKED FOR PRODUCTION.
 *
 * They are wired here so the design can be evaluated locally, which is what a
 * demo font is for, but neither may ship:
 *
 * - The Seasons: the supplied files are `Fontspring-DEMO-*`. Fontspring demo
 *   licences cover evaluation and mockups only and exclude web embedding.
 *   They are also subset (~14 KB each against a typical 150 KB+), and 28
 *   characters — among them 4, &, - and @ — are a "DEMO" watermark glyph
 *   rather than a letter. The display font below is restricted to the clean
 *   characters, so those, and the missing curly apostrophe U+2019, are drawn
 *   in Gotham Thin instead. A purchased licence resolves all of it.
 * - Gotham: the archive ships a readme from Fontsgeek, a piracy site. Gotham
 *   is Hoefler & Co. and is actively enforced. Glyph coverage measured
 *   complete. Only the Thin (100) weight was supplied, which is the whole
 *   reason body copy now sits at weight 100 — there is no Book or Medium to
 *   fall back to, so anything needing more substance has nowhere to go.
 *
 * Replace both with purchased webfont licences before launch. Nothing outside
 * this block has to change.
 */
/**
 * Characters The Seasons is allowed to draw.
 *
 * The demo files replace 28 characters with a "DEMO" watermark glyph, in all
 * three weights: ! " # $ % & ' ( ) * + - / 4 < = > @ [ \ ] ^ _ ` { | } ~
 * (found by rendering every character and matching it against the stamp —
 * note the digit 4, the hyphen and the ampersand are among them). This range
 * lists only characters verified clean, so the browser never asks the demo
 * font for anything else: the stamped characters, and anything untested,
 * fall through to Gotham Thin instead of showing the watermark.
 *
 * The range reads: space , . 0-3 5-9 : ; ? A-Z a-z, then a few verified
 * symbols and accented letters (nbsp © ® ° · × è é ñ ü – — ‘ “ ” • … ₹ ™).
 * It is written out as a plain string inside the call because next/font reads
 * its options at build time and rejects variables.
 *
 * Once the licensed font is installed, delete the `declarations` option below
 * so The Seasons draws every character again.
 */
const display = localFont({
  src: [
    { path: "./fonts/theseasons-light.otf", weight: "300", style: "normal" },
    { path: "./fonts/theseasons-regular.otf", weight: "400", style: "normal" },
    { path: "./fonts/theseasons-bold.otf", weight: "700", style: "normal" },
  ],
  variable: "--font-display",
  display: "swap",
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+0020, U+002C, U+002E, U+0030-0033, U+0035-003B, U+003F, U+0041-005A, U+0061-007A, U+00A0, U+00A9, U+00AE, U+00B0, U+00B7, U+00D7, U+00E8-00E9, U+00F1, U+00FC, U+2013-2014, U+2018, U+201C-201D, U+2022, U+2026, U+20B9, U+2122",
    },
  ],
  // No generated fallback face: the next font in the display stack must be
  // Gotham (tailwind.config.js), so the excluded characters are drawn in
  // Gotham Thin. A generated fallback would sit in between and catch them.
  adjustFontFallback: false,
});

const sans = localFont({
  src: [{ path: "./fonts/gotham-thin.otf", weight: "100", style: "normal" }],
  variable: "--font-sans",
  display: "swap",
});

const title = `${site.name} — ${site.discipline} Studio, Pune`;

/**
 * Search and share metadata. The favicon, Apple touch icon and share image are
 * not listed here: Next picks them up from app/icon.png, app/apple-icon.png,
 * app/favicon.ico and app/opengraph-image.jpg by file name.
 *
 * metadataBase turns every relative URL below (canonical, og:url, the share
 * image) into an absolute https://vizkraft.in one, which is what crawlers and
 * WhatsApp/Instagram previews require.
 */
export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title,
  description: site.description,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: site.name,
    locale: "en_IN",
    title,
    description: site.description,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description: site.description,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body>
        {/*
          Must run before the browser's own native scroll restoration does,
          which is why this is beforeInteractive rather than a useEffect in
          SmoothScroll — an effect only fires after mount/paint, by which
          point the browser may already have restored a remembered scroll
          position and painted one visible frame of it (the exact bug this
          fixes: the hero loading shifted/cropped until scrolled once).
          beforeInteractive injects into the initial HTML and runs ahead of
          hydration, early enough to actually pre-empt that restoration.
        */}
        <Script id="scroll-restoration-off" strategy="beforeInteractive">
          {`try { history.scrollRestoration = "manual"; } catch (e) {}`}
        </Script>
        {children}
      </body>
    </html>
  );
}
