"use client";

import { ArrowDownCircle, ArrowUpCircle, ListFilter } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { TransactionFilter } from "@/types/finance";

type TransactionFilterTabsProps = {
  value: TransactionFilter;
  onChange: (value: TransactionFilter) => void;
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
}: TransactionFilterTabsProps) {
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
