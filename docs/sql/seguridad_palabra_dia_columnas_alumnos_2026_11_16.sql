-- Palabra_del_dia, migración real ejecutada 16/11/2026.
-- Nombre remoto: limit_students_select_columns_hide_access_hash_20261116
-- Corrige el GRANT SELECT demasiado amplio de la migración previa.
-- No modifica datos, funciones, sesiones, políticas RLS ni permisos del servidor.

DO $guard$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relname='students'
      AND c.relkind='r' AND c.relrowsecurity
  ) THEN
    RAISE EXCEPTION 'RLS no activo en public.students';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='students'
      AND policyname='Students can read their own row'
  ) THEN
    RAISE EXCEPTION 'Falta política de pertenencia estudiantil';
  END IF;
END $guard$;

REVOKE SELECT ON TABLE public.students FROM authenticated;
GRANT SELECT (id,course_id,auth_user_id,created_at,display_name,student_group)
  ON TABLE public.students TO authenticated;
