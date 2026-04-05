"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

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
  useEffect(() => {
    if (!open) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onOpenChange]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 backdrop-blur-sm sm:items-center sm:px-4 sm:py-6">
      <div className="w-full max-h-[min(100dvh-0.5rem,96vh)] overflow-hidden rounded-t-[1.75rem] border border-border/70 bg-card shadow-2xl sm:max-w-lg sm:rounded-[1.75rem]">
        <div className="border-b border-border/60 bg-card/95 px-4 py-4 backdrop-blur sm:px-6 sm:py-5">
          <div className="space-y-2">
            <h3 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              {title}
            </h3>
            <p className="text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </div>
        </div>

        <div className="px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-xl sm:w-auto"
              onClick={() => onOpenChange(false)}
            >
              {cancelLabel}
            </Button>

            <Button
              type="button"
              variant="destructive"
              className="w-full rounded-xl sm:w-auto"
              onClick={onConfirm}
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
