import assert from 'node:assert/strict';
import {cp,mkdir,writeFile,stat,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {compileTeacherAudit} from './compile-etymologicon-gr1.mjs';
import {expandGreekI} from './expand-etymologicon-gr1.mjs';
import {createStudyCatalog} from './compile-etymologicon-study.mjs';
import {createDecompositionCatalog} from './compile-etymologicon-decomposition.mjs';

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
  // La auditoría docente fijada permanece intacta. La ampliación solo afecta
  // al catálogo de práctica; las 16 descomposiciones mantienen su base cerrada.
  const academicSource=compileTeacherAudit();
  const baseCatalog=createLearnerCatalog(academicSource);
  const catalog=expandGreekI(baseCatalog);
  await mkdir(join(destination,'data'),{recursive:true});
  await writeFile(join(destination,'data/gr1.json'),JSON.stringify(catalog)+'\n','utf8');
  const studyCatalog=createStudyCatalog(academicSource,catalog);
  await writeFile(join(destination,'data/gr1-study.json'),JSON.stringify(studyCatalog)+'\n','utf8');
  const decomposition=createDecompositionCatalog(baseCatalog);
  await writeFile(join(destination,'data/gr1-decomposition.json'),
    JSON.stringify(decomposition)+'\n','utf8');
  // Generación de SW con versión de caché derivada de TODO el contenido.
  // No hay SW compartido de ScholaClassica: el alcance es solo este módulo.
  const core=[
    'index.html','practicar.html','estudio.html','style.css','portada.css','portada.mjs','estudio.css','estudio.mjs','app.mjs','progress.mjs','study.mjs','activities-ui.mjs','quiz.mjs','quiz-ui.mjs','decomposition.mjs','decomposition-ui.mjs','greek-keyboard.mjs','corrector/write-two.mjs',
    'data/gr1.json','data/gr1-study.json','data/gr1-decomposition.json','manifest.webmanifest','icons/icon.svg',
    'icons/icon-192.png','icons/icon-512.png','icons/icon-maskable-512.png',
    'icons/apple-touch-icon.png'
  ];
  const template=await readFile(join(root,'scripts/etymologicon-sw.template.js'),'utf8');
  assert.equal(template.split('__ETYM_CACHE_VERSION__').length,2,'Marcador único de versión offline');
  const digester=createHash('sha256');
  digester.update(template);
  for(const item of core){
    digester.update(item+'\0');
    digester.update(await readFile(join(destination,item)));
  }
  const version=digester.digest('hex').slice(0,20);
  const worker=template.replace('__ETYM_CACHE_VERSION__',version);
  await writeFile(join(destination,'sw.js'),worker,'utf8');

  console.log('ScholaClassica: Etymologicon con '+catalog.etymons.length+' étimos y '+catalog.derivatives.length+
    ' derivados ('+catalog.extension.newDerivatives+' nuevos); descomposición piloto intacta');
}
