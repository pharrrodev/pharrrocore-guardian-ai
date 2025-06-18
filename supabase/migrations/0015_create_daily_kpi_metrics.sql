-- Create the daily_kpi_metrics table
CREATE TABLE public.daily_kpi_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_date DATE NOT NULL UNIQUE,
    total_patrols INTEGER DEFAULT 0,
    patrol_target_achieved_percentage DECIMAL(5,2) DEFAULT 0.00,
    total_breaks_logged INTEGER DEFAULT 0,
    uniform_compliance_percentage DECIMAL(5,2) DEFAULT 0.00,
    guards_on_duty INTEGER DEFAULT 0,
    patrols_per_guard_avg DECIMAL(5,2) DEFAULT 0.00,
    raw_patrols_per_guard_data JSONB,
    generated_at TIMESTAMPTZ DEFAULT now()
    -- created_at and updated_at are not strictly necessary if generated_at covers it
    -- and upsert on report_date handles updates.
);

-- Add comments for clarity
COMMENT ON COLUMN public.daily_kpi_metrics.report_date IS 'The date for which these KPI metrics are calculated';
COMMENT ON COLUMN public.daily_kpi_metrics.total_patrols IS 'Total number of patrols logged on the report date';
COMMENT ON COLUMN public.daily_kpi_metrics.patrol_target_achieved_percentage IS 'Percentage of patrol targets met (e.g., based on active guards & target patrols per guard)';
COMMENT ON COLUMN public.daily_kpi_metrics.total_breaks_logged IS 'Total number of breaks logged on the report date';
COMMENT ON COLUMN public.daily_kpi_metrics.uniform_compliance_percentage IS 'Percentage of guards checked who were compliant';
COMMENT ON COLUMN public.daily_kpi_metrics.guards_on_duty IS 'Count of unique guards considered on duty for KPI calculations (e.g., from shifts or EDOB activity)';
COMMENT ON COLUMN public.daily_kpi_metrics.patrols_per_guard_avg IS 'Average number of patrols completed per guard on duty';
COMMENT ON COLUMN public.daily_kpi_metrics.raw_patrols_per_guard_data IS 'Optional JSONB: {guard_user_id: patrol_count}';
COMMENT ON COLUMN public.daily_kpi_metrics.generated_at IS 'Timestamp of when this KPI record was generated/updated';

-- Indexes
CREATE INDEX idx_dkm_report_date ON public.daily_kpi_metrics(report_date DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.daily_kpi_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies:
-- INSERT: Typically by a system role (Edge Function). No direct user inserts.
-- If specific users (like admins) should be able to manually insert/override KPIs:
-- CREATE POLICY "Allow admins to insert KPI metrics"
-- ON public.daily_kpi_metrics
-- FOR INSERT
-- TO authenticated
-- WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')); -- Assuming a 'profiles' table with roles

-- SELECT: Allow all authenticated users to read KPI metrics.
CREATE POLICY "Allow authenticated users to read KPI metrics"
ON public.daily_kpi_metrics
FOR SELECT
TO authenticated
USING (true);

-- UPDATE/DELETE: Typically restricted, possibly to admins or system roles.
-- For now, we'll assume updates are handled by the Edge Function's upsert.
-- CREATE POLICY "Allow admins to update KPI metrics"
-- ON public.daily_kpi_metrics
-- FOR UPDATE
-- TO authenticated
-- USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Grant permissions
GRANT SELECT ON TABLE public.daily_kpi_metrics TO authenticated;
-- INSERT, UPDATE, DELETE will be managed by the service role via Edge Function or specific admin policies.

SELECT 'Migration 0015_create_daily_kpi_metrics.sql executed successfully';
