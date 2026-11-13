// Consulta de Palabra del día DESDE su propio proyecto Supabase.
// Acceso concedido exclusivamente a la cuenta de ScholaClassica con JWT AAL2.
// No se expone ni se comparte ninguna clave administrativa entre proyectos.
// verify_jwt=false: el token procede de OTRO proyecto y se verifica con getUser().
import {createClient} from 'npm:@supabase/supabase-js@2.119.0';
import {authorizeVerifiedTeacher} from '../_shared/teacher-authorization.mjs';

const ORIGIN='https://archaiosmagister.github.io';
const IDENTITY_URL='https://wpwlguufpkfnzlbyproe.supabase.co';
const IDENTITY_PUBLISHABLE='sb_publishable_71JJZAqQGphmEjfnGIk8GQ_kAmltORO';
// Huella de la UUID docente; la UUID no se incluye en los archivos públicos.
const TEACHER_FINGERPRINT='29c63cb2d79840a4c1ea6b16dac9d641449da3ab0b995aef86bdee2ac4aa74c1';
const jsonHeaders={
  'content-type':'application/json; charset=utf-8',
  'cache-control':'no-store','referrer-policy':'no-referrer',
  'x-content-type-options':'nosniff','vary':'Origin'
};
function reply(status:number,data:unknown,origin:string|null){
  const cors=origin===ORIGIN?{'access-control-allow-origin':ORIGIN}:{};
  return new Response(JSON.stringify(data),{status,headers:{...jsonHeaders,...cors}});
}
const client=(url:string,key:string)=>createClient(url,key,{
  auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}
});
async function teacherFingerprintMatches(id:string){
  if(typeof id!=='string'||id.length!==36)return false;
  const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(id));
  const hex=Array.from(new Uint8Array(bytes),v=>v.toString(16).padStart(2,'0')).join('');
  return hex===TEACHER_FINGERPRINT;
}
Deno.serve(async request=>{
  const origin=request.headers.get('origin');
  if(origin!==ORIGIN)return reply(403,{error:'Origen no permitido'},null);
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{
    'access-control-allow-origin':ORIGIN,
    'access-control-allow-methods':'POST, OPTIONS',
    'access-control-allow-headers':'authorization, apikey, content-type, x-client-info',
    'access-control-max-age':'600','vary':'Origin'
  }});
  if(request.method!=='POST')return reply(405,{error:'Método no permitido'},origin);
  const match=/^Bearer ([A-Za-z0-9._-]+)$/.exec(request.headers.get('authorization')||'');
  if(!match)return reply(401,{error:'Sesión requerida'},origin);
  try{
    // La firma, caducidad y revocación se verifican en Supabase Auth,
    // nunca aceptamos el JWT por mera decodificación.
    const identity=await client(IDENTITY_URL,IDENTITY_PUBLISHABLE).auth.getUser(match[1]);
    const user=identity.data?.user;
    if(identity.error||!user||!(await teacherFingerprintMatches(user.id))||
        !authorizeVerifiedTeacher({verifiedUser:user,accessToken:match[1],teacherUserId:user.id}))
      return reply(403,{error:'Acceso docente no autorizado'},origin);
    const url=Deno.env.get('SUPABASE_URL')?.trim();
    const key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.trim();
    if(!url||!key)return reply(503,{error:'Fuente no configurada'},origin);
    const db=client(url,key);
    const [proposals,courses]=await Promise.all([
      db.from('word_proposals')
        .select('course_id,term,origin,definition,story,created_at')
        .eq('status','pending').order('created_at',{ascending:false}).limit(101),
      db.from('courses').select('id,name').limit(30)
    ]);
    if(proposals.error||courses.error)
      return reply(502,{error:'No se pudieron consultar las propuestas'},origin);
    const courseNames=new Map((courses.data||[]).map(
      (c:{id:string,name:string})=>[c.id,c.name]));
    const all=proposals.data||[];
    const items=all.slice(0,100).map((p:{
      course_id:string,term:string,origin:string,definition:string,story:string,created_at:string
    })=>({
      source:'palabra',
      title:String(p.term||'Palabra propuesta').slice(0,180),
      course:String(courseNames.get(p.course_id)||'Curso').slice(0,100),
      summary:[p.origin,p.definition,p.story].filter(Boolean).join(' · ').slice(0,1200),
      created_at:p.created_at
    }));
    return reply(200,{authorized:true,source:'palabra',items,hasMore:all.length>100},origin);
  }catch{
    return reply(503,{error:'Servicio de propuestas temporalmente no disponible'},origin);
  }
});
