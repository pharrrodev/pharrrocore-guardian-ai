-- Create the generated_reports_metadata table
CREATE TABLE public.generated_reports_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_name TEXT NOT NULL,
    report_type TEXT NOT NULL, -- e.g., "WeeklyClientPDF", "WeeklyClientMarkdown"
    generation_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    period_start_date DATE NOT NULL,
    period_end_date DATE NOT NULL,
    file_storage_path TEXT NOT NULL, -- Path in Supabase Storage
    file_size_bytes INTEGER,
    generated_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- If manually triggered by a user
    site_id UUID, -- Optional: For multi-site context
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Add comments for clarity
COMMENT ON COLUMN public.generated_reports_metadata.id IS 'Unique identifier for the report metadata entry';
COMMENT ON COLUMN public.generated_reports_metadata.report_name IS 'User-friendly name of the report, e.g., "Weekly Client Report - W23 2024"';
COMMENT ON COLUMN public.generated_reports_metadata.report_type IS 'Type of the report file, e.g., "WeeklyClientPDF", "WeeklyClientMarkdown"';
COMMENT ON COLUMN public.generated_reports_metadata.generation_date IS 'Timestamp of when the report file was generated';
COMMENT ON COLUMN public.generated_reports_metadata.period_start_date IS 'Start date of the period covered by the report';
COMMENT ON COLUMN public.generated_reports_metadata.period_end_date IS 'End date of the period covered by the report';
COMMENT ON COLUMN public.generated_reports_metadata.file_storage_path IS 'Full path to the generated report file in Supabase Storage';
COMMENT ON COLUMN public.generated_reports_metadata.file_size_bytes IS 'Size of the generated file in bytes';
COMMENT ON COLUMN public.generated_reports_metadata.generated_by_user_id IS 'UUID of the user who manually triggered generation, if applicable';
COMMENT ON COLUMN public.generated_reports_metadata.site_id IS 'Identifier for the site this report pertains to (optional)';

-- Indexes
CREATE INDEX idx_grm_report_type ON public.generated_reports_metadata(report_type);
CREATE INDEX idx_grm_generation_date ON public.generated_reports_metadata(generation_date DESC);
CREATE INDEX idx_grm_period_start_date ON public.generated_reports_metadata(period_start_date);
CREATE INDEX idx_grm_site_id ON public.generated_reports_metadata(site_id);
CREATE INDEX idx_grm_report_name ON public.generated_reports_metadata(report_name);


-- Enable Row Level Security (RLS)
ALTER TABLE public.generated_reports_metadata ENABLE ROW LEVEL SECURITY;

-- RLS Policies:
-- INSERT: Primarily by a system role (Edge Function using service_role key).
-- If specific users (like admins) should be able to manually insert metadata (less common):
-- CREATE POLICY "Allow admins to insert report metadata"
-- ON public.generated_reports_metadata
-- FOR INSERT
-- TO authenticated
-- WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')); -- Assuming 'profiles' table with roles

-- SELECT: Allow authenticated users (e.g., supervisors/admins) to view report metadata.
CREATE POLICY "Allow authenticated users to view report metadata"
ON public.generated_reports_metadata
FOR SELECT
TO authenticated
USING (true); -- Refine later with roles or site_id checks

-- UPDATE/DELETE: Typically restricted, possibly to admins or system roles.
-- For now, do not grant general authenticated users UPDATE/DELETE.
-- CREATE POLICY "Allow admins to update report metadata"
-- ON public.generated_reports_metadata
-- FOR UPDATE
-- TO authenticated
-- USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));


-- Grant permissions
GRANT SELECT ON TABLE public.generated_reports_metadata TO authenticated;
-- INSERT, UPDATE, DELETE will be managed by the service role via Edge Function or specific admin policies.

SELECT 'Migration 0016_create_generated_reports_metadata.sql executed successfully';
