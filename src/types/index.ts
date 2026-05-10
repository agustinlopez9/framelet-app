export interface User {
  id: string;
  email: string;
  username: string;
  storageUsedBytes: number;
  createdAt: string;
}

export type UserPlan = 'free' | 'premium';

export interface Subscription {
  id: string;
  userId: string;
  plan: 'premium';
  startedAt: string;
  expiresAt: string | null;
}
