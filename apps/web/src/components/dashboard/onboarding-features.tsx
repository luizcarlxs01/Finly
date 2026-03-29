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
    title: "Controlar seu saldo",
    description:
      "Visualize saldo inicial, entradas, saídas e saldo atual com leitura rápida.",
  },
  {
    icon: ArrowLeftRight,
    title: "Adicionar transações",
    description:
      "Registre movimentações e acompanhe seu histórico com filtros e edição.",
  },
  {
    icon: Tags,
    title: "Usar categorias",
    description:
      "Organize receitas e despesas para entender melhor para onde seu dinheiro vai.",
  },
  {
    icon: PiggyBank,
    title: "Acompanhar metas",
    description:
      "Defina objetivos financeiros e acompanhe o progresso de cada um no painel.",
  },
];

export function OnboardingFeatures() {
  return (
    <Card className="rounded-[2rem] border-border/70 bg-card/95 shadow-sm">
      <CardHeader className="space-y-2 border-b border-border/60 pb-6">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
          O que você já pode fazer
        </p>
        <CardTitle className="text-2xl font-semibold tracking-tight text-foreground">
          O essencial para começar já está disponível
        </CardTitle>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Você não precisa esperar a versão completa para usar o Finly no dia a
          dia.
        </p>
      </CardHeader>

      <CardContent className="grid gap-4 p-6 md:grid-cols-2">
        {onboardingFeatures.map(({ icon: Icon, title, description }) => (
          <div
            key={title}
            className="rounded-2xl border border-border/70 bg-background/70 p-5"
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
