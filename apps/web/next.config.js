const productionApiOrigin = "https://contribly-410149640401.europe-west1.run.app";
const configuredApiOrigin = (process.env.NEXT_PUBLIC_API_URL || "")
  .replace(/\/api\/?$/, "")
  .replace(/\/$/, "");
const runtimeApiOrigin =
  process.env.NODE_ENV === "production" &&
  (!configuredApiOrigin || /onrender\.com/i.test(configuredApiOrigin))
    ? productionApiOrigin
    : configuredApiOrigin;

const connectSrc = ["'self'"];

if (runtimeApiOrigin) {
  connectSrc.push(runtimeApiOrigin);
}

if (process.env.NODE_ENV !== "production") {
  connectSrc.push("http://localhost:3001");
}

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  swcMinify: true,
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // Security headers for all responses
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://*.r2.dev https://*.cloudflare.com",
              `connect-src ${connectSrc.join(" ")}`,
              "font-src 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

module.exports = config;
