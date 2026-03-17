import { Button } from "@/components/ui/button";

export function AppHeader() {
  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-semibold">
            F
          </div>

          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground">Finly</span>
            <span className="text-xs text-muted-foreground">
              Controle financeiro inteligente
            </span>
          </div>
        </div>

        <nav className="hidden items-center gap-2 md:flex">
          <Button variant="ghost">Recursos</Button>
          <Button variant="ghost">Metas</Button>
          <Button variant="ghost">Versão completa</Button>
        </nav>
      </div>
    </header>
  );
}
