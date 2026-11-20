"use client";

import Image from "next/image";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { AccountAccessCard } from "@/components/auth/account-access-card";
import { StaggeredMenu } from "@/components/layout/staggered-menu";
import { JellyIndicator } from "@/components/layout/jelly-indicator";
import styles from "@/components/layout/app-floating-header.module.css";
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
};

const primaryNavigationItems: NavigationItem[] = [
  {
    label: "Início",
    value: "home",
  },
  {
    label: "Lançamentos",
    value: "transactions",
  },
  {
    label: "Metas",
    value: "goals",
  },
  {
    label: "Insights",
    value: "insights",
  },
];

const secondaryNavigationItems: NavigationItem[] = [
  {
    label: "Fórum",
    value: "forum",
  },
  {
    label: "Download",
    value: "download",
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
      <div data-finly-header-surface className="relative left-1/2 w-[calc(100vw-2rem)] max-w-7xl -translate-x-1/2 rounded-[1.75rem] border border-white/80 bg-white/72 px-2 py-1.5 shadow-[0_12px_36px_-20px_rgba(3,21,51,0.18)] backdrop-blur-xl supports-[backdrop-filter]:bg-white/64 sm:w-[calc(100vw-3rem)] sm:rounded-full sm:p-2 lg:w-[calc(100vw-4rem)] dark:border-white/10 dark:bg-[#0b275e]/72 dark:supports-[backdrop-filter]:bg-[#0b275e]/64">
        <div className={styles.layout}>
          <div className="flex items-center gap-2 py-0.5 sm:gap-3 sm:px-2 sm:py-1">
            <div className="flex size-9 items-center justify-center sm:size-10">
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
              <p className="text-center text-xs font-semibold text-foreground sm:text-sm">
                Finly
              </p>
            </div>
          </div>

          <StaggeredMenu
            className={styles.menu}
            items={primaryNavigationItems.map(({ label, value }) => ({ label, value }))}
            compactItems={[secondaryNavigationItems[0]]}
            activeView={activeView}
            onSelect={onChangeView}
            desktopNavigation={
              <div className="relative isolate flex shrink-0 items-center gap-2">
                <JellyIndicator activeKey={activeView} className="rounded-full" />
                <nav aria-label="Navegação desktop" className="relative z-10 flex shrink-0 items-center gap-2">
                  {[...primaryNavigationItems, secondaryNavigationItems[0]].map((item) => (
                    <NavButton
                      key={item.value}
                      item={item}
                      isActive={activeView === item.value}
                      onChangeView={onChangeView}
                      className="h-9 min-w-0 justify-center rounded-full px-4 text-sm"
                      labelClassName="inline"
                    />
                    ))}
                  </nav>
                </div>
              }
              controls={<>
                <AccountAccessCard />
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  aria-label="Download"
                  title="Download"
                  aria-current={activeView === "download" ? "page" : undefined}
                  onClick={() => onChangeView("download")}
                >
                  <Download className="size-4" />
                </Button>
                <ThemeToggle />
              </>}
          />
        </div>
      </div>
    </div>
  );
}
