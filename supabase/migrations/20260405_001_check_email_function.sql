-- Replaces the inefficient listUsers({ perPage: 1000 }) approach
-- with a direct query on auth.users using SECURITY DEFINER.
-- Only callable by service_role (admin client).

CREATE OR REPLACE FUNCTION public.check_email_exists(p_email TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'user_exists', TRUE,
    'email_confirmed', (email_confirmed_at IS NOT NULL)
  ) INTO v_result
  FROM auth.users
  WHERE LOWER(email) = LOWER(p_email)
  LIMIT 1;

  IF v_result IS NULL THEN
    RETURN json_build_object('user_exists', FALSE, 'email_confirmed', FALSE);
  END IF;

  RETURN v_result;
END;
$$;

-- Revoke from public, only service_role (admin) can call this
REVOKE EXECUTE ON FUNCTION public.check_email_exists(TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.check_email_exists(TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.check_email_exists(TEXT) FROM authenticated;
