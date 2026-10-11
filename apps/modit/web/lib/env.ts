import { z } from "zod";

// Production-first default: any build without an explicit env (Vercel,
// fresh checkouts) talks to the live API. Local dev keeps working because
// apps/modit/web/.env.local overrides this with localhost.
const PROD_API_BASE_URL = "https://api.modit.in/api/v1";

const clientEnvSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.string().url().default(PROD_API_BASE_URL),
});

export const env = clientEnvSchema.parse({
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL ?? PROD_API_BASE_URL,
});
