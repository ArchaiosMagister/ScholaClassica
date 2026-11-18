// Construcción aislada de un prototipo local de Evolutio valenciano.
// Nunca escribe en dist/, public/ ni en el banco original. No concede aprobación docente.
// Uso: npm run build:preview:evolutio:val (genera un HTML autónomo y offline).
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';

const ROOT=resolve(import.meta.dirname,'..');
const ACADEMIC='shared/academic/evolutio-valenciano';
const SOURCES='preview/evolutio-valenciano';
const DEFAULT_OUT='build/evolutio-valenciano-piloto/index.html';
const SCHOOL_ID_SET=new Set([
  'ge-EVF-0338','xl-354','xl-52','xl-26','xl-587','xl-82','xl-567'
]);
const forbid=new Set(['matrem','cælum','noctem','octo','dictum','sigĭllum']);
const evidenceTypes=new Set(['exemple_individual_del_canvi','regla_general_i_etimologia']);
function ensure(ok,message){if(!ok)throw Error('Piloto valenciano: '+message);}
const uniq=items=>new Set(items).size===items.length;
const readJson=async(root,path)=>JSON.parse(await readFile(join(root,path),'utf8'));
export function createValencianPilotData(matrix,decision,ruleCatalog){
 ensure(matrix?.schema==='schola-evolutio-va-matrix/v1','esquema de matriz no esperado');
 ensure(decision?.schema==='schola-evolutio-va-initial-pilot-decision/v1','decisión de piloto no esperada');
 ensure(ruleCatalog?.schema==='schola-evolutio-valenciano-rules/v1','catálogo normativo no esperado');
 ensure(matrix.records.length===522&&matrix.summary.aptasParaPractica===0,'el banco de 522 debe seguir desactivado');
 ensure(ruleCatalog.selectable.length===17&&ruleCatalog.fixed.id==='FIX_M'
  &&ruleCatalog.fixed.selectable===false,'el repertorio de 17 normas cambió');
 ensure(decision.summary.quizCandidates===7&&decision.summary.teacherApproved===0
  &&decision.summary.playable===0,'la selección de siete no es un alta pública');
 ensure(decision.normativeGate.currentDnvIndividualChecks===0
  &&decision.normativeGate.canEnableInMain===false
  &&decision.normativeGate.publishWithoutTeacherApproval===false,'restricción normativa debilitada');
 const rows=decision.recommendedForPilot;
 ensure(rows.length===7&&uniq(rows.map(w=>w.id))
  &&rows.every(w=>SCHOOL_ID_SET.has(w.id)),'IDs distintos de los siete pactados');
 const bank=new Map(matrix.records.map(w=>[w.id,w]));
 const catalog=new Map(ruleCatalog.selectable.map(rule=>[rule.id,rule]));
 let direct=0,general=0;
 const records=rows.map(entry=>{
  const original=bank.get(entry.id);
  ensure(original&&original.latin===entry.latin&&original.valenciano.resultado===entry.form,
   'no se conserva la identidad del étimo '+entry.id);
  ensure(!forbid.has(entry.latin)&&!entry.playable&&!entry.approvedByTeacher,
   'ficha no autorizada para piloto local '+entry.id);
  ensure(entry.normativeSpelling.avlGnvExampleAttested
   &&!entry.normativeSpelling.currentDnvIndividualEntryChecked
   &&entry.normativeSpelling.sourceType==='gramatica_normativa_2006_no_DNV',
   'atestiguación GNV incompatible '+entry.id);
  ensure(!entry.fullyCertifiedHistoricalChain&&original.valenciano.aptoParaPractica===false
   &&original.valenciano.aprobadoDocente===false,'promoción académica accidental '+entry.id);
  const originalLaws=(original.valenciano.normas??[]).filter(x=>x.rule!=='FIX_M');
  ensure(originalLaws.length===entry.requestedSelectableLaws.length&&originalLaws.length>0,
   'leyes distintas de matriz '+entry.id);
  const changes=entry.requestedSelectableLaws.map((law,i)=>{
   const source=originalLaws[i];
   ensure(catalog.has(law.rule)&&source.rule===law.rule,'ley ajena al catálogo '+entry.id);
   ensure(evidenceTypes.has(law.evidenceDegree),'evidencia sin calificar '+entry.id);
   ensure(!law.teacherApproved&&!law.individuallyHistoricallyCertifiedAsCompleteChain,
    'certificación no documentada '+entry.id);
   ensure(JSON.stringify(source.spans)===JSON.stringify(law.unicodeSpans),
    'segmento no coincide con el análisis de origen '+entry.id);
   ensure(law.unicodeSpans.length===1,'piloto guiado exige una zona por cambio '+entry.id);
   const [start,end]=law.unicodeSpans[0], letters=[...entry.latin];
   ensure(Number.isInteger(start)&&Number.isInteger(end)&&start>=0
    &&end>start&&end<=letters.length,'intervalo Unicode inválido '+entry.id);
   if(law.evidenceDegree==='exemple_individual_del_canvi')direct++;else general++;
   return {id:source.id,rule:law.rule,span:[start,end],fragment:letters.slice(start,end).join('')};
  });
  const fixed=original.valenciano.normas.find(x=>x.rule==='FIX_M');
  const chars=[...entry.latin];
  ensure(fixed&&fixed.spans.length===1&&fixed.spans[0][0]===chars.length-1
   &&fixed.spans[0][1]===chars.length&&chars.at(-1)==='m',
   'pérdida fija -m no conservada '+entry.id);
  return {id:entry.id,latin:entry.latin,answer:entry.form,changes};
 });
 ensure(direct===7&&general===2&&records.reduce((s,w)=>s+w.changes.length,0)===9,
  'cobertura de nueve leyes inesperada');
 const active=new Set(records.flatMap(w=>w.changes.map(c=>c.rule)));
 const rules=ruleCatalog.selectable.filter(x=>active.has(x.id))
  .map(x=>({id:x.id,name:x.name}));
 ensure(rules.length===5,'solo cinco clases de norma pueden aparecer');
 return {
  schema:'schola-evolutio-va-offline-local-pilot/v1',
  locale:'ca-ES-valencia',
  source:'ScholaClassica PR #122, selecció docent de prova de 7 formes',
  limitations:{
   normativeCriterion:'Gramàtica normativa valenciana (AVL 2006) + DCVB/IEC/GEC; no equival a consulta individual del DNV',
   dnvEntriesIndividuallyChecked:0,
   studentReleaseApproved:false,
   historicChainsFullyDocumented:false,
   noAccount:true,
   noPersistentProgress:true,
   noOnlinePublication:true
  },
  rules,words:records
 };
}
function insertOnce(html,marker,value){
 ensure(html.split(marker).length===2,'marcador duplicado o ausente '+marker);
 return html.replace(marker,value);
}
export function renderValencianPilotHtml(template,css,engine,app,data){
 ensure(data.words.length===7&&data.rules.length===5,'datos de prototipo incompletos');
 // Nunca ejecutar datos de fichas como código JS, ni permitir cierre de etiquetas.
 const jsdata=JSON.stringify(data).replace(/</g,'\\u003c').replace(/>/g,'\\u003e')
  .replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
 const safeCode=x=>x.replace(/<\/script/giu,'<\\/script');
 let html=insertOnce(template,'/*__INLINE_CSS__*/',css);
 html=insertOnce(html,'/*__INLINE_DATA__*/',jsdata);
 html=insertOnce(html,'/*__INLINE_ENGINE__*/',safeCode(engine));
 html=insertOnce(html,'/*__INLINE_APP__*/',safeCode(app));
 ensure(!html.includes('/*__INLINE_')&&!html.includes('serviceWorker.register')
  &&!html.includes('localStorage')&&!html.includes('sessionStorage'),
  'el piloto debe ser autosuficiente y no guardar progreso');
 return html;
}
export async function buildValencianPilot(root=ROOT,outputPath=join(root,DEFAULT_OUT)){
 const [matrix,decision,rules,html,css,engine,app]=await Promise.all([
  readJson(root,ACADEMIC+'/matriz-522.json'),
  readJson(root,ACADEMIC+'/decisio-pilot-escolar-7-2026-11-18.json'),
  readJson(root,ACADEMIC+'/normas.json'),
  readFile(join(root,SOURCES+'/index.template.html'),'utf8'),
  readFile(join(root,SOURCES+'/style.css'),'utf8'),
  readFile(join(root,SOURCES+'/engine.js'),'utf8'),
  readFile(join(root,SOURCES+'/app.js'),'utf8')
 ]);
 const data=createValencianPilotData(matrix,decision,rules);
 const file=renderValencianPilotHtml(html,css,engine,app,data);
 const absolute=resolve(outputPath);
 ensure(absolute!==join(root,'dist')&&!absolute.startsWith(join(root,'dist')+'/')
  &&!absolute.startsWith(join(root,'public')+'/'),'prohibido construir bajo Pages');
 await mkdir(resolve(absolute,'..'),{recursive:true});
 await writeFile(absolute,file,'utf8');
 return {path:absolute,bytes:Buffer.byteLength(file),words:data.words.length,rules:data.rules.length};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const result=await buildValencianPilot();
 console.log('Piloto Evolutio VAL aislado (SIN PUBLICAR):',JSON.stringify(result));
}
