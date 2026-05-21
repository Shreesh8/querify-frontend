
-- updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- profiles
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- datasets
CREATE TABLE public.datasets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  source_filename TEXT,
  storage_path TEXT,
  row_count INTEGER DEFAULT 0,
  col_count INTEGER DEFAULT 0,
  schema JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'ready',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.datasets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "datasets_all_own" ON public.datasets FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_datasets_user ON public.datasets(user_id, created_at DESC);
CREATE TRIGGER trg_datasets_updated BEFORE UPDATE ON public.datasets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- dataset_columns
CREATE TABLE public.dataset_columns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dataset_id UUID NOT NULL REFERENCES public.datasets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  dtype TEXT NOT NULL,
  null_pct NUMERIC,
  unique_count INTEGER,
  stats JSONB DEFAULT '{}'::jsonb,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.dataset_columns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dataset_columns_all_own" ON public.dataset_columns FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_dataset_columns_dataset ON public.dataset_columns(dataset_id, position);

-- conversations
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  dataset_id UUID REFERENCES public.datasets(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New conversation',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conversations_all_own" ON public.conversations FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_conversations_user ON public.conversations(user_id, updated_at DESC);
CREATE TRIGGER trg_conversations_updated BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- messages
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user','assistant','system','tool')),
  content TEXT NOT NULL DEFAULT '',
  tool_calls JSONB DEFAULT '[]'::jsonb,
  chart_spec JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "messages_all_own" ON public.messages FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_messages_conversation ON public.messages(conversation_id, created_at);

-- dashboards
CREATE TABLE public.dashboards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  dataset_id UUID REFERENCES public.datasets(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Untitled dashboard',
  layout JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.dashboards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dashboards_all_own" ON public.dashboards FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_dashboards_user ON public.dashboards(user_id, updated_at DESC);
CREATE TRIGGER trg_dashboards_updated BEFORE UPDATE ON public.dashboards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- charts
CREATE TABLE public.charts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dashboard_id UUID NOT NULL REFERENCES public.dashboards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'Chart',
  spec JSONB NOT NULL DEFAULT '{}'::jsonb,
  position JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.charts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "charts_all_own" ON public.charts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_charts_dashboard ON public.charts(dashboard_id);

-- insights
CREATE TABLE public.insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dataset_id UUID NOT NULL REFERENCES public.datasets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  payload JSONB DEFAULT '{}'::jsonb,
  severity TEXT NOT NULL DEFAULT 'info',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "insights_all_own" ON public.insights FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_insights_dataset ON public.insights(dataset_id, created_at DESC);

-- forecasts
CREATE TABLE public.forecasts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dataset_id UUID NOT NULL REFERENCES public.datasets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  target_col TEXT NOT NULL,
  time_col TEXT,
  horizon INTEGER NOT NULL DEFAULT 12,
  method TEXT NOT NULL DEFAULT 'auto',
  result JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.forecasts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "forecasts_all_own" ON public.forecasts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_forecasts_dataset ON public.forecasts(dataset_id, created_at DESC);

-- storage bucket (private)
INSERT INTO storage.buckets (id, name, public) VALUES ('datasets', 'datasets', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "datasets_bucket_read_own" ON storage.objects FOR SELECT
  USING (bucket_id = 'datasets' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "datasets_bucket_insert_own" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'datasets' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "datasets_bucket_update_own" ON storage.objects FOR UPDATE
  USING (bucket_id = 'datasets' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "datasets_bucket_delete_own" ON storage.objects FOR DELETE
  USING (bucket_id = 'datasets' AND auth.uid()::text = (storage.foldername(name))[1]);
