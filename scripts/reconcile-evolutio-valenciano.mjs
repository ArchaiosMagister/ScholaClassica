// Auditoría reproducible, no publica la matriz de trabajo en dist/.
// Fuente: Evolutio en el SHA fijado en ScholaClassica.
import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve,join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const sub='shared/academic/evolutio-valenciano';
const read=path=>JSON.parse(readFileSync(join(root,path),'utf8'));
const itemKey=w=>String(w).normalize('NFC');

// La revisión fonética es independiente del resultado documentado. No
// habilita práctica sin comprobación DNV y aprobación docente.
export function applyEvolutioValencianoRevision(records,revision,knownRules){
 if(revision?.schema!=='schola-evolutio-va-analysis/v1')throw Error('Revisión fonética inválida.');
 const byLatin=new Map(records.map(w=>[w.latin,w]));
 const audited=new Set(),states=new Set(['analisi_proposada_revisada','criteri_pendent']);
 for(const entry of [...revision.analyses,...revision.pending]){
  if(audited.has(entry.latin))throw Error('Revisión duplicada: '+entry.latin);
  audited.add(entry.latin);
  const record=byLatin.get(entry.latin);
  if(!record||record.valenciano.estadoLexico!=='documentat'
     ||record.valenciano.resultado!==entry.form)
   throw Error('Revisión sin correspondencia léxica documentada: '+entry.latin);
  if(!states.has(entry.status)||entry.playable!==false||entry.teacherApproved!==false
     ||entry.dnvIndividualChecked!==false)
   throw Error('Revisión no aprobada marcada como practicable: '+entry.latin);
  if(entry.status==='criteri_pendent'){
   if(!entry.reason||entry.changes?.length)throw Error('Discrepancia sin fundamento: '+entry.latin);
   record.valenciano.estadoNormas='discrepancia_documentada';
   record.valenciano.notas=[record.valenciano.notas,entry.reason].filter(Boolean).join(' ');
   continue;
  }
  if(!entry.explanation||!Array.isArray(entry.changes))
   throw Error('Análisis incompleto: '+entry.latin);
  const characters=[...record.latin];
  const changes=entry.changes.map((x,i)=>{
   if(!knownRules.has(x.rule))throw Error('Norma no autorizada: '+entry.latin+'/'+x.rule);
   if(x.anchor!==undefined){
    if((x.find!==undefined&&x.find!=='')||x.at<0||x.at>characters.length||x.anchor!==x.at)
     throw Error('Anclaje imposible: '+entry.latin);
    return {id:'va'+(i+1),rule:x.rule,spans:[],anchor:x.anchor,note:x.note};
   }
   const len=[...x.find].length;
   const start=x.at<0?characters.length+x.at:x.at;
   if(start<0||start+len>characters.length||!len
      ||characters.slice(start,start+len).join('')!==x.find)
    throw Error('Segmento no coincide con étimo: '+entry.latin+'/'+x.rule);
   return {id:'va'+(i+1),rule:x.rule,spans:[[start,start+len]],note:x.note};
  });
  if(characters.at(-1)==='m'){
   const i=characters.length-1;
   changes.push({id:'va'+(changes.length+1),rule:'FIX_M',
    spans:[[i,i+1]],note:'Pèrdua fixa de -m final de l’acusatiu, no seleccionable.'});
  }
  record.valenciano.normas=changes;
  record.valenciano.estadoNormas='analisi_editorial_revisada';
  record.valenciano.explicacion=entry.explanation;
  record.valenciano.dnvIndividualChecked=false;
 }
 for(const w of records)if(w.valenciano.estadoLexico==='documentat'&&!audited.has(w.latin))
  throw Error('Etimologia documentada sense revisió individual: '+w.latin);
 return {analisisEditoriales:revision.analyses.length,
  casosConDiscrepancia:revision.pending.length};
}

export function assembleEvolutioValenciano(bank,curation,rules,lockedSha,revision=null){
 if(bank?.version!==1||!Array.isArray(bank.words)||bank.words.length!==522)
  throw new Error('Se esperaba exactamente el banco de 522 fichas de Evolutio.');
 if(curation?.schema!=='schola-evolutio-va-curation/v1')
  throw new Error('La curación valenciana no tiene el esquema aprobado.');
 if(rules?.schema!=='schola-evolutio-valenciano-rules/v1'||rules.selectable.length!==17
    ||rules.fixed.id!=='FIX_M'||rules.fixed.selectable!==false)
  throw new Error('Normas valencianas incompatibles con el repertorio docente.');
 const knownRules=new Set(rules.selectable.map(x=>x.id));
 if(knownRules.size!==17||knownRules.has('ASPIR')||knownRules.has('MIN_MBR')||knownRules.has('CUL'))
  throw new Error('Se han incorporado leyes castellanas no autorizadas.');
 const dict=new Map();
 for(const item of [...curation.documented,...curation.proposals]){
  const key=itemKey(item.latin);
  if(dict.has(key))throw new Error('Dos propuestas para el étimo '+key);
  if(!item.form||typeof item.form!=='string')throw new Error('Resultado vacío: '+key);
  if(item.lexicalStatus==='documentat'){
   if(item.reference?.authority!=='DCVB'
      ||!item.reference.url.startsWith('https://dcvb.iec.cat/results.asp?word=')
      ||item.reference.scope!=='lema_i_etimologia')
    throw new Error('Documentación incompleta: '+key);
  }else if(item.lexicalStatus!=='proposta'||item.reference!==null){
   throw new Error('Propuesta sin distinguir de evidencia: '+key);
  }
  dict.set(key,item);
 }
 const ids=new Set(),lemmas=new Set();
 const records=bank.words.map(w=>{
  if(!w.id||ids.has(w.id))throw new Error('Identificador duplicado en Evolutio.');
  ids.add(w.id);
  const latin=itemKey(w.latin);
  if(lemmas.has(latin))throw new Error('Étimo latino duplicado: '+latin);
  lemmas.add(latin);
  const proposal=dict.get(latin);
  return {
   id:w.id,latin,castellano:w.answers,
   provenance:{bankId:w.id,fromGenerator:Boolean(w.source?.generatorId),
    sourceRow:w.source?.row??null,transmission:w.source?.transmission??null},
   valenciano:{
    resultado:proposal?.form??null,
    estadoLexico:proposal?.lexicalStatus??'pendent',
    normas:null,estadoNormas:'pendent',explicacion:null,dificultad:null,
    aprobadoDocente:false,aptoParaPractica:false,
    evidencia:proposal?.reference?[proposal.reference]:[],
    notas:proposal?.notes??null
   }
  };
 });
 for(const latin of dict.keys())if(!lemmas.has(latin))
  throw new Error('Candidatura sin étimo en banco fijado: '+latin);
 const editorial=revision?applyEvolutioValencianoRevision(records,revision,knownRules)
  :{analisisEditoriales:0,casosConDiscrepancia:0};
 const documented=records.filter(w=>w.valenciano.estadoLexico==='documentat').length;
 const proposed=records.filter(w=>w.valenciano.estadoLexico==='proposta').length;
 const pending=records.length-documented-proposed;
 return {
  schema:'schola-evolutio-va-matrix/v1',date:curation.date,
  origin:{repository:'ArchaiosMagister/EvolucionFonetica',sha:lockedSha,
   path:'data/pilot.json',wordCount:bank.words.length},
  policy:'REGISTRO DOCENTE NO PUBLICABLE: no hay fichas valencianas aptas hasta verificar normas y posición de cada cambio.',
  normCatalog:'shared/academic/evolutio-valenciano/normas.json',
  summary:{total:records.length,lexicoDocumentado:documented,propuestas:proposed,
   sinPropuesta:pending,normasVerificadas:0,aptasParaPractica:0,
   ...(revision?editorial:{})},
  records
 };
}
export function auditEvolutioValenciano(matrix,bank,curation,rules,lockedSha,revision=null){
 const expected=assembleEvolutioValenciano(bank,curation,rules,lockedSha,revision);
 return JSON.stringify(matrix)===JSON.stringify(expected)
  ? []:['Matriz no reproducible: revisar fuente, normas y candidaturas.'];
}
function run(){
 const lock=read('config/sources.lock.json');
 const target=resolve(process.env.EVOLUTIO_SOURCE||join(root,'.sources/evolutio'));
 const sha=execFileSync('git',['-C',target,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
 if(sha!==lock.sources.evolutio.sha)throw new Error('Evolutio no coincide con el SHA fijado.');
 const bank=JSON.parse(readFileSync(join(target,'data/pilot.json'),'utf8'));
 const cur=read(sub+'/conciliacion-curada.json');
 const laws=read(sub+'/normas.json');
 const revision=read(sub+'/revisio-26.json');
 const expected=assembleEvolutioValenciano(bank,cur,laws,sha,revision);
 const targetPath=join(root,sub,'matriz-522.json');
 const serialized=JSON.stringify(expected,null,2)+'\n';
 if(process.argv.includes('--write'))writeFileSync(targetPath,serialized);
 if(process.argv.includes('--check')){
  const actual=readFileSync(targetPath,'utf8');
  if(actual!==serialized)throw new Error('Matriz desactualizada: ejecutar npm run evolutio:val:build');
 }
 console.log('Conciliación valenciana segura (no jugable):',JSON.stringify(expected.summary));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)run();
