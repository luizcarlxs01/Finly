import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const mockUseAuthSession = vi.fn();

vi.mock("@/hooks/use-auth-session", () => ({
  useAuthSession: () => mockUseAuthSession(),
}));

import { AccountAccessCard } from "@/components/auth/account-access-card";

describe("AccountAccessCard", () => {
  beforeEach(() => {
    mockUseAuthSession.mockReturnValue({
      authenticated: false,
      isLoaded: true,
      isSubmitting: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      session: null,
    });
  });

  it("exibe o modo local somente dentro da área de conta", () => {
    render(<AccountAccessCard />);

    expect(
      screen.getByText("Modo sem conta — dados salvos neste navegador"),
    ).toBeInTheDocument();
  });

  it("exibe o modo sincronizado para uma sessão autenticada", () => {
    mockUseAuthSession.mockReturnValue({
      authenticated: true,
      isLoaded: true,
      isSubmitting: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      session: {
        token: "token",
        expiresAt: "2099-01-01T00:00:00.000Z",
        userId: "user-1",
        name: "Luiz",
        email: "luiz@finly.systems",
      },
    });

    render(<AccountAccessCard />);

    expect(
      screen.getByText("Modo com conta — dados sincronizados com sua conta"),
    ).toBeInTheDocument();
  });
});
