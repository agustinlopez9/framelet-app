import { supabase } from '@/lib/supabase';

export interface SignUpInput {
  email: string;
  password: string;
  handle: string;
}

export interface SignInInput {
  email: string;
  password: string;
}

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly code: 'invalid_credentials' | 'handle_taken' | 'unknown' = 'unknown',
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export async function signUp({ email, password, handle }: SignUpInput) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { handle: handle.toLowerCase() } },
  });
  if (error) {
    if (/duplicate key|unique/i.test(error.message) || /handle/i.test(error.message)) {
      throw new AuthError('That handle is already taken.', 'handle_taken');
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

export async function isHandleAvailable(handle: string) {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('handle', handle.toLowerCase())
    .maybeSingle();
  if (error) throw new AuthError(error.message);
  return data === null;
}
