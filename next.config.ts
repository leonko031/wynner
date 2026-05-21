import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    /**
     * Products are user-added — their images can come from any CDN
     * (Shopify, Aliexpress, Amazon, Temu, the user's own store, etc.).
     * Enumerating hosts would crash the dashboard every time a new
     * source appears, so we allow any HTTPS origin.
     *
     * Next 16 still proxies + optimizes the request through its own
     * Image Optimization API — we're not bypassing it, just removing
     * the host allowlist. The proxy itself enforces size/format limits.
     */
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
};

export default nextConfig;
