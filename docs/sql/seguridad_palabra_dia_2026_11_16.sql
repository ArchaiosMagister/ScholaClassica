-- Proyecto: Palabra_del_dia (rzjemisvaaqpnvvgfntl).
-- Remediación conservadora de privilegios; no altera filas ni funciones.
-- Aplicación en producción mediante una migración controlada de Supabase.
-- El historial remoto de migraciones es la referencia de ejecución.
-- La migración se ejecuta en transacción por el motor de Supabase.

DO $preflight$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relname='public_rankings_bach2'
      AND c.relkind='r' AND c.relrowsecurity
  ) THEN
    RAISE EXCEPTION 'Precondición ausente: public_rankings_bach2 con RLS';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='public_rankings_bach2'
      AND policyname='Public can read 2 bach rankings' AND cmd='SELECT'
  ) THEN
    RAISE EXCEPTION 'Precondición ausente: lectura pública de clasificación';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='students'
      AND policyname='Students can read their own row' AND cmd='SELECT'
  ) THEN
    RAISE EXCEPTION 'Precondición ausente: política de lectura privada de alumnos';
  END IF;
END;
$preflight$;

-- TRUNCATE no se somete a RLS. Esta caché pública solo necesita SELECT;
-- service_role conserva íntegros sus permisos de mantenimiento.
REVOKE ALL PRIVILEGES ON TABLE public.public_rankings_bach2 FROM anon, authenticated;
GRANT SELECT ON TABLE public.public_rankings_bach2 TO anon, authenticated;

-- Existían las políticas RLS de alumno y profesor, pero faltaba el GRANT
-- subyacente: necesario también para los predicados de votos/propuestas.
GRANT SELECT ON TABLE public.students TO authenticated;

-- Endurecimiento del modelo «secure by default» para objetos futuros
-- creados por postgres. No modifica ningún permiso vigente de otros objetos.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL PRIVILEGES ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL PRIVILEGES ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM anon, authenticated;
-- El EXECUTE a PUBLIC se concede por defecto en PostgreSQL globalmente;
-- revocarlo solamente «IN SCHEMA» no cancela ese permiso implícito.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

