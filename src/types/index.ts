export interface UsageRecord {
  id: number;
  recorded_at: Date;
  collected_at: Date;
  model: string;
  input_tokens: number;
  output_tokens: number;
  cache_read_tokens: number;
  cache_write_tokens: number;
  cost_usd: number;
  session_label: string | null;
  session_type: string;
  project: string;
  agent: string | null;
  raw_data: Record<string, unknown> | null;
}

export interface CreateUsageRequest {
  model: string;
  tokens_in: number;
  tokens_out: number;
  cache_read_tokens?: number;
  cache_write_tokens?: number;
  cost?: number;
  project?: string;
  agent?: string;
  session_label?: string;
  session_type?: string;
  recorded_at?: string;
}

export interface UsageQueryFilters {
  start_date?: string;
  end_date?: string;
  project?: string;
  model?: string;
  agent?: string;
  session_type?: string;
  limit?: number;
  offset?: number;
}

export interface DailySummary {
  id: number;
  date: string;
  total_cost: number;
  total_requests: number;
  total_tokens_in: number;
  total_tokens_out: number;
  by_model: Record<string, { cost: number; requests: number; tokens_in: number; tokens_out: number }>;
  by_project: Record<string, { cost: number; requests: number }>;
  by_agent: Record<string, { cost: number; requests: number }>;
  created_at: Date;
  updated_at: Date;
}

export interface SummaryQuery {
  start_date?: string;
  end_date?: string;
  group_by?: 'day' | 'week' | 'month';
  project?: string;
  model?: string;
}

export interface AggregatedStats {
  period: string;
  total_cost: number;
  total_requests: number;
  total_tokens_in: number;
  total_tokens_out: number;
  by_model: Record<string, { cost: number; requests: number; tokens_in: number; tokens_out: number }>;
  by_project: Record<string, { cost: number; requests: number }>;
  by_agent: Record<string, { cost: number; requests: number }>;
}

export interface ModelPricing {
  name: string;
  input_per_1m: number;
  output_per_1m: number;
  cache_read_per_1m?: number;
  cache_write_per_1m?: number;
}
