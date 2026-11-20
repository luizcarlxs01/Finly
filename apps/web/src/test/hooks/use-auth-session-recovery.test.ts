import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useAuthSession } from "@/hooks/use-auth-session";

beforeEach(() => localStorage.clear());
afterEach(() => vi.unstubAllGlobals());

it("does not authenticate from a verification response received after cancellation", async () => {
  let finish!: (response: Response) => void;
  vi.stubGlobal("fetch", vi.fn()
    .mockResolvedValueOnce(new Response(JSON.stringify({ requiresVerification: true, email: "qa@example.invalid", name: "QA" })))
    .mockImplementationOnce(() => new Promise<Response>((resolve) => { finish = resolve; })));
  const { result } = renderHook(useAuthSession);
  await act(async () => { await result.current.login({ email: "qa@example.invalid", password: "Synthetic123!" }); });
  let verification!: Promise<void>;
  act(() => { verification = result.current.verifyCode("123456"); });
  act(() => result.current.cancelVerification());
  expect(result.current.pendingVerification).toBeNull();
  await act(async () => {
    finish(new Response(JSON.stringify({ requiresVerification: false, token: "synthetic-test", expiresAt: new Date(Date.now() + 3600000).toISOString(), userId: "qa-user", name: "QA", email: "qa@example.invalid" })));
    await verification;
  });
  expect(result.current.authenticated).toBe(false);
  expect(localStorage.getItem("finly:auth-session")).toBeNull();
  expect(result.current.isSubmitting).toBe(false);
});
