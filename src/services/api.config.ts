/**
 * API base configuration.
 * All API calls go through here for easy backend URL switching.
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/v1";

export { API_BASE_URL };

export function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface ApiRequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  headers?: Record<string, string>;
  body?: unknown;
  signal?: AbortSignal;
}

export async function apiRequest(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<Response> {
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${endpoint}`;

  const headers: Record<string, string> = {
    ...getAuthHeaders(),
    ...(options.headers ?? {}),
  };

  let fetchOptions: RequestInit = {
    method: options.method ?? "GET",
    headers,
    signal: options.signal,
  };

  if (options.body !== undefined) {
    const body = options.body;
    if (
      body instanceof FormData ||
      body instanceof URLSearchParams ||
      body instanceof Blob ||
      body instanceof ArrayBuffer ||
      body instanceof ReadableStream
    ) {
      fetchOptions.body = body as BodyInit;
    } else if (typeof body === "object" && body !== null) {
      if (!headers["Content-Type"] && !headers["content-type"]) {
        headers["Content-Type"] = "application/json";
      }
      fetchOptions.body = JSON.stringify(body);
    } else {
      fetchOptions.body = body as BodyInit;
    }
  }

  const response = await fetch(url, fetchOptions);

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    try {
      const errBody = await response.json();
      errorMessage = errBody.detail || errBody.message || errorMessage;
    } catch {
      // Keep status code as message
    }
    if (response.status === 401) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user_info");
      window.location.href = "/#/login";
    }
    throw new Error(errorMessage);
  }

  return response;
}
