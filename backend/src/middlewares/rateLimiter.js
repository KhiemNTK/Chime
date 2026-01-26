import { rateLimit } from 'express-rate-limit';

// Helper function to handle rate limit responses
const handler = (req, res, next, options) => {
  res.status(options.statusCode).json({
    success: false,
    message: options.message,
    // retry after for clients
    retryAfter: Math.ceil(options.windowMs / 1000) + ' seconds',
  });
};

// global limiter for all requests
export const commonLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // 100 requests per IP
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: handler, 
  message: 'Too many requests. Please try again later.',
});

// limiter for auth routes
export const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: handler,
  message: 'Too many login attempts. Please try again later.',
});
