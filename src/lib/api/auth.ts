import { supabase } from '@/lib/supabase';
import type { User } from '@/types';

export interface SignUpInput {
  email: string;
  password: string;
  username: string;
}

export interface SignInInput {
  email: string;
  password: string;
}

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly code: 'invalid_credentials' | 'username_taken' | 'unknown' = 'unknown',
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export async function signUp({ email, password, username }: SignUpInput) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username: username.toLowerCase() } },
  });
  if (error) {
    if (/duplicate key|unique/i.test(error.message) || /username/i.test(error.message)) {
      throw new AuthError('That username is already taken.', 'username_taken');
    }
    throw new AuthError(error.message);
  }
  return data;
}

export async function signIn({ email, password }: SignInInput) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    throw new AuthError('Invalid email or password.', 'invalid_credentials');
  }
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw new AuthError(error.message);
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new AuthError(error.message);
  return data.session;
}

export async function isUsernameAvailable(username: string) {
  const normalized = username.toLowerCase();
  // Try 'username' first (post-migration-0009); fall back to 'handle' if that column doesn't exist yet.
  let { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('username', normalized)
    .maybeSingle();
  if (error?.message?.includes('username')) {
    ({ data, error } = await supabase
      .from('users')
      .select('id')
      .eq('handle', normalized)
      .maybeSingle());
  }
  if (error) throw new AuthError(error.message);
  return data === null;
}

export async function signInWithGoogle(redirectTo: string) {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  });
  if (error) throw new AuthError(error.message);
  return data;
}

export async function setMyUsername(username: string) {
  const normalized = username.toLowerCase();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) throw new AuthError('Not authenticated');

  const { error: authError } = await supabase.auth.updateUser({ data: { username: normalized } });
  if (authError) throw new AuthError(authError.message);

  // Persist to public.users — requires migration 0009 (handle → username rename).
  const { error: dbError } = await supabase
    .from('users')
    .update({ username: normalized })
    .eq('id', authData.user.id);
  if (dbError) throw new AuthError(dbError.message);
}

export async function updatePassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new AuthError(error.message);
}

export function deriveUsernameFromEmail(email: string): string {
  const local = email.split('@')[0] ?? '';
  return local
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30) || 'user';
}

interface UserRow {
  id: string;
  email: string;
  username?: string;
  handle?: string; // pre-migration column name — removed once migration 0009 is applied
  storage_used_bytes: number;
  created_at: string;
}

export async function getMyUser(): Promise<User | null> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', auth.user.id)
    .single<UserRow>();
  if (error || !data) return null;
  return {
    id: data.id,
    email: data.email,
    // Handle both 'username' (post-migration-0009) and 'handle' (pre-migration) column names.
    username: data.username ?? data.handle ?? '',
    storageUsedBytes: data.storage_used_bytes,
    createdAt: data.created_at,
  };
}
