// Auditoría final del artefacto que se publicará en GitHub Pages.
// No admite datos de acceso docente, ni elementos de construcción internos.
import assert from 'node:assert/strict';
import {readFileSync,existsSync,statSync} from 'node:fs';
import {resolve,join,sep} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const out=join(root,'dist');
const read=(path)=>readFileSync(join(out,path),'utf8');
assert.ok(existsSync(out),'Falta dist/: ejecutar npm run build antes de publicar');
for(const path of ['index.html','app.js','style.css','sw.js','manifest.webmanifest','.nojekyll',
  'icons/icon.svg','icons/icon-192.png','icons/icon-512.png',
  'apps/gramatica/index.html','apps/vocabulario/index.html',
  'apps/evolucion-fonetica/index.html','apps/etymologicon/index.html',
  'apps/morfologia/index.html','apps/morfologia/sw.js',
  'apps/morfologia/engine.mjs','apps/morfologia/written.mjs',
  'apps/morfologia/review.mjs','apps/morfologia/greek-keyboard.mjs',
  'apps/morfologia/sintagmas.mjs','apps/morfologia/greek-noun-phrases.mjs',
  'apps/morfologia/data/LICENSE-SUSTANTIVOS-GRIEGOS.md',
  'apps/morfologia/data/paradigmas.json',
  'docente/auth-config.json']){
  assert.ok(existsSync(join(out,path)),'Falta recurso de publicación: '+path);
}
assert.deepEqual(JSON.parse(read('docente/auth-config.json')),{enabled:false},
  'El portal público no puede contener autenticación docente activada');
// El itinerario público usa las respuestas castellanas originales; la
// conciliación valenciana académica no está certificada para publicación.
const pilotPublic=JSON.parse(read('apps/evolucion-fonetica/data/pilot.json'));
const pilotOrigin=JSON.parse(readFileSync(
  join(root,'.sources/evolutio/data/pilot.json'),'utf8'));
assert.equal(pilotPublic.words.length,522);
assert.deepEqual(pilotPublic,pilotOrigin,
  'No sustituir el corrector castellano por propuestas valencianas');
for(const file of ['shared/academic/evolutio-valenciano',
  'apps/evolucion-fonetica/data/matriz-522.json',
  'apps/evolucion-fonetica/data/valenciano.json'])
  assert.equal(existsSync(join(out,file)),false,
    'Documentos académicos valencianos en Pages: '+file);
for(const prohibited of ['dist-docente','build','apps/examenes','supabase/functions']){
  assert.equal(existsSync(join(out,prohibited)),false,
    'No publicar recursos internos ni el generador: '+prohibited);
}
const manifest=JSON.parse(read('manifest.webmanifest'));
assert.equal(manifest.start_url,'./');
assert.equal(manifest.scope,'./');
assert.equal(manifest.display,'standalone');
for(const item of manifest.icons){
  assert.ok(item.src.startsWith('./icons/'));
  const file=resolve(out,item.src);
  assert.ok(file.startsWith(out+sep));
  assert.ok(statSync(file).isFile());
}
const portalWorker=read('sw.js');
assert.ok(portalWorker.includes("CACHE_PREFIX='schola-portal-'"));
assert.ok(portalWorker.includes('OWN_PATHS.has(url.pathname)'));
assert.ok(!portalWorker.includes('__SCHOLA_PORTAL_CACHE_VERSION__'));
const evolutioWorker=read('apps/evolucion-fonetica/sw.js');
assert.ok(evolutioWorker.includes("CACHE_PREFIX='schola-evolutio-'"));
assert.ok(evolutioWorker.includes('url.pathname.startsWith(scope.pathname)'));
const etymologiconWorker=read('apps/etymologicon/sw.js');
assert.ok(etymologiconWorker.includes("CACHE_PREFIX='schola-etymologicon-'"));
const morphology=JSON.parse(read('apps/morfologia/data/paradigmas.json'));
assert.equal(morphology.schema,'schola-morphology-source/v1');
assert.ok(morphology.records.length>220);
assert.deepEqual(morphology.coverage,{latin:[1,2,3,4,5,6,7,8,9,10],griego:[1,2,3,4,5,6,7,8,9,10,11,12,13,14],latin4:[1,2,3,4,5,6,7,8],latin2:[0]});
assert.ok(morphology.records.every(r=>r.evidence.status==='paradigma-documentado'));
assert.ok(read('apps/morfologia/sw.js').includes("CACHE_PREFIX='schola-morphology-'"));
for(const file of ['written.mjs','review.mjs','greek-keyboard.mjs','sintagmas.mjs','greek-noun-phrases.mjs']){
  assert.ok(read('apps/morfologia/sw.js').includes("'./"+file+"'"),
    'El modo offline debe precargar '+file);
}
assert.ok(read('apps/morfologia/index.html').includes('id="greek-keyboard"'));
assert.ok(read('apps/morfologia/index.html').includes('id="review-mode"'));
const locked=JSON.parse(readFileSync(join(root,'config/sources.lock.json'),'utf8'));
assert.equal(morphology.vocabulaSha,locked.sources.vocabula.sha);
const teacherNouns=morphology.records.filter(r=>
  r.id.startsWith('griego-sustantivo-decision-'));
assert.deepEqual(teacherNouns.map(n=>n.id),
  ['griego-sustantivo-decision-pais','griego-sustantivo-decision-athenai'],
  'No admitir decisiones nominales nuevas sin auditoría individual');
const pais=teacherNouns[0];
assert.ok(pais&&pais.gender==='común'&&
  pais.forms.length===10&&pais.unit===8&&
  pais.evidence.vocabulaSha===locked.sources.vocabula.sha&&
  pais.evidence.vocabulaEntry==='2132b8254922c90c'&&
  pais.evidence.teacherDecision==='ambos-generos');
assert.deepEqual(pais.agreementGenders,['masculino','femenino']);
const athenai=teacherNouns[1];
assert.ok(athenai&&athenai.unit===4&&athenai.forms.length===5&&
  athenai.gender==='femenino'&&athenai.evidence.numberScope==='plural'&&
  athenai.evidence.vocabulaSha===locked.sources.vocabula.sha&&
  athenai.evidence.vocabulaEntry==='b8e417b32b6f3692'&&
  athenai.forms.every(f=>f.number==='plural'));
assert.deepEqual(athenai.forms.map(f=>f.case),
  ['nominativo','vocativo','acusativo','genitivo','dativo']);
const nouns=morphology.records.filter(r=>
  r.id.startsWith('griego-sustantivo-')&&
  !r.id.startsWith('griego-sustantivo-decision-'));
// Mantener lista blanca cerrada de modelos conciliados, sin admitir altas
// automáticas ni modificar los ocho lemas originales.
const approvedNouns=['hippos','bios','dike','arete','logos','doron','nike','eirene',
  'anthropos','biblion','zoon','agora','aletheia','adikia','eleutheria',
  'arche','strategos','epistole','kephale','mache','petra',
  'ouranos','hoplon','phobos'];
assert.deepEqual(new Set(nouns.map(n=>n.id)),
  new Set(approvedNouns.map(id=>'griego-sustantivo-'+id)),
  'Solo sustantivos conciliados individualmente en ambos lotes');
assert.ok(nouns.every(n=>n.forms.length===10&&n.gender&&
  n.evidence.vocabulaSha===locked.sources.vocabula.sha&&
  n.evidence.review.includes('conciliación interfuentes')&&
  (n.evidence.review.includes('pendiente de revisión docente individual')||
   (n.evidence.individualVerification?.status==='contrastado-individualmente'&&
    n.evidence.individualVerification.checkedCount===10&&
    n.evidence.individualVerification.slots?.length===10))),
  'Sustantivo sin procedencia pendiente o cotejo de diez casillas');
assert.equal(nouns.filter(n=>n.evidence.individualVerification?.status===
  'contrastado-individualmente').length,9,
  'Solo nueve lemas autorizados pueden declararse contrastados');
const ouranos=nouns.find(n=>n.id==='griego-sustantivo-ouranos');
assert.ok(ouranos&&ouranos.forms.length===10&&
  ouranos.forms.filter(f=>f.number==='plural').length===5,
  'Las cinco formas plurales de οὐρανός deben conservarse en el banco');
const expectedExcluded=['nominativo','vocativo','acusativo','genitivo','dativo']
  .map(cas=>cas+':plural');
assert.deepEqual(ouranos.evidence.individualVerification?.practiceExclusion?.slots,
  expectedExcluded,'Excluir exactamente los cinco plurales de οὐρανός del sorteo');
assert.equal(ouranos.evidence.individualVerification.practiceExclusion.policy,
  'exclude-plural-from-new-exercises');
assert.ok(nouns.filter(n=>n.id!=='griego-sustantivo-ouranos')
  .every(n=>!n.evidence.individualVerification?.practiceExclusion),
  'No excluir los plurales de otros sustantivos');
assert.ok(nouns.find(n=>n.id==='griego-sustantivo-anthropos')?.gender==='común',
  'No falsear como género masculino exclusivo el sustantivo ἄνθρωπος');
const cantus=morphology.records.find(r=>r.id==='latin-sustantivo-decision-cantus');
assert.ok(cantus&&cantus.unit===7&&cantus.gender==='masculino'&&
 cantus.evidence.teacherDecision==='cuarta-sin-mezcla'&&
 cantus.evidence.vocabulaEntry==='d20502b9069bd664'&&
 cantus.forms.length===12);
assert.equal(cantus.forms.find(f=>f.analysis==='genitivo plural').form,'cantuum');
assert.ok(!cantus.forms.some(f=>['canti','cantorum','cantos'].includes(f.form)));
const liber=morphology.records.find(r=>r.id==='latin-sustantivo-decision-liber');
assert.ok(liber&&liber.unit===1&&liber.gender==='masculino'&&
 liber.forms.length===12&&
 liber.evidence.teacherDecision==='guardar-ambos'&&
 liber.evidence.vocabulaEntry==='f2f776558dba45b1');
assert.equal(liber.forms.find(f=>f.analysis==='genitivo singular').form,'libri');
assert.ok(!liber.forms.some(f=>['libera','liberum'].includes(f.form)));
assert.ok(!morphology.records.some(r=>r.id==='latin-adjetivo-reserva-liber-free'),
 'No publicar el adjetivo reservado como calificable');
const domus=morphology.records.find(r=>r.id==='latin-sustantivo-decision-domus');
assert.ok(domus&&domus.unit===7&&domus.gender==='femenino'&&
  domus.forms.length===19&&domus.evidence.teacherDecision==='conservar-variantes-documentadas'&&
  domus.evidence.vocabulaEntry==='b72308a83806b3f2');
assert.deepEqual(domus.forms.filter(f=>f.case==='locativo').map(f=>f.form),['domi','domui']);
assert.deepEqual(domus.forms.filter(f=>f.case==='genitivo'&&f.number==='plural')
  .map(f=>f.form),['domuum','domorum']);
assert.ok(domus.evidence.restrictedVariants['genitivo:singular:domi'].includes('arcaica'));
assert.ok(read('apps/morfologia/data/LICENSE-SUSTANTIVOS-GRIEGOS.md').includes('CC BY-SA 3.0'));
assert.ok(read('apps/morfologia/sw.js').includes("'./data/LICENSE-SUSTANTIVOS-GRIEGOS.md'"));
const vocabEndpoint=read('apps/vocabulario/config.js');
assert.ok(vocabEndpoint.includes('wpwlguufpkfnzlbyproe.supabase.co'));
const html=read('index.html');
assert.ok(!html.includes('ScholaClassica/docente/auth-config.json?enabled=true'));
assert.ok(!html.includes('<script src="https://'));
console.log('Preflight GitHub Pages: recursos, PWAs y autenticación docente desactivada — correcto');
