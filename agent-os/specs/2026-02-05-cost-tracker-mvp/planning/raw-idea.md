# Raw Idea: AI Cost Tracker MVP

## Background

Don is managing multiple AI projects using Claude API (via OpenClaw/Clawdbot) and Claude Pro Max subscription. Current spend is ~$45-55/day on API, plus $200/mo subscription. Need visibility into:

1. Where costs are going (which models, which tasks)
2. Cost by project (PeakPaws, Kanban, Trading Tools, etc.)
3. Whether to optimize subscription vs API usage

## Requirements from Don

1. **API-accessible** — N8N and Python code need to query cost data
2. **Project tracking** — Understand costs per project, not just totals
3. **Context Vault integration** — Push summaries for cross-tool visibility
4. **Careful with CV storage** — Don't push large tabular data, keep summaries small
5. **Queryable** — Direct queries better than stored tables for detailed data

## Session/Cost Model

OpenClaw tracks sessions with labels:
- Main session (direct chat)
- Subagents (spawned tasks with labels like `peakpaws-safety-review`)
- Heartbeats (periodic checks, use Haiku)

Project mapping via label patterns:
- `peakpaws-*` → PeakPaws
- `kanban-*` → Kanban Board
- `trading-*` → Trading Tools
- etc.

## Data Sources

- **Anthropic Usage API** — Provides token counts and costs
- **OpenClaw session data** — Labels, models used, session types

## Output Needs

1. Daily cost summaries
2. Weekly/monthly trends
3. Breakdown by model (Opus expensive, Haiku cheap)
4. Breakdown by project
5. Breakdown by session type (main vs subagent vs heartbeat)
