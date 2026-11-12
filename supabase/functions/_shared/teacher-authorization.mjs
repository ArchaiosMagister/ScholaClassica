// Verificación final de los claims SOLO DESPUÉS de getUser(token) en el servidor.
// Decodificar un JWT NO autentica nada por sí mismo.
export function authorizeVerifiedTeacher({verifiedUser,accessToken,teacherUserId,nowSeconds=Math.floor(Date.now()/1000)}){
  if(!verifiedUser?.id||!teacherUserId||verifiedUser.id!==teacherUserId||verifiedUser.is_anonymous===true)return false;
  if(typeof accessToken!=='string'||accessToken.length>8192||accessToken.split('.').length!==3)return false;
  try{
    const segment=accessToken.split('.')[1];
    const normalized=segment.replace(/-/g,'+').replace(/_/g,'/');
    const payload=JSON.parse(atob(normalized.padEnd(Math.ceil(normalized.length/4)*4,'=')));
    return payload.sub===verifiedUser.id&&payload.aal==='aal2'&&payload.role==='authenticated'&&
      payload.is_anonymous!==true&&typeof payload.exp==='number'&&payload.exp>nowSeconds;
  }catch{return false}
}
