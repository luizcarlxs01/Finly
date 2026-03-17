import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col items-center text-center">
      <Badge className="mb-4 bg-accent text-accent-foreground hover:bg-accent/90">
        Finly • Controle Financeiro
      </Badge>

      <h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
        Organize seu dinheiro com mais clareza, previsibilidade e controle.
      </h1>

      <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
        Um aplicativo para acompanhar saldo, despesas, recorrências, parcelas e
        metas de economia em uma experiência simples no navegador e,
        futuramente, sincronizada com mobile.
      </p>

      <div className="mt-10 flex flex-col gap-4 sm:flex-row">
        <Button size="lg" className="min-w-50">
          Começar sem conta
        </Button>

        <Button size="lg" variant="outline" className="min-w-50">
          Conhecer versão completa
        </Button>
      </div>
    </div>
  );
}
