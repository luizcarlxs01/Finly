"use client";

import { useRef } from "react";

import { Button } from "@/components/ui/button";
import { FinancialDialog } from "@/components/dashboard/overlays/financial-dialog";
import styles from "./confirmation-modal.module.css";

type ConfirmationModalProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
};

export function ConfirmationModal({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  onConfirm,
  onOpenChange,
}: ConfirmationModalProps) {
  const dialogRef = useRef<{ close: () => void }>(null);

  if (!open) {
    return null;
  }

  return (
    <FinancialDialog
      title={title}
      header={
        <div className={styles.heading}>
          <h2>{title}</h2>
        </div>
      }
      onClose={() => onOpenChange(false)}
      smooth
      className={styles.dialog}
      controlRef={dialogRef}
    >
      <div className={styles.content}>
        <p className="text-center text-sm leading-6 text-muted-foreground">
          {description}
        </p>

        <div className={styles.actions}>
          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-xl sm:min-w-32"
            onClick={() => dialogRef.current?.close()}
          >
            {cancelLabel}
          </Button>

          <Button
            type="button"
            variant="destructive"
            className="h-11 rounded-xl sm:min-w-40"
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </FinancialDialog>
  );
}
