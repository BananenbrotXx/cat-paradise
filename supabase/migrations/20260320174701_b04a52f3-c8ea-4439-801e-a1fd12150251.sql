
-- Allow users to check their own roles (no recursion since we check user_id directly)
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
