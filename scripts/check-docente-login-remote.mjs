// Sin usar credenciales personales, comprueba que el endpoint de primer factor
// está operativo y que rechaza el usuario incorrecto antes de publicar la web.
const url='https://wpwlguufpkfnzlbyproe.supabase.co/functions/v1/schola-login';
const key='sb_publishable_71JJZAqQGphmEjfnGIk8GQ_kAmltORO';
const res=await fetch(url,{
  method:'POST',
  headers:{
    'content-type':'application/json',
    'Origin':'https://archaiosmagister.github.io',
    'apikey':key,
    'Authorization':'Bearer '+key
  },
  body:JSON.stringify({username:'usuario-no-autorizado',password:'clave-ficticia-que-no-es-real'}),
  signal:AbortSignal.timeout(15000)
});
let data;
try{data=await res.json()}catch{throw Error('La función de acceso no devolvió JSON');}
if(res.status!==401||data?.error!=='Credenciales no válidas')
  throw Error('Primer factor no listo: HTTP '+res.status+'; causa pública: '+String(data?.error||'respuesta desconocida').slice(0,100));
console.log('OK: Supabase rechaza el usuario erróneo antes del inicio de sesión, sin probar contraseñas reales');
