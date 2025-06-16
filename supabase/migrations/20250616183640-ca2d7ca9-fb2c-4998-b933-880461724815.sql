
-- Create user profiles table for guard authentication
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  guard_id TEXT,
  guard_name TEXT NOT NULL,
  role TEXT DEFAULT 'guard' CHECK (role IN ('guard', 'supervisor', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Create EDOB entries table
CREATE TABLE public.edob_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  entry_type TEXT NOT NULL CHECK (entry_type IN ('Patrol', 'Incident / Observation', 'Access Control', 'Alarm Activation')),
  details TEXT,
  patrol_route TEXT,
  access_type TEXT,
  person_name TEXT,
  company TEXT,
  alarm_zone TEXT,
  alarm_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create incident reports table
CREATE TABLE public.incident_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  location TEXT NOT NULL,
  incident_type TEXT NOT NULL,
  description TEXT NOT NULL,
  people_involved JSONB,
  actions_taken TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create visitor logs table
CREATE TABLE public.visitor_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  visitor_name TEXT NOT NULL,
  company TEXT NOT NULL,
  purpose TEXT NOT NULL,
  host_contact TEXT NOT NULL,
  arrival_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  departure_time TIMESTAMP WITH TIME ZONE,
  badge_number TEXT,
  vehicle_reg TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create shift logs table
CREATE TABLE public.shift_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  guard_id TEXT NOT NULL,
  guard_name TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('Shift Start', 'Shift End')),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edob_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitor_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Create RLS policies for edob_entries
CREATE POLICY "Users can view all edob entries" ON public.edob_entries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own edob entries" ON public.edob_entries FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own edob entries" ON public.edob_entries FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Create RLS policies for incident_reports
CREATE POLICY "Users can view all incident reports" ON public.incident_reports FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own incident reports" ON public.incident_reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own incident reports" ON public.incident_reports FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Create RLS policies for visitor_logs
CREATE POLICY "Users can view all visitor logs" ON public.visitor_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own visitor logs" ON public.visitor_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own visitor logs" ON public.visitor_logs FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Create RLS policies for shift_logs
CREATE POLICY "Users can view all shift logs" ON public.shift_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own shift logs" ON public.shift_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, guard_name, guard_id)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    'GUARD_' || SUBSTRING(NEW.id::text, 1, 8)
  );
  RETURN NEW;
END;
$$;

-- Create trigger to automatically create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
