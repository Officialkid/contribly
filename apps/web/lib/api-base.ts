const DEV_FALLBACK_API_BASE = "http://localhost:3001";
const PROD_FALLBACK_API_BASE = "https://contribly-410149640401.europe-west1.run.app";

function normalizeApiBase(value?: string) {
  return (value || "").trim().replace(/\/api\/?$/, "").replace(/\/$/, "");
}

function isDeprecatedRenderApi(value?: string) {
  return /onrender\.com/i.test(value || "");
}

function resolveApiBase(...values: Array<string | undefined>) {
  for (const value of values) {
    const normalized = normalizeApiBase(value);
    if (!normalized || isDeprecatedRenderApi(normalized)) continue;
    return normalized;
  }

  return "";
}

const INTERNAL_API_BASE =
  resolveApiBase(process.env.API_SERVER_URL, process.env.NEXT_PUBLIC_API_URL) ||
  (process.env.NODE_ENV === "production" ? PROD_FALLBACK_API_BASE : DEV_FALLBACK_API_BASE);

// Browser requests stay on the Vercel origin and are proxied to Cloud Run.
// This keeps authentication cookies first-party in browsers that block third-party cookies.
const PUBLIC_API_BASE =
  process.env.NODE_ENV === "production"
    ? ""
    : resolveApiBase(process.env.NEXT_PUBLIC_API_URL) || DEV_FALLBACK_API_BASE;

export const API_BASE = typeof window === "undefined" ? INTERNAL_API_BASE : PUBLIC_API_BASE;
