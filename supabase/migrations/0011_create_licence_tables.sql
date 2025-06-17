-- Create the sia_licences table
CREATE TABLE public.sia_licences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guard_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    licence_number TEXT NOT NULL UNIQUE,
    licence_type TEXT NOT NULL, -- e.g., "Door Supervisor", "CCTV", "Security Guard"
    issue_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'Active', -- e.g., Active, Expired, Revoked, Suspended
    created_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT, -- User who added the record
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add comments for sia_licences
COMMENT ON COLUMN public.sia_licences.guard_user_id IS 'Link to the Supabase user who holds this licence';
COMMENT ON COLUMN public.sia_licences.licence_number IS 'Unique SIA licence number';
COMMENT ON COLUMN public.sia_licences.licence_type IS 'Type of SIA licence (e.g., Door Supervisor)';
COMMENT ON COLUMN public.sia_licences.status IS 'Current status of the licence';
COMMENT ON COLUMN public.sia_licences.created_by_user_id IS 'User who originally added this licence record';

-- Indexes for sia_licences
CREATE INDEX idx_sia_licences_guard_user_id ON public.sia_licences(guard_user_id);
CREATE INDEX idx_sia_licences_expiry_date ON public.sia_licences(expiry_date);
CREATE INDEX idx_sia_licences_licence_type ON public.sia_licences(licence_type);
CREATE INDEX idx_sia_licences_status ON public.sia_licences(status);

-- Create the licence_alerts table
CREATE TABLE public.licence_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sia_licence_id UUID NOT NULL REFERENCES public.sia_licences(id) ON DELETE CASCADE,
    guard_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    licence_number TEXT NOT NULL, -- Denormalized from sia_licences for alert context
    expiry_date DATE NOT NULL, -- Denormalized for alert context
    days_until_expiry INTEGER NOT NULL,
    alert_type TEXT NOT NULL, -- e.g., "Expired", "Critical", "Warning", "Info"
    alert_generated_at TIMESTAMPTZ DEFAULT now(),
    is_acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    acknowledged_at TIMESTAMPTZ
);

-- Add comments for licence_alerts
COMMENT ON COLUMN public.licence_alerts.sia_licence_id IS 'Link to the specific SIA licence record';
COMMENT ON COLUMN public.licence_alerts.days_until_expiry IS 'Calculated days until expiry (can be negative if expired)';
COMMENT ON COLUMN public.licence_alerts.alert_type IS 'Severity/type of alert (Expired, Critical, Warning, Info)';
COMMENT ON COLUMN public.licence_alerts.is_acknowledged IS 'Whether this specific alert instance has been acknowledged';

-- Indexes for licence_alerts
CREATE INDEX idx_licence_alerts_sia_licence_id ON public.licence_alerts(sia_licence_id);
CREATE INDEX idx_licence_alerts_guard_user_id ON public.licence_alerts(guard_user_id);
CREATE INDEX idx_licence_alerts_expiry_date ON public.licence_alerts(expiry_date);
CREATE INDEX idx_licence_alerts_alert_type ON public.licence_alerts(alert_type);
CREATE INDEX idx_licence_alerts_is_acknowledged ON public.licence_alerts(is_acknowledged);

-- Create function to update updated_at timestamp (if not already created by previous migrations)
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for sia_licences updated_at
CREATE TRIGGER set_timestamp_sia_licences
BEFORE UPDATE ON public.sia_licences
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();


-- RLS Policies for sia_licences
ALTER TABLE public.sia_licences ENABLE ROW LEVEL SECURITY;

-- For now, allow authenticated users broad permissions. Refine with roles later.
CREATE POLICY "Allow authenticated users to manage SIA licences"
ON public.sia_licences
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
-- More granular example (assuming a 'supervisor' role in user_metadata or a roles table):
-- INSERT: WITH CHECK (auth.uid() = created_by_user_id AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'supervisor'))
-- SELECT: USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'supervisor') OR auth.uid() = guard_user_id)
-- UPDATE: USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'supervisor'))
-- DELETE: USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'supervisor'))


-- RLS Policies for licence_alerts
ALTER TABLE public.licence_alerts ENABLE ROW LEVEL SECURITY;

-- INSERT: Typically by a system role (Edge Function). For now, no direct user inserts.
-- This means inserts will likely use service_role key and bypass RLS.
-- If specific users (like admins) should be able to manually insert alerts:
-- CREATE POLICY "Allow admins to insert licence alerts"
-- ON public.licence_alerts
-- FOR INSERT
-- TO authenticated
-- WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- SELECT: Allow authenticated users (e.g., supervisors/admins) to view alerts.
CREATE POLICY "Allow authenticated users to view licence alerts"
ON public.licence_alerts
FOR SELECT
TO authenticated
USING (true); -- Refine later with roles

-- UPDATE: Allow authenticated users (e.g., supervisors/admins) to acknowledge alerts.
CREATE POLICY "Allow authenticated users to acknowledge licence alerts"
ON public.licence_alerts
FOR UPDATE
TO authenticated
USING (true) -- Refine later with roles
WITH CHECK (is_acknowledged = TRUE AND acknowledged_by_user_id = auth.uid());


-- Grant permissions (Supabase typically handles this well based on RLS)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.sia_licences TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.licence_alerts TO authenticated;


SELECT 'Migration 0011_create_licence_tables.sql executed successfully';
