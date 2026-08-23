import { ArrowUpRight } from "lucide-react";
import { FinlyMark } from "@/components/finly-mark";

export function LandingHeader() {
  return (
    <header className="landing-header content-width">
      <nav className="landing-nav" aria-label="Navegação principal">
        <a className="brand-link" href="#inicio" aria-label="Finly, início">
          <FinlyMark />
        </a>

        <div className="nav-actions">
          <a className="nav-product-link" href="#produto">
            Produto
          </a>
          <a className="nav-app-link" href="https://app.finly.systems">
            Abrir o app
            <ArrowUpRight aria-hidden="true" />
          </a>
        </div>
      </nav>
    </header>
  );
}

