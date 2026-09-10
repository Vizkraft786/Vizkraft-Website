const path = require("path");

/**
 * Content globs are anchored to __dirname on purpose.
 *
 * The dev server is launched as `next dev "<project dir>"` from the parent
 * folder, so process.cwd() is NOT the project root. Relative globs like
 * "./app/**" resolve against the wrong directory and Tailwind emits no
 * utilities at all.
 *
 * @type {import('tailwindcss').Config}
 */
module.exports = {
  content: [
    path.join(__dirname, "app/**/*.{js,ts,jsx,tsx,mdx}"),
    path.join(__dirname, "components/**/*.{js,ts,jsx,tsx,mdx}"),
    path.join(__dirname, "lib/**/*.{js,ts,jsx,tsx,mdx}"),
  ],
  theme: {
    extend: {
      /**
       * Palette lifted from the two reference sites: warm off-white ground,
       * near-black, neutral greys, and a single acid-lime accent carrying all
       * the emphasis. Replaces the previous warm/earthy scheme — the old
       * `ember` copper is now `acid`, and the manila folder tones are pulled
       * into the same neutral family so the Projects rail stops reading warm
       * against a cold palette.
       */
      /**
       * Exactly three colors on the whole page — Pantone Black C, a warm
       * off-white ("White Sand"), and a cooler near-white. Every other token
       * below is an alias onto one of these three, kept only so existing
       * markup (bone/stone/acid/manila/sheet...) still resolves without
       * touching every component; none of them introduces a fourth hue.
       *
       * Role split: black is the ground and the only text color on light
       * surfaces; white is primary text on dark; white-sand is secondary/
       * muted text on dark AND the paper color for light surfaces (drawer
       * faces, scatter plates) — so it does double duty rather than needing
       * its own near-white shade.
       */
      colors: {
        black3: "#1D1D1B",
        whiteSand: "#E7E7DD",
        white3: "#FFFFF7",

        ink: "#1D1D1B", // ground + text-on-light
        bone: "#FFFFF7", // primary text on dark
        stone: "#E7E7DD", // secondary text on dark
        clay: "#E7E7DD",
        // No accent color remains — both resolve to the muted third tone
        // rather than a fourth hue.
        acid: "#E7E7DD",
        ember: "#E7E7DD",
        manila: "#E7E7DD", // paper surfaces (drawer face/tab)
        manilaDeep: "#E7E7DD",
        sheet: "#FFFFF7", // scatter plates — the brighter of the two lights
      },
      fontFamily: {
        // The Seasons, then Gotham. The Seasons only covers the characters
        // in its unicode-range in layout.tsx; anything else in a
        // heading — "@", "+", "&", "4" — is drawn by Gotham Thin next in line.
        // Georgia is the closest widely-installed serif if both fail to load.
        display: ["var(--font-display)", "var(--font-sans)", "Georgia", "Times New Roman", "serif"],
        // Gotham Thin. Fallbacks are geometric-ish sans faces so a failure
        // does not land body copy on a serif.
        sans: ["var(--font-sans)", "Helvetica Neue", "Arial", "sans-serif"],
      },
      /**
       * Reduced from 0.42em/0.18em to match the font-reference site's label
       * treatment — its nav links and section eyebrows ("HOW WE WORK", "OUR
       * TEAM") sit close, subtly opened, never the wide luxury spacing these
       * tokens previously used. Site-wide tokens, so this corrects every
       * micro-label (nav, eyebrow, footer, section labels) in one place
       * rather than needing per-component fixes.
       */
      letterSpacing: {
        brand: "0.12em",
        wide2: "0.08em",
      },
    },
  },
  plugins: [],
};
