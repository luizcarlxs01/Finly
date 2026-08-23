import { CalendarRange, Eye, Lightbulb, MoveUpRight } from "lucide-react";

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
      className="product-section"
      id="produto"
      aria-labelledby="product-title"
    >
      <div className="content-width">
        <div className="product-heading">
          <p className="eyebrow">
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

        <div className="benefit-list">
          {benefits.map((benefit) => {
            const Icon = benefit.icon;

            return (
              <article className="benefit-item" key={benefit.number}>
                <span className="benefit-number">{benefit.number}</span>
                <span className="benefit-icon" aria-hidden="true">
                  <Icon />
                </span>
                <div>
                  <h3>{benefit.title}</h3>
                  <p>{benefit.description}</p>
                </div>
                <MoveUpRight className="benefit-arrow" aria-hidden="true" />
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
