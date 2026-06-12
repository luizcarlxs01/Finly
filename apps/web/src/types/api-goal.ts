export type ApiGoal = {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string | null;
  status: string;
  financialProfileId: string;
  createdAt: string;
};
