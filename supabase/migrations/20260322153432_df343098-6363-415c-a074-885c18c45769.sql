-- Daily streaks table
CREATE TABLE public.daily_streaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  current_streak integer NOT NULL DEFAULT 0,
  last_claim_date date,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.daily_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own streak" ON public.daily_streaks FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own streak" ON public.daily_streaks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own streak" ON public.daily_streaks FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Add last_online to game_saves for offline earnings
ALTER TABLE public.game_saves ADD COLUMN IF NOT EXISTS last_online timestamp with time zone NOT NULL DEFAULT now();
