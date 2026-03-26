"use client";

import { Button } from "@/components/ui/button";
import type { TransactionFilter } from "@/types/finance";

type TransactionFilterTabsProps = {
  value: TransactionFilter;
  onChange: (value: TransactionFilter) => void;
};

const filters: Array<{ label: string; value: TransactionFilter }> = [
  { label: "Todas", value: "all" },
  { label: "Entradas", value: "income" },
  { label: "Saídas", value: "expense" },
];

export function TransactionFilterTabs({
  value,
  onChange,
}: TransactionFilterTabsProps) {
  return (
    <div className="flex flex-wrap gap-2 rounded-2xl border border-border/70 bg-card/70 p-2">
      {filters.map((filter) => {
        const isActive = value === filter.value;

        return (
          <Button
            key={filter.value}
            type="button"
            variant={isActive ? "default" : "ghost"}
            onClick={() => onChange(filter.value)}
            className="min-w-28 rounded-xl"
          >
            {filter.label}
          </Button>
        );
      })}
    </div>
  );
}
