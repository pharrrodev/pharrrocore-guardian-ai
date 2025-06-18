-- Create the payroll_input_data table
CREATE TABLE public.payroll_input_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guard_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    pay_period_start_date DATE NOT NULL,
    pay_period_end_date DATE NOT NULL,
    hours_paid DECIMAL(10, 2) NOT NULL,
    source_reference TEXT,
    input_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_payroll_period_for_guard UNIQUE (guard_user_id, pay_period_start_date, pay_period_end_date)
);

-- Add comments for payroll_input_data
COMMENT ON COLUMN public.payroll_input_data.hours_paid IS 'Total hours paid for the guard in this pay period';
COMMENT ON COLUMN public.payroll_input_data.source_reference IS 'e.g., Payroll system batch ID, import filename';
COMMENT ON COLUMN public.payroll_input_data.input_by_user_id IS 'User who inputted this payroll data';

-- Indexes for payroll_input_data
CREATE INDEX idx_pid_guard_user_id ON public.payroll_input_data(guard_user_id);
CREATE INDEX idx_pid_pay_period_start_date ON public.payroll_input_data(pay_period_start_date);
CREATE INDEX idx_pid_pay_period_end_date ON public.payroll_input_data(pay_period_end_date);
CREATE INDEX idx_pid_input_by_user_id ON public.payroll_input_data(input_by_user_id);


-- Create the payroll_variances table
CREATE TABLE public.payroll_variances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guard_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    shift_id UUID REFERENCES public.shifts(id) ON DELETE SET NULL, -- Can be null if variance is not tied to a single shift
    variance_date DATE NOT NULL,
    scheduled_hours DECIMAL(10, 2) NOT NULL,
    actual_hours_calculated DECIMAL(10, 2) NOT NULL,
    paid_hours DECIMAL(10, 2) NOT NULL,
    variance_hours DECIMAL(10, 2) NOT NULL,
    site_id UUID,
    notes TEXT,
    report_generated_at TIMESTAMPTZ DEFAULT now(),
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Investigating', 'Resolved', 'No Action Required'))
);

-- Add comments for payroll_variances
COMMENT ON COLUMN public.payroll_variances.shift_id IS 'Link to specific shift if variance is for that shift';
COMMENT ON COLUMN public.payroll_variances.variance_date IS 'The date for which the variance is being reported';
COMMENT ON COLUMN public.payroll_variances.scheduled_hours IS 'Hours scheduled as per rota/shifts table';
COMMENT ON COLUMN public.payroll_variances.actual_hours_calculated IS 'Actual hours worked, calculated from activities or shifts';
COMMENT ON COLUMN public.payroll_variances.paid_hours IS 'Hours paid as per payroll input data for this specific date/shift context';
COMMENT ON COLUMN public.payroll_variances.variance_hours IS 'Difference: (actual_hours_calculated - paid_hours)';
COMMENT ON COLUMN public.payroll_variances.status IS 'Status of the variance investigation';

-- Indexes for payroll_variances
CREATE INDEX idx_pv_guard_user_id ON public.payroll_variances(guard_user_id);
CREATE INDEX idx_pv_shift_id ON public.payroll_variances(shift_id);
CREATE INDEX idx_pv_variance_date ON public.payroll_variances(variance_date);
CREATE INDEX idx_pv_status ON public.payroll_variances(status);
CREATE INDEX idx_pv_site_id ON public.payroll_variances(site_id);


-- Create function to update updated_at timestamp (if not already created)
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for payroll_input_data updated_at
CREATE TRIGGER set_timestamp_payroll_input_data
BEFORE UPDATE ON public.payroll_input_data
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();
-- Note: payroll_variances usually won't be updated often, primarily status.
-- If other fields are updated, an updated_at trigger could be added there too.


-- RLS Policies for payroll_input_data
ALTER TABLE public.payroll_input_data ENABLE ROW LEVEL SECURITY;
-- Assuming 'finance' or 'admin' role can manage payroll input. For now, authenticated.
CREATE POLICY "Allow authenticated users to manage payroll input"
ON public.payroll_input_data
FOR ALL
TO authenticated -- Replace with specific roles like 'finance_admin'
USING (true) -- Users with role can see all.
WITH CHECK (auth.uid() = input_by_user_id); -- Users can only insert as themselves.

-- RLS Policies for payroll_variances
ALTER TABLE public.payroll_variances ENABLE ROW LEVEL SECURITY;
-- INSERT: Typically by a system role (Edge Function).
-- SELECT: Allow authenticated users (e.g., supervisors/admins/finance) to view.
CREATE POLICY "Allow authenticated users to view payroll variances"
ON public.payroll_variances
FOR SELECT
TO authenticated
USING (true); -- Refine later with roles

-- UPDATE: Allow specific roles to update status/notes.
CREATE POLICY "Allow specific roles to update payroll variances"
ON public.payroll_variances
FOR UPDATE
TO authenticated -- Replace with specific roles
USING (true) -- Users with role can update any.
WITH CHECK (true); -- Or add specific checks on what can be updated.


-- Grant permissions (Supabase handles based on RLS)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.payroll_input_data TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.payroll_variances TO authenticated;

SELECT 'Migration 0012_create_payroll_tables.sql executed successfully';
