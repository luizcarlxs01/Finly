import { beforeEach, describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ThemeToggle } from "@/components/layout/theme-toggle";

describe("ThemeToggle", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.className = "";
  });

  it("deve iniciar em modo claro por padrao e alternar para escuro", async () => {
    const user = userEvent.setup();

    render(<ThemeToggle />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Ativar modo escuro/i }),
      ).toBeInTheDocument();
    });
    expect(document.documentElement.classList.contains("dark")).toBe(false);

    await user.click(screen.getByRole("button", { name: /Ativar modo escuro/i }));

    expect(
      screen.getByRole("button", { name: /Ativar modo claro/i }),
    ).toBeInTheDocument();
    expect(window.localStorage.getItem("finly-theme")).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("deve ler o tema salvo e permitir retornar para claro", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem("finly-theme", "dark");

    render(<ThemeToggle />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Ativar modo claro/i }),
      ).toBeInTheDocument();
    });
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    await user.click(screen.getByRole("button", { name: /Ativar modo claro/i }));

    expect(
      screen.getByRole("button", { name: /Ativar modo escuro/i }),
    ).toBeInTheDocument();
    expect(window.localStorage.getItem("finly-theme")).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });
});
