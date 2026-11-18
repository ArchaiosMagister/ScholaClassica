import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,join} from 'node:path';

const root=resolve(import.meta.dirname,'..');
const dir='shared/academic/evolutio-valenciano/';
const read=p=>JSON.parse(readFileSync(join(root,p),'utf8'));
const nine=read(dir+'contrast-avl-gnv-9-restants-2026-11-18.json');
const previous=read(dir+'contrast-independent-pilot12-2026-11-18.json');
const trio=read(dir+'contrast-avl-gnv-vida-boca-copa-2026-11-18.json');
const bank=read(dir+'matriz-522.json');
const byId=new Map(bank.records.map(x=>[x.id,x]));
const previousByLatin=new Map(previous.entries.map(x=>[x.latin,x]));
const expected=['tĕrram','pŏrtam','farinam','focum','pontem','catenam','matrem','aucam','cælum'];
const expectedGnvPages={
 'tĕrram':[57], 'pŏrtam':[9,23], 'farinam':[159],
 'focum':[23], 'pontem':[44], 'catenam':[9],
 'matrem':[9], 'aucam':[23], 'cælum':[9]
};
const lawClasses=new Set(['regla_general_mes_etimologia','parella_explicitada_sense_descomposicio_del_mecanisme',
 'parella_i_mecanisme_explicit_directe','etimologia_directa_mes_regla_general_ae','regla_general_mes_exemple_fonetica_AVL']);

test('Nueve formas con ejemplo de AVL/GNV verificable por página y alcance probatorio exacto',()=>{
 assert.equal(nine.schema,'schola-evolutio-va-remaining-nine-review/v1');
 assert.deepEqual(nine.entries.map(e=>e.latin),expected);
 assert.deepEqual(nine.summary,{count:9,gnvWordAttestations:9,gnvExamples:10,dcVbEtymologyChecks:9,
  onlyFinalM:3,withSelectableLaws:6,schoolLawCandidates:7,explicitHistoricalPairAndLawCases:1,
  generalHistoricalRuleCases:4,etymologicalPairsWithoutSpecificMechanism:2,individualDnvArticlesVerified:0,
  fullHistoricalChainsVerified:0,approvedByTeacher:0,playable:0,caseOriginDisputes:1,additionalGeneralAeHistoricalSources:1});
 assert.equal(new Set(nine.entries.map(e=>e.id)).size,9);
 assert.equal(nine.sources.AVL_GNV.publicationYear,2006);
 assert.match(nine.sources.AVL_GNV.url,/gramatica_normativa_valenciana\.pdf$/);
 for(const x of nine.entries){
  const before=previousByLatin.get(x.latin),item=byId.get(x.id);
  assert.ok(before&&item,x.latin);
  assert.equal(before.id,x.id);
  assert.equal(item.latin,x.latin);
  assert.equal(item.valenciano.resultado,x.form);
  assert.equal(item.valenciano.aptoParaPractica,false);
  assert.equal(x.dcVb.url,before.dcVbLexicalEtymology.url);
  assert.equal(x.dcVb.individuallyChecked,true);
  assert.deepEqual(x.avlGnvExamples.map(e=>e.printedPage),expectedGnvPages[x.latin]);
  for(const norm of x.avlGnvExamples){
   assert.equal(norm.word,x.form,x.latin);
   assert.equal(norm.pdfPageZeroBased,norm.printedPage-1,x.latin);
   assert.equal(norm.wordExplicitlyPresent,true,x.latin);
   assert.equal(norm.isIndividualDnvEntry,false,x.latin);
   assert.equal(norm.url,nine.sources.AVL_GNV.url);
   assert.ok(norm.context.length>10);
  }
  assert.equal(x.dnvIndividualEntryChecked,false);
  assert.equal(x.fullyDocumentedHistoricalChain,false);
  assert.equal(x.teacherApproval,false);
  assert.equal(x.playable,false);
  assert.equal(x.finalPedagogicalSelection,'pendent_revisio_docent_i_DNV');
  assert.equal(x.finalM.fixedNotSelectable,true);
  assert.deepEqual(x.finalM.originalUnicodeSpans,before.finalM.originalUnicodeSpans);
  assert.deepEqual(x.historicalSchoolLaws.map(y=>y.id),before.selectableLaws.map(y=>y.rule));
  for(const [index,law]of x.historicalSchoolLaws.entries()){
   assert.ok(lawClasses.has(law.evidenceClass),law.id);
   assert.equal(law.completeHistoricalChainCertified,false);
   assert.equal(law.schoolRuleApproved,false);
   assert.deepEqual(law.latinSpans,before.selectableLaws[index].originalUnicodeSpans);
   assert.ok(law.evidence.length>=1,x.latin+'/'+law.id);
   for(const [start,end]of law.latinSpans)assert.ok(start>=0&&end>start&&end<=x.latin.length);
  }
 }
 assert.equal(bank.records.length,522);
 assert.equal(bank.summary.aptasParaPractica,0);
});

test('Separar siete reglas escolares: una MONOP individual, cuatro patrones y dos reservas',()=>{
 const laws=nine.entries.flatMap(x=>x.historicalSchoolLaws);
 assert.equal(laws.length,7);
 assert.equal(laws.filter(x=>x.locallySourceSupported).length,1);
 assert.equal(laws.filter(x=>x.evidenceClass==='regla_general_mes_etimologia'||x.evidenceClass==='regla_general_mes_exemple_fonetica_AVL').length,4);
 assert.equal(laws.filter(x=>x.evidenceClass==='parella_explicitada_sense_descomposicio_del_mecanisme'||x.evidenceClass==='etimologia_directa_mes_regla_general_ae').length,2);
 const goose=nine.entries.find(x=>x.latin==='aucam');
 assert.equal(goose.historicalSchoolLaws[0].id,'MONOP');
 assert.equal(goose.historicalSchoolLaws[0].evidenceClass,'parella_i_mecanisme_explicit_directe');
 assert.ok(goose.historicalSchoolLaws[0].evidence.some(x=>x.authority.includes('Estudis Romànics')&&x.scope.includes('auca > oca')));
 assert.ok(goose.historicalSchoolLaws[0].evidence.some(x=>x.url.includes('/VI/26.pdf')));
 assert.equal(goose.finalM.fixedNotSelectable,true);
 for(const latin of ['tĕrram','pŏrtam','farinam']){
  const x=nine.entries.find(y=>y.latin===latin);
  assert.deepEqual(x.historicalSchoolLaws,[]);
  assert.equal(x.classification,'intro_sense_normes');
 }
 assert.equal(nine.entries.find(x=>x.latin==='cælum').historicalSchoolLaws.length,2);
 assert.equal(nine.exceptions.cel.excludedFromAutomaticPromotion,true);
 assert.equal(nine.exceptions.noctem.excludedFromPilot,true);
 assert.equal(nine.entries.some(x=>x.latin==='noctem'),false);
 assert.equal(trio.entries.length+nine.entries.length,12);
 assert.equal(new Set([...trio.entries,...nine.entries].map(e=>e.id)).size,12);
 assert.equal(trio.summary.selectableLaws+nine.summary.schoolLawCandidates,12);
 assert.equal(trio.summary.directWordSpecificHistoricalMechanismReferences+nine.summary.explicitHistoricalPairAndLawCases,5);
 assert.equal(trio.summary.generalRulesWithSourceAndSpecificEtymon+nine.summary.generalHistoricalRuleCases,5);
 assert.equal(nine.summary.etymologicalPairsWithoutSpecificMechanism,2);
});

test('Precauciones: cadena homónima, fonética moderna no es ley histórica y no se certifica DNV',()=>{
 const chain=nine.entries.find(x=>x.latin==='catenam');
 assert.match(chain.criticalNote,/CADENA 1/);
 assert.match(chain.criticalNote,/CADENA 2/);
 assert.match(chain.avlGnvExamples[0].context,/\[ð\]/);
 assert.equal(chain.historicalSchoolLaws[0].locallySourceSupported,false);
 const mare=nine.entries.find(x=>x.latin==='matrem');
 assert.equal(mare.historicalSchoolLaws[0].evidenceClass,'parella_explicitada_sense_descomposicio_del_mecanisme');
 assert.match(mare.criticalNote,/SIMPLIFICACIÓ/);
 assert.match(mare.criticalNote,/nominatiu/);
 assert.equal(mare.latinCaseDispute.status,'recerca_filologica_amb_interpretacions_divergents');
 assert.ok(mare.latinCaseDispute.source.url.includes('publicacions.iec.cat'));
 assert.match(nine.criticalAcademicFindings.matrem.join(' '),/MATER/);
 const sky=nine.entries.find(x=>x.latin==='cælum');
 assert.match(sky.criticalNote,/vocal final àtona u/);
 assert.equal(sky.historicalSchoolLaws[0].locallySourceSupported,false);
 assert.ok(sky.historicalSchoolLaws[0].evidence.some(e=>e.url.endsWith('/e-6')));
 assert.match(nine.criticalAcademicFindings.caelum.join(' '),/APÒCOPE/);
 const port=nine.entries.find(x=>x.latin==='pŏrtam');
 assert.match(port.criticalNote,/\[ɔ\]/);
 const fire=nine.entries.find(x=>x.latin==='focum');
 assert.match(fire.avlGnvExamples[0].context,/oberta/);
 const pont=nine.entries.find(x=>x.latin==='pontem');
 assert.match(pont.avlGnvExamples[0].context,/pontet/);
 const farina=nine.entries.find(x=>x.latin==='farinam');
 assert.match(farina.avlGnvExamples[0].context,/gens de farina/);
 assert.equal(nine.entries.filter(x=>x.playable).length,0);
 assert.equal(bank.records.filter(x=>x.valenciano.aptoParaPractica).length,0);
});
