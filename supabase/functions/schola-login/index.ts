// Primer factor del docente: el correo es secreto de la función, nunca del navegador.
// Debe desplegarse con verify_jwt=false; exige CAPTCHA verificado por servidor.
// La sesión resultante es AAL1 y NO autoriza a leer avisos.
import {createClient} from 'npm:@supabase/supabase-js@2.119.0';
import {
  allowedTeacherOrigin,validTeacherLogin,turnstileAccepted,authorizedInitialSession
} from '../_shared/teacher-login-policy.mjs';

function env(name:string){return Deno.env.get(name)?.trim()||''}
function reply(status:number,data:unknown,origin:string|null){
  const headers:Record<string,string>={
    'content-type':'application/json; charset=utf-8',
    'cache-control':'no-store','referrer-policy':'no-referrer',
    'x-content-type-options':'nosniff','vary':'Origin'
  };
  if(origin)headers['access-control-allow-origin']=origin;
  return new Response(JSON.stringify(data),{status,headers});
}
Deno.serve(async request=>{
  const permitted=allowedTeacherOrigin(env('SCHOLA_ALLOWED_ORIGIN'));
  const origin=request.headers.get('origin');
  if(!permitted||origin!==permitted)
    return reply(403,{error:'Acceso no permitido'},null);
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{
    'access-control-allow-origin':permitted,
    'access-control-allow-methods':'POST, OPTIONS',
    'access-control-allow-headers':'authorization, apikey, x-client-info, content-type',
    'access-control-max-age':'600','vary':'Origin'
  }});
  if(request.method!=='POST')return reply(405,{error:'Método no admitido'},permitted);
  if(Number(request.headers.get('content-length')||0)>4096)
    return reply(413,{error:'Solicitud demasiado grande'},permitted);
  const userId=env('SCHOLA_TEACHER_USER_ID');
  const loginEmail=env('SCHOLA_AUTH_LOGIN_EMAIL');
  const turnstileSecret=env('SCHOLA_TURNSTILE_SECRET');
  const authUrl=env('SUPABASE_URL');
  const authKey=env('SUPABASE_ANON_KEY');
  if(!userId||!loginEmail||!turnstileSecret||!authUrl||!authKey)
    return reply(503,{error:'Servicio de acceso no configurado'},permitted);
  try{
    const raw=await request.text();
    if(raw.length>4096)return reply(413,{error:'Solicitud demasiado grande'},permitted);
    const body=JSON.parse(raw);
    if(!validTeacherLogin(body))
      return reply(401,{error:'Credenciales no válidas'},permitted);
    const captchaResponse=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{
      method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},
      body:new URLSearchParams({secret:turnstileSecret,response:body.turnstileToken}),
      signal:AbortSignal.timeout(8000)
    });
    if(!captchaResponse.ok)return reply(503,{error:'Verificación no disponible'},permitted);
    const captcha=await captchaResponse.json();
    if(!turnstileAccepted(captcha,permitted))
      return reply(403,{error:'Verificación de seguridad no superada'},permitted);
    // Cliente sin clave privilegiada: todas las peticiones se autentican con Auth.
    const auth=createClient(authUrl,authKey,{
      auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}
    });
    const login=await auth.auth.signInWithPassword({
      email:loginEmail,password:body.password
    });
    if(login.error||!authorizedInitialSession(login.data?.user,login.data?.session,userId))
      return reply(401,{error:'Credenciales no válidas'},permitted);
    const session=login.data.session;
    return reply(200,{
      access_token:session.access_token,
      refresh_token:session.refresh_token
    },permitted);
  }catch{
    // No registrar ni devolver contraseñas, códigos o respuestas privadas.
    return reply(503,{error:'Acceso temporalmente no disponible'},permitted);
  }
});
