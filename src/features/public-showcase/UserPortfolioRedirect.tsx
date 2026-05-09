import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { getDefaultPortfolioHandle } from '@/lib/api/portfolios';

export function UserPortfolioRedirect() {
  const { username } = useParams<{ username: string }>();
  const [handle, setHandle] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    if (!username) return;
    getDefaultPortfolioHandle(username).then(setHandle);
  }, [username]);

  if (handle === undefined) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!handle || !username) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <h1 className="text-3xl font-semibold">User not found</h1>
        <p className="mt-3 text-muted-foreground">No portfolio exists for this username.</p>
      </div>
    );
  }

  return <Navigate to={`/${username}/${handle}`} replace />;
}
