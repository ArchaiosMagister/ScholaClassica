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
  assert.equal(x.estadoAuditoria,'preanalisis_estructural_sin_contraste_fonetico_individual');
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
 assert.equal(audit.summary.conAnalisisEditorialPrevio,26);
 assert.equal(audit.summary.pendientesDeAnalisisIndividual,195);
 assert.equal(audit.summary.leyesFoneticamenteCertificadas,0);
 assert.equal(audit.summary.habilitadas,0);
 assert.equal(matrix.summary.aptasParaPractica,0);
 assert.equal(matrix.summary.normasVerificadas,0);
});
