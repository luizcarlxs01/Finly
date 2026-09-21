import { apiFetch } from "@/lib/api/client";
import type {
  AuthOutcome,
  AuthResponse,
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  ResendVerificationCodeRequest,
  ResetPasswordRequest,
  VerifyEmailCodeRequest,
} from "@/types/auth";

export async function login(payload: LoginRequest): Promise<AuthOutcome> {
  return apiFetch<AuthOutcome>("/api/Auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function register(payload: RegisterRequest): Promise<AuthOutcome> {
  return apiFetch<AuthOutcome>("/api/Auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function verifyEmailCode(payload: VerifyEmailCodeRequest): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/api/Auth/verify-email", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function resendVerificationCode(
  payload: ResendVerificationCodeRequest,
): Promise<void> {
  await apiFetch<{ message: string }>("/api/Auth/resend-code", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function forgotPassword(payload: ForgotPasswordRequest): Promise<void> {
  await apiFetch<{ message: string }>("/api/Auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function resetPassword(payload: ResetPasswordRequest): Promise<void> {
  await apiFetch<{ message: string }>("/api/Auth/reset-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
