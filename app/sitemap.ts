import type { MetadataRoute } from "next";
import { site } from "@/lib/site-config";

// Generated once at build time, so it also works under a static export.
export const dynamic = "force-static";

/**
 * Served at /sitemap.xml. One entry: the site is a single page, and the
 * #work / #team / #contact anchors are sections of it, not separate URLs.
 * Add a line here for every real page added later.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: site.url,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
