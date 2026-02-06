import { ModelPricing } from '../types';

// Pricing per 1M tokens (USD)
export const MODEL_PRICING: Record<string, ModelPricing> = {
  // Anthropic Models
  'claude-opus-4': {
    name: 'Claude Opus 4',
    input_per_1m: 15.00,
    output_per_1m: 75.00,
    cache_read_per_1m: 1.50,
    cache_write_per_1m: 18.75,
  },
  'claude-opus-4-20250514': {
    name: 'Claude Opus 4 (2025-05-14)',
    input_per_1m: 15.00,
    output_per_1m: 75.00,
    cache_read_per_1m: 1.50,
    cache_write_per_1m: 18.75,
  },
  'claude-sonnet-4': {
    name: 'Claude Sonnet 4',
    input_per_1m: 3.00,
    output_per_1m: 15.00,
    cache_read_per_1m: 0.30,
    cache_write_per_1m: 3.75,
  },
  'claude-sonnet-4-20250514': {
    name: 'Claude Sonnet 4 (2025-05-14)',
    input_per_1m: 3.00,
    output_per_1m: 15.00,
    cache_read_per_1m: 0.30,
    cache_write_per_1m: 3.75,
  },
  'claude-haiku-3-5': {
    name: 'Claude Haiku 3.5',
    input_per_1m: 0.80,
    output_per_1m: 4.00,
    cache_read_per_1m: 0.08,
    cache_write_per_1m: 1.00,
  },
  'claude-3-5-haiku': {
    name: 'Claude 3.5 Haiku',
    input_per_1m: 0.80,
    output_per_1m: 4.00,
  },
  'claude-3-haiku': {
    name: 'Claude 3 Haiku',
    input_per_1m: 0.25,
    output_per_1m: 1.25,
  },
  
  // Kimi Models (Moonshot AI)
  'kimi-k2': {
    name: 'Kimi K2',
    input_per_1m: 2.00,
    output_per_1m: 8.00,
  },
  'kimi-k2-0711': {
    name: 'Kimi K2 (0711)',
    input_per_1m: 2.00,
    output_per_1m: 8.00,
  },
  'kimi-k1-5': {
    name: 'Kimi K1.5',
    input_per_1m: 2.00,
    output_per_1m: 8.00,
  },
  'kimi-k1-5-long-context': {
    name: 'Kimi K1.5 Long Context',
    input_per_1m: 2.00,
    output_per_1m: 8.00,
  },
  'kimi-vl-a3b': {
    name: 'Kimi VL A3B',
    input_per_1m: 2.00,
    output_per_1m: 8.00,
  },
  
  // OpenAI Models (for reference/completeness)
  'gpt-4o': {
    name: 'GPT-4o',
    input_per_1m: 2.50,
    output_per_1m: 10.00,
  },
  'gpt-4o-mini': {
    name: 'GPT-4o Mini',
    input_per_1m: 0.15,
    output_per_1m: 0.60,
  },
};

export interface CostCalculation {
  model: string;
  inputCost: number;
  outputCost: number;
  cacheReadCost: number;
  cacheWriteCost: number;
  totalCost: number;
}

export function calculateCost(
  model: string,
  tokensIn: number,
  tokensOut: number,
  cacheReadTokens: number = 0,
  cacheWriteTokens: number = 0
): CostCalculation {
  const pricing = MODEL_PRICING[model];
  
  if (!pricing) {
    // Unknown model - return zero cost but log warning
    console.warn(`Unknown model for cost calculation: ${model}`);
    return {
      model,
      inputCost: 0,
      outputCost: 0,
      cacheReadCost: 0,
      cacheWriteCost: 0,
      totalCost: 0,
    };
  }
  
  const inputCost = (tokensIn / 1_000_000) * pricing.input_per_1m;
  const outputCost = (tokensOut / 1_000_000) * pricing.output_per_1m;
  
  const cacheReadCost = pricing.cache_read_per_1m 
    ? (cacheReadTokens / 1_000_000) * pricing.cache_read_per_1m
    : 0;
    
  const cacheWriteCost = pricing.cache_write_per_1m
    ? (cacheWriteTokens / 1_000_000) * pricing.cache_write_per_1m
    : 0;
  
  return {
    model,
    inputCost: roundTo6Decimals(inputCost),
    outputCost: roundTo6Decimals(outputCost),
    cacheReadCost: roundTo6Decimals(cacheReadCost),
    cacheWriteCost: roundTo6Decimals(cacheWriteCost),
    totalCost: roundTo6Decimals(inputCost + outputCost + cacheReadCost + cacheWriteCost),
  };
}

function roundTo6Decimals(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

export function getModelPricing(model: string): ModelPricing | null {
  return MODEL_PRICING[model] ?? null;
}

export function listSupportedModels(): string[] {
  return Object.keys(MODEL_PRICING);
}
