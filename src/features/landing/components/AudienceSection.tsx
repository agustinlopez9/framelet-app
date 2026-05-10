import { Camera, Sparkles, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AudienceRowSpec {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const rows: AudienceRowSpec[] = [
  {
    icon: <Camera className="h-14 w-14" strokeWidth={1.5} />,
    title: 'Photographers',
    description:
      'Show editorial spreads, behind-the-scenes, or a tight selects book. Switch templates on a per-shoot whim.',
  },
  {
    icon: <Sparkles className="h-14 w-14" strokeWidth={1.5} />,
    title: 'Models & creatives',
    description:
      'A polaroid book that lives at a single URL — no agency intake forms, no template marketplace fees.',
  },
  {
    icon: <Tag className="h-14 w-14" strokeWidth={1.5} />,
    title: 'Anything else',
    description:
      "A car you're selling. A side project. A piece of work. One handle, one page, decent typography.",
  },
];

function IconPanel({ children, delay }: { children: React.ReactNode; delay: string }) {
  return (
    <div
      className="aspect-square w-full max-w-[220px] rounded-2xl border border-white/40 bg-gradient-to-br from-primary/15 to-secondary/40 p-12 ring-1 ring-foreground/5 backdrop-blur-md motion-safe:animate-[panel-pulse_4.5s_ease-in-out_infinite]"
      style={{ animationDelay: delay }}
    >
      <div className="flex h-full w-full items-center justify-center text-primary">{children}</div>
    </div>
  );
}

export function AudienceSection() {
  return (
    <section className="bg-muted/40 py-20">
      <div className="mx-auto max-w-5xl px-4">
        <h2 className="text-center text-3xl font-semibold tracking-tight md:text-4xl">
          For people with something to show.
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">
          Framelet doesn&apos;t care what you do — it just makes sure your pictures look good at a
          link.
        </p>

        <div className="mt-16 space-y-20 md:space-y-24">
          {rows.map((row, idx) => {
            const reverse = idx % 2 === 1;
            return (
              <div
                key={row.title}
                className="grid w-full grid-cols-1 items-center gap-6 md:grid-cols-2 md:gap-10"
              >
                <div className={cn('flex justify-center', reverse ? 'md:order-1' : 'md:order-2')}>
                  <IconPanel delay={`${idx * 1.4}s`}>{row.icon}</IconPanel>
                </div>
                <div
                  className={cn(
                    'text-center',
                    reverse ? 'md:order-2 md:text-left' : 'md:order-1 md:text-right',
                  )}
                >
                  <h3 className="text-2xl font-semibold tracking-tight md:text-3xl">{row.title}</h3>
                  <p
                    className={cn(
                      'mx-auto mt-3 max-w-xl text-base leading-relaxed text-muted-foreground',
                      reverse ? 'md:ml-0' : 'md:ml-auto md:mr-0',
                    )}
                  >
                    {row.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
