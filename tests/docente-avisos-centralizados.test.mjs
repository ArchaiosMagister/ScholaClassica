import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const root=resolve(import.meta.dirname,'..');
const inbox=readFileSync(resolve(root,'supabase/functions/schola-inbox/index.ts'),'utf8');
const html=readFileSync(resolve(root,'public/docente/index.html'),'utf8');
const app=readFileSync(resolve(root,'public/docente/app.mjs'),'utf8');

test('la bandeja docente recibe las dos fuentes sin acoplar Palabra del día a ScholaClassica',()=>{
  assert.match(inbox,/from\('vocab_reports'\)/);
  assert.match(inbox,/from\('word_proposals'\)/);
  assert.match(inbox,/source:'vocabula'/);
  assert.match(inbox,/source:'palabra'/);
  assert.match(html,/value="palabra">Palabra del día \(externa\)/);
  assert.match(app,/selected==='all'\|\|item\.source===selected/);
});
test('el servicio central no devuelve identificadores internos ni de alumnado en los avisos',()=>{
  assert.doesNotMatch(inbox,/id:r\.id|id:p\.id/);
  assert.doesNotMatch(inbox,/student_id|student_code|student_email/);
  assert.match(inbox,/authorizeVerifiedTeacher/);
  assert.match(inbox,/getUser\(match\[1\]\)/);
});
