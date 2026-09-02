import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * The Tailwind config path is passed explicitly.
 *
 * PostCSS resolves plugin config by searching upward from process.cwd(), and
 * the dev server is started as `next dev "<project dir>"` from the parent
 * folder — so cwd is NOT this directory and auto-discovery silently finds
 * nothing, leaving Tailwind with an empty content list and zero utilities.
 *
 * @type {import('postcss-load-config').Config}
 */
const config = {
  plugins: {
    tailwindcss: { config: path.join(__dirname, "tailwind.config.js") },
    autoprefixer: {},
  },
};

export default config;
