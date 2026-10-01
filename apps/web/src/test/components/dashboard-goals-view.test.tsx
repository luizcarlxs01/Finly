import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DashboardGoalsView } from "@/components/dashboard/views/dashboard-goals-view";
import type { Goal } from "@/types/goal";

const goal = (id: number, overrides: Partial<Goal> = {}): Goal => ({ id: String(id), title: `Meta ${id}`, targetAmount: 1000, currentAmount: 100, category: id % 2 ? "geral" : "alimentacao", deadline: `2027-01-0${id}`, createdAt: `2026-09-0${id}T12:00:00Z`, ...overrides });
const goals = [goal(1), goal(2), goal(3), goal(4), goal(5, { currentAmount: 1000 })];
const props = { goals, onAddGoal: vi.fn(async () => {}), onUpdateProgress: vi.fn(), onRemoveGoal: vi.fn(), onAddContribution: vi.fn(async () => {}), lastContributions: {} };

describe("DashboardGoalsView", () => {
  it("shows the no-match message only while searching or filtering existing goals", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<DashboardGoalsView {...props} goals={[]} />);
    expect(screen.queryByText(/Nenhuma meta/)).not.toBeInTheDocument();
    await user.type(screen.getByRole("searchbox", { name: "Buscar metas" }), "inexistente");
    expect(screen.queryByText(/Nenhuma meta/)).not.toBeInTheDocument();
    rerender(<DashboardGoalsView {...props} goals={[goal(1)]} />);
    expect(screen.getByText("Nenhuma meta corresponde à busca ou aos filtros.")).toBeInTheDocument();
    await user.clear(screen.getByRole("searchbox", { name: "Buscar metas" }));
    await user.click(screen.getByRole("button", { name: "Concluídas" }));
    expect(screen.queryByText(/Nenhuma meta/)).not.toBeInTheDocument();
  });

  it("paginates after selecting the active tab and resets on page size change", async () => {
    const user = userEvent.setup();
    render(<DashboardGoalsView {...props} />);
    expect(screen.getByText("1–3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Próxima página" }).parentElement).toHaveTextContent(/^1$/);
    expect(screen.queryByText("Meta 5")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Próxima página" }));
    expect(screen.getByRole("button", { name: "Próxima página" }).parentElement).toHaveTextContent(/^2$/);
    expect(screen.getByText("Meta 1")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Metas por página" }));
    await user.click(screen.getByRole("option", { name: "6 por página" }));
    expect(screen.getByText("Meta 4")).toBeInTheDocument();
    expect(screen.getByText("1–4")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Concluídas" }));
    expect(screen.getByText("Meta 5")).toBeInTheDocument();
    expect(screen.queryByText("Meta 4")).not.toBeInTheDocument();
  });

  it("combines category and date filters, validates range, and clears the applied indicator", async () => {
    const user = userEvent.setup();
    render(<DashboardGoalsView {...props} />);
    const filterButton = screen.getByRole("button", { name: "Filtros" });
    await user.click(filterButton);
    expect(filterButton.querySelector("span")).toBeNull();
    await user.selectOptions(screen.getByLabelText("Categoria"), "alimentacao");
    await user.click(screen.getByRole("button", { name: "Período específico" }));
    await user.click(screen.getByRole("button", { name: "Aplicar filtros" }));
    expect(screen.getByText(/Informe um período válido/)).toBeInTheDocument();
    await user.type(screen.getByLabelText("De"), "2027-01-02");
    await user.type(screen.getByLabelText("Até"), "2027-01-02");
    await user.click(screen.getByRole("button", { name: "Aplicar filtros" }));
    expect(screen.getByText("Meta 2")).toBeInTheDocument();
    expect(screen.queryByText("Meta 4")).not.toBeInTheDocument();
    expect(filterButton.querySelector("span")).not.toBeNull();
    await user.click(screen.getByRole("button", { name: /Remover filtro Prazo:/ }));
    expect(screen.getByText("Meta 4")).toBeInTheDocument();
    await user.click(filterButton);
    expect(screen.getByLabelText("Categoria")).toHaveValue("alimentacao");
    expect(screen.getByRole("button", { name: "Período específico" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.queryByLabelText("De")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Fechar filtros" }));
    await user.click(screen.getByRole("button", { name: "Remover filtro Alimentação" }));
    await user.click(filterButton);
    expect(screen.getByLabelText("Categoria")).toHaveValue("");
    await user.click(screen.getByRole("button", { name: "Fechar filtros" }));
    expect(filterButton.querySelector("span")).toBeNull();
  });

  it("removes progress and value filters independently", async () => {
    const user = userEvent.setup();
    render(<DashboardGoalsView {...props} />);
    const filterButton = screen.getByRole("button", { name: "Filtros" });
    await user.click(filterButton);
    await user.click(screen.getByRole("button", { name: "Mais distante de atingir" }));
    await user.click(screen.getByRole("button", { name: "Maior valor alvo" }));
    await user.click(screen.getByRole("button", { name: "Aplicar filtros" }));
    await user.click(screen.getByRole("button", { name: "Remover filtro Progresso: mais distante" }));
    expect(screen.getByRole("button", { name: "Remover filtro Valor: maior alvo" })).toBeInTheDocument();
    await user.click(filterButton);
    expect(screen.getByRole("button", { name: "Mais distante de atingir" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "Maior valor alvo" })).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: "Fechar filtros" }));
    await user.click(screen.getByRole("button", { name: "Remover filtro Valor: maior alvo" }));
    expect(filterButton.querySelector("span")).toBeNull();
  });

  it("clears all filters together", async () => {
    const user = userEvent.setup();
    render(<DashboardGoalsView {...props} />);
    const filterButton = screen.getByRole("button", { name: "Filtros" });
    await user.click(filterButton);
    await user.selectOptions(screen.getByLabelText("Categoria"), "alimentacao");
    await user.click(screen.getByRole("button", { name: "Aplicar filtros" }));
    await user.click(screen.getByRole("button", { name: "Limpar filtros" }));
    expect(filterButton.querySelector("span")).toBeNull();
  });

  it("opens and closes creation without moving the list, and submits through the existing callback", async () => {
    const user = userEvent.setup(); const onAddGoal = vi.fn(async () => {});
    render(<DashboardGoalsView {...props} onAddGoal={onAddGoal} />);
    await user.click(screen.getByRole("button", { name: "Nova meta" }));
    const dialog = screen.getByRole("dialog", { name: "Nova meta" });
    await user.type(within(dialog).getByLabelText("Título"), "Reserva");
    await user.type(within(dialog).getByLabelText("Valor alvo"), "500");
    fireEvent.change(within(dialog).getByLabelText("Prazo"), { target: { value: "2099-12-31" } });
    await user.click(within(dialog).getByRole("button", { name: "Criar meta" }));
    expect(onAddGoal).toHaveBeenCalledWith(expect.objectContaining({ title: "Reserva", targetAmount: 500 }));
    expect(screen.queryByRole("dialog", { name: "Nova meta" })).not.toBeInTheDocument();
  });
});
