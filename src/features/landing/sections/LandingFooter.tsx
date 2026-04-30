export function LandingFooter() {
  return (
    <footer className="border-t bg-secondary/30 py-8">
      <p className="text-center text-sm text-muted-foreground">
        made with <span aria-hidden className="text-primary">♥</span>
        <span className="sr-only">love</span> by{' '}
        <a
          href="https://github.com/agustinlopez9"
          target="_blank"
          rel="noreferrer"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          agustinlopez9
        </a>
      </p>
    </footer>
  );
}
