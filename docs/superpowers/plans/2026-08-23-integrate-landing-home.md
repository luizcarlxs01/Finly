# Landing as Official Home Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Incorporar a experiência completa de `apps/landing` à aba Início de `apps/web`, remover a aplicação independente e integrar o resultado à `main` sem tocar nas alterações mobile existentes.

**Architecture:** A Home será composta por componentes estáticos em `apps/web/src/components/dashboard/home-landing/`, com um CSS Module compartilhado para isolar toda a linguagem visual. `DashboardHomeView` preserva seu contrato público e passa somente o callback de navegação para a nova composição; nenhuma fonte de dados financeira participa do mockup.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, CSS Modules, Lucide React, Vitest e Testing Library.

**Spec:** `docs/superpowers/specs/2026-08-23-integrate-landing-home-design.md`

## Global Constraints

- Preservar `AppFloatingHeader`, navegação, autenticação e todos os callbacks.
- Não alterar hooks, `FinanceSourceProvider`, API, Occurrences, calendário, regras financeiras, Docker, VPS ou mobile.
- Não introduzir regras diferentes para modo local e modo API.
- Não importar `apps/landing/src/app/globals.css` como CSS global em `apps/web`.
- Não instalar GSAP, Three.js, Framer Motion ou outra biblioteca de animação.
- Manter a headline `Seu dinheiro. Mais claro todos os dias.`.
- Manter o supporting text `Acompanhe o que importa e registre seus lançamentos em poucos passos.`.
- CTA principal e CTA final chamam o callback que abre Lançamentos.
- CTA secundário usa `href="#produto"`.
- Não remover a worktree enquanto houver arquivo modificado ou não rastreado sem equivalente commitado.

---

### Task 1: Preserve the Approved Landing and Hero Work

**Files:**
- Commit: alterações atuais em `apps/landing/**`
- Commit: `apps/web/src/components/dashboard/hero-section.tsx`
- Commit: `apps/web/src/test/components/hero-section.test.tsx`
- Observe only: working tree principal em `C:/Users/Luiz/Desktop/Projetos/Projeto 2 - Finly`

**Interfaces:**
- Consumes: estado aprovado nos Prompts 2 e 3.
- Produces: branch sem alterações antigas soltas, permitindo migração e remoção sem `git rm -f`.

- [ ] **Step 1: Record the global web-test baseline before migration**

Run:

```powershell
$env:NEXT_PUBLIC_API_URL = "http://localhost:8080"
npm --prefix apps/web run test:run 2>&1 | Tee-Object "$env:TEMP/finly-web-baseline.txt"
```

Expected: registrar a contagem e os nomes exatos das falhas preexistentes. Não corrigir arquivos fora da Home.

- [ ] **Step 2: Reverify the currently approved focused changes**

Run:

```powershell
npm --prefix apps/landing run test:run
npm --prefix apps/landing run typecheck
npm --prefix apps/web run test:run -- src/test/components/hero-section.test.tsx
& apps/web/node_modules/.bin/tsc.cmd -p apps/web/tsconfig.json --noEmit
```

Expected: landing `7/7`, Hero interno `3/3` e ambos os projetos sem erro de TypeScript.

- [ ] **Step 3: Commit the landing refinement without staging web or mobile files**

```powershell
git add -- apps/landing
git commit -m "style: add cinematic landing interactions"
```

- [ ] **Step 4: Commit the approved internal Hero refinement separately**

```powershell
git add -- apps/web/src/components/dashboard/hero-section.tsx apps/web/src/test/components/hero-section.test.tsx
git commit -m "style: align internal hero with landing"
```

- [ ] **Step 5: Confirm the main working tree still contains only user-owned mobile changes**

```powershell
git -C "C:/Users/Luiz/Desktop/Projetos/Projeto 2 - Finly" status --short
```

Expected: somente caminhos sob `apps/mobile/`. Se aparecer conflito em `apps/web`, parar e pedir decisão ao usuário.

---

### Task 2: Migrate the Cinematic Home Composition

**Files:**
- Create: `apps/web/src/components/dashboard/home-landing/home-landing.tsx`
- Create: `apps/web/src/components/dashboard/home-landing/landing-hero.tsx`
- Create: `apps/web/src/components/dashboard/home-landing/product-dashboard.tsx`
- Create: `apps/web/src/components/dashboard/home-landing/product-showcase.tsx`
- Create: `apps/web/src/components/dashboard/home-landing/sync-feature.tsx`
- Create: `apps/web/src/components/dashboard/home-landing/final-cta.tsx`
- Create: `apps/web/src/components/dashboard/home-landing/finly-mark.tsx`
- Create: `apps/web/src/components/dashboard/home-landing/home-landing.module.css`
- Test: `apps/web/src/test/components/home-landing.test.tsx`
- Source reference: `apps/landing/src/app/page.tsx`
- Source reference: `apps/landing/src/components/product-dashboard.tsx`
- Source reference: `apps/landing/src/components/product-showcase.tsx`
- Source reference: `apps/landing/src/components/sync-feature.tsx`
- Source reference: `apps/landing/src/components/final-cta.tsx`
- Source reference: `apps/landing/src/components/finly-mark.tsx`
- Source reference: `apps/landing/src/app/globals.css`

**Interfaces:**
- Consumes: `onStartTransactions: () => void`.
- Produces: `HomeLanding({ onStartTransactions }: HomeLandingProps)` e quatro áreas semânticas dentro de um único wrapper visual.

- [ ] **Step 1: Write the failing composition and CTA test**

Create `apps/web/src/test/components/home-landing.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { HomeLanding } from "@/components/dashboard/home-landing/home-landing";

describe("HomeLanding", () => {
  it("apresenta a experiência completa na Home", () => {
    render(<HomeLanding onStartTransactions={vi.fn()} />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Seu dinheiro. Mais claro todos os dias.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Saldo atual")).toBeInTheDocument();
    expect(screen.getByText("Reserva de tranquilidade")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: /tudo o que importa/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: /comece sem conta/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: /menos dúvida/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Ir para a aba de lançamentos" })).toHaveLength(2);
    expect(screen.getByRole("link", { name: "Conhecer o Finly" })).toHaveAttribute("href", "#produto");
  });

  it("mantém as duas chamadas para Lançamentos funcionais", async () => {
    const user = userEvent.setup();
    const onStartTransactions = vi.fn();
    render(<HomeLanding onStartTransactions={onStartTransactions} />);

    const transactionButtons = screen.getAllByRole("button", {
      name: "Ir para a aba de lançamentos",
    });
    await user.click(transactionButtons[0]);
    await user.click(transactionButtons[1]);

    expect(onStartTransactions).toHaveBeenCalledTimes(2);
  });
});
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```powershell
npm --prefix apps/web run test:run -- src/test/components/home-landing.test.tsx
```

Expected: FAIL porque `home-landing` ainda não existe.

- [ ] **Step 3: Create the stable component contracts**

Use these exact public types:

```tsx
export type HomeLandingProps = {
  onStartTransactions: () => void;
};

type LandingHeroProps = HomeLandingProps;
type FinalCtaProps = HomeLandingProps;
```

Create the root composition in `home-landing.tsx`:

```tsx
import styles from "./home-landing.module.css";
import { FinalCta } from "./final-cta";
import { LandingHero } from "./landing-hero";
import { ProductShowcase } from "./product-showcase";
import { SyncFeature } from "./sync-feature";

export type HomeLandingProps = {
  onStartTransactions: () => void;
};

export function HomeLanding({ onStartTransactions }: HomeLandingProps) {
  return (
    <div className={styles.homeLanding}>
      <LandingHero onStartTransactions={onStartTransactions} />
      <ProductShowcase />
      <SyncFeature />
      <FinalCta onStartTransactions={onStartTransactions} />
    </div>
  );
}
```

- [ ] **Step 4: Port the Hero and dashboard without data dependencies**

Port the JSX from `apps/landing/src/app/page.tsx` and
`apps/landing/src/components/product-dashboard.tsx` with these required adaptations:

```tsx
<button
  type="button"
  className={styles.primaryButton}
  onClick={onStartTransactions}
  aria-label="Ir para a aba de lançamentos"
>
  Começar lançamentos
  <ArrowUpRight aria-hidden="true" />
</button>

<a className={styles.secondaryButton} href="#produto">
  Conhecer o Finly
  <ArrowDownRight aria-hidden="true" />
</a>
```

Set the Hero heading to:

```tsx
<h1 aria-label="Seu dinheiro. Mais claro todos os dias.">
  Seu dinheiro.
  <span>Mais claro todos os dias.</span>
</h1>
```

Keep `summary`, `chartBars`, `projectionBars` and every displayed amount as module-level constants. Do not import hooks, contexts, services or API clients.

- [ ] **Step 5: Port showcase, sync, final CTA and footer**

Port the presentational markup from the source files. Replace the final external anchor with:

```tsx
<button
  type="button"
  className={styles.closingButton}
  onClick={onStartTransactions}
  aria-label="Ir para a aba de lançamentos"
>
  Começar lançamentos
  <ArrowUpRight aria-hidden="true" />
</button>
```

Do not port `landing-header.tsx`. Preserve IDs `produto`, `product-title`, `sync-title` and `closing-title`.

- [ ] **Step 6: Port styles into a CSS Module**

Create `home-landing.module.css` by porting the visual declarations from
`apps/landing/src/app/globals.css`. Use local camelCase classes referenced through
`styles`, with this required mapping for collision-prone selectors:

```text
.page-shell       -> .homeLanding
.content-width    -> .contentWidth
.hero-shell       -> .heroShell
.hero-layout      -> .heroLayout
.dashboard-stage  -> .dashboardStage
.dashboard        -> .dashboardMockup
.button           -> .actionButton
.product-section  -> .productSection
.sync-section     -> .syncSection
.closing-section  -> .closingSection
```

Do not define selectors for `body`, `html`, `a`, `button`, `*`, `::selection` or
`:root`. Replace landing variables with existing web tokens where equivalent:

```css
.homeLanding {
  --landing-blue: var(--primary);
  --landing-navy: var(--foreground);
  --landing-canvas: var(--background);
  --landing-border: var(--border);
  --landing-muted: var(--muted-foreground);
  position: relative;
  overflow: clip;
  border-radius: 2rem;
}
```

Keep the approved perspective, floating metrics, gradients, stagger, tablet/mobile
breakpoints and `prefers-reduced-motion`. Reduce outer section widths to `100%`
because `DashboardShell` already owns the application content width.

- [ ] **Step 7: Run GREEN and focused lint**

```powershell
npm --prefix apps/web run test:run -- src/test/components/home-landing.test.tsx
Push-Location apps/web
& node_modules/.bin/eslint.cmd src/components/dashboard/home-landing src/test/components/home-landing.test.tsx
Pop-Location
```

Expected: `2/2` tests pass and ESLint exits 0.

- [ ] **Step 8: Commit the presentational migration**

```powershell
git add -- apps/web/src/components/dashboard/home-landing apps/web/src/test/components/home-landing.test.tsx
git commit -m "feat: migrate landing experience to web home"
```

---

### Task 3: Add Scroll Reveal Without Animating the Application Shell

**Files:**
- Create: `apps/web/src/components/dashboard/home-landing/scroll-reveal.tsx`
- Modify: `apps/web/src/components/dashboard/home-landing/product-showcase.tsx`
- Modify: `apps/web/src/components/dashboard/home-landing/sync-feature.tsx`
- Modify: `apps/web/src/components/dashboard/home-landing/final-cta.tsx`
- Modify: `apps/web/src/components/dashboard/home-landing/home-landing.module.css`
- Modify test: `apps/web/src/test/components/home-landing.test.tsx`

**Interfaces:**
- Consumes: `children: ReactNode`, optional `className?: string`.
- Produces: `ScrollReveal` that sets `data-visible="true"` once and then unobserves its own element.

- [ ] **Step 1: Add a failing observer behavior test**

Append a test that stubs `IntersectionObserver`, renders `HomeLanding`, expects
three `[data-scroll-reveal]` elements, triggers the first callback with
`isIntersecting: true`, and expects `data-visible="true"` plus `unobserve` called
with that element. Restore globals in `afterEach`.

- [ ] **Step 2: Run the test and verify RED**

```powershell
npm --prefix apps/web run test:run -- src/test/components/home-landing.test.tsx
```

Expected: FAIL porque os wrappers `.scrollReveal` ainda não existem.

- [ ] **Step 3: Implement the reusable client component**

```tsx
"use client";

import { useEffect, useRef, type ReactNode } from "react";
import styles from "./home-landing.module.css";

type ScrollRevealProps = {
  children: ReactNode;
  className?: string;
};

export function ScrollReveal({ children, className = "" }: ScrollRevealProps) {
  const revealRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = revealRef.current;
    if (!element) return;

    element.dataset.revealReady = "true";
    if (!("IntersectionObserver" in window)) {
      element.dataset.visible = "true";
      return;
    }

    element.dataset.visible = "false";
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      element.dataset.visible = "true";
      observer.unobserve(element);
    }, { threshold: 0.16, rootMargin: "0px 0px -8% 0px" });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={revealRef}
      className={`${styles.scrollReveal} ${className}`.trim()}
      data-scroll-reveal
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 4: Wrap only the three lower-section contents**

Keep each `<section>` as the semantic root. Put `ScrollReveal` inside Product,
Sync and Final CTA sections. Do not wrap `AppFloatingHeader`, `DashboardShell` or
the Hero.

- [ ] **Step 5: Add reveal and reduced-motion rules**

```css
.scrollReveal {
  opacity: 1;
  transform: translate3d(0, 0, 0);
}

.scrollReveal[data-reveal-ready="true"][data-visible="false"] {
  opacity: 0;
  transform: translate3d(0, 2.25rem, 0);
}

.scrollReveal[data-reveal-ready="true"] {
  transition: opacity 800ms cubic-bezier(0.22, 1, 0.36, 1),
    transform 800ms cubic-bezier(0.22, 1, 0.36, 1);
}

@media (prefers-reduced-motion: reduce) {
  .scrollReveal {
    opacity: 1 !important;
    transform: none !important;
    transition: none !important;
  }
}
```

- [ ] **Step 6: Run GREEN and commit**

```powershell
npm --prefix apps/web run test:run -- src/test/components/home-landing.test.tsx
git add -- apps/web/src/components/dashboard/home-landing apps/web/src/test/components/home-landing.test.tsx
git commit -m "feat: reveal home sections on scroll"
```

---

### Task 4: Make the Landing the Official Home View

**Files:**
- Modify: `apps/web/src/components/dashboard/views/dashboard-home-view.tsx`
- Modify test: `apps/web/src/test/components/dashboard-home-view.test.tsx`
- Delete: `apps/web/src/components/dashboard/hero-section.tsx`
- Delete: `apps/web/src/components/dashboard/dashboard-entry-header.tsx`
- Delete: `apps/web/src/test/components/hero-section.test.tsx`

**Interfaces:**
- Consumes: existing `DashboardHomeViewProps` unchanged.
- Produces: `DashboardHomeView` rendering `HomeLanding` and forwarding `onGoToTransactions` as `onStartTransactions`.

- [ ] **Step 1: Rewrite the integration test first**

Replace stale Home expectations with:

```tsx
it("renderiza a landing como Home oficial", () => {
  renderDashboardHomeView();
  expect(
    screen.getByRole("heading", {
      level: 1,
      name: "Seu dinheiro. Mais claro todos os dias.",
    }),
  ).toBeInTheDocument();
  expect(screen.getByText("Saldo atual")).toBeInTheDocument();
  expect(screen.getByText("No seu dispositivo")).toBeInTheDocument();
});

it("encaminha os dois CTAs para Lançamentos", async () => {
  const user = userEvent.setup();
  const onGoToTransactions = vi.fn();
  renderDashboardHomeView({ onGoToTransactions });

  for (const button of screen.getAllByRole("button", {
    name: "Ir para a aba de lançamentos",
  })) {
    await user.click(button);
  }

  expect(onGoToTransactions).toHaveBeenCalledTimes(2);
});
```

Remove expectations for `Finly`, the old copy, Calendário, Extrato and the three
decorative cards. Keep the props fixture with all three callbacks to protect the
public component contract.

- [ ] **Step 2: Run the integration test and verify RED**

```powershell
npm --prefix apps/web run test:run -- src/test/components/dashboard-home-view.test.tsx
```

Expected: FAIL because `DashboardHomeView` still renders `DashboardEntryHeader`.

- [ ] **Step 3: Replace the internal composition without changing props**

```tsx
import { HomeLanding } from "@/components/dashboard/home-landing/home-landing";

export type DashboardHomeViewProps = {
  onGoToTransactions: () => void;
  onOpenCalendar: () => void;
  onOpenStatementProjection: () => void;
};

export function DashboardHomeView({
  onGoToTransactions,
}: DashboardHomeViewProps) {
  return <HomeLanding onStartTransactions={onGoToTransactions} />;
}
```

- [ ] **Step 4: Run GREEN before removing obsolete files**

```powershell
npm --prefix apps/web run test:run -- src/test/components/home-landing.test.tsx src/test/components/dashboard-home-view.test.tsx
```

Expected: all focused tests pass.

- [ ] **Step 5: Prove the old components have no consumers and remove them**

```powershell
rg -n "HeroSection|DashboardEntryHeader" apps/web/src --glob "*.tsx"
git rm -- apps/web/src/components/dashboard/hero-section.tsx apps/web/src/components/dashboard/dashboard-entry-header.tsx apps/web/src/test/components/hero-section.test.tsx
```

Expected before removal: only the three obsolete files. Expected after removal:
`rg` returns no matches.

- [ ] **Step 6: Run focused tests and commit**

```powershell
npm --prefix apps/web run test:run -- src/test/components/home-landing.test.tsx src/test/components/dashboard-home-view.test.tsx
git add -- apps/web/src/components/dashboard/views/dashboard-home-view.tsx apps/web/src/test/components/dashboard-home-view.test.tsx
git commit -m "feat: make landing the official web home"
```

---

### Task 5: Remove the Standalone Landing Application

**Files:**
- Delete: `apps/landing/**`

**Interfaces:**
- Consumes: validated Home implementation in `apps/web`.
- Produces: repository with a single Next.js application, `apps/web`.

- [ ] **Step 1: Verify every required landing section exists in web**

```powershell
rg -n "Seu dinheiro|Tudo o que importa|Comece sem conta|Menos dúvida" apps/web/src/components/dashboard/home-landing
git status --short apps/landing apps/web
```

Expected: all four messages found under web; landing changes from Task 1 are
already committed.

- [ ] **Step 2: Remove tracked landing files**

```powershell
git rm -r -- apps/landing
```

Do not use `-f`. If Git refuses, inspect `git status --short apps/landing` and
preserve any uncommitted source before retrying.

- [ ] **Step 3: Confirm no repository references remain**

```powershell
rg -n "apps/landing|landing.finly.systems" . --glob "!docs/superpowers/**" --glob "!.git/**" --glob "!**/node_modules/**"
```

Expected: no runtime, workspace or deployment reference. Historical design docs
may still describe the superseded architecture.

- [ ] **Step 4: Re-run web checks before committing deletion**

```powershell
npm --prefix apps/web run test:run -- src/test/components/home-landing.test.tsx src/test/components/dashboard-home-view.test.tsx
& apps/web/node_modules/.bin/tsc.cmd -p apps/web/tsconfig.json --noEmit
$env:NEXT_PUBLIC_API_URL = "http://localhost:8080"
npm --prefix apps/web run build
```

Expected: focused tests, TypeScript and build pass.

- [ ] **Step 5: Commit standalone-app removal**

```powershell
git commit -m "chore: remove standalone landing app"
```

---

### Task 6: Final Verification, Main Integration and Worktree Cleanup

**Files:**
- Verify: all changed `apps/web/**` files
- Preserve unchanged: `apps/mobile/**` in main working tree
- Remove after successful merge: `.worktrees/landing`

**Interfaces:**
- Consumes: fully committed `codex/finly-landing` branch.
- Produces: integrated `main`, deleted feature branch and no registered landing worktree.

- [ ] **Step 1: Run focused and static verification in the worktree**

```powershell
npm --prefix apps/web run test:run -- src/test/components/home-landing.test.tsx src/test/components/dashboard-home-view.test.tsx
& apps/web/node_modules/.bin/tsc.cmd -p apps/web/tsconfig.json --noEmit
Push-Location apps/web
& node_modules/.bin/eslint.cmd src/components/dashboard/home-landing src/components/dashboard/views/dashboard-home-view.tsx src/test/components/home-landing.test.tsx src/test/components/dashboard-home-view.test.tsx
Pop-Location
$env:NEXT_PUBLIC_API_URL = "http://localhost:8080"
npm --prefix apps/web run build
git diff --check main...HEAD
```

Expected: all commands exit 0.

- [ ] **Step 2: Run the full suite and compare with the recorded baseline**

```powershell
npm --prefix apps/web run test:run 2>&1 | Tee-Object "$env:TEMP/finly-web-final.txt"
```

Expected: zero new failures. If any test fails, compare names with
`$env:TEMP/finly-web-baseline.txt`. Per the approved spec, stop before merge and
worktree cleanup while failures remain.

- [ ] **Step 3: Validate the complete browser flow on port 3002**

Start:

```powershell
$env:NEXT_PUBLIC_API_URL = "http://localhost:8080"
npm --prefix apps/web run dev -- --port 3002
```

Verify:

```text
- AppFloatingHeader remains visible.
- Home contains exactly four landing sections.
- Hero and final CTA each switch to Lançamentos.
- Secondary CTA scrolls to #produto.
- No horizontal overflow at 1280px, 768px and 390px.
- Console has no warnings or errors introduced by the Home.
- Reduced-motion renders all content visible and static.
```

- [ ] **Step 4: Commit any verification-only corrections, then confirm clean state**

```powershell
git status --short
git log --oneline main..HEAD
```

Expected: worktree clean and every implementation change committed.

- [ ] **Step 5: Capture worktree provenance before changing directory**

```powershell
git rev-parse --git-dir
git rev-parse --git-common-dir
git rev-parse --show-toplevel
```

Expected: worktree path is
`C:/Users/Luiz/Desktop/Projetos/Projeto 2 - Finly/.worktrees/landing`, branch is
`codex/finly-landing`, and base is `main`.

- [ ] **Step 6: Verify main's dirty files do not overlap the merge**

```powershell
git -C "C:/Users/Luiz/Desktop/Projetos/Projeto 2 - Finly" status --short
git diff --name-only main...codex/finly-landing
```

Expected: main changes are only under `apps/mobile`; branch changes contain no
`apps/mobile` path. If paths overlap, stop and ask the user.

- [ ] **Step 7: Merge locally without discarding user changes**

From the main repository root:

```powershell
git merge --no-ff codex/finly-landing
```

Do not stash, reset, checkout or modify the mobile files. If Git refuses because
the working tree is dirty, stop and present the exact conflicting paths.

- [ ] **Step 8: Reverify the merged result**

```powershell
npm --prefix apps/web run test:run -- src/test/components/home-landing.test.tsx src/test/components/dashboard-home-view.test.tsx
& apps/web/node_modules/.bin/tsc.cmd -p apps/web/tsconfig.json --noEmit
$env:NEXT_PUBLIC_API_URL = "http://localhost:8080"
npm --prefix apps/web run build
git status --short
```

Expected: web checks pass and the original mobile changes remain listed exactly
as before the merge.

- [ ] **Step 9: Remove the owned worktree and integrated branch**

Stop the port 3002 dev server first. From the main repository root:

```powershell
git worktree remove "C:/Users/Luiz/Desktop/Projetos/Projeto 2 - Finly/.worktrees/landing"
git worktree prune
git branch -d codex/finly-landing
git worktree list
```

Do not add `--force`. If removal is refused, run
`git -C <worktree-path> status --porcelain -uall`, present every uncommitted path
and stop before deleting anything.
