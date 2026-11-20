"use client";

import type { ReactNode, RefObject } from "react";

import { TransactionForm } from "@/components/dashboard/transaction-form";
import { GoalGlassDialog } from "@/components/dashboard/goal-glass-dialog";
import type { LocalFinanceTransactionInput } from "@/hooks/use-local-finance";
import styles from "./transaction-create-dialog.module.css";

type Props = {
  triggerRef: RefObject<HTMLButtonElement | null>;
  isSubmitting?: boolean;
  isPreviewActive: boolean;
  errorMessage?: string | null;
  previewContent?: ReactNode;
  onAddTransaction: (input: LocalFinanceTransactionInput) => Promise<void> | void;
  onPreviewTransaction: (input: LocalFinanceTransactionInput) => void;
  onClearPreview: () => void;
  onClose: () => void;
};

export function TransactionCreateDialog({
  triggerRef,
  isSubmitting,
  isPreviewActive,
  errorMessage,
  previewContent,
  onAddTransaction,
  onPreviewTransaction,
  onClearPreview,
  onClose,
}: Props) {
  return (
    <GoalGlassDialog
      triggerRef={triggerRef}
      title="Novo lançamento"
      animation="genie"
      dialogClassName={styles.dialog}
      panelClassName={styles.transactionPanel}
      contentClassName={styles.transactionContent}
      onClose={onClose}
    >
      {(requestClose) => (
        <>
          <header className="sticky top-0 z-10 flex justify-center bg-transparent px-14 pb-3 pt-5">
            <h2 className="w-max max-w-full border-b border-border px-4 pb-2 text-center text-xl font-semibold tracking-tight text-foreground">
              Novo lançamento
            </h2>
          </header>
          <div className="px-6 pb-6 pt-2">
            <TransactionForm
              minimal
              onAddTransaction={async (input) => {
                await onAddTransaction(input);
                requestClose();
              }}
              onPreviewTransaction={onPreviewTransaction}
              onClearPreview={onClearPreview}
              isPreviewActive={isPreviewActive}
              showPreviewNotice={false}
              isSubmitting={isSubmitting}
            />
            {errorMessage ? (
              <p role="alert" className="mt-3 text-sm text-destructive">
                {errorMessage}
              </p>
            ) : null}
            {previewContent}
          </div>
        </>
      )}
    </GoalGlassDialog>
  );
}
