
CREATE TABLE public.broadcasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reward_type text NOT NULL CHECK (reward_type IN ('coins','xp')),
  amount integer NOT NULL DEFAULT 0,
  message text NOT NULL DEFAULT '',
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.broadcasts TO authenticated;
GRANT ALL ON public.broadcasts TO service_role;
ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view broadcasts" ON public.broadcasts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can create broadcasts" ON public.broadcasts FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin') AND created_by = auth.uid());

CREATE TABLE public.broadcast_claims (
  user_id uuid NOT NULL,
  broadcast_id uuid NOT NULL REFERENCES public.broadcasts(id) ON DELETE CASCADE,
  claimed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, broadcast_id)
);
GRANT SELECT, INSERT ON public.broadcast_claims TO authenticated;
GRANT ALL ON public.broadcast_claims TO service_role;
ALTER TABLE public.broadcast_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own claims" ON public.broadcast_claims FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own claims" ON public.broadcast_claims FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
