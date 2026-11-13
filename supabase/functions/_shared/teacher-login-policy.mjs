// Política de entrada exclusiva para GitHub Pages. La comprobación de Origin no
// es autorización: contraseña, UUID docente y TOTP se validan en Supabase.
export const TEACHER_USERNAME='MagisterArchaios';
export function allowedTeacherOrigin(raw){
  if(typeof raw!=='string')return null;
  try{
    const url=new URL(raw);
    if(url.protocol!=='https:'||url.port||raw!==url.origin||
      url.origin!=='https://archaiosmagister.github.io')return null;
    return url.origin;
  }catch{return null}
}
export function validTeacherLogin(body){
  return body!==null&&typeof body==='object'&&!Array.isArray(body)&&
    body.username===TEACHER_USERNAME&&typeof body.password==='string'&&
    body.password.length>=12&&body.password.length<=256;
}
export function authorizedInitialSession(user,session,teacherId){
  return Boolean(teacherId&&user?.id&&user.id===teacherId&&
    user.is_anonymous!==true&&session?.access_token&&session?.refresh_token);
}
