// Bandeja de avisos de Vocabula, desde su proyecto de identidad compartido.
// Lectura exclusivamente tras verificar JWT, UUID docente exacta y AAL2.
// Palabra del día se consulta por su propia Edge Function sin compartir claves.
import {createClient} from 'npm:@supabase/supabase-js@2.119.0';
import {authorizeVerifiedTeacher} from '../_shared/teacher-authorization.mjs';

const ORIGIN='https://archaiosmagister.github.io';
const header={'content-type':'application/json; charset=utf-8',
  'cache-control':'no-store','referrer-policy':'no-referrer','vary':'Origin'};
function reply(status:number,data:unknown,origin:string|null){
  const cors=origin===ORIGIN?{'access-control-allow-origin':ORIGIN}:{};
  return new Response(JSON.stringify(data),{status,headers:{...header,...cors}});
}
const env=(name:string)=>Deno.env.get(name)?.trim()||'';
const client=(url:string,key:string)=>createClient(url,key,{
  auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}
});
Deno.serve(async request=>{
  const origin=request.headers.get('origin');
  if(origin!==ORIGIN)return reply(403,{error:'Origen no permitido'},null);
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{
    'access-control-allow-origin':ORIGIN,'access-control-allow-methods':'POST, OPTIONS',
    'access-control-allow-headers':'authorization, apikey, x-client-info, content-type',
    'access-control-max-age':'600','vary':'Origin'
  }});
  if(request.method!=='POST')return reply(405,{error:'Método no permitido'},origin);
  const url=env('SUPABASE_URL'),anonKey=env('SUPABASE_ANON_KEY');
  const teacherId=env('SCHOLA_TEACHER_USER_ID');
  if(!url||!anonKey||!teacherId)return reply(503,{error:'Servicio no configurado'},origin);
  const match=/^Bearer ([A-Za-z0-9._-]+)$/.exec(request.headers.get('authorization')||'');
  if(!match)return reply(401,{error:'Inicio de sesión requerido'},origin);
  try{
    const verified=await client(url,anonKey).auth.getUser(match[1]);
    if(verified.error||!authorizeVerifiedTeacher({
      verifiedUser:verified.data?.user,accessToken:match[1],teacherUserId:teacherId
    }))return reply(403,{error:'Acceso docente no autorizado'},origin);
    // Nunca se devuelve la clave de servicio ni datos de identificación de alumnos.
    const serviceKey=env('SUPABASE_SERVICE_ROLE_KEY');
    if(!serviceKey)return reply(503,{error:'Bandeja no configurada'},origin);
    const result=await client(url,serviceKey).from('vocab_reports')
      .select('kind,subject,entry_form,message,status,created_at')
      .in('status',['pending','reviewing'])
      .order('created_at',{ascending:false}).limit(101);
    if(result.error)return reply(502,{error:'Error al consultar avisos'},origin);
    const all=result.data||[];
    const items=all.slice(0,100).map((r:{
      kind:string,subject:string,entry_form:string,message:string,status:string,created_at:string
    })=>({
      source:'vocabula',title:String(r.entry_form||('Aviso de '+r.kind)).slice(0,180),
      course:String(r.subject||'Asignatura').slice(0,80),
      summary:String(r.message||'').slice(0,1200),
      created_at:r.created_at
    }));
    return reply(200,{authorized:true,source:'vocabula',items,hasMore:all.length>100},origin);
  }catch{
    return reply(503,{error:'Bandeja temporalmente no disponible'},origin);
  }
});
