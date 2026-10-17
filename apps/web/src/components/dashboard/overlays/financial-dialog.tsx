"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import styles from "./financial-dialog.module.css";

type Props = { title: string; onClose: () => void; children: ReactNode; wide?: boolean; header?: ReactNode; className?: string; smooth?: boolean };
export function FinancialDialog({ title, onClose, children, wide = false, header, className, smooth = false }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const closeRef = useRef(onClose);
  const closingRef = useRef(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  function finishClose() {
    if (!closingRef.current || closeTimerRef.current === null) return;
    if (closeTimerRef.current !== null) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = null;
    closeRef.current();
  }
  function requestClose() {
    if (closingRef.current) return;
    if (!smooth || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { closeRef.current(); return; }
    const dialog = ref.current!;
    const current = getComputedStyle(dialog);
    const backdrop = getComputedStyle(dialog, "::backdrop");
    dialog.style.setProperty("--exit-opacity", current.opacity);
    dialog.style.setProperty("--exit-transform", current.transform);
    dialog.style.setProperty("--exit-backdrop", backdrop.backgroundColor);
    dialog.style.setProperty("--exit-blur", backdrop.backdropFilter);
    closingRef.current = true;
    dialog.dataset.closing = "true";
    closeTimerRef.current = setTimeout(finishClose, 240);
  }
  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  useEffect(() => {
    const dialog = ref.current!;
    const trigger = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    return () => { if (closeTimerRef.current !== null) clearTimeout(closeTimerRef.current); dialog.close(); document.body.style.overflow = overflow; trigger?.focus(); };
  }, []);
  return createPortal(<dialog ref={ref} aria-label={title} className={[styles.dialog, wide ? styles.wide : "", className ?? "", smooth ? styles.smooth : ""].join(" ")} onCancel={event => { event.preventDefault(); requestClose(); }} onClick={event => {
    if (event.target !== event.currentTarget) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) requestClose();
  }} onAnimationEnd={event => { if (closingRef.current && event.target === event.currentTarget && !event.nativeEvent.pseudoElement) finishClose(); }}>
    <header className={styles.header}>{header ?? <h2 className="text-xl font-semibold">{title}</h2>}<button type="button" aria-label="Fechar" onClick={requestClose} className="flex size-10 shrink-0 items-center justify-center rounded-xl transition hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-primary"><X className="size-5" /></button></header>
    <div className={styles.content}>{children}</div>
  </dialog>, document.body);
}
