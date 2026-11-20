"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { Download } from "lucide-react";
import { createPortal } from "react-dom";
import { gsap } from "gsap";
import type { DashboardView } from "@/components/layout/app-floating-header";
import { JellyIndicator } from "@/components/layout/jelly-indicator";
import jellyStyles from "@/components/layout/jelly-navigation.module.css";
import styles from "./staggered-menu.module.css";
import { AccountAccessCard } from "@/components/auth/account-access-card";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";

function subscribeCompact(onChange: () => void) {
  const media = window.matchMedia("(max-width: 1099px)");
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function getCompact() { return window.matchMedia("(max-width: 1099px)").matches; }
function getServerCompact() { return false; }

export type StaggeredMenuItem = {
  label: string;
  value: DashboardView;
};

type StaggeredMenuProps = {
  items: StaggeredMenuItem[];
  compactItems?: StaggeredMenuItem[];
  activeView: DashboardView;
  onSelect: (view: DashboardView) => void;
  desktopNavigation: React.ReactNode;
  controls: React.ReactNode;
  className?: string;
};

export function StaggeredMenu({
  items,
  compactItems = [],
  activeView,
  onSelect,
  desktopNavigation,
  controls,
  className = "",
}: StaggeredMenuProps) {
  const [open, setOpen] = useState(false);
  const compact = useSyncExternalStore(subscribeCompact, getCompact, getServerCompact);
  const [panelVisible, setPanelVisible] = useState(false);
  const openRef = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const contentScrollRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLButtonElement>(null);
  const layersRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const toggleSlotRef = useRef<HTMLSpanElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const selectionCloseTimerRef = useRef<number | null>(null);

  const closeMenu = useCallback((restoreFocus = false) => {
    if (selectionCloseTimerRef.current !== null) {
      window.clearTimeout(selectionCloseTimerRef.current);
      selectionCloseTimerRef.current = null;
    }
    openRef.current = false;
    setOpen(false);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPanelVisible(false);
    }
    if (restoreFocus) window.setTimeout(() => toggleRef.current?.focus(), 0);
  }, [setOpen, setPanelVisible]);

  const selectItem = (view: DashboardView) => {
    if (selectionCloseTimerRef.current !== null) window.clearTimeout(selectionCloseTimerRef.current);
    onSelect(view);
    if (view !== activeView && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      selectionCloseTimerRef.current = window.setTimeout(() => closeMenu(true), 440);
    } else {
      closeMenu(true);
    }
  };

  useEffect(() => () => {
    if (selectionCloseTimerRef.current !== null) window.clearTimeout(selectionCloseTimerRef.current);
  }, []);

  useLayoutEffect(() => {
    if (!compact) return;
    const positionToggle = () => {
      const slot = toggleSlotRef.current;
      const toggle = toggleRef.current;
      if (!slot || !toggle) return;
      const bounds = slot.getBoundingClientRect();
      toggle.style.left = `${bounds.left}px`;
      toggle.style.top = `${bounds.top}px`;
    };
    positionToggle();
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(positionToggle) : null;
    const header = document.querySelector<HTMLElement>("[data-finly-header-surface]");
    if (header) observer?.observe(header);
    window.addEventListener("resize", positionToggle);
    window.addEventListener("scroll", positionToggle, { passive: true });
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", positionToggle);
      window.removeEventListener("scroll", positionToggle);
    };
  }, [compact]);

  useLayoutEffect(() => {
    const panel = panelRef.current;
    const layers = layersRef.current?.querySelectorAll<HTMLElement>(".sm-prelayer");
    if (!panel || !layers) return;

    const contentScroll = contentScrollRef.current;
    const updateNavigationPosition = () => {
      const header = document.querySelector<HTMLElement>("[data-finly-header-surface]");
      if (!contentScroll || !header) return;
      contentScroll.style.marginTop = `${Math.ceil(header.getBoundingClientRect().bottom + 12)}px`;
    };
    updateNavigationPosition();
    window.addEventListener("resize", updateNavigationPosition);
    window.addEventListener("scroll", updateNavigationPosition, { passive: true });
    const header = document.querySelector<HTMLElement>("[data-finly-header-surface]");
    const headerResizeObserver = header && typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(updateNavigationPosition)
      : null;
    if (header) headerResizeObserver?.observe(header);

    const compactBreakpoint = window.matchMedia("(max-width: 1099px)");
    const applyInitialState = (event?: MediaQueryListEvent) => {
      const isCompact = event?.matches ?? compactBreakpoint.matches;
      if (isCompact) {
        gsap.set([panel, ...layers], {
          xPercent: 100,
          autoAlpha: 0,
        });
      } else {
        gsap.set([panel, ...layers], { clearProps: "transform,opacity,visibility" });
        setPanelVisible(false);
      }
    };

    applyInitialState();
    compactBreakpoint.addEventListener("change", applyInitialState);
    return () => {
      compactBreakpoint.removeEventListener("change", applyInitialState);
      window.removeEventListener("resize", updateNavigationPosition);
      window.removeEventListener("scroll", updateNavigationPosition);
      headerResizeObserver?.disconnect();
    };
  }, [panelVisible]);

  useEffect(() => {
    const panel = panelRef.current;
    const layers = layersRef.current?.querySelectorAll<HTMLElement>(".sm-prelayer");
    if (!panel || !layers) return;

    timelineRef.current?.kill();
    if (!window.matchMedia("(max-width: 1099px)").matches) {
      return;
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const targets = [...layers, panel];
    if (reduceMotion) {
      gsap.set(targets, { xPercent: open ? 0 : 100, autoAlpha: open ? 1 : 0 });
    } else if (open) {
      const timeline = gsap.timeline();
      layers.forEach((layer, index) => {
        timeline.to(layer, { xPercent: 0, duration: 0.42, ease: "power3.out" }, index * 0.07);
      });
      timeline.to(panel, { xPercent: 0, autoAlpha: 1, duration: 0.52, ease: "power3.out" }, 0.08);
      timeline.fromTo(
        panel.querySelectorAll<HTMLElement>(".sm-panel-itemLabel"),
        { yPercent: 120, rotate: 8 },
        { yPercent: 0, rotate: 0, duration: 0.68, ease: "power3.out", stagger: 0.075 },
        0.28,
      );
      timelineRef.current = timeline;
    } else if (panelVisible) {
      const timeline = gsap.timeline({ onComplete: () => setPanelVisible(false) });
      timeline.to(
        panel.querySelectorAll<HTMLElement>(".sm-panel-itemLabel"),
        { yPercent: -120, rotate: -8, duration: 0.3, ease: "power2.in", stagger: { each: 0.035, from: "end" } },
        0,
      );
      timeline.to(panel, { xPercent: 100, autoAlpha: 0, duration: 0.42, ease: "power3.in" }, 0.05);
      layers.forEach((layer, index) => {
        timeline.to(layer, { xPercent: 100, duration: 0.38, ease: "power3.in" }, 0.08 + index * 0.05);
      });
      timelineRef.current = timeline;
    }

    if (open) {
      panel.querySelector<HTMLButtonElement>("[data-menu-item]")?.focus();
    }
  }, [open, panelVisible]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (target instanceof Element && target.closest("[data-finly-account-popup], [data-finly-account-backdrop]")) return;
      if (
        !rootRef.current?.contains(target) &&
        !toggleRef.current?.contains(target) &&
        !panelRef.current?.contains(target) &&
        !overlayRef.current?.contains(target)
      ) {
        closeMenu();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (document.querySelector("[data-finly-account-popup][data-open]")) return;
      if (event.key === "Escape") closeMenu(true);
      if (event.key === "Tab" && panelRef.current && (panelRef.current.contains(document.activeElement) || document.activeElement === toggleRef.current)) {
        const buttons = Array.from(panelRef.current.querySelectorAll<HTMLButtonElement>('button:not([disabled])')).filter(button => button.getClientRects().length > 0);
        if (toggleRef.current) buttons.unshift(toggleRef.current);
        const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
        event.preventDefault();
        buttons[(index + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length]?.focus();
      }
    };
    const compactBreakpoint = window.matchMedia("(max-width: 1099px)");
    const handleBreakpointChange = (event: MediaQueryListEvent) => {
      if (!event.matches) closeMenu();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    compactBreakpoint.addEventListener("change", handleBreakpointChange);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      compactBreakpoint.removeEventListener("change", handleBreakpointChange);
    };
  }, [open, closeMenu]);

  function renderItem(item: StaggeredMenuItem) {
    const active = item.value === activeView;
    return (
      <li key={item.value} data-jelly-active={active ? "true" : undefined} className="sm-panel-itemWrap overflow-hidden">
        <button
          type="button"
          data-menu-item
          aria-current={active ? "page" : undefined}
          onClick={() => selectItem(item.value)}
          className={`sm-panel-itemLabel relative z-10 w-full rounded-xl px-3 py-2 text-left text-3xl font-semibold leading-tight tracking-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-4xl min-[1100px]:hidden ${active ? "text-white" : `text-foreground ${jellyStyles.feedback}`}`}
        >
          {item.label}
        </button>
      </li>
    );
  }

  const menuPanel = panelVisible && compact && typeof document !== "undefined"
    ? createPortal(
        <>
          <button
            ref={overlayRef}
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            onClick={() => closeMenu()}
            className={`${styles.overlay} fixed inset-0 z-[30] cursor-default bg-background/45 backdrop-blur-sm min-[1100px]:hidden`}
          />

          <div
            ref={layersRef}
            aria-hidden="true"
            className={`${styles.layers} pointer-events-none fixed inset-y-0 right-0 z-[31] h-dvh w-full min-[640px]:w-[min(28rem,calc(100vw-2rem))] min-[1100px]:hidden`}
          >
            <div className="sm-prelayer absolute inset-0 rounded-l-[1.75rem] bg-secondary shadow-2xl" />
            <div className="sm-prelayer absolute inset-0 rounded-l-[1.75rem] bg-primary shadow-2xl" />
          </div>

          <aside
            ref={panelRef}
            id="finly-staggered-menu-panel"
            aria-label="Navegação do aplicativo"
            aria-hidden={!open}
            inert={!open}
            className={`${styles.panel} fixed inset-y-0 right-0 z-[32] flex h-dvh max-h-dvh w-full flex-col overflow-hidden border-l border-border bg-card px-6 text-card-foreground shadow-2xl transition-[visibility] duration-300 min-[640px]:w-[min(28rem,calc(100vw-2rem))] min-[640px]:px-8 min-[1100px]:hidden ${open ? "pointer-events-auto" : "pointer-events-none"}`}
            style={{ visibility: panelVisible ? "visible" : "hidden" }}
          >
            <div id="finly-staggered-menu-content" ref={contentScrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-8">
              <nav aria-label="Navegação principal" aria-hidden={!open} className="relative isolate">
                <JellyIndicator activeKey={activeView} vertical className="rounded-xl" />
                <ul className="relative z-10 flex flex-col gap-3 sm:gap-4">
                  {items.map(renderItem)}
                  {compactItems.map(renderItem)}
                </ul>
              </nav>
            </div>
            <div aria-label="Ações do menu" role="group" className="grid shrink-0 grid-cols-3 gap-2 border-t border-border/60 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <AccountAccessCard showLabel centered />
              <Button type="button" variant="outline" className="h-11 w-full min-w-0 gap-2 rounded-xl px-2 text-xs sm:text-sm" onClick={() => selectItem("download")} aria-current={activeView === "download" ? "page" : undefined}>
                <Download className="size-4" /><span>Baixar</span>
              </Button>
              <ThemeToggle showLabel />
            </div>
          </aside>
        </>,
        document.body,
      )
    : null;

  return (
    <div ref={rootRef} className={`relative z-50 flex items-center gap-2 ${className}`}>
      <div className="hidden min-[1100px]:flex items-center gap-2">{desktopNavigation}</div>
      <div className="relative z-[4] hidden shrink-0 items-center gap-2 min-[1100px]:flex">{!compact && controls}</div>
      <span ref={toggleSlotRef} className="block size-11 shrink-0 min-[1100px]:hidden" />
      {compact && createPortal(<button
        ref={toggleRef}
        type="button"
        aria-label={open ? "Fechar menu" : "Abrir menu"}
        aria-expanded={open}
        aria-controls="finly-staggered-menu-panel"
        onClick={() => {
          const next = !openRef.current;
          if (!next && selectionCloseTimerRef.current !== null) {
            window.clearTimeout(selectionCloseTimerRef.current);
            selectionCloseTimerRef.current = null;
          }
          openRef.current = next;
          if (next) setPanelVisible(true);
          else if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setPanelVisible(false);
          setOpen(next);
        }}
        className={`fixed ${panelVisible ? "z-[65]" : "z-40"} inline-flex size-11 items-center justify-center rounded-md bg-transparent p-0 text-foreground transition-colors hover:text-primary aria-expanded:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none`}
      >
        <span aria-hidden="true" className="flex size-5 flex-col items-end justify-between py-0.5">
          <span className={`h-0.5 rounded-full bg-current transition-[width] duration-200 motion-reduce:transition-none ${open ? "w-4" : "w-5"}`} />
          <span className="h-0.5 w-5 rounded-full bg-current" />
          <span className={`h-0.5 rounded-full bg-current transition-[width] duration-200 motion-reduce:transition-none ${open ? "w-3" : "w-5"}`} />
        </span>
      </button>, document.body)}

      {menuPanel}
    </div>
  );
}


