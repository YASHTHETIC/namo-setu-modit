import { createApiClient } from "@foundation/api-client";

import { env } from "./env";

export const api = createApiClient({
  baseUrl: env.NEXT_PUBLIC_API_BASE_URL,
});
