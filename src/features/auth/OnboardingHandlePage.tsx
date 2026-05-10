import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usernameSchema } from './schemas';
import { isUsernameAvailable, setMyUsername, AuthError } from '@/lib/api/auth';

const formSchema = z.object({ handle: usernameSchema });
type FormValues = z.infer<typeof formSchema>;

export function OnboardingHandlePage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { handle: '' },
  });

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    setGlobalError(null);
    try {
      const available = await isUsernameAvailable(values.handle);
      if (!available) {
        form.setError('handle', { message: 'That handle is already taken.' });
        return;
      }
      await setMyUsername(values.handle);
      const next = params.get('next') ?? '/dashboard';
      navigate(next, { replace: true });
    } catch (err) {
      if (err instanceof AuthError) setGlobalError(err.message);
      else setGlobalError('Something went wrong. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md py-16">
      <Card>
        <CardHeader>
          <CardTitle>Pick your handle</CardTitle>
          <CardDescription>
            Your handle becomes your portfolio URL. Lowercase letters, numbers, and hyphens.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="handle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Handle</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="your-handle"
                        autoCapitalize="none"
                        autoComplete="off"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.toLowerCase())}
                      />
                    </FormControl>
                    <FormDescription>
                      Your portfolio URL: framelet.app/u/{field.value || 'your-handle'}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {globalError ? (
                <p className="text-sm text-destructive" role="alert">
                  {globalError}
                </p>
              ) : null}
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'Saving…' : 'Save handle'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
