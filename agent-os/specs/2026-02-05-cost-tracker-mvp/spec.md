# Specification: AI Cost Tracker MVP

**Status**: Draft  
**Created**: 2026-02-05  
**Author**: Miles O'Brien (OpenClaw)

## Summary

Build a FastAPI service that collects Anthropic API usage data, stores it in PostgreSQL, and provides REST endpoints for querying costs by date, model, session type, and project. Push lightweight daily summaries to Context Vault for cross-tool visibility.

## Goals

1. Provide visibility into AI API spending
2. Enable cost attribution to projects
3. Support N8N and Python integration via REST API
4. Keep Context Vault storage minimal (summaries only)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AI Cost Tracker                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │  Collector  │───▶│  Database   │◀───│  API Layer  │     │
│  │  (Scheduled)│    │  (Neon PG)  │    │  (FastAPI)  │     │
│  └──────┬──────┘    └─────────────┘    └──────┬──────┘     │
│         │                                      │            │
│         ▼                                      ▼            │
│  ┌─────────────┐                       ┌─────────────┐     │
│  │  Anthropic  │                       │   Clients   │     │
│  │  Usage API  │                       │ (N8N/Python)│     │
│  └─────────────┘                       └─────────────┘     │
│                                                             │
│  ┌─────────────┐                                           │
│  │   CV Sync   │───▶ Context Vault (daily summaries)       │
│  └─────────────┘                                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Data Model

### usage_records
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| recorded_at | TIMESTAMP | When usage occurred |
| collected_at | TIMESTAMP | When we collected it |
| model | VARCHAR(100) | Model identifier |
| input_tokens | BIGINT | Input token count |
| output_tokens | BIGINT | Output token count |
| cache_read_tokens | BIGINT | Cache read tokens |
| cache_write_tokens | BIGINT | Cache write tokens |
| cost_usd | DECIMAL(10,6) | Computed cost |
| session_label | VARCHAR(255) | Session label if available |
| session_type | VARCHAR(50) | main/subagent/heartbeat |
| project | VARCHAR(100) | Mapped project name |
| raw_data | JSONB | Full API response |

### daily_summaries
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| date | DATE | Summary date |
| total_cost | DECIMAL(10,2) | Total for day |
| by_model | JSONB | Cost per model |
| by_session_type | JSONB | Cost per session type |
| by_project | JSONB | Cost per project |
| synced_to_cv | BOOLEAN | Whether pushed to CV |
| synced_at | TIMESTAMP | When pushed |

### project_mappings
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| pattern | VARCHAR(255) | Label pattern (glob) |
| project_name | VARCHAR(100) | Project name |
| priority | INT | Match priority |

## API Design

### Authentication
All endpoints require `X-API-Key` header.

### Endpoints

#### GET /costs/daily
Query: `?date=2026-02-05`
Response:
```json
{
  "date": "2026-02-05",
  "total_cost": 52.30,
  "by_model": {
    "claude-opus-4": 48.50,
    "claude-haiku-3-5": 0.80,
    "claude-sonnet-4": 3.00
  },
  "by_session_type": {
    "main": 35.00,
    "subagent": 15.50,
    "heartbeat": 1.80
  },
  "by_project": {
    "PeakPaws": 15.00,
    "Kanban Board": 8.50,
    "General": 28.80
  }
}
```

#### GET /costs/range
Query: `?start=2026-02-01&end=2026-02-05&group_by=day`
Returns array of daily summaries.

#### GET /costs/by-model
Query: `?start=2026-02-01&end=2026-02-05`
Returns model breakdown for period.

#### GET /costs/by-project
Query: `?start=2026-02-01&end=2026-02-05`
Returns project breakdown for period.

#### POST /admin/collect
Trigger manual collection. Returns collection stats.

#### POST /admin/sync-cv
Trigger manual Context Vault sync. Returns sync status.

## Project Mapping

Default mappings (configurable via database):
```
peakpaws-*      → PeakPaws
kanban-*        → Kanban Board
trading-*       → Trading Tools
cost-tracker-*  → Cost Tracker
*               → General (default)
```

## Context Vault Sync

Daily at end of day (configurable), push summary:
```json
{
  "type": "ai_cost_daily",
  "importance": 5,
  "content": {
    "date": "2026-02-05",
    "total_cost": 52.30,
    "by_model": {...},
    "by_project": {...}
  }
}
```

Keep it small — no detailed records, just aggregates.

## Deployment

- **Platform**: Railway
- **Database**: Neon PostgreSQL (new project or existing)
- **Schedule**: APScheduler or Railway cron for collection
- **Environment**: Same pattern as PeakPaws

## Security

- API key authentication (X-API-Key header)
- Anthropic key stored in environment
- Context Vault key stored in environment
- No PII in cost data

## Success Criteria

1. ✅ Can query yesterday's costs via API
2. ✅ Costs are broken down by model, session type, project
3. ✅ N8N can call the API successfully
4. ✅ Daily summary appears in Context Vault
5. ✅ Collection runs automatically every 6 hours
