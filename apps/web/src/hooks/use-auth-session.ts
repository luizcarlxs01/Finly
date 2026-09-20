"use client";

import { useEffect, useState } from "react";
import {
  login as loginWithApi,
  register as registerWithApi,
  resendVerificationCode as resendVerificationCodeWithApi,
  verifyEmailCode as verifyEmailCodeWithApi,
} from "@/lib/api/auth";
import {
  AUTH_SESSION_EVENT,
  clearAuthSession,
  getAuthSession,
  saveAuthSession,
} from "@/lib/auth-storage";
import type { AuthResponse, LoginRequest, RegisterRequest } from "@/types/auth";

type PendingVerification = {
  email: string;
  name: string;
};

type UseAuthSessionReturn = {
  session: AuthResponse | null;
  authenticated: boolean;
  isLoaded: boolean;
  isSubmitting: boolean;
  pendingVerification: PendingVerification | null;
  login: (payload: LoginRequest) => Promise<void>;
  register: (payload: RegisterRequest) => Promise<void>;
  verifyCode: (code: string) => Promise<void>;
  resendCode: () => Promise<void>;
  cancelVerification: () => void;
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
  const [pendingVerification, setPendingVerification] =
    useState<PendingVerification | null>(null);

  useEffect(() => {
    function syncSession() {
      const storedSession = getAuthSession();
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

  useEffect(() => {
    if (!session) {
      return;
    }

    const expiresAt = new Date(session.expiresAt).getTime();

    if (Number.isNaN(expiresAt) || expiresAt <= Date.now()) {
      clearAuthSession();
      setSession(null);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      clearAuthSession();
      setSession(null);
    }, expiresAt - Date.now());

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [session]);

  async function login(payload: LoginRequest) {
    setIsSubmitting(true);

    try {
      const outcome = await loginWithApi(payload);

      if (outcome.requiresVerification) {
        setPendingVerification({ email: outcome.email, name: outcome.name });
        return;
      }

      saveAuthSession(outcome);
      setSession(outcome);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function register(payload: RegisterRequest) {
    setIsSubmitting(true);

    try {
      const outcome = await registerWithApi(payload);

      if (outcome.requiresVerification) {
        setPendingVerification({ email: outcome.email, name: outcome.name });
        return;
      }

      saveAuthSession(outcome);
      setSession(outcome);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function verifyCode(code: string) {
    if (!pendingVerification) {
      return;
    }

    setIsSubmitting(true);

    try {
      const nextSession = await verifyEmailCodeWithApi({
        email: pendingVerification.email,
        code,
      });
      saveAuthSession(nextSession);
      setSession(nextSession);
      setPendingVerification(null);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function resendCode() {
    if (!pendingVerification) {
      return;
    }

    setIsSubmitting(true);

    try {
      await resendVerificationCodeWithApi({ email: pendingVerification.email });
    } finally {
      setIsSubmitting(false);
    }
  }

  function cancelVerification() {
    setPendingVerification(null);
  }

  function logout() {
    clearAuthSession();
    setSession(null);
  }

  return {
    session: isSessionValid(session) ? session : null,
    authenticated: isSessionValid(session),
    isLoaded,
    isSubmitting,
    pendingVerification,
    login,
    register,
    verifyCode,
    resendCode,
    cancelVerification,
    logout,
  };
}
