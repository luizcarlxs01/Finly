# Finly Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar uma landing page pública premium do Finly em `apps/landing`, independente das aplicações existentes e pronta para futura publicação separada na Vercel.

**Architecture:** Uma aplicação Next.js 16 com App Router e Server Components compõe quatro seções estáticas a partir de componentes focados. Tailwind CSS 4 fornece a base utilitária e `globals.css` concentra tokens, efeitos visuais, responsividade e movimento reduzido; não há API, estado de cliente ou dependências de animação.

**Tech Stack:** Next.js 16.1.6, React 19.2.3, TypeScript 5, Tailwind CSS 4, Lucide React 0.577, Vitest 4, Testing Library e ESLint 9.

**Spec:** `docs/superpowers/specs/2026-08-23-finly-landing-design.md`

## Global Constraints

- Criar todos os arquivos de produto dentro de `apps/landing`.
- Não modificar `apps/web`, `apps/api`, `apps/mobile`, Docker, infraestrutura, VPS, Traefik, banco de dados, autenticação ou regras financeiras.
- Manter exatamente a headline “Seu dinheiro. Finalmente claro.” e o apoio “Organize, planeje e entenda suas finanças em um único lugar.”.
- Usar “Começar agora” com destino `https://app.finly.systems` e “Conhecer o Finly” com destino `#produto`.
- Usar `#1a75ff`, `#031533`, `#7eb0f2`, `#f4f7fb`, `#d0dff2` e `#4f698d` como base cromática.
- Construir o dashboard fictício somente com HTML, CSS e Lucide React.
- Não instalar GSAP, Three.js, Framer Motion ou qualquer biblioteca de animação.
- Não usar imagens de banco, vídeo, WebGL, canvas ou pipelines externos de mídia.
- Respeitar `prefers-reduced-motion`, navegação por teclado e layouts desktop, tablet e mobile.
- Não configurar domínio, projeto Vercel ou infraestrutura nesta etapa.

---

### Task 1: Scaffold independente e ambiente de testes

**Files:**
- Create: `apps/landing/.gitignore`
- Create: `apps/landing/package.json`
- Create: `apps/landing/package-lock.json`
- Create: `apps/landing/next-env.d.ts`
- Create: `apps/landing/next.config.ts`
- Create: `apps/landing/postcss.config.mjs`
- Create: `apps/landing/eslint.config.mjs`
- Create: `apps/landing/tsconfig.json`
- Create: `apps/landing/vitest.config.ts`
- Create: `apps/landing/src/test/setup.ts`
- Create: `apps/landing/src/app/layout.tsx`
- Create: `apps/landing/src/app/globals.css`
- Create: `apps/landing/src/app/page.tsx`

**Interfaces:**
- Consumes: versões e convenções de configuração observadas em `apps/web`.
- Produces: alias `@/*`, scripts `dev`, `build`, `start`, `lint`, `typecheck` e `test:run`; ambiente jsdom; rota `/` renderizável.

- [ ] **Step 1: Criar manifesto e configurações isoladas**

Use o seguinte manifesto mínimo, mantendo apenas dependências realmente usadas pela landing:

```json
{
  "name": "landing",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "typecheck": "tsc --noEmit",
    "test:run": "vitest run"
  },
  "dependencies": {
    "lucide-react": "^0.577.0",
    "next": "16.1.6",
    "react": "19.2.3",
    "react-dom": "19.2.3"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^16.3.2",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.1.6",
    "jsdom": "^29.0.1",
    "tailwindcss": "^4",
    "typescript": "^5",
    "vitest": "^4.1.2"
  }
}
```

Proteja dependências, saídas do Next.js e arquivos locais de ambiente:

```gitignore
node_modules/
.next/
out/
coverage/
.env*
!.env.example
*.tsbuildinfo
```

Use o mesmo `next.config.ts`, `postcss.config.mjs` e `eslint.config.mjs` de `apps/web`. Configure TypeScript estrito com `baseUrl: "."`, alias `@/*` para `./src/*` e tipos de Vitest. Configure Vitest com React, jsdom, setup e alias:

```ts
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: true,
  },
});
```

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 2: Instalar dependências e gerar o lockfile local**

Run: `cd apps/landing && npm install`

Expected: `apps/landing/package-lock.json` criado e instalação concluída com exit code 0.

- [ ] **Step 3: Criar o shell mínimo renderizável**

Crie `layout.tsx` com idioma `pt-BR`, metadados do Finly e fonte `Manrope` via `next/font/google`. Crie `globals.css` com Tailwind e reset mínimo. A página inicial temporária deve apenas retornar `<main>Finly</main>` para provar o scaffold antes do ciclo de comportamento.

```tsx
import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });

export const metadata: Metadata = {
  title: "Finly — Seu dinheiro. Finalmente claro.",
  description: "Organize, planeje e entenda suas finanças em um único lugar.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={manrope.variable}>{children}</body>
    </html>
  );
}
```

- [ ] **Step 4: Verificar o scaffold**

Run: `cd apps/landing && npm run typecheck && npm run lint`

Expected: ambos os comandos terminam com exit code 0.

- [ ] **Step 5: Commit do scaffold**

```bash
git add apps/landing
git commit -m "chore: scaffold landing app"
```

### Task 2: Hero, navegação e identidade base

**Files:**
- Create: `apps/landing/src/app/page.test.tsx`
- Create: `apps/landing/src/components/finly-mark.tsx`
- Create: `apps/landing/src/components/landing-header.tsx`
- Modify: `apps/landing/src/app/page.tsx`
- Modify: `apps/landing/src/app/globals.css`

**Interfaces:**
- Consumes: rota `/`, alias `@/*` e tokens globais da Task 1.
- Produces: `FinlyMark`, `LandingHeader` e hero sem estado de cliente; links com contratos de destino exatos.

- [ ] **Step 1: Escrever o teste que protege a proposta e os CTAs**

O bug que este teste captura é remover ou alterar a mensagem principal e os destinos de navegação.

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";

describe("Finly landing page", () => {
  it("presents the exact hero promise and CTA destinations", () => {
    render(<Home />);

    expect(screen.getByRole("heading", { level: 1, name: "Seu dinheiro. Finalmente claro." })).toBeInTheDocument();
    expect(screen.getByText("Organize, planeje e entenda suas finanças em um único lugar.")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Começar agora" })[0]).toHaveAttribute("href", "https://app.finly.systems");
    expect(screen.getByRole("link", { name: "Conhecer o Finly" })).toHaveAttribute("href", "#produto");
  });

  it("provides a semantic main navigation and a single primary heading", () => {
    render(<Home />);

    expect(screen.getByRole("navigation", { name: "Navegação principal" })).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Rodar o teste e confirmar a falha esperada**

Run: `cd apps/landing && npm run test:run -- src/app/page.test.tsx`

Expected: FAIL porque o shell inicial ainda não contém o `h1` solicitado.

- [ ] **Step 3: Implementar marca, cabeçalho e hero**

`FinlyMark` deve expor `className?: string` e renderizar um pequeno símbolo CSS seguido do texto Finly. `LandingHeader` deve conter `<nav aria-label="Navegação principal">`, a marca, um link para `#produto` e um link “Abrir o app” para `https://app.finly.systems`. A página deve usar estes componentes e os dois CTAs do hero.

```tsx
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { LandingHeader } from "@/components/landing-header";

export default function Home() {
  return (
    <main>
      <section className="hero-shell" aria-labelledby="hero-title">
        <LandingHeader />
        <div className="hero-copy">
          <p className="eyebrow">Clareza para decidir melhor</p>
          <h1 id="hero-title">Seu dinheiro. <span>Finalmente claro.</span></h1>
          <p className="hero-support">Organize, planeje e entenda suas finanças em um único lugar.</p>
          <div className="hero-actions">
            <a className="button button-primary" href="https://app.finly.systems">
              Começar agora <ArrowUpRight aria-hidden="true" />
            </a>
            <a className="button button-secondary" href="#produto">
              Conhecer o Finly <ArrowDownRight aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
```

Adicione os tokens globais e estilos essenciais:

```css
@import "tailwindcss";

:root {
  --finly-blue: #1a75ff;
  --finly-navy: #031533;
  --finly-sky: #7eb0f2;
  --finly-canvas: #f4f7fb;
  --finly-border: #d0dff2;
  --finly-muted: #4f698d;
  --finly-white: #ffffff;
}

html { scroll-behavior: smooth; }
body {
  margin: 0;
  color: var(--finly-navy);
  background: var(--finly-canvas);
  font-family: var(--font-manrope), sans-serif;
}
```

- [ ] **Step 4: Rodar o teste e confirmar o comportamento**

Run: `cd apps/landing && npm run test:run -- src/app/page.test.tsx`

Expected: PASS com 2 testes aprovados.

- [ ] **Step 5: Commit da primeira dobra**

```bash
git add apps/landing/src
git commit -m "feat: add landing hero"
```

### Task 3: Showcase e dashboard fictício

**Files:**
- Create: `apps/landing/src/components/product-dashboard.tsx`
- Create: `apps/landing/src/components/product-showcase.tsx`
- Modify: `apps/landing/src/app/page.test.tsx`
- Modify: `apps/landing/src/app/page.tsx`
- Modify: `apps/landing/src/app/globals.css`

**Interfaces:**
- Consumes: composição da home e tokens visuais da Task 2.
- Produces: `ProductDashboard` sem propriedades e `ProductShowcase` com seção `id="produto"`.

- [ ] **Step 1: Escrever o teste do showcase**

O bug que este teste captura é entregar uma seção de produto sem os indicadores que tornam o mockup reconhecível como Finly.

```tsx
it("shows a product dashboard with representative financial indicators", () => {
  const { container } = render(<Home />);

  expect(container.querySelector("#produto")).toBeInTheDocument();
  expect(screen.getByRole("heading", { level: 2, name: /tudo o que importa/i })).toBeInTheDocument();
  expect(screen.getByText("Saldo atual")).toBeInTheDocument();
  expect(screen.getByText("Entradas")).toBeInTheDocument();
  expect(screen.getByText("Saídas")).toBeInTheDocument();
  expect(screen.getByText("Saldo projetado")).toBeInTheDocument();
  expect(screen.getByText("Reserva de tranquilidade")).toBeInTheDocument();
});
```

- [ ] **Step 2: Rodar o teste e confirmar a falha esperada**

Run: `cd apps/landing && npm run test:run -- src/app/page.test.tsx`

Expected: FAIL porque `#produto` e os indicadores ainda não existem.

- [ ] **Step 3: Implementar o dashboard e sua narrativa**

Use `WalletCards`, `TrendingUp`, `ArrowUpRight`, `ArrowDownRight` e `Target` por importações nomeadas de `lucide-react`. O dashboard deve renderizar dados literais e demonstrativos:

```tsx
const summary = [
  { label: "Entradas", value: "R$ 8.420", trend: "+12%", tone: "positive" },
  { label: "Saídas", value: "R$ 4.180", trend: "-4%", tone: "neutral" },
  { label: "Saldo projetado", value: "R$ 6.890", trend: "+R$ 640", tone: "positive" },
] as const;

const chartBars = [42, 58, 51, 68, 62, 78, 88] as const;

export function ProductDashboard() {
  return (
    <div className="dashboard" aria-label="Exemplo visual do painel financeiro Finly">
      <div className="dashboard-topbar"><span>Visão geral</span><span>Agosto</span></div>
      <section className="balance-card">
        <span>Saldo atual</span>
        <strong>R$ 12.480,00</strong>
        <small>Atualizado agora</small>
      </section>
      <div className="summary-grid">
        {summary.map((item) => (
          <article className={`summary-card ${item.tone}`} key={item.label}>
            <span>{item.label}</span><strong>{item.value}</strong><small>{item.trend}</small>
          </article>
        ))}
      </div>
      <div className="dashboard-detail-grid">
        <section className="chart-card" aria-label="Evolução financeira demonstrativa">
          <div className="chart-bars" aria-hidden="true">
            {chartBars.map((height, index) => (
              <span key={`${height}-${index}`} style={{ height: `${height}%` }} />
            ))}
          </div>
        </section>
        <section className="goal-card">
          <span>Meta financeira</span><strong>Reserva de tranquilidade</strong><div className="goal-progress"><span /></div><small>68% concluída</small>
        </section>
      </div>
    </div>
  );
}
```

`ProductShowcase` deve combinar uma coluna editorial com três benefícios curtos e o dashboard em uma moldura com perspectiva discreta. Adicione `<ProductShowcase />` logo após o hero.

- [ ] **Step 4: Estilizar profundidade e adaptação do mockup**

Implemente `.dashboard-stage`, `.dashboard`, `.summary-grid`, `.dashboard-detail-grid`, `.chart-card` e `.goal-card` com bordas `rgba(208, 223, 242, .8)`, sombras azuis suaves e `font-variant-numeric: tabular-nums`. Em larguras abaixo de `760px`, use uma coluna e oculte somente detalhes decorativos, mantendo todos os rótulos testados.

```css
.dashboard {
  border: 1px solid rgba(208, 223, 242, 0.8);
  border-radius: 1.75rem;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 32px 80px rgba(3, 21, 51, 0.14);
  font-variant-numeric: tabular-nums;
}

@media (max-width: 760px) {
  .summary-grid,
  .dashboard-detail-grid { grid-template-columns: 1fr; }
}
```

- [ ] **Step 5: Rodar o teste e confirmar o comportamento**

Run: `cd apps/landing && npm run test:run -- src/app/page.test.tsx`

Expected: PASS com 3 testes aprovados.

- [ ] **Step 6: Commit do showcase**

```bash
git add apps/landing/src
git commit -m "feat: add product showcase"
```

### Task 4: Diferencial local-first e CTA final

**Files:**
- Create: `apps/landing/src/components/sync-feature.tsx`
- Create: `apps/landing/src/components/final-cta.tsx`
- Modify: `apps/landing/src/app/page.test.tsx`
- Modify: `apps/landing/src/app/page.tsx`
- Modify: `apps/landing/src/app/globals.css`

**Interfaces:**
- Consumes: marca, botões e layout de seções das Tasks 2 e 3.
- Produces: `SyncFeature` e `FinalCta`, sem propriedades e sem estado de cliente.

- [ ] **Step 1: Escrever os testes de narrativa e fechamento**

O primeiro teste captura a regressão de exigir conta antes do uso; o segundo protege a repetição do CTA de conversão no fechamento.

```tsx
it("explains that an account is optional until the user chooses to sync", () => {
  render(<Home />);

  expect(screen.getByRole("heading", { level: 2, name: /comece sem conta/i })).toBeInTheDocument();
  expect(screen.getByText("No seu dispositivo")).toBeInTheDocument();
  expect(screen.getByText("Sincronizado quando quiser")).toBeInTheDocument();
});

it("ends with a second direct link to the Finly app", () => {
  render(<Home />);

  const primaryLinks = screen.getAllByRole("link", { name: "Começar agora" });
  expect(primaryLinks).toHaveLength(2);
  expect(primaryLinks[1]).toHaveAttribute("href", "https://app.finly.systems");
  expect(screen.getByRole("contentinfo")).toBeInTheDocument();
});
```

- [ ] **Step 2: Rodar os testes e confirmar as falhas esperadas**

Run: `cd apps/landing && npm run test:run -- src/app/page.test.tsx`

Expected: FAIL porque a narrativa local-first e o segundo CTA ainda não existem.

- [ ] **Step 3: Implementar as duas seções finais**

`SyncFeature` deve usar `Laptop`, `Cloud` e `ArrowRight`; seus dois cards devem ser ligados por um elemento decorativo oculto para leitores de tela. `FinalCta` deve reutilizar `FinlyMark`, conter o segundo “Começar agora” e um rodapé mínimo com `© 2026 Finly`.

```tsx
export function SyncFeature() {
  return (
    <section className="sync-section" aria-labelledby="sync-title">
      <div className="section-copy">
        <p className="eyebrow">No seu ritmo</p>
        <h2 id="sync-title">Comece sem conta. Sincronize quando fizer sentido.</h2>
        <p>Seus primeiros passos ficam simples e privados. Quando quiser continuidade entre dispositivos, a sincronização está pronta.</p>
      </div>
      <div className="sync-flow">
        <article><span>No seu dispositivo</span><strong>Comece agora, sem barreiras.</strong></article>
        <span className="sync-connector" aria-hidden="true" />
        <article><span>Sincronizado quando quiser</span><strong>Continue de onde parou.</strong></article>
      </div>
    </section>
  );
}
```

Na home, componha a ordem final:

```tsx
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { FinalCta } from "@/components/final-cta";
import { LandingHeader } from "@/components/landing-header";
import { ProductShowcase } from "@/components/product-showcase";
import { SyncFeature } from "@/components/sync-feature";

export default function Home() {
  return (
    <main>
      <section className="hero-shell" aria-labelledby="hero-title">
        <LandingHeader />
        <div className="hero-copy">
          <p className="eyebrow">Clareza para decidir melhor</p>
          <h1 id="hero-title">Seu dinheiro. <span>Finalmente claro.</span></h1>
          <p className="hero-support">Organize, planeje e entenda suas finanças em um único lugar.</p>
          <div className="hero-actions">
            <a className="button button-primary" href="https://app.finly.systems">
              Começar agora <ArrowUpRight aria-hidden="true" />
            </a>
            <a className="button button-secondary" href="#produto">
              Conhecer o Finly <ArrowDownRight aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>
      <ProductShowcase />
      <SyncFeature />
      <FinalCta />
    </main>
  );
}
```

- [ ] **Step 4: Rodar os testes e confirmar o comportamento**

Run: `cd apps/landing && npm run test:run -- src/app/page.test.tsx`

Expected: PASS com 5 testes aprovados.

- [ ] **Step 5: Commit das seções finais**

```bash
git add apps/landing/src
git commit -m "feat: complete landing narrative"
```

### Task 5: Acabamento visual, responsividade e acessibilidade

**Files:**
- Modify: `apps/landing/src/app/globals.css`

**Interfaces:**
- Consumes: todos os componentes estáticos das Tasks 2–4.
- Produces: foco visível, animações CSS moderadas e layout fluido entre 320px e telas largas.

- [ ] **Step 1: Completar foco e movimento reduzido**

Garanta `aria-label="Navegação principal"` no `nav`, `aria-hidden="true"` em ícones decorativos e `<footer>` no encerramento. Adicione estilos de foco e desativação de movimento:

```css
:where(a, button):focus-visible {
  outline: 3px solid rgba(26, 117, 255, 0.35);
  outline-offset: 4px;
}

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 2: Finalizar composição visual e breakpoints**

Use `clamp()` para títulos, `min()` para containers e breakpoints em `1080px`, `760px` e `480px`. Crie apenas animações `hero-reveal` e `dashboard-float`, fundos radiais, textura com gradiente CSS, estados hover/focus e `overflow-x: clip`. Mantenha pelo menos 44px de altura nos links que parecem botões.

```css
.page-shell { overflow-x: clip; }
.content-width { width: min(1180px, calc(100% - 2rem)); margin-inline: auto; }
.hero-copy h1 { font-size: clamp(3rem, 7vw, 6.8rem); line-height: 0.96; letter-spacing: -0.065em; }
.button { min-height: 44px; }

@keyframes hero-reveal {
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes dashboard-float {
  0%, 100% { transform: translateY(0) rotateX(0.5deg); }
  50% { transform: translateY(-8px) rotateX(0deg); }
}
```

- [ ] **Step 3: Rodar testes, tipos e lint**

Run: `cd apps/landing && npm run test:run && npm run typecheck && npm run lint`

Expected: 5 testes aprovados; TypeScript e ESLint com exit code 0.

- [ ] **Step 4: Commit do acabamento**

```bash
git add apps/landing/src
git commit -m "style: polish landing experience"
```

### Task 6: Build e inspeção visual local

**Files:**
- Modify only if verification reveals a landing-specific defect: `apps/landing/**`

**Interfaces:**
- Consumes: aplicação completa das Tasks 1–5.
- Produces: evidência de build de produção e inspeção visual nos tamanhos-alvo.

- [ ] **Step 1: Executar toda a validação automatizada fresca**

Run: `cd apps/landing && npm run test:run && npm run typecheck && npm run lint && npm run build`

Expected: todos os comandos terminam com exit code 0; o build lista `/` como rota estática.

- [ ] **Step 2: Iniciar o servidor local**

Run: `cd apps/landing && npm run dev`

Expected: Next.js informa uma URL local e compila `/` sem erro de runtime.

- [ ] **Step 3: Inspecionar desktop, tablet e mobile no navegador**

Abra a URL local e verifique larguras aproximadas de 1440px, 768px e 390px. Em cada viewport, confirme visualmente: conteúdo completo, ausência de overflow horizontal, mockup legível, CTAs visíveis, foco por teclado, scroll de “Conhecer o Finly” até `#produto` e animações desativadas sob preferência de movimento reduzido.

- [ ] **Step 4: Corrigir somente defeitos observados e repetir as provas afetadas**

Para qualquer defeito funcional, adicione primeiro um teste que reproduza a regressão, confirme a falha, faça a menor correção e rode novamente `npm run test:run`. Para defeitos exclusivamente visuais, ajuste `globals.css` e repita as três larguras no navegador.

- [ ] **Step 5: Versionar correções de verificação, quando existirem**

Run: `git diff --quiet -- apps/landing; if ($LASTEXITCODE -ne 0) { git add apps/landing; git commit -m "fix: address landing verification" }`

Expected: nenhuma ação quando não houver correções; caso haja, somente arquivos de `apps/landing` entram no commit.

- [ ] **Step 6: Reexecutar o gate final**

Run: `cd apps/landing && npm run test:run && npm run typecheck && npm run lint && npm run build`

Expected: todos os comandos terminam com exit code 0 após as correções visuais.

- [ ] **Step 7: Confirmar isolamento no Git**

Run: `git status --short; git log --name-only --pretty=format: 26260ff..HEAD -- apps/landing`

Expected: os commits da implementação contêm somente `apps/landing`; alterações preexistentes em `apps/mobile` permanecem intocadas e fora dos commits.
