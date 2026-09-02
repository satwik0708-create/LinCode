"use client";

export interface ApiResult<T = Record<string, unknown>> {
  ok: boolean;
  error?: string;
  fields?: Record<string, string>;
  data: T;
}

/**
 * Single client-side entry point for mutations.
 *
 * `credentials: "same-origin"` keeps the session cookie attached without ever
 * exposing it to script, and the JSON content type makes the request subject to
 * CORS preflight from other origins.
 */
export async function postJson<T = Record<string, unknown>>(url: string, body: unknown): Promise<ApiResult<T>> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(body),
    });

    const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    return {
      ok: response.ok && payload.ok !== false,
      error: typeof payload.error === "string" ? payload.error : undefined,
      fields: (payload.fields as Record<string, string>) ?? undefined,
      data: payload as T,
    };
  } catch {
    return { ok: false, error: "Network problem — check your connection and try again.", data: {} as T };
  }
}
