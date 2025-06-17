-- Add the new column for other_action_details to incident_reports table
ALTER TABLE public.incident_reports
ADD COLUMN other_action_details TEXT;

-- Add a comment for the new column
COMMENT ON COLUMN public.incident_reports.other_action_details IS 'Specific details if the action taken was "Other"';

-- RLS policies for incident_reports are already in place from a previous migration.
-- The existing policies should cover this new column as they are generally row-based
-- or apply to all columns for SELECT/INSERT/UPDATE unless specific column privileges are set.
-- No changes to RLS policies are strictly needed for adding a nullable column.

SELECT 'Migration 0005_add_other_action_details_to_incident_reports.sql executed successfully';
