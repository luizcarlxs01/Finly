export type ApiFinancialRule = {
  id: string;
  financialProfileId: string;
  title: string;
  amount: number;
  ruleType: string;
  recurrenceMode: string | null;
  dayOfMonth: number;
  startDate: string;
  endDate: string | null;
  totalMonths: number | null;
  isActive: boolean;
  createdAt: string;
  lastProcessedDate: string | null;
};
