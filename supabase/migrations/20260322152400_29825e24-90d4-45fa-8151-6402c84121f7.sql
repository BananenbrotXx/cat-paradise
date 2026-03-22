CREATE TABLE public.game_saves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  hunger real NOT NULL DEFAULT 70,
  happiness real NOT NULL DEFAULT 60,
  energy real NOT NULL DEFAULT 80,
  coins integer NOT NULL DEFAULT 30,
  level integer NOT NULL DEFAULT 1,
  xp integer NOT NULL DEFAULT 0,
  xp_to_next integer NOT NULL DEFAULT 50,
  total_interactions integer NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.game_saves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own save" ON public.game_saves FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own save" ON public.game_saves FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own save" ON public.game_saves FOR UPDATE TO authenticated USING (auth.uid() = user_id);