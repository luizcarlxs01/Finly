"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";

type Position = { x: number; y: number; width: number; height: number };

export function JellyIndicator({
  activeKey,
  vertical = false,
  className = "",
}: {
  activeKey: string;
  vertical?: boolean;
  className?: string;
}) {
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const previousKeyRef = useRef<string | null>(null);
  const positionRef = useRef<Position | null>(null);

  useLayoutEffect(() => {
    const indicator = indicatorRef.current;
    const container = indicator?.parentElement;
    if (!indicator || !container) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const target = container.querySelector<HTMLElement>('[data-jelly-active="true"]');

    const updatePosition = (animate: boolean) => {
      if (!target || target.offsetWidth === 0) {
        gsap.killTweensOf(indicator);
        gsap.set(indicator, { autoAlpha: 0 });
        previousKeyRef.current = null;
        positionRef.current = null;
        return;
      }

      const containerRect = container.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const next: Position = {
        x: targetRect.left - containerRect.left,
        y: targetRect.top - containerRect.top,
        width: targetRect.width,
        height: targetRect.height,
      };
      const previous = positionRef.current;
      const keyChanged = previousKeyRef.current !== null && previousKeyRef.current !== activeKey;
      if (
        !keyChanged && previous &&
        Math.abs(previous.x - next.x) < 0.5 &&
        Math.abs(previous.y - next.y) < 0.5 &&
        Math.abs(previous.width - next.width) < 0.5 &&
        Math.abs(previous.height - next.height) < 0.5
      ) return;

      previousKeyRef.current = activeKey;
      positionRef.current = next;
      gsap.killTweensOf(indicator);

      if (!animate || !keyChanged || reducedMotion) {
        gsap.set(indicator, { ...next, scaleX: 1, scaleY: 1, autoAlpha: 1 });
        return;
      }

      gsap.timeline()
        .to(indicator, {
          scaleX: vertical ? 0.94 : 1.16,
          scaleY: vertical ? 1.14 : 0.88,
          duration: 0.14,
          ease: "power2.out",
        })
        .to(indicator, { ...next, autoAlpha: 1, duration: 0.38, ease: "back.out(1.5)" }, 0.04)
        .to(indicator, { scaleX: 1, scaleY: 1, duration: 0.42, ease: "elastic.out(1, 0.55)" }, 0.2);
    };

    updatePosition(true);
    const resizeObserver = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(() => updatePosition(false))
      : null;
    resizeObserver?.observe(container);
    if (target) resizeObserver?.observe(target);
    const handleResize = () => updatePosition(false);
    window.addEventListener("resize", handleResize);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", handleResize);
      gsap.killTweensOf(indicator);
    };
  }, [activeKey, vertical]);

  return (
    <span
      ref={indicatorRef}
      data-jelly-indicator
      aria-hidden="true"
      className={`pointer-events-none absolute left-0 top-0 z-0 bg-[#0968e6] opacity-0 will-change-transform ${className}`}
    />
  );
}
