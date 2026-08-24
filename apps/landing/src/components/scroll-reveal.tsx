"use client";

import { useEffect, useRef, type ReactNode } from "react";

type ScrollRevealProps = {
  children: ReactNode;
  className?: string;
};

export function ScrollReveal({ children, className = "" }: ScrollRevealProps) {
  const revealRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = revealRef.current;

    if (!element) {
      return;
    }

    element.dataset.revealReady = "true";

    if (!("IntersectionObserver" in window)) {
      element.dataset.visible = "true";
      return;
    }

    element.dataset.visible = "false";

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          return;
        }

        element.dataset.visible = "true";
        observer.unobserve(element);
      },
      {
        threshold: 0.16,
        rootMargin: "0px 0px -8% 0px",
      },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={revealRef}
      className={`scroll-reveal ${className}`.trim()}
    >
      {children}
    </div>
  );
}
