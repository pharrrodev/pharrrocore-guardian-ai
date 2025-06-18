-- Create the generated_daily_summaries table
CREATE TABLE public.generated_daily_summaries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    summary_date date NOT NULL UNIQUE,
    content_text text NOT NULL,
    generated_at timestamptz NOT NULL DEFAULT now(),
    user_id_generated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    site_id uuid,
    raw_data_snapshot jsonb,
    created_at timestamptz DEFAULT now()
);

-- Add comments for better understanding
COMMENT ON COLUMN public.generated_daily_summaries.id IS 'Unique identifier for the generated summary';
COMMENT ON COLUMN public.generated_daily_summaries.summary_date IS 'The specific date for which the summary was generated';
COMMENT ON COLUMN public.generated_daily_summaries.content_text IS 'The full text content of the generated summary';
COMMENT ON COLUMN public.generated_daily_summaries.generated_at IS 'Timestamp of when the summary was actually generated';
COMMENT ON COLUMN public.generated_daily_summaries.user_id_generated_by IS 'Identifier of the user who initiated the summary generation';
COMMENT ON COLUMN public.generated_daily_summaries.site_id IS 'Identifier for the site this summary pertains to (optional)';
COMMENT ON COLUMN public.generated_daily_summaries.raw_data_snapshot IS 'Optional JSONB snapshot of the data used to generate this summary';
COMMENT ON COLUMN public.generated_daily_summaries.created_at IS 'Timestamp of when the record was created in the database';

-- Indexes
CREATE INDEX idx_gds_summary_date ON public.generated_daily_summaries(summary_date DESC);
CREATE INDEX idx_gds_user_id_generated_by ON public.generated_daily_summaries(user_id_generated_by);
CREATE INDEX idx_gds_site_id ON public.generated_daily_summaries(site_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.generated_daily_summaries ENABLE ROW LEVEL SECURITY;

-- RLS Policies:
-- 1. Allow authenticated users to insert summaries if they are the generator.
CREATE POLICY "Allow authenticated users to insert their own generated summaries"
ON public.generated_daily_summaries
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id_generated_by);

-- 2. Allow authenticated users to select all summaries.
--    (This can be refined later, e.g., based on site_id or user roles)
CREATE POLICY "Allow authenticated users to select all generated summaries"
ON public.generated_daily_summaries
FOR SELECT
TO authenticated
USING (true);

-- Optional: Allow users to update/delete their own summaries if needed (not typical for this kind of log)
-- CREATE POLICY "Allow users to update their own summaries"
-- ON public.generated_daily_summaries
-- FOR UPDATE
-- TO authenticated
-- USING (auth.uid() = user_id_generated_by);

-- CREATE POLICY "Allow users to delete their own summaries"
-- ON public.generated_daily_summaries
-- FOR DELETE
-- TO authenticated
-- USING (auth.uid() = user_id_generated_by);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.generated_daily_summaries TO authenticated;

SELECT 'Migration 0004_create_generated_daily_summaries.sql executed successfully';
