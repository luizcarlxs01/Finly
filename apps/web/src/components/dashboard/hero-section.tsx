import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

type HeroSectionProps = {
  onStartTransactions: () => void;
};

export function HeroSection({ onStartTransactions }: HeroSectionProps) {
  return (
    <section className="group relative isolate overflow-hidden rounded-[2rem] border border-white/70 bg-card/90 px-5 py-9 shadow-[0_28px_80px_-42px_rgba(3,21,51,0.38),0_1px_0_rgba(255,255,255,0.9)_inset] sm:px-7 sm:py-11 lg:px-10 lg:py-14 dark:border-white/10 dark:bg-card/85 dark:shadow-[0_28px_80px_-42px_rgba(0,0,0,0.72)]">
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_84%_14%,rgba(26,117,255,0.18),transparent_34%),radial-gradient(circle_at_8%_100%,rgba(126,176,242,0.16),transparent_38%),linear-gradient(135deg,rgba(255,255,255,0.72),transparent_58%)] dark:bg-[radial-gradient(circle_at_84%_14%,rgba(126,176,242,0.18),transparent_34%),radial-gradient(circle_at_8%_100%,rgba(26,117,255,0.12),transparent_38%)]"
        aria-hidden="true"
      />
      <div
        className="absolute top-1/2 -right-24 size-72 -translate-y-1/2 rounded-full border border-primary/10 bg-primary/5 shadow-[0_0_70px_rgba(26,117,255,0.12)] transition-transform duration-700 ease-out group-hover:scale-[1.03] sm:-right-16 sm:size-80 lg:right-4 lg:size-96 motion-reduce:transform-none motion-reduce:transition-none"
        aria-hidden="true"
      >
        <span className="absolute inset-[18%] rounded-full border border-primary/10 bg-background/20 shadow-[0_20px_60px_rgba(26,117,255,0.08)] backdrop-blur-[2px]" />
        <span className="absolute inset-[38%] rounded-full bg-primary/10 shadow-[0_0_46px_rgba(26,117,255,0.2)]" />
      </div>

      <div className="relative z-10 min-w-0 max-w-3xl">
        <div className="space-y-5 sm:space-y-6">
          <div className="space-y-4">
            <h1
              className="max-w-3xl text-4xl leading-[0.98] font-semibold tracking-[-0.045em] text-foreground sm:text-5xl lg:text-6xl"
              aria-label="Seu dinheiro. Mais claro todos os dias."
            >
              Seu dinheiro.
              <span className="block text-primary">Mais claro todos os dias.</span>
            </h1>

            <p className="max-w-xl text-sm leading-7 text-muted-foreground sm:text-base lg:text-lg">
              Acompanhe o que importa e registre seus lançamentos em poucos
              passos.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              size="lg"
              onClick={onStartTransactions}
              aria-label="Ir para a aba de lançamentos"
              className="group/cta min-w-52 rounded-full shadow-[0_14px_30px_-14px_rgba(26,117,255,0.8)] transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-14px_rgba(26,117,255,0.9)] motion-reduce:transform-none motion-reduce:transition-none"
            >
              Começar lançamentos
              <ArrowRight className="transition-transform duration-200 group-hover/cta:translate-x-1 motion-reduce:transform-none motion-reduce:transition-none" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
