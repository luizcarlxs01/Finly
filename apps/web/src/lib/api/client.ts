import { clearAuthSession, getAuthSession } from "@/lib/auth-storage";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL não está definida.");
}

type RequestOptions = RequestInit & {
  token?: string;
};

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { token, headers, ...rest } = options;

  const baseUrl = process.env.NODE_ENV === "development" ? "/finly-api" : API_URL;
  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...rest,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      cache: "no-store",
    });
  } catch (error) {
    if (error && typeof error === "object" && "name" in error && error.name === "AbortError") {
      throw error;
    }
    throw new Error("Não foi possível conectar ao Finly. Verifique sua conexão e tente novamente.");
  }

  if (!response.ok) {
    let errorMessage = "Erro ao consumir a API.";

    try {
      const errorData = (await response.json()) as { message?: unknown };
      if (typeof errorData?.message === "string" && errorData.message.trim()) {
        errorMessage = errorData.message;
      }
    } catch {
      // mantém a mensagem padrão
    }

    if (response.status === 401 && token) {
      // A response from an old request must not clear a newer login.
      if (getAuthSession()?.token === token) {
        clearAuthSession();
      }
      errorMessage = "Sua sessão expirou. Entre novamente.";
    }

    throw new ApiError(errorMessage, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
