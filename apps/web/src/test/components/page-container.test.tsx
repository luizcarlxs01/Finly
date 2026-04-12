import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { PageContainer } from "@/components/layout/page-container";

describe("PageContainer", () => {
  it("deve renderizar o container com children validos", () => {
    render(
      <PageContainer>
        <h1>Painel</h1>
      </PageContainer>,
    );

    expect(screen.getByRole("heading", { name: "Painel" })).toBeInTheDocument();
  });

  it("deve aplicar uma estrutura base observavel e estavel com conteudo minimo", () => {
    const { container } = render(
      <PageContainer>
        <span>Oi</span>
      </PageContainer>,
    );

    const wrapper = container.firstElementChild;

    expect(wrapper?.tagName).toBe("DIV");
    expect(wrapper?.className).toContain("mx-auto");
    expect(wrapper?.className).toContain("max-w-7xl");
    expect(screen.getByText("Oi")).toBeInTheDocument();
  });

  it("deve renderizar de forma consistente com multiplos children", () => {
    render(
      <PageContainer>
        <h1>Resumo</h1>
        <p>Conteúdo principal</p>
        <button type="button">Ação</button>
      </PageContainer>,
    );

    expect(screen.getByRole("heading", { name: "Resumo" })).toBeInTheDocument();
    expect(screen.getByText("Conteúdo principal")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ação" })).toBeInTheDocument();
  });
});
