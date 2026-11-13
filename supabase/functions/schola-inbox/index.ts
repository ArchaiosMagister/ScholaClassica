// ScholaClassica: consulta docente centralizada y estrictamente de solo lectura.
// Deploy previsto en el proyecto Supabase que aloje la identidad central.
import {createClient} from 'npm:@supabase/supabase-js@2.119.0';
import {authorizeVerifiedTeacher} from '../_shared/teacher-authorization.mjs';

const header={ 'content-type':'application/json; charset=utf-8','cache-control':'no-store','vary':'Origin' };
// El origen de GitHub Pages es público y compartido: NO otorga permisos.
// La autorización real exige Supabase Auth, UUID exacta y JWT AAL2.
function authorizedOrigin(){
  const configured=env('SCHOLA_ALLOWED_ORIGIN');
  try{
    const url=new URL(configured);
    return url.protocol==='https:'&&url.origin===configured&&url.pathname==='/'&&
      url.origin==='https://archaiosmagister.github.io'
      ?configured:null;
  }catch{return null}
}
const originAllowed=(origin:string|null)=>Boolean(authorizedOrigin())&&origin===authorizedOrigin();
function reply(status:number,data:unknown,origin:string|null){
  const cors=originAllowed(origin)?{'access-control-allow-origin':origin!}:{};
  return new Response(JSON.stringify(data),{status,headers:{...header,...cors}});
}
function env(name:string){return Deno.env.get(name)?.trim()||''}
function serverClient(url:string,key:string){
  return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
}
Deno.serve(async request=>{
  const origin=request.headers.get('origin');
  if(!originAllowed(origin))return reply(403,{error:'Origen no permitido'},null);
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{
    'access-control-allow-origin':origin!,
    'access-control-allow-methods':'POST, OPTIONS',
    'access-control-allow-headers':'authorization, apikey, x-client-info, content-type',
    'access-control-max-age':'600','vary':'Origin'
  }});
  if(request.method!=='POST')return reply(405,{error:'Método no admitido'},origin);
  const authUrl=env('SUPABASE_URL'),authKey=env('SUPABASE_ANON_KEY');
  const teacherId=env('SCHOLA_TEACHER_USER_ID');
  if(!authUrl||!authKey||!teacherId)return reply(503,{error:'Servicio no configurado'},origin);
  const value=request.headers.get('authorization')||'';
  const match=/^Bearer ([A-Za-z0-9._-]+)$/.exec(value);
  if(!match)return reply(401,{error:'Sesión necesaria'},origin);
  try{
    // getUser(token) pregunta a Supabase Auth: NO confiar solo en decodificar el JWT.
    const identity=serverClient(authUrl,authKey);
    const {data,error}=await identity.auth.getUser(match[1]);
    if(error||!authorizeVerifiedTeacher({
      verifiedUser:data?.user,accessToken:match[1],teacherUserId:teacherId
    }))return reply(403,{error:'Acceso docente no autorizado'},origin);

    const vocabUrl=env('VOCABULA_SUPABASE_URL');
    const vocabKey=env('VOCABULA_SERVICE_ROLE_KEY');
    const palabraUrl=env('PALABRA_SUPABASE_URL');
    const palabraKey=env('PALABRA_SERVICE_ROLE_KEY');
    if(!vocabUrl||!vocabKey||!palabraUrl||!palabraKey)
      return reply(503,{error:'Fuentes pendientes de configuración'},origin);
    const vocab=serverClient(vocabUrl,vocabKey);
    const palabra=serverClient(palabraUrl,palabraKey);
    // Consultas independientes y limitadas: ninguna escritura, ningún código o identificador de alumno.
    const [reports,proposals,courses]=await Promise.all([
      vocab.from('vocab_reports')
        .select('kind,subject,entry_form,message,status,created_at')
        .in('status',['pending','reviewing']).order('created_at',{ascending:false}).limit(100),
      palabra.from('word_proposals')
        .select('course_id,term,origin,definition,story,created_at')
        .eq('status','pending').order('created_at',{ascending:false}).limit(100),
      palabra.from('courses').select('id,name').limit(30)
    ]);
    if(reports.error||proposals.error||courses.error)
      return reply(502,{error:'No se han podido consultar todos los orígenes'},origin);
    const courseName=new Map((courses.data||[]).map((c:{id:string,name:string})=>[c.id,c.name]));
    const items=[
      ...(reports.data||[]).map((r:{
        kind:string,subject:string,entry_form:string,message:string,created_at:string
      })=>({
        source:'vocabula',title:r.entry_form||('Aviso de '+r.kind),
        course:r.subject,summary:(r.message||'').slice(0,1200),created_at:r.created_at
      })),
      ...(proposals.data||[]).map((p:{
        course_id:string,term:string,origin:string,definition:string,story:string,created_at:string
      })=>({
        source:'palabra',title:p.term,course:courseName.get(p.course_id)||'Curso',
        summary:[p.origin,p.definition,p.story].filter(Boolean).join(' · ').slice(0,1200),created_at:p.created_at
      }))
    ].sort((a,b)=>Date.parse(b.created_at)-Date.parse(a.created_at));
    return reply(200,{authorized:true,items,limitedTo:100},origin);
  }catch{
    return reply(503,{error:'Servicio docente temporalmente no disponible'},origin);
  }
});
