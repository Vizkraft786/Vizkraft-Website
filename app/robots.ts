import type { MetadataRoute } from "next";
import { site } from "@/lib/site-config";

// Generated once at build time, so it also works under a static export.
export const dynamic = "force-static";

/** Served at /robots.txt. The whole site is public; point crawlers at the sitemap. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
