import Cookies from "js-cookie";
import { DJANGO_BASE_URL } from "./config";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface HttpOptions extends RequestInit {
  searchParams?: Record<string, unknown>;
  timeoutMs?: number;
}

const TOKEN_NAME = "access_token";
const REFRESH_NAME = "refresh_token";

function isServer(): boolean {
  return typeof window === "undefined";
}

function buildUrl(path: string, searchParams?: Record<string, unknown>): string {
  const base = path.startsWith("http")
    ? path
    : `${DJANGO_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
  if (!searchParams || Object.keys(searchParams).length === 0) return base;
  const url = new URL(base);
  Object.entries(searchParams).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    if (Array.isArray(value)) {
      value.forEach((v) => url.searchParams.append(key, String(v)));
    } else {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
}

function getAccessToken(): string | undefined {
  if (isServer()) return undefined;
  return Cookies.get(TOKEN_NAME);
}

function applyAuthHeader(init: RequestInit): RequestInit {
  const token = getAccessToken();
  if (!token) return init;
  return {
    ...init,
    headers: {
      ...(init.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  };
}

async function refreshAccessTokenClient(): Promise<string> {
  const refreshToken = Cookies.get(REFRESH_NAME);
  if (!refreshToken) throw new Error("No refresh token available");

  const res = await fetch(buildUrl("/api/token/refresh/"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh: refreshToken }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    Cookies.remove(TOKEN_NAME);
    Cookies.remove(REFRESH_NAME);
    throw new Error("Failed to refresh token");
  }
  const newAccess: string = data.access;
  const newRefresh: string | undefined = data.refresh;
  const now = Date.now();
  Cookies.set(TOKEN_NAME, newAccess, { expires: new Date(now + 30 * 60 * 1000) });
  if (newRefresh) {
    Cookies.set(REFRESH_NAME, newRefresh, { expires: new Date(now + 7 * 24 * 60 * 60 * 1000) });
  }
  return newAccess;
}

let isRefreshing = false;
let refreshQueue: Array<(token?: string, error?: unknown) => void> = [];

function queueRefresh(): Promise<string> {
  return new Promise((resolve, reject) => {
    refreshQueue.push((token, error) => {
      if (error) reject(error);
      else resolve(token as string);
    });
  });
}

function resolveRefreshQueue(token?: string, error?: unknown): void {
  refreshQueue.forEach((fn) => fn(token, error));
  refreshQueue = [];
}

async function fetchWithTimeout(input: RequestInfo, init?: HttpOptions): Promise<Response> {
  const controller = new AbortController();
  const timeoutMs = init?.timeoutMs ?? 15000;
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(input, {
      ...init,
      signal: controller.signal,
    } as RequestInit);
    return res;
  } finally {
    clearTimeout(id);
  }
}

async function maybeRetry<T>(fn: () => Promise<T>, retries = 2, delayMs = 250): Promise<T> {
  try {
    return await fn();
  } catch (err: any) {
    if (retries <= 0) throw err;
    const status = err?.status;
    const isRetriable = !status || (status >= 500 && status < 600);
    if (!isRetriable) throw err;
    await new Promise((r) => setTimeout(r, delayMs));
    return maybeRetry(fn, retries - 1, delayMs * 2);
  }
}

export async function request<T>(
  path: string,
  method: HttpMethod,
  options: HttpOptions = {}
): Promise<T> {
  const url = buildUrl(path, options.searchParams);
  const baseInit: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    body: options.body,
  };
  const initWithAuth = applyAuthHeader(baseInit);

  const exec = async (): Promise<T> => {
    const res = await fetchWithTimeout(url, { ...options, ...initWithAuth });
    const contentType = res.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const body = isJson ? await res.json().catch(() => ({})) : await res.text();
    if (!res.ok) {
      const error: any = { status: res.status, body };
      throw error;
    }
    return body as T;
  };

  const isGet = method === "GET";
  const runner = () => exec();

  try {
    return await (isGet ? maybeRetry(runner) : runner());
  } catch (err: any) {
    if (!isServer() && err?.status === 401) {
      if (isRefreshing) {
        const newToken = await queueRefresh();
        return request<T>(path, method, options);
      }
      try {
        isRefreshing = true;
        const newToken = await refreshAccessTokenClient();
        isRefreshing = false;
        resolveRefreshQueue(newToken);
        return request<T>(path, method, options);
      } catch (refreshErr) {
        isRefreshing = false;
        resolveRefreshQueue(undefined, refreshErr);
        throw err;
      }
    }
    throw err;
  }
}

export const http = {
  get: <T>(path: string, options?: HttpOptions) => request<T>(path, "GET", options),
  post: <T>(path: string, body?: unknown, options?: Omit<HttpOptions, "body">) =>
    request<T>(path, "POST", { ...(options || {}), body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown, options?: Omit<HttpOptions, "body">) =>
    request<T>(path, "PUT", { ...(options || {}), body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown, options?: Omit<HttpOptions, "body">) =>
    request<T>(path, "PATCH", { ...(options || {}), body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string, body?: unknown, options?: Omit<HttpOptions, "body">) =>
    request<T>(path, "DELETE", { ...(options || {}), body: body ? JSON.stringify(body) : undefined }),
};

export function setTokens(access: string, refresh: string): void {
  const now = Date.now();
  Cookies.set(TOKEN_NAME, access, { expires: new Date(now + 30 * 60 * 1000) });
  Cookies.set(REFRESH_NAME, refresh, { expires: new Date(now + 7 * 24 * 60 * 60 * 1000) });
}

export function clearTokens(): void {
  Cookies.remove(TOKEN_NAME);
  Cookies.remove(REFRESH_NAME);
}
