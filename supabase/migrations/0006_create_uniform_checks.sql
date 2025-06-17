-- Create the uniform_checks table
CREATE TABLE public.uniform_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guard_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    guard_name_checked TEXT NOT NULL,
    checker_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    check_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
    checklist_items JSONB NOT NULL,
    additional_comments TEXT,
    site_id UUID,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Add comments for clarity
COMMENT ON COLUMN public.uniform_checks.id IS 'Unique identifier for the uniform check entry';
COMMENT ON COLUMN public.uniform_checks.guard_id IS 'UUID of the guard being checked, if they are a system user';
COMMENT ON COLUMN public.uniform_checks.guard_name_checked IS 'Name of the guard as entered/selected during the check';
COMMENT ON COLUMN public.uniform_checks.checker_user_id IS 'UUID of the user who performed the check';
COMMENT ON COLUMN public.uniform_checks.check_timestamp IS 'Timestamp of when the check was performed';
COMMENT ON COLUMN public.uniform_checks.checklist_items IS 'JSONB array of checklist items, e.g., [{ id: "item1", label: "Cap", confirmed: true }]';
COMMENT ON COLUMN public.uniform_checks.additional_comments IS 'Any additional comments from the checker';
COMMENT ON COLUMN public.uniform_checks.site_id IS 'Identifier for the site where the check was performed (optional)';
COMMENT ON COLUMN public.uniform_checks.created_at IS 'Timestamp of when the record was created';

-- Indexes
CREATE INDEX idx_uniform_checks_guard_id ON public.uniform_checks(guard_id);
CREATE INDEX idx_uniform_checks_checker_user_id ON public.uniform_checks(checker_user_id);
CREATE INDEX idx_uniform_checks_check_timestamp ON public.uniform_checks(check_timestamp DESC);
CREATE INDEX idx_uniform_checks_site_id ON public.uniform_checks(site_id);
CREATE INDEX idx_uniform_checks_guard_name_checked ON public.uniform_checks(guard_name_checked); -- For searching by name

-- Enable Row Level Security (RLS)
ALTER TABLE public.uniform_checks ENABLE ROW LEVEL SECURITY;

-- RLS Policies:
-- 1. Allow authenticated users to insert checks they performed.
CREATE POLICY "Allow users to insert their own uniform checks"
ON public.uniform_checks
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = checker_user_id);

-- 2. Allow authenticated users to select all uniform checks.
--    (Can be refined later, e.g., supervisors see all, guards see their own if applicable)
CREATE POLICY "Allow authenticated users to select all uniform checks"
ON public.uniform_checks
FOR SELECT
TO authenticated
USING (true);

-- Optional: Policies for UPDATE/DELETE if needed later
-- CREATE POLICY "Allow users to update their own checks"
-- ON public.uniform_checks
-- FOR UPDATE
-- TO authenticated
-- USING (auth.uid() = checker_user_id);

-- CREATE POLICY "Allow users to delete their own checks"
-- ON public.uniform_checks
-- FOR DELETE
-- TO authenticated
-- USING (auth.uid() = checker_user_id);


-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.uniform_checks TO authenticated;


SELECT 'Migration 0006_create_uniform_checks.sql executed successfully';
