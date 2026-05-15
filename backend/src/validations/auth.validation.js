import { z } from 'zod';

export const signUpSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters long'),
  email: z.email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  firstName: z.string().min(3, 'First name must be at least 3 characters long'),
  lastName: z.string().min(3, 'Last name must be at least 3 characters long'),
});

export const signInSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters long'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});
