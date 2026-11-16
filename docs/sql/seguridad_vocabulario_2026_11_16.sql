-- Proyecto: Vocabulario_clasico (wpwlguufpkfnzlbyproe).
-- No toca las tablas actuales: RLS + ausencia de GRANT directo continúan.
-- Reduce la exposición por defecto de futuros objetos creados por postgres.
BEGIN;

DO $preflight$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relname='vocab_words'
      AND c.relkind='r' AND c.relrowsecurity
  ) THEN
    RAISE EXCEPTION 'Precondición ausente: vocab_words con RLS';
  END IF;
  IF has_table_privilege('anon','public.vocab_words','SELECT')
    OR has_table_privilege('authenticated','public.vocab_words','SELECT') THEN
    RAISE EXCEPTION 'Precondición inesperada: acceso directo a vocab_words';
  END IF;
END;
$preflight$;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL PRIVILEGES ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL PRIVILEGES ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

COMMIT;
