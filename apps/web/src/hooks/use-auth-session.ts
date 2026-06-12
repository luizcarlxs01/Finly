"use client";

import { useEffect, useState } from "react";
import { login as loginWithApi } from "@/lib/api/auth";
import {
  AUTH_SESSION_EVENT,
  clearAuthSession,
  getAuthSession,
  saveAuthSession,
} from "@/lib/auth-storage";
import type { AuthResponse, LoginRequest } from "@/types/auth";

type UseAuthSessionReturn = {
  session: AuthResponse | null;
  authenticated: boolean;
  isLoaded: boolean;
  isSubmitting: boolean;
  login: (payload: LoginRequest) => Promise<void>;
  logout: () => void;
};

function isSessionValid(session: AuthResponse | null) {
  if (!session) {
    return false;
  }

  return new Date(session.expiresAt).getTime() > Date.now();
}

function getInitialSession() {
  return null;
}

export function useAuthSession(): UseAuthSessionReturn {
  const [session, setSession] = useState<AuthResponse | null>(getInitialSession);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    function syncSession() {
      const storedSession = getAuthSession();

      if (storedSession && !isSessionValid(storedSession)) {
        clearAuthSession();
        setSession(null);
        return;
      }

      setSession(storedSession ?? null);
    }

    syncSession();
    setIsLoaded(true);

    function handleStorage(event: StorageEvent) {
      if (event.key !== null && event.key !== "finly:auth-session") {
        return;
      }

      syncSession();
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener(AUTH_SESSION_EVENT, syncSession);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(AUTH_SESSION_EVENT, syncSession);
    };
  }, []);

  async function login(payload: LoginRequest) {
    setIsSubmitting(true);

    try {
      const nextSession = await loginWithApi(payload);
      saveAuthSession(nextSession);
      setSession(nextSession);
    } finally {
      setIsSubmitting(false);
    }
  }

  function logout() {
    clearAuthSession();
    setSession(null);
  }

  return {
    session,
    authenticated: isSessionValid(session),
    isLoaded,
    isSubmitting,
    login,
    logout,
  };
}
