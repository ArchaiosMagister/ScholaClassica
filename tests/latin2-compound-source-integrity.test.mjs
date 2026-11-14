import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {runCompoundAudit} from '../scripts/audit-latin2-compounds.mjs';

const root=resolve(import.meta.dirname,'..');
const secondary=(source,revision,ref)=>JSON.stringify({
  source,revision,tagset:'UniMorph',reference:ref,
  nativeFeatures:'test-code=1234567',lemma:'amo',form:'amatus',
  features:['V','V.PTCP','NOM','MASC','SG']
})+'\n';

test('Cotejo de compuestos: fuente vacía, mezclada o de doble revisión nunca cuenta como independiente',async()=>{
  const parent=join(root,'build','academic-audits');
  await mkdir(parent,{recursive:true});
  const temp=await mkdtemp(join(parent,'latin2-source-integrity-'));
  try{
    const entries=join(temp,'entries.ndjson');
    const primary=join(temp,'primary.tsv');
    const editorial=join(temp,'editorial.json');
    const independent=join(temp,'secondary.jsonl');
    const opts={entries,unimorph:primary,independent,editorial,
      out:join(temp,'private-output')};
    await writeFile(entries,JSON.stringify({
      id:1,recordId:'test',lemma:'amo',form:'amatus sum',
      kind:'verbo',priority:'P2',type:'compuesto',
      expected:{pos:['V'],person:'1',number:'SG'},
      analysis:'verbo · amo, amare, amavi, amatum (1.ª) · 1.ª persona · singular · perfecto · indicativo · voz pasiva'
    })+'\n');
    await writeFile(primary,'amo\tamatus\tV;V.PTCP;NOM;MASC;SG\n');
    await writeFile(editorial,JSON.stringify({
      schema:'schola-latin2-editorial-review/v1',
      compoundParadigmDecisions:[]
    }));
    await writeFile(independent,'\n');
    await assert.rejects(()=>runCompoundAudit(opts),/Fuente secundaria vacía/);
    await writeFile(independent,
      secondary('LEMLAT3','revision-a','LEMLAT3:1')+
      secondary('Collatinus','revision-a','Collatinus:2'));
    await assert.rejects(()=>runCompoundAudit(opts),/No mezclar proveedores/);
    await writeFile(independent,
      secondary('LEMLAT3','revision-a','LEMLAT3:1')+
      secondary('LEMLAT3','revision-b','LEMLAT3:2'));
    await assert.rejects(()=>runCompoundAudit(opts),/No mezclar revisiones/);
    await writeFile(independent,secondary('LEMLAT3','revision-a','LEMLAT3:1'));
    const result=await runCompoundAudit(opts);
    assert.equal(result.summary.independentSourceCount,2);
    assert.equal(result.summary.secondarySourceRows,1);
    assert.equal(result.summary.individuallyVerified,false);
    assert.equal(result.summary.attestedPhrases,0);
  }finally{await rm(temp,{recursive:true,force:true});}
});
