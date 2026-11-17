import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve,join} from 'node:path';

const root=resolve(import.meta.dirname,'..');
const base='shared/academic/evolutio-valenciano/';
const read=name=>JSON.parse(readFileSync(join(root,base+name),'utf8'));
const report=read('contrast-fonetica-historica-uoc-gec11-2026-11-17.json');
const dnv=read('acces-dnv-electronic-2026-11-17.json');
const previous=read('contrast-normatiu-avl-i-fonetica-historica-2026-11-17.json');
const queue=read('cola-fonetica-66-2026-11-17.json');
const matrix=read('matriz-522.json');
const curation=read('conciliacion-curada.json');

test('Onze contrastos històrics: quatre etapes esquemàtiques, cinc parells parcials i dues formes llatines distintes',()=>{
 assert.equal(report.schema,'schola-evolutio-va-historical-followup-11/v1');
 assert.deepEqual(report.summary,{
  entriesIndividuallyContrasted:11,fuocMirror:7,gecPrimary:3,
  rodamotsBookExcerpt:1,sourceExplicitSchematicIntermediate:4,
  sourceDirectPartialPairs:5,sourceDifferentLatinNumberOrCase:2,
  potentialFalseSyncopeCasesFlagged:5,dnvelectronicVerified:0,
  allStagesHistoricallyAttested:0,schoolLawsCertified:0,playable:0
 });
 assert.equal(report.entries.length,11);
 assert.equal(new Set(report.entries.map(x=>x.latin)).size,11);
 assert.equal(report.entries.filter(x=>x.evidenceKind==='sincope_con_intermedio').length,4);
 assert.equal(report.entries.filter(x=>x.evidenceKind==='parella_amb_mecanisme_parcial').length,5);
 assert.equal(report.entries.filter(x=>x.evidenceKind==='forma_llatina_relacionada_pero_no_identica').length,2);
 assert.equal(report.entries.filter(x=>x.sourceKey==='uoc2009').length,7);
 assert.equal(report.entries.filter(x=>x.sourceKey==='gec').length,3);
 assert.equal(report.entries.filter(x=>x.sourceKey==='rodamots2014').length,1);
 const old=new Set([...previous.normative,...previous.historical].map(x=>x.latin));
 assert.equal(old.size,9);
 assert.ok(report.entries.every(x=>!old.has(x.latin)),'La cobertura nueva no puede duplicar el expediente previo');
 assert.equal(queue.summary.newPartialHistoricalEvidenceEntries,11);
 assert.equal(queue.summary.totalEntriesWithIndependentSpecificEvidence,30);
 assert.equal(queue.entries.filter(x=>x.review.independentSpecificEvidence||x.review.followupHistoricalEvidence).length,20);
 for(const [i,x] of report.entries.entries()){
  assert.equal(x.order,i+1);
  assert.equal(x.individualSourceRead,true);
  assert.ok(x.attestedChain.length>12,x.latin);
  assert.ok(x.assessment.length>100,x.latin);
  assert.ok(x.guardrail.length>65,x.latin);
  const ref=report.references[x.sourceKey];
  assert.ok(ref,x.latin);
  assert.match(ref.url,/^https:\/\//);
  if(x.sourceKey==='uoc2009'){
   assert.equal(ref.hostType,'tercer_mirror_del_material_academic');
   assert.match(ref.publisher,/^https:\/\/cv\.uoc\.edu\//);
  }
  for(const k of ['currentDnvEntryVerified','allIntermediateFormsHistoricallyAttested',
   'fullEvolutionChainCertified','schoolLawsIndividuallyCertified',
   'teacherApproved','playable']) assert.equal(x[k],false,x.latin+'/'+k);
  const q=queue.entries.find(y=>y.latin===x.latin);
  assert.ok(q&&q.form===x.form,x.latin);
  const link=q.review.followupHistoricalEvidence;
  assert.ok(link,x.latin);
  assert.equal(link.sourceUrl,ref.url);
  assert.equal(link.sourceAuthority,ref.authority);
  assert.equal(link.evidenceKind,x.evidenceKind);
  assert.equal(link.sourceLocation,x.sourceLocation);
  assert.equal(link.reviewCompleted,true);
  assert.equal(link.partialSourceMechanismRule,x.partiallySupportedRule);
  assert.equal(link.sourceIsOriginalPublisherHost,ref.hostType==='pagina_primaria_publicada');
  assert.equal(link.correspondsToExistingRuleCandidate,
   Boolean(x.partiallySupportedRule&&q.review.proposedChanges.some(y=>y.rule===x.partiallySupportedRule)));
  for(const k of ['currentDnvIndividualChecked','allIntermediateFormsHistoricallyAttested',
   'fullHistoricalChainCertified','individualSchoolLawsCertified','approvedByTeacher','playable'])
    assert.equal(link[k],false,x.latin+'/'+k);
  const m=matrix.records.find(y=>y.latin===x.latin);
  assert.ok(m,x.latin);
  assert.equal(m.valenciano.resultado,x.form);
  assert.equal(m.valenciano.normas,null);
  assert.equal(m.valenciano.aptoParaPractica,false);
 }
});

test('No s equiparen canvis escrits en el manual amb registres medievals, nominatius i plurals',()=>{
 const by=new Map(report.entries.map(x=>[x.latin,x]));
 for(const latin of ['uiridem','sŏlĭdum','dŏmĭnam','pŏpŭlum']){
  assert.equal(by.get(latin).evidenceKind,'sincope_con_intermedio');
  assert.equal(by.get(latin).sourceKey,'uoc2009');
 }
 assert.match(by.get('sŏlĭdum').attestedChain,/sol'du/);
 assert.match(by.get('dŏmĭnam').attestedChain,/dom'na/);
 assert.match(by.get('pŏpŭlum').attestedChain,/pop'lu/);
 assert.match(by.get('capere').attestedChain,/caber \/ cabre/);
 assert.match(by.get('cŏrpus').guardrail,/SIMPL/);
 assert.match(by.get('magistrum').attestedChain,/magister > maester > mestre/);
 assert.match(by.get('magistrum').guardrail,/MAGISTRUM/);
 assert.match(by.get('ocŭlos').attestedChain,/singular/);
 assert.match(by.get('ocŭlos').guardrail,/plural/);
 assert.match(by.get('seniorem').assessment,/acusatiu/);
 assert.match(by.get('pericŭlum').assessment,/periculum > perill/);
 assert.equal(queue.entries.find(x=>x.latin==='sŏlĭdum').review.proposedChanges.length,0);
 assert.equal(queue.entries.find(x=>x.latin==='magistrum').review.proposedChanges.length,0);
 assert.equal(queue.entries.find(x=>x.latin==='ocŭlos')
  .review.followupHistoricalEvidence.correspondsToExistingRuleCandidate,false);
});

test('Cinc reserves sobre les falses síncopes de -clum/-culum no invaliden les decisions acadèmiques',()=>{
 assert.equal(report.potentialFalseSyncopeReview.length,5);
 const words=['specŭlum','ouicŭlam','articulum','pericŭlum','ocŭlos'];
 assert.deepEqual(new Set(report.potentialFalseSyncopeReview.map(x=>x.latin)),new Set(words));
 for(const item of report.potentialFalseSyncopeReview){
  assert.equal(item.scope,'advertiment_general_sobre_sufixos_clum_culum');
  assert.equal(item.notAnAutomaticReclassification,true);
  assert.equal(item.existingProposalUnmodified,true);
  assert.equal(item.needsIndividualHistoricalMorphology,true);
  const q=queue.entries.find(x=>x.latin===item.latin);
  assert.equal(q.form,item.form);
  assert.ok(q.review.proposedChanges.some(c=>c.rule==='SINC'));
  const caution=q.review.morphologicalSyncopeCaution;
  assert.equal(caution.dossier,'contrast-fonetica-historica-uoc-gec11-2026-11-17.json');
  assert.equal(caution.doesNotOverrideExistingRules,true);
  assert.equal(caution.schoolLawCertified,false);
 }
 assert.equal(queue.summary.morphologicalFalseSyncopeCautions,5);
 assert.equal(queue.entries.filter(x=>x.review.morphologicalSyncopeCaution).length,5);
 assert.equal(queue.entries.reduce((s,x)=>s+x.review.proposedChanges.length,0),72);
 assert.equal(queue.entries.filter(x=>x.review.proposedChanges.length).length,47);
 assert.equal(queue.entries.filter(x=>!x.review.proposedChanges.length).length,19);
});

test('El DNV dona una interfície de cerca, però zero entrades accessibles en aquest entorn',()=>{
 assert.equal(dnv.schema,'schola-evolutio-va-dnv-access-audit/v1');
 assert.equal(dnv.authority,'Acadèmia Valenciana de la Llengua');
 assert.deepEqual(dnv.summary,{
  dnvEntriesIndividuallyRead:0,officialSearchSiteShellReadable:true,
  officialInteractiveSearchPerformed:false,doNotInferMissingWords:true,
  candidateEntriesInQueue:66,pendingDnv:66
 });
 assert.equal(dnv.checks.length,4);
 assert.ok(dnv.checks.every(x=>x.canReadDictionaryEntry===false&&x.verifiesAbsenceOfLemma===false));
 assert.equal(dnv.retryAfterSourcePrecision.individualEntriesRecovered,0);
 assert.equal(dnv.retryAfterSourcePrecision.methods.length,3);
 assert.ok(dnv.retryAfterSourcePrecision.methods.every(x=>x.actualDictionaryArticleRetrieved===false));
 assert.match(dnv.retryAfterSourcePrecision.methods[0].result,/robots\.txt/);
 assert.match(dnv.retryAfterSourcePrecision.conclusion,/no s'incrementa/);
 assert.match(dnv.checks[0].result,/Sessió caducada/);
 assert.match(dnv.checks[0].result,/No hi ha resultats/);
 assert.match(dnv.policy,/dnvIndividualChecked=false/);
 assert.equal(queue.summary.dnvSearchInterfaceAssessed,true);
 assert.equal(queue.summary.dnvSearchResultsIndividuallyRecovered,0);
 assert.equal(queue.summary.currentDnvIndividualChecks,0);
 assert.equal(queue.summary.pendingDnv,66);
 assert.equal(queue.summary.dnvAccessDossier,'acces-dnv-electronic-2026-11-17.json');
 for(const q of queue.entries)assert.equal(q.review.dnvIndividualChecked,false);
 assert.equal(matrix.records.length,522);
 assert.equal(curation.lexicallyReviewed.length,66);
 assert.equal(matrix.summary.normasVerificadas,0);
 assert.equal(matrix.summary.aptasParaPractica,0);
 assert.equal(queue.summary.playable,0);
 assert.equal(existsSync(join(root,'dist',base,'contrast-fonetica-historica-uoc-gec11-2026-11-17.json')),false);
 assert.equal(existsSync(join(root,'dist',base,'acces-dnv-electronic-2026-11-17.json')),false);
});
