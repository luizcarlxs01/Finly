import { ArrowUpRight } from "lucide-react";

import { FinlyMark } from "./finly-mark";
import { homeClass } from "./home-styles";

type FinalCtaProps = {
  onStartTransactions: () => void;
};

export function FinalCta({ onStartTransactions }: FinalCtaProps) {
  return (
    <section className={homeClass("closing-section")} aria-labelledby="closing-title">
      <div className={homeClass("content-width")}>
        <div className={homeClass("closing-card")}>
          <span
            className={homeClass("closing-light", "closing-light-one")}
            aria-hidden="true"
          />
          <span
            className={homeClass("closing-light", "closing-light-two")}
            aria-hidden="true"
          />
          <p>Seu próximo passo pode ser simples.</p>
          <h2
            id="closing-title"
            aria-label="Menos dúvida. Mais clareza para viver."
          >
            Menos dúvida.
            <span>Mais clareza para viver.</span>
          </h2>
          <button
            className={homeClass("button", "closing-button")}
            type="button"
            onClick={onStartTransactions}
            aria-label="Ir para a aba de lançamentos"
          >
            Ir para lançamentos
            <ArrowUpRight aria-hidden="true" />
          </button>
        </div>

        <footer className={homeClass("landing-footer")}>
          <FinlyMark />
          <p>Clareza financeira, todos os dias.</p>
          <span>© 2026 Finly</span>
        </footer>
      </div>
    </section>
  );
}
