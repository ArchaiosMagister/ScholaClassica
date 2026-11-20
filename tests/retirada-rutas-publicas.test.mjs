import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {auditLegacyLiveRoutes,validateRouteSpec}
 from '../scripts/audit-live-legacy-routes.mjs';

const root=resolve(import.meta.dirname,'..');
const spec=JSON.parse(readFileSync(join(root,'config/retirada-rutas-publicas.json'),'utf8'));
const original=()=>structuredClone(spec);
const content=()=>{
 const pages=new Map();
 for(const r of spec.routes){
  for(const path of [r.legacy,r.integrated])
   pages.set(path,'<!doctype html><html lang="es"><head></head><body>Aplicación verificable</body></html>');
 }
 for(const c of spec.checks)pages.set(c.path,c.path.endsWith('.html')?'<html>'+c.contains.join('\n')+'</html>':c.contains.join('\n'));
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
test('La auditoría tiene ocho pares de URLs y ocho controles de caché, aviso y progreso',async()=>{
 assert.equal(validateRouteSpec(spec),true);
 const report=await auditLegacyLiveRoutes(spec,{fetchImpl:fakeFetch(content())});
 assert.deepEqual(report.summary,{total:16,passed:16,failed:0});
 assert.equal(report.safeToArchive,false);
 assert.equal(report.safeToDelete,false);
 assert.equal(report.repositoryArchived,false);
 assert.equal(report.repositoryDeleted,false);
 assert.equal(report.autoPublish,false);
 const pathPairs=report.checks.filter(x=>x.kind==='redirectless-route-pair');
 assert.equal(pathPairs.length,8);
 assert.ok(pathPairs.some(x=>x.id==='appendix-valenciano-latin1'));
 assert.ok(pathPairs.some(x=>x.id==='vocabula-gramatica'));
 const checks=report.checks.filter(x=>x.kind==='content-marker');
 assert.equal(checks.length,8);
 assert.ok(checks.some(x=>x.id==='vocabula-progreso-gramatical'));
 assert.ok(checks.some(x=>x.id==='evolutio-cache-integrada-aislada'));
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
  s=>{s.checks[0].id=s.routes[0].id}
 ]){
  const entry=original();change(entry);
  assert.throws(()=>validateRouteSpec(entry));
 }
});
test('Las URLs de migración están declaradas, sin URLs inventadas de borrado',()=>{
 const routes=spec.routes.map(x=>x.id);
 assert.deepEqual(routes,[
  'appendix-inicio','appendix-latin1-ud1','appendix-sintaxis-latin',
  'appendix-griego-sintaxis','appendix-valenciano-latin1',
  'evolutio-inicio','vocabula-inicio','vocabula-gramatica'
 ]);
 assert.equal(spec.checks.find(x=>x.id==='evolutio-cache-legada-aislada')
  .path,'/EvolucionFonetica/sw.js');
 assert.equal(spec.checks.find(x=>x.id==='evolutio-cache-integrada-aislada')
  .path,'/ScholaClassica/apps/evolucion-fonetica/sw.js');
});
