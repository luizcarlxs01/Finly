import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetch } from "@/lib/api/client";
import { saveAuthSession } from "@/lib/auth-storage";
import { useAuthSession } from "@/hooks/use-auth-session";
import type { AuthResponse } from "@/types/auth";

const session = (token = "synthetic-test"): AuthResponse => ({
  requiresVerification: false, token, expiresAt: new Date(Date.now() + 3600000).toISOString(),
  userId: "qa-user", name: "QA", email: "qa@example.invalid",
});

beforeEach(() => localStorage.clear());
afterEach(() => vi.unstubAllGlobals());

describe("API authorization recovery", () => {
  it("invalidates a rejected protected session and updates mounted account state", async () => {
    saveAuthSession(session());
    const { result } = renderHook(useAuthSession);
    await waitFor(() => expect(result.current.authenticated).toBe(true));
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 401 })));
    await act(async () => {
      await expect(apiFetch("/api/Profiles", { token: "synthetic-test" })).rejects.toMatchObject({ status: 401 });
    });
    expect(localStorage.getItem("finly:auth-session")).toBeNull();
    expect(result.current.authenticated).toBe(false);
  });

  it("does not let a late 401 from an old token sign out a newly authenticated account", async () => {
    saveAuthSession(session("old-token"));
    let finish!: (response: Response) => void;
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>((resolve) => { finish = resolve; })));
    const request = apiFetch("/api/Profiles", { token: "old-token" });
    const rejected = expect(request).rejects.toThrow();
    saveAuthSession(session("new-token"));
    finish(new Response("", { status: 401 }));
    await rejected;
    expect(JSON.parse(localStorage.getItem("finly:auth-session")!).token).toBe("new-token");
  });

  it("keeps a valid session when a public login request or an admin permission check fails", async () => {
    saveAuthSession(session());
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ message: "Credenciais inválidas" }), { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ message: "Sem permissão" }), { status: 403 })));
    await expect(apiFetch("/api/Auth/login")).rejects.toThrow("Credenciais inválidas");
    await expect(apiFetch("/api/forum/admin/topics", { token: "synthetic-test" })).rejects.toThrow("Sem permissão");
    expect(localStorage.getItem("finly:auth-session")).not.toBeNull();
  });

  it("turns network failures into actionable Portuguese connection feedback", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    await expect(apiFetch("/api/Auth/login")).rejects.toThrow("Verifique sua conexão e tente novamente");
  });
});

it("uses the local API proxy only in development", async () => {
  const fetchMock = vi.fn().mockImplementation(async () => new Response("[]"));
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("NODE_ENV", "development");
  try {
    await apiFetch("/api/forum/topics");
    expect(fetchMock).toHaveBeenLastCalledWith("/finly-api/api/forum/topics", expect.any(Object));
    vi.stubEnv("NODE_ENV", "production");
    await apiFetch("/api/forum/topics");
    expect(fetchMock).toHaveBeenLastCalledWith("http://localhost:8080/api/forum/topics", expect.any(Object));
  } finally {
    vi.unstubAllEnvs();
  }
});

it("preserves intentional request cancellation", async () => {
  const cancellation = new DOMException("Cancelled", "AbortError");
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(cancellation));
  await expect(apiFetch("/api/Profiles")).rejects.toBe(cancellation);
});
