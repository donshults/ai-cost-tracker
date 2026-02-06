import 'dotenv/config';
import { pool } from './index';

const migrations = [
  `-- Create usage_records table
CREATE TABLE IF NOT EXISTS usage_records (
  id SERIAL PRIMARY KEY,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  collected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  model VARCHAR(100) NOT NULL,
  input_tokens BIGINT NOT NULL DEFAULT 0,
  output_tokens BIGINT NOT NULL DEFAULT 0,
  cache_read_tokens BIGINT NOT NULL DEFAULT 0,
  cache_write_tokens BIGINT NOT NULL DEFAULT 0,
  cost_usd DECIMAL(12, 6) NOT NULL,
  session_label VARCHAR(255),
  session_type VARCHAR(50) NOT NULL DEFAULT 'main',
  project VARCHAR(100) NOT NULL DEFAULT 'General',
  agent VARCHAR(100),
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_usage_recorded_at ON usage_records(recorded_at);
CREATE INDEX IF NOT EXISTS idx_usage_model ON usage_records(model);
CREATE INDEX IF NOT EXISTS idx_usage_project ON usage_records(project);
CREATE INDEX IF NOT EXISTS idx_usage_agent ON usage_records(agent);
CREATE INDEX IF NOT EXISTS idx_usage_session_type ON usage_records(session_type);
CREATE INDEX IF NOT EXISTS idx_usage_project_date ON usage_records(project, recorded_at);

-- Create daily_summaries table
CREATE TABLE IF NOT EXISTS daily_summaries (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  total_cost DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total_requests INTEGER NOT NULL DEFAULT 0,
  total_tokens_in BIGINT NOT NULL DEFAULT 0,
  total_tokens_out BIGINT NOT NULL DEFAULT 0,
  by_model JSONB NOT NULL DEFAULT '{}',
  by_project JSONB NOT NULL DEFAULT '{}',
  by_agent JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_summary_date ON daily_summaries(date);

-- Create project_mappings table
CREATE TABLE IF NOT EXISTS project_mappings (
  id SERIAL PRIMARY KEY,
  pattern VARCHAR(255) NOT NULL,
  project_name VARCHAR(100) NOT NULL,
  priority INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_mapping_pattern ON project_mappings(pattern);
CREATE INDEX IF NOT EXISTS idx_project_mapping_priority ON project_mappings(priority);

-- Insert default project mappings
INSERT INTO project_mappings (pattern, project_name, priority) VALUES
  ('peakpaws-*', 'PeakPaws', 10),
  ('kanban-*', 'Kanban Board', 10),
  ('trading-*', 'Trading Tools', 10),
  ('cost-tracker-*', 'Cost Tracker', 10),
  ('context-vault-*', 'Context Vault', 10),
  ('*', 'General', 0)
ON CONFLICT DO NOTHING;`
];

export async function runMigrations(): Promise<void> {
  console.log('Running migrations...');
  
  const client = await pool.connect();
  try {
    for (let i = 0; i < migrations.length; i++) {
      const migration = migrations[i];
      console.log(`Running migration ${i + 1}/${migrations.length}...`);
      await client.query(migration);
    }
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migrations
runMigrations()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
