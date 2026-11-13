import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync,readdirSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
const root=resolve(import.meta.dirname,'..');
const source=join(root,'.sources/vocabula'),target=join(root,'dist/apps/vocabulario');
const names=['choice.js','config.js','data.js','scope.js','teacher.js'];
const digest=file=>createHash('sha256').update(readFileSync(file)).digest('hex');
test('Vocabula importa vocabulario y servicio docente sin alterar sus recursos',()=>{
  for(const file of names)assert.equal(digest(join(target,file)),digest(join(source,file)),'Se modificó '+file);
  assert.deepEqual(readdirSync(join(target,'icons')).sort(),readdirSync(join(source,'icons')).sort());
  for(const name of readdirSync(join(source,'icons')))assert.equal(digest(join(target,'icons',name)),digest(join(source,'icons',name)));
  const sourceApp=readFileSync(join(source,'app.js'),'utf8');
  const studentApp=readFileSync(join(target,'app.js'),'utf8');
  assert.notEqual(studentApp,sourceApp,'Debe simplificarse solo la copia integrada');
  assert.match(studentApp,/Elige las unidades y los grupos de Griego I/);
  assert.doesNotMatch(studentApp,/Variantes originales|Otras acepciones originales|el resto queda sin unidad acreditada/);
  const config=readFileSync(join(target,'config.js'),'utf8');
  assert.match(config,/\.supabase\.co\/functions\/v1\/vocabulary/);
  assert.ok(!config.includes('service_role'));
});
test('la copia estudiantil adapta la navegación y los textos técnicos sin tocar el original',()=>{
  const from=readFileSync(join(source,'index.html'),'utf8');
  const to=readFileSync(join(target,'index.html'),'utf8');
  const expected=from
    .replace('<option value="dark">Oscuro</option>','<option value="dark">Oscuro</option><option value="oled">OLED</option>')
    .replace('<a class="study-tab" href="gramatica.html">Gramática</a>','<a class="study-tab" href="../gramatica/index.html">Gramática de consulta</a>')
    .replace('<script src="teacher.js?v=20261112" defer></script>','<script src="teacher.js?v=20261112" defer></script><script src="schola-bridge.js" defer></script>')
    .replace('src="theme.js?v=1"','src="theme.js?v=1-oled1"')
    .replace('href="style.css?v=20261109-tabs1"','href="style.css?v=20261109-tabs1-oled1"')
    .replace('Practica el vocabulario original de Latín y Griego por unidades, con tarjetas, test y traducción.','Practica el vocabulario de Latín y Griego por unidades, con tarjetas, test y traducción.')
    .replace('El botón Todas incluye también los bloques sin unidad acreditada, si los hay.','El botón Todas incluye también los grupos sin unidad específica.')
    .replace('En Griego general, 148 entradas tienen correspondencia con las unidades de examen y 184 quedan sin unidad acreditada. Los grupos de unidades se mantienen unidos; no se asignan unidades por traducción o parecido ortográfico.','En Griego general encontrarás palabras organizadas por unidades y otros grupos para repasar.')
    .replace('app.js?v=20261112','app.js?v=20261113-alumnos1');
  assert.notEqual(from,to);
  assert.equal(to,expected);
  const bridge=readFileSync(join(target,'schola-bridge.js'),'utf8');
  assert.match(bridge,/URLSearchParams/);
  assert.match(bridge,/dispatchEvent/);
});
test('no se publica la morfología anterior ni backend o datos internos',()=>{
  for(const file of ['gramatica.html','morfologia.html','gramatica.js','morfologia.js','gramatica-importada.js','backend','data','scripts','tests','docs'])
    assert.equal(existsSync(join(target,file)),false,'Se copió inesperadamente '+file);
  assert.deepEqual(readdirSync(target).sort(),['index.html','app.js','choice.js','config.js','data.js','scope.js','style.css','teacher.js','theme.js','schola-bridge.js','icons'].sort());
});
