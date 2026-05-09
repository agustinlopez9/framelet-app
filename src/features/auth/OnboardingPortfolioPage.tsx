import { useState } from 'react';
import { Navigate, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { createPortfolio } from '@/lib/api/portfolios';
import { ensureRegistered, list as listTemplates } from '@/templates';
import { useSession } from './useSession';
import { getUserPlan } from '@/lib/api/subscriptions';
import { useMyPortfolios, portfoliosKey } from '@/features/portfolio/queries';
import type { Portfolio } from '@/types';

ensureRegistered();

const step1Schema = z.object({
  title: z.string().min(1, 'Title is required.').max(80, 'Max 80 characters.'),
  bio: z.string().max(500, 'Max 500 characters.'),
});
type Step1Values = z.infer<typeof step1Schema>;

export function OnboardingPortfolioPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const { session } = useSession();
  const qc = useQueryClient();
  const { data: existingPortfolios, isLoading: portfoliosLoading } = useMyPortfolios();
  const [step, setStep] = useState<1 | 2>(1);
  const [step1Values, setStep1Values] = useState<Step1Values | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState('simple-grid');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<'free' | 'premium'>('free');

  // Must be declared before any early returns to satisfy Rules of Hooks.
  const form = useForm<Step1Values>({
    resolver: zodResolver(step1Schema),
    defaultValues: { title: '', bio: '' },
  });

  const templates = listTemplates();

  // When accessed via /onboarding/portfolio: if the user already has a portfolio
  // (e.g. a previous attempt succeeded despite a client-side error), skip onboarding.
  if (location.pathname === '/onboarding/portfolio') {
    if (portfoliosLoading) {
      return <div className="p-12 text-center text-muted-foreground">Loading…</div>;
    }
    if (existingPortfolios && existingPortfolios.length > 0) {
      return <Navigate to={params.get('next') ?? '/dashboard'} replace />;
    }
  }

  async function onStep1(values: Step1Values) {
    setStep1Values(values);
    if (session?.user?.id) {
      const userPlan = await getUserPlan(session.user.id);
      setPlan(userPlan);
    }
    setStep(2);
  }

  async function onFinish() {
    if (!step1Values) return;
    setSubmitting(true);
    setError(null);
    try {
      const portfolio = await createPortfolio({
        title: step1Values.title,
        bio: step1Values.bio,
        templateId: selectedTemplateId,
      });
      // Update cache immediately so RequirePortfolio sees the new portfolio before navigating.
      qc.setQueryData<Portfolio[]>(portfoliosKey, (old) => [...(old ?? []), portfolio]);
      const next = params.get('next') ?? '/dashboard';
      navigate(next, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create portfolio. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl py-16 px-4">
      {step === 1 ? (
        <Card>
          <CardHeader>
            <CardTitle>Create your portfolio</CardTitle>
            <CardDescription>Give your portfolio a title and a brief bio.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onStep1)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Portfolio title</FormLabel>
                      <FormControl>
                        <Input placeholder="My Photography" maxLength={80} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="A short description of your work…"
                          rows={3}
                          maxLength={500}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">Next: choose a template</Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Choose a template</CardTitle>
            <CardDescription>Select how your portfolio looks to visitors.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {templates.map((template) => {
                const locked = template.premiumOnly && plan === 'free';
                const selected = template.id === selectedTemplateId && !locked;
                return (
                  <button
                    key={template.id}
                    type="button"
                    disabled={locked}
                    onClick={() => !locked && setSelectedTemplateId(template.id)}
                    className={cn(
                      'group relative flex flex-col rounded-lg border bg-card p-4 text-left transition-all',
                      locked ? 'cursor-not-allowed opacity-60' : 'hover:border-primary/40',
                      selected && !locked ? 'border-primary ring-2 ring-primary/20' : '',
                    )}
                  >
                    {locked ? (
                      <span className="absolute right-2 top-2 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
                        Premium
                      </span>
                    ) : null}
                    <div className="aspect-video overflow-hidden rounded-md bg-muted">
                      <img
                        src={template.thumbnail}
                        alt=""
                        className="h-full w-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <h3 className="font-medium">{template.name}</h3>
                      {selected ? <Check className="h-4 w-4 text-primary" /> : null}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{template.description}</p>
                  </button>
                );
              })}
            </div>
            {error ? (
              <p className="text-sm text-destructive" role="alert">{error}</p>
            ) : null}
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button type="button" className="flex-1" onClick={onFinish} disabled={submitting}>
                {submitting ? 'Creating portfolio…' : 'Create portfolio'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
