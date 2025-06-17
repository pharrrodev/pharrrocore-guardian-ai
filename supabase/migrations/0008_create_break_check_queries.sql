-- Create the break_check_queries table
CREATE TABLE public.break_check_queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    queried_guard_name TEXT NOT NULL,
    queried_date DATE NOT NULL,
    queried_time TIME NOT NULL,
    status_on_break BOOLEAN NOT NULL,
    status_message TEXT NOT NULL,
    user_id_performing_check UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    query_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
    site_id UUID,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Add comments for clarity
COMMENT ON COLUMN public.break_check_queries.id IS 'Unique identifier for the break check query log';
COMMENT ON COLUMN public.break_check_queries.queried_guard_name IS 'Name of the guard whose break status was queried';
COMMENT ON COLUMN public.break_check_queries.queried_date IS 'Date for which the break status was queried';
COMMENT ON COLUMN public.break_check_queries.queried_time IS 'Time for which the break status was queried';
COMMENT ON COLUMN public.break_check_queries.status_on_break IS 'Result of the query: true if on break, false otherwise';
COMMENT ON COLUMN public.break_check_queries.status_message IS 'Message returned by the break check API (e.g., "On break", "Not on break")';
COMMENT ON COLUMN public.break_check_queries.user_id_performing_check IS 'UUID of the user who performed this break check query';
COMMENT ON COLUMN public.break_check_queries.query_timestamp IS 'Timestamp of when the query was performed';
COMMENT ON COLUMN public.break_check_queries.site_id IS 'Identifier for the site (optional)';
COMMENT ON COLUMN public.break_check_queries.created_at IS 'Timestamp of when the record was created in the database';

-- Indexes
CREATE INDEX idx_bcq_user_id_performing_check ON public.break_check_queries(user_id_performing_check);
CREATE INDEX idx_bcq_query_timestamp ON public.break_check_queries(query_timestamp DESC);
CREATE INDEX idx_bcq_queried_guard_name ON public.break_check_queries(queried_guard_name);
CREATE INDEX idx_bcq_queried_date ON public.break_check_queries(queried_date);
CREATE INDEX idx_bcq_site_id ON public.break_check_queries(site_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.break_check_queries ENABLE ROW LEVEL SECURITY;

-- RLS Policies:
-- 1. Allow authenticated users to insert queries they performed.
CREATE POLICY "Allow users to insert their own break check queries"
ON public.break_check_queries
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id_performing_check);

-- 2. Allow authenticated users to select their own query logs.
CREATE POLICY "Allow users to select their own break check query logs"
ON public.break_check_queries
FOR SELECT
TO authenticated
USING (auth.uid() = user_id_performing_check);

-- Optional: Policy for supervisors/admins to view more logs (can be added later)
-- CREATE POLICY "Allow supervisors to view all break check query logs"
-- ON public.break_check_queries
-- FOR SELECT
-- TO authenticated -- Assuming supervisors have a specific role or claim
-- USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'supervisor'));


-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.break_check_queries TO authenticated;

SELECT 'Migration 0008_create_break_check_queries.sql executed successfully';
