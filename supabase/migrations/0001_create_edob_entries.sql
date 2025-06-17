-- Create the edob_entries table
CREATE TABLE public.edob_entries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp timestamptz NOT NULL DEFAULT now(),
    type text NOT NULL,
    details text NOT NULL,
    route text,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL, -- Allow user to be deleted without losing entry
    site_id uuid, -- Assuming a 'sites' table might exist or be added later.
    created_at timestamptz DEFAULT now()
);

-- Add comments to columns for better understanding
COMMENT ON COLUMN public.edob_entries.id IS 'Unique identifier for the EDOB entry';
COMMENT ON COLUMN public.edob_entries.timestamp IS 'Timestamp of when the event occurred or was logged';
COMMENT ON COLUMN public.edob_entries.type IS 'Type of EDOB entry (e.g., Patrol, Incident, Observation)';
COMMENT ON COLUMN public.edob_entries.details IS 'Detailed description of the entry';
COMMENT ON COLUMN public.edob_entries.route IS 'Specific route taken, if applicable (e.g., for patrols)';
COMMENT ON COLUMN public.edob_entries.user_id IS 'Identifier of the user who created the entry, links to auth.users';
COMMENT ON COLUMN public.edob_entries.site_id IS 'Identifier for the site this entry pertains to (optional)';
COMMENT ON COLUMN public.edob_entries.created_at IS 'Timestamp of when the record was created in the database';

-- Enable Row Level Security (RLS) for the edob_entries table
ALTER TABLE public.edob_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies:
-- 1. Allow authenticated users to insert their own entries.
CREATE POLICY "Allow authenticated users to insert their own entries"
ON public.edob_entries
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 2. Allow authenticated users to select all entries.
--    (This is a common starting point. Refine as needed for roles like 'supervisor' vs 'guard')
CREATE POLICY "Allow authenticated users to select all entries"
ON public.edob_entries
FOR SELECT
TO authenticated
USING (true); -- Or, more restrictively: USING (auth.uid() = user_id) if users should only see their own.

-- 3. Allow users to update their own entries (optional, if updates are allowed)
CREATE POLICY "Allow users to update their own entries"
ON public.edob_entries
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Allow users to delete their own entries (optional, if deletes are allowed)
CREATE POLICY "Allow users to delete their own entries"
ON public.edob_entries
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Grant usage on schema public to anon and authenticated roles (often default but good to ensure)
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant all permissions on the table to supabase_admin (bypass RLS)
-- Supabase admin should already have this, but explicit grant can be useful for clarity or specific setups.
-- GRANT ALL ON TABLE public.edob_entries TO supabase_admin;

-- Grant specific permissions to authenticated role. Supabase handles this based on RLS policies,
-- but being explicit can sometimes be necessary depending on how roles are configured.
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.edob_entries TO authenticated;

-- Note: If you have a service_role key you use for backend operations that should bypass RLS,
-- ensure that role has appropriate permissions or that operations are performed with RLS bypass flags where intended.
-- For client-side operations through Supabase JS client, RLS policies for 'authenticated' or 'anon' roles are key.

-- Create an index on timestamp for faster querying and ordering
CREATE INDEX idx_edob_entries_timestamp ON public.edob_entries(timestamp DESC);

-- Create an index on user_id if you frequently query by user
CREATE INDEX idx_edob_entries_user_id ON public.edob_entries(user_id);

-- Create an index on site_id if you frequently query by site
CREATE INDEX idx_edob_entries_site_id ON public.edob_entries(site_id);

-- Create an index on type if you frequently filter by type
CREATE INDEX idx_edob_entries_type ON public.edob_entries(type);

SELECT 'Migration 0001_create_edob_entries.sql executed successfully';
