// Área docente central: gestión de Vocabula sin reutilizar sus códigos de profesor.
// NINGUNA operación de escritura se admite sin Supabase Auth UUID exacta y AAL2.
import {createClient} from 'npm:@supabase/supabase-js@2.119.0';
import {authorizeVerifiedTeacher} from '../_shared/teacher-authorization.mjs';
import {
  validateWordInput,validateReportReview,validateReportFilter
} from '../_shared/vocab-admin-policy.mjs';

const ORIGIN='https://archaiosmagister.github.io';
const env=(name:string)=>Deno.env.get(name)?.trim()||'';
const baseHeaders={'content-type':'application/json; charset=utf-8',
  'cache-control':'no-store','referrer-policy':'no-referrer',
  'x-content-type-options':'nosniff','vary':'Origin'};
function reply(status:number,data:unknown,origin:string|null){
  const cors=origin===ORIGIN?{'access-control-allow-origin':ORIGIN}:{};
  return new Response(JSON.stringify(data),{status,headers:{...baseHeaders,...cors}});
}
function client(url:string,key:string){
  return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
}
Deno.serve(async request=>{
  const origin=request.headers.get('origin');
  if(env('SCHOLA_ALLOWED_ORIGIN')!==ORIGIN||origin!==ORIGIN)
    return reply(403,{error:'Origen no permitido'},null);
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{
    'access-control-allow-origin':ORIGIN,'access-control-allow-methods':'POST, OPTIONS',
    'access-control-allow-headers':'authorization, apikey, content-type, x-client-info',
    'access-control-max-age':'600','vary':'Origin'}});
  if(request.method!=='POST')return reply(405,{error:'Método no permitido'},origin);
  if(Number(request.headers.get('content-length')||0)>12000)
    return reply(413,{error:'Solicitud demasiado grande'},origin);
  const authUrl=env('SUPABASE_URL'),anonKey=env('SUPABASE_ANON_KEY');
  const teacherId=env('SCHOLA_TEACHER_USER_ID');
  const vocabUrl=env('VOCABULA_SUPABASE_URL'),vocabKey=env('VOCABULA_SERVICE_ROLE_KEY');
  if(!authUrl||!anonKey||!teacherId||!vocabUrl||!vocabKey)
    return reply(503,{error:'Función todavía no activada'},origin);
  const match=/^Bearer ([A-Za-z0-9._-]+)$/.exec(request.headers.get('authorization')||'');
  if(!match)return reply(401,{error:'Inicio de sesión requerido'},origin);
  try{
    const verified=await client(authUrl,anonKey).auth.getUser(match[1]);
    if(verified.error||!authorizeVerifiedTeacher({
      verifiedUser:verified.data?.user,accessToken:match[1],teacherUserId:teacherId
    }))return reply(403,{error:'Acceso docente no autorizado'},origin);
    const raw=await request.text();
    if(raw.length>12000)return reply(413,{error:'Solicitud demasiado grande'},origin);
    let body;
    try{body=JSON.parse(raw)}catch{return reply(400,{error:'Solicitud inválida'},origin)}
    if(!body||typeof body!=='object'||Array.isArray(body))
      return reply(400,{error:'Solicitud inválida'},origin);
    const db=client(vocabUrl,vocabKey);
    if(body.action==='words.list'){
      const offset=body.offset??0;
      if(!Number.isSafeInteger(offset)||offset<0||offset>100000)
        return reply(400,{error:'Página no válida'},origin);
      const result=await db.from('vocab_words')
        .select('id,subject,form,meaning,answers,units,in_exam,active,created_at,updated_at')
        .order('created_at',{ascending:true}).range(offset,offset+99);
      if(result.error)return reply(502,{error:'No se pudo obtener el vocabulario'},origin);
      return reply(200,{words:result.data||[],offset,hasMore:(result.data||[]).length===100},origin);
    }
    if(body.action==='words.save'){
      const valid=validateWordInput(body);
      if(!valid)return reply(400,{error:'Datos de palabra inválidos'},origin);
      const query=valid.id
        ?db.from('vocab_words').update(valid.payload).eq('id',valid.id)
        :db.from('vocab_words').insert(valid.payload);
      const result=await query.select('id,subject,form,meaning,answers,units,in_exam,active').maybeSingle();
      if(result.error||!result.data)return reply(409,{error:'No se ha podido guardar la palabra'},origin);
      return reply(200,{saved:true,word:result.data},origin);
    }
    if(body.action==='reports.list'){
      const filter=validateReportFilter(body);
      if(!filter)return reply(400,{error:'Filtro no válido'},origin);
      let query=db.from('vocab_reports').select(
        'id,kind,subject,mode,units,entry_form,message,status,teacher_note,created_at'
      ).order('created_at',{ascending:false}).range(filter.offset,filter.offset+49);
      if(filter.status)query=query.eq('status',filter.status);
      const result=await query;
      if(result.error)return reply(502,{error:'No se pudieron consultar los avisos'},origin);
      return reply(200,{reports:result.data||[],offset:filter.offset,
        hasMore:(result.data||[]).length===50},origin);
    }
    if(body.action==='reports.review'){
      const valid=validateReportReview(body);
      if(!valid)return reply(400,{error:'Revisión no válida'},origin);
      const result=await db.from('vocab_reports')
        .update({status:valid.status,teacher_note:valid.teacher_note})
        .eq('id',valid.id).select('id,status,teacher_note').maybeSingle();
      if(result.error||!result.data)return reply(404,{error:'Aviso no encontrado'},origin);
      return reply(200,{saved:true,report:result.data},origin);
    }
    return reply(400,{error:'Acción no reconocida'},origin);
  }catch{
    return reply(503,{error:'Gestión docente temporalmente no disponible'},origin);
  }
});
