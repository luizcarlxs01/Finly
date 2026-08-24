import { ArrowRight, Cloud, Laptop, ShieldCheck } from "lucide-react";
import { ScrollReveal } from "@/components/scroll-reveal";

export function SyncFeature() {
  return (
    <section className="sync-section" aria-labelledby="sync-title">
      <span className="sync-grid" aria-hidden="true" />
      <ScrollReveal className="content-width sync-layout">
        <div className="sync-copy">
          <p className="eyebrow eyebrow-light">
            <span aria-hidden="true" />
            No seu ritmo
          </p>
          <h2
            id="sync-title"
            aria-label="Comece sem conta. Sincronize quando fizer sentido."
          >
            Comece sem conta.
            <span>Sincronize quando fizer sentido.</span>
          </h2>
          <p>
            Sem cadastro para dar o primeiro passo. Seus dados começam no seu
            dispositivo e a sincronização entra em cena quando você quiser
            continuar em qualquer lugar.
          </p>

          <div className="privacy-note">
            <ShieldCheck aria-hidden="true" />
            <span>
              <strong>Você escolhe o momento.</strong>
              Simples desde o início, contínuo quando precisar.
            </span>
          </div>
        </div>

        <div className="sync-flow">
          <article className="sync-card sync-card-local">
            <div className="sync-card-topline">
              <span className="sync-card-icon" aria-hidden="true">
                <Laptop />
              </span>
              <span className="sync-status">
                <i aria-hidden="true" /> Local
              </span>
            </div>
            <span>No seu dispositivo</span>
            <strong>Comece agora, sem barreiras.</strong>
            <p>Registre e organize o essencial antes mesmo de criar uma conta.</p>
          </article>

          <div className="sync-connector" aria-hidden="true">
            <span />
            <ArrowRight />
            <span />
          </div>

          <article className="sync-card sync-card-cloud">
            <div className="sync-card-topline">
              <span className="sync-card-icon" aria-hidden="true">
                <Cloud />
              </span>
              <span className="sync-status sync-status-ready">
                <i aria-hidden="true" /> Quando quiser
              </span>
            </div>
            <span>Sincronizado quando quiser</span>
            <strong>Continue de onde parou.</strong>
            <p>Leve sua visão financeira para outros dispositivos no seu tempo.</p>
          </article>
        </div>
      </ScrollReveal>
    </section>
  );
}
