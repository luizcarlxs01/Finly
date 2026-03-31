import { HeroSection } from "@/components/dashboard/hero-section";
import { OnboardingCard } from "@/components/dashboard/onboarding-card";
import { OnboardingFeatures } from "@/components/dashboard/onboarding-features";
import { OnboardingFuture } from "@/components/dashboard/onboarding-future";

export function DashboardEntryHeader() {
  return (
    <section id="inicio" className="space-y-6 lg:space-y-8">
      <HeroSection />

      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,380px)] 2xl:items-start">
        <div className="min-w-0 space-y-6">
          <OnboardingCard />
          <OnboardingFeatures />
        </div>

        <div className="min-w-0 2xl:sticky 2xl:top-6 2xl:self-start">
          <OnboardingFuture />
        </div>
      </div>
    </section>
  );
}
