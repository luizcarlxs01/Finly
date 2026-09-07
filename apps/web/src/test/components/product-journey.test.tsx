import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const gsapMocks = vi.hoisted(() => {
  const contextRevert = vi.fn();
  const mediaAdd = vi.fn((_query: string, setup: () => void) => setup());
  const mediaRevert = vi.fn();
  const registerPlugin = vi.fn();
  const set = vi.fn();
  const to = vi.fn();
  const timeline = {
    scrollTrigger: { start: 100, end: 940 },
    to,
  };
  const timelineCreate = vi.fn(() => timeline);
  to.mockReturnValue(timeline);

  return {
    contextRevert,
    mediaAdd,
    mediaRevert,
    registerPlugin,
    set,
    timeline,
    timelineCreate,
    to,
  };
});

vi.mock("gsap", () => ({
  default: {
    context: (setup: () => void) => {
      setup();
      return { revert: gsapMocks.contextRevert };
    },
    matchMedia: () => ({
      add: gsapMocks.mediaAdd,
      revert: gsapMocks.mediaRevert,
    }),
    registerPlugin: gsapMocks.registerPlugin,
    set: gsapMocks.set,
    timeline: gsapMocks.timelineCreate,
    utils: {
      toArray: <T,>(selector: string, scope: ParentNode) =>
        Array.from(scope.querySelectorAll(selector)) as T[],
    },
  },
}));

vi.mock("gsap/ScrollTrigger", () => ({
  ScrollTrigger: { name: "ScrollTrigger" },
}));

import { ProductJourney } from "@/components/dashboard/home-landing/product-journey";

beforeEach(() => {
  vi.clearAllMocks();
  window.scrollTo = vi.fn();
});

describe("ProductJourney", () => {
  it("apresenta os quatro estados visuais do produto", () => {
    render(<ProductJourney />);

    expect(screen.getByText("Visão financeira")).toBeInTheDocument();
    expect(screen.getByText("Calendário")).toBeInTheDocument();
    expect(screen.getByText("Metas")).toBeInTheDocument();
    expect(screen.getByText("Insights")).toBeInTheDocument();
  });

  it("permite selecionar calendário, metas e insights pelos controles", async () => {
    const user = userEvent.setup();

    render(<ProductJourney />);

    const states = [
      { button: "Calendário", content: "Agosto de 2026" },
      { button: "Metas", content: "Metas em andamento" },
      { button: "Insights", content: "Leituras do seu mês" },
    ] as const;

    for (const state of states) {
      const control = screen.getByRole("button", { name: state.button });

      await user.click(control);

      expect(control).toHaveAttribute("aria-pressed", "true");
      expect(screen.getByText(state.content).closest("article")).toHaveAttribute(
        "data-active",
        "true",
      );
    }

    expect(window.scrollTo).toHaveBeenLastCalledWith({
      behavior: "smooth",
      top: 940,
    });
  });

  it("cria uma única timeline e limpa GSAP ao desmontar", () => {
    const { unmount } = render(<ProductJourney />);

    expect(gsapMocks.registerPlugin).toHaveBeenCalledTimes(1);
    expect(gsapMocks.to).toHaveBeenCalled();

    unmount();

    expect(gsapMocks.mediaRevert).toHaveBeenCalledTimes(1);
    expect(gsapMocks.contextRevert).toHaveBeenCalledTimes(1);
  });

  it("ativa a jornada em qualquer viewport desktop", () => {
    render(<ProductJourney />);

    expect(gsapMocks.mediaAdd).toHaveBeenCalledWith(
      "(min-width: 921px)",
      expect.any(Function),
    );
  });

  it("usa o pin fixo para manter a rolagem fluida no desktop", () => {
    render(<ProductJourney />);

    expect(gsapMocks.timelineCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        scrollTrigger: expect.objectContaining({ pinType: "fixed" }),
      }),
    );
  });
});
