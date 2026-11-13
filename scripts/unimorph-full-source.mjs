// Lee exclusivamente lemas del banco docente de los repositorios oficiales
// UniMorph fijados por SHA. Los corpus originales NO entran en dist ni en
// el control de versiones de ScholaClassica.
import assert from 'node:assert/strict';
import {createReadStream} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createInterface} from 'node:readline';
import {join,resolve} from 'node:path';
const norm=s=>String(s||'').toLocaleLowerCase('el').normalize('NFD')
 .replace(/\p{M}/gu,'').replace(/ς/g,'σ')
 .replace(/æ/g,'ae').replace(/œ/g,'oe').replace(/j/g,'i').trim();
const allowed=new Set(['NOM','VOC','ACC','GEN','DAT','ABL']);
const numbers=new Set(['SG','PL']);
const parseList=s=>{
 const m=String(s).match(/^window\.VOCAB=(\[[\s\S]*\]);?\s*$/);
 assert.ok(m,'Falta banco Vocabula original');
 return JSON.parse(m[1]);
};
const shaOf=dir=>execFileSync('git',['-C',dir,'rev-parse','HEAD'],
  {encoding:'utf8'}).trim();
export async function readFullUnimorphNouns({vocabulaData,lock,root}){
 const source={griego:resolve(process.env.UNIMORPH_GRC_SOURCE||
     join(root,'.sources/unimorph-grc')),
   latin:resolve(process.env.UNIMORPH_LAT_SOURCE||
     join(root,'.sources/unimorph-lat'))};
 const revision={griego:lock.sources.unimorphGrc?.sha,
   latin:lock.sources.unimorphLat?.sha};
 for(const language of ['griego','latin']){
   assert.match(revision[language],/^[a-f0-9]{40}$/,language+' sin SHA');
   assert.equal(shaOf(source[language]),revision[language],
     language+': el corpus externo no coincide con el SHA fijado');
 }
 const items=parseList(vocabulaData);
 const wanted={griego:new Set(items.filter(x=>x.subject==='gr1')
     .map(x=>norm(String(x.form||'').split(',')[0]))),
   latin:new Set(items.filter(x=>['lat1','lat4'].includes(x.subject))
     .map(x=>norm(String(x.form||'').split(',')[0])))};
 const subsets={},audit={};
 for(const language of ['griego','latin']){
   const filename=language==='griego'?'grc':'lat';
   const file=join(source[language],filename);
   const rows=[],patterns=new Map();
   const counts={rows:0,nominal:0,matched:0,validTags:0,
     distinctMatchedLemmas:0};
   const matched=new Set();
   const reader=createInterface({input:createReadStream(file,{encoding:'utf8'}),
     crlfDelay:Infinity});
   for await(const line of reader){
     counts.rows++;
     const parts=line.split('\t');
     if(parts.length<3)continue;
     const lemma=parts[0],form=parts[1],tag=parts[2];
     if(!/^(?:N|PROPN);/.test(tag))continue;
     counts.nominal++;
     const signature=tag.split(';').slice(0,4).join(';');
     patterns.set(signature,(patterns.get(signature)||0)+1);
     if(!wanted[language].has(norm(lemma)))continue;
     counts.matched++;matched.add(norm(lemma));
     const bits=tag.split(';');
     const kind=bits.shift();
     const cas=bits.find(x=>allowed.has(x));
     const number=bits.find(x=>numbers.has(x));
     if(!cas||!number||bits.filter(x=>allowed.has(x)).length!==1||
       bits.filter(x=>numbers.has(x)).length!==1)continue;
     // Solo una etiqueta nominal: las formas dialectales u otros rasgos
     // adicionales requieren revisión, no se mezclan silenciosamente.
     if(bits.some(x=>!allowed.has(x)&&!numbers.has(x)))continue;
     const normalizedTag='N;'+cas+';'+number;
     if(!/^[^\s]+$/u.test(form)||form.length>80)continue;
     counts.validTags++;
     rows.push([lemma,form,normalizedTag]);
   }
   counts.distinctMatchedLemmas=matched.size;
   audit[language]={...counts,sourceSha:revision[language],
     mostFrequentTagPatterns:[...patterns].sort((a,b)=>b[1]-a[1])
       .slice(0,12).map(([name,count])=>({name,count})),
     license:'CC BY-SA 3.0'};
   subsets[language]=rows;
 }
 return {greekRows:subsets.griego,latinRows:subsets.latin,audit};
}
