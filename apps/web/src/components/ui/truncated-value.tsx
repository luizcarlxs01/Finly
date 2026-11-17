"use client";

import { useEffect, useRef, useState } from "react";

type TruncatedValueProps = {
  value: string;
  className?: string;
  focusOnOverflow?: boolean;
};

export function TruncatedValue({ value, className = "", focusOnOverflow = true }: TruncatedValueProps) {
  const valueRef = useRef<HTMLSpanElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    const element = valueRef.current;
    if (!element) return;

    const updateTruncation = () => {
      setIsTruncated(element.scrollWidth > element.clientWidth + 1);
    };

    updateTruncation();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateTruncation);
      return () => window.removeEventListener("resize", updateTruncation);
    }

    const observer = new ResizeObserver(updateTruncation);
    observer.observe(element);
    return () => observer.disconnect();
  }, [value]);

  return (
    <span
      ref={valueRef}
      className={`block w-full min-w-0 max-w-full truncate focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary ${className}`}
      title={isTruncated ? value : undefined}
      aria-label={value}
      tabIndex={focusOnOverflow && isTruncated ? 0 : undefined}
    >
      {value}
    </span>
  );
}
