"use client";

import { useCallback, useLayoutEffect, useMemo, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { Flip } from "gsap/Flip";

import styles from "./dashboard-insights-view.module.css";
import { DashboardInsights } from "@/components/dashboard/dashboard-insights";
import { FinancialForecastCard } from "@/components/dashboard/financial-forecast-card";
import { SpendingAnalysisPanel } from "@/components/dashboard/insights/spending-analysis-panel";
import {
  SpendingProfileLayoutContext,
  type SpendingProfileLayoutTransition,
} from "@/components/dashboard/insights/spending-profile-card";
import type { Transaction } from "@/types/finance";
import type { DashboardInsight } from "@/utils/dashboard-insights";

gsap.registerPlugin(Flip);

export type DashboardInsightsViewProps = {
  accountAutomationView?: ReactNode;
  insights: DashboardInsight[];
  forecastTotalIncome: number;
  forecastTotalExpense: number;
  forecastProjectedBalance: number;
  spendingProfileCard?: ReactNode;
  analysisTransactions?: Transaction[];
};

export function DashboardInsightsView({
  accountAutomationView = null,
  insights,
  forecastTotalIncome,
  forecastTotalExpense,
  forecastProjectedBalance,
  spendingProfileCard = null,
  analysisTransactions = [],
}: DashboardInsightsViewProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const layoutAnimationRef = useRef<gsap.core.Timeline | null>(null);
  const previousLayoutRef = useRef<Flip.FlipState | null>(null);
  const previousChartSizeRef = useRef<{ width: number; height: number } | null>(null);
  const beginProfileLayoutTransition = useCallback((update: () => void) => {
    const root = rootRef.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      previousLayoutRef.current = null;
      update();
      return;
    }

    const targets = root.querySelectorAll<HTMLElement>(
      `.${styles.profile}, .${styles.sidebar}, .${styles.analysis}`,
    );
    layoutAnimationRef.current?.progress(1);
    previousLayoutRef.current = Flip.getState(targets, { simple: true });
    const chart = root.querySelector<HTMLElement>("[data-analysis-chart]");
    const chartRect = chart?.getBoundingClientRect();
    previousChartSizeRef.current = chartRect
      ? { width: chartRect.width, height: chartRect.height }
      : null;
    update();
  }, []);
  const finishProfileLayoutTransition = useCallback(() => {
    const previousLayout = previousLayoutRef.current;
    previousLayoutRef.current = null;
    if (!previousLayout || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const root = rootRef.current;
    if (!root) return;
    // Keep the final layout in place while Flip moves only the outer boxes.
    // Resizing grid children on every frame reflows labels and restarts charts.
    const rootHeight = root.style.height;
    root.style.height = `${root.getBoundingClientRect().height}px`;
    const surfaces = Array.from(root.querySelectorAll<HTMLElement>(
      `.${styles.profile} > [data-slot="card"], .${styles.analysis} > [data-slot="card"]`,
    ));
    const savedStyles = surfaces.map((surface) => ({
      surface,
      width: surface.style.width,
      height: surface.style.height,
      flexShrink: surface.style.flexShrink,
    }));
    surfaces.forEach((surface) => {
      const rect = surface.getBoundingClientRect();
      surface.style.width = `${rect.width}px`;
      surface.style.height = `${rect.height}px`;
      surface.style.flexShrink = "0";
    });
    const chart = root.querySelector<HTMLElement>("[data-analysis-chart]");
    const previousChartSize = previousChartSizeRef.current;
    previousChartSizeRef.current = null;
    const chartFinalSize = chart?.getBoundingClientRect();
    const chartStyles = chart
      ? { width: chart.style.width, height: chart.style.height, flexShrink: chart.style.flexShrink }
      : null;
    if (chart && previousChartSize && chartFinalSize) {
      chart.style.width = `${previousChartSize.width}px`;
      chart.style.height = `${previousChartSize.height}px`;
      chart.style.flexShrink = "0";
    }
    const restoreLayout = () => {
      root.style.height = rootHeight;
      savedStyles.forEach(({ surface, width, height, flexShrink }) => {
        surface.style.width = width;
        surface.style.height = height;
        surface.style.flexShrink = flexShrink;
      });
      if (chart && chartStyles) {
        chart.style.width = chartStyles.width;
        chart.style.height = chartStyles.height;
        chart.style.flexShrink = chartStyles.flexShrink;
      }
    };
    const isOpening = !!root.querySelector('[data-profile-collapsed="false"]');
    layoutAnimationRef.current = Flip.from(previousLayout, {
      duration: 0.42,
      ease: "power2.out",
      stagger: (_index, element) => {
        const isProfile = element.classList.contains(styles.profile);
        return isProfile === isOpening ? 0.06 : 0;
      },
      scale: false,
      simple: true,
      prune: true,
      absolute: true,
      toggleClass: styles.layoutTransition,
      onComplete: restoreLayout,
      onInterrupt: restoreLayout,
    });
    if (chart && previousChartSize && chartFinalSize) {
      layoutAnimationRef.current.to(chart, {
        width: chartFinalSize.width,
        height: chartFinalSize.height,
        duration: 0.42,
        ease: "power2.out",
      }, 0);
    }
  }, []);
  const profileLayoutTransition = useMemo<SpendingProfileLayoutTransition>(
    () => ({
      begin: beginProfileLayoutTransition,
      finish: finishProfileLayoutTransition,
    }),
    [beginProfileLayoutTransition, finishProfileLayoutTransition],
  );
  useLayoutEffect(() => () => {
    layoutAnimationRef.current?.kill();
  }, []);
  useLayoutEffect(() => {
    const root = rootRef.current!;
    const resize = () => {
      let top = 0;
      for (let node: HTMLElement | null = root; node; node = node.offsetParent as HTMLElement | null) top += node.offsetTop;
      root.style.setProperty("--insights-height", `${Math.max(0, window.innerHeight - top - 20)}px`);
    };
    resize();
    const observer = new ResizeObserver(resize);
    if (root.parentElement) observer.observe(root.parentElement);
    window.addEventListener("resize", resize);
    return () => { observer.disconnect(); window.removeEventListener("resize", resize); };
  }, []);
  return (
    <>
    <div ref={rootRef} className={styles.insights}>
      <div data-eclipse-anchor="insights" className={styles.eclipseAnchor} aria-hidden="true" />
      <section className={styles.profile} aria-label="Perfil de gastos">
        <SpendingProfileLayoutContext.Provider value={profileLayoutTransition}>
          {spendingProfileCard}
        </SpendingProfileLayoutContext.Provider>
      </section>
      <div className={styles.main}>
      <aside className={styles.sidebar} aria-label="Leituras e previsão financeira" tabIndex={0}>
        <div className={styles.forecast}>
          <FinancialForecastCard
            minimal
            compact
            totalIncome={forecastTotalIncome}
            totalExpense={forecastTotalExpense}
            projectedBalance={forecastProjectedBalance}
          />
        </div>
        <section className={styles.readings} aria-label="Leituras rápidas">
          <DashboardInsights insights={insights} />
        </section>
      </aside>
        <section className={styles.analysis} aria-label="Análise de gastos">
          <SpendingAnalysisPanel transactions={analysisTransactions} />
        </section>
      </div>
    </div>
    {accountAutomationView && <section aria-label="Regras financeiras da conta" className="mt-6">{accountAutomationView}</section>}
    </>
  );
}
