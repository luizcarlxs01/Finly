import type { AuthResponse } from "@/types/auth";

const AUTH_STORAGE_KEY = "finly:auth-session";
export const AUTH_SESSION_EVENT = "finly:auth-session-changed";

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
    return JSON.parse(rawValue) as AuthResponse;
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
  const session = getAuthSession();

  if (!session) return false;

  const expiresAt = new Date(session.expiresAt).getTime();
  const now = Date.now();

  return expiresAt > now;
}
