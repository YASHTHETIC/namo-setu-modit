import { z } from "zod";

// Same-origin default: the browser talks to <site>/api/*, which nginx
// (VPS) or a Vercel rewrite forwards to the API. No CORS preflight, no
// extra DNS, no subdomain to get blocked - the whole class of
// "Failed to fetch" connectivity faults disappears.
// Override with an absolute URL when the API lives elsewhere
// (local dev uses http://127.0.0.1:8000 via .env.local).
const PROD_API_BASE_URL = "/api/v1";

const clientEnvSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z
    .string()
    .min(1)
    .refine((v) => v.startsWith("/") || /^https?:\/\//.test(v), {
      message: "API base must be a /path or an http(s) URL",
    })
    .default(PROD_API_BASE_URL),
});

export const env = clientEnvSchema.parse({
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL ?? PROD_API_BASE_URL,
});
