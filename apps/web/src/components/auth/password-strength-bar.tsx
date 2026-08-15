"use client";

import { getPasswordStrength } from "@/utils/password-strength";

const STRENGTH_CONFIG = {
  weak: { label: "Senha fraca", color: "bg-red-500", width: "w-1/3" },
  medium: { label: "Senha média", color: "bg-yellow-500", width: "w-2/3" },
  strong: { label: "Senha forte", color: "bg-emerald-500", width: "w-full" },
} as const;

type PasswordStrengthBarProps = {
  password: string;
};

export function PasswordStrengthBar({ password }: PasswordStrengthBarProps) {
  if (!password) {
    return null;
  }

  const strength = getPasswordStrength(password);
  const config = STRENGTH_CONFIG[strength];

  return (
    <div className="space-y-1">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-border/60">
        <div
          className={`h-full rounded-full transition-all ${config.color} ${config.width}`}
        />
      </div>
      <p className="text-xs text-muted-foreground">{config.label}</p>
    </div>
  );
}
