const path = require("path");

const djangoBaseUrl = process.env.NEXT_PUBLIC_DJANGO_BASE_URL || "http://localhost:8000";

let djangoHostname = "localhost";
try {
  djangoHostname = new URL(djangoBaseUrl).hostname;
} catch {
  djangoHostname = "localhost";
}

const headerOptions = {
  "Cross-Origin-Embedder-Policy": "require-corp",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
  "Origin-Agent-Cluster": "?1",
  "Referrer-Policy": "no-referrer",
  "Strict-Transport-Security": "max-age=15552000; includeSubDomains",
  "X-Content-Type-Options": "nosniff",
  "X-DNS-Prefetch-Control": "off",
  "X-Download-Options": "noopen",
  "X-Frame-Options": "SAMEORIGIN",
  "X-Permitted-Cross-Domain-Policies": "none",
  "X-XSS-Protection": "0",
};

const securityHeaders = Object.keys(headerOptions).map(key => ({
  key,
  value: headerOptions[key]
}));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  ...(process.env.DOCKER_BUILD === "1" ? { output: "standalone" } : {}),
  images: {
    domains: ["res.cloudinary.com", "flagcdn.com", djangoHostname],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    deviceSizes: [320, 420, 640, 768, 992, 1200, 1920],
    imageSizes: [32, 64, 80, 120, 160, 240, 320, 480],
  },

  sassOptions: {
    includePaths: [path.join(__dirname, 'src/styles')],
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
}

module.exports = nextConfig;