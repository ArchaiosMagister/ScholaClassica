#!/usr/bin/env node
/**
 * Third-source cross-check for Latin 1st/2nd-declension adjectives only.
 * Verifies feminine genitive/dative singular proposed by Wiktextract against
 * the independent Collatinus lemma model (doctus/aureus).
 * Candidate-only output; no automatic changes to student answer keys.
 */
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const SHA='e1fef78818b5c5f8e7f9754cf58f50062b30abff';
const BASE='https://raw.githubusercontent.com/biblissima/collatinus/'+SHA+'/bin/data/';
const norm=s=>String(s||'').toLowerCase().normalize('NFD')
 .replace(/\u0345/g,'ι').replace(/\p{M}/gu,'').replace(/æ/g,'ae').replace(/œ/g,'oe').trim();
async function upstream(name){
 const response=await fetch(BASE+name,{headers:{'User-Agent':'classics-morphological-audit/1.0'},signal:AbortSignal.timeout(180000)});
 if(!response.ok)throw Error('Collatinus '+name+' returned '+response.status);
 return response.text();
}
const [lexicon,models]=await Promise.all([upstream('lemmes.la'),upstream('modeles.la')]);
const doctus=models.slice(models.indexOf('modele:doctus'),models.indexOf('\nmodele:',models.indexOf('modele:doctus')+1));
const aureus=models.slice(models.indexOf('modele:aureus'),models.indexOf('\nmodele:',models.indexOf('modele:aureus')+1));
if(!doctus.includes('R:0:2,0')||!doctus.includes('des:13-48:0:$lupus;$uita;$templum')||
 !aureus.includes('pere:doctus'))throw Error('Collatinus models changed; requires independent review');
const modelByLemma=new Map();
for(const line of lexicon.split(/\r?\n/)){
 if(!line||line.startsWith('!'))continue;
 const fields=line.split('|');if(fields.length<2)continue;
 const raw=fields[0].split('=')[0].replace(/\d+$/u,'');
 const lemma=norm(raw),model=fields[1];
 if(!modelByLemma.has(lemma))modelByLemma.set(lemma,new Set());
 modelByLemma.get(lemma).add(model);
}
const source=JSON.parse(fs.readFileSync(path.join(root,'data/wiktextract-crosscheck-lat.json'),'utf8'));
if(source.status!=='CROSS_INDEX_CONSISTENCY_ONLY_NOT_PUBLISHED')throw Error('Cross-check input not ready');
const counts={checked:0,verified:0,notRegularAdjective:0,modelNotFound:0,disagree:0};
const verified=[];
for(const entry of source.candidates){
 if(entry.pos!=='adj'||!entry.new_cells.length)continue;
 counts.checked++;
 const fields=String(entry.entry).split(',').map(x=>norm(x).replace(/^[–—−-]/u,''));
 const [head,fem,neut]=fields;
 // A teacher entry with only -i, or a personal name, is NOT a three-ending adjective.
 if(fields.length<3||!head.endsWith('us')||fem!=='a'||neut!=='um'){
  counts.notRegularAdjective++;continue;
 }
 const modelsForLemma=modelByLemma.get(entry.lemma);
 const usedModel=['doctus','aureus'].find(model=>modelsForLemma?.has(model));
 if(!usedModel){counts.modelNotFound++;continue}
 const proposed=new Map(entry.new_cells.map(x=>[x.cell,norm(x.form)]));
 const expected=head.slice(0,-2)+'ae';
 if(proposed.size!==2||proposed.get('GEN:SG:FEM')!==expected||
    proposed.get('DAT:SG:FEM')!==expected){
  counts.disagree++;continue;
 }
 counts.verified++;
 verified.push({lemma:entry.lemma,entry:entry.entry,subjects:entry.subjects,
  cells:entry.new_cells,model:usedModel,source_page:entry.source_page,
  expected_without_quantities:expected,
  review_status:'MODEL_VERIFIED_PENDING_PUBLICATION'});
}
const result={
 schema:1,generated_at:new Date().toISOString(),language:'lat',
 status:'INDEPENDENT_MODEL_CROSSCHECK_NOT_PUBLISHED',
 sources:{collatinus_commit:SHA,collatinus_license:'GPL-3.0',wiktextract_license:'CC BY-SA 4.0'},
 description:'Only regular -us,-a,-um adjectives with independent Collatinus doctus/aureus model agreement, not verbs or irregular adjectives.',
 counts,verified
};
fs.writeFileSync(path.join(root,'data/collatinus-verified-adjectives.json'),JSON.stringify(result,null,2)+'\n');
console.log('Collatinus: '+counts.verified+'/'+counts.checked+' adjetivos candidatos superan modelo independiente; '
 +counts.notRegularAdjective+' no son adjetivos con tres terminaciones, '
 +counts.modelNotFound+' sin modelo comparable, '+counts.disagree+' discrepancias. NO PUBLICADOS.');
