export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type RequestOptions = RequestInit & {
  searchParams?: Record<string, string | number | boolean | undefined>;
};

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = new URL(path.startsWith("http") ? path : `${API_URL}${path}`);

  if (options.searchParams) {
    for (const [key, value] of Object.entries(options.searchParams)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const { searchParams: _searchParams, ...init } = options;
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return response.json() as Promise<T>;
}

/**
 * Nest puts the useful text in the body: a string for thrown exceptions, an
 * array of messages for validation failures. Falling back to the status keeps
 * something readable when the body is empty or not JSON.
 */
async function readError(response: Response): Promise<string> {
  const body = await response.json().catch(() => null);

  if (body && typeof body === "object" && "message" in body) {
    const { message } = body as { message: unknown };
    if (Array.isArray(message)) return message.join(". ");
    if (typeof message === "string") return message;
  }

  return `API ${response.status}: ${response.statusText}`;
}
