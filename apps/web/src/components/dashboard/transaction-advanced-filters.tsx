"use client";

import { Search, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  getTransactionCategoryLabel,
  TRANSACTION_CATEGORIES,
} from "@/types/transaction-category";

export type TransactionSortOption =
  | "newest"
  | "oldest"
  | "highest"
  | "lowest"
  | "title-asc"
  | "title-desc";

type TransactionAdvancedFiltersProps = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  categoryValue: string;
  onCategoryChange: (value: string) => void;
  sortValue: TransactionSortOption;
  onSortChange: (value: TransactionSortOption) => void;
  resultCount: number;
  totalCount: number;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
};

const fieldClassName =
  "w-full rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/80 focus:border-primary focus:ring-2 focus:ring-primary/15";

export function TransactionAdvancedFilters({
  searchValue,
  onSearchChange,
  categoryValue,
  onCategoryChange,
  sortValue,
  onSortChange,
  resultCount,
  totalCount,
  hasActiveFilters,
  onClearFilters,
}: TransactionAdvancedFiltersProps) {
  return (
    <div className="space-y-5 rounded-[1.5rem] border border-border/70 bg-card/80 p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            <SlidersHorizontal className="size-3.5" />
            Filtros avançados
          </div>

          <div className="space-y-1">
            <h4 className="text-base font-semibold text-foreground">
              Refine o extrato com mais contexto
            </h4>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              Combine busca, categoria e ordenação para encontrar movimentações
              específicas sem alterar os dados salvos.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[260px] lg:grid-cols-1">
          <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Resultados
            </p>
            <p className="mt-1 text-lg font-semibold text-foreground">
              {resultCount} de {totalCount}
            </p>
          </div>

          <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Estado dos filtros
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {hasActiveFilters ? "Filtros ativos" : "Visualização padrão"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_220px_220px]">
        <div className="space-y-2">
          <label
            htmlFor="transaction-search"
            className="text-sm font-medium text-foreground"
          >
            Buscar transação
          </label>

          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="transaction-search"
              type="search"
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
              className={`${fieldClassName} pl-11`}
              placeholder="Buscar por título, categoria ou valor"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="transaction-category-filter"
            className="text-sm font-medium text-foreground"
          >
            Categoria
          </label>

          <select
            id="transaction-category-filter"
            value={categoryValue}
            onChange={(event) => onCategoryChange(event.target.value)}
            className={fieldClassName}
          >
            <option value="all">Todas as categorias</option>
            {TRANSACTION_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {getTransactionCategoryLabel(category)}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="transaction-sort"
            className="text-sm font-medium text-foreground"
          >
            Ordenação
          </label>

          <select
            id="transaction-sort"
            value={sortValue}
            onChange={(event) =>
              onSortChange(event.target.value as TransactionSortOption)
            }
            className={fieldClassName}
          >
            <option value="newest">Mais recentes</option>
            <option value="oldest">Mais antigas</option>
            <option value="highest">Maior valor</option>
            <option value="lowest">Menor valor</option>
            <option value="title-asc">Título A-Z</option>
            <option value="title-desc">Título Z-A</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Use os filtros para reduzir ruído e focar apenas nas movimentações que
          você quer analisar agora.
        </p>

        {hasActiveFilters ? (
          <Button
            type="button"
            variant="outline"
            onClick={onClearFilters}
            className="rounded-2xl"
          >
            Limpar filtros
          </Button>
        ) : null}
      </div>
    </div>
  );
}
