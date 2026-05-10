import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useSession } from '@/features/auth/hooks/useSession';

export function HeroSection() {
  const { status } = useSession();
  const authed = status === 'authenticated';
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 to-accent/30 px-4 pb-28 pt-32 md:pb-40 md:pt-44">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 motion-safe:animate-[hero-glow_10s_ease-in-out_infinite]"
        style={{
          background:
            'radial-gradient(ellipse 50% 45% at 50% 38%, hsl(var(--primary) / 0.30), transparent 60%), radial-gradient(ellipse 40% 30% at 65% 62%, hsl(var(--accent) / 0.18), transparent 70%)',
          filter: 'blur(14px)',
        }}
      />
      <div className="relative mx-auto max-w-4xl text-center">
        <h1
          className="mt-4 text-4xl font-semibold leading-[1.05] tracking-tight opacity-0 motion-safe:animate-[fade-up_0.8s_ease-out_forwards] md:text-7xl"
          style={{ animationDelay: '0.2s' }}
        >
          One portfolio.
          <br />
          <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Many ways
          </span>{' '}
          to show it.
        </h1>
        <p
          className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground opacity-0 motion-safe:animate-[fade-up_0.8s_ease-out_forwards] md:text-xl"
          style={{ animationDelay: '0.4s' }}
        >
          Framelet hosts your photos and creative projects behind a single shareable link. Upload
          once, then choose how it shows and switch the look any time without rebuilding a thing.
        </p>
        <div
          className="mt-10 flex flex-wrap items-center justify-center gap-3 opacity-0 motion-safe:animate-[fade-up_0.8s_ease-out_forwards]"
          style={{ animationDelay: '0.6s' }}
        >
          <Button asChild size="lg">
            <Link to={authed ? '/dashboard' : '/signup'}>
              {authed ? 'Go to dashboard' : 'Get started'}
            </Link>
          </Button>
          {!authed ? (
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-primary/30 bg-white text-foreground hover:bg-primary hover:text-white"
            >
              <Link to="/login">Log in</Link>
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
