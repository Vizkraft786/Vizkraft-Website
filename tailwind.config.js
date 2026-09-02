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
      colors: {
        bone: "#F2F0EA",
        clay: "#D9D7D0",
        ink: "#131313",
        stone: "#7A7A75",
        acid: "#DCF264",
        // Kept as aliases so existing markup that references them still
        // resolves; both now sit in the neutral family.
        ember: "#DCF264",
        manila: "#D9D7D0",
        manilaDeep: "#B8B6AE",
        sheet: "#F2F0EA",
      },
      fontFamily: {
        display: ["var(--font-display)", "Helvetica Neue", "Arial", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        brand: "0.42em",
        wide2: "0.18em",
      },
    },
  },
  plugins: [],
};
