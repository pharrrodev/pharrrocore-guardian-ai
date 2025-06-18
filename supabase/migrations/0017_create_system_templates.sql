-- Create the system_templates table
CREATE TABLE public.system_templates (
    template_id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add comments for clarity
COMMENT ON COLUMN public.system_templates.template_id IS 'Unique identifier for the template, e.g., "tender_boilerplate_v1"';
COMMENT ON COLUMN public.system_templates.content IS 'The actual content of the template (e.g., Markdown, HTML)';
COMMENT ON COLUMN public.system_templates.description IS 'Optional description of the template and its purpose';

-- Create function to update updated_at timestamp (if not already created)
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for system_templates updated_at
CREATE TRIGGER set_timestamp_system_templates
BEFORE UPDATE ON public.system_templates
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

-- Indexes
CREATE INDEX idx_st_template_id ON public.system_templates(template_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.system_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies:
-- SELECT: Allow authenticated users to read templates (as Edge Functions might run under user context or service role).
CREATE POLICY "Allow authenticated users to read system templates"
ON public.system_templates
FOR SELECT
TO authenticated
USING (true);

-- INSERT, UPDATE, DELETE: Restricted to admin/service role.
-- These operations are typically handled via direct DB access by admins or specific seeding scripts.
-- Example for admin only (requires a way to identify admins):
-- CREATE POLICY "Allow admins to manage templates" ON public.system_templates
-- FOR ALL TO authenticated USING (is_admin_user()) WITH CHECK (is_admin_user());

-- Grant permissions
GRANT SELECT ON TABLE public.system_templates TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.system_templates TO service_role; -- Allow service role full access

SELECT 'Migration 0017_create_system_templates.sql executed successfully';
