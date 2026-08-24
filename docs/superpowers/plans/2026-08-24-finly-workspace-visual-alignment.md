# Finly Workspace Visual Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Alinhar visualmente as abas Lançamentos, Metas e Insights à identidade premium da Home do Finly sem alterar lógica, dados, callbacks, navegação ou sobreposições.

**Architecture:** Criar uma fundação apresentacional pequena para cabeçalhos e métricas do workspace, aplicar uma atmosfera exclusiva ao `PageContainer` padrão e refinar somente os componentes diretamente renderizados nas três abas. Componentes-base globais permanecem intactos para impedir propagação visual a Conta, drawers e modais.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, CSS global existente, shadcn/ui e Lucide React. Nenhuma dependência nova.

**Spec:** `docs/superpowers/specs/2026-08-24-finly-workspace-visual-alignment-design.md`

## Global Constraints

- Trabalhar somente em `apps/web` e nos testes/documentos diretamente relacionados.
- Não alterar hooks, `FinanceSourceProvider`, API, autenticação, Occurrences, calendário, cálculos ou regras financeiras.
- Não alterar Conta, drawers, speed dial ou modais nesta etapa.
- Não modificar as interfaces públicas das views nem remover callbacks existentes.
- Não alterar os componentes-base globais `Card` e `Button`.
- Não instalar bibliotecas ou adicionar outra timeline GSAP.
- Usar somente CSS/Tailwind para movimento e respeitar `prefers-reduced-motion: reduce`.
- Preservar light/dark, responsividade e ausência de overflow horizontal.
- Aplicar TDD para novas estruturas e executar testes de regressão antes de cada commit.

---

### Task 1: Fundação Visual Compartilhada

**Files:**
- Create: `apps/web/src/components/dashboard/workspace/workspace-view.tsx`
- Create: `apps/web/src/test/components/workspace-view.test.tsx`
- Modify: `apps/web/src/components/layout/page-container.tsx`
- Modify: `apps/web/src/test/components/page-container.test.tsx`
- Modify: `apps/web/src/app/globals.css`

**Interfaces:**
- Produces: `WorkspaceViewHeader(props: WorkspaceViewHeaderProps): ReactElement`
- Produces: `WorkspaceMetric(props: WorkspaceMetricProps): ReactElement`
- `WorkspaceViewHeaderProps`: `{ eyebrow: string; title: string; description: string; icon: LucideIcon; metrics?: ReactNode }`
- `WorkspaceMetricProps`: `{ label: string; value: ReactNode; tone?: "blue" | "positive" | "neutral" }`
- Consumes: `LucideIcon` from `lucide-react`, existing theme tokens from `globals.css`.

- [ ] **Step 1: Write the failing shared-component test**

Create `workspace-view.test.tsx` with assertions on the public structure:

```tsx
import { render, screen } from "@testing-library/react";
import { WalletCards } from "lucide-react";
import { describe, expect, it } from "vitest";

import {
  WorkspaceMetric,
  WorkspaceViewHeader,
} from "@/components/dashboard/workspace/workspace-view";

describe("WorkspaceView", () => {
  it("renders the shared editorial header and real metrics", () => {
    render(
      <WorkspaceViewHeader
        eyebrow="Seu fluxo financeiro"
        title="Lançamentos"
        description="Cadastre e acompanhe suas movimentações."
        icon={WalletCards}
        metrics={
          <WorkspaceMetric label="Saldo" value="R$ 1.250,00" tone="blue" />
        }
      />,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Lançamentos" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Seu fluxo financeiro")).toBeInTheDocument();
    expect(screen.getByText("Saldo")).toBeInTheDocument();
    expect(screen.getByText("R$ 1.250,00")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the new test and verify RED**

Run:

```powershell
npm run test:run -- src/test/components/workspace-view.test.tsx
```

Expected: FAIL because `workspace-view.tsx` does not exist.

- [ ] **Step 3: Implement the presentational workspace components**

Create `workspace-view.tsx` with no data or business imports:

```tsx
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type WorkspaceViewHeaderProps = {
  description: string;
  eyebrow: string;
  icon: LucideIcon;
  metrics?: ReactNode;
  title: string;
};

type WorkspaceMetricProps = {
  label: string;
  tone?: "blue" | "positive" | "neutral";
  value: ReactNode;
};

const metricToneClasses = {
  blue: "border-primary/20 bg-primary/10 text-primary",
  positive: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  neutral: "border-border/50 bg-background/45 text-foreground",
} as const;

export function WorkspaceMetric({
  label,
  tone = "neutral",
  value,
}: WorkspaceMetricProps) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-[1.25rem] border px-4 py-3 shadow-[0_18px_44px_-36px_rgba(3,21,51,0.45)] backdrop-blur-sm",
        metricToneClasses[tone],
      )}
    >
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] opacity-70">
        {label}
      </p>
      <div className="mt-1 truncate text-lg font-semibold tabular-nums tracking-[-0.03em]">
        {value}
      </div>
    </div>
  );
}

export function WorkspaceViewHeader({
  description,
  eyebrow,
  icon: Icon,
  metrics,
  title,
}: WorkspaceViewHeaderProps) {
  return (
    <section className="workspace-enter relative overflow-hidden rounded-[2rem] border border-white/65 bg-card/72 p-6 shadow-[0_32px_90px_-58px_rgba(3,21,51,0.5)] backdrop-blur-xl dark:border-white/10 dark:bg-[#0b275e]/64 sm:p-8">
      <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-primary/14 blur-3xl" />
      <div className="relative grid gap-7 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
        <div className="max-w-3xl">
          <div className="flex items-center gap-3 text-primary">
            <span className="grid size-9 place-items-center rounded-2xl bg-primary/10 ring-1 ring-primary/15">
              <Icon aria-hidden="true" className="size-4" />
            </span>
            <p className="text-xs font-bold uppercase tracking-[0.16em]">{eyebrow}</p>
          </div>
          <h1 className="mt-5 text-4xl font-semibold tracking-[-0.055em] text-foreground sm:text-5xl">
            {title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            {description}
          </p>
        </div>
        {metrics ? (
          <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[31rem]">{metrics}</div>
        ) : null}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Extend the PageContainer regression test**

Update `page-container.test.tsx` so the default variant requires a full-width atmospheric wrapper and a bounded inner container:

```tsx
expect(screen.getByTestId("page-content").parentElement).toHaveClass(
  "finly-workspace-content",
);
expect(screen.getByTestId("page-content").parentElement?.parentElement).toHaveClass(
  "finly-workspace-atmosphere",
);
```

Run the test and confirm it fails before changing `PageContainer`.

- [ ] **Step 5: Implement the default workspace atmosphere**

Keep the landing branch unchanged. For the default branch render:

```tsx
return (
  <div
    className="finly-workspace-atmosphere min-h-screen w-full overflow-x-clip py-8 sm:py-10 lg:py-14"
    data-variant="default"
  >
    <div className="finly-workspace-content relative z-[1] mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      {children}
    </div>
  </div>
);
```

Add light/dark atmospheric rules to `globals.css`:

```css
.finly-workspace-atmosphere {
  position: relative;
  isolation: isolate;
  background:
    radial-gradient(circle at 12% 4%, rgb(26 117 255 / 12%), transparent 28rem),
    radial-gradient(circle at 92% 28%, rgb(126 176 242 / 10%), transparent 30rem),
    linear-gradient(180deg, #f8fbff 0%, var(--background) 42%, #f4f8fd 100%);
}

.dark .finly-workspace-atmosphere {
  background:
    radial-gradient(circle at 10% 5%, rgb(34 119 255 / 17%), transparent 30rem),
    radial-gradient(circle at 90% 25%, rgb(89 154 255 / 10%), transparent 32rem),
    linear-gradient(180deg, #061a3d 0%, var(--background) 46%, #041431 100%);
}

.workspace-enter {
  animation: workspace-enter 520ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes workspace-enter {
  from { opacity: 0; transform: translate3d(0, 0.85rem, 0); }
  to { opacity: 1; transform: translate3d(0, 0, 0); }
}

@media (prefers-reduced-motion: reduce) {
  .workspace-enter { animation: none; }
}
```

- [ ] **Step 6: Verify Task 1**

Run:

```powershell
npm run test:run -- src/test/components/workspace-view.test.tsx src/test/components/page-container.test.tsx
npx tsc --noEmit
npx eslint src/components/dashboard/workspace/workspace-view.tsx src/components/layout/page-container.tsx src/test/components/workspace-view.test.tsx src/test/components/page-container.test.tsx
```

Expected: all commands exit with code 0.

- [ ] **Step 7: Commit Task 1**

```powershell
git add apps/web/src/components/dashboard/workspace/workspace-view.tsx apps/web/src/test/components/workspace-view.test.tsx apps/web/src/components/layout/page-container.tsx apps/web/src/test/components/page-container.test.tsx apps/web/src/app/globals.css
git commit -m "feat: add shared workspace visual foundation"
```

---

### Task 2: Lançamentos - Shell, Resumo E Ações

**Files:**
- Modify: `apps/web/src/components/dashboard/views/dashboard-transactions-view.tsx`
- Modify: `apps/web/src/components/dashboard/finance-summary-card.tsx`
- Test: `apps/web/src/test/components/dashboard-transactions-view.test.tsx`
- Test: `apps/web/src/test/components/finance-summary-card.test.tsx`

**Interfaces:**
- Consumes: `WorkspaceViewHeader` from Task 1.
- Preserves: every prop and callback in `DashboardTransactionsViewProps` and `FinanceSummaryCardProps`.
- Produces: Lançamentos with editorial header, premium summary and unchanged Calendar/Statement actions.

- [ ] **Step 1: Add the failing view assertions**

Extend `dashboard-transactions-view.test.tsx`:

```tsx
expect(screen.getByText("Seu fluxo financeiro")).toBeInTheDocument();
expect(
  screen.getByRole("heading", { level: 1, name: "Lançamentos" }),
).toBeInTheDocument();
```

Keep the existing callback tests for Calendário, Extrato, form, list and filters unchanged.

- [ ] **Step 2: Run the view test and verify RED**

```powershell
npm run test:run -- src/test/components/dashboard-transactions-view.test.tsx
```

Expected: FAIL because “Seu fluxo financeiro” is absent.

- [ ] **Step 3: Replace only the page heading and shell composition**

Import `WalletCards` and `WorkspaceViewHeader`. Replace the old heading card with:

```tsx
<WorkspaceViewHeader
  eyebrow="Seu fluxo financeiro"
  icon={WalletCards}
  title="Lançamentos"
  description="Registre movimentos, acompanhe seu saldo e mantenha o próximo passo visível."
/>
```

Use `workspace-enter space-y-8 2xl:space-y-10` on the view wrapper. Preserve `id="nova-transacao"`, sticky behavior and every child callback.

Restyle the action group without changing button variants or handlers:

```tsx
<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
  <Button className="h-12 justify-start rounded-2xl shadow-[0_18px_42px_-28px_rgba(26,117,255,0.55)]" ...>
  <Button variant="outline" className="h-12 justify-start rounded-2xl border-white/60 bg-card/68 backdrop-blur-xl dark:border-white/10 dark:bg-white/5" ...>
</div>
```

- [ ] **Step 4: Refine FinanceSummaryCard without changing behavior**

Keep all state and handlers. Change only visual classes:

- outer card: translucent workspace surface with soft border and deeper shadow;
- current balance block: blue Finly gradient with white labels and values;
- expanded income/expense/projection blocks: lower-contrast inner surfaces;
- eye, edit, expand and simulation controls: preserve accessible labels and callbacks;
- all financial values: add `tabular-nums`.

The primary balance block must use this direction:

```tsx
className="relative overflow-hidden rounded-[1.5rem] border border-primary/20 bg-[radial-gradient(circle_at_85%_10%,rgba(255,255,255,0.24),transparent_30%),linear-gradient(135deg,#0967f2,#3188ff)] p-5 text-white shadow-[0_24px_55px_-32px_rgba(26,117,255,0.7)]"
```

Do not change text, `isExpanded`, `isValuesHidden`, balance editing or simulation behavior.

- [ ] **Step 5: Run the related regression tests**

```powershell
npm run test:run -- src/test/components/dashboard-transactions-view.test.tsx src/test/components/finance-summary-card.test.tsx
```

Expected: both files pass with all existing callback assertions intact.

- [ ] **Step 6: Commit Task 2**

```powershell
git add apps/web/src/components/dashboard/views/dashboard-transactions-view.tsx apps/web/src/components/dashboard/finance-summary-card.tsx apps/web/src/test/components/dashboard-transactions-view.test.tsx
git commit -m "feat: align transactions overview with Finly identity"
```

---

### Task 3: Lançamentos - Formulário, Filtros E Lista

**Files:**
- Modify: `apps/web/src/components/dashboard/transaction-form.tsx`
- Modify: `apps/web/src/components/dashboard/transaction-filter-tabs.tsx`
- Modify: `apps/web/src/components/dashboard/transaction-advanced-filters.tsx`
- Modify: `apps/web/src/components/dashboard/transaction-list.tsx`
- Modify: `apps/web/src/components/dashboard/views/dashboard-transactions-view.tsx`
- Test: `apps/web/src/test/components/transaction-form.test.tsx`
- Test: `apps/web/src/test/components/transaction-filter-tabs.test.tsx`
- Test: `apps/web/src/test/components/transaction-advanced-filters.test.tsx`
- Test: `apps/web/src/test/components/transaction-list.test.tsx`
- Test: `apps/web/src/test/components/dashboard-transactions-view.test.tsx`

**Interfaces:**
- Preserves: transaction creation, preview, filtering, sorting, expansion, edit and remove contracts.
- Produces: a visually unified working surface for transaction entry and review.

- [ ] **Step 1: Record the current behavioral baseline**

Run before editing:

```powershell
npm run test:run -- src/test/components/transaction-form.test.tsx src/test/components/transaction-filter-tabs.test.tsx src/test/components/transaction-advanced-filters.test.tsx src/test/components/transaction-list.test.tsx src/test/components/dashboard-transactions-view.test.tsx
```

Expected: all tests pass. Record the test count in the implementation notes.

- [ ] **Step 2: Add a failing semantic assertion for the work surface**

Add an accessible label to the desired collapsible region in the test first:

```tsx
expect(
  screen.getByRole("region", { name: "Histórico de lançamentos" }),
).toBeInTheDocument();
```

Run `dashboard-transactions-view.test.tsx` and confirm failure because the region label does not exist.

- [ ] **Step 3: Implement the semantic region and premium collapsed strip**

Wrap the list section with:

```tsx
<section
  aria-label="Histórico de lançamentos"
  className="workspace-enter space-y-4"
>
```

Use a translucent strip for the toggle container, preserve button text, `ChevronDown`, `isListOpen` and conditional rendering.

- [ ] **Step 4: Restyle TransactionForm by reducing nested borders**

Keep all form state, field IDs, labels, conditional recurrence/installment fields, preview and submit handlers. Apply these rules:

- outer card: `rounded-[2rem] border-white/65 bg-card/76 shadow-[0_30px_80px_-55px_rgba(3,21,51,0.52)] backdrop-blur-xl dark:border-white/10 dark:bg-[#0b275e]/60`;
- internal groups: `rounded-[1.35rem] bg-background/42 p-4 ring-1 ring-border/45`;
- fields: preserve existing focus behavior and use `bg-background/72`;
- primary CTA: blue shadow only on enabled state;
- no text or field order changes.

- [ ] **Step 5: Restyle filters and list while preserving actions**

For filter tabs, use pill surfaces and visible selected state. For advanced filters, use a single low-contrast surface instead of nested card borders. For transaction rows:

```tsx
className="group rounded-[1.35rem] border border-border/45 bg-background/58 p-4 transition duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:bg-background/78 hover:shadow-[0_18px_48px_-38px_rgba(3,21,51,0.5)]"
```

Preserve all occurrence labels, dates, amounts, recurring metadata, edit/remove menus and empty-state text.

- [ ] **Step 6: Verify Task 3**

Run:

```powershell
npm run test:run -- src/test/components/transaction-form.test.tsx src/test/components/transaction-filter-tabs.test.tsx src/test/components/transaction-advanced-filters.test.tsx src/test/components/transaction-list.test.tsx src/test/components/dashboard-transactions-view.test.tsx
npx tsc --noEmit
npx eslint src/components/dashboard/transaction-form.tsx src/components/dashboard/transaction-filter-tabs.tsx src/components/dashboard/transaction-advanced-filters.tsx src/components/dashboard/transaction-list.tsx src/components/dashboard/views/dashboard-transactions-view.tsx
```

Expected: all commands exit with code 0.

- [ ] **Step 7: Commit Task 3**

```powershell
git add apps/web/src/components/dashboard/transaction-form.tsx apps/web/src/components/dashboard/transaction-filter-tabs.tsx apps/web/src/components/dashboard/transaction-advanced-filters.tsx apps/web/src/components/dashboard/transaction-list.tsx apps/web/src/components/dashboard/views/dashboard-transactions-view.tsx apps/web/src/test/components/dashboard-transactions-view.test.tsx
git commit -m "feat: refine transaction workspace surfaces"
```

---

### Task 4: Metas

**Files:**
- Modify: `apps/web/src/components/dashboard/views/dashboard-goals-view.tsx`
- Modify: `apps/web/src/components/dashboard/goal-form.tsx`
- Modify: `apps/web/src/components/dashboard/goal-list.tsx`
- Test: `apps/web/src/test/components/dashboard-goals-view.test.tsx`
- Test: `apps/web/src/test/components/goal-form.test.tsx`
- Test: `apps/web/src/test/components/goal-list.test.tsx`

**Interfaces:**
- Consumes: `WorkspaceViewHeader` and `WorkspaceMetric` from Task 1.
- Preserves: all goal creation, progress update, removal and disabled-state callbacks.
- Produces: goal metrics integrated into the shared header and refined form/list surfaces.

- [ ] **Step 1: Add the failing goals-header assertion**

Extend `dashboard-goals-view.test.tsx`:

```tsx
expect(screen.getByText("Objetivos com direção")).toBeInTheDocument();
expect(screen.getByText("Metas ativas")).toBeInTheDocument();
expect(screen.getByText("Acumulado")).toBeInTheDocument();
expect(screen.getByText("Falta")).toBeInTheDocument();
```

Run the file and confirm it fails on “Objetivos com direção”.

- [ ] **Step 2: Replace the goals header with shared components**

Use:

```tsx
<WorkspaceViewHeader
  eyebrow="Objetivos com direção"
  icon={Target}
  title="Metas"
  description="Transforme planos em progresso visível, no seu ritmo."
  metrics={
    <>
      <WorkspaceMetric label="Metas ativas" value={goals.length} tone="blue" />
      <WorkspaceMetric label="Acumulado" value={currencyFormatter.format(totalGoalProgress)} tone="positive" />
      <WorkspaceMetric label="Falta" value={currencyFormatter.format(remainingGoalAmount)} />
    </>
  }
/>
```

Keep the existing large-screen form/list grid and all props.

- [ ] **Step 3: Refine GoalForm**

Preserve every field, validation and reset operation. Apply one outer translucent surface and replace each nested bordered section with a tonal group using `bg-background/42 ring-1 ring-border/40`. Keep IDs and labels unchanged. The submit area must remain the final group and the button must remain full-width.

- [ ] **Step 4: Refine GoalList and progress hierarchy**

Keep empty state, category/deadline display, progress clamping, update and remove callbacks. Apply:

- goal cards with subtle hover elevation;
- title and current/target values as primary row;
- progress bar height between `0.55rem` and `0.7rem` with blue gradient;
- deadline/category metadata as compact pills;
- destructive action visually secondary until hover/focus.

Do not change percentage calculations or displayed monetary values.

- [ ] **Step 5: Verify Task 4**

```powershell
npm run test:run -- src/test/components/dashboard-goals-view.test.tsx src/test/components/goal-form.test.tsx src/test/components/goal-list.test.tsx
npx tsc --noEmit
npx eslint src/components/dashboard/views/dashboard-goals-view.tsx src/components/dashboard/goal-form.tsx src/components/dashboard/goal-list.tsx src/test/components/dashboard-goals-view.test.tsx
```

Expected: all commands exit with code 0.

- [ ] **Step 6: Commit Task 4**

```powershell
git add apps/web/src/components/dashboard/views/dashboard-goals-view.tsx apps/web/src/components/dashboard/goal-form.tsx apps/web/src/components/dashboard/goal-list.tsx apps/web/src/test/components/dashboard-goals-view.test.tsx
git commit -m "feat: align goals workspace with Finly identity"
```

---

### Task 5: Insights E Regras Financeiras

**Files:**
- Modify: `apps/web/src/components/dashboard/views/dashboard-insights-view.tsx`
- Modify: `apps/web/src/components/dashboard/dashboard-insights.tsx`
- Modify: `apps/web/src/components/dashboard/financial-forecast-card.tsx`
- Modify: `apps/web/src/components/dashboard/financial-rules-manager.tsx`
- Test: `apps/web/src/test/components/dashboard-insights-view.test.tsx`
- Test: `apps/web/src/test/components/dashboard-insights.test.tsx`
- Test: `apps/web/src/test/components/financial-forecast-card.test.tsx`
- Create: `apps/web/src/test/components/financial-rules-manager.test.tsx`

**Interfaces:**
- Consumes: `WorkspaceViewHeader` from Task 1.
- Preserves: forecast values, insight tone mapping, account-only rules rendering and all financial-rule callbacks.
- Produces: analytical feed, prominent forecast and aligned authenticated automation surface.

- [ ] **Step 1: Add the failing insights-header assertion**

Extend `dashboard-insights-view.test.tsx`:

```tsx
expect(screen.getByText("Leituras do seu momento")).toBeInTheDocument();
expect(
  screen.getByRole("heading", { level: 1, name: "Insights" }),
).toBeInTheDocument();
```

Run the view test and confirm it fails because the eyebrow is absent and the current heading is level 2.

- [ ] **Step 2: Apply the shared insights header and composition**

Use:

```tsx
<WorkspaceViewHeader
  eyebrow="Leituras do seu momento"
  icon={Lightbulb}
  title="Insights"
  description="Entenda os sinais do seu fluxo e enxergue o próximo período com mais clareza."
/>
```

Place `FinancialForecastCard` first in DOM order on desktop and mobile, then `DashboardInsights`. Use a balanced two-column grid at `2xl`. Preserve `accountAutomationView` after the informational block.

- [ ] **Step 3: Add the failing rules-manager regression test**

Create `financial-rules-manager.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { FinancialRulesManager } from "@/components/dashboard/financial-rules-manager";

describe("FinancialRulesManager", () => {
  it("exposes the automation region and preserves processing", async () => {
    const user = userEvent.setup();
    const onProcessRules = vi.fn().mockResolvedValue(undefined);

    render(
      <FinancialRulesManager
        financialProfileId="profile-1"
        rules={[]}
        onCreateRule={vi.fn().mockResolvedValue(undefined)}
        onDeleteRule={vi.fn().mockResolvedValue(undefined)}
        onProcessRules={onProcessRules}
        onUpdateRule={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    expect(
      screen.getByRole("region", { name: "Automação financeira" }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Processar regras agora" }),
    );
    expect(onProcessRules).toHaveBeenCalledTimes(1);
  });
});
```

Run:

```powershell
npm run test:run -- src/test/components/financial-rules-manager.test.tsx
```

Expected: FAIL because the current root section has no accessible region name.

- [ ] **Step 4: Convert DashboardInsights to an analytical feed**

Preserve `toneClasses`, `getToneLabel`, IDs, titles and descriptions. Change the content layout to one column with divider rhythm:

```tsx
<article className="group relative rounded-[1.35rem] border border-border/45 bg-background/52 p-5 transition duration-200 hover:border-primary/20 hover:bg-background/72">
```

Add a narrow tone marker using CSS classes derived from the existing tone. Do not infer or calculate new insight data.

- [ ] **Step 5: Promote FinancialForecastCard**

Keep `getProjectedBalanceTone` and all values. Apply a blue-gradient principal balance surface for non-negative projection and a warm warning surface for negative projection. Keep the existing semantic labels `Saldo previsto`, `Entradas` and `Saídas`; add `tabular-nums` to values.

- [ ] **Step 6: Align FinancialRulesManager without changing logic**

Preserve its API-only gating in `page.tsx`, every async handler, form field, processing result and rule action. Change only classes:

- outer surface matching workspace cards;
- information notice with lower border contrast;
- form as one tonal surface;
- rule rows using the same hover rhythm as insight rows;
- processing metrics using `WorkspaceMetric` is not allowed because the manager should remain independent of view composition; use matching local classes instead.

Add `aria-label="Automação financeira"` to the existing root `section` so the new regression test passes without adding a wrapper.

- [ ] **Step 7: Verify Task 5**

```powershell
npm run test:run -- src/test/components/dashboard-insights-view.test.tsx src/test/components/dashboard-insights.test.tsx src/test/components/financial-forecast-card.test.tsx src/test/components/financial-rules-manager.test.tsx
npx tsc --noEmit
npx eslint src/components/dashboard/views/dashboard-insights-view.tsx src/components/dashboard/dashboard-insights.tsx src/components/dashboard/financial-forecast-card.tsx src/components/dashboard/financial-rules-manager.tsx src/test/components/dashboard-insights-view.test.tsx
```

Expected: all commands exit with code 0.

- [ ] **Step 8: Commit Task 5**

```powershell
git add apps/web/src/components/dashboard/views/dashboard-insights-view.tsx apps/web/src/components/dashboard/dashboard-insights.tsx apps/web/src/components/dashboard/financial-forecast-card.tsx apps/web/src/components/dashboard/financial-rules-manager.tsx apps/web/src/test/components/dashboard-insights-view.test.tsx apps/web/src/test/components/financial-rules-manager.test.tsx
git commit -m "feat: refine insights and rules workspace"
```

---

### Task 6: Verificação Integrada E Responsiva

**Files:**
- Modify only if verification exposes a defect: files already listed in Tasks 1-5.
- Test: all related test files from Tasks 1-5.

**Interfaces:**
- Consumes: completed visual system and all three refined views.
- Produces: verified desktop/mobile, light/dark workspace with no behavior regressions.

- [ ] **Step 1: Run the complete related test set**

```powershell
npm run test:run -- src/test/components/workspace-view.test.tsx src/test/components/page-container.test.tsx src/test/components/dashboard-transactions-view.test.tsx src/test/components/finance-summary-card.test.tsx src/test/components/transaction-form.test.tsx src/test/components/transaction-filter-tabs.test.tsx src/test/components/transaction-advanced-filters.test.tsx src/test/components/transaction-list.test.tsx src/test/components/dashboard-goals-view.test.tsx src/test/components/goal-form.test.tsx src/test/components/goal-list.test.tsx src/test/components/dashboard-insights-view.test.tsx src/test/components/dashboard-insights.test.tsx src/test/components/financial-forecast-card.test.tsx src/test/components/financial-rules-manager.test.tsx
```

Expected: every listed test file passes.

- [ ] **Step 2: Run static verification**

```powershell
npx tsc --noEmit
npx eslint src/components/dashboard/workspace/workspace-view.tsx src/components/layout/page-container.tsx src/components/dashboard/views/dashboard-transactions-view.tsx src/components/dashboard/finance-summary-card.tsx src/components/dashboard/transaction-form.tsx src/components/dashboard/transaction-filter-tabs.tsx src/components/dashboard/transaction-advanced-filters.tsx src/components/dashboard/transaction-list.tsx src/components/dashboard/views/dashboard-goals-view.tsx src/components/dashboard/goal-form.tsx src/components/dashboard/goal-list.tsx src/components/dashboard/views/dashboard-insights-view.tsx src/components/dashboard/dashboard-insights.tsx src/components/dashboard/financial-forecast-card.tsx src/components/dashboard/financial-rules-manager.tsx
```

Expected: TypeScript and focused lint exit with code 0.

- [ ] **Step 3: Run production build**

```powershell
$env:NEXT_PUBLIC_API_URL="http://localhost:8080"
npm run build
```

Expected: Next.js compiles, runs TypeScript, generates `/` and exits with code 0.

- [ ] **Step 4: Inspect all tabs in desktop light mode**

At a viewport near `1440x1000`, verify:

- header hierarchy and atmosphere match across all tabs;
- Calendar, Statement, list expansion, filters and support link remain interactive;
- transaction form fields and submit/preview actions remain visible;
- goal form and goal actions remain visible;
- forecast, insights and authenticated rules fit without overlap;
- no console errors and no horizontal overflow.

- [ ] **Step 5: Inspect all tabs in desktop dark mode**

Verify text, fields, disabled controls, financial values, gradients and borders. Every value must remain readable without relying on hover.

- [ ] **Step 6: Inspect all tabs at `390x844`**

Verify one-column stacking, touch target sizes, metric wrapping, list/filter layout and `document.body.scrollWidth <= window.innerWidth`. Confirm no sticky area covers content.

- [ ] **Step 7: Verify reduced motion**

With `prefers-reduced-motion: reduce`, confirm `.workspace-enter` has no animation and all content is immediately visible.

- [ ] **Step 8: Run diff and repository checks**

```powershell
git diff --check
git status --short
```

Expected: no whitespace errors; only intended `apps/web` files and plan/spec state appear.

- [ ] **Step 9: Commit verification-only corrections when present**

Stage only files corrected during Steps 4-7, then run:

```powershell
git commit -m "fix: polish responsive workspace visuals"
```

Skip this commit when no verification correction was required.
