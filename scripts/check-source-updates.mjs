// Avisos de actualización para los repositorios integrados.
// Solo lee GitHub. La creación/actualización del aviso ocurre exclusivamente
// en el repositorio ScholaClassica, sin cambiar fuentes, SHAs ni despliegues.
import {readFile,appendFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
const HOME='ArchaiosMagister/ScholaClassica';
const ISSUE_TITLE='[Fuentes] Revisar cambios pendientes de integración';
const root=resolve(import.meta.dirname,'..');
const API='https://api.github.com';
const headers=token=>({
  'Accept':'application/vnd.github+json',
  'X-GitHub-Api-Version':'2022-11-28',
  'User-Agent':'ScholaClassica-source-audit',
  ...(token?{'Authorization':'Bearer '+token}:{})
});
export function analyzeSources(lock,heads){
  if(!lock||typeof lock!=='object'||!lock.sources)throw Error('Lock de fuentes ilegible');
  return Object.entries(lock.sources)
    .filter(([,source])=>source.integrated===true)
    .map(([id,source])=>{
      if(!/^[\w.-]+\/[\w.-]+$/.test(source.repository)||!/^[a-f0-9]{40}$/.test(source.sha))
        throw Error('Registro de fuente inválido: '+id);
      const current=heads[source.repository];
      if(!/^[a-f0-9]{40}$/.test(current||''))throw Error('Falta commit remoto: '+source.repository);
      return {id,repository:source.repository,locked:source.sha,current,
        outdated:current!==source.sha};
    });
}
export function sourceReport(rows){
  const changes=rows.filter(r=>r.outdated);
  const title=changes.length?
    'Revisión pendiente de '+changes.length+' fuente'+(changes.length!==1?'s':''):
    'Todas las fuentes integradas están actualizadas';
  const lines=[
    '# Comprobación de fuentes de ScholaClassica','',
    '**'+title+'**. El estado no desencadena importaciones ni publicaciones.','',
    '| Fuente | Versión fijada | Última en main | Estado |',
    '| --- | --- | --- | --- |',
    ...rows.map(r=>'| '+r.repository+' | `'+r.locked.slice(0,12)+'` | `'+r.current.slice(0,12)+'` | '+(r.outdated?'Revisar':'Coincide')+' |'),
    '',changes.length?
      'Los cambios deben revisarse filológica y funcionalmente antes de actualizar config/sources.lock.json.':
      'No hay nuevas versiones pendientes de las fuentes integradas.',
    '','**No** se modifica GeneradorExamenes, Palabra del día, los repositorios originales ni el portal docente.'
  ];
  return lines.join('\n')+'\n';
}
async function request(url,{token,method='GET',body}={}){
  const response=await fetch(url,{
    method,headers:{...headers(token),...(body?{'Content-Type':'application/json'}:{})},
    ...(body?{body:JSON.stringify(body)}:{})
  });
  if(!response.ok)throw Error('GitHub '+response.status+' en '+new URL(url).pathname);
  return response.json();
}
export async function auditSources({token=process.env.GITHUB_TOKEN,repo=process.env.GITHUB_REPOSITORY,
  writeIssue=process.env.SCHOLA_WATCH_ISSUE==='true'}={}){
  const lock=JSON.parse(await readFile(join(root,'config/sources.lock.json'),'utf8'));
  const names=[...new Set(Object.values(lock.sources)
    .filter(src=>src.integrated===true).map(src=>src.repository))];
  const heads={};
  for(const name of names){
    if(!/^[\w.-]+\/[\w.-]+$/.test(name))throw Error('Nombre de repositorio no permitido');
    const ref=await request(API+'/repos/'+name+'/branches/main',{token});
    heads[name]=ref.commit?.sha;
  }
  const rows=analyzeSources(lock,heads);
  const markdown=sourceReport(rows);
  if(process.env.GITHUB_STEP_SUMMARY)
    await appendFile(process.env.GITHUB_STEP_SUMMARY,markdown);
  if(writeIssue){
    if(repo!==HOME||!token)throw Error('Publicar avisos exige token y repositorio autorizado');
    const open=await request(API+'/repos/'+HOME+'/issues?state=open&per_page=100',{token});
    const existing=open.find(issue=>issue.title===ISSUE_TITLE&&!issue.pull_request);
    if(rows.some(row=>row.outdated)){
      const issueBody=markdown+'\nActualización automática de este aviso; ninguna fuente fue modificada.';
      if(existing){
        if(existing.body!==issueBody)
          await request(API+'/repos/'+HOME+'/issues/'+existing.number,{
            token,method:'PATCH',body:{body:issueBody}
          });
      }else{
        await request(API+'/repos/'+HOME+'/issues',{
          token,method:'POST',body:{title:ISSUE_TITLE,body:issueBody}
        });
      }
    }else if(existing){
      // Cuando la conciliación termina, cerramos solo el aviso automatizado.
      await request(API+'/repos/'+HOME+'/issues/'+existing.number,{
        token,method:'PATCH',body:{state:'closed',state_reason:'completed'}
      });
    }
  }
  return {rows,markdown};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  auditSources().then(({markdown})=>process.stdout.write(markdown))
    .catch(error=>{console.error('Auditoría de fuentes: '+error.message);process.exitCode=1});
}
