import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {latinKey,parseUniMorphRow,parseExternalEvidenceRow,
  expectedFeatures,compareWithMorphology,makeTargets,
  createMatcher,finalizeAudit,UNIMORPH_LATIN_REVISION}
  from '../scripts/lexicografia-latin2.mjs';
import {runLexicographyAudit} from '../scripts/audit-latin2-lexicography.mjs';
const root=resolve(import.meta.dirname,'..');
const bank={coverage:{latin2:[0]},records:[
  {id:'v-amo',language:'latin2',unit:0,kind:'verbo',
    headword:'amo, amare, amavi, amatum',forms:[
      {form:'amō',analysis:'verbo · amo, amare, amavi, amatum · 1.ª persona · singular · presente · indicativo · voz activa',
        person:'1.ª singular',number:'singular',tense:'presente',mood:'indicativo',voice:'activa'},
      {form:'amās',analysis:'verbo · amo, amare, amavi, amatum · 2.ª persona · singular · presente · indicativo · voz activa',
        person:'2.ª singular',number:'singular',tense:'presente',mood:'indicativo',voice:'activa'},
      {form:'amātus est',analysis:'verbo · amo, amare, amavi, amatum · 3.ª persona · singular · perfecto · indicativo · voz pasiva',
        tense:'perfecto',mood:'indicativo',voice:'pasiva'},
      {form:'amō',analysis:'verbo · amo, amare, amavi, amatum · 1.ª persona · singular · futuro · indicativo · voz activa',
        person:'1.ª singular',number:'singular',tense:'futuro',mood:'indicativo',voice:'activa'}
    ]},
  {id:'n-civis',language:'latin2',unit:0,kind:'sustantivo',
    headword:'cīvis, cīvis',forms:[
      {form:'cīvium',case:'genitivo',number:'plural',gender:'masculino',
        analysis:'sustantivo · cīvis, cīvis · genitivo · masculino · plural · 3.ª declinación'},
      {form:'cīvis',case:'nominativo',number:'singular',gender:'masculino',
        analysis:'sustantivo · cīvis, cīvis · nominativo · masculino · singular · 3.ª declinación'}
    ]},
  {id:'dep-patior',language:'latin2',unit:0,kind:'verbo',
    headword:'patior, pati, passus sum',forms:[
      {form:'patere',mood:'imperativo',tense:'presente',voice:'pasiva (deponente, sentido activo)',
        person:'2.ª singular',number:'singular',
        analysis:'verbo · patior, pati, passus sum · 2.ª persona · singular · presente · imperativo · voz pasiva (deponente, sentido activo)'}
    ]}
]};
test('Normalización: conservar u/v e i/j, normalizar macrones y ligaduras',()=>{
  assert.equal(latinKey(' CĪVĪS '),'civis');
  assert.equal(latinKey('prœlium'),'proelium');
  assert.equal(latinKey('puellæ'),'puellae');
  assert.notEqual(latinKey('ueni'),latinKey('veni'));
  assert.notEqual(latinKey('iam'),latinKey('jam'));
});
test('Parser UniMorph estricto y exportación independiente comprobada',()=>{
  assert.deepEqual(parseUniMorphRow('cīvis\tcīvium\tN;GEN;PL'),{
    lemma:'cīvis',form:'cīvium',features:['N','GEN','PL'],
    rawFeatures:'N;GEN;PL'});
  assert.equal(parseUniMorphRow('incompleta'),null);
  assert.deepEqual(parseUniMorphRow('amō\tamō\tV;IND;X-UNKNOWN;1;SG').features,
    ['V','IND','X-UNKNOWN','1','SG']);
  assert.throws(()=>parseExternalEvidenceRow(JSON.stringify({
    source:'UniMorph',revision:'abc',lemma:'civis',form:'civium',
    features:['N','GEN','PL']
  })),/LEMLAT3 o Collatinus/);
  const row=parseExternalEvidenceRow(JSON.stringify({
    source:'LEMLAT3',revision:'fijada',tagset:'UniMorph',
    reference:'LEMLAT3:export:1',nativeFeatures:'lemma=civis,gen,pl',
    lemma:'civis',form:'civium',features:['N','GEN','PL']
  }));
  assert.equal(row.source,'LEMLAT3');
  assert.throws(()=>parseExternalEvidenceRow(JSON.stringify({
    ...row,source:'UniMorph Latin'
  })),/LEMLAT3 o Collatinus/);
  assert.throws(()=>parseExternalEvidenceRow(JSON.stringify({
    ...row,tagset:'LEMLAT-nativo'
  })),/conversión de etiquetas/);
});
test('Se comparan caso, número, persona, tiempo y modo sin suponer rasgos ausentes',()=>{
  const expected=expectedFeatures(bank.records[0],bank.records[0].forms[0]);
  const all=compareWithMorphology(expected,['V','IND','ACT','PRS','1','SG']);
  assert.deepEqual(all.conflicts,[]);
  assert.ok(all.matched.includes('persona')===false);
  // Rasgo person está codificado como "person" en el resultado.
  assert.ok(all.matched.includes('person'));
  assert.ok(all.matched.includes('tense'));
  const bad=compareWithMorphology(expected,['V','IND','ACT','FUT','3','PL']);
  assert.ok(bad.conflicts.includes('person'));
  assert.ok(bad.conflicts.includes('tense'));
  const nominal=expectedFeatures(bank.records[1],bank.records[1].forms[0]);
  const n=compareWithMorphology(nominal,['N','GEN','PL']);
  assert.deepEqual(n.conflicts,[]);
  assert.ok(n.matched.includes('case'));
  assert.ok(n.unknown.includes('gender'),'Los sustantivos no codifican siempre el género');
  const deponent=expectedFeatures(bank.records[2],bank.records[2].forms[0]);
  assert.equal(deponent.voice,undefined,'El ACT de UniMorph significa valor activo de deponente');
  const d=compareWithMorphology(deponent,['V','IMP','ACT','PRS','2','SG']);
  assert.deepEqual(d.conflicts,[]);
});
test('La coincidencia debe ser de la misma forma Y el mismo lema; no atestiguación textual',()=>{
  const targets=makeTargets(bank,{pau:['amō','cīvium'],cuaderno:['amō','patere']});
  assert.equal(targets.filter(x=>x.priority==='P0').length,2);
  assert.equal(targets.find(x=>x.form==='civium').priority,'P1');
  const m=createMatcher(targets);
  m.ingest(parseUniMorphRow('alius\tamō\tV;IND;ACT;PRS;1;SG'));
  m.ingest(parseUniMorphRow('amō\tamō\tV;IND;ACT;PRS;1;SG'));
  m.ingest(parseUniMorphRow('cīvis\tcīvium\tN;GEN;PL'));
  m.ingest(parseUniMorphRow('patior\tpatere\tV;IMP;ACT;PRS;2;SG'));
  assert.equal(m.stats.matchedLemmaFormRows,4,
    'La coincidencia de amō es compartida por dos lecturas con análisis distintos');
  const {summary,entries}=finalizeAudit(m,{
    sources:[{id:'UniMorph Latin',revision:UNIMORPH_LATIN_REVISION}]
  });
  assert.equal(summary.independentSourceCount,1);
  assert.equal(summary.individuallyVerified,false);
  assert.equal(summary.claimsOfTextualAttestation,0);
  const present=entries.find(x=>x.form==='amo'&&x.analysis.includes('presente'));
  assert.ok(present.evidence.some(x=>!x.comparison.conflicts.length));
  const future=entries.find(x=>x.form==='amo'&&x.analysis.includes('futuro'));
  assert.ok(future.evidence.some(x=>x.comparison.conflicts.includes('tense')));
  const compound=entries.find(x=>x.type==='compuesto');
  assert.equal(compound.status,'requiere-analizador-de-compuestos');
});
test('Coincidencias de dos fuentes independientes se distinguen de dos copias UniMorph',()=>{
  const targets=makeTargets(bank);
  const m=createMatcher(targets);
  for(const [source,revision] of [['UniMorph Latin',UNIMORPH_LATIN_REVISION],
    ['LEMLAT3','e8328948fb4b9b73b625aeda3639137c5e49a1ff']])
    m.ingest(parseUniMorphRow('amō\tamō\tV;IND;ACT;PRS;1;SG'),{source,revision});
  const {summary,entries}=finalizeAudit(m,{sources:[
    {id:'UniMorph Latin'}, {id:'LEMLAT3'}]});
  assert.equal(summary.independentSourceCount,2);
  assert.equal(entries.find(x=>x.analysis.includes('presente')&&x.form==='amo')
    .status,'acuerdo-de-fuentes-no-testimonio-textual');
});
test('El CLI escribe informes solo en build/ y conserva casos no concluyentes',async()=>{
  await mkdir(join(root,'build','academic-audits'),{recursive:true});
  const dir=await mkdtemp(join(root,'build','academic-audits','pilot-test-'));
  try{
    const data=join(dir,'fixture.tsv'),bankPath=join(dir,'bank.json');
    await writeFile(data,[
      'amō\tamō\tV;IND;ACT;PRS;1;SG',
      'cīvis\tcīvium\tN;GEN;PL',
      'patior\tpatere\tV;IMP;ACT;PRS;2;SG'
    ].join('\n')+'\n');
    await writeFile(bankPath,JSON.stringify(bank));
    const r=await runLexicographyAudit({
      bank:bankPath,unimorph:data,out:join(dir,'output')
    },{minPrimaryRows:2});
    assert.equal(r.summary.sourceRows,3);
    assert.equal(r.summary.independentSourceCount,1);
    assert.ok(r.summary.entries>=6);
    assert.ok(r.summary.byStatus['requiere-analizador-de-compuestos']===1);
    const summary=JSON.parse(await readFile(join(dir,'output','resumen.json'),'utf8'));
    assert.deepEqual(summary,r.summary);
    const lines=(await readFile(join(dir,'output','evidencias.ndjson'),'utf8')).trim().split('\n');
    assert.equal(lines.length,r.summary.entries);
    const priorities=await readFile(join(dir,'output','revision-prioritaria.tsv'),'utf8');
    assert.match(priorities,/recordId/);
    await assert.rejects(()=>runLexicographyAudit({
      bank:bankPath,unimorph:data,out:join(root,'dist','audit')
    },{minPrimaryRows:2}),/build/);
  }finally{await rm(dir,{recursive:true,force:true});}
});
