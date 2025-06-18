-- Create the training_records table
CREATE TABLE public.training_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guard_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    guard_name_recorded TEXT NOT NULL,
    course_name TEXT NOT NULL,
    completed_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    certificate_url TEXT,
    added_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add comments for clarity
COMMENT ON COLUMN public.training_records.id IS 'Unique identifier for the training record';
COMMENT ON COLUMN public.training_records.guard_user_id IS 'UUID of the guard, if they are a system user';
COMMENT ON COLUMN public.training_records.guard_name_recorded IS 'Name of the guard as entered/selected at the time of record creation';
COMMENT ON COLUMN public.training_records.course_name IS 'Name of the training course';
COMMENT ON COLUMN public.training_records.completed_date IS 'Date when the course was completed';
COMMENT ON COLUMN public.training_records.expiry_date IS 'Date when the training/certificate expires';
COMMENT ON COLUMN public.training_records.certificate_url IS 'Optional URL to the certificate document';
COMMENT ON COLUMN public.training_records.added_by_user_id IS 'UUID of the user who added this training record';

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
CREATE TRIGGER set_timestamp_training_records
BEFORE UPDATE ON public.training_records
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

-- Unique constraint: (guard_name_recorded, course_name, expiry_date)
-- This is chosen for flexibility if guard_user_id isn't always set.
-- If guard_user_id becomes mandatory and always reliable, (guard_user_id, course_name, expiry_date) would be better.
ALTER TABLE public.training_records
ADD CONSTRAINT unique_guard_course_expiry UNIQUE (guard_name_recorded, course_name, expiry_date);

-- Indexes
CREATE INDEX idx_tr_guard_user_id ON public.training_records(guard_user_id);
CREATE INDEX idx_tr_expiry_date ON public.training_records(expiry_date);
CREATE INDEX idx_tr_course_name ON public.training_records(course_name);
CREATE INDEX idx_tr_added_by_user_id ON public.training_records(added_by_user_id);
CREATE INDEX idx_tr_guard_name_recorded ON public.training_records(guard_name_recorded);


-- Enable Row Level Security (RLS)
ALTER TABLE public.training_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies:
-- 1. Allow authenticated users to insert records they added.
CREATE POLICY "Allow users to insert training records they added"
ON public.training_records
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = added_by_user_id);

-- 2. Allow authenticated users to select all training records.
--    (Can be refined by site or role later)
CREATE POLICY "Allow authenticated users to select all training records"
ON public.training_records
FOR SELECT
TO authenticated
USING (true);

-- 3. Allow users to update records they added.
CREATE POLICY "Allow users to update training records they added"
ON public.training_records
FOR UPDATE
TO authenticated
USING (auth.uid() = added_by_user_id)
WITH CHECK (auth.uid() = added_by_user_id);

-- 4. Allow users to delete records they added.
CREATE POLICY "Allow users to delete training records they added"
ON public.training_records
FOR DELETE
TO authenticated
USING (auth.uid() = added_by_user_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.training_records TO authenticated;

SELECT 'Migration 0010_create_training_records.sql executed successfully';
