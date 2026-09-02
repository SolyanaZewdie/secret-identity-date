-- profiles ------------------------------------------------------------------
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT 'LELA member',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- couples -------------------------------------------------------------------
CREATE TABLE public.couples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  a_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  b_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE, DELETE ON public.couples TO authenticated;
GRANT ALL ON public.couples TO service_role;
ALTER TABLE public.couples ENABLE ROW LEVEL SECURITY;
CREATE POLICY "couples_select_members" ON public.couples FOR SELECT TO authenticated
  USING (a_id = auth.uid() OR b_id = auth.uid());
CREATE POLICY "couples_update_members" ON public.couples FOR UPDATE TO authenticated
  USING (a_id = auth.uid() OR b_id = auth.uid()) WITH CHECK (a_id = auth.uid() OR b_id = auth.uid());
CREATE POLICY "couples_delete_members" ON public.couples FOR DELETE TO authenticated
  USING (a_id = auth.uid() OR b_id = auth.uid());

CREATE OR REPLACE FUNCTION public.is_couple_member(_couple_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.couples c
    WHERE c.id = _couple_id AND (c.a_id = auth.uid() OR c.b_id = auth.uid())
  );
$$;

-- dates ---------------------------------------------------------------------
CREATE TABLE public.dates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  creator_slot text NOT NULL CHECK (creator_slot IN ('A','B')),
  vibe text NOT NULL,
  intensity text NOT NULL,
  style text NOT NULL,
  scenario jsonb,
  started boolean NOT NULL DEFAULT false,
  ended boolean NOT NULL DEFAULT false,
  archived boolean NOT NULL DEFAULT false,
  joined_a boolean NOT NULL DEFAULT false,
  joined_b boolean NOT NULL DEFAULT false,
  seen_a boolean NOT NULL DEFAULT false,
  seen_b boolean NOT NULL DEFAULT false,
  revealed_a boolean NOT NULL DEFAULT false,
  revealed_b boolean NOT NULL DEFAULT false,
  completed_missions text[] NOT NULL DEFAULT '{}',
  rating int,
  again text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX dates_couple_idx ON public.dates (couple_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dates TO authenticated;
GRANT ALL ON public.dates TO service_role;
ALTER TABLE public.dates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dates_select_couple" ON public.dates FOR SELECT TO authenticated
  USING (public.is_couple_member(couple_id));
CREATE POLICY "dates_insert_couple" ON public.dates FOR INSERT TO authenticated
  WITH CHECK (public.is_couple_member(couple_id));
CREATE POLICY "dates_update_couple" ON public.dates FOR UPDATE TO authenticated
  USING (public.is_couple_member(couple_id)) WITH CHECK (public.is_couple_member(couple_id));
CREATE POLICY "dates_delete_couple" ON public.dates FOR DELETE TO authenticated
  USING (public.is_couple_member(couple_id));

-- date_assignments (private per partner) ------------------------------------
CREATE TABLE public.date_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date_id uuid NOT NULL REFERENCES public.dates(id) ON DELETE CASCADE,
  slot text NOT NULL CHECK (slot IN ('A','B')),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  character_id text NOT NULL,
  missions text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (date_id, slot)
);
GRANT SELECT, INSERT ON public.date_assignments TO authenticated;
GRANT ALL ON public.date_assignments TO service_role;
ALTER TABLE public.date_assignments ENABLE ROW LEVEL SECURITY;

-- Only the owner may read their character. The partner's character becomes
-- readable to the other member of the couple only once the date has ended.
CREATE POLICY "assignments_select_own_or_after_end" ON public.date_assignments FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.dates d
      WHERE d.id = date_assignments.date_id
        AND d.ended = true
        AND public.is_couple_member(d.couple_id)
    )
  );

CREATE POLICY "assignments_insert_couple" ON public.date_assignments FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.dates d
      WHERE d.id = date_assignments.date_id
        AND public.is_couple_member(d.couple_id)
    )
  );

-- helpers -------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.lela_generate_code()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  candidate text;
  i int;
BEGIN
  LOOP
    candidate := '';
    FOR i IN 1..6 LOOP
      candidate := candidate || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.couples WHERE code = candidate);
  END LOOP;
  RETURN candidate;
END;
$$;

CREATE OR REPLACE FUNCTION public.lela_my_couple()
RETURNS TABLE (id uuid, code text, a_id uuid, b_id uuid, created_at timestamptz, partner_name text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.id, c.code, c.a_id, c.b_id, c.created_at,
    (SELECT p.display_name FROM public.profiles p
      WHERE p.id = CASE WHEN c.a_id = auth.uid() THEN c.b_id ELSE c.a_id END)
  FROM public.couples c
  WHERE auth.uid() IS NOT NULL AND (c.a_id = auth.uid() OR c.b_id = auth.uid())
  ORDER BY c.created_at DESC
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.lela_create_invite()
RETURNS TABLE (id uuid, code text, a_id uuid, b_id uuid, created_at timestamptz, partner_name text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  existing public.couples;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not signed in';
  END IF;

  SELECT * INTO existing FROM public.couples c
    WHERE c.a_id = auth.uid() OR c.b_id = auth.uid()
    ORDER BY c.created_at DESC LIMIT 1;

  IF existing.id IS NULL THEN
    INSERT INTO public.couples (code, a_id)
      VALUES (public.lela_generate_code(), auth.uid());
  END IF;

  RETURN QUERY SELECT * FROM public.lela_my_couple();
END;
$$;

CREATE OR REPLACE FUNCTION public.lela_refresh_invite()
RETURNS TABLE (id uuid, code text, a_id uuid, b_id uuid, created_at timestamptz, partner_name text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not signed in';
  END IF;

  DELETE FROM public.couples c
    WHERE (c.a_id = auth.uid() OR c.b_id = auth.uid()) AND c.b_id IS NULL;

  RETURN QUERY SELECT * FROM public.lela_create_invite();
END;
$$;

CREATE OR REPLACE FUNCTION public.lela_lookup_invite(p_code text)
RETURNS TABLE (state text, code text, host_name text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  found public.couples;
BEGIN
  SELECT * INTO found FROM public.couples c WHERE c.code = upper(trim(p_code));

  IF found.id IS NULL THEN
    RETURN QUERY SELECT 'invalid'::text, upper(trim(p_code)), NULL::text;
    RETURN;
  END IF;

  IF auth.uid() IS NOT NULL AND (found.a_id = auth.uid() OR found.b_id = auth.uid()) THEN
    RETURN QUERY SELECT 'mine'::text, found.code,
      (SELECT p.display_name FROM public.profiles p WHERE p.id = found.a_id);
    RETURN;
  END IF;

  IF found.b_id IS NOT NULL THEN
    RETURN QUERY SELECT 'full'::text, found.code, NULL::text;
    RETURN;
  END IF;

  RETURN QUERY SELECT 'open'::text, found.code,
    (SELECT p.display_name FROM public.profiles p WHERE p.id = found.a_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.lela_join_couple(p_code text)
RETURNS TABLE (state text, couple_id uuid)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  found public.couples;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not signed in';
  END IF;

  SELECT * INTO found FROM public.couples c WHERE c.code = upper(trim(p_code));

  IF found.id IS NULL THEN
    RETURN QUERY SELECT 'invalid'::text, NULL::uuid;
    RETURN;
  END IF;

  IF found.a_id = auth.uid() OR found.b_id = auth.uid() THEN
    RETURN QUERY SELECT 'mine'::text, found.id;
    RETURN;
  END IF;

  IF found.b_id IS NOT NULL THEN
    RETURN QUERY SELECT 'full'::text, NULL::uuid;
    RETURN;
  END IF;

  DELETE FROM public.couples c
    WHERE (c.a_id = auth.uid() OR c.b_id = auth.uid()) AND c.b_id IS NULL;

  UPDATE public.couples SET b_id = auth.uid() WHERE id = found.id AND b_id IS NULL;

  RETURN QUERY SELECT 'joined'::text, found.id;
END;
$$;

CREATE OR REPLACE FUNCTION public.lela_leave_couple()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  UPDATE public.couples SET b_id = NULL WHERE b_id = auth.uid();
  DELETE FROM public.couples WHERE a_id = auth.uid();
END;
$$;

REVOKE ALL ON FUNCTION public.lela_generate_code() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_couple_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.lela_my_couple() TO authenticated;
GRANT EXECUTE ON FUNCTION public.lela_create_invite() TO authenticated;
GRANT EXECUTE ON FUNCTION public.lela_refresh_invite() TO authenticated;
GRANT EXECUTE ON FUNCTION public.lela_lookup_invite(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.lela_join_couple(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.lela_leave_couple() TO authenticated;