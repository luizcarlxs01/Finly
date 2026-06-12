"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
} from "react";
import { useAuthSession } from "@/hooks/use-auth-session";

export type FinanceSource = "local" | "api";

type FinanceSourceContextValue = {
  isLoaded: boolean;
  source: FinanceSource;
};

const FinanceSourceContext = createContext<FinanceSourceContextValue | null>(
  null,
);

export function FinanceSourceProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { authenticated, isLoaded } = useAuthSession();

  const value = useMemo<FinanceSourceContextValue>(
    () => ({
      isLoaded,
      source: authenticated ? "api" : "local",
    }),
    [authenticated, isLoaded],
  );

  return (
    <FinanceSourceContext.Provider value={value}>
      {children}
    </FinanceSourceContext.Provider>
  );
}

export function useFinanceSource() {
  const context = useContext(FinanceSourceContext);

  if (!context) {
    throw new Error(
      "useFinanceSource precisa ser usado dentro de FinanceSourceProvider.",
    );
  }

  return context;
}
