"use client";

import { Home, Lightbulb, Target, WalletCards } from "lucide-react";

import { Button } from "@/components/ui/button";

export type DashboardView = "home" | "transactions" | "goals" | "insights";

type AppFloatingHeaderProps = {
  activeView: DashboardView;
  onChangeView: (view: DashboardView) => void;
};

const navigationItems: Array<{
  label: string;
  value: DashboardView;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    label: "Início",
    value: "home",
    icon: Home,
  },
  {
    label: "Lançamentos",
    value: "transactions",
    icon: WalletCards,
  },
  {
    label: "Metas",
    value: "goals",
    icon: Target,
  },
  {
    label: "Insights",
    value: "insights",
    icon: Lightbulb,
  },
];

export function AppFloatingHeader({
  activeView,
  onChangeView,
}: AppFloatingHeaderProps) {
  return (
    <div className="sticky top-4 z-40">
      <div className="rounded-[1.75rem] border border-border/70 bg-background/85 p-2 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/75">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <WalletCards className="size-5" />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">Finly</p>
              <p className="text-xs text-muted-foreground">
                Navegação principal da aplicação
              </p>
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.value;

              return (
                <Button
                  key={item.value}
                  type="button"
                  variant={isActive ? "default" : "ghost"}
                  onClick={() => onChangeView(item.value)}
                  className="rounded-2xl"
                >
                  <Icon className="size-4" />
                  {item.label}
                </Button>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
