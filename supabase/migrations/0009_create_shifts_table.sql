-- Create the shifts table
CREATE TABLE public.shifts (
    id UUID PRIMARY KEY, -- Client-generated UUID
    guard_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    guard_name TEXT NOT NULL,
    shift_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    "position" TEXT NOT NULL, -- Quoted because position can be a keyword
    shift_type TEXT NOT NULL CHECK (shift_type IN ('Day', 'Night', 'Evening')),
    break_times JSONB,
    site_id UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add comments for clarity
COMMENT ON COLUMN public.shifts.id IS 'Client-generated unique identifier for the shift';
COMMENT ON COLUMN public.shifts.guard_id IS 'UUID of the guard assigned to the shift';
COMMENT ON COLUMN public.shifts.guard_name IS 'Denormalized name of the guard for display purposes';
COMMENT ON COLUMN public.shifts.shift_date IS 'Date of the shift';
COMMENT ON COLUMN public.shifts.start_time IS 'Start time of the shift';
COMMENT ON COLUMN public.shifts.end_time IS 'End time of the shift';
COMMENT ON COLUMN public.shifts."position" IS 'Position or role for the shift';
COMMENT ON COLUMN public.shifts.shift_type IS 'Type of shift (Day, Night, Evening)';
COMMENT ON COLUMN public.shifts.break_times IS 'JSONB array of break objects, e.g., [{start: "HH:mm", end: "HH:mm", type: "paid"}]';
COMMENT ON COLUMN public.shifts.site_id IS 'Identifier for the site (optional)';

-- Create function to update updated_at timestamp
-- (This might already exist from previous migrations; if so, this block can be omitted or made idempotent)
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at on row update
CREATE TRIGGER set_timestamp_shifts
BEFORE UPDATE ON public.shifts
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

-- Unique constraint to prevent exact duplicate shifts for the same guard at the same time
ALTER TABLE public.shifts
ADD CONSTRAINT unique_guard_shift_time UNIQUE (guard_id, shift_date, start_time);

-- Indexes
CREATE INDEX idx_shifts_guard_id ON public.shifts(guard_id);
CREATE INDEX idx_shifts_shift_date ON public.shifts(shift_date DESC);
CREATE INDEX idx_shifts_site_id ON public.shifts(site_id);
CREATE INDEX idx_shifts_guard_id_shift_date ON public.shifts(guard_id, shift_date); -- For querying guard's shifts

-- Enable Row Level Security (RLS)
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;

-- RLS Policies:
-- For this subtask, policies will be simpler. Role-based (e.g., 'supervisor') refinement can be added later.
-- Assumes 'authenticated' users are staff who can manage rotas for now.

-- 1. Allow authenticated users to insert shifts.
CREATE POLICY "Allow authenticated users to insert shifts"
ON public.shifts
FOR INSERT
TO authenticated
WITH CHECK (true); -- Or check against a role if available

-- 2. Allow authenticated users to select all shifts.
--    (Refine later: guards see their own, supervisors see their site/all)
CREATE POLICY "Allow authenticated users to select all shifts"
ON public.shifts
FOR SELECT
TO authenticated
USING (true);

-- 3. Allow authenticated users to update shifts.
CREATE POLICY "Allow authenticated users to update shifts"
ON public.shifts
FOR UPDATE
TO authenticated
USING (true); -- Refine with ownership or role checks

-- 4. Allow authenticated users to delete shifts.
CREATE POLICY "Allow authenticated users to delete shifts"
ON public.shifts
FOR DELETE
TO authenticated
USING (true); -- Refine with ownership or role checks

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.shifts TO authenticated;

SELECT 'Migration 0009_create_shifts_table.sql executed successfully';
