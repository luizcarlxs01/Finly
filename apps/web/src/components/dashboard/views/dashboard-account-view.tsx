import { AccountAccessCard } from "@/components/auth/account-access-card";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";

export function DashboardAccountView() {
  return (
    <div className="space-y-6 2xl:space-y-8">
      <DashboardPageHeader
        title="Conta"
        description="Entre para sincronizar seus dados ou gerencie sua conta Finly."
      />

      <div className="mx-auto w-full max-w-xl">
        <AccountAccessCard />
      </div>
    </div>
  );
}
