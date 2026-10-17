import { useRef, useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GoalEditDialog } from "@/components/dashboard/goal-edit-dialog";
const goal = { id: "g1", title: "Reserva", currentAmount: 200, targetAmount: 1000, category: "general", deadline: "2026-12-20", createdAt: "2026-10-01T12:00:00Z" };
function Host({ save }: { save: (input: { id: string; currentAmount: number }) => Promise<void> }) {
  const [open, setOpen] = useState(false), trigger = useRef<HTMLButtonElement>(null);
  return <><button ref={trigger} onClick={() => setOpen(true)}>Editar</button>{open && <GoalEditDialog goal={goal} triggerRef={trigger} onSave={save} onClose={() => setOpen(false)} />}</>;
}
beforeEach(() => { const original = window.matchMedia;vi.spyOn(window, "matchMedia").mockImplementation(query => ({ ...original(query), matches: true })); });
afterEach(() => vi.restoreAllMocks());
describe("Editar valor atual", () => {
  it("mostra apenas o valor atual e o substitui, aceitando zero", async () => {
    const save = vi.fn(async () => {});render(<Host save={save} />);
    await userEvent.click(screen.getByRole("button", { name: "Editar" }));
    expect(screen.getByLabelText("Valor atual")).toHaveValue("200");
    expect(screen.getAllByRole("textbox")).toHaveLength(1);
    expect(screen.queryByLabelText("Título")).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.getByText("Reserva")).toBeInTheDocument();
    await userEvent.clear(screen.getByLabelText("Valor atual"));
    await userEvent.type(screen.getByLabelText("Valor atual"), "0");
    await userEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));
    expect(save).toHaveBeenCalledWith({ id: "g1", currentAmount: 0 });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
  it("valida o valor e aceita moeda decimal brasileira", async () => {
    const save = vi.fn(async () => {});render(<Host save={save} />);await userEvent.click(screen.getByRole("button", { name: "Editar" }));
    for (const invalid of ["", "-1", "Infinity", "abc"]) {
      await userEvent.clear(screen.getByLabelText("Valor atual"));if(invalid)await userEvent.type(screen.getByLabelText("Valor atual"), invalid);
      await userEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));expect(screen.getByRole("alert")).toHaveTextContent("valor atual válido");
    }
    expect(save).not.toHaveBeenCalled();
    await userEvent.clear(screen.getByLabelText("Valor atual"));await userEvent.type(screen.getByLabelText("Valor atual"), "1.234,56");
    await userEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));expect(save).toHaveBeenCalledWith({ id: "g1", currentAmount: 1234.56 });
  });
  it.each(["Cancelar", "Escape", "fundo"])("descarta as alterações por %s e reabre com o valor salvo", async method => {
    const save = vi.fn(async () => {});render(<Host save={save} />);await userEvent.click(screen.getByRole("button", { name: "Editar" }));
    await userEvent.clear(screen.getByLabelText("Valor atual"));await userEvent.type(screen.getByLabelText("Valor atual"), "80");
    if(method === "Cancelar")await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));else if(method === "Escape")await userEvent.keyboard("{Escape}");else await userEvent.pointer({ target: screen.getByRole("dialog").parentElement!, keys: "[MouseLeft]" });
    expect(save).not.toHaveBeenCalled();expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Editar" }));expect(screen.getByLabelText("Valor atual")).toHaveValue("200");
  });
});
