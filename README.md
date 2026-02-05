# AI Cost Tracker

A cost tracking API for monitoring and reporting on AI platform usage across multiple projects and sessions.

## Overview

AI Cost Tracker provides:
- Automated collection of usage data from AI platforms (Anthropic, etc.)
- Cost breakdown by model, session type, and project
- REST API for querying cost data (N8N, Python, etc.)
- Daily summaries pushed to Context Vault for cross-tool visibility

```
AI Platform APIs (Anthropic, etc.)
           ↓
    Cost Tracker Service (FastAPI)
           ↓
    PostgreSQL (Neon) — raw usage data
           ↓
    REST API Endpoints — for queries
           ↓
    Context Vault — daily summaries (lightweight)
```

## Features

### Data Collection
- Periodic polling of Anthropic usage API
- Session-level cost tracking
- Project tagging via session labels

### Cost Breakdown
- By date (daily, weekly, monthly)
- By model (Opus, Sonnet, Haiku, etc.)
- By session type (main, subagent, heartbeat)
- By project (via label mapping)

### API Endpoints
| Endpoint | Description |
|----------|-------------|
| `GET /costs/daily` | Single day breakdown |
| `GET /costs/range` | Date range query |
| `GET /costs/summary/weekly` | Last 7 days summary |
| `GET /costs/by-model` | Breakdown by model |
| `GET /costs/by-session-type` | Breakdown by session type |
| `GET /costs/by-project` | Breakdown by project |

### Context Vault Integration
Daily summaries pushed as lightweight JSON (not full tables):
```json
{
  "date": "2026-02-05",
  "total_cost": 52.30,
  "by_model": {"opus": 48.50, "haiku": 0.80, "sonnet": 3.00},
  "by_project": {"peakpaws": 15.00, "kanban": 8.50, "general": 28.80}
}
```

## Tech Stack

- **Backend**: Python 3.12, FastAPI
- **Database**: PostgreSQL (Neon)
- **Deployment**: Railway
- **Integration**: Context Vault API, Anthropic Admin API

## Development

```bash
# Clone and setup
git clone https://github.com/donshults/ai-cost-tracker.git
cd ai-cost-tracker
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Configure
cp .env.example .env
# Edit .env with your credentials

# Run locally
uvicorn src.main:app --reload
```

## Project Structure

```
ai-cost-tracker/
├── src/
│   ├── main.py              # FastAPI application
│   ├── api/                  # API endpoints
│   ├── services/             # Business logic
│   │   ├── anthropic.py      # Anthropic API client
│   │   ├── cost_aggregator.py
│   │   └── context_vault.py  # CV integration
│   ├── models/               # Database models
│   └── schemas/              # Pydantic schemas
├── agent-os/                 # Claude Code project management
├── docs/                     # Documentation
├── tests/                    # Test suites
└── alembic/                  # Database migrations
```

## License

Proprietary - All rights reserved.
