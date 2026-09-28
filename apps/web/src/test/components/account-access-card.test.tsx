import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockUseAuthSession = vi.fn();

vi.mock("@/hooks/use-auth-session", () => ({
  useAuthSession: () => mockUseAuthSession(),
}));

import { AccountAccessCard } from "@/components/auth/account-access-card";

const identity = {
  token: "token",
  expiresAt: "2099-01-01T00:00:00.000Z",
  userId: "user-1",
  name: "Luiz",
  email: "luiz@finly.systems",
};

function createAuthState() {
  return {
    authenticated: false,
    isLoaded: true,
    isSubmitting: false,
    pendingVerification: null,
    login: vi.fn().mockResolvedValue(undefined),
    register: vi.fn().mockResolvedValue(undefined),
    forgotPassword: vi.fn().mockResolvedValue(undefined),
    verifyCode: vi.fn().mockResolvedValue(undefined),
    resendCode: vi.fn().mockResolvedValue(undefined),
    cancelVerification: vi.fn(),
    logout: vi.fn(),
    session: null,
  };
}

async function openAccount() {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Conta" }));
  return user;
}

describe("AccountAccessCard", () => {
  beforeEach(() => {
    mockUseAuthSession.mockReturnValue(createAuthState());
  });

  it("abre apenas pelo acionador e permite fechar pelo botao, Escape e clique externo", async () => {
    render(<><AccountAccessCard /><button>Fora do painel</button></>);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    const user = await openAccount();
    expect(screen.getByRole("dialog", { name: "Acesse sua conta" })).toBeVisible();
    expect(screen.getByText("Você também pode usar o Finly sem conta.")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Conta" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("dialog")).toBeVisible();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Conta" })).toHaveFocus();

    await user.click(screen.getByRole("button", { name: "Conta" }));
    await user.click(screen.getByRole("button", { name: "Fora do painel" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("mantem labels, senha visivel e o payload de login existente", async () => {
    const auth = createAuthState();
    mockUseAuthSession.mockReturnValue(auth);
    render(<AccountAccessCard />);
    const user = await openAccount();

    await user.type(screen.getByLabelText("E-mail"), identity.email);
    await user.type(screen.getByLabelText("Senha"), "Senha123!");
    expect(screen.getByLabelText("Senha")).toHaveAttribute("type", "password");
    await user.click(screen.getByRole("button", { name: "Mostrar senha" }));
    expect(screen.getByLabelText("Senha")).toHaveAttribute("type", "text");
    await user.click(screen.getByRole("button", { name: "Entrar" }));
    expect(auth.login).toHaveBeenCalledWith({ email: identity.email, password: "Senha123!" });
  });

  it("preserva erros e o estado de envio do formulario", async () => {
    const auth = createAuthState();
    auth.login.mockRejectedValue(new Error("Credenciais inválidas"));
    mockUseAuthSession.mockReturnValue(auth);
    const { rerender } = render(<AccountAccessCard />);
    const user = await openAccount();
    await user.type(screen.getByLabelText("E-mail"), identity.email);
    await user.type(screen.getByLabelText("Senha"), "Senha123!");
    await user.click(screen.getByRole("button", { name: "Entrar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Credenciais inválidas");

    mockUseAuthSession.mockReturnValue({ ...auth, isSubmitting: true });
    rerender(<AccountAccessCard />);
    expect(screen.getByRole("button", { name: "Entrando..." })).toBeDisabled();
  });

  it("permite navegar entre login e cadastro por teclado e pelo link", async () => {
    render(<AccountAccessCard />);
    const user = await openAccount();
    screen.getByRole("tab", { name: "Entrar" }).focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Cadastrar" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(screen.getByLabelText("Nome")).toBeVisible();
    await user.click(screen.getByRole("tab", { name: "Entrar" }));
    await user.click(screen.getByRole("button", { name: "Criar conta" }));
    expect(screen.getByLabelText("Nome")).toBeVisible();
  });

  it("reutiliza a recuperacao de senha e retorna ao login", async () => {
    const auth = createAuthState();
    mockUseAuthSession.mockReturnValue(auth);
    render(<AccountAccessCard />);
    const user = await openAccount();
    await user.click(screen.getByRole("button", { name: "Esqueceu?" }));
    await user.type(screen.getByLabelText("E-mail"), identity.email);
    await user.click(screen.getByRole("button", { name: "Enviar link de redefinição" }));
    expect(auth.forgotPassword).toHaveBeenCalledWith(identity.email);
    expect(await screen.findByText("Verifique seu e-mail")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Voltar para o login" }));
    expect(screen.getByLabelText("Senha")).toBeVisible();
  });

  it("preserva a confirmacao pendente ao fechar e reabrir o painel", async () => {
    const auth = createAuthState();
    mockUseAuthSession.mockReturnValue({ ...auth, pendingVerification: { email: identity.email, name: identity.name } });
    render(<AccountAccessCard />);
    const user = await openAccount();
    await user.type(screen.getByLabelText("Código de verificação"), "123456");
    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("button", { name: "Conta" }));
    expect(screen.getByLabelText("Código de verificação")).toHaveValue("123456");
    await user.click(screen.getByRole("button", { name: "Confirmar código" }));
    expect(auth.verifyCode).toHaveBeenCalledWith("123456");
  });

  it("atualiza a identificacao e a acao de sair conforme a sessao", async () => {
    const auth = createAuthState();
    mockUseAuthSession.mockReturnValue(auth);
    const { rerender } = render(<AccountAccessCard />);
    const user = await openAccount();
    mockUseAuthSession.mockReturnValue({ ...auth, authenticated: true, session: identity });
    rerender(<AccountAccessCard />);
    expect(screen.getByRole("button", { name: "Conta de Luiz" })).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Sua conta" })).toBeVisible();
    expect(screen.getByText(identity.email)).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Sair" }));
    expect(auth.logout).toHaveBeenCalledOnce();
    mockUseAuthSession.mockReturnValue(auth);
    rerender(<AccountAccessCard />);
    expect(screen.getByRole("dialog", { name: "Acesse sua conta" })).toBeVisible();
    expect(screen.getByLabelText("E-mail")).toBeVisible();
  });
});
