import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { signUpSchema, type SignUpValues } from './schemas';
import { signUp, AuthError } from '@/lib/api/auth';

export function SignUpPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: '', password: '', handle: '' },
  });

  async function onSubmit(values: SignUpValues) {
    setSubmitting(true);
    setGlobalError(null);
    try {
      await signUp(values);
      const next = params.get('next') ?? '/dashboard';
      navigate(next, { replace: true });
    } catch (err) {
      if (err instanceof AuthError && err.code === 'handle_taken') {
        form.setError('handle', { message: 'That handle is already taken.' });
      } else if (err instanceof AuthError) {
        setGlobalError(err.message);
      } else {
        setGlobalError('Something went wrong. Try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md py-16">
      <Card>
        <CardHeader>
          <CardTitle>Create an account</CardTitle>
          <CardDescription>Pick a handle — that becomes your portfolio URL.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" autoComplete="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="new-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                    <FormDescription>Your portfolio URL: framelet.app/u/{field.value || 'your-handle'}</FormDescription>
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
                {submitting ? 'Creating account…' : 'Create account'}
              </Button>
            </form>
          </Form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link className="underline" to="/login">
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
