import { FinalCta } from "./final-cta";
import { homeClass } from "./home-styles";
import { LandingHero } from "./landing-hero";
import { ProductShowcase } from "./product-showcase";
import { SyncFeature } from "./sync-feature";

type HomeLandingProps = {
  onStartTransactions: () => void;
};

export function HomeLanding({ onStartTransactions }: HomeLandingProps) {
  return (
    <main className={homeClass("page-shell")}>
      <LandingHero onStartTransactions={onStartTransactions} />
      <ProductShowcase />
      <SyncFeature />
      <FinalCta onStartTransactions={onStartTransactions} />
    </main>
  );
}
