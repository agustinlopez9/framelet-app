import { Upload, LayoutGrid, Share2 } from 'lucide-react';

interface Step {
  index: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const steps: Step[] = [
  {
    index: '01',
    title: 'Upload',
    description: 'Drag in your photos. Add a title, alt text, and a short description if you like.',
    icon: <Upload className="h-5 w-5" strokeWidth={2.25} />,
  },
  {
    index: '02',
    title: 'Pick a template',
    description:
      'Minimal grid, side-titled editorial, vertical scroll, alternating titles, or 3D gallery.',
    icon: <LayoutGrid className="h-5 w-5" strokeWidth={2.25} />,
  },
  {
    index: '03',
    title: 'Share the link',
    description: 'You get framelet.app/u/your-handle. Switch templates or palette any time.',
    icon: <Share2 className="h-5 w-5" strokeWidth={2.25} />,
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-2xl px-4">
        <h2 className="text-center text-3xl font-semibold tracking-tight md:text-4xl">
          Three steps. That&apos;s the whole product.
        </h2>

        <ol className="relative mt-14 space-y-10">
          {steps.map((step, idx) => {
            const isLast = idx === steps.length - 1;
            return (
              <li key={step.index} className="relative flex items-start gap-5">
                {!isLast && (
                  <span
                    aria-hidden="true"
                    className="absolute left-6 top-12 h-[calc(100%-1rem)] w-px border-l-2 border-dashed border-border"
                  />
                )}
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-primary/25 bg-background text-primary shadow-sm">
                  {step.icon}
                </div>
                <div className="pt-1.5">
                  <h3 className="flex items-baseline gap-3 text-xl font-semibold tracking-tight">
                    <span className="font-mono text-sm tabular-nums text-primary/80">
                      {step.index}
                    </span>
                    <span>{step.title}</span>
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
