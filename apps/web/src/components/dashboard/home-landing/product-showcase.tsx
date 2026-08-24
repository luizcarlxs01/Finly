import { CalendarRange, Eye, Lightbulb, MoveUpRight } from "lucide-react";

import { homeClass } from "./home-styles";
import { ProductJourney } from "./product-journey";
import { ScrollReveal } from "./scroll-reveal";

const benefits = [
  {
    number: "01",
    title: "Veja o presente",
    description: "Saldo, entradas e saídas com leitura imediata.",
    icon: Eye,
  },
  {
    number: "02",
    title: "Planeje o próximo passo",
    description: "Projeções e metas organizadas no mesmo fluxo.",
    icon: CalendarRange,
  },
  {
    number: "03",
    title: "Entenda seus hábitos",
    description: "Sinais simples para escolhas financeiras mais conscientes.",
    icon: Lightbulb,
  },
] as const;

export function ProductShowcase() {
  return (
    <section
      className={homeClass("product-section")}
      id="produto"
      aria-labelledby="product-title"
    >
      <ScrollReveal className={homeClass("content-width")}>
        <div className={homeClass("product-heading")}>
          <p className={homeClass("eyebrow")}>
            <span aria-hidden="true" />
            Uma visão, menos ruído
          </p>
          <h2
            id="product-title"
            aria-label="Tudo o que importa. Sem complicar o que é simples."
          >
            Tudo o que importa.
            <span>Sem complicar o que é simples.</span>
          </h2>
          <p>
            O Finly transforma números espalhados em uma visão que faz sentido.
            Você entende onde está e enxerga com confiança para onde vai.
          </p>
        </div>

        <div className={homeClass("product-experience")}>
          <ProductJourney />

          <div className={homeClass("benefit-list")}>
            {benefits.map((benefit) => {
              const Icon = benefit.icon;

              return (
                <article className={homeClass("benefit-item")} key={benefit.number}>
                  <span className={homeClass("benefit-number")}>{benefit.number}</span>
                  <span className={homeClass("benefit-icon")} aria-hidden="true">
                    <Icon />
                  </span>
                  <div>
                    <h3>{benefit.title}</h3>
                    <p>{benefit.description}</p>
                  </div>
                  <MoveUpRight
                    className={homeClass("benefit-arrow")}
                    aria-hidden="true"
                  />
                </article>
              );
            })}
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
