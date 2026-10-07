import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://www.bluufun.com"
  ).replace(/\/$/, "");

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/dashboard/",
        "/activity/",
        "/verification/",
        "/onboarding/",
        "/upload-gallery/",
        "/api/",
      ],
    },

    sitemap: `${siteUrl}/sitemap.xml`,
  };
        }
