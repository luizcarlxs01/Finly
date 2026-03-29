import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const futureFeatures = [
  "Conta para acessar seus dados com mais segurança e continuidade",
  "Sincronização entre dispositivos",
  "Recorrência para lançamentos frequentes",
  "Múltiplos perfis para diferentes contextos financeiros",
];

export function OnboardingFuture() {
  return (
    <Card className="rounded-[2rem] border-border/70 bg-card/95 shadow-sm">
      <CardHeader className="space-y-4 border-b border-border/60 pb-6">
        <Badge className="w-fit bg-accent text-accent-foreground hover:bg-accent/90">
          Em breve
        </Badge>

        <div className="space-y-2">
          <CardTitle className="text-2xl font-semibold tracking-tight text-foreground">
            O Finly está evoluindo para uma experiência mais completa
          </CardTitle>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            O modo local já resolve o começo. As próximas etapas vão ampliar
            continuidade, conveniência e personalização.
          </p>
        </div>
      </CardHeader>

      <CardContent className="grid gap-3 p-6">
        {futureFeatures.map((feature) => (
          <div
            key={feature}
            className="rounded-2xl border border-dashed border-border/80 bg-background/60 px-4 py-3"
          >
            <p className="text-sm leading-6 text-foreground/85">{feature}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
