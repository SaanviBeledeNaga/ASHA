import { getToken } from "./auth";

export class ApiError extends Error {
  status: number;
  url: string;
  details?: unknown;

  constructor(message: string, opts: { status: number; url: string; details?: unknown }) {
    super(message);
    this.name = "ApiError";
    this.status = opts.status;
    this.url = opts.url;
    this.details = opts.details;
  }
}

const DEFAULT_BASE_URL = "http://localhost:8000";

function getBaseUrl() {
  const env = process.env.NEXT_PUBLIC_API_BASE_URL;
  return (env && env.trim()) || DEFAULT_BASE_URL;
}

type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export type ApiRequestOptions = Omit<RequestInit, "body" | "headers"> & {
  headers?: Record<string, string | undefined>;
  json?: JsonValue;
};

async function parseResponseBody(res: Response) {
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      return await res.json();
    } catch {
      return null;
    }
  }

  try {
    return await res.text();
  } catch {
    return null;
  }
}

export async function api<T = unknown>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const baseUrl = getBaseUrl();
  const url = path.startsWith("http") ? path : `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;

  const token = getToken();

  const headers: Record<string, string> = {};
  if (options.headers) {
    for (const [key, value] of Object.entries(options.headers)) {
      if (value !== undefined) {
        headers[key] = value;
      }
    }
  }

  if (token && !headers.Authorization) headers.Authorization = `Bearer ${token}`;
  if (options.json !== undefined && !headers["Content-Type"]) headers["Content-Type"] = "application/json";
  if (!headers.Accept) headers.Accept = "application/json";

  const res = await fetch(url, {
    ...options,
    headers,
    body: options.json !== undefined ? JSON.stringify(options.json) : undefined,
  });

  if (!res.ok) {
    const details = await parseResponseBody(res);
    const message =
      typeof details === "object" && details && "message" in (details as Record<string, unknown>)
        ? String((details as Record<string, unknown>).message)
        : `Request failed (${res.status})`;
    throw new ApiError(message, { status: res.status, url, details });
  }

  const data = (await parseResponseBody(res)) as T;
  return data;
}

