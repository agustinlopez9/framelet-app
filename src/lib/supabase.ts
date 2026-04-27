import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

export const supabase: SupabaseClient = createClient(env.supabaseUrl, env.supabasePublishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
