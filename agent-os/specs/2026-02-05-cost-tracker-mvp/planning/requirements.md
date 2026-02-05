# Requirements: AI Cost Tracker MVP

## Functional Requirements

### FR1: Data Collection
- **FR1.1**: Collect usage data from Anthropic API on a configurable schedule (default: every 6 hours)
- **FR1.2**: Support manual trigger of collection via API endpoint
- **FR1.3**: Store raw usage records with full metadata in PostgreSQL
- **FR1.4**: Handle rate limits and API errors gracefully with retry logic

### FR2: Cost Aggregation
- **FR2.1**: Calculate costs using Anthropic's pricing model (input/output/cache tokens)
- **FR2.2**: Aggregate by time period (daily, weekly, monthly)
- **FR2.3**: Aggregate by model (claude-opus-4, claude-sonnet-4, claude-haiku-3-5, etc.)
- **FR2.4**: Aggregate by session type (main, subagent, heartbeat)
- **FR2.5**: Aggregate by project via label pattern matching

### FR3: API Endpoints
- **FR3.1**: GET `/costs/daily?date=YYYY-MM-DD` — Single day breakdown
- **FR3.2**: GET `/costs/range?start=...&end=...` — Date range with filters
- **FR3.3**: GET `/costs/summary/weekly` — Last 7 days summary
- **FR3.4**: GET `/costs/summary/monthly` — Last 30 days summary
- **FR3.5**: GET `/costs/by-model?start=...&end=...` — Model breakdown for period
- **FR3.6**: GET `/costs/by-session-type?start=...&end=...` — Session type breakdown
- **FR3.7**: GET `/costs/by-project?start=...&end=...` — Project breakdown
- **FR3.8**: Support JSON response format for all endpoints

### FR4: Context Vault Integration
- **FR4.1**: Push daily summary to Context Vault (lightweight JSON object)
- **FR4.2**: Configurable workspace for CV storage
- **FR4.3**: Manual sync trigger via API endpoint
- **FR4.4**: Summary format: date, total, by_model object, by_project object

### FR5: Project Configuration
- **FR5.1**: Configurable project-to-label pattern mapping
- **FR5.2**: Default project for unmatched sessions
- **FR5.3**: Ability to update mappings without redeployment (config or API)

## Non-Functional Requirements

### NFR1: Performance
- API responses under 500ms for standard queries
- Support date ranges up to 90 days without degradation

### NFR2: Reliability
- Handle Anthropic API downtime gracefully
- Persist collection state to resume after failures
- No data loss on service restart

### NFR3: Security
- API key authentication for all endpoints
- Secure storage of external API credentials
- No sensitive data in logs

### NFR4: Deployment
- Containerized with Docker
- Railway-compatible configuration
- Environment-based configuration (no hardcoded secrets)

## Out of Scope (MVP)

- Multi-tenant support (single user/org)
- Real-time streaming of costs
- Alerting/notifications on spend thresholds
- Support for non-Anthropic providers
- Web dashboard UI
