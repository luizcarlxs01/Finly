import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

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

  it("exibe o formulario de login imediatamente no modo sem conta", () => {
    render(<AccountAccessCard />);

    expect(screen.getByText("Entrar na sua conta")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Entrar na conta" }),
    ).not.toBeInTheDocument();
  });

  it("deve alternar do login para a criacao de conta", async () => {
    const user = userEvent.setup();

    render(<AccountAccessCard />);

    await user.click(screen.getByRole("tab", { name: "Criar conta" }));

    expect(screen.getByText("Criar conta no Finly")).toBeInTheDocument();
    expect(screen.queryByText("Entrar na sua conta")).not.toBeInTheDocument();
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
