"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import styles from "./goal-create-dialog.module.css";

type Props = {
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  title: string;
  animation?: "genie" | "gentle";
  onClose: () => void;
  onClosing?: () => void;
  children: (requestClose: () => void) => React.ReactNode;
};

export function GoalGlassDialog({ triggerRef, title, onClose, children, animation = "genie", onClosing }: Props) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const closingRef = useRef(false);
  const mountedRef = useRef(false);
  const closeRef = useRef(onClose);

  useEffect(() => { closeRef.current = onClose; }, [onClose]);

  const getOrigin = useCallback(() => {
    const panel = surfaceRef.current!.parentElement!.getBoundingClientRect();
    const button = triggerRef.current?.getBoundingClientRect();
    return button ? {
      x: button.x + button.width / 2 - (panel.x + panel.width / 2),
      y: button.y + button.height / 2 - (panel.y + panel.height / 2),
      scaleX: button.width / Math.max(panel.width, 1),
      scaleY: button.height / Math.max(panel.height, 1),
    } : { x: 0, y: 12, scaleX: 0.95, scaleY: 0.95 };
  }, [triggerRef]);

  const requestClose = useCallback(() => {
    if (!mountedRef.current || closingRef.current) return;
    closingRef.current = true;
    onClosing?.();
    if (dialogRef.current) dialogRef.current.inert = true;
    timelineRef.current?.kill();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      closeRef.current();
      return;
    }
    if (animation === "gentle") {
      timelineRef.current = gsap.timeline({ onComplete: () => closeRef.current() })
        .to(dialogRef.current, { opacity: 0, scale: 0.97, y: 12, duration: 0.22, ease: "power2.in" }, 0)
        .to(backdropRef.current, { backgroundColor: "rgba(2,6,23,0)", backdropFilter: "blur(0px)", duration: 0.22 }, 0);
      return;
    }
    const origin = getOrigin();
    if (gsap.getProperty(surfaceRef.current!, "clipPath") === "none") {
      gsap.set(surfaceRef.current, { clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)" });
    }
    timelineRef.current = gsap.timeline({ onComplete: () => closeRef.current() })
      .to(contentRef.current, { opacity: 0, y: 6, duration: 0.1 })
      .to(surfaceRef.current, { ...origin, opacity: 0, clipPath: "polygon(35% 0%, 65% 0%, 100% 100%, 0% 100%)", duration: 0.28, ease: "power2.in" }, 0.06);
  }, [getOrigin, animation, onClosing]);

  useLayoutEffect(() => {
    mountedRef.current = true;
    closingRef.current = false;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      if (animation === "gentle") {
        timelineRef.current = gsap.timeline()
          .fromTo(backdropRef.current, { backgroundColor: "rgba(2,6,23,0)", backdropFilter: "blur(0px)" }, { backgroundColor: "rgba(2,6,23,0.55)", backdropFilter: "blur(4px)", duration: 0.3 }, 0)
          .fromTo(dialogRef.current, { opacity: 0, scale: 0.97, y: 12 }, { opacity: 1, scale: 1, y: 0, duration: 0.3, ease: "power2.out" }, 0);
      } else timelineRef.current = gsap.timeline({ onComplete: () => { gsap.set(surfaceRef.current, { clipPath: "none" }); } })
        .fromTo(surfaceRef.current, { ...getOrigin(), opacity: 0.25, clipPath: "polygon(35% 0%, 65% 0%, 100% 100%, 0% 100%)" }, { x: 0, y: 0, scaleX: 1, scaleY: 1, opacity: 1, clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)", duration: 0.38, ease: "power3.out" })
        .fromTo(contentRef.current, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.16 }, 0.22);
    }
    return () => {
      mountedRef.current = false;
      timelineRef.current?.kill();
      document.body.style.overflow = oldOverflow;
    };
  }, [getOrigin, triggerRef, animation]);

  useEffect(() => {
    const trigger = triggerRef.current;
    return () => trigger?.focus();
  }, [triggerRef]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") requestClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [requestClose]);

  const trapFocus = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Tab") return;
    const items = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled])') ?? []);
    const first = items[0], last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  };

  return <div ref={backdropRef} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-sm" onMouseDown={event => { if (event.target === event.currentTarget) { event.preventDefault(); requestClose(); } }}>
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-label={title} onKeyDown={trapFocus} className="w-full max-w-xl">
      <div className={styles.panel}>
        <div ref={surfaceRef} aria-hidden="true" className={styles.surface} />
        {/* The render callback only passes requestClose to event handlers; it does not read refs. */}
        {/* eslint-disable-next-line react-hooks/refs */}
        <div ref={contentRef} className={`${styles.content} max-h-[calc(100dvh-1.5rem)] overflow-y-auto rounded-2xl`}>{children(requestClose)}</div>
      </div>
    </div>
  </div>;
}
