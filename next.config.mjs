/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  /**
   * Static export for Cloudflare Pages: `next build` writes the finished site
   * to /out as plain HTML, CSS, JS and images, and Pages serves that folder.
   * Nothing is lost — the site uses no server features: no API routes, no
   * next/image optimisation, and robots/sitemap are generated at build time.
   */
  output: "export",
};

export default nextConfig;
