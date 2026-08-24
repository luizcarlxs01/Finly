import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { FinalCta } from "@/components/final-cta";
import { LandingHeader } from "@/components/landing-header";
import { ProductDashboard } from "@/components/product-dashboard";
import { ProductShowcase } from "@/components/product-showcase";
import { SyncFeature } from "@/components/sync-feature";

export default function Home() {
  return (
    <main className="page-shell">
      <section className="hero-shell" id="inicio" aria-labelledby="hero-title">
        <span className="hero-orbit hero-orbit-one" aria-hidden="true" />
        <span className="hero-orbit hero-orbit-two" aria-hidden="true" />
        <LandingHeader />

        <div className="hero-layout content-width">
          <div className="hero-copy">
            <p className="eyebrow hero-enter hero-enter-eyebrow">
              <span aria-hidden="true" />
              Clareza para decidir melhor
            </p>
            <h1
              className="hero-enter hero-enter-title"
              id="hero-title"
              aria-label="Seu dinheiro. Finalmente claro."
            >
              Seu dinheiro.
              <span>Finalmente claro.</span>
            </h1>
            <p className="hero-support hero-enter hero-enter-support">
              Organize, planeje e entenda suas finanças em um único lugar.
            </p>
            <div className="hero-actions hero-enter hero-enter-actions">
              <a
                className="button button-primary"
                href="https://app.finly.systems"
              >
                Começar agora
                <ArrowUpRight aria-hidden="true" />
              </a>
              <a className="button button-secondary" href="#produto">
                Conhecer o Finly
                <ArrowDownRight aria-hidden="true" />
              </a>
            </div>
          </div>

          <ProductDashboard />
        </div>
      </section>
      <ProductShowcase />
      <SyncFeature />
      <FinalCta />
    </main>
  );
}
