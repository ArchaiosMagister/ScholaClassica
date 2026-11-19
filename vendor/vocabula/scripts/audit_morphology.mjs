#!/usr/bin/env node
/* Audit ACTUAL answerable forms. Presence of exercises is not a complete paradigm. */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
const root=path.resolve(import.meta.dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const context={window:{},console,fetch:async url=>{
 const file=path.resolve(root,String(url));
 if(!file.startsWith(root+path.sep))throw Error('Ruta de datos insegura: '+url);
 try{return {ok:true,json:async()=>JSON.parse(fs.readFileSync(file,'utf8'))}}
 catch{return {ok:false,status:404}}
}};
vm.createContext(context);
for(const name of ['data.js','gramatica-enunciados.js','gramatica-paradigmas.js',
 'gramatica-latin-imperfectos.js','gramatica-griego-ampliacion.js','gramatica-importada.js'])
 vm.runInContext(read(name),context,{filename:name,timeout:20000});
const {VOCAB,GRAMMAR_PARADIGMS,GrammarImported}=context.window;
const manifest=JSON.parse(read('data/unimorph-syllabus/manifest.json'));
const norm=s=>GrammarImported.norm(s);
const key=form=>{
 const first=String(form||'').split(/[,+(]/)[0].trim().split('/')[0].trim();
 return first&&!/\s/u.test(first)?norm(first):null;
};
function estimateType(form,subject){
 const raw=String(form||''),word=key(raw)||'';
 if(/\((?:adv\.?|conj\.?|prep\.?|interj\.?|indecl\.?|part\.?)\)/i.test(raw))return 'invariable';
 if(subject==='gr1'){
  if(/(?:ω|ομαι|μαι)$/u.test(word)||word==='ειμι')return 'verbal';
  return raw.includes(',')?'nominal-probable':'por-clasificar';
 }
 if(/\((?:1ª|2ª|3ª|4ª|mx\.?|irr\.?|dep\.?)\)/i.test(raw)||/^(?:sum|possum|eo|fero|volo|nolo|malo),/i.test(raw))return 'verbal';
 return raw.includes(',')?'nominal-probable':'por-clasificar';
}
const report={
 schema:1,generated_at:new Date().toISOString(),
 definition:'Presencia de al menos un ejercicio escrito autocorregible; NO supone paradigma completo.',
 source_revisions:{lat:manifest.languages.lat.source_commit,grc:manifest.languages.grc.source_commit},
 subjects:{}
};
for(const subject of ['lat1','lat4','gr1']){
 const vocab=new Map();
 for(const entry of VOCAB){
  if(entry.subject!==subject)continue;
  const lemma=key(entry.form);if(!lemma)continue;
  if(!vocab.has(lemma))vocab.set(lemma,{
   lemma,entry:entry.form,units:new Set(),sources:new Set(),category:estimateType(entry.form,subject),writeQuestions:0
  });
  for(const u of entry.units||[])vocab.get(lemma).units.add(u);
 }
 const imported=await GrammarImported.load(subject);
 const importerLemmas=new Set(),curatedLemmas=new Set();
 for(const q of imported.items){
  if(q.mode!=='write'||!q.accepted?.length)continue;
  const lemma=key(q.lemma),v=lemma&&vocab.get(lemma);
  if(!v)continue;
  v.sources.add('UniMorph');v.writeQuestions++;
  if(q.category==='Morfología verbal')v.category='verbal';
  if(q.category==='Morfología nominal')v.category='nominal';
  importerLemmas.add(lemma);
 }
 for(const p of GRAMMAR_PARADIGMS){
  if(!p.units?.[subject])continue;
  const lemma=key(p.lemma),v=lemma&&vocab.get(lemma);
  if(!v)continue;
  const count=Object.values(p.forms||{}).filter(Boolean).length;
  if(!count)continue;
  v.sources.add('docente');v.writeQuestions+=count;
  v.category=(p.kind==='verbal'||['gr-participio','gr-lyo-part','lat-amans'].includes(p.id))?'verbal':'nominal';
  curatedLemmas.add(lemma);
 }
 const rows=[...vocab.values()].map(v=>({
  lemma:v.lemma,entry:v.entry,units:[...v.units].sort(),
  type:v.category,sources:[...v.sources].sort(),
  writeQuestions:v.writeQuestions,
  status:v.writeQuestions?'con-ejercicios':'sin-ejercicios'
 })).sort((a,b)=>a.lemma.localeCompare(b.lemma,'es'));
 const types={};
 for(const kind of ['nominal','verbal','nominal-probable','invariable','por-clasificar']){
  const matches=rows.filter(r=>r.type===kind);
  types[kind]={lemmas:matches.length,withExercises:matches.filter(r=>r.writeQuestions).length};
 }
 const withExercises=rows.filter(r=>r.writeQuestions).length;
 report.subjects[subject]={
  entries:VOCAB.filter(v=>v.subject===subject).length,
  lemmas:rows.length,withExercises,withoutExercises:rows.length-withExercises,
  importedLemmas:importerLemmas.size,curatedLemmas:curatedLemmas.size,
  importedRows:imported.rows,importedQuestions:imported.items.length,
  types,uncovered:rows.filter(r=>!r.writeQuestions).map(({lemma,entry,units,type})=>({lemma,entry,units,type})),
  coveredSamples:rows.filter(r=>r.writeQuestions).slice(0,12)
 };
}
fs.mkdirSync(path.join(root,'data'),{recursive:true});
fs.writeFileSync(path.join(root,'data/morphology-coverage.json'),JSON.stringify(report,null,2)+'\n');
const names={lat1:'Latín I',lat4:'Latín 4.º ESO',gr1:'Griego I'};
const lines=[
 '# Cobertura morfológica del vocabulario docente','',
 'Generada automáticamente desde las flexiones importadas y los paradigmas docentes.',
 '**Con ejercicios** significa que se pueden corregir algunas formas, NO que el paradigma esté completo.','',
 '| Curso | Lemas | Con ejercicios | Sin ejercicios | UniMorph | Paradigmas docentes |',
 '|---|---:|---:|---:|---:|---:|'
];
for(const [subject,r]of Object.entries(report.subjects)){
 lines.push('| '+names[subject]+' | '+r.lemmas+' | '+r.withExercises+' | '+r.withoutExercises+' | '+r.importedLemmas+' | '+r.curatedLemmas+' |');
}
lines.push('','Los bancos pueden solaparse. El JSON incluye todos los lemas sin ejercicios y su clasificación aproximada.',
 'Las palabras invariables no necesitan paradigma y las categorías estimadas precisan revisión filológica.','');
for(const [subject,r]of Object.entries(report.subjects)){
 lines.push('## '+names[subject],'','| Tipo estimado | Lemas | Con ejercicios |','|---|---:|---:|');
 for(const [type,value]of Object.entries(r.types))lines.push('| '+type+' | '+value.lemmas+' | '+value.withExercises+' |');
 lines.push('','Ejemplos prioritarios sin ejercicios:','');
 for(const v of r.uncovered.filter(x=>x.type==='verbal'||x.type==='nominal-probable').slice(0,25))
  lines.push('- '+v.entry+' · '+v.type+' · '+v.units.join(', '));
 lines.push('');
}
fs.writeFileSync(path.join(root,'data/morphology-coverage.md'),lines.join('\n')+'\n');
for(const [subject,r]of Object.entries(report.subjects))
 console.log(subject+': '+r.withExercises+'/'+r.lemmas+' lemas con ejercicios; '+r.withoutExercises+' sin; '+r.importedLemmas+' importados y '+r.curatedLemmas+' docentes.');
