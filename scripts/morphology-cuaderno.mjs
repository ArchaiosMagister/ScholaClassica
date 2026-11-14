// Registro de análisis explícitamente pedidos en el Cuaderno de Latín II,
// páginas 18–48 (textos) y 49–54 (ejercicios).
import assert from 'node:assert/strict';
import {latinFold} from './morphology-pau-latin2.mjs';
export const CUADERNO_SOURCE='Cuaderno de Latín II, curso 2026–2027, pp. 18–54';
export const canonicalCuadernoForm=x=>{
  const f=latinFold(x.replace(/[.,;:!?]+$/g,''));
  return f==='comsumpserat'?'consumpserat':f;
};
export function parseCuadernoQuestions(source){
  const list=source.split(/\r?\n/)
    .filter(line=>/^\d+\|(?:texto|nivel-)/.test(line))
    .map(line=>{
      const [pageText,activity,entry='']=line.split('|');
      const page=Number(pageText);
      assert.ok((page>=18&&page<=48&&activity==='texto')||
        (page>=49&&page<=54&&activity.startsWith('nivel-')),
        'Página o actividad de cuaderno inválida: '+line);
      const originalForms=entry?entry.split(';').map(s=>s.trim()):[];
      assert.ok(originalForms.every(Boolean));
      const forms=originalForms.map(canonicalCuadernoForm);
      return {page,activity,originalForms,forms,
        source:'cuaderno-2026-27',sourceType:'actividad de análisis'};
    });
  assert.equal(list.length,41,'Faltan actividades o textos del cuaderno');
  assert.equal(list.filter(x=>x.activity==='texto')
    .reduce((sum,x)=>sum+x.forms.length,0),119,'Faltan subrayados de los textos');
  assert.equal(list.filter(x=>x.activity!=='texto')
    .reduce((sum,x)=>sum+x.forms.length,0),120,'Faltan formas de los niveles α–ζ');
  assert.equal(list.reduce((sum,x)=>sum+x.forms.length,0),239);
  assert.deepEqual(list.find(x=>x.page===20)?.forms,[]);
  assert.equal(list.find(x=>x.page===24)?.forms.length,3);
  assert.ok(new Set(list.flatMap(x=>x.forms)).size>=200);
  return list;
}
export function auditCuaderno(bank,questions){
  const records=bank.records.filter(r=>r.language==='latin2');
  const examined=[...new Set(questions.flatMap(x=>x.forms))];
  const mapping=new Map();
  for(const r of records)for(const entry of r.forms){
    const f=canonicalCuadernoForm(entry.form);
    if(!mapping.has(f))mapping.set(f,[]);
    mapping.get(f).push({id:r.id,kind:r.kind,headword:r.headword||r.paradigm});
  }
  const covered=examined.filter(x=>mapping.has(x));
  const missing=examined.filter(x=>!mapping.has(x));
  return {source:CUADERNO_SOURCE,sourcePageCount:78,questionGroups:questions.length,
    underlinedOccurrences:119,practiceOccurrences:120,
    occurrences:239,distinctForms:examined.length,coveredForms:covered.length,
    missingForms:missing,corrections:[
      {page:22,source:'comsumpserat',normalized:'consumpserat',
        reason:'errata visible en el cuaderno; perfecto de consumo, consumpsi, consumptum'},
      {page:50,source:'ligadura tipográfica perdida en extracción',normalized:'flumina',
        reason:'la palabra impresa en el ejercicio es flumina'}
    ],irregulars:['fero','eo','fio','volo'],
    paradigmVerification:'verificaciones de fuente, flexiones explícitas y paradigmas escolares generados; no implica cotejo individual de cada celda'};
}
