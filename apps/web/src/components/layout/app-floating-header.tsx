"use client";

import Image from "next/image";
import { Home, Lightbulb, Target, User, WalletCards } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export type DashboardView = "home" | "transactions" | "goals" | "insights";

type AppFloatingHeaderProps = {
  activeView: DashboardView;
  onChangeView: (view: DashboardView) => void;
  isAccountCardOpen: boolean;
  onToggleAccountCard: () => void;
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
  isAccountCardOpen,
  onToggleAccountCard,
}: AppFloatingHeaderProps) {
  return (
    <div className="sticky top-3 z-40 sm:top-4">
      <div className="rounded-[1.25rem] border border-border/70 bg-background/85 px-2 py-1.5 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/75 sm:rounded-[1.75rem] sm:p-2">
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2 px-1 py-0.5 sm:gap-3 sm:px-2 sm:py-1">
            <div className="flex size-9 items-center justify-center overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm sm:size-10 sm:rounded-2xl">
              <Image
                src="/favicon-32x32.png"
                alt="Finly"
                width={32}
                height={32}
                className="h-7 w-7 sm:h-8 sm:w-8"
                priority
              />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground sm:text-sm">
                Finly
              </p>
              <p className="hidden text-xs text-muted-foreground sm:block">
                Seu painel financeiro
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <nav className="grid grid-cols-4 gap-1 sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:gap-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.value;

                return (
                  <Button
                    key={item.value}
                    type="button"
                    variant={isActive ? "default" : "ghost"}
                    onClick={() => onChangeView(item.value)}
                    aria-label={item.label}
                    title={item.label}
                    className="h-8 min-w-8 justify-center rounded-lg px-2 text-xs sm:h-9 sm:min-w-0 sm:rounded-2xl sm:px-4 sm:text-sm"
                  >
                    <Icon className="size-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Button>
                );
              })}
            </nav>

            <Button
              type="button"
              variant={isAccountCardOpen ? "default" : "ghost"}
              onClick={onToggleAccountCard}
              aria-label="Conta"
              title="Conta"
              className="h-8 min-w-8 justify-center rounded-lg px-2 text-xs sm:h-9 sm:min-w-0 sm:rounded-2xl sm:px-3"
            >
              <User className="size-4" />
            </Button>

            <div className="flex justify-end">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
