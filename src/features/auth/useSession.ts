import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface SessionState {
  session: Session | null;
  status: SessionStatus;
}

export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>({ session: null, status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setState({
        session: data.session,
        status: data.session ? 'authenticated' : 'unauthenticated',
      });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ session, status: session ? 'authenticated' : 'unauthenticated' });
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}
