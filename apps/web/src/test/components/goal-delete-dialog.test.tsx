import { useRef, useState } from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GoalDeleteDialog } from "@/components/dashboard/goal-delete-dialog";
import type { Goal } from "@/types/goal";

const goal: Goal = { id: "reserve", title: "Reserva de emergência", currentAmount: 100, targetAmount: 1000, category: "geral", createdAt: "2026-10-01" };

function Host({ selected = goal, onConfirm, errorMessage }: { selected?: Goal; onConfirm: () => Promise<void>; errorMessage?: string }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  return <>
    <button ref={triggerRef} onClick={() => setOpen(true)}>Abrir confirmação</button>
    {open && <GoalDeleteDialog key={selected.id} goal={selected} triggerRef={triggerRef} isSubmitting={false} errorMessage={errorMessage} onConfirm={onConfirm} onClose={() => setOpen(false)} />}
  </>;
}

describe("GoalDeleteDialog", () => {
  beforeEach(() => {
    vi.stubGlobal("matchMedia", vi.fn((query: string) => ({ matches: query.includes("prefers-reduced-motion"), media: query, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  });
  afterEach(() => vi.unstubAllGlobals());

  it("cancels by button, Escape and backdrop without deleting, resets on reopen and restores focus", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn(async () => {});
    render(<Host onConfirm={onConfirm} />);
    const trigger = screen.getByRole("button", { name: "Abrir confirmação" });
    for (const method of ["cancel", "escape", "backdrop"]) {
      await user.click(trigger);
      const dialog = screen.getByRole("dialog", { name: "Remover meta" });
      expect(screen.getByText(goal.title)).toBeInTheDocument();
      expect(screen.queryByText(/Tem certeza/)).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Cancelar" })).toHaveFocus();
      await user.click(screen.getByRole("button", { name: "Remover meta" }));
      expect(onConfirm).not.toHaveBeenCalled();
      expect(screen.getByRole("button", { name: "Confirmar exclusão" })).toBeEnabled();
      if (method === "cancel") await user.click(screen.getByRole("button", { name: "Cancelar" }));
      else if (method === "escape") await user.keyboard("{Escape}");
      else fireEvent.mouseDown(dialog.parentElement!);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(trigger).toHaveFocus();
    }
    expect(onConfirm).not.toHaveBeenCalled();
    await user.click(trigger);
    expect(screen.getByRole("button", { name: "Remover meta" })).toBeEnabled();
  });

  it("requires two keyboard confirmations and blocks duplicate requests until completion", async () => {
    const user = userEvent.setup();
    let resolve!: () => void;
    const request = new Promise<void>(done => { resolve = done; });
    const onConfirm = vi.fn(() => request);
    render(<Host onConfirm={onConfirm} />);
    await user.click(screen.getByRole("button", { name: "Abrir confirmação" }));
    await user.tab();
    expect(screen.getByRole("button", { name: "Remover meta" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(onConfirm).not.toHaveBeenCalled();
    await user.keyboard("{Enter}");
    expect(onConfirm).toHaveBeenCalledTimes(1);
    const pending = screen.getByRole("button", { name: "Removendo..." });
    expect(pending).toBeDisabled();
    fireEvent.click(pending);
    expect(onConfirm).toHaveBeenCalledTimes(1);
    await act(async () => resolve());
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("keeps errors visible after failure and hides stale errors on reopening", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn(async () => { throw new Error("Falha"); });
    render(<Host onConfirm={onConfirm} errorMessage="Não foi possível remover a meta agora." />);
    const trigger = screen.getByRole("button", { name: "Abrir confirmação" });
    await user.click(trigger);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Remover meta" }));
    await user.click(screen.getByRole("button", { name: "Confirmar exclusão" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível remover a meta agora.");
    expect(screen.getByRole("button", { name: "Confirmar exclusão" })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    await user.click(trigger);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remover meta" })).toBeEnabled();
  });

  it("starts unarmed when another goal is selected", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn(async () => {});
    const { rerender } = render(<Host onConfirm={onConfirm} />);
    await user.click(screen.getByRole("button", { name: "Abrir confirmação" }));
    await user.click(screen.getByRole("button", { name: "Remover meta" }));
    rerender(<Host onConfirm={onConfirm} selected={{ ...goal, id: "trip", title: "Viagem" }} />);
    expect(screen.getByText("Viagem")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remover meta" })).toBeEnabled();
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
