# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with this repository.

## Project Overview

**AI Cost Tracker** is a FastAPI service that collects, stores, and reports on AI platform usage costs. It integrates with Anthropic's usage API and pushes summaries to Context Vault for cross-tool visibility.

### Primary Goals

| # | Goal | Description |
|---|------|-------------|
| 1 | **Data Collection** | Poll Anthropic usage API periodically, store in PostgreSQL |
| 2 | **Cost Reporting** | REST API for querying costs by date, model, session, project |
| 3 | **Context Vault Sync** | Push daily summaries (lightweight JSON) to Context Vault |

## Essential Development Commands

### Local Development

```bash
# Start local dev server
uvicorn src.main:app --reload

# Run tests
pytest

# Format code
black .
isort .

# Lint
flake8
```

### Environment Setup

```bash
python -m venv venv
source venv/bin/activate  # Unix/macOS
pip install -r requirements.txt
cp .env.example .env
```

## Architecture

### Data Flow

```
Anthropic Admin API → Collector Service → PostgreSQL
                                              ↓
                                         API Endpoints ← N8N/Python clients
                                              ↓
                                         Context Vault (daily summaries)
```

### Key Components

- **Collector**: Scheduled job that fetches usage from Anthropic
- **Aggregator**: Computes costs by model, session type, project
- **API**: FastAPI endpoints for querying cost data
- **CV Sync**: Pushes lightweight daily summaries to Context Vault

### Project Mapping

Sessions are tagged with projects via label patterns:
```python
PROJECT_PATTERNS = {
    "peakpaws-*": "PeakPaws",
    "kanban-*": "Kanban Board",
    "trading-*": "Trading Tools",
    # Default: "General"
}
```

## Environment Variables

```bash
# Application
ENVIRONMENT=development
API_KEY=your_internal_api_key

# Anthropic
ANTHROPIC_API_KEY=your_anthropic_key
ANTHROPIC_ADMIN_KEY=your_admin_key  # For usage API

# Database (Neon PostgreSQL)
DATABASE_URL=postgresql+asyncpg://user:pass@host/db?sslmode=require

# Context Vault
CONTEXT_VAULT_API_KEY=your_cv_key
CONTEXT_VAULT_URL=https://context-vault.callteksupport.net
CONTEXT_VAULT_WORKSPACE=openclaw_default

# Collection Schedule
COLLECTION_INTERVAL_HOURS=6
```

## API Endpoints

### Cost Queries

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/costs/daily` | Single day breakdown |
| GET | `/costs/range` | Date range with optional filters |
| GET | `/costs/summary/weekly` | Last 7 days aggregated |
| GET | `/costs/summary/monthly` | Last 30 days aggregated |
| GET | `/costs/by-model` | Breakdown by AI model |
| GET | `/costs/by-session-type` | Main vs subagent vs heartbeat |
| GET | `/costs/by-project` | Breakdown by project tag |

### Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/admin/collect` | Trigger manual collection |
| POST | `/admin/sync-cv` | Push summary to Context Vault |
| GET | `/health` | Health check |

## Database Schema

### usage_records
```sql
CREATE TABLE usage_records (
    id SERIAL PRIMARY KEY,
    recorded_at TIMESTAMP NOT NULL,
    model VARCHAR(100) NOT NULL,
    input_tokens BIGINT NOT NULL,
    output_tokens BIGINT NOT NULL,
    cache_read_tokens BIGINT DEFAULT 0,
    cache_write_tokens BIGINT DEFAULT 0,
    cost_usd DECIMAL(10, 6) NOT NULL,
    session_label VARCHAR(255),
    session_type VARCHAR(50),  -- main, subagent, heartbeat
    project VARCHAR(100),
    raw_data JSONB
);
```

## Agent-OS Integration

This project uses Agent-OS for structured specification and task management.

### Slash Commands
- `/plan-product` - Start product planning
- `/shape-spec` - Shape and refine a specification
- `/write-spec` - Create a comprehensive specification document
- `/create-tasks` - Generate a tasks breakdown from a spec
- `/implement-tasks` - Task implementation workflow

### Directory Structure
```
agent-os/
├── config.yml          # Agent-OS configuration
├── specs/              # Specification documents
└── standards/          # Coding standards
```

## Code Patterns

- Prefer simple solutions, avoid over-engineering
- Keep files under 200-300 lines
- Use Pydantic for all schemas
- Async/await for database operations
- Type hints everywhere

## Testing Strategy

- Unit tests for aggregation logic
- Integration tests for API endpoints
- Mock Anthropic API responses for tests
