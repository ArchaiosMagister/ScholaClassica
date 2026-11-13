import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,join} from 'node:path';

const root=resolve(import.meta.dirname,'..');
const read=(path)=>readFileSync(join(root,path),'utf8');
const dist=(path)=>read('dist/'+path);

test('la portada explica las actividades sin mensajes de integración o verificación interna',()=>{
  const html=dist('index.html');
  for(const phrase of ['Solo contenidos disponibles y contrastados',
    'Integración técnica en pruebas','Primera fase académica',
    'sin alterar sus aplicaciones originales','GeneradorExamenes sigue excluido'])
    assert.ok(!html.includes(phrase),'Texto interno en portada: '+phrase);
  assert.match(html,/Practica el reconocimiento, el análisis y la declinación/);
});

test('morfología conserva corrección y contenido curricular, pero no exhibe procedencias',()=>{
  const html=dist('apps/morfologia/index.html');
  const js=dist('apps/morfologia/app.mjs');
  const written=dist('apps/morfologia/written.mjs');
  for(const fragment of ['id="source"','source-secondary','source-tertiary','evidence-links',
    'UniMorph','Banco cerrado de tablas académicas','revisión docente individual pendiente'])
    assert.ok(!html.includes(fragment),'Procedencia visible en morfología: '+fragment);
  assert.ok(!js.includes('showSource(q)'));
  assert.ok(!js.includes("'Las unidades posteriores a '"));
  assert.match(js,/puedes practicar los contenidos de UD1 a UD/);
  assert.match(written,/La forma es correcta/);
  assert.match(html,/primera posición atributiva/);
});

test('Etymologicon conserva información lingüística y DLE, no auditorías o PDF docentes',()=>{
  const practice=dist('apps/etymologicon/practicar.html');
  const study=dist('apps/etymologicon/estudio.html');
  const renderer=dist('apps/etymologicon/estudio.mjs');
  assert.doesNotMatch(practice,/Módulo en pruebas de integración|piloto contrastado|Banco docente auditado/);
  assert.doesNotMatch(study,/auditoría docente|verificación individual ya realizada|DLE contrastado/);
  assert.doesNotMatch(renderer,/Mención en los PDF docentes|Glosa didáctica: pendiente|Resultado del contraste:|No localizado por coincidencia literal/);
  assert.match(renderer,/Consultar en el DLE/);
  assert.match(renderer,/word.editorialNote/);
  assert.match(study,/El significado actual no tiene por qué equivaler/);
});

test('Evolutio y Vocabula presentan las actividades sin revelar el historial del banco',()=>{
  const evolution=dist('apps/evolucion-fonetica/src/app.mjs');
  const evoHtml=dist('apps/evolucion-fonetica/index.html');
  const vocab=dist('apps/vocabulario/app.js');
  const vocabHtml=dist('apps/vocabulario/index.html');
  assert.doesNotMatch(evolution,/Ficha importada de GeneradorExamenes|Fuente: Excel docente|Fuente: GeneradorExamenes|Banco revisado|fichas revisadas|wordSourceNote/);
  assert.doesNotMatch(evoHtml,/facilitadas por el docente|Banco de 522 palabras/);
  assert.match(evolution,/Adaptación culta/);
  assert.match(evolution,/Voz regional o histórica/);
  assert.doesNotMatch(vocab,/Variantes originales|Otras acepciones originales|sin unidad acreditada/);
  assert.doesNotMatch(vocabHtml,/148 entradas tienen correspondencia|184 quedan sin unidad acreditada/);
  assert.match(vocab,/Elige las unidades y los grupos de Griego I/);
  assert.match(vocabHtml,/app\.js\?v=20261113-alumnos1/);
});

test('los originales siguen intactos y conservan su trazabilidad',()=>{
  assert.match(read('.sources/evolutio/src/app.mjs'),/Ficha importada de GeneradorExamenes/);
  assert.match(read('.sources/vocabula/app.js'),/Variantes originales/);
});
