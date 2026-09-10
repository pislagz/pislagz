export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export const getAuthHeaders = (): HeadersInit => ({
  "Content-Type": "application/json",
});

type RequestOptions = {
  method?: string;
  body?: unknown;
  headers?: HeadersInit;
};

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    headers: { ...getAuthHeaders(), ...options.headers },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (response.status === 401 && typeof window !== "undefined") {
    window.location.assign("/hire-me");
  }

  if (!response.ok) {
    const error = new Error(`Request failed with status ${response.status}`);
    throw error;
  }

  return (await response.json()) as T;
}
