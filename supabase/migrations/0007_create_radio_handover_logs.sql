-- Create the radio_handover_logs table
CREATE TABLE public.radio_handover_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guard_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    guard_name_logged TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('radio', 'handover')),
    log_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
    user_id_performed_log UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    site_id UUID,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Add comments for clarity
COMMENT ON COLUMN public.radio_handover_logs.id IS 'Unique identifier for the log entry';
COMMENT ON COLUMN public.radio_handover_logs.guard_id IS 'UUID of the guard involved, if they are a system user';
COMMENT ON COLUMN public.radio_handover_logs.guard_name_logged IS 'Name of the guard as entered/selected at the time of logging';
COMMENT ON COLUMN public.radio_handover_logs.action IS 'Type of log: ''radio'' for radio check, ''handover'' for end-of-shift handover';
COMMENT ON COLUMN public.radio_handover_logs.log_timestamp IS 'Timestamp of when the radio check or handover was logged';
COMMENT ON COLUMN public.radio_handover_logs.user_id_performed_log IS 'UUID of the user who recorded this log (e.g., supervisor, or guard themselves)';
COMMENT ON COLUMN public.radio_handover_logs.site_id IS 'Identifier for the site (optional)';
COMMENT ON COLUMN public.radio_handover_logs.created_at IS 'Timestamp of when the record was created in the database';

-- Indexes
CREATE INDEX idx_rhl_guard_id ON public.radio_handover_logs(guard_id);
CREATE INDEX idx_rhl_user_id_performed_log ON public.radio_handover_logs(user_id_performed_log);
CREATE INDEX idx_rhl_log_timestamp ON public.radio_handover_logs(log_timestamp DESC);
CREATE INDEX idx_rhl_action ON public.radio_handover_logs(action);
CREATE INDEX idx_rhl_site_id ON public.radio_handover_logs(site_id);
CREATE INDEX idx_rhl_guard_name_logged ON public.radio_handover_logs(guard_name_logged);


-- Enable Row Level Security (RLS)
ALTER TABLE public.radio_handover_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies:
-- 1. Allow authenticated users to insert logs they performed.
CREATE POLICY "Allow users to insert their own radio/handover logs"
ON public.radio_handover_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id_performed_log);

-- 2. Allow authenticated users to select all logs.
--    (Can be refined later, e.g., supervisors see all, guards see their own logs)
CREATE POLICY "Allow authenticated users to select all radio/handover logs"
ON public.radio_handover_logs
FOR SELECT
TO authenticated
USING (true);

-- Optional: Policies for UPDATE/DELETE if needed later. Generally, logs are immutable.
-- CREATE POLICY "Allow users to update their own logs"
-- ON public.radio_handover_logs
-- FOR UPDATE
-- TO authenticated
-- USING (auth.uid() = user_id_performed_log);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.radio_handover_logs TO authenticated;

SELECT 'Migration 0007_create_radio_handover_logs.sql executed successfully';
