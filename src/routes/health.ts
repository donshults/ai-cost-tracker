import { Router, Request, Response } from 'express';
import { pool } from '../db';
import { listSupportedModels, getModelPricing, MODEL_PRICING } from '../utils/pricing';

const router = Router();

// GET /health - Health check endpoint
router.get('/', async (req: Request, res: Response) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version ?? '1.0.0',
    environment: process.env.NODE_ENV ?? 'development',
    checks: {
      database: 'unknown' as string,
    },
  };

  try {
    await pool.query('SELECT 1');
    health.checks.database = 'connected';
  } catch (error) {
    health.checks.database = 'disconnected';
    health.status = 'degraded';
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});

export default router;
