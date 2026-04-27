import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function LandingPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-24 text-center">
      <h1 className="text-5xl font-semibold tracking-tight">
        Your portfolio. <span className="text-muted-foreground">Many ways to show it.</span>
      </h1>
      <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
        Upload your work once. Pick from minimalist grids, editorial layouts, or an immersive 3D
        gallery — and switch any time.
      </p>
      <div className="mt-10 flex items-center justify-center gap-3">
        <Button asChild size="lg">
          <Link to="/signup">Get started</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link to="/login">Log in</Link>
        </Button>
      </div>
    </div>
  );
}
