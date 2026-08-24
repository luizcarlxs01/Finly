import { ArrowRight, Cloud, Laptop, ShieldCheck } from "lucide-react";

import { homeClass } from "./home-styles";

export function SyncFeature() {
  return (
    <section className={homeClass("sync-section")} aria-labelledby="sync-title">
      <span className={homeClass("sync-grid")} aria-hidden="true" />
      <div className={homeClass("content-width", "sync-layout")}>
        <div className={homeClass("sync-copy")}>
          <p className={homeClass("eyebrow", "eyebrow-light")}>
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

          <div className={homeClass("privacy-note")}>
            <ShieldCheck aria-hidden="true" />
            <span>
              <strong>Você escolhe o momento.</strong>
              Simples desde o início, contínuo quando precisar.
            </span>
          </div>
        </div>

        <div className={homeClass("sync-flow")}>
          <article className={homeClass("sync-card", "sync-card-local")}>
            <div className={homeClass("sync-card-topline")}>
              <span className={homeClass("sync-card-icon")} aria-hidden="true">
                <Laptop />
              </span>
              <span className={homeClass("sync-status")}>
                <i aria-hidden="true" /> Local
              </span>
            </div>
            <span>No seu dispositivo</span>
            <strong>Comece agora, sem barreiras.</strong>
            <p>Registre e organize o essencial antes mesmo de criar uma conta.</p>
          </article>

          <div className={homeClass("sync-connector")} aria-hidden="true">
            <span />
            <ArrowRight />
            <span />
          </div>

          <article className={homeClass("sync-card", "sync-card-cloud")}>
            <div className={homeClass("sync-card-topline")}>
              <span className={homeClass("sync-card-icon")} aria-hidden="true">
                <Cloud />
              </span>
              <span className={homeClass("sync-status", "sync-status-ready")}>
                <i aria-hidden="true" /> Quando quiser
              </span>
            </div>
            <span>Sincronizado quando quiser</span>
            <strong>Continue de onde parou.</strong>
            <p>Leve sua visão financeira para outros dispositivos no seu tempo.</p>
          </article>
        </div>
      </div>
    </section>
  );
}
