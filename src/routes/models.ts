import { Router, Request, Response } from 'express';
import { listSupportedModels, getModelPricing, MODEL_PRICING } from '../utils/pricing';

const router = Router();

// GET /api/models - List all supported models with pricing
router.get('/', (req: Request, res: Response) => {
  const models = listSupportedModels().map(id => {
    const pricing = MODEL_PRICING[id];
    return {
      id,
      name: pricing.name,
      pricing: {
        input_per_1m: pricing.input_per_1m,
        output_per_1m: pricing.output_per_1m,
        cache_read_per_1m: pricing.cache_read_per_1m,
        cache_write_per_1m: pricing.cache_write_per_1m,
      },
    };
  });

  res.json({
    success: true,
    data: models,
    count: models.length,
  });
});

// GET /api/models/:id - Get specific model pricing
router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const pricing = getModelPricing(id);

  if (!pricing) {
    res.status(404).json({
      success: false,
      error: `Model '${id}' not found`,
    });
    return;
  }

  res.json({
    success: true,
    data: {
      id,
      name: pricing.name,
      pricing: {
        input_per_1m: pricing.input_per_1m,
        output_per_1m: pricing.output_per_1m,
        cache_read_per_1m: pricing.cache_read_per_1m,
        cache_write_per_1m: pricing.cache_write_per_1m,
      },
    },
  });
});

export default router;
