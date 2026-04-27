import { z } from 'zod';

export const handleSchema = z
  .string()
  .regex(
    /^[a-z0-9][a-z0-9-]{2,29}$/,
    'Use 3–30 chars: lowercase letters, numbers, hyphens; must start with a letter or number.',
  );

export const signUpSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  handle: handleSchema,
});

export const signInSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

export type SignUpValues = z.infer<typeof signUpSchema>;
export type SignInValues = z.infer<typeof signInSchema>;
