-- Create the visitor_logs table
CREATE TABLE public.visitor_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    visitor_name text NOT NULL,
    company text,
    visit_purpose text,
    person_to_visit text,
    arrival_time timestamptz NOT NULL DEFAULT now(),
    departure_time timestamptz,
    photo_url text,
    vehicle_registration text,
    user_id_check_in uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    user_id_check_out uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    site_id uuid,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Add comments to columns
COMMENT ON COLUMN public.visitor_logs.id IS 'Unique identifier for the visitor log entry';
COMMENT ON COLUMN public.visitor_logs.visitor_name IS 'Name of the visitor';
COMMENT ON COLUMN public.visitor_logs.company IS 'Company the visitor represents, if any';
COMMENT ON COLUMN public.visitor_logs.visit_purpose IS 'Purpose of the visit';
COMMENT ON COLUMN public.visitor_logs.person_to_visit IS 'Person or department the visitor is meeting';
COMMENT ON COLUMN public.visitor_logs.arrival_time IS 'Timestamp of visitor arrival';
COMMENT ON COLUMN public.visitor_logs.departure_time IS 'Timestamp of visitor departure (nullable)';
COMMENT ON COLUMN public.visitor_logs.photo_url IS 'URL to the visitor''s photo, if taken';
COMMENT ON COLUMN public.visitor_logs.vehicle_registration IS 'Vehicle registration number, if applicable';
COMMENT ON COLUMN public.visitor_logs.user_id_check_in IS 'Identifier of the user who logged the check-in';
COMMENT ON COLUMN public.visitor_logs.user_id_check_out IS 'Identifier of the user who logged the check-out';
COMMENT ON COLUMN public.visitor_logs.site_id IS 'Identifier for the site this log pertains to (optional)';
COMMENT ON COLUMN public.visitor_logs.created_at IS 'Timestamp of when the record was created';
COMMENT ON COLUMN public.visitor_logs.updated_at IS 'Timestamp of the last update to the record';

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at on row update
CREATE TRIGGER set_timestamp_visitor_logs
BEFORE UPDATE ON public.visitor_logs
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

-- Indexes
CREATE INDEX idx_visitor_logs_arrival_time ON public.visitor_logs(arrival_time DESC);
CREATE INDEX idx_visitor_logs_site_id ON public.visitor_logs(site_id);
CREATE INDEX idx_visitor_logs_visitor_name ON public.visitor_logs(visitor_name);
CREATE INDEX idx_visitor_logs_departure_time ON public.visitor_logs(departure_time); -- For finding open visits

-- Enable Row Level Security (RLS)
ALTER TABLE public.visitor_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies:
-- 1. Allow authenticated users to insert visitor logs (check-in)
CREATE POLICY "Allow authenticated users to insert visitor logs"
ON public.visitor_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id_check_in);

-- 2. Allow authenticated users to select all visitor logs
--    (Refine with site_id checks when site context is implemented)
CREATE POLICY "Allow authenticated users to select all visitor logs"
ON public.visitor_logs
FOR SELECT
TO authenticated
USING (true); -- Or USING (site_id = current_user_site_id_function())

-- 3. Allow authenticated users to update logs for check-out
--    Only allow updating if departure_time is currently NULL.
--    user_id_check_out should be set to the current user.
CREATE POLICY "Allow authenticated users to update for check-out"
ON public.visitor_logs
FOR UPDATE
TO authenticated
USING (departure_time IS NULL) -- Only allow updating rows that haven't been checked out
WITH CHECK (auth.uid() = user_id_check_out AND departure_time IS NOT NULL);

-- Grant permissions (Supabase typically handles this well based on RLS, but explicit grants can be used)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.visitor_logs TO authenticated;

-- Create a storage bucket for visitor photos if it doesn't exist
-- This is an illustrative SQL comment; bucket creation is usually done via Supabase UI or management API.
-- Ensure 'visitor-photos' bucket has appropriate access policies.
-- For example, public read if URLs are directly used, or authenticated read with signed URLs.
-- INSERT policy on storage objects for authenticated users.
-- For RLS on storage: https://supabase.com/docs/guides/storage/security/access-control
-- Example policy for storage bucket 'visitor-photos' (conceptual, adapt in Supabase dashboard):
-- Allow inserts for authenticated users:
-- CREATE POLICY "Authenticated users can insert photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'visitor-photos');
-- Allow public read access (if photos are not sensitive and URLs are directly embedded):
-- CREATE POLICY "Public can read photos" ON storage.objects FOR SELECT USING (bucket_id = 'visitor-photos');
-- Or, for signed URLs (more secure):
-- CREATE POLICY "Users can read their own photos or based on app logic" ON storage.objects FOR SELECT TO authenticated USING (...);


SELECT 'Migration 0002_create_visitor_logs.sql executed successfully';
