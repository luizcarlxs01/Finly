import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const gsapMocks = vi.hoisted(() => {
  const contextRevert = vi.fn();
  const mediaRevert = vi.fn();
  const registerPlugin = vi.fn();
  const set = vi.fn();
  const to = vi.fn();
  const timeline = { to };
  to.mockReturnValue(timeline);

  return {
    contextRevert,
    mediaRevert,
    registerPlugin,
    set,
    timeline,
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
      add: (_query: string, setup: () => void) => setup(),
      revert: gsapMocks.mediaRevert,
    }),
    registerPlugin: gsapMocks.registerPlugin,
    set: gsapMocks.set,
    timeline: () => gsapMocks.timeline,
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
});

describe("ProductJourney", () => {
  it("apresenta os quatro estados visuais do produto", () => {
    render(<ProductJourney />);

    expect(screen.getByText("Visão financeira")).toBeInTheDocument();
    expect(screen.getByText("Calendário")).toBeInTheDocument();
    expect(screen.getByText("Metas")).toBeInTheDocument();
    expect(screen.getByText("Insights")).toBeInTheDocument();
  });

  it("cria uma única timeline e limpa GSAP ao desmontar", () => {
    const { unmount } = render(<ProductJourney />);

    expect(gsapMocks.registerPlugin).toHaveBeenCalledTimes(1);
    expect(gsapMocks.to).toHaveBeenCalled();

    unmount();

    expect(gsapMocks.mediaRevert).toHaveBeenCalledTimes(1);
    expect(gsapMocks.contextRevert).toHaveBeenCalledTimes(1);
  });
});
