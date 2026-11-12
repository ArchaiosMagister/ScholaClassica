// Política de entrada. Debe combinarse siempre con la verificación de Cloudflare
// y el servicio Supabase Auth; ninguno de estos filtros autentica por sí solo.
export const TEACHER_USERNAME='MagisterArchaios';
export function allowedTeacherOrigin(raw){
  if(typeof raw!=='string')return null;
  try{
    const url=new URL(raw);
    if(url.protocol!=='https:'||url.port||raw!==url.origin||
      url.hostname==='archaiosmagister.github.io'||
      url.hostname==='localhost'||url.hostname==='127.0.0.1')return null;
    return url.origin;
  }catch{return null}
}
export function validTeacherLogin(body){
  return body!==null&&typeof body==='object'&&!Array.isArray(body)&&
    body.username===TEACHER_USERNAME&&typeof body.password==='string'&&
    body.password.length>=12&&body.password.length<=256&&
    typeof body.turnstileToken==='string'&&
    body.turnstileToken.length>=10&&body.turnstileToken.length<=2048;
}
export function authorizedInitialSession(user,session,teacherId){
  return Boolean(teacherId&&user?.id&&user.id===teacherId&&
    user.is_anonymous!==true&&session?.access_token&&session?.refresh_token);
}
