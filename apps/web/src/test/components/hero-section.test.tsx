import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { HeroSection } from "@/components/dashboard/hero-section";

describe("HeroSection", () => {
  it("deve renderizar o bloco principal com os textos e a ação esperada", () => {
    render(<HeroSection onStartTransactions={vi.fn()} />);

    expect(screen.getByText("Finly")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Seu financeiro mais claro, simples e organizado.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Comece pelo essencial, acompanhe sua rotina e siga com mais confiança no dia a dia.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Ir para a aba de lançamentos" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Começar lançamentos")).toBeInTheDocument();
  });

  it("deve renderizar de forma estavel com os blocos informativos e cards de apoio atuais", () => {
    render(<HeroSection onStartTransactions={vi.fn()} />);

    expect(screen.getByText("Veja seu momento")).toBeInTheDocument();
    expect(
      screen.getByText("Entenda saldo, entradas e saídas de forma rápida."),
    ).toBeInTheDocument();
    expect(screen.getByText("Registre com facilidade")).toBeInTheDocument();
    expect(
      screen.getByText("Adicione movimentações sem perder clareza."),
    ).toBeInTheDocument();
    expect(screen.getByText("Acompanhe objetivos")).toBeInTheDocument();
    expect(
      screen.getByText("Metas e insights ajudam você a seguir em frente."),
    ).toBeInTheDocument();
    expect(screen.getByText("Resumo")).toBeInTheDocument();
    expect(screen.getByText("Lançamentos")).toBeInTheDocument();
    expect(screen.getByText("Evolução")).toBeInTheDocument();
  });

  it("deve manter renderizacao consistente com o contrato atual sem props externas adicionais", () => {
    render(<HeroSection onStartTransactions={vi.fn()} />);

    expect(
      screen.getByText("Veja seu panorama logo no começo."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Registre entradas e saídas com clareza."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Acompanhe metas e sinais do seu progresso."),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });
});
