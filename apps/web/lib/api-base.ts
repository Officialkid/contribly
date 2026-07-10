const FALLBACK_API_BASE = "http://localhost:3001";
const INTERNAL_API_BASE = process.env.API_SERVER_URL || process.env.NEXT_PUBLIC_API_URL || FALLBACK_API_BASE;
const PUBLIC_API_BASE = process.env.NEXT_PUBLIC_API_URL || FALLBACK_API_BASE;

export const API_BASE =
  (typeof window === "undefined" ? INTERNAL_API_BASE : PUBLIC_API_BASE).replace(/\/api\/?$/, "");
