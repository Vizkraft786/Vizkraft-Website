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
       * Palette read directly off landonorris.com's computed styles, not
       * eyeballed. The defining move is the ground: #282C20 is a dark OLIVE,
       * not a neutral black — that green cast under everything is what stops
       * the lime reading as a generic neon-on-black accent.
       */
      colors: {
        bone: "#F4F4ED", // primary text
        clay: "#DDE1D2", // secondary light
        ink: "#282C20", // page ground — dark olive
        char: "#111112", // true near-black, for depth
        surface: "#3B3C38", // raised panels
        surfaceDeep: "#343A26", // olive-tinted panels
        stone: "#B4B8A5", // muted sage text
        stoneDim: "#535450", // dimmest text
        acid: "#D2FF00", // signature lime
        acidDeep: "#B2C73A", // olive-lime, secondary
        // Aliases so existing markup keeps resolving.
        ember: "#D2FF00",
        manila: "#DDE1D2",
        manilaDeep: "#B4B8A5",
        sheet: "#F4F4ED",

        /**
         * v2 palette — the light/lavender direction, kept in its own namespace
         * so /v2 can be explored without disturbing a single v1 token.
         */
        paper: "#E9E9E9",
        card: "#FFFFFF",
        graphite: "#1A1A1A",
        mist: "#8C8C8C",
        lilac: "#A99BE8",
        lilacSoft: "#EDE9FB",
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
