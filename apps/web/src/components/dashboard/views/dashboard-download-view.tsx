import { Apple, Download, Smartphone } from "lucide-react";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const APP_VERSION = "1.00.000";
const APK_SIZE_MB = "54";

export function DashboardDownloadView() {
  return (
    <div className="space-y-6 2xl:space-y-8">
      <DashboardPageHeader
        title="Download"
        description="Leve o Finly com você — o mesmo painel financeiro, no seu celular."
      />

      <div className="grid gap-6 sm:grid-cols-2">
        <Card className="rounded-[1.5rem] border-border/60 bg-card/95 shadow-sm">
          <CardHeader className="space-y-1 pb-4">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Smartphone className="size-5" />
              </span>
              <CardTitle className="text-xl font-semibold tracking-tight">
                Android
              </CardTitle>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Versão {APP_VERSION} · APK, ~{APK_SIZE_MB} MB. Instalação direta,
              fora da Play Store — o Android vai pedir para autorizar
              &quot;instalar de fontes desconhecidas&quot; na primeira vez.
            </p>

            <a
              href="/downloads/finly.apk"
              download
              className={buttonVariants({ className: "h-11 w-full rounded-2xl gap-2" })}
            >
              <Download className="size-4" />
              Baixar para Android
            </a>
          </CardContent>
        </Card>

        <Card className="rounded-[1.5rem] border-border/60 bg-card/70 shadow-sm">
          <CardHeader className="space-y-1 pb-4">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <Apple className="size-5" />
              </span>
              <CardTitle className="text-xl font-semibold tracking-tight text-muted-foreground">
                iOS
              </CardTitle>
            </div>
          </CardHeader>

          <CardContent>
            <p className="text-sm text-muted-foreground">
              Em breve, via TestFlight ou App Store. O app já existe e
              funciona no iPhone, mas a distribuição pública ainda depende de
              uma conta Apple Developer.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
