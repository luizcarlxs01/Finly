export type Profile = {
  id: string;
  name: string;
  description: string | null;
  initialBalance: number;
  isPrimary: boolean;
  createdAt: string;
};
