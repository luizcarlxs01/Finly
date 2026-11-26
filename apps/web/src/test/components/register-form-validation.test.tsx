import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { RegisterForm } from "@/components/auth/register-form";

it("rejects a whitespace-only name before requesting registration", async () => {
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  render(<RegisterForm onSubmit={onSubmit} />);
  fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "   " } });
  fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "qa@example.invalid" } });
  fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "Synthetic123!" } });
  fireEvent.submit(screen.getByRole("button", { name: "Criar conta" }).closest("form")!);
  expect(await screen.findByRole("alert")).toHaveTextContent("nome");
  expect(onSubmit).not.toHaveBeenCalled();
  expect(screen.getByLabelText("Senha")).toHaveValue("Synthetic123!");
});
