import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve,join} from 'node:path';

const root=resolve(import.meta.dirname,'..');
const base='shared/academic/evolutio-valenciano/';
const read=name=>JSON.parse(readFileSync(join(root,base+name),'utf8'));
const dossier=read('contrast-normatiu-avl-i-fonetica-historica-2026-11-17.json');
const queue=read('cola-fonetica-66-2026-11-17.json');
const matrix=read('matriz-522.json');
const curated=read('conciliacion-curada.json');

test('9 proves específiques separen reconeixement oficial AVL, fonètica publicada i DNV pendent',()=>{
 assert.equal(dossier.schema,'schola-evolutio-valenciano-official-historical-crosscheck/v1');
 assert.deepEqual(dossier.summary,{
  totalUniqueEntries:9,avlExplicitHeadwords:3,avlRelatedPluralOnly:1,
  historicalExplicitPairs:4,historicalIndirectContrast:1,
  currentDnvIndividualChecks:0,completePhoneticChainsCertified:0,
  individualSchoolLawsCertified:0,playable:0
 });
 assert.equal(dossier.normative.length,4);
 assert.equal(dossier.historical.length,5);
 assert.equal(queue.summary.historicalAvlAgreementExplicitForms,3);
 assert.equal(queue.summary.historicalAvlAgreementRelatedPlural,1);
 assert.equal(queue.summary.individualHistoricalEvidenceExamplePairs,4);
 assert.equal(queue.summary.indirectHistoricalProsodicEvidence,1);
 assert.equal(queue.summary.currentDnvIndividualChecks,0);
 assert.equal(queue.summary.publishedEvidenceButNotFullCertification,9);
 const all=[...dossier.normative,...dossier.historical];
 assert.equal(new Set(all.map(x=>x.latin)).size,9);
 assert.deepEqual(new Set(all.map(x=>x.latin)),new Set([
  'continere','specŭlum','thesaurum','homĭnem',
  'cadere','luctam','seminare','laudare','bene'
 ]));
 const refs=dossier.references;
 assert.equal(refs.avl2002.authority,'Acadèmia Valenciana de la Llengua');
 assert.match(refs.avl2002.url,/^https:\/\/www\.avl\.gva\.es\/wp-content\/uploads\//);
 assert.equal(refs.avl2002.currentDnv,false);
 assert.equal(refs.phonetics.authority,'Gran Enciclopèdia Catalana');
 assert.match(refs.phonetics.url,/^https:\/\/www\.enciclopedia\.cat\//);
 assert.equal(refs.phonetics.currentDnv,false);
 for(const x of all){
  const source=refs[x.sourceKey];
  assert.ok(source,x.latin);
  assert.ok(x.finding?.length>85||x.context?.length>35,x.latin);
  assert.ok(x.guard?.length>75,x.latin);
  assert.equal(x.currentDnvIndividualChecked,false,x.latin);
  assert.equal(x.teacherApproved,false,x.latin);
  assert.equal(x.playable,false,x.latin);
  const q=queue.entries.find(w=>w.latin===x.latin);
  assert.ok(q&&q.form===x.form,x.latin);
  const link=q.review.independentSpecificEvidence;
  assert.ok(link,x.latin);
  assert.equal(link.sourceUrl,source.url);
  assert.equal(link.sourceAuthority,source.authority);
  assert.equal(link.reviewCompleted,true);
  for(const flag of ['currentDnvIndividualChecked','individualSchoolLawsCertified',
   'fullHistoricalChainCertified','teacherApproved','playable'])
   assert.equal(link[flag],false,x.latin+'/'+flag);
  const m=matrix.records.find(w=>w.latin===x.latin);
  assert.ok(m,x.latin);
  assert.equal(m.valenciano.resultado,x.form);
  assert.equal(m.valenciano.estadoLexico,'contrastat_lexic_sense_fonetica');
  assert.equal(m.valenciano.normas,null);
  assert.equal(m.valenciano.aptoParaPractica,false);
 }
 assert.equal(queue.entries.filter(x=>x.review.independentSpecificEvidence).length,9);
});

test('L’AVL 2002 només certifica tres lemes exactes; el plural home no acredita el singular',()=>{
 const n=new Map(dossier.normative.map(x=>[x.latin,x]));
 for(const latin of ['continere','specŭlum','thesaurum']){
  assert.equal(n.get(latin).strength,'lema_explicito');
  assert.equal(n.get(latin).officialAgreementDirectlyReviewed,true);
  assert.equal(queue.entries.find(x=>x.latin===latin)
    .review.independentSpecificEvidence.exactLemmaInAvlAgreement,true);
 }
 assert.equal(n.get('homĭnem').strength,'relacio_morfologica_no_lema_singular');
 assert.match(n.get('homĭnem').literalContext,/hòmens \/ homes/);
 assert.equal(queue.entries.find(x=>x.latin==='homĭnem')
  .review.independentSpecificEvidence.exactLemmaInAvlAgreement,false);
 assert.equal(queue.entries.find(x=>x.latin==='homĭnem')
  .review.independentSpecificEvidence.avlRelatedPluralOnly,true);
 assert.match(n.get('thesaurum').literalContext,/r patrimonial/);
 assert.match(n.get('continere').literalContext,/contindre/);
 assert.match(n.get('specŭlum').literalContext,/espill/);
 assert.equal(dossier.normative.filter(x=>x.strength==='lema_explicito').length,3);
});

test('Quatre parelles històriques i una oposició prosòdica no esdevenen normes per deducció',()=>{
 const h=new Map(dossier.historical.map(x=>[x.latin,x]));
 for(const latin of ['cadere','luctam','seminare','laudare']){
  assert.match(h.get(latin).evidenceKind,/^parella/);
  assert.equal(queue.entries.find(x=>x.latin===latin)
   .review.independentSpecificEvidence.phoneticExamplePublished,true);
 }
 assert.equal(h.get('bene').evidenceKind,'contrast_de_formes_romaniques');
 assert.equal(queue.entries.find(x=>x.latin==='bene')
  .review.independentSpecificEvidence.phoneticExamplePublished,false);
 assert.match(h.get('luctam').guard,/nominatiu lŭcta/);
 assert.match(h.get('seminare').mechanism,/Síncope/);
 assert.match(h.get('cadere').mechanism,/Tractament vocàlic/);
 for(const hitem of dossier.historical){
  assert.equal(hitem.individualSchoolLawsCertified,false);
  assert.equal(hitem.completeChainCertified,false);
 }
 assert.equal(queue.entries.filter(x=>x.review.proposedChanges.length>0).length,47);
 assert.equal(queue.entries.reduce((sum,x)=>sum+x.review.proposedChanges.length,0),72);
 assert.equal(queue.entries.filter(x=>!x.review.proposedChanges.length).length,19);
});

test('No confondre la tòs de l’AVL amb la tos de TUSSEM; cap fitxa promocionada',()=>{
 assert.equal(dossier.negativeControls.length,3);
 assert.equal(dossier.negativeControls.find(x=>x.form==='tòs').verifiedForLatinTussem,false);
 assert.equal(dossier.negativeControls.find(x=>x.form==='contindre').verifiedPhoneticChange,false);
 assert.equal(dossier.negativeControls.find(x=>x.form==='hòmens / homes').verifiedSingularDirectly,false);
 assert.equal(matrix.records.length,522);
 assert.equal(curated.lexicallyReviewed.length,66);
 assert.equal(matrix.summary.normasVerificadas,0);
 assert.equal(matrix.summary.aptasParaPractica,0);
 assert.equal(queue.summary.playable,0);
 assert.equal(existsSync(join(root,'dist',base,'contrast-normatiu-avl-i-fonetica-historica-2026-11-17.json')),false);
});
