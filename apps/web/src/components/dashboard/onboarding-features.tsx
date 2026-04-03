import {
  ArrowLeftRight,
  ChartNoAxesCombined,
  PiggyBank,
  Tags,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const onboardingFeatures = [
  {
    icon: ChartNoAxesCombined,
    title: "Acompanhar seu saldo",
    description: "Veja saldo, entradas e saídas com leitura rápida.",
  },
  {
    icon: ArrowLeftRight,
    title: "Registrar lançamentos",
    description: "Adicione movimentações e acompanhe o histórico.",
  },
  {
    icon: Tags,
    title: "Organizar categorias",
    description: "Entenda melhor para onde seu dinheiro está indo.",
  },
  {
    icon: PiggyBank,
    title: "Seguir metas",
    description: "Crie objetivos e acompanhe seu progresso.",
  },
];

export function OnboardingFeatures() {
  return (
    <Card className="rounded-[1.75rem] border-border/60 bg-card/95 shadow-sm">
      <CardHeader className="space-y-1 border-b border-border/60 pb-5">
        <CardTitle className="text-xl font-semibold tracking-tight text-foreground">
          O que você já pode fazer
        </CardTitle>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          O essencial para começar já está disponível.
        </p>
      </CardHeader>

      <CardContent className="grid gap-3 p-5 md:grid-cols-2">
        {onboardingFeatures.map(({ icon: Icon, title, description }) => (
          <div
            key={title}
            className="rounded-[1.25rem] border border-border/60 bg-background/60 p-4"
          >
            <span className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Icon className="size-5" />
            </span>
            <p className="mt-4 text-sm font-medium text-foreground">{title}</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
