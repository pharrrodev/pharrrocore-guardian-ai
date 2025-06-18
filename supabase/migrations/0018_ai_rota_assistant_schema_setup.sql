-- Migration for AI Rota Assistant Schema Setup

-- 0. Create the trigger function for updated_at (if it doesn't exist or to ensure it's up-to-date)
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
COMMENT ON FUNCTION public.trigger_set_timestamp() IS 'Function to automatically update the updated_at timestamp on row modification.';

-- 1. Create sites table (using IF NOT EXISTS as a safeguard, though typically not needed in a new, sequenced migration)
CREATE TABLE IF NOT EXISTS public.sites (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE public.sites IS 'Stores information about different operational sites.';
COMMENT ON COLUMN public.sites.name IS 'Name of the site, e.g., "Innovatech Park Reading", "City Center Mall"';

-- Trigger for sites updated_at
CREATE TRIGGER set_timestamp_sites
BEFORE UPDATE ON public.sites
FOR EACH ROW
EXECUTE PROCEDURE public.trigger_set_timestamp();

-- RLS for sites
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage sites" ON public.sites
FOR ALL
USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
COMMENT ON POLICY "Admins can manage sites" ON public.sites IS 'Allows users with the admin role to perform any operation on sites.';

CREATE POLICY "Authenticated users can view sites" ON public.sites
FOR SELECT
TO authenticated
USING (true);
COMMENT ON POLICY "Authenticated users can view sites" ON public.sites IS 'Allows any authenticated user to view site information.';

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.sites TO authenticated; -- Permissions align with RLS


-- 2. Enhance public.profiles Table
-- Using IF NOT EXISTS for columns is a PostgreSQL specific feature.
-- Standard SQL would require checking existence manually or separate ALTER TABLE statements.
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS availability_preferences JSONB,
ADD COLUMN IF NOT EXISTS max_hours_per_week INT DEFAULT 48,
ADD COLUMN IF NOT EXISTS skill_certifications TEXT[];

COMMENT ON COLUMN public.profiles.availability_preferences IS 'Guard''s preferred working hours, days, or patterns (JSONB).';
COMMENT ON COLUMN public.profiles.max_hours_per_week IS 'Maximum number of hours the guard prefers or is contracted to work per week.';
COMMENT ON COLUMN public.profiles.skill_certifications IS 'Array of text indicating skills or certifications, e.g., ["first_aid_certified", "cctv_operator_licence", "fire_marshal"].';


-- 3. Create public.time_off_requests Table
CREATE TABLE public.time_off_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, -- profile.id is auth.user.id
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- updated_at TIMESTAMPTZ DEFAULT NOW(), -- Add if status changes should update this
  CONSTRAINT check_end_date_after_start_date CHECK (end_date >= start_date)
);
COMMENT ON TABLE public.time_off_requests IS 'Stores time off requests from guards/users.';
COMMENT ON COLUMN public.time_off_requests.status IS 'Status of the time off request: pending, approved, or declined.';

-- Optional: Trigger for updated_at on time_off_requests if needed
-- CREATE TRIGGER set_timestamp_time_off_requests
-- BEFORE UPDATE ON public.time_off_requests
-- FOR EACH ROW
-- EXECUTE PROCEDURE public.trigger_set_timestamp();

ALTER TABLE public.time_off_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own time off requests"
ON public.time_off_requests FOR ALL
TO authenticated USING (user_id = auth.uid()) -- Applies to SELECT, UPDATE, DELETE
WITH CHECK (user_id = auth.uid()); -- Applies to INSERT, UPDATE
COMMENT ON POLICY "Users can manage their own time off requests" ON public.time_off_requests IS 'Allows users to create, view, update, and delete their own time off requests.';

CREATE POLICY "Admins can manage all time off requests"
ON public.time_off_requests FOR ALL
TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
COMMENT ON POLICY "Admins can manage all time off requests" ON public.time_off_requests IS 'Allows admin users to manage all time off requests (view, approve, decline). Supervisors might need a similar policy.';

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.time_off_requests TO authenticated;


-- 4. Create public.shift_requirements Table
CREATE TABLE public.shift_requirements (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
    -- shift_id UUID REFERENCES public.shifts(id) ON DELETE CASCADE, -- Optional: if requirement is for a specific pre-defined shift template rather than general site needs
    required_skill TEXT NOT NULL,
    required_licence TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE public.shift_requirements IS 'Stores specific skill or licence requirements for shifts at particular sites.';
COMMENT ON COLUMN public.shift_requirements.required_skill IS 'e.g., "first_aid_certified", "cctv_licenced", "fluent_spanish"';
COMMENT ON COLUMN public.shift_requirements.required_licence IS 'e.g., "Door Supervisor", "Security Guard" (maps to SIA licence types)';


-- Trigger for updated_at on shift_requirements
CREATE TRIGGER set_timestamp_shift_requirements
BEFORE UPDATE ON public.shift_requirements
FOR EACH ROW
EXECUTE PROCEDURE public.trigger_set_timestamp();

ALTER TABLE public.shift_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage shift requirements"
ON public.shift_requirements FOR ALL
TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
COMMENT ON POLICY "Admins can manage shift requirements" ON public.shift_requirements IS 'Allows admin users to manage all shift requirements.';

CREATE POLICY "Authenticated users can view shift requirements"
ON public.shift_requirements FOR SELECT
TO authenticated USING (true);
COMMENT ON POLICY "Authenticated users can view shift requirements" ON public.shift_requirements IS 'Allows any authenticated user to view shift requirements.';

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.shift_requirements TO authenticated;


-- Add indexes for foreign keys and commonly queried fields
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role); -- Useful for RLS checks
CREATE INDEX IF NOT EXISTS idx_time_off_user_id ON public.time_off_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_time_off_status ON public.time_off_requests(status);
CREATE INDEX IF NOT EXISTS idx_shift_requirements_site_id ON public.shift_requirements(site_id);
CREATE INDEX IF NOT EXISTS idx_shift_requirements_required_skill ON public.shift_requirements(required_skill);
CREATE INDEX IF NOT EXISTS idx_shift_requirements_required_licence ON public.shift_requirements(required_licence);


SELECT 'Migration 0018_ai_rota_assistant_schema_setup.sql executed successfully';
