-- Revoke EXECUTE on activate_plan from PUBLIC to prevent unauthorized users
-- from escalating their own privileges via PostgREST.
REVOKE EXECUTE ON FUNCTION public.activate_plan(UUID, TEXT, INTEGER) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.activate_plan(UUID, TEXT, INTEGER) FROM anon;
REVOKE EXECUTE ON FUNCTION public.activate_plan(UUID, TEXT, INTEGER) FROM authenticated;
