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
    <div className="sticky top-3 z-40 sm:top-4">
      <div className="rounded-[1.5rem] border border-border/70 bg-background/85 p-2 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/75 sm:rounded-[1.75rem]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="flex size-9 items-center justify-center rounded-2xl bg-primary/10 text-primary sm:size-10">
              <WalletCards className="size-4.5 sm:size-5" />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">Finly</p>
              <p className="hidden text-xs text-muted-foreground sm:block">
                Seu painel financeiro
              </p>
            </div>
          </div>

          <nav className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.value;

              return (
                <Button
                  key={item.value}
                  type="button"
                  variant={isActive ? "default" : "ghost"}
                  onClick={() => onChangeView(item.value)}
                  className="h-9 justify-center rounded-xl px-3 text-xs sm:rounded-2xl sm:px-4 sm:text-sm"
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
