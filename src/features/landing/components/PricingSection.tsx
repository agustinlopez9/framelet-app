import { Link } from 'react-router-dom';
import { Check, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';

type FeatureStatus = 'included' | 'excluded' | 'coming-soon';

interface Feature {
  label: string;
  status: FeatureStatus;
}

const freeFeatures: Feature[] = [
  { label: 'Photos', status: 'included' },
  { label: 'Video uploads', status: 'excluded' },
  { label: '4 templates', status: 'included' },
  { label: 'Custom colors', status: 'excluded' },
  { label: 'Custom domain', status: 'excluded' },
];

const premiumFeatures: Feature[] = [
  { label: 'Photos', status: 'included' },
  { label: 'Video uploads', status: 'included' },
  { label: 'All templates', status: 'included' },
  { label: 'Custom colors', status: 'coming-soon' },
  { label: 'Custom domain', status: 'coming-soon' },
];

function FeatureRow({ label, status }: Feature) {
  return (
    <li className="flex items-center gap-3 py-2 text-sm">
      {status === 'included' ? (
        <Check className="h-4 w-4 shrink-0 text-emerald-500" aria-label="Included" />
      ) : status === 'excluded' ? (
        <Minus className="h-4 w-4 shrink-0 text-muted-foreground/50" aria-label="Not included" />
      ) : (
        <Minus className="h-4 w-4 shrink-0 text-muted-foreground/50" aria-hidden />
      )}
      <span className={status === 'excluded' ? 'text-muted-foreground' : undefined}>{label}</span>
      {status === 'coming-soon' ? (
        <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800">
          Coming Soon
        </span>
      ) : null}
    </li>
  );
}

export function PricingSection() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-4xl px-4">
        <h2 className="text-center text-3xl font-semibold tracking-tight md:text-4xl">
          Simple, honest pricing
        </h2>
        <p className="mt-4 text-center text-muted-foreground">
          Start free. Upgrade when you need more.
        </p>

        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Free tier */}
          <div className="flex flex-col rounded-2xl border bg-card p-8">
            <div>
              <h3 className="text-lg font-semibold">Free</h3>
              <p className="mt-1 text-3xl font-bold">$0</p>
              <p className="text-sm text-muted-foreground">forever</p>
            </div>

            <div className="mt-6 rounded-lg bg-muted/50 px-4 py-3 text-sm font-medium">
              1 Portfolio &middot; 500 MB storage
            </div>

            <ul className="mt-6 flex-1 divide-y divide-border">
              {freeFeatures.map((f) => (
                <FeatureRow key={f.label} {...f} />
              ))}
            </ul>

            <Button asChild className="mt-8 w-full">
              <Link to="/signup">Get started free</Link>
            </Button>
          </div>

          {/* Premium tier */}
          <div className="flex flex-col rounded-2xl border-2 border-primary bg-card p-8 shadow-md">
            <div>
              <h3 className="text-lg font-semibold">Premium</h3>
              <p className="mt-1 text-3xl font-bold">TBD</p>
              <p className="text-sm text-muted-foreground">per month</p>
            </div>

            <div className="mt-6 rounded-lg bg-primary/5 px-4 py-3 text-sm font-medium">
              5 Portfolios &middot; 20 GB storage
            </div>

            <ul className="mt-6 flex-1 divide-y divide-border">
              {premiumFeatures.map((f) => (
                <FeatureRow key={f.label} {...f} />
              ))}
            </ul>

            <div className="mt-8 flex w-full items-center justify-center rounded-md border border-dashed py-2.5 text-sm text-muted-foreground">
              Coming Soon
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
