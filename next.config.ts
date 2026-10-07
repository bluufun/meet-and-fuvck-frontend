import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/dwzznea6l/**",
      },
    ],
  },

  // Social crawlers and link-preview validators need metadata
  // in the initial HTML response.
  htmlLimitedBots: /.*/,

  async headers() {
    return [
      {
        source: "/bluufun.png",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
          {
            key: "Content-Type",
            value: "image/jpeg",
          },
        ],
      }, 
    ];
  },
};

export default nextConfig;
