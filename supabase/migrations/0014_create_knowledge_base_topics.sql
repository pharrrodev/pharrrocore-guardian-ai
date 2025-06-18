-- Create the knowledge_base_topics table
CREATE TABLE public.knowledge_base_topics (
    id TEXT PRIMARY KEY, -- Kebab-case IDs, e.g., "site-access", "gate-entry"
    label TEXT NOT NULL,
    response TEXT NOT NULL,
    parent_id TEXT REFERENCES public.knowledge_base_topics(id) ON DELETE CASCADE ON UPDATE CASCADE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add comments for clarity
COMMENT ON COLUMN public.knowledge_base_topics.id IS 'Unique kebab-case identifier for the topic';
COMMENT ON COLUMN public.knowledge_base_topics.label IS 'User-friendly label for the topic/button';
COMMENT ON COLUMN public.knowledge_base_topics.response IS 'The information/instruction associated with this topic';
COMMENT ON COLUMN public.knowledge_base_topics.parent_id IS 'ID of the parent topic, for hierarchical structure';
COMMENT ON COLUMN public.knowledge_base_topics.sort_order IS 'Order of display for topics under the same parent';

-- Create function to update updated_at timestamp (if not already created)
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for knowledge_base_topics updated_at
CREATE TRIGGER set_timestamp_knowledge_base_topics
BEFORE UPDATE ON public.knowledge_base_topics
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

-- Indexes
CREATE INDEX idx_kbt_parent_id ON public.knowledge_base_topics(parent_id);
CREATE INDEX idx_kbt_sort_order ON public.knowledge_base_topics(sort_order);
CREATE INDEX idx_kbt_label ON public.knowledge_base_topics(label); -- If searching by label

-- Enable Row Level Security (RLS)
ALTER TABLE public.knowledge_base_topics ENABLE ROW LEVEL SECURITY;

-- RLS Policies:
-- 1. Allow all authenticated users to read topics.
CREATE POLICY "Allow authenticated users to read knowledge base topics"
ON public.knowledge_base_topics
FOR SELECT
TO authenticated
USING (true);

-- 2. INSERT, UPDATE, DELETE: Restricted.
--    These operations will be handled by an Edge Function using a service_role key.
--    If direct client-side admin/supervisor operations are needed later, specific policies can be added.
--    Example for admin only (requires a way to identify admins, e.g., via a 'profiles' table or custom claims):
--    CREATE POLICY "Allow admins to insert topics" ON public.knowledge_base_topics
--    FOR INSERT TO authenticated WITH CHECK (is_admin_user()); -- is_admin_user() would be a custom security definer function

-- Grant necessary permissions
GRANT SELECT ON TABLE public.knowledge_base_topics TO authenticated;
-- INSERT, UPDATE, DELETE will be managed by the service role via Edge Function, so no explicit grants to `authenticated` for these.

SELECT 'Migration 0014_create_knowledge_base_topics.sql executed successfully';
