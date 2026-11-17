"use client";

import { ArrowDownCircle, ArrowUpCircle, ListFilter } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { TransactionFilter } from "@/types/finance";

type TransactionFilterTabsProps = {
  value: TransactionFilter;
  onChange: (value: TransactionFilter) => void;
  minimal?: boolean;
};

const filters: Array<{
  label: string;
  value: TransactionFilter;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { label: "Todas", value: "all", icon: ListFilter },
  { label: "Entradas", value: "income", icon: ArrowUpCircle },
  { label: "Saídas", value: "expense", icon: ArrowDownCircle },
];

export function TransactionFilterTabs({
  value,
  onChange,
  minimal = false,
}: TransactionFilterTabsProps) {
  if (minimal) {
    return (
      <div className="inline-flex max-w-full flex-wrap gap-1 rounded-2xl border border-border/60 bg-muted/35 p-1.5">
        {filters.map((filter) => {
          const isActive = value === filter.value;
          const Icon = filter.icon;

          return (
            <Button
              key={filter.value}
              type="button"
              variant={isActive ? "default" : "ghost"}
              onClick={() => onChange(filter.value)}
              aria-pressed={isActive}
              className="min-w-24 rounded-xl px-3"
            >
              <Icon className="size-4" />
              {filter.label}
            </Button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
          Filtro principal
        </p>
        <h4 className="text-base font-semibold text-foreground">
          Escolha o tipo de movimentação que deseja visualizar
        </h4>
      </div>

      <div className="flex flex-wrap gap-2 rounded-[1.5rem] border border-border/70 bg-card/70 p-2">
        {filters.map((filter) => {
          const isActive = value === filter.value;
          const Icon = filter.icon;

          return (
            <Button
              key={filter.value}
              type="button"
              variant={isActive ? "default" : "ghost"}
              onClick={() => onChange(filter.value)}
              className="min-w-32 rounded-2xl"
            >
              <Icon className="size-4" />
              {filter.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
