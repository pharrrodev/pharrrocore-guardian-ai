-- Alter the break_check_queries table to add missing foreign key fields

ALTER TABLE public.break_check_queries
ADD COLUMN queried_guard_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN shift_id_checked UUID REFERENCES public.shifts(id) ON DELETE SET NULL;

-- Add comments for the new columns
COMMENT ON COLUMN public.break_check_queries.queried_guard_user_id IS 'UUID of the guard whose status was queried, if they are a system user and were identified';
COMMENT ON COLUMN public.break_check_queries.shift_id_checked IS 'UUID of the shift record that was evaluated for this break check, if applicable';

-- Indexes for the new columns
CREATE INDEX idx_bcq_queried_guard_user_id_new ON public.break_check_queries(queried_guard_user_id);
CREATE INDEX idx_bcq_shift_id_checked_new ON public.break_check_queries(shift_id_checked);

-- RLS policies are already in place from migration 0008 and should generally apply.
-- If specific permissions for these new columns were needed, they'd be added here,
-- but existing row-level policies for INSERT/SELECT based on user_id_performing_check
-- will cover rows containing these new nullable columns.

SELECT 'Migration 0013_alter_break_check_queries_add_fk_fields.sql executed successfully';
