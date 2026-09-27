export type Profile = {
  id: string;
  name: string;
  description: string | null;
  initialBalance: number;
  isPrimary: boolean;
  spendingProfile: string;
  customOkThreshold: number | null;
  customGoodThreshold: number | null;
  createdAt: string;
};
