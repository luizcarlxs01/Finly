"use client";
import { useSyncExternalStore } from "react";
const key = "finly:dashboard-values-hidden";
const event = "finly:dashboard-values-hidden-change";
function subscribe(change: () => void) {
  window.addEventListener("storage", change); window.addEventListener(event, change);
  return () => { window.removeEventListener("storage", change); window.removeEventListener(event, change); };
}
const snapshot = () => window.localStorage.getItem(key) === "true";
export function useValuePrivacy() {
  const hidden = useSyncExternalStore(subscribe, snapshot, () => false);
  return { hidden, toggle: () => { window.localStorage.setItem(key, String(!snapshot())); window.dispatchEvent(new Event(event)); } };
}
