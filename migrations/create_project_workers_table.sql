-- Migration: Create project_workers junction table for many-to-many relationship
-- This allows multiple workers to be assigned to a single project

-- Create project_workers junction table
CREATE TABLE IF NOT EXISTS project_workers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure a worker can only be assigned once per project
  UNIQUE(project_id, worker_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_project_workers_project_id ON project_workers(project_id);
CREATE INDEX IF NOT EXISTS idx_project_workers_worker_id ON project_workers(worker_id);

-- Add comment to table
COMMENT ON TABLE project_workers IS 'Junction table for many-to-many relationship between projects and workers';
COMMENT ON COLUMN project_workers.project_id IS 'Reference to the project';
COMMENT ON COLUMN project_workers.worker_id IS 'Reference to the worker (user with role=worker)';

-- Enable Row Level Security (RLS)
ALTER TABLE project_workers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admin can do everything
CREATE POLICY "Admin can manage project_workers"
  ON project_workers
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Workers can view their own project assignments
CREATE POLICY "Workers can view their own assignments"
  ON project_workers
  FOR SELECT
  TO authenticated
  USING (worker_id = auth.uid());

-- Grant permissions
GRANT ALL ON project_workers TO authenticated;
