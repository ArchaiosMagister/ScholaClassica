// Gestión de Vocabula desde ScholaClassica (mismo proyecto de Auth y datos).
// Las operaciones se ejecutan exclusivamente después de getUser + UUID docente + aal2.
// El navegador NUNCA recibe ni utiliza la clave de servicio.
import {createClient} from 'npm:@supabase/supabase-js@2.119.0';
import {authorizeVerifiedTeacher} from '../_shared/teacher-authorization.mjs';
import {
  validateWordInput,validateWordFilter,validateReportReview,validateReportFilter
} from '../_shared/vocab-admin-policy.mjs';

const ORIGIN='https://archaiosmagister.github.io';
const env=(name:string)=>Deno.env.get(name)?.trim()||'';
const publicHeaders={
  'content-type':'application/json; charset=utf-8','cache-control':'no-store',
  'x-content-type-options':'nosniff','referrer-policy':'no-referrer','vary':'Origin'
};
function reply(status:number,data:unknown,origin:string|null){
  const headers=origin===ORIGIN?
    {...publicHeaders,'access-control-allow-origin':ORIGIN}:publicHeaders;
  return new Response(JSON.stringify(data),{status,headers});
}
const client=(url:string,key:string)=>createClient(url,key,{
  auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}
});
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
  if(Number(request.headers.get('content-length')||0)>12000)
    return reply(413,{error:'Solicitud demasiado grande'},origin);

  const authUrl=env('SUPABASE_URL'),publicKey=env('SUPABASE_ANON_KEY'),
    secretKey=env('SUPABASE_SERVICE_ROLE_KEY'),teacherId=env('SCHOLA_TEACHER_USER_ID');
  if(!authUrl||!publicKey||!secretKey||!teacherId)
    return reply(503,{error:'Administración no configurada'},origin);
  const match=/^Bearer ([A-Za-z0-9._-]+)$/.exec(request.headers.get('authorization')||'');
  if(!match)return reply(401,{error:'Sesión docente requerida'},origin);
  try{
    const auth=client(authUrl,publicKey);
    const verified=await auth.auth.getUser(match[1]);
    if(verified.error||!authorizeVerifiedTeacher({
      verifiedUser:verified.data?.user,accessToken:match[1],teacherUserId:teacherId
    }))return reply(403,{error:'Identidad o segundo factor no autorizado'},origin);
    // Comprobar también el nivel actual frente al servicio Auth y no depender
    // exclusivamente de las afirmaciones del JWT decodificado.
    const assurance=await auth.auth.mfa.getAuthenticatorAssuranceLevel(match[1]);
    if(assurance.error||assurance.data?.currentLevel!=='aal2')
      return reply(403,{error:'Segundo factor requerido'},origin);

    const raw=await request.text();
    if(raw.length>12000)return reply(413,{error:'Solicitud demasiado grande'},origin);
    let body:Record<string,unknown>;
    try{body=JSON.parse(raw)}catch{return reply(400,{error:'Solicitud inválida'},origin)}
    if(!body||typeof body!=='object'||Array.isArray(body))
      return reply(400,{error:'Solicitud inválida'},origin);
    const db=client(authUrl,secretKey);
    if(body.action==='words.list'){
      const filter=validateWordFilter(body);
      if(!filter)return reply(400,{error:'Filtro no válido'},origin);
      let query=db.from('vocab_words')
        .select('id,subject,form,meaning,answers,units,in_exam,active,created_at,updated_at')
        .order('created_at',{ascending:true}).order('id',{ascending:true})
        .range(filter.offset,filter.offset+filter.pageSize);
      if(filter.subject)query=query.eq('subject',filter.subject);
      if(filter.search)query=query.or(
        'form.ilike.%'+filter.search+'%,meaning.ilike.%'+filter.search+'%');
      const found=await query;
      if(found.error)return reply(502,{error:'Error consultando las palabras'},origin);
      const rows=found.data||[];
      return reply(200,{words:rows.slice(0,filter.pageSize),
        offset:filter.offset,more:rows.length>filter.pageSize},origin);
    }
    if(body.action==='words.save'){
      const valid=validateWordInput(body);
      if(!valid)return reply(400,{error:'Datos de palabra inválidos'},origin);
      const record={...valid.payload,updated_at:new Date().toISOString()};
      const change=valid.id
        ?db.from('vocab_words').update(record).eq('id',valid.id)
        :db.from('vocab_words').insert(record);
      const saved=await change.select('id,subject,form,meaning,answers,units,in_exam,active,updated_at').maybeSingle();
      if(saved.error?.code==='23505')
        return reply(409,{error:'Ya existe una palabra con esa forma en esta asignatura; edítala en la lista'},origin);
      if(saved.error)return reply(502,{error:'No se ha podido guardar la palabra'},origin);
      if(!saved.data)return reply(404,{error:'Palabra no encontrada'},origin);
      return reply(200,{saved:true,word:saved.data},origin);
    }
    if(body.action==='reports.list'){
      const filter=validateReportFilter(body);
      if(!filter)return reply(400,{error:'Filtro no válido'},origin);
      let query=db.from('vocab_reports').select(
        'id,kind,subject,mode,units,entry_id,entry_form,message,status,teacher_note,created_at'
      ).order('created_at',{ascending:false}).order('id',{ascending:false})
        .range(filter.offset,filter.offset+filter.pageSize);
      if(filter.status)query=query.eq('status',filter.status);
      if(filter.area==='grammar')query=query.like('entry_id','grammar:%');
      if(filter.area==='vocabula')query=query.not('entry_id','like','grammar:%');
      const found=await query;
      if(found.error)return reply(502,{error:'No se pudieron cargar las incidencias'},origin);
      const rows=found.data||[];
      return reply(200,{reports:rows.slice(0,filter.pageSize),
        offset:filter.offset,more:rows.length>filter.pageSize},origin);
    }
    if(body.action==='reports.review'){
      const valid=validateReportReview(body);
      if(!valid)return reply(400,{error:'Revisión inválida'},origin);
      const changed=await db.from('vocab_reports')
        .update({status:valid.status,teacher_note:valid.teacher_note})
        .eq('id',valid.id).select('id,status,teacher_note').maybeSingle();
      if(changed.error)return reply(502,{error:'No se ha podido revisar la incidencia'},origin);
      if(!changed.data)return reply(404,{error:'Incidencia no encontrada'},origin);
      return reply(200,{saved:true,report:changed.data},origin);
    }
    return reply(400,{error:'Operación no reconocida'},origin);
  }catch{
    return reply(503,{error:'Administración temporalmente no disponible'},origin);
  }
});
