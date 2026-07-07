import { joinUrl } from "@foundation/utils";

export * from "./namo";
export * from "./modit";
export { createNamoApi } from "./namo";
export { createModitApi } from "./modit";

export interface ApiClientOptions {
  baseUrl: string;
  accessToken?: string;
  refreshToken?: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  onTokenRefresh?: (newAccessToken: string) => void;
  onAuthError?: () => void;
}

export interface ApiErrorResponse {
  detail?: string | Array<{ message?: string; field?: string }>;
  error?: string;
  message?: string;
  code?: string;
}

export class ApiClientError extends Error {
  status: number;
  payload: unknown;
  code?: string;
  field?: string;

  constructor(message: string, status: number, payload: unknown, code?: string, field?: string) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.payload = payload;
    this.code = code;
    this.field = field;
  }

  isNetworkError(): boolean {
    return this.status === 0 || this.message.includes("fetch") || this.message.includes("network");
  }

  isAuthError(): boolean {
    return this.status === 401 || this.status === 403;
  }

  isValidationError(): boolean {
    return this.status === 422;
  }

  isServerError(): boolean {
    return this.status >= 500;
  }

  isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }
}

export class ApiClient {
  private readonly timeout: number;
  private readonly maxRetries: number;
  private readonly retryDelay: number;
  private readonly onTokenRefresh?: (newAccessToken: string) => void;
  private readonly onAuthError?: () => void;
  private isRefreshing = false;

  constructor(private readonly options: ApiClientOptions) {
    this.timeout = options.timeout ?? 30000;
    this.maxRetries = options.maxRetries ?? 3;
    this.retryDelay = options.retryDelay ?? 1000;
    this.onTokenRefresh = options.onTokenRefresh;
    this.onAuthError = options.onAuthError;
  }

  private async fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        throw new ApiClientError("Request timeout", 0, null, "TIMEOUT");
      }
      throw error;
    }
  }

  private extractErrorInfo(payload: unknown): { message: string; code?: string; field?: string } {
    if (typeof payload === "object" && payload !== null) {
      const p = payload as Record<string, unknown>;
      
      if (typeof p.detail === "string") {
        return { message: p.detail };
      }
      
      if (Array.isArray(p.detail) && p.detail.length > 0) {
        const first = p.detail[0] as Record<string, unknown>;
        return {
          message: (first.message as string) ?? "Validation error",
          field: first.field as string,
        };
      }
      
      if (typeof p.message === "string") {
        return { message: p.message, code: p.code as string };
      }
      
      if (typeof p.error === "string") {
        return { message: p.error, code: p.code as string };
      }
    }
    
    return { message: "Request failed" };
  }

  private async refreshAccessToken(): Promise<string | null> {
    if (this.isRefreshing || !this.options.refreshToken) {
      return null;
    }

    this.isRefreshing = true;
    try {
      const response = await fetch(joinUrl(this.options.baseUrl, "/auth/refresh"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: this.options.refreshToken }),
      });

      if (response.ok) {
        const data = await response.json() as { access_token: string };
        if (this.onTokenRefresh) {
          this.onTokenRefresh(data.access_token);
        }
        return data.access_token;
      }
    } catch (error) {
      console.error("Token refresh failed:", error);
    } finally {
      this.isRefreshing = false;
    }

    if (this.onAuthError) {
      this.onAuthError();
    }
    return null;
  }

  private async requestWithRetry<T>(
    path: string,
    init: RequestInit,
    retryCount = 0
  ): Promise<T> {
    try {
      return await this.executeRequest<T>(path, init);
    } catch (error) {
      if (error instanceof ApiClientError) {
        // Retry on network errors or 5xx server errors
        if (
          retryCount < this.maxRetries &&
          (error.isNetworkError() || error.isServerError())
        ) {
          const delay = this.retryDelay * Math.pow(2, retryCount);
          await new Promise((resolve) => setTimeout(resolve, delay));
          return this.requestWithRetry<T>(path, init, retryCount + 1);
        }

        // Handle auth errors with token refresh
        if (error.isAuthError() && retryCount === 0) {
          const newToken = await this.refreshAccessToken();
          if (newToken) {
            this.options.accessToken = newToken;
            return this.requestWithRetry<T>(path, init, retryCount + 1);
          }
        }
      }
      throw error;
    }
  }

  private async executeRequest<T>(path: string, init: RequestInit): Promise<T> {
    const url = joinUrl(this.options.baseUrl, path);
    const headers = {
      "Content-Type": "application/json",
      ...(this.options.accessToken ? { Authorization: `Bearer ${this.options.accessToken}` } : {}),
      ...(init.headers ?? {}),
    };

    const response = await this.fetchWithTimeout(url, { ...init, headers });
    const contentType = response.headers.get("content-type") ?? "";
    const payload = contentType.includes("application/json")
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      const { message, code, field } = this.extractErrorInfo(payload);
      throw new ApiClientError(message, response.status, payload, code, field);
    }

    return payload as T;
  }

  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    return this.requestWithRetry<T>(path, init);
  }

  async get<T>(path: string, init?: RequestInit): Promise<T> {
    return this.request<T>(path, { ...init, method: "GET" });
  }

  async post<T>(path: string, data?: unknown, init?: RequestInit): Promise<T> {
    return this.request<T>(path, {
      ...init,
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(path: string, data?: unknown, init?: RequestInit): Promise<T> {
    return this.request<T>(path, {
      ...init,
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(path: string, init?: RequestInit): Promise<T> {
    return this.request<T>(path, { ...init, method: "DELETE" });
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
