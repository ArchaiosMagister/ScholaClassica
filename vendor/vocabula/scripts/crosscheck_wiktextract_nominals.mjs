#!/usr/bin/env node
/**
 * Compare explicit nominal cells from Wiktextract with the existing UniMorph
 * indexes. This is a consistency check, NOT independent attestation:
 * Latin UniMorph and Wiktextract both draw on Wiktionary.
 *
 * Run after import_wiktextract_candidates.mjs:
 * node scripts/crosscheck_wiktextract_nominals.mjs grc
 * node scripts/crosscheck_wiktextract_nominals.mjs lat
 *
 * Output is NOT wired into the practice engine.
 */
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const lang=process.argv[2];
if(!['lat','grc'].includes(lang))throw Error('Idioma necesario: lat o grc');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'data/unimorph-syllabus/manifest.json'),'utf8'));
const candidatePath=process.argv[3]?
 path.resolve(root,process.argv[3]):path.join(root,'data/wiktextract-candidates-'+lang+'.json');
if(!candidatePath.startsWith(root+path.sep))throw Error('Archivo de candidatos fuera del repositorio');
const source=JSON.parse(fs.readFileSync(candidatePath,'utf8'));
if(source.lang!==lang||source.status!=='CANDIDATE_ONLY_NOT_VALIDATED'||source.schema!==1)
 throw Error('Entrada de candidatos no validada o incompatible');
const norm=s=>String(s||'').toLowerCase().normalize('NFD')
 .replace(/\u0345/g,'ι').replace(/\p{M}/gu,'').replace(/æ/g,'ae').replace(/œ/g,'oe')
 .replace(/ς/g,'σ').trim();
const cases={nominative:'NOM',genitive:'GEN',dative:'DAT',accusative:'ACC',
 ablative:'ABL',vocative:'VOC'};
const numbers={singular:'SG',plural:'PL'};
const genders={masculine:'MASC',feminine:'FEM',neuter:'NEUT'};
const allowed=new Set([...Object.keys(cases),...Object.keys(numbers),...Object.keys(genders)]);
const sourcePos={noun:'N',adj:'ADJ'};
function wiktextractCell(entry,form){
 const raw=form.raw_tags;
 if(!Array.isArray(raw)||!raw.length||raw.some(t=>!allowed.has(t)))return null;
 const find=values=>Object.keys(values).filter(t=>raw.includes(t));
 const cs=find(cases),ns=find(numbers),gs=find(genders);
 if(cs.length!==1||ns.length!==1)return null;
 if(entry.pos==='adj'&&gs.length!==1)return null;
 if(entry.pos==='noun'&&gs.length>1)return null;
 return [cases[cs[0]],numbers[ns[0]],entry.pos==='adj'?genders[gs[0]]:''].join(':');
}
function rawCells(feature){
 const xs=String(feature||'').split(';');
 if(!['N','ADJ'].includes(xs[0]))return [];
 const c=xs.find(s=>['NOM','GEN','DAT','ACC','ABL','VOC'].includes(s));
 const n=xs.find(s=>['SG','PL'].includes(s));
 if(!c||!n||xs.includes('DU'))return [];
 const gender=xs.find(s=>s==='MASC'||s==='FEM'||s==='NEUT'||s.includes('+'));
 if(xs[0]==='ADJ'&&!gender)return [];
 const sexes=xs[0]==='N'?['']:(gender||'').split('+').filter(s=>['MASC','FEM','NEUT'].includes(s));
 return sexes.map(g=>[c,n,g].join(':'));
}
const index=new Map();
for(let i=0;i<manifest.languages[lang].part_count;i++){
 const name='part-'+String(i).padStart(2,'0')+'.json';
 const file=path.join(root,'data/unimorph-syllabus',lang,name);
 for(const [lemma,surface,tags]of JSON.parse(fs.readFileSync(file,'utf8'))){
  const pos=String(tags).split(';')[0];
  for(const cell of rawCells(tags)){
   const key=[norm(lemma),pos,cell].join('|');
   if(!index.has(key))index.set(key,new Set());
   index.get(key).add(norm(surface));
  }
 }
}
const candidatesByLemma=new Map();
for(const e of source.entries){
 if(!['noun','adj'].includes(e.pos))continue;
 if(!candidatesByLemma.has(e.lemma))candidatesByLemma.set(e.lemma,new Set());
 candidatesByLemma.get(e.lemma).add(e.pos);
}
const summary={schema:1,language:lang,
 source_file:source.source,
 status:'CROSS_INDEX_CONSISTENCY_ONLY_NOT_PUBLISHED',
 warning:'Latin UniMorph and Wiktextract share Wiktionary ancestry. Agreement is NOT independent verification.',
 generated_at:new Date().toISOString(),
 scanned_entries:0,ambiguous_lemmas:0,
 no_matching_unimorph:0,partial_or_ambiguous:0,contradictory:0,
 qualifying_paradigms:0,candidate_new_cells:0,explicit_matching_cells:0,
 candidates:[]
};
for(const entry of source.entries){
 if(!['noun','adj'].includes(entry.pos))continue;
 summary.scanned_entries++;
 const poss=candidatesByLemma.get(entry.lemma);
 if(poss?.size>1){summary.ambiguous_lemmas++;continue}
 const m=new Map(),skipped={unsafe:0,ambiguous:0};
 for(const form of entry.forms){
  const cell=wiktextractCell(entry,form);
  if(!cell){skipped.unsafe++;continue}
  if(!m.has(cell))m.set(cell,new Map());
  const normalized=norm(form.form);
  if(!m.get(cell).has(normalized))m.get(cell).set(normalized,form.form);
 }
 const counts={matching:0,conflicting:0,new:0,with_source:0};
 const novel=[];
 for(const [cell,forms]of m){
  const uni=index.get([entry.lemma,sourcePos[entry.pos],cell].join('|'));
  if(uni?.size){
   counts.with_source++;
   if([...forms.keys()].some(form=>uni.has(form)))counts.matching++;
   else counts.conflicting++;
  }else{
   counts.new++;
   if(forms.size===1){
    novel.push({cell,form:[...forms.values()][0]});
   }else skipped.ambiguous++;
  }
 }
 if(!counts.with_source){summary.no_matching_unimorph++;continue}
 if(counts.conflicting){summary.contradictory++;continue}
 const minCells=entry.pos==='noun'?(lang==='grc'?8:10):18;
 const minMatches=entry.pos==='noun'?4:9;
 if(m.size<minCells||counts.matching<minMatches){
  summary.partial_or_ambiguous++;continue
 }
 summary.qualifying_paradigms++;
 summary.explicit_matching_cells+=counts.matching;
 summary.candidate_new_cells+=novel.length;
 summary.candidates.push({lemma:entry.lemma,pos:entry.pos,entry:entry.entry,
  subjects:entry.subjects,matching_cells:counts.matching,
  total_cells:m.size,new_cells:novel,
  source_page:entry.source_page,
  review_status:'REQUIRES_INDEPENDENT_VALIDATION'});
}
summary.candidates.sort((a,b)=>a.lemma.localeCompare(b.lemma));
const output=path.join(root,'data/wiktextract-crosscheck-'+lang+'.json');
fs.writeFileSync(output,JSON.stringify(summary,null,2)+'\n');
console.log(lang+': '+summary.qualifying_paradigms+' paradigmas nominales compatibles; '+
 summary.explicit_matching_cells+' casillas coincidentes, '+summary.candidate_new_cells+
 ' casillas nuevas propuestas; '+summary.contradictory+' con contradicciones; '+
 summary.no_matching_unimorph+' sin cotejo. NO se publican nuevas respuestas.');
