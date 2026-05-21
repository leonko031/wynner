/**
 * Shared API error helper.
 *
 * Every client-side fetch should map its failure into a toast + appropriate
 * side-effect (redirect, modal, retry). Doing that per call-site led to
 * inconsistent behavior — some routes forgot 429 entirely, others surfaced
 * raw response bodies. This helper centralizes the map.
 *
 * Usage:
 *
 *   try {
 *     const res = await fetch("/api/x", { ... });
 *     if (!res.ok) throw await APIError.fromResponse(res);
 *     return await res.json();
 *   } catch (e) {
 *     handleApiError(e, "Couldn't load X");
 *   }
 *
 * NOTE: `handleApiError` is client-only because it uses toast + router. The
 * APIError class itself is safe in any environment.
 */

import { toast } from "sonner";

/* -------------------------------------------------------------------------- */
/* APIError class                                                              */
/* -------------------------------------------------------------------------- */

export type APIErrorPayload = {
  status: number;
  code?: string;
  message: string;
  details?: unknown;
};

export class APIError extends Error {
  status: number;
  code: string | undefined;
  details: unknown;

  constructor(payload: APIErrorPayload) {
    super(payload.message);
    this.status = payload.status;
    this.code = payload.code;
    this.details = payload.details;
    this.name = "APIError";
  }

  /** Build an APIError from a non-OK fetch Response, parsing JSON best-effort. */
  static async fromResponse(res: Response): Promise<APIError> {
    let body: { error?: string | { code?: string; message?: string; details?: unknown }; message?: string } = {};
    try {
      body = (await res.json()) as typeof body;
    } catch {
      // Body wasn't JSON. Fall through with empty body.
    }
    const errField = body.error;
    let code: string | undefined;
    let message: string;
    let details: unknown;
    if (typeof errField === "string") {
      message = errField;
    } else if (errField && typeof errField === "object") {
      code = errField.code;
      message = errField.message ?? body.message ?? `Request failed (${res.status})`;
      details = errField.details;
    } else if (body.message) {
      message = body.message;
    } else {
      message = `Request failed (${res.status})`;
    }
    return new APIError({ status: res.status, code, message, details });
  }
}

/* -------------------------------------------------------------------------- */
/* handleApiError — toast + redirect map                                       */
/* -------------------------------------------------------------------------- */

type HandleOptions = {
  /** Fallback message when the error has none. */
  fallbackMessage?: string;
  /** Override the default action for 402 (insufficient credits). */
  on402?: (err: APIError) => void;
  /** Override the default action for 401/403. */
  onAuth?: (err: APIError) => void;
};

/**
 * Map an unknown error from a fetch site into the right user-visible
 * response. Returns the APIError (if one was extracted) for the caller to
 * inspect — useful when the caller wants to keep loading state until they
 * see the kind of failure.
 */
export function handleApiError(
  err: unknown,
  options: HandleOptions = {},
): APIError | null {
  const fallback = options.fallbackMessage ?? "Something went wrong";

  // Network failures (TypeError from fetch when offline)
  if (err instanceof TypeError && /fetch|network/i.test(err.message)) {
    toast.error("Couldn't reach the server", {
      description: "Check your connection and try again.",
    });
    return null;
  }

  if (!(err instanceof APIError)) {
    const message = err instanceof Error ? err.message : fallback;
    toast.error(fallback, { description: message });
    return null;
  }

  // 401 / 403 — auth required. Redirect to /auth with the current path.
  if (err.status === 401 || err.status === 403) {
    if (options.onAuth) {
      options.onAuth(err);
      return err;
    }
    toast.error("Please sign in", {
      description: "Your session expired or you're not authorized.",
    });
    if (typeof window !== "undefined") {
      const redirect = encodeURIComponent(window.location.pathname);
      window.location.href = `/auth?redirect=${redirect}`;
    }
    return err;
  }

  // 402 — insufficient credits. Caller usually wants to open the upsell modal.
  if (err.status === 402) {
    if (options.on402) {
      options.on402(err);
      return err;
    }
    toast.error("Not enough credits", {
      description: err.message,
      action: typeof window !== "undefined"
        ? {
            label: "Top up",
            onClick: () => {
              window.location.href = "/pricing#topups";
            },
          }
        : undefined,
    });
    return err;
  }

  // 429 — rate limited. Friendly + retry-after if present.
  if (err.status === 429) {
    toast.error("Slow down", {
      description: err.message || "Try again in a moment.",
    });
    return err;
  }

  // 5xx — server error. Generic but actionable.
  if (err.status >= 500) {
    toast.error("Something went wrong on our end", {
      description: "Try again — most errors here clear on a second attempt.",
    });
    return err;
  }

  // 4xx default — surface the message.
  toast.error(fallback, { description: err.message });
  return err;
}

/* -------------------------------------------------------------------------- */
/* Convenience wrapper                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Thin wrapper around fetch that throws APIError on non-OK responses. Most
 * call sites should use this instead of manually constructing the error.
 */
export async function apiFetch<T = unknown>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) throw await APIError.fromResponse(res);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
