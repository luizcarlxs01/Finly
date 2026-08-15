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
      screen.getByText("Comece pelo essencial e ganhe clareza sobre seu dinheiro."),
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
      screen.getByText("Saldo, entradas e saídas num relance."),
    ).toBeInTheDocument();
    expect(screen.getByText("Registre com facilidade")).toBeInTheDocument();
    expect(
      screen.getByText("Adicione movimentações sem perder clareza."),
    ).toBeInTheDocument();
    expect(screen.getByText("Acompanhe objetivos")).toBeInTheDocument();
    expect(
      screen.getByText("Metas e insights no seu caminho."),
    ).toBeInTheDocument();
  });

  it("deve manter renderizacao consistente com o contrato atual sem props externas adicionais", () => {
    render(<HeroSection onStartTransactions={vi.fn()} />);

    expect(
      screen.getByText("Saldo, entradas e saídas num relance."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Adicione movimentações sem perder clareza."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Metas e insights no seu caminho."),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });
});
