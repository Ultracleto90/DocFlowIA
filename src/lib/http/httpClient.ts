import {
  executeRawRequest,
  parseJsonResponse,
  type HttpRequestOptions,
} from './basicGet';

export { HttpError, type HttpRequestOptions } from './basicGet';

async function sendJsonMutation<TRes, TBody>(
  method: 'POST' | 'PUT' | 'PATCH',
  url: string,
  body?: TBody,
  options?: HttpRequestOptions,
): Promise<TRes> {
  const headers = new Headers(options?.headers);
  if (body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await executeRawRequest(
    url,
    {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    },
    options,
  );

  return parseJsonResponse<TRes>(response);
}

/**
 * Performs an HTTP POST request with a JSON payload.
 */
export async function basicPost<TRes, TBody = unknown>(
  url: string,
  body?: TBody,
  options?: HttpRequestOptions,
): Promise<TRes> {
  return sendJsonMutation<TRes, TBody>('POST', url, body, options);
}

/**
 * Performs an HTTP PUT request with a JSON payload.
 */
export async function basicPut<TRes, TBody = unknown>(
  url: string,
  body?: TBody,
  options?: HttpRequestOptions,
): Promise<TRes> {
  return sendJsonMutation<TRes, TBody>('PUT', url, body, options);
}

/**
 * Performs an HTTP PATCH request with a JSON payload.
 */
export async function basicPatch<TRes, TBody = unknown>(
  url: string,
  body?: TBody,
  options?: HttpRequestOptions,
): Promise<TRes> {
  return sendJsonMutation<TRes, TBody>('PATCH', url, body, options);
}

/**
 * Performs an HTTP DELETE request.
 */
export async function basicDelete<TRes>(
  url: string,
  options?: HttpRequestOptions,
): Promise<TRes> {
  const response = await executeRawRequest(url, { method: 'DELETE' }, options);
  return parseJsonResponse<TRes>(response);
}

/**
 * Uploads multipart FormData without forcing a manual Content-Type boundary.
 */
export async function basicUpload<TRes>(
  url: string,
  formData: FormData,
  options?: HttpRequestOptions,
): Promise<TRes> {
  const headers = new Headers(options?.headers);
  headers.delete('Content-Type');

  const response = await executeRawRequest(
    url,
    {
      method: 'POST',
      body: formData,
    },
    {
      ...options,
      headers,
    },
  );

  return parseJsonResponse<TRes>(response);
}

/**
 * Fetches a binary file and triggers a client-side browser download.
 */
export async function basicDownload(
  url: string,
  filename: string,
  options?: HttpRequestOptions,
): Promise<void> {
  const headers = new Headers(options?.headers);
  if (!headers.has('Accept')) {
    headers.set('Accept', '*/*');
  }

  const response = await executeRawRequest(
    url,
    { method: 'GET' },
    {
      ...options,
      headers,
    },
  );

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);

  try {
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = filename;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
