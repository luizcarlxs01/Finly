"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { gsap } from "gsap";
import type { DashboardView } from "@/components/layout/app-floating-header";
import { JellyIndicator } from "@/components/layout/jelly-indicator";
import jellyStyles from "@/components/layout/jelly-navigation.module.css";

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
};

export function StaggeredMenu({
  items,
  compactItems = [],
  activeView,
  onSelect,
  desktopNavigation,
  controls,
}: StaggeredMenuProps) {
  const [open, setOpen] = useState(false);
  const [panelVisible, setPanelVisible] = useState(false);
  const openRef = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const contentScrollRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLButtonElement>(null);
  const layersRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const horizontalLineRef = useRef<HTMLSpanElement>(null);
  const verticalLineRef = useRef<HTMLSpanElement>(null);
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
    gsap.set(horizontalLineRef.current, {
      xPercent: -50,
      yPercent: -50,
      rotation: 0,
      transformOrigin: "50% 50%",
    });
    gsap.set(verticalLineRef.current, {
      xPercent: -50,
      yPercent: -50,
      rotation: 90,
      transformOrigin: "50% 50%",
    });

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
    const horizontalLine = horizontalLineRef.current;
    const verticalLine = verticalLineRef.current;
    if (horizontalLine && verticalLine) {
      gsap.to(horizontalLine, { rotation: open ? 45 : 0, duration: reduceMotion ? 0 : 0.3, ease: "power2.out" });
      gsap.to(verticalLine, { rotation: open ? 135 : 90, duration: reduceMotion ? 0 : 0.3, ease: "power2.out" });
    }
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
      if (
        !rootRef.current?.contains(target) &&
        !panelRef.current?.contains(target) &&
        !overlayRef.current?.contains(target)
      ) {
        closeMenu();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu(true);
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

  const menuPanel = panelVisible && typeof document !== "undefined"
    ? createPortal(
        <>
          <button
            ref={overlayRef}
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            onClick={() => closeMenu()}
            className="fixed inset-0 z-[30] cursor-default bg-background/45 backdrop-blur-sm min-[1100px]:hidden"
          />

          <div
            ref={layersRef}
            aria-hidden="true"
            className="pointer-events-none fixed inset-y-0 right-0 z-[31] h-dvh w-full min-[640px]:w-[min(28rem,calc(100vw-2rem))] min-[1100px]:hidden"
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
            className={`fixed inset-y-0 right-0 z-[32] flex h-dvh max-h-dvh w-full flex-col overflow-hidden border-l border-border bg-card px-6 text-card-foreground shadow-2xl transition-[visibility] duration-300 min-[640px]:w-[min(28rem,calc(100vw-2rem))] min-[640px]:px-8 min-[1100px]:hidden ${open ? "pointer-events-auto" : "pointer-events-none"}`}
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
          </aside>
        </>,
        document.body,
      )
    : null;

  return (
    <div ref={rootRef} className="relative z-50 flex items-center gap-2">
      <div className="hidden min-[1100px]:flex items-center gap-2">{desktopNavigation}</div>
      <div className="relative z-[4] flex shrink-0 items-center gap-2">{controls}</div>
      <button
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
        className="relative z-[4] inline-flex size-11 items-center justify-center rounded-2xl border border-border/70 bg-card p-0 text-foreground shadow-sm transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-[1100px]:hidden"
      >
        <span aria-hidden="true" className="relative size-5">
          <span ref={horizontalLineRef} className="absolute left-1/2 top-1/2 h-0.5 w-4 rounded-full bg-current" />
          <span ref={verticalLineRef} className="absolute left-1/2 top-1/2 h-0.5 w-4 rounded-full bg-current" />
        </span>
      </button>

      {menuPanel}
    </div>
  );
}


