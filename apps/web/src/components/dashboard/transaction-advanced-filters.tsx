"use client";

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
  "w-full rounded-xl border border-border/70 bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15";

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
    <div className="space-y-4 rounded-[1.5rem] border border-border/70 bg-background/70 p-4 sm:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">
            Busca, categoria e ordenação
          </p>
          <p className="text-sm text-muted-foreground">
            Combine filtros para refinar o extrato sem alterar os dados salvos.
          </p>
        </div>

        <div className="rounded-xl border border-border/70 bg-card px-4 py-3">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Resultados
          </p>
          <p className="mt-1 text-lg font-semibold text-foreground">
            {resultCount} de {totalCount}
          </p>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.3fr)_220px_220px]">
        <div className="space-y-2">
          <label
            htmlFor="transaction-search"
            className="text-sm font-medium text-foreground"
          >
            Buscar transação
          </label>

          <input
            id="transaction-search"
            type="search"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            className={fieldClassName}
            placeholder="Buscar por título, categoria ou valor"
          />
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

      {hasActiveFilters ? (
        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={onClearFilters}>
            Limpar filtros
          </Button>
        </div>
      ) : null}
    </div>
  );
}
