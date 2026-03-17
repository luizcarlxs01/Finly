import { FeatureCard } from "@/components/dashboard/feature-card";
import { HeroSection } from "@/components/dashboard/hero-section";
import { AppHeader } from "@/components/layout/app-header";
import { PageContainer } from "@/components/layout/page-container";

const featureItems = [
  {
    title: "Saldo e Extrato",
    description:
      "Visualize entradas, saídas e acompanhe seu saldo atual com uma leitura simples e objetiva.",
  },
  {
    title: "Recorrências e Parcelas",
    description:
      "Cadastre salário, contas mensais e despesas parceladas para que o sistema projete automaticamente os lançamentos.",
  },
  {
    title: "Meta de Economia",
    description:
      "Descubra quanto pode gastar no mês e acompanhe se está dentro ou fora da meta definida.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <AppHeader />

      <PageContainer>
        <section className="flex min-h-[calc(100vh-64px)] flex-col justify-center py-8">
          <HeroSection />

          <div className="mx-auto mt-16 grid w-full max-w-6xl gap-6 md:grid-cols-3">
            {featureItems.map((item) => (
              <FeatureCard
                key={item.title}
                title={item.title}
                description={item.description}
              />
            ))}
          </div>
        </section>
      </PageContainer>
    </main>
  );
}
