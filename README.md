# AI Cost Tracker

Track and analyze AI API usage costs across multiple providers (Anthropic Claude, Kimi, etc.). Built with Node.js, TypeScript, and PostgreSQL (Neon).

## Features

- **Usage Logging**: Log API usage events with model, tokens, and metadata
- **Cost Calculation**: Automatic cost calculation using up-to-date pricing
- **Query & Aggregate**: Filter usage by date, project, model, or agent
- **Summary Stats**: Daily/weekly/monthly aggregated summaries
- **Multi-Provider Support**: Claude (Opus, Sonnet, Haiku), Kimi models

## Supported Models & Pricing

| Model | Input/1M | Output/1M | Cache Read/1M | Cache Write/1M |
|-------|----------|-----------|---------------|----------------|
| Claude Opus 4 | $15.00 | $75.00 | $1.50 | $18.75 |
| Claude Sonnet 4 | $3.00 | $15.00 | $0.30 | $3.75 |
| Claude Haiku 3.5 | $0.80 | $4.00 | $0.08 | $1.00 |
| Kimi K2 | $2.00 | $8.00 | - | - |
| Kimi K1.5 | $2.00 | $8.00 | - | - |

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database (Neon recommended)

### Installation

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your database URL and API key

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `API_KEY` | Yes | API authentication key |
| `PORT` | No | Server port (default: 3000) |
| `NODE_ENV` | No | Environment (development/production) |

## API Endpoints

### Health Check
```
GET /health
```

### Usage Records

#### Log Usage
```
POST /api/usage
Content-Type: application/json
X-API-Key: your_api_key

{
  "model": "claude-sonnet-4",
  "tokens_in": 1000,
  "tokens_out": 500,
  "project": "PeakPaws",
  "agent": "peakpaws-safety-review",
  "session_type": "subagent"
}
```

#### Query Usage
```
GET /api/usage?start_date=2025-01-01&end_date=2025-01-31&project=PeakPaws
X-API-Key: your_api_key
```

Query parameters:
- `start_date` - Filter from date (YYYY-MM-DD)
- `end_date` - Filter to date (YYYY-MM-DD)
- `project` - Filter by project name
- `model` - Filter by model ID
- `agent` - Filter by agent name
- `session_type` - Filter by session type (main/subagent/heartbeat)
- `limit` - Max records to return (default: 100)
- `offset` - Pagination offset

### Summary Stats

#### Get Aggregated Summary
```
GET /api/usage/summary?start_date=2025-01-01&end_date=2025-01-31&group_by=day
X-API-Key: your_api_key
```

Query parameters:
- `start_date` - Start date (YYYY-MM-DD)
- `end_date` - End date (YYYY-MM-DD)
- `group_by` - Aggregation level: `day`, `week`, or `month`
- `project` - Filter by project
- `model` - Filter by model

### Models

#### List Supported Models
```
GET /api/models
X-API-Key: your_api_key
```

#### Get Model Pricing
```
GET /api/models/claude-opus-4
X-API-Key: your_api_key
```

## Database Schema

### usage_records
Stores individual API usage events.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| recorded_at | TIMESTAMP | When usage occurred |
| model | VARCHAR(100) | Model identifier |
| input_tokens | BIGINT | Input token count |
| output_tokens | BIGINT | Output token count |
| cache_read_tokens | BIGINT | Cache read tokens |
| cache_write_tokens | BIGINT | Cache write tokens |
| cost_usd | DECIMAL(12,6) | Computed cost |
| project | VARCHAR(100) | Project name |
| agent | VARCHAR(100) | Agent identifier |
| session_type | VARCHAR(50) | main/subagent/heartbeat |
| session_label | VARCHAR(255) | Full session label |

### daily_summaries
Pre-aggregated daily statistics.

| Column | Type | Description |
|--------|------|-------------|
| date | DATE | Summary date |
| total_cost | DECIMAL(12,2) | Total daily cost |
| total_requests | INTEGER | Request count |
| by_model | JSONB | Breakdown by model |
| by_project | JSONB | Breakdown by project |
| by_agent | JSONB | Breakdown by agent |

### project_mappings
Label patterns for automatic project assignment.

| Column | Type | Description |
|--------|------|-------------|
| pattern | VARCHAR(255) | Glob pattern for matching |
| project_name | VARCHAR(100) | Project to assign |
| priority | INTEGER | Match priority |

Default mappings:
- `peakpaws-*` → PeakPaws
- `kanban-*` → Kanban Board
- `trading-*` → Trading Tools
- `cost-tracker-*` → Cost Tracker
- `*` → General (fallback)

## Development

```bash
# Run in watch mode
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Type check
npm run typecheck

# Run migrations
npm run db:migrate
```

## Deployment

### Railway

1. Connect your repo to Railway
2. Add PostgreSQL database (or use Neon)
3. Set environment variables
4. Deploy

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Project Structure

```
src/
├── db/
│   ├── index.ts          # Database connection
│   └── migrate.ts        # Schema migrations
├── middleware/
│   ├── auth.ts           # API key authentication
│   └── errorHandler.ts   # Error handling
├── routes/
│   ├── health.ts         # Health check
│   ├── models.ts         # Model/pricing info
│   └── usage.ts          # Usage CRUD & summary
├── services/
│   └── usageService.ts   # Business logic
├── types/
│   └── index.ts          # TypeScript types
├── utils/
│   └── pricing.ts        # Cost calculation
└── index.ts              # Application entry
```

## License

MIT
