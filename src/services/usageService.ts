import { query, queryOne } from '../db';
import { 
  UsageRecord, 
  CreateUsageRequest, 
  UsageQueryFilters,
  DailySummary,
  AggregatedStats,
  SummaryQuery
} from '../types';
import { calculateCost } from '../utils/pricing';

export class UsageService {
  async createUsage(data: CreateUsageRequest): Promise<UsageRecord> {
    const cost = data.cost ?? this.calculateCostFromTokens(
      data.model,
      data.tokens_in,
      data.tokens_out,
      data.cache_read_tokens ?? 0,
      data.cache_write_tokens ?? 0
    );

    const result = await queryOne<UsageRecord>(
      `INSERT INTO usage_records 
       (recorded_at, model, input_tokens, output_tokens, cache_read_tokens, cache_write_tokens, 
        cost_usd, session_label, session_type, project, agent, raw_data)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        data.recorded_at ?? new Date().toISOString(),
        data.model,
        data.tokens_in,
        data.tokens_out,
        data.cache_read_tokens ?? 0,
        data.cache_write_tokens ?? 0,
        cost,
        data.session_label ?? null,
        data.session_type ?? 'main',
        data.project ?? 'General',
        data.agent ?? null,
        null // raw_data
      ]
    );

    if (!result) {
      throw new Error('Failed to create usage record');
    }

    return result;
  }

  async getUsage(filters: UsageQueryFilters): Promise<UsageRecord[]> {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (filters.start_date) {
      conditions.push(`recorded_at >= $${paramIndex}`);
      params.push(filters.start_date);
      paramIndex++;
    }

    if (filters.end_date) {
      conditions.push(`recorded_at <= $${paramIndex}`);
      params.push(filters.end_date + 'T23:59:59.999Z');
      paramIndex++;
    }

    if (filters.project) {
      conditions.push(`project = $${paramIndex}`);
      params.push(filters.project);
      paramIndex++;
    }

    if (filters.model) {
      conditions.push(`model = $${paramIndex}`);
      params.push(filters.model);
      paramIndex++;
    }

    if (filters.agent) {
      conditions.push(`agent = $${paramIndex}`);
      params.push(filters.agent);
      paramIndex++;
    }

    if (filters.session_type) {
      conditions.push(`session_type = $${paramIndex}`);
      params.push(filters.session_type);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = filters.limit ?? 100;
    const offset = filters.offset ?? 0;

    const results = await query<UsageRecord>(
      `SELECT * FROM usage_records 
       ${whereClause}
       ORDER BY recorded_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    return results;
  }

  async getSummary(queryParams: SummaryQuery): Promise<AggregatedStats[]> {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (queryParams.start_date) {
      conditions.push(`recorded_at >= $${paramIndex}`);
      params.push(queryParams.start_date);
      paramIndex++;
    }

    if (queryParams.end_date) {
      conditions.push(`recorded_at <= $${paramIndex}`);
      params.push(queryParams.end_date + 'T23:59:59.999Z');
      paramIndex++;
    }

    if (queryParams.project) {
      conditions.push(`project = $${paramIndex}`);
      params.push(queryParams.project);
      paramIndex++;
    }

    if (queryParams.model) {
      conditions.push(`model = $${paramIndex}`);
      params.push(queryParams.model);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    const groupBy = queryParams.group_by ?? 'day';
    let dateTrunc: string;
    
    switch (groupBy) {
      case 'week':
        dateTrunc = 'week';
        break;
      case 'month':
        dateTrunc = 'month';
        break;
      case 'day':
      default:
        dateTrunc = 'day';
    }

    // Get period totals
    const periodResults = await query<{
      period: Date;
      total_cost: string;
      total_requests: string;
      total_tokens_in: string;
      total_tokens_out: string;
    }>(
      `SELECT 
        DATE_TRUNC('${dateTrunc}', recorded_at) as period,
        SUM(cost_usd) as total_cost,
        COUNT(*) as total_requests,
        SUM(input_tokens) as total_tokens_in,
        SUM(output_tokens) as total_tokens_out
      FROM usage_records
      ${whereClause}
      GROUP BY DATE_TRUNC('${dateTrunc}', recorded_at)
      ORDER BY period DESC`,
      params
    );

    // Get model breakdown per period
    const modelResults = await query<{
      period: Date;
      model: string;
      cost: string;
      requests: string;
      tokens_in: string;
      tokens_out: string;
    }>(
      `SELECT 
        DATE_TRUNC('${dateTrunc}', recorded_at) as period,
        model,
        SUM(cost_usd) as cost,
        COUNT(*) as requests,
        SUM(input_tokens) as tokens_in,
        SUM(output_tokens) as tokens_out
      FROM usage_records
      ${whereClause}
      GROUP BY DATE_TRUNC('${dateTrunc}', recorded_at), model
      ORDER BY period DESC, cost DESC`,
      [...params]
    );

    // Get project breakdown per period
    const projectResults = await query<{
      period: Date;
      project: string;
      cost: string;
      requests: string;
    }>(
      `SELECT 
        DATE_TRUNC('${dateTrunc}', recorded_at) as period,
        COALESCE(project, 'General') as project,
        SUM(cost_usd) as cost,
        COUNT(*) as requests
      FROM usage_records
      ${whereClause}
      GROUP BY DATE_TRUNC('${dateTrunc}', recorded_at), project
      ORDER BY period DESC, cost DESC`,
      [...params]
    );

    // Get agent breakdown per period
    const agentWhereClause = conditions.length > 0 
      ? `${whereClause} AND agent IS NOT NULL`
      : 'WHERE agent IS NOT NULL';
    
    const agentResults = await query<{
      period: Date;
      agent: string;
      cost: string;
      requests: string;
    }>(
      `SELECT 
        DATE_TRUNC('${dateTrunc}', recorded_at) as period,
        COALESCE(agent, 'unknown') as agent,
        SUM(cost_usd) as cost,
        COUNT(*) as requests
      FROM usage_records
      ${agentWhereClause}
      GROUP BY DATE_TRUNC('${dateTrunc}', recorded_at), agent
      ORDER BY period DESC, cost DESC`,
      [...params]
    );

    // Build aggregated stats
    const statsMap = new Map<string, AggregatedStats>();

    for (const row of periodResults) {
      const periodKey = row.period.toISOString().split('T')[0];
      statsMap.set(periodKey, {
        period: periodKey,
        total_cost: parseFloat(row.total_cost),
        total_requests: parseInt(row.total_requests),
        total_tokens_in: parseInt(row.total_tokens_in),
        total_tokens_out: parseInt(row.total_tokens_out),
        by_model: {},
        by_project: {},
        by_agent: {},
      });
    }

    for (const row of modelResults) {
      const periodKey = row.period.toISOString().split('T')[0];
      const stat = statsMap.get(periodKey);
      if (stat) {
        stat.by_model[row.model] = {
          cost: parseFloat(row.cost),
          requests: parseInt(row.requests),
          tokens_in: parseInt(row.tokens_in),
          tokens_out: parseInt(row.tokens_out),
        };
      }
    }

    for (const row of projectResults) {
      const periodKey = row.period.toISOString().split('T')[0];
      const stat = statsMap.get(periodKey);
      if (stat) {
        stat.by_project[row.project] = {
          cost: parseFloat(row.cost),
          requests: parseInt(row.requests),
        };
      }
    }

    for (const row of agentResults) {
      const periodKey = row.period.toISOString().split('T')[0];
      const stat = statsMap.get(periodKey);
      if (stat) {
        stat.by_agent[row.agent] = {
          cost: parseFloat(row.cost),
          requests: parseInt(row.requests),
        };
      }
    }

    return Array.from(statsMap.values()).sort((a, b) => 
      b.period.localeCompare(a.period)
    );
  }

  async getDailySummary(date: string): Promise<DailySummary | null> {
    const result = await queryOne<DailySummary>(
      'SELECT * FROM daily_summaries WHERE date = $1',
      [date]
    );
    return result;
  }

  async aggregateDailySummary(date: string): Promise<DailySummary> {
    const result = await queryOne<{
      total_cost: number;
      total_requests: number;
      total_tokens_in: number;
      total_tokens_out: number;
      by_model: Record<string, unknown>;
      by_project: Record<string, unknown>;
      by_agent: Record<string, unknown>;
    }>(
      `SELECT 
        SUM(cost_usd) as total_cost,
        COUNT(*) as total_requests,
        SUM(input_tokens) as total_tokens_in,
        SUM(output_tokens) as total_tokens_out,
        jsonb_object_agg(
          model,
          jsonb_build_object(
            'cost', model_stats.cost,
            'requests', model_stats.requests,
            'tokens_in', model_stats.tokens_in,
            'tokens_out', model_stats.tokens_out
          )
        ) as by_model,
        jsonb_object_agg(
          COALESCE(project, 'General'),
          jsonb_build_object('cost', project_stats.cost, 'requests', project_stats.requests)
        ) as by_project,
        jsonb_object_agg(
          COALESCE(agent, 'unknown'),
          jsonb_build_object('cost', agent_stats.cost, 'requests', agent_stats.requests)
        ) FILTER (WHERE agent IS NOT NULL) as by_agent
      FROM usage_records u
      LEFT JOIN LATERAL (
        SELECT 
          SUM(cost_usd) as cost,
          COUNT(*) as requests,
          SUM(input_tokens) as tokens_in,
          SUM(output_tokens) as tokens_out
        FROM usage_records
        WHERE model = u.model AND DATE(recorded_at) = $1
      ) model_stats ON true
      LEFT JOIN LATERAL (
        SELECT SUM(cost_usd) as cost, COUNT(*) as requests
        FROM usage_records
        WHERE project = u.project AND DATE(recorded_at) = $1
      ) project_stats ON true
      LEFT JOIN LATERAL (
        SELECT SUM(cost_usd) as cost, COUNT(*) as requests
        FROM usage_records
        WHERE agent = u.agent AND DATE(recorded_at) = $1
      ) agent_stats ON true
      WHERE DATE(recorded_at) = $1`,
      [date]
    );

    if (!result) {
      throw new Error('Failed to aggregate daily summary');
    }

    // Upsert the daily summary
    const summary = await queryOne<DailySummary>(
      `INSERT INTO daily_summaries 
       (date, total_cost, total_requests, total_tokens_in, total_tokens_out, by_model, by_project, by_agent, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       ON CONFLICT (date) DO UPDATE SET
         total_cost = EXCLUDED.total_cost,
         total_requests = EXCLUDED.total_requests,
         total_tokens_in = EXCLUDED.total_tokens_in,
         total_tokens_out = EXCLUDED.total_tokens_out,
         by_model = EXCLUDED.by_model,
         by_project = EXCLUDED.by_project,
         by_agent = EXCLUDED.by_agent,
         updated_at = NOW()
       RETURNING *`,
      [
        date,
        result.total_cost || 0,
        result.total_requests || 0,
        result.total_tokens_in || 0,
        result.tokens_out || 0,
        JSON.stringify(result.by_model || {}),
        JSON.stringify(result.by_project || {}),
        JSON.stringify(result.by_agent || {})
      ]
    );

    if (!summary) {
      throw new Error('Failed to save daily summary');
    }

    return summary;
  }

  private calculateCostFromTokens(
    model: string,
    tokensIn: number,
    tokensOut: number,
    cacheReadTokens: number,
    cacheWriteTokens: number
  ): number {
    const calc = calculateCost(model, tokensIn, tokensOut, cacheReadTokens, cacheWriteTokens);
    return calc.totalCost;
  }
}

export const usageService = new UsageService();
