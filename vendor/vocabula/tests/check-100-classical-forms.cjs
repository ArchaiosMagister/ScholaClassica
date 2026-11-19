'use strict';
// 100 checks: five inflected forms each of ten Latin and ten Attic Greek lemmata.
// Unlike a blanket "verified" flag, each result distinguishes matches, missing
// imported data and contradictory imported forms.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=x=>fs.readFileSync(path.join(root,x),'utf8');
const bank=JSON.parse(read('data.js').replace(/^window\.VOCAB\s*=\s*/,'').replace(/;\s*$/,''));
const fixture=JSON.parse(read('tests/fixtures/revision-100-formas-clasicas.json'));
const byId=new Map(bank.map(x=>[x.id,x]));
assert.equal(fixture.schema,1);
assert.equal(fixture.checks.length,100);
assert.equal(fixture.checks.filter(c=>c.language==='lat').length,50);
assert.equal(fixture.checks.filter(c=>c.language==='grc').length,50);
const normLat=s=>String(s||'').toLowerCase().normalize('NFD')
 .replace(/\p{M}/gu,'').replace(/æ/g,'ae').replace(/œ/g,'oe').trim();
const normGreek=s=>String(s||'').toLowerCase().normalize('NFD')
 .replace(/[\u0304\u0306]/g,'').replace(/\u0300/g,'\u0301')
 .normalize('NFC').trim();
const normalize=(lang,s)=>lang==='grc'?normGreek(s):normLat(s);
const cache={};
for(const lang of ['lat','grc']){
 const directory=path.join(root,'data/unimorph-syllabus',lang);
 const rows=[];
 for(const filename of fs.readdirSync(directory).filter(x=>/^part-\d+\.json$/.test(x)).sort()){
  const shard=JSON.parse(fs.readFileSync(path.join(directory,filename),'utf8'));
  for(const row of shard)if(row.length>=3)rows.push(row);
 }
 cache[lang]=rows;
}
const seen=new Set();
const results=[];
for(const c of fixture.checks){
 assert.ok(!seen.has(c.id),'Duplicated check: '+c.id);seen.add(c.id);
 assert.ok(['lat','grc'].includes(c.language),'Language not recognized: '+c.id);
 const word=byId.get(c.teacherEntryId);
 assert.ok(word,'Teacher headword missing: '+c.id);
 assert.equal(word.subject,c.subject,'Wrong course: '+c.id);
 assert.equal(word.form,c.teacherHeadword,'Teacher lemma changed: '+c.id);
 assert.ok(word.originals.length>0,'Missing Word source: '+c.id);
 assert.ok(c.authority?.startsWith('https://'),'No classical paradigm reference: '+c.id);
 const [cas,num]=c.feature.split(';');
 assert.ok(['NOM','GEN','DAT','ACC','VOC','ABL'].includes(cas));
 assert.ok(['SG','PL'].includes(num));
 const records=cache[c.language].filter(r=>{
  if(normalize(c.language,r[0])!==normalize(c.language,c.lemma))return false;
  const tags=r[2].split(';');
  return tags[0]==='N'&&tags.includes(cas)&&tags.includes(num);
 });
 const actual=[...new Set(records.map(r=>normalize(c.language,r[1])))].sort();
 const expected=normalize(c.language,c.expected);
 const found=actual.includes(expected);
 const status=actual.length===0?'absent':actual.length===1&&found?'matched':found?'extra-variants':'contradictory';
 results.push({id:c.id,language:c.language,lemma:c.lemma,feature:c.feature,
  expected:c.expected,status,sourceForms:[...new Set(records.map(r=>r[1]))].sort()});
}
const count=status=>results.filter(x=>x.status===status).length;
const summary={checks:results.length,latin:results.filter(x=>x.language==='lat').length,
 greek:results.filter(x=>x.language==='grc').length,
 matched:count('matched'),absent:count('absent'),
 extraVariants:count('extra-variants'),contradictory:count('contradictory')};
assert.equal(summary.checks,100);
assert.equal(results.filter(x=>x.language==='lat'&&x.status==='matched').length,50,
 'Las 50 formas latinas cotejadas deben mantenerse coincidentes con su paradigma');
if(process.env.REGENERATED_GREEK_DATIVES==='1'){
 const greekDative=results.filter(x=>x.language==='grc'&&x.feature==='DAT;SG');
 assert.equal(greekDative.length,10);
 // El corpus original carece de algunas formas, especialmente en los
 // sustantivos de parentesco; no inventarlas para satisfacer una cuota.
 const matched=greekDative.filter(x=>x.status==='matched');
 assert.ok(matched.length>=8,
  'La recuperación del artículo τῷ/τῇ debe aportar al menos ocho dativos singulares áticos');
 assert.ok(greekDative.every(x=>x.status==='matched'||x.status==='absent'),
  'No se admiten formas contradictorias como correctas en dativo singular');
 console.log('DATIVOS_ATICOS_REGENERADOS '+JSON.stringify({
  matched:matched.length,
  missing:greekDative.filter(x=>x.status==='absent').map(x=>x.lemma)
 }));
}
// Preserve all 100 observations, including missing forms, as downloadable
// machine-readable and human-readable reports from each CI execution.
const reportDir=path.join(root,'reports');
fs.mkdirSync(reportDir,{recursive:true});
const manifest=JSON.parse(read('data/unimorph-syllabus/manifest.json'));
const report={schema:1,referenceDate:fixture.checkedAt,summary,
 sourceCommits:{lat:manifest.languages.lat.source_commit,grc:manifest.languages.grc.source_commit},
 sourceRows:{lat:manifest.languages.lat.retained_rows,grc:manifest.languages.grc.retained_rows},
 results};
fs.writeFileSync(path.join(reportDir,'auditoria-100-formas.json'),JSON.stringify(report,null,2)+'\n');
const md=[
 '# Auditoría de 100 formas flexionadas',
 '',
 'Cotejo de 50 formas latinas y 50 formas áticas con paradigmas clásicos.',
 '',
 '| Estado | Total |',
 '| --- | ---: |',
 ...['matched','absent','extraVariants','contradictory'].map(k=>'| '+k+' | '+summary[k]+' |'),
 '',
 'Una forma ausente **no** está verificada. No se acreditan automáticamente otras flexiones del corpus.',
 '',
 '| N.º | Lengua | Lema | Caso/número | Forma clásica esperada | Resultado | Formas presentes en UniMorph |',
 '| --- | --- | --- | --- | --- | --- | --- |',
 ...results.map((r,i)=>'| '+(i+1)+' | '+r.language+' | '+r.lemma+' | '+r.feature+
 ' | '+r.expected+' | '+r.status+' | '+r.sourceForms.join(', ')+' |'),
 ''
].join('\n');
fs.writeFileSync(path.join(reportDir,'auditoria-100-formas.md'),md);
const bad=results.filter(x=>['extra-variants','contradictory'].includes(x.status));
for(const item of results)console.log(item.id+' '+item.language+' '+item.lemma+' '+item.feature+
 ' expected='+item.expected+' status='+item.status+' index='+JSON.stringify(item.sourceForms));
console.log('AUDITORIA_100_RESUMEN '+JSON.stringify(summary));
if(bad.length){
 console.error('Formas contradictorias en UniMorph: '+JSON.stringify(bad));
 process.exitCode=1;
}
