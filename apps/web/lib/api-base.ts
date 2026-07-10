const DEV_FALLBACK_API_BASE = "http://localhost:3001";

function normalizeApiBase(value?: string) {
  return (value || "").trim().replace(/\/api\/?$/, "").replace(/\/$/, "");
}

const INTERNAL_API_BASE =
  normalizeApiBase(process.env.API_SERVER_URL) ||
  normalizeApiBase(process.env.NEXT_PUBLIC_API_URL) ||
  (process.env.NODE_ENV === "production" ? "" : DEV_FALLBACK_API_BASE);

const PUBLIC_API_BASE =
  normalizeApiBase(process.env.NEXT_PUBLIC_API_URL) ||
  (process.env.NODE_ENV === "production" ? "" : DEV_FALLBACK_API_BASE);

export const API_BASE = typeof window === "undefined" ? INTERNAL_API_BASE : PUBLIC_API_BASE;
