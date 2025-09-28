-- Connect to your database and run this
CREATE TABLE IF NOT EXISTS cedar_tasks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  task_type VARCHAR(50) NOT NULL,
  energy_required VARCHAR(20) NOT NULL,
  focus_required VARCHAR(20) NOT NULL,
  scheduled_date DATE NOT NULL,
  cycle_day INTEGER NOT NULL,
  phase VARCHAR(20) NOT NULL,
  confidence DECIMAL(3,2) NOT NULL,
  reasoning TEXT[],
  optimization_tips TEXT[],
  alternatives JSONB,
  constraints JSONB,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_cedar_tasks_scheduled_date ON cedar_tasks(scheduled_date, completed);
CREATE INDEX IF NOT EXISTS idx_cedar_tasks_phase ON cedar_tasks(phase);