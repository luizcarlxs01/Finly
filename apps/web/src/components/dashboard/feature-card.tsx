import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { FeatureCardItem } from "@/types/feature-card";

type FeatureCardProps = FeatureCardItem;

export function FeatureCard({ title, description }: FeatureCardProps) {
  return (
    <Card className="border-border bg-card text-card-foreground shadow-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>

      <CardContent>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
