export type QueryParamValue = string | number | boolean | null | undefined;

export interface HttpRequestOptions {
  headers?: HeadersInit;
  params?: Record<string, QueryParamValue>;
  timeoutMs?: number;
  signal?: AbortSignal;
  cache?: RequestCache;
}

/**
 * Standardized HTTP transport error thrown for non-2xx responses or network timeouts.
 */
export class HttpError extends Error {
  public readonly status: number;
  public readonly details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

const DEFAULT_TIMEOUT_MS = 30_000;

export function appendQueryParams(
  url: string,
  params?: Record<string, QueryParamValue>,
): string {
  if (!params) {
    return url;
  }

  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  }

  const query = searchParams.toString();
  if (!query) {
    return url;
  }

  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${query}`;
}

export function createRequestAbortSignal(
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
  externalSignal?: AbortSignal,
): { signal: AbortSignal; cleanup: () => void } {
  const controller = new AbortController();

  const onExternalAbort = () => {
    controller.abort(externalSignal?.reason);
  };

  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort(externalSignal.reason);
    } else {
      externalSignal.addEventListener('abort', onExternalAbort, { once: true });
    }
  }

  const timeoutId = setTimeout(() => {
    controller.abort(new Error(`Request timed out after ${timeoutMs}ms`));
  }, timeoutMs);

  const cleanup = () => {
    clearTimeout(timeoutId);
    if (externalSignal) {
      externalSignal.removeEventListener('abort', onExternalAbort);
    }
  };

  return { signal: controller.signal, cleanup };
}

function tryParseJson(rawText: string): unknown {
  if (!rawText.trim()) {
    return undefined;
  }

  try {
    return JSON.parse(rawText) as unknown;
  } catch {
    return rawText;
  }
}

function extractErrorInfo(payload: unknown, fallbackMessage: string): {
  message: string;
  details?: unknown;
} {
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    const rawMessage =
      typeof record.message === 'string'
        ? record.message
        : typeof record.error === 'string'
          ? record.error
          : fallbackMessage;

    return {
      message: rawMessage,
      details: record.details !== undefined ? record.details : payload,
    };
  }

  if (typeof payload === 'string' && payload.trim().length > 0) {
    return { message: payload, details: payload };
  }

  return { message: fallbackMessage };
}

export async function executeRawRequest(
  url: string,
  init: RequestInit,
  options?: HttpRequestOptions,
): Promise<Response> {
  const targetUrl = appendQueryParams(url, options?.params);
  const { signal, cleanup } = createRequestAbortSignal(
    options?.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    options?.signal,
  );

  const headers = new Headers(options?.headers);
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  if (init.headers) {
    const extra = new Headers(init.headers);
    extra.forEach((value, key) => {
      headers.set(key, value);
    });
  }

  try {
    const response = await fetch(targetUrl, {
      ...init,
      headers,
      credentials: 'include',
      cache: options?.cache,
      signal,
    });

    if (!response.ok) {
      const text = await response.text();
      const parsed = tryParseJson(text);
      const fallback = response.statusText || `HTTP Error ${response.status}`;
      const { message, details } = extractErrorInfo(parsed, fallback);
      throw new HttpError(response.status, message, details);
    }

    return response;
  } catch (err: unknown) {
    if (err instanceof HttpError) {
      throw err;
    }

    if (err instanceof Error && err.name === 'AbortError') {
      throw new HttpError(408, 'Request aborted or timed out');
    }

    const message = err instanceof Error ? err.message : 'Network request failed';
    throw new HttpError(0, message, err);
  } finally {
    cleanup();
  }
}

export async function parseJsonResponse<TResponse>(response: Response): Promise<TResponse> {
  if (response.status === 204) {
    return undefined as TResponse;
  }

  const text = await response.text();
  if (!text.trim()) {
    return undefined as TResponse;
  }

  const parsed = tryParseJson(text);
  if (typeof parsed === 'string') {
    throw new HttpError(response.status, 'Invalid JSON response received from server', parsed);
  }

  return parsed as TResponse;
}

/**
 * Performs an HTTP GET request with credentials and standardized error handling.
 */
export async function basicGet<TResponse>(
  url: string,
  options?: HttpRequestOptions,
): Promise<TResponse> {
  const response = await executeRawRequest(url, { method: 'GET' }, options);
  return parseJsonResponse<TResponse>(response);
}
