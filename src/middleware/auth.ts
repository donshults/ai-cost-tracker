import { Request, Response, NextFunction } from 'express';

const API_KEY = process.env.API_KEY;

if (!API_KEY && process.env.NODE_ENV === 'production') {
  console.warn('WARNING: API_KEY not set in production environment');
}

export function authenticateApiKey(req: Request, res: Response, next: NextFunction): void {
  // Skip auth for health endpoint
  if (req.path === '/health') {
    next();
    return;
  }

  // In development, allow requests without API key if not set
  if (process.env.NODE_ENV !== 'production' && !API_KEY) {
    next();
    return;
  }

  const providedKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');

  if (!providedKey) {
    res.status(401).json({
      success: false,
      error: 'API key required',
    });
    return;
  }

  if (providedKey !== API_KEY) {
    res.status(403).json({
      success: false,
      error: 'Invalid API key',
    });
    return;
  }

  next();
}
