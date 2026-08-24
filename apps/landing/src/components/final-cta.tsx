import { ArrowUpRight } from "lucide-react";
import { FinlyMark } from "@/components/finly-mark";
import { ScrollReveal } from "@/components/scroll-reveal";

export function FinalCta() {
  return (
    <section className="closing-section" aria-labelledby="closing-title">
      <ScrollReveal className="content-width">
        <div className="closing-card">
          <span className="closing-light closing-light-one" aria-hidden="true" />
          <span className="closing-light closing-light-two" aria-hidden="true" />
          <p>Seu próximo passo pode ser simples.</p>
          <h2
            id="closing-title"
            aria-label="Menos dúvida. Mais clareza para viver."
          >
            Menos dúvida.
            <span>Mais clareza para viver.</span>
          </h2>
          <a
            className="button closing-button"
            href="https://app.finly.systems"
          >
            Começar agora
            <ArrowUpRight aria-hidden="true" />
          </a>
        </div>

        <footer className="landing-footer">
          <FinlyMark />
          <p>Clareza financeira, todos os dias.</p>
          <span>© 2026 Finly</span>
        </footer>
      </ScrollReveal>
    </section>
  );
}
