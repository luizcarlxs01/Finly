"use client";

import Image from "next/image";
import {
  Download,
  Home,
  Lightbulb,
  MessagesSquare,
  Target,
  WalletCards,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { AccountAccessCard } from "@/components/auth/account-access-card";
import { StaggeredMenu } from "@/components/layout/staggered-menu";
import { JellyIndicator } from "@/components/layout/jelly-indicator";
import jellyStyles from "@/components/layout/jelly-navigation.module.css";
import { cn } from "@/lib/utils";

export type DashboardView =
  | "home"
  | "transactions"
  | "goals"
  | "insights"
  | "forum"
  | "download";

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
  const selected = isActive;

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={() => onChangeView(item.value)}
      aria-label={item.label}
      aria-current={selected ? "page" : undefined}
      data-jelly-active={selected ? "true" : undefined}
      title={item.label}
      className={cn(
        className,
        "relative z-10 hover:bg-transparent",
        selected
          ? "text-white hover:text-white focus-visible:text-white"
          : `text-foreground ${jellyStyles.feedback}`,
      )}
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
  return (
    <div className="sticky top-3 z-40 sm:top-4">
      <div data-finly-header-surface className="relative left-1/2 w-[calc(100vw-2rem)] max-w-7xl -translate-x-1/2 rounded-[1.25rem] border border-white/80 bg-white/72 px-2 py-1.5 shadow-[0_20px_55px_-30px_rgba(3,21,51,0.34)] backdrop-blur-xl supports-[backdrop-filter]:bg-white/64 sm:w-[calc(100vw-3rem)] sm:rounded-[1.75rem] sm:p-2 lg:w-[calc(100vw-4rem)] dark:border-white/10 dark:bg-[#0b275e]/72 dark:supports-[backdrop-filter]:bg-[#0b275e]/64">
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2 py-0.5 sm:gap-3 sm:px-2 sm:py-1">
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

            <div className="block min-w-0">
              <p className="text-xs font-semibold text-foreground sm:text-sm">
                Finly
              </p>
              <p className="hidden text-xs text-muted-foreground sm:block">
                Seu painel financeiro
              </p>
            </div>
          </div>

          <div className="flex min-w-0 items-center gap-1 sm:gap-2">
            <StaggeredMenu
              items={primaryNavigationItems.map(({ label, value }) => ({ label, value }))}
              compactItems={secondaryNavigationItems.map(({ label, value }) => ({ label, value }))}
              activeView={activeView}
              onSelect={onChangeView}
              desktopNavigation={
                <div className="relative isolate flex shrink-0 items-center gap-2">
                  <JellyIndicator activeKey={activeView} className="rounded-2xl" />
                  <nav aria-label="Navegação desktop" className="relative z-10 flex shrink-0 items-center gap-2">
                    {primaryNavigationItems.map((item) => (
                      <NavButton
                        key={item.value}
                        item={item}
                        isActive={activeView === item.value}
                        onChangeView={onChangeView}
                        className="h-9 min-w-0 justify-center rounded-2xl px-4 text-sm"
                        labelClassName="inline"
                      />
                    ))}
                  </nav>
                  <nav aria-label="Navegação secundária" className="relative z-10 flex shrink-0 items-center gap-2">
                    {secondaryNavigationItems.map((item) => (
                      <NavButton
                        key={item.value}
                        item={item}
                        isActive={activeView === item.value}
                        onChangeView={onChangeView}
                        className="h-9 min-w-0 justify-center rounded-2xl px-4 text-sm"
                        labelClassName="inline"
                      />
                    ))}
                  </nav>
                </div>
              }
              controls={<><AccountAccessCard /><ThemeToggle /></>}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
