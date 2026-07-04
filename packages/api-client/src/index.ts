import { joinUrl } from "@foundation/utils";

export * from "./namo";
export * from "./modit";
export { createNamoApi } from "./namo";
export { createModitApi } from "./modit";

export interface ApiClientOptions {
  baseUrl: string;
  accessToken?: string;
}

export interface ApiErrorResponse {
  detail?: string | Array<{ message?: string }>;
}

export class ApiClientError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.payload = payload;
  }
}

export class ApiClient {
  constructor(private readonly options: ApiClientOptions) {}

  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(joinUrl(this.options.baseUrl, path), {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(this.options.accessToken ? { Authorization: `Bearer ${this.options.accessToken}` } : {}),
        ...(init.headers ?? {}),
      },
    });

    const contentType = response.headers.get("content-type") ?? "";
    const payload = contentType.includes("application/json") ? await response.json() : await response.text();

    if (!response.ok) {
      const detail = typeof payload === "object" && payload !== null && "detail" in payload
        ? String((payload as ApiErrorResponse).detail ?? "Request failed")
        : "Request failed";
      throw new ApiClientError(detail, response.status, payload);
    }

    return payload as T;
  }

  getHealth() {
    return this.request<{ status: string; dependencies: { database: boolean; redis: boolean } }>("/healthz");
  }

  login(email: string, password: string) {
    return this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  me() {
    return this.request("/auth/me");
  }
}

export function createApiClient(options: ApiClientOptions): ApiClient {
  return new ApiClient(options);
}
