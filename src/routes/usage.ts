import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { usageService } from '../services/usageService';

const router = Router();

// Validation schemas
const createUsageSchema = z.object({
  model: z.string().min(1),
  tokens_in: z.number().int().min(0),
  tokens_out: z.number().int().min(0),
  cache_read_tokens: z.number().int().min(0).optional(),
  cache_write_tokens: z.number().int().min(0).optional(),
  cost: z.number().min(0).optional(),
  project: z.string().optional(),
  agent: z.string().optional(),
  session_label: z.string().optional(),
  session_type: z.enum(['main', 'subagent', 'heartbeat']).optional(),
  recorded_at: z.string().datetime().optional(),
});

const queryUsageSchema = z.object({
  start_date: z.string().date().optional(),
  end_date: z.string().date().optional(),
  project: z.string().optional(),
  model: z.string().optional(),
  agent: z.string().optional(),
  session_type: z.enum(['main', 'subagent', 'heartbeat']).optional(),
  limit: z.string().transform(Number).pipe(z.number().int().min(1).max(1000)).optional(),
  offset: z.string().transform(Number).pipe(z.number().int().min(0)).optional(),
});

const summaryQuerySchema = z.object({
  start_date: z.string().date().optional(),
  end_date: z.string().date().optional(),
  group_by: z.enum(['day', 'week', 'month']).optional(),
  project: z.string().optional(),
  model: z.string().optional(),
});

// POST /api/usage - Log a usage event
router.post('/', async (req: Request, res: Response) => {
  try {
    const data = createUsageSchema.parse(req.body);
    const record = await usageService.createUsage(data);
    
    res.status(201).json({
      success: true,
      data: record,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    } else {
      console.error('Error creating usage record:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
});

// GET /api/usage - Query usage records
router.get('/', async (req: Request, res: Response) => {
  try {
    const filters = queryUsageSchema.parse(req.query);
    const records = await usageService.getUsage(filters);
    
    res.json({
      success: true,
      data: records,
      count: records.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    } else {
      console.error('Error fetching usage records:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
});

// GET /api/usage/summary - Get aggregated summary stats
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const query = summaryQuerySchema.parse(req.query);
    const summary = await usageService.getSummary(query);
    
    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    } else {
      console.error('Error fetching summary:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
});

// POST /api/usage/aggregate - Trigger daily aggregation (admin endpoint)
router.post('/aggregate', async (req: Request, res: Response) => {
  try {
    const { date } = req.body;
    
    if (!date || typeof date !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Date is required (YYYY-MM-DD format)',
      });
      return;
    }
    
    const summary = await usageService.aggregateDailySummary(date);
    
    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error('Error aggregating daily summary:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

export default router;
