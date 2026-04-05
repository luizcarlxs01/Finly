"use client";

import Image from "next/image";
import { Home, Lightbulb, Target, WalletCards } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";

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
            <div className="flex size-10 items-center justify-center overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
              <Image
                src="/favicon-32x32.png"
                alt="Finly"
                width={32}
                height={32}
                className="h-8 w-8"
                priority
              />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">Finly</p>
              <p className="hidden text-xs text-muted-foreground sm:block">
                Seu painel financeiro
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
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

            <div className="flex justify-end">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
