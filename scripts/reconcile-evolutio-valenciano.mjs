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
export function assembleEvolutioValenciano(bank,curation,rules,lockedSha){
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
   sinPropuesta:pending,normasVerificadas:0,aptasParaPractica:0},
  records
 };
}
export function auditEvolutioValenciano(matrix,bank,curation,rules,lockedSha){
 const expected=assembleEvolutioValenciano(bank,curation,rules,lockedSha);
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
 const expected=assembleEvolutioValenciano(bank,cur,laws,sha);
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
