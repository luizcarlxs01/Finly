import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-6 py-16">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center text-center">
          <Badge className="mb-4 bg-accent text-accent-foreground hover:bg-accent/90">
            Finly • Controle Financeiro
          </Badge>

          <h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Organize seu dinheiro com mais clareza, previsibilidade e controle.
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            Um aplicativo para acompanhar saldo, despesas, recorrências, parcelas
            e metas de economia em uma experiência simples no navegador e,
            futuramente, sincronizada com mobile.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Button size="lg" className="min-w-[200px]">
              Começar sem conta
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="min-w-[200px]"
            >
              Conhecer versão completa
            </Button>
          </div>
        </div>

        <div className="mx-auto mt-16 grid w-full max-w-6xl gap-6 md:grid-cols-3">
          <Card className="border-border bg-card text-card-foreground shadow-sm">
            <CardHeader>
              <CardTitle>Saldo e Extrato</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-muted-foreground">
                Visualize entradas, saídas e acompanhe seu saldo atual com uma
                leitura simples e objetiva.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card text-card-foreground shadow-sm">
            <CardHeader>
              <CardTitle>Recorrências e Parcelas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-muted-foreground">
                Cadastre salário, contas mensais e despesas parceladas para que o
                sistema projete automaticamente os lançamentos.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card text-card-foreground shadow-sm">
            <CardHeader>
              <CardTitle>Meta de Economia</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-muted-foreground">
                Descubra quanto pode gastar no mês e acompanhe se está dentro ou
                fora da meta definida.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
