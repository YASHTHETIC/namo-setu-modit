export const product = {
  name: "MODIT",
  tagline: "Smart B2B construction procurement",
  description:
    "A high-trust procurement network for builders, contractors, architects, suppliers, retailers, and project teams.",
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1",
  brand: "modit",
} as const;
