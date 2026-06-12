import { apiFetch } from "@/lib/api/client";
import type { AuthResponse, LoginRequest, RegisterRequest } from "@/types/auth";

export async function login(payload: LoginRequest): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/api/Auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function register(payload: RegisterRequest): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/api/Auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
