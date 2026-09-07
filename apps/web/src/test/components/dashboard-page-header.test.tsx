import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";

describe("DashboardPageHeader", () => {
  it("renderiza titulo e descricao com a mesma hierarquia das abas", () => {
    render(
      <DashboardPageHeader
        title="Lançamentos"
        description="Cadastre e acompanhe suas movimentações."
      />,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Lançamentos" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Cadastre e acompanhe suas movimentações."),
    ).toBeInTheDocument();
  });
});
