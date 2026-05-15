import { ZodError } from 'zod';
import { HttpError } from '../services/auth.service.js';

export const globalErrorHandler = (err, req, res, next) => {
  // Handle Zod Error
  if (err instanceof ZodError) {
    const errorMessage = err.errors?.[0]?.message || 'Invalid input data';
    return res.status(400).json({ message: errorMessage });
  }

  // Handle HttpError
  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message });
  }

  // Handle other errors
  console.error('Server Error:', err);
  return res.status(500).json({ message: 'Internal server error' });
};
