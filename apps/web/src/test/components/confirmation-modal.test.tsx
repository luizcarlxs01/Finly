import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ConfirmationModal } from "@/components/ui/confirmation-modal";

function renderConfirmationModal(
  overrides: Partial<React.ComponentProps<typeof ConfirmationModal>> = {},
) {
  const props: React.ComponentProps<typeof ConfirmationModal> = {
    open: true,
    title: "Remover item",
    description: "Tem certeza que deseja continuar?",
    onConfirm: vi.fn(),
    onOpenChange: vi.fn(),
    ...overrides,
  };

  return {
    ...render(<ConfirmationModal {...props} />),
    props,
  };
}

describe("ConfirmationModal", () => {
  it("deve renderizar quando aberto com os dados principais", () => {
    renderConfirmationModal();

    expect(screen.getByText("Remover item")).toBeInTheDocument();
    expect(
      screen.getByText("Tem certeza que deseja continuar?"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Cancelar/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Confirmar/i })).toBeInTheDocument();
  });

  it("nao deve renderizar conteudo relevante quando estiver fechado", () => {
    renderConfirmationModal({ open: false });

    expect(screen.queryByText("Remover item")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Confirmar/i }),
    ).not.toBeInTheDocument();
  });

  it("deve disparar confirmar e cancelar corretamente", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();

    renderConfirmationModal({ onConfirm, onOpenChange });

    await user.click(screen.getByRole("button", { name: /Confirmar/i }));
    await user.click(screen.getByRole("button", { name: /Cancelar/i }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it("deve fechar pelo evento nativo de Escape e controlar o overflow do body", async () => {
    const onOpenChange = vi.fn();
    document.body.style.overflow = "auto";

    const { rerender } = render(
      <ConfirmationModal
        open
        title="Remover item"
        description="Tem certeza que deseja continuar?"
        onConfirm={vi.fn()}
        onOpenChange={onOpenChange}
      />,
    );

    expect(document.body.style.overflow).toBe("hidden");

    // Browsers translate Escape into the cancel event on a native dialog.
    fireEvent(screen.getByRole("dialog"), new Event("cancel", { cancelable: true }));

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));

    rerender(
      <ConfirmationModal
        open={false}
        title="Remover item"
        description="Tem certeza que deseja continuar?"
        onConfirm={vi.fn()}
        onOpenChange={onOpenChange}
      />,
    );

    expect(document.body.style.overflow).toBe("auto");
  });
});
