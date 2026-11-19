// Auditoría HTTPS de equivalencia de todas las páginas antiguas de Appendix.
// Ejecutar solo en la rama temporal de retirada; no modifica webs ni datos.
import {execFileSync} from 'node:child_process';
import {writeFile,mkdir} from 'node:fs/promises';
import {join} from 'node:path';

const root='https://archaiosmagister.github.io';
const runner=process.env.RUNNER_TEMP;
if(!runner)throw Error('Solo se ejecuta en GitHub Actions, con clones espejo de auditoría');
const git=join(runner,'Appendix-grammaticae.git');
const source=execFileSync('git',['--git-dir='+git,'ls-tree','-r','--name-only','refs/heads/main'],{encoding:'utf8'});
const appendixPages=source.split('\n').filter(x=>/\.html$/i.test(x)).sort();
if(appendixPages.length!==90)throw Error('Inventario Appendix cambió: '+appendixPages.length+' páginas');
const checks=[
 ...appendixPages.map(p=>({area:'Appendix',path:p,
  old:root+'/Appendix-grammaticae/'+p,
  next:root+'/ScholaClassica/apps/gramatica/'+p})),
 {area:'Appendix',path:'/',old:root+'/Appendix-grammaticae/',next:root+'/ScholaClassica/apps/gramatica/index.html'},
 {area:'Appendix',path:'/val/',old:root+'/Appendix-grammaticae/val/',next:root+'/ScholaClassica/apps/gramatica/val/index.html'},
 {area:'Vocabula',path:'/',old:root+'/VocabulaLatinaGraecaque/',next:root+'/ScholaClassica/apps/vocabulario/index.html'},
 {area:'Vocabula',path:'gramatica.html',old:root+'/VocabulaLatinaGraecaque/gramatica.html',next:root+'/ScholaClassica/'},
 {area:'Evolutio',path:'/',old:root+'/EvolucionFonetica/',next:root+'/ScholaClassica/apps/evolucion-fonetica/index.html'}
];
const get=async url=>{
 for(let n=0;n<3;n++){
  try{
   const response=await fetch(url,{method:'GET',signal:AbortSignal.timeout(22000),redirect:'follow'});
   const contentType=response.headers.get('content-type')||'';
   // Leer completo para verificar que el servidor no entrega una página error.
   const body=await response.text();
   const ok=response.status===200&&/text\/html/i.test(contentType)&&
      /<html[\s>]/i.test(body)&&!/<title>\s*404\b/i.test(body);
   if((response.status>=500||response.status===429)&&n<2)continue;
   return {status:response.status,ok,type:contentType,bytes:Buffer.byteLength(body),
    targetUrl:response.url};
  }catch(e){
   if(n===2)return {status:'ERROR',ok:false,type:'',bytes:0,error:String(e).slice(0,200)};
  }
 }
 return {status:'ERROR',ok:false};
};
const report=[];
let nextIndex=0;
const worker=async()=>{
 while(true){
  const i=nextIndex++;
  if(i>=checks.length)return;
  const t=checks[i];
  const [oldResult,newResult]=await Promise.all([get(t.old),get(t.next)]);
  report[i]={...t,oldStatus:oldResult.status,oldOk:oldResult.ok,
   newStatus:newResult.status,newOk:newResult.ok,
   oldBytes:oldResult.bytes,newBytes:newResult.bytes,
   oldType:oldResult.type,newType:newResult.type,
   oldError:oldResult.error||null,newError:newResult.error||null};
 }
};
await Promise.all(Array.from({length:8},worker));
const summary={date:'2026-11-19',sourceHead:'40d06bff955087d81c5b3ab502422d77caf3186a',
 items:report.length,originalHTML:appendixPages.length,
 legacyOk:report.filter(x=>x.oldOk).length,
 integratedOk:report.filter(x=>x.newOk).length,
 bothOk:report.filter(x=>x.oldOk&&x.newOk).length,
 missing:report.filter(x=>!x.oldOk||!x.newOk)};
await mkdir('backups',{recursive:true});
await writeFile('backups/conciliacion-enlaces-exhaustiva.json',JSON.stringify({summary,links:report},null,2)+'\n');
await writeFile('backups/conciliacion-enlaces-exhaustiva.tsv',
 ['area\truta\tlegado\tnuevo\tHTTP legado\tHTTP integrado',
 ...report.map(x=>[x.area,x.path,x.old,x.next,x.oldStatus,x.newStatus].join('\t'))].join('\n')+'\n');
console.log(JSON.stringify(summary,null,2));
if(summary.missing.length)process.exitCode=1;
