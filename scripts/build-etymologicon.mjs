import assert from 'node:assert/strict';
import {cp,mkdir,writeFile,stat} from 'node:fs/promises';
import {join} from 'node:path';
import {compileTeacherAudit} from './compile-etymologicon-gr1.mjs';

/**
 * Exportación mínima para el navegador: solo campos necesarios para practicar.
 * El libro docente, sus huellas, las definiciones y las decisiones editoriales
 * no se incorporan a los datos de esta primera interfaz.
 *
 * Importante: los derivados admitidos SÍ deben residir en el cliente para
 * permitir la autocorrección sin servidor; no son un secreto antitrampas.
 */
export function createLearnerCatalog(source){
  assert.equal(source.schema,'etymologicon-audited-catalog/v1');
  assert.equal(source.course,'gr1');
  assert.equal(source.status,'editorially_reconciled_not_published');
  assert.equal(source.etymons.length,111);
  assert.equal(source.derivatives.length,201);
  assert.equal(source.relations.length,217);
  const etymons=source.etymons.map(
    ({id,lemma,meaning,units,editorialStatus,teacherApprovedDerivatives})=>
      ({id,lemma,meaning,units,editorialStatus,teacherApprovedDerivatives})
  );
  const derivatives=source.derivatives.map(
    ({id,form,officialOrthographicVariants,editorialStatus})=>
      ({id,form,officialOrthographicVariants,editorialStatus})
  );
  const relations=source.relations.map(
    ({id,etymonId,derivativeId,editorialStatus,eligibleFor})=>
      ({id,etymonId,derivativeId,editorialStatus,eligibleFor})
  );
  const excluded=source.excluded.map(({form})=>({form}));
  assert.equal(etymons.filter(e=>e.editorialStatus==='approved_for_documented_derivatives').length,108);
  assert.equal(etymons.filter(e=>e.editorialStatus==='reference_only').length,3);
  assert.equal(etymons.filter(e=>typeof e.meaning==='string'&&e.meaning.length>0).length,111);
  assert.equal(excluded.length,1);
  return {schema:'etymologicon-audited-catalog/v1',course:'gr1',
    etymons,derivatives,relations,excluded};
}

export async function buildEtymologicon({root,out}){
  const source=join(root,'apps/etymologicon');
  await stat(join(source,'index.html'));
  const destination=join(out,'apps/etymologicon');
  await mkdir(destination,{recursive:true});
  await cp(source,destination,{recursive:true,force:true});
  await mkdir(join(destination,'corrector'),{recursive:true});
  await cp(join(root,'shared/academic/greek-etymology/corrector/write-two.mjs'),
    join(destination,'corrector/write-two.mjs'));
  const catalog=createLearnerCatalog(compileTeacherAudit());
  await mkdir(join(destination,'data'),{recursive:true});
  await writeFile(join(destination,'data/gr1.json'),JSON.stringify(catalog)+'\n','utf8');
  console.log('ScholaClassica: Etymologicon preparado en dist/apps/etymologicon/ (111 étimos, 201 derivados, sin desplegar)');
}
