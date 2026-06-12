import type { AuthResponse } from "@/types/auth";

const AUTH_STORAGE_KEY = "finly:auth-session";
export const AUTH_SESSION_EVENT = "finly:auth-session-changed";

function isValidSessionShape(session: unknown): session is AuthResponse {
  if (!session || typeof session !== "object") {
    return false;
  }

  const candidate = session as Partial<AuthResponse>;

  return (
    typeof candidate.token === "string" &&
    candidate.token.trim().length > 0 &&
    typeof candidate.expiresAt === "string" &&
    candidate.expiresAt.trim().length > 0 &&
    typeof candidate.userId === "string" &&
    candidate.userId.trim().length > 0 &&
    typeof candidate.name === "string" &&
    typeof candidate.email === "string"
  );
}

function isSessionExpired(session: AuthResponse) {
  const expiresAt = new Date(session.expiresAt).getTime();

  return Number.isNaN(expiresAt) || expiresAt <= Date.now();
}

function notifyAuthSessionChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_SESSION_EVENT));
}

export function saveAuthSession(session: AuthResponse): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  notifyAuthSessionChanged();
}

export function getAuthSession(): AuthResponse | null {
  if (typeof window === "undefined") return null;

  const rawValue = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!rawValue) return null;

  try {
    const parsedValue = JSON.parse(rawValue) as unknown;

    if (!isValidSessionShape(parsedValue) || isSessionExpired(parsedValue)) {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }

    return parsedValue;
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function clearAuthSession(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  notifyAuthSessionChanged();
}

export function getAccessToken(): string | null {
  const session = getAuthSession();
  return session?.token ?? null;
}

export function isAuthenticated(): boolean {
  return getAuthSession() !== null;
}
