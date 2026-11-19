#!/usr/bin/env node
/* Verify Greek dative singular noun candidates using regular declension
 * rules and genitive/nominative forms attested in UniMorph. No irregulars. */
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const candidate=read('data/wiktextract-crosscheck-grc.json');
if(candidate.status!=='CROSS_INDEX_CONSISTENCY_ONLY_NOT_PUBLISHED')throw Error('Missing nominal cross-check');
const manifest=read('data/unimorph-syllabus/manifest.json').languages.grc;
const norm=s=>String(s||'').toLowerCase().normalize('NFD')
 .replace(/\u0345/g,'ι').replace(/\p{M}/gu,'').replace(/ς/g,'σ').trim();
const inflections=new Map();
for(let i=0;i<manifest.part_count;i++){
 const file='data/unimorph-syllabus/grc/part-'+String(i).padStart(2,'0')+'.json';
 for(const [lemma,surface,tags]of read(file)){
  if(tags!=='N;GEN;SG'&&tags!=='N;NOM;SG')continue;
  const k=norm(lemma);
  if(!inflections.has(k))inflections.set(k,{nom:new Set(),gen:new Set()});
  const item=inflections.get(k);
  if(tags==='N;GEN;SG')item.gen.add(norm(surface));
  if(tags==='N;NOM;SG')item.nom.add(norm(surface));
 }
}
function explain(nom,gen){
 const rules=[];
 for(const g of gen){
  if(g.endsWith('ασ'))rules.push({form:g.slice(0,-2)+'αι',rule:'primera declinación en -ας'});
  if(g.endsWith('ησ'))rules.push({form:g.slice(0,-2)+'ηι',rule:'primera declinación en -ης'});
  if(g.endsWith('ου')&&[...nom].some(n=>n.endsWith('οσ')||n.endsWith('ον')))
   rules.push({form:g.slice(0,-2)+'ωι',rule:'segunda declinación en -ου'});
  if(g.endsWith('οσ')&&![...nom].some(n=>n.endsWith('οσ')||n.endsWith('ον')))
   rules.push({form:g.slice(0,-2)+'ι',rule:'tercera declinación en -ος'});
 }
 return rules;
}
const output={
 schema:1,language:'grc',generated_at:new Date().toISOString(),
 status:'REGULAR_DECLENSION_RULE_CROSSCHECK_NOT_PUBLISHED',
 description:'Greek noun dative singular reconstructed from attested genitive and standard 1st/2nd/3rd declension rules; matched against Wiktextract, accents from source.',
 totals:{checked:0,verified:0,unresolved:0,curatedAlreadyCovered:0},
 verified:[],unresolved:[]
};
for(const item of candidate.candidates){
 if(item.pos!=='noun')continue;
 const cells=item.new_cells.filter(x=>x.cell==='DAT:SG:');
 if(!cells.length)continue;
 output.totals.checked++;
 const attested=inflections.get(item.lemma);
 if(!attested?.nom.size||!attested?.gen.size||cells.length!==1){
  output.totals.unresolved++;
  output.unresolved.push({lemma:item.lemma,reason:'Faltan datos de nominativo/genitivo inequívocos'});
  continue;
 }
 const variants=explain(attested.nom,attested.gen);
 const match=variants.find(x=>x.form===norm(cells[0].form));
 if(!match){
  output.totals.unresolved++;
  output.unresolved.push({lemma:item.lemma,reason:'No encaja en las reglas nominales regulares permitidas'});
  continue;
 }
 output.totals.verified++;
 output.verified.push({lemma:item.lemma,entry:item.entry,subjects:item.subjects,
  form:cells[0].form,case:'dativo',number:'singular',
  source_page:item.source_page,rule:match.rule,
  agreement_cells:item.matching_cells,
  review_status:'REGULAR_RULE_VERIFIED_PENDING_PUBLICATION'});
}
fs.writeFileSync(path.join(root,'data/greek-regular-datives.json'),JSON.stringify(output,null,2)+'\n');
console.log('Griego: '+output.totals.verified+'/'+output.totals.checked+
 ' dativos singulares de sustantivos compatibles con reglas regulares; '+
 output.totals.unresolved+' casos aparte. NO PUBLICADOS.');
