"use client";

import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { MouseEvent } from "react";

import { homeClass } from "./home-styles";
import { ProductDashboard } from "./product-dashboard";

type LandingHeroProps = {
  onStartTransactions: () => void;
};

export function LandingHero({ onStartTransactions }: LandingHeroProps) {
  function handleProductScroll(event: MouseEvent<HTMLAnchorElement>) {
    const productSection = document.getElementById("produto");

    if (!productSection) {
      return;
    }

    event.preventDefault();
    const prefersReducedMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    productSection.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    });
  }

  return (
    <section
      className={homeClass("hero-shell")}
      id="inicio"
      aria-labelledby="hero-title"
    >
      <span
        className={homeClass("hero-orbit", "hero-orbit-one")}
        aria-hidden="true"
      />
      <span
        className={homeClass("hero-orbit", "hero-orbit-two")}
        aria-hidden="true"
      />

      <div className={homeClass("hero-layout", "content-width")}>
        <div className={homeClass("hero-copy")}>
          <p
            className={homeClass(
              "eyebrow",
              "hero-enter",
              "hero-enter-eyebrow",
            )}
          >
            <span aria-hidden="true" />
            Clareza para decidir melhor
          </p>
          <h1
            className={homeClass("hero-enter", "hero-enter-title")}
            id="hero-title"
            aria-label="Seu dinheiro. Mais claro todos os dias."
          >
            Seu dinheiro.
            <span>Mais claro todos os dias.</span>
          </h1>
          <p
            className={homeClass(
              "hero-support",
              "hero-enter",
              "hero-enter-support",
            )}
          >
            Acompanhe o que importa e registre seus lançamentos em poucos passos.
          </p>
          <div
            className={homeClass(
              "hero-actions",
              "hero-enter",
              "hero-enter-actions",
            )}
          >
            <button
              className={homeClass("button", "button-primary")}
              type="button"
              onClick={onStartTransactions}
              aria-label="Ir para a aba de lançamentos"
            >
              Ir para lançamentos
              <ArrowUpRight aria-hidden="true" />
            </button>
            <a
              className={homeClass("button", "button-secondary")}
              href="#produto"
              onClick={handleProductScroll}
            >
              Conhecer o Finly
              <ArrowDownRight aria-hidden="true" />
            </a>
          </div>
        </div>

        <ProductDashboard />
      </div>
    </section>
  );
}
