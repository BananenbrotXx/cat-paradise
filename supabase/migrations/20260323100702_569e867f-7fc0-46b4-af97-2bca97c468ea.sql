CREATE TABLE public.cat_skins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  skin_id text NOT NULL,
  purchased_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, skin_id)
);

ALTER TABLE public.cat_skins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own skins" ON public.cat_skins
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own skins" ON public.cat_skins
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Add active_skin column to game_saves
ALTER TABLE public.game_saves ADD COLUMN active_skin text NOT NULL DEFAULT 'default';