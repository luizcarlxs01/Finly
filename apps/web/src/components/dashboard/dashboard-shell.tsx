"use client";

import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import type { DashboardView } from "@/components/layout/app-floating-header";
import styles from "./dashboard-shell.module.css";

type DashboardShellProps = {
  activeView: DashboardView;
  homeView: ReactNode;
  transactionsView: ReactNode;
  goalsView: ReactNode;
  insightsView: ReactNode;
  forumView: ReactNode;
  downloadView: ReactNode;
};

export function DashboardShell({ activeView, homeView, transactionsView, goalsView, insightsView, forumView, downloadView }: DashboardShellProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const eclipseRef = useRef<SVGSVGElement>(null);
  const curveRef = useRef<SVGGElement>(null);
  const previousView = useRef(activeView);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const indicatorSnapshot = useRef<{ node: HTMLElement; left: number; top: number; width: number; height: number } | null>(null);
  const indicatorSurface = useRef<HTMLElement | null>(null);
  const surfaceOrigin = useRef({ left: 0, top: 0 });
  const hiddenIndicator = useRef<HTMLElement | null>(null);
  const isEclipseView = activeView === "home" || activeView === "goals" || activeView === "transactions";

  useLayoutEffect(() => {
    const shell = shellRef.current;
    const content = contentRef.current;
    const eclipse = eclipseRef.current;
    const curve = curveRef.current;
    if (!shell || !content || !eclipse || !curve) return;
    const previous = previousView.current;
    const snapshot = indicatorSnapshot.current;
    previousView.current = activeView;
    timelineRef.current?.kill();
    if (hiddenIndicator.current) hiddenIndicator.current.style.removeProperty("visibility");
    hiddenIndicator.current = null;
    gsap.set(content, { clearProps: "transform,opacity" });
    const indicators = content.querySelector<HTMLElement>("[data-shared-indicators]");
    const anchor = content.querySelector<HTMLElement>("[data-eclipse-anchor]");
    const showEclipse = Boolean(anchor && isEclipseView);

    function position() {
      if (!shell || !eclipse) return 0;
      eclipse.style.width = `${document.documentElement.clientWidth}px`;
      if (!anchor) return Number(gsap.getProperty(eclipse, "top")) || 0;
      const offset = activeView === "transactions" ? 15 : activeView === "goals" ? 45 : 100;
      return anchor.getBoundingClientRect().bottom - shell.getBoundingClientRect().top - offset;
    }
    const top = position();
    eclipse.style.visibility = "visible";
    const horizontal = activeView === "goals" ? -36 : 0;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pairChanged = previous !== activeView;
    const sharedPair = pairChanged && ((previous === "transactions" && activeView === "goals") || (previous === "goals" && activeView === "transactions"));
    const captureIndicators = () => {
      if (!indicators) { indicatorSnapshot.current = null; return; }
      const rect = indicators.getBoundingClientRect();
      const node = indicators.cloneNode(true) as HTMLElement;
      node.style.removeProperty("visibility");
      indicatorSnapshot.current = { node, left: rect.left + window.scrollX, top: rect.top + window.scrollY, width: rect.width, height: rect.height };
    };
    captureIndicators();
    const destination = indicatorSnapshot.current;
    const finishIndicators = () => {
      indicatorSurface.current?.remove();
      indicatorSurface.current = null;
      if (hiddenIndicator.current) hiddenIndicator.current.style.removeProperty("visibility");
      hiddenIndicator.current = null;
    };
    let surface: HTMLElement | null = null;
    let incoming: HTMLElement | null = null;
    let outgoing: Element[] = [];
    const shellBounds = shell.getBoundingClientRect();
    const origin = { left: shellBounds.left + window.scrollX, top: shellBounds.top + window.scrollY };
    if (sharedPair && !reducedMotion.matches && indicators && snapshot && destination) {
      surface = indicatorSurface.current;
      if (!surface) {
        surface = document.createElement("div");
        surface.className = styles.indicatorSurface;
        surface.setAttribute("data-indicator-transition", "");
        surface.setAttribute("aria-hidden", "true");
        surface.inert = true;
        gsap.set(surface, { left: snapshot.left - origin.left, top: snapshot.top - origin.top, width: snapshot.width, height: snapshot.height });
        surface.append(snapshot.node);
        shell.append(surface);
        indicatorSurface.current = surface;
      } else {
        gsap.set(surface, { left: Number(gsap.getProperty(surface, "left")) + surfaceOrigin.current.left - origin.left, top: Number(gsap.getProperty(surface, "top")) + surfaceOrigin.current.top - origin.top });
      }
      surfaceOrigin.current = origin;
      outgoing = Array.from(surface.children);
      incoming = destination.node;
      surface.append(incoming);
      for (const layer of surface.children) {
        const element = layer as HTMLElement;
        const old = element === incoming ? destination : snapshot;
        Object.assign(element.style, { position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", width: element.style.width || `${old.width}px`, height: element.style.height || `${old.height}px`, maxWidth: "none", margin: "0", background: "transparent", boxShadow: "none", backdropFilter: "none" });
        element.removeAttribute("data-shared-indicators");
        element.removeAttribute("data-eclipse-anchor");
        // The visual copy must not duplicate control IDs or accessible content.
        element.querySelectorAll("[id]").forEach(node => node.removeAttribute("id"));
      }
      indicators.style.visibility = "hidden";
      hiddenIndicator.current = indicators;
      gsap.set(incoming, { opacity: 0 });
    } else finishIndicators();
    if (!pairChanged || reducedMotion.matches) {
      gsap.set(eclipse, { top, opacity: showEclipse ? 1 : 0 });
      gsap.set(curve, { x: horizontal });
    } else {
      timelineRef.current = gsap.timeline({ onComplete: () => {
        gsap.set(content, { clearProps: "transform,opacity" });
        finishIndicators();
        captureIndicators();
      } });
      timelineRef.current
        .to(eclipse, { top, opacity: showEclipse ? 1 : 0, duration: 0.4, ease: "power2.inOut" }, 0)
        .to(curve, { x: horizontal, duration: 0.4, ease: "power2.inOut" }, 0)
        .fromTo(content, { opacity: 0, y: -8 }, { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }, 0.1);
      if (surface && incoming && destination) {
        timelineRef.current
          .to(surface, { left: destination.left - origin.left, top: destination.top - origin.top, width: destination.width, height: destination.height, duration: 0.4, ease: "power2.inOut" }, 0)
          .to(outgoing, { opacity: 0, duration: 0.14, onComplete: () => outgoing.forEach(node => node.remove()) }, 0)
          .to(incoming, { opacity: 1, duration: 0.2, ease: "power2.out" }, 0.2);
      }
    }
    const settle = () => {
      timelineRef.current?.kill();
      gsap.set(content, { clearProps: "transform,opacity" });
      gsap.set(eclipse, { top: position(), opacity: showEclipse ? 1 : 0 });
      gsap.set(curve, { x: horizontal });
      finishIndicators();
      captureIndicators();
    };
    const updates = new MutationObserver(() => {
      if (!timelineRef.current?.isActive()) captureIndicators();
    });
    if (indicators) updates.observe(indicators, { childList: true, subtree: true, characterData: true });
    window.addEventListener("resize", settle);
    reducedMotion.addEventListener("change", settle);
    return () => {
      window.removeEventListener("resize", settle);
      reducedMotion.removeEventListener("change", settle);
      updates.disconnect();
    };
  }, [activeView, isEclipseView]);

  useEffect(() => () => { timelineRef.current?.kill(); indicatorSurface.current?.remove(); }, []);

  const view = { home: homeView, transactions: transactionsView, goals: goalsView, insights: insightsView, forum: forumView, download: downloadView }[activeView];
  return <div ref={shellRef} className={styles.shell}>
    <svg ref={eclipseRef} className={styles.eclipse} viewBox="0 0 1440 230" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="home-horizon-light" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#69b4fe" stopOpacity="0.35" />
          <stop offset="30%" stopColor="#a6dcff" />
          <stop offset="50%" stopColor="#ffffff" />
          <stop offset="70%" stopColor="#a6dcff" />
          <stop offset="100%" stopColor="#69b4fe" stopOpacity="0.35" />
        </linearGradient>
        <filter id="home-horizon-glow" x="-10%" y="-100%" width="120%" height="400%"><feGaussianBlur stdDeviation="22" /></filter>
        <filter id="home-horizon-edge" x="-10%" y="-100%" width="120%" height="400%"><feGaussianBlur stdDeviation="3" /></filter>
      </defs>
      <g ref={curveRef}>
        <path d="M -100 170 Q 720 -72 1540 170" fill="none" stroke="#69b4fe" strokeWidth="42" opacity="0.26" transform="translate(0 20)" filter="url(#home-horizon-glow)" />
        <path d="M -100 170 Q 720 -72 1540 170" fill="none" stroke="url(#home-horizon-light)" strokeWidth="8" opacity="0.85" filter="url(#home-horizon-edge)" />
        <path d="M -100 170 Q 720 -72 1540 170" fill="none" stroke="url(#home-horizon-light)" strokeWidth="1.5" />
      </g>
    </svg>
    <div ref={contentRef} className={styles.content}>{view}</div>
  </div>;
}
