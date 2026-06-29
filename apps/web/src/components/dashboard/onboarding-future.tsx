import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const futureFeatures = [
  "Conta para acessar seus dados com mais continuidade",
  "Sincronização entre dispositivos",
  "Mais flexibilidade para lançamentos recorrentes",
  "Perfis para diferentes contextos financeiros",
];

export function OnboardingFuture() {
  return (
    <Card className="rounded-[1.75rem] border-border/60 bg-card/95 shadow-sm">
      <CardHeader className="space-y-3 border-b border-border/60 pb-5">
        <Badge className="w-fit bg-accent text-accent-foreground hover:bg-accent/90">
          Em evolução
        </Badge>

        <div className="space-y-1">
          <CardTitle className="text-xl font-semibold tracking-tight text-foreground">
            Mais por vir
          </CardTitle>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            A experiência vai crescer com você.
          </p>
        </div>
      </CardHeader>

      <CardContent className="grid gap-3 p-5">
        {futureFeatures.map((feature) => (
          <div
            key={feature}
            className="rounded-[1.25rem] border border-dashed border-border/70 bg-background/55 px-4 py-3"
          >
            <p className="text-sm leading-6 text-foreground/85">{feature}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
