import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync,statSync} from 'node:fs';
import {resolve,join,sep} from 'node:path';
import {auditLegacyLiveRoutes,validateRouteSpec}
 from '../scripts/audit-live-legacy-routes.mjs';

const root=resolve(import.meta.dirname,'..');
const spec=JSON.parse(readFileSync(join(root,'config/retirada-rutas-publicas.json'),'utf8'));
const original=()=>structuredClone(spec);
const content=()=>{
 const pages=new Map();
 for(const r of spec.routes){
  pages.set(r.legacy,'<!doctype html><html lang="es"><head><title>'+
   r.markers.legacy+'</title></head><body>Aplicación original</body></html>');
  pages.set(r.integrated,'<!doctype html><html lang="es"><head><title>'+
   r.markers.integrated+'</title></head><body>ScholaClassica</body></html>');
 }
 for(const r of spec.integratedOnly)
  pages.set(r.integrated,'<!doctype html><html lang="es"><head><title>'+
   r.contains+'</title></head><body>ScholaClassica</body></html>');
 for(const c of spec.checks)
  pages.set(c.path,c.path.endsWith('.html')?
   '<html>'+c.contains.join('\n')+'</html>':c.contains.join('\n'));
 return pages;
};
function fakeFetch(pages,{redirect,missing}={}){
 return async href=>{
  const full=new URL(href),path=full.pathname+full.search;
  const body=pages.get(path);
  return {url:redirect?.[path]||href,status:missing===path||body===undefined?404:200,
   headers:{get:key=>key==='content-type'?'text/html':null},
   text:async()=>body||'Sin recurso'};
 };
}
test('La auditoría cubre rutas antiguas, módulos integrados y PWA sin declarar equivalencia de contenidos',async()=>{
 assert.equal(validateRouteSpec(spec),true);
 const report=await auditLegacyLiveRoutes(spec,{fetchImpl:fakeFetch(content())});
 assert.deepEqual(report.summary,{
  total:spec.routes.length+spec.integratedOnly.length+spec.checks.length,
  passed:spec.routes.length+spec.integratedOnly.length+spec.checks.length,
  failed:0,paired:18,integratedOnly:10,contentChecks:12
 });
 assert.equal(report.safeToArchive,false);
 assert.equal(report.safeToDelete,false);
 assert.equal(report.repositoryArchived,false);
 assert.equal(report.repositoryDeleted,false);
 assert.equal(report.autoPublish,false);
 const pathPairs=report.checks.filter(x=>x.kind==='redirectless-route-pair');
 assert.equal(pathPairs.length,18);
 assert.ok(pathPairs.some(x=>x.id==='appendix-valenciano-latin1'));
 assert.ok(pathPairs.some(x=>x.id==='vocabula-gramatica'));
 const checks=report.checks.filter(x=>x.kind==='content-marker');
 assert.equal(checks.length,12);
 assert.ok(checks.some(x=>x.id==='vocabula-progreso-gramatical'));
 assert.ok(checks.some(x=>x.id==='evolutio-cache-integrada-aislada'));
 assert.ok(checks.some(x=>x.id==='gramatica-cache-integrada-aislada'));
 assert.ok(checks.some(x=>x.id==='etymologicon-cache-integrada-aislada'));
 const alone=report.checks.filter(x=>x.kind==='integrated-only');
 assert.equal(alone.length,10);
 assert.ok(alone.some(x=>x.id==='schola-gramatica-latin4-ud8'));
 assert.ok(alone.some(x=>x.id==='schola-etymologicon-estudio'));
 assert.ok(report.limitations.some(x=>x.includes('equivalencia funcional')));
});
test('Caídas HTTP, falta de script de progreso y redirecciones hostiles no se certifican',async()=>{
 const paths=content();
 let result=await auditLegacyLiveRoutes(spec,{
  fetchImpl:fakeFetch(paths,{missing:'/VocabulaLatinaGraecaque/gramatica-progreso.js'})
 });
 assert.equal(result.summary.failed,1);
 assert.equal(result.checks.find(x=>x.id==='vocabula-progreso-gramatical').ok,false);
 paths.set('/EvolucionFonetica/sw.js','sin aislamiento de caché');
 result=await auditLegacyLiveRoutes(spec,{fetchImpl:fakeFetch(paths)});
 assert.equal(result.summary.failed,1);
 assert.deepEqual(result.checks.find(x=>x.id==='evolutio-cache-legada-aislada')
  .resource.missingMarkers,spec.checks.find(x=>x.id==='evolutio-cache-legada-aislada').contains);
 result=await auditLegacyLiveRoutes(spec,{fetchImpl:fakeFetch(content(),
  {redirect:{'/Appendix-grammaticae/':'https://ejemplo.es/otro'}})});
 assert.equal(result.summary.failed,1);
 assert.match(result.checks[0].legacy.error,/fuera del dominio/);
 result=await auditLegacyLiveRoutes(spec,{fetchImpl:fakeFetch(content(),
  {redirect:{'/Appendix-grammaticae/':
    'https://archaiosmagister.github.io/Appendix-grammaticae/curso.html'}})});
 assert.equal(result.summary.failed,1,'No aceptar cambio interno de destino silencioso');
 assert.match(result.checks[0].legacy.error,/fuera de la ruta esperada/);
 const wrong=content();
 const etym=spec.integratedOnly.find(x=>x.id==='schola-etymologicon-estudio');
 wrong.set(etym.integrated,'<html><title>Otra aplicación</title></html>');
 result=await auditLegacyLiveRoutes(spec,{fetchImpl:fakeFetch(wrong)});
 assert.equal(result.checks.find(x=>x.id===etym.id).ok,false);
 assert.deepEqual(result.checks.find(x=>x.id===etym.id).resource.missingMarkers,[etym.contains]);
});
test('Solo se admiten rutas fijadas a los tres legados y a ScholaClassica',()=>{
 for(const change of [
  s=>{s.origin='https://otro.example.com'},
  s=>{s.routes[0].legacy='https://evil.example.com/'},
  s=>{s.routes[0].legacy='//evil.example.com/Appendix-grammaticae/'},
  s=>{s.routes[0].legacy='/Appendix-grammaticae/../otro'},
  s=>{s.routes[0].legacy='/GeneradorExamenes/'},
  s=>{s.routes[0].integrated='/VocabulaLatinaGraecaque/'},
  s=>{s.checks[0].contains=[]},
  s=>{s.checks[0].id=s.routes[0].id},
  s=>{s.routes[0].markers.legacy=''},
  s=>{s.routes[1].markers.integrated=45},
  s=>{s.integratedOnly[0].integrated='/GeneradorExamenes/'},
  s=>{s.integratedOnly[1].integrated='https://malware.example/'},
  s=>{s.integratedOnly[0].contains=''},
  s=>{s.integratedOnly[0].id=s.routes[0].id}
 ]){
  const entry=original();change(entry);
  assert.throws(()=>validateRouteSpec(entry));
 }
});
test('Las URLs incorporadas reflejan la organización por curso y respetan los módulos',()=>{
 const ids=spec.routes.map(r=>r.id);
 assert.equal(ids.length,18);
 for(const id of [
  'appendix-latin1-ud10','appendix-latin2','appendix-griego1-ud5',
  'appendix-griego2','appendix-morfologia-latin','appendix-morfologia-griego',
  'appendix-valenciano-griego1','appendix-valenciano-griego-sintaxis',
  'vocabula-gramatica','evolutio-inicio'
 ])assert.ok(ids.includes(id),'No se audita '+id);
 assert.equal(spec.integratedOnly.length,10);
 assert.ok(spec.integratedOnly.every(r=>r.integrated.startsWith('/ScholaClassica/')));
 assert.ok(!JSON.stringify(spec).includes('/GeneradorExamenes/'));
 assert.equal(spec.checks.find(x=>x.id==='evolutio-cache-legada-aislada')
  .path,'/EvolucionFonetica/sw.js');
 assert.equal(spec.checks.find(x=>x.id==='evolutio-cache-integrada-aislada')
  .path,'/ScholaClassica/apps/evolucion-fonetica/sw.js');
});

// El monitor de URL no compila la plataforma: validar rutas reales solo en la CI principal,
// que construye dist antes de ejecutar esta batería. La auditoría HTTP sigue siendo independiente.
test('Todas las URL integradas responden a archivos reales del artefacto y al curso previsto',
 {skip:!existsSync(join(root,'dist/index.html'))},()=>{
 const dist=join(root,'dist');
 const pathInDist=(value)=>{
  const url=new URL(value,'https://archaiosmagister.github.io');
  assert.ok(url.pathname.startsWith('/ScholaClassica/'));
  const relative=url.pathname.slice('/ScholaClassica/'.length);
  const file=resolve(dist,relative+(url.pathname.endsWith('/')?'index.html':''));
  assert.ok(file.startsWith(dist+sep),'Ruta fuera del artefacto');
  assert.ok(existsSync(file)&&statSync(file).isFile(),value);
  return file;
 };
 for(const row of [...spec.routes,...spec.integratedOnly]){
  const file=pathInDist(row.integrated);
  const marker=row.markers?.integrated||row.contains;
  assert.ok(readFileSync(file,'utf8').includes(marker),
   'Página integrada ajena al módulo o mal identificada: '+row.id);
 }
 for(const row of spec.routes.filter(x=>x.id.startsWith('appendix-'))){
  const old=new URL(row.legacy,'https://archaiosmagister.github.io');
  const modern=new URL(row.integrated,'https://archaiosmagister.github.io');
  assert.equal(old.search,modern.search,'No alterar unidad, curso ni lengua: '+row.id);
  assert.equal(old.pathname.replace('/Appendix-grammaticae/',''),
   modern.pathname.replace('/ScholaClassica/apps/gramatica/',''),
   'La página del material de consulta debe conservar su ruta relativa');
 }
});
