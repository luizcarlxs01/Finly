"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Download,
  Home,
  Lightbulb,
  Menu,
  MessagesSquare,
  Target,
  User,
  WalletCards,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export type DashboardView =
  | "home"
  | "transactions"
  | "goals"
  | "insights"
  | "forum"
  | "download"
  | "account";

type AppFloatingHeaderProps = {
  activeView: DashboardView;
  onChangeView: (view: DashboardView) => void;
};

type NavigationItem = {
  label: string;
  value: DashboardView;
  icon: React.ComponentType<{ className?: string }>;
};

const primaryNavigationItems: NavigationItem[] = [
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

const secondaryNavigationItems: NavigationItem[] = [
  {
    label: "Fórum",
    value: "forum",
    icon: MessagesSquare,
  },
  {
    label: "Download",
    value: "download",
    icon: Download,
  },
  {
    label: "Conta",
    value: "account",
    icon: User,
  },
];

function NavButton({
  item,
  isActive,
  onChangeView,
  className,
  labelClassName = "hidden sm:inline",
}: {
  item: NavigationItem;
  isActive: boolean;
  onChangeView: (view: DashboardView) => void;
  className?: string;
  labelClassName?: string;
}) {
  const Icon = item.icon;

  return (
    <Button
      type="button"
      variant={isActive ? "default" : "ghost"}
      onClick={() => onChangeView(item.value)}
      aria-label={item.label}
      title={item.label}
      className={className}
    >
      <Icon className="size-4" />
      <span className={labelClassName}>{item.label}</span>
    </Button>
  );
}

export function AppFloatingHeader({
  activeView,
  onChangeView,
}: AppFloatingHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleChangeView = (view: DashboardView) => {
    onChangeView(view);
    setIsMenuOpen(false);
  };

  const isSecondaryActive = secondaryNavigationItems.some(
    (item) => item.value === activeView,
  );

  return (
    <div className="sticky top-3 z-40 sm:top-4">
      <div className="relative left-1/2 w-[calc(100vw-2rem)] max-w-7xl -translate-x-1/2 rounded-[1.25rem] border border-white/80 bg-white/72 px-2 py-1.5 shadow-[0_20px_55px_-30px_rgba(3,21,51,0.34)] backdrop-blur-xl supports-[backdrop-filter]:bg-white/64 sm:w-[calc(100vw-3rem)] sm:rounded-[1.75rem] sm:p-2 lg:w-[calc(100vw-4rem)] dark:border-white/10 dark:bg-[#0b275e]/72 dark:supports-[backdrop-filter]:bg-[#0b275e]/64">
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
              {primaryNavigationItems.map((item) => (
                <NavButton
                  key={item.value}
                  item={item}
                  isActive={activeView === item.value}
                  onChangeView={handleChangeView}
                  className="h-8 min-w-8 justify-center rounded-lg px-2 text-xs sm:h-9 sm:min-w-0 sm:rounded-2xl sm:px-4 sm:text-sm"
                />
              ))}
            </nav>

            {/* Desktop largo (xl+): itens secundários inline, igual antes */}
            <nav className="hidden items-center gap-2 xl:flex">
              {secondaryNavigationItems.map((item) => (
                <NavButton
                  key={item.value}
                  item={item}
                  isActive={activeView === item.value}
                  onChangeView={handleChangeView}
                  className="h-9 min-w-0 justify-center rounded-2xl px-4 text-sm"
                  labelClassName="inline"
                />
              ))}
            </nav>

            {/* Mobile/tablet/desktop estreito (abaixo de xl): menu hamburguer com os itens secundários */}
            <div className="relative xl:hidden">
              <Button
                type="button"
                variant={isMenuOpen || isSecondaryActive ? "default" : "ghost"}
                onClick={() => setIsMenuOpen((prev) => !prev)}
                aria-label={isMenuOpen ? "Fechar menu" : "Mais opções"}
                title={isMenuOpen ? "Fechar menu" : "Mais opções"}
                className="h-8 min-w-8 justify-center rounded-lg px-2 text-xs"
              >
                {isMenuOpen ? (
                  <X className="size-4" />
                ) : (
                  <Menu className="size-4" />
                )}
              </Button>

              {isMenuOpen ? (
                <>
                  <button
                    type="button"
                    aria-hidden="true"
                    tabIndex={-1}
                    onClick={() => setIsMenuOpen(false)}
                    className="fixed inset-0 z-40 cursor-default"
                  />
                  <div className="absolute right-0 top-full z-50 mt-2 w-48 space-y-1 rounded-2xl border border-border/60 bg-card p-1.5 shadow-lg">
                    {secondaryNavigationItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeView === item.value;

                      return (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => handleChangeView(item.value)}
                          className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors ${
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : "text-foreground hover:bg-muted"
                          }`}
                        >
                          <Icon className="size-4" />
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : null}
            </div>

            <div className="flex justify-end">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
