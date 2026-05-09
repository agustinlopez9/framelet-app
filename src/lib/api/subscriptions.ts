import { supabase } from '@/lib/supabase';
import type { UserPlan } from '@/types';

interface SubscriptionRow {
  id: string;
  user_id: string;
  plan: string;
  started_at: string;
  expires_at: string | null;
}

export async function getUserPlan(userId: string): Promise<UserPlan> {
  const { data } = await supabase
    .from('subscriptions')
    .select('plan, expires_at')
    .eq('user_id', userId)
    .maybeSingle<Pick<SubscriptionRow, 'plan' | 'expires_at'>>();

  if (!data) return 'free';
  if (data.plan !== 'premium') return 'free';
  if (data.expires_at && new Date(data.expires_at) <= new Date()) return 'free';
  return 'premium';
}
