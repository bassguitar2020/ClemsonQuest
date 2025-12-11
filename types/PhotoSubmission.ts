export type PhotoSubmission = {
  id: string;
  createdAt: any; // Firestore Timestamp
  description: string;
  photoUrl: string;
  points: number;
  questType: string;
  reviewedAt: any; // Firestore Timestamp
  status: string;
  storagePath: string;
  teamKey: string;
  teamName: string;
  title: string;
  userId: string;
  userName: string;
};
