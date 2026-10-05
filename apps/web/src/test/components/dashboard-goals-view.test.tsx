import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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

  it("shows the ghost only for an empty result and clamps a page after removal", async () => {
    const user = userEvent.setup();
    const entries = Array.from({ length: 6 }, (_, i) => goal(i + 1));
    const { container, rerender } = render(<DashboardGoalsView {...props} goals={entries} />);
    expect(container.querySelector(".lucide-ghost")).toBeNull();
    await user.click(screen.getByRole("button", { name: /^Pr.*xima p.*gina$/ }));
    await waitFor(() => expect(screen.getByRole("button", { name: /^Pr.*xima p.*gina$/ }).parentElement).toHaveTextContent(/^2$/));
    rerender(<DashboardGoalsView {...props} goals={entries.slice(1)} />);
    expect(screen.getByRole("button", { name: /^Pr.*xima p.*gina$/ }).parentElement).toHaveTextContent(/^1$/);
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(5);
    rerender(<DashboardGoalsView {...props} goals={[]} />);
    expect(container.querySelector(".lucide-ghost")).toBeInTheDocument();
    rerender(<DashboardGoalsView {...props} goals={[goal(1)]} />);
    expect(container.querySelector(".lucide-ghost")).toBeNull();
    await user.type(screen.getByRole("searchbox"), "no-match");
    expect(container.querySelector(".lucide-ghost")).toBeInTheDocument();
  });

  it("paginates after selecting the active tab and resets on page size change", async () => {
    const user = userEvent.setup();
    render(<DashboardGoalsView {...props} goals={[...goals, goal(6), goal(7)]} />);
    expect(screen.getByText("1–5")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Próxima página" }).parentElement).toHaveTextContent(/^1$/);
    expect(screen.queryByText("Meta 5")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Próxima página" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Próxima página" }).parentElement).toHaveTextContent(/^2$/));
    expect(screen.getByText("Meta 1")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Metas por página" }));
    await user.click(screen.getByRole("option", { name: "10 por página" }));
    expect(screen.getByText("Meta 4")).toBeInTheDocument();
    expect(screen.getByText("1–6")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Concluídas" }));
    expect(screen.getByText("Meta 5")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText("Meta 4")).not.toBeInTheDocument());
  });

  it("shows all current results without page controls and keeps search and tabs applied", async () => {
    const user = userEvent.setup();
    const rows = Array.from({ length: 17 }, (_, index) => goal(index + 1, { deadline: "2027-01-01", createdAt: "2026-09-01T12:00:00Z" }));
    render(<DashboardGoalsView {...props} goals={rows} />);
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(5);
    for (const size of [10, 15]) {
      await user.click(screen.getByRole("button", { name: "Metas por página" }));
      await user.click(screen.getByRole("option", { name: `${size} por página` }));
      expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(size);
    }
    await user.click(screen.getByRole("button", { name: "Metas por página" }));
    await user.click(screen.getByRole("option", { name: "Todas", exact: true }));
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(17);
    expect(screen.getByText("1–17")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Próxima página" })).not.toBeInTheDocument();
    await user.type(screen.getByRole("searchbox", { name: "Buscar metas" }), "Meta 17");
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(1);
    expect(screen.getByText("1–1")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Concluídas" }));
    expect(screen.queryByRole("heading", { level: 3 })).not.toBeInTheDocument();
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
    await waitFor(() => expect(screen.queryByText("Meta 4")).not.toBeInTheDocument());
    expect(filterButton.querySelector("span")).not.toBeNull();
    await user.click(filterButton);
    expect(screen.getByLabelText("Categoria")).toHaveValue("alimentacao");
    expect(screen.getByRole("button", { name: "Período específico" })).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: "Período específico" }));
    expect(screen.getByRole("button", { name: "Período específico" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.queryByLabelText("De")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Aplicar filtros" }));
    expect(screen.getByText("Meta 4")).toBeInTheDocument();
    await user.click(filterButton);
    await user.click(screen.getByRole("button", { name: "Limpar", exact: true }));
    expect(screen.getByLabelText("Categoria")).toHaveValue("");
    await user.click(screen.getByRole("button", { name: "Fechar filtros" }));
    expect(filterButton.querySelector("span")).toBeNull();
  });

  it("changes progress and value filters inside the panel without rendering badges", async () => {
    const user = userEvent.setup();
    render(<DashboardGoalsView {...props} />);
    const filterButton = screen.getByRole("button", { name: "Filtros" });
    await user.click(filterButton);
    await user.click(screen.getByRole("button", { name: "Mais distante de atingir" }));
    await user.click(screen.getByRole("button", { name: "Maior valor alvo" }));
    await user.click(screen.getByRole("button", { name: "Aplicar filtros" }));
    expect(screen.queryByRole("button", { name: /Remover filtro/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Limpar filtros" })).not.toBeInTheDocument();
    await user.click(filterButton);
    expect(screen.getByRole("button", { name: "Mais distante de atingir" })).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: "Mais distante de atingir" }));
    expect(screen.getByRole("button", { name: "Mais distante de atingir" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "Maior valor alvo" })).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: "Aplicar filtros" }));
    await user.click(filterButton);
    expect(screen.getByRole("button", { name: "Mais distante de atingir" })).toHaveAttribute("aria-pressed", "false");
    await user.click(screen.getByRole("button", { name: "Maior valor alvo" }));
    await user.click(screen.getByRole("button", { name: "Aplicar filtros" }));
    expect(filterButton.querySelector("span")).toBeNull();
  });

  it("clears all filters together", async () => {
    const user = userEvent.setup();
    render(<DashboardGoalsView {...props} />);
    const filterButton = screen.getByRole("button", { name: "Filtros" });
    await user.click(filterButton);
    await user.selectOptions(screen.getByLabelText("Categoria"), "alimentacao");
    await user.click(screen.getByRole("button", { name: "Aplicar filtros" }));
    await user.click(filterButton);
    await user.click(screen.getByRole("button", { name: "Limpar", exact: true }));
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
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Nova meta" })).not.toBeInTheDocument());
  });

  it("keeps creation open on failure and can reopen after animated cancellation", async () => {
    const user = userEvent.setup();
    const onAddGoal = vi.fn(async () => { throw new Error("Falha"); });
    render(<DashboardGoalsView {...props} onAddGoal={onAddGoal} createErrorMessage="Não foi possível criar a meta." />);
    const trigger = screen.getByRole("button", { name: "Nova meta" });
    await user.click(trigger);
    const dialog = screen.getByRole("dialog", { name: "Nova meta" });
    expect(within(dialog).queryByRole("button", { name: "Fechar formulário" })).not.toBeInTheDocument();
    await user.type(within(dialog).getByLabelText("Título"), "Reserva");
    await user.type(within(dialog).getByLabelText("Valor alvo"), "500");
    fireEvent.change(within(dialog).getByLabelText("Prazo"), { target: { value: "2099-12-31" } });
    await user.click(within(dialog).getByRole("button", { name: "Criar meta" }));
    expect(onAddGoal).toHaveBeenCalledOnce();
    expect(within(dialog).getByRole("alert")).toHaveTextContent("Não foi possível criar a meta.");
    expect(within(dialog).getByLabelText("Título")).toHaveValue("Reserva");
    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
    await user.click(trigger);
    expect(screen.getByRole("dialog", { name: "Nova meta" })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
});
