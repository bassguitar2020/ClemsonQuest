export type Quest = {
  id: string;
  title: string;
  description: string;
  points: number;
  difficulty: "Easy" | "Medium" | "Hard" | string;
  createdAt: any;
  expiresAt: any;
};
