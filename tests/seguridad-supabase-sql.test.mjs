import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const root=resolve(import.meta.dirname,'..');
const sql=name=>readFileSync(resolve(root,'docs/sql',name),'utf8');
const palabra=sql('seguridad_palabra_dia_2026_11_16.sql');
const vocab=sql('seguridad_vocabulario_2026_11_16.sql');

test('Palabra del día mantiene rankings públicos de solo lectura y RLS de estudiantes',()=>{
  assert.match(palabra,/REVOKE ALL PRIVILEGES ON TABLE public\.public_rankings_bach2 FROM anon, authenticated;/);
  assert.match(palabra,/GRANT SELECT ON TABLE public\.public_rankings_bach2 TO anon, authenticated;/);
  assert.match(palabra,/GRANT SELECT ON TABLE public\.students TO authenticated;/);
  assert.doesNotMatch(palabra,/GRANT (?:ALL|INSERT|UPDATE|DELETE|TRUNCATE)\b/i);
  assert.match(palabra,/Students can read their own row/);
});

test('dos proyectos optan por permisos explícitos para objetos futuros de postgres',()=>{
  for(const content of [palabra,vocab]){
    assert.match(content,/ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public\s+REVOKE ALL PRIVILEGES ON TABLES FROM anon, authenticated;/);
    assert.match(content,/ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public\s+REVOKE ALL PRIVILEGES ON SEQUENCES FROM anon, authenticated;/);
    assert.match(content,/ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public\s+REVOKE EXECUTE ON FUNCTIONS FROM anon, authenticated;/);
    assert.match(content,/ALTER DEFAULT PRIVILEGES FOR ROLE postgres\s+REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;/);
    // No deben introducirse modificaciones de datos ni operaciones destructivas.
    assert.doesNotMatch(content,/\b(?:DELETE FROM|INSERT INTO|UPDATE public\.|DROP TABLE|TRUNCATE TABLE)\b/i);
  }
  assert.doesNotMatch(vocab,/GRANT SELECT ON TABLE public\.vocab_words TO (?:anon|authenticated);/i);
});
