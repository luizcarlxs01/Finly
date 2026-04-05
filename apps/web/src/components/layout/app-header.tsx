import Image from "next/image";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";

export function AppHeader() {
  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
            <Image
              src="/favicon-32x32.png"
              alt="Finly"
              width={32}
              height={32}
              className="h-8 w-8"
              priority
            />
          </div>

          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground">Finly</span>
            <span className="text-xs text-muted-foreground">
              Controle financeiro inteligente
            </span>
          </div>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Button variant="ghost">Recursos</Button>
          <Button variant="ghost">Metas</Button>
          <Button variant="ghost">Versão completa</Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
