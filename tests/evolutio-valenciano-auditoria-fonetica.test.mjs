import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,join} from 'node:path';

const root=resolve(import.meta.dirname,'..');
const base='shared/academic/evolutio-valenciano/';
const read=name=>JSON.parse(readFileSync(join(root,base,name),'utf8'));
const audit=read('auditoria-fonetica-221.json');
const matrix=read('matriz-522.json');
const laws=read('normas.json');
const allowed=new Set([...laws.selectable.map(x=>x.id),'FIX_M']);

test('El preinventario fonético corresponde uno a uno a las 221 fichas documentadas',()=>{
 const documented=matrix.records.filter(x=>x.valenciano.estadoLexico==='documentat');
 assert.equal(documented.length,221);
 assert.equal(audit.records.length,221);
 assert.deepEqual(audit.records.map(x=>x.id),documented.map(x=>x.id));
 for(let i=0;i<221;i++){
  const x=audit.records[i],w=documented[i];
  assert.equal(x.latin,w.latin);
  assert.equal(x.resultadoValenciano,w.valenciano.resultado);
  assert.deepEqual(x.evidenciaLexica,w.valenciano.evidencia);
  assert.equal(x.estadoPreexistente,w.valenciano.estadoNormas);
  assert.equal(x.normasVerificadas,false);
  assert.equal(x.comprobacionDNVIndividual,false);
  assert.equal(x.aptoParaPractica,false);
  assert.equal(x.aprobacionDocente,false);
  assert.ok(['preanalisis_estructural_sin_contraste_fonetico_individual','criterio_docente_aprobado_analisis_editorial_sin_verificacion_normativa','analisi_editorial_individual_sense_verificacio_normativa'].includes(x.estadoAuditoria));
  if(['cælum','fĕrrum','ocŭlum'].includes(x.latin)){
    assert.deepEqual(x.leyesPreexistentes.map(n=>n.rule),w.valenciano.normas.map(n=>n.rule));
    assert.equal(x.criterioDocente.approval,'accepted');
  }
  assert.ok(Array.isArray(x.indicadoresParaAuditoria));
  for(const n of x.indicadoresParaAuditoria)assert.equal(n.verified,false);
  for(const n of x.leyesPreexistentes){
    assert.ok(allowed.has(n.rule),x.latin+' / '+n.rule);
    for(const [start,end] of n.spans){
      assert.ok(Number.isInteger(start)&&Number.isInteger(end)&&start>=0&&end>start&&end<=[...x.latin].length,x.latin);
    }
  }
 }
});
test('El registro no certifica fonética ni permite publicar ejercicios',()=>{
 assert.equal(audit.summary.total,221);
 assert.equal(audit.summary.conAnalisisEditorialPrevio,57);
 assert.equal(audit.summary.pendientesDeAnalisisIndividual,164);
 assert.equal(audit.summary.decisionesDocentesAplicadas,3);
 assert.equal(audit.summary.leyesFoneticamenteCertificadas,0);
 assert.equal(audit.summary.habilitadas,0);
 assert.equal(matrix.summary.aptasParaPractica,0);
 assert.equal(matrix.summary.normasVerificadas,0);
});

test('Los 110 procesos parciales conservan intervalos válidos y referencia histórica',()=>{
 const documented=new Set(matrix.records.filter(x=>x.valenciano.estadoLexico==='documentat').map(x=>x.id));
 let total=0,words=0;
 for(const x of audit.records){
  assert.ok(documented.has(x.id));
  const processes=x.procesosContrastados||[];
  if(processes.length)words++;
  for(const p of processes){
   total++;
   assert.ok(allowed.has(p.rule));
   const [start,end]=p.span;
   assert.equal([...x.latin].slice(start,end).join(''),p.originalSegment,x.latin);
   assert.equal(p.verificationLevel,'regla_historica_general_con_etimo_lexico_documentado');
   assert.equal(p.completePhoneticAnalysis,false);
   assert.match(p.evidence.historicalOverview,/enciclopedia\.cat/);
   assert.match(p.evidence.lexicalDCVB,/dcvb\.iec\.cat/);
  }
 }
 assert.equal(total,110);
 assert.equal(words,95);
 assert.equal(audit.summary.analisisIntegralesVerificados,0);
});

test('Veintinueve análisis editoriales añadidos conservan su identidad y no certifican leyes',()=>{
 const entries=['scutum','spartum','spicam','aurum','causam','cannam','cupam','rŏtam','fŏntem','salutem','senatum','calĕntem','hŏrtum','fumum','portum','uentum','pannum','grŏssum','mŏllem','molam','hĕrbam','bŏnam','fossam','serram','sortem','curtum','mustum','muscam','fĕbrem'];
 assert.equal(audit.summary.nuevosAnalisisEditorials,29);
 for(const latin of entries){
  const x=audit.records.find(x=>x.latin===latin);
  const w=matrix.records.find(x=>x.latin===latin);
  assert.ok(x&&w,latin);
  assert.equal(x.estadoAuditoria,'analisi_editorial_individual_sense_verificacio_normativa');
  assert.deepEqual(x.leyesPreexistentes.map(x=>x.rule),w.valenciano.normas.map(x=>x.rule));
  assert.equal(x.normasVerificadas,false);
  assert.equal(x.aprobacionDocente,false);
  assert.equal(x.aptoParaPractica,false);
 }
});
