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

// Las dos bandejas deben rechazar peticiones sin JWT válido, incluso cuando
// el visitante conoce la dirección de la función y la clave publicable.
for(const source of [
  {name:'Vocabula',url:'https://wpwlguufpkfnzlbyproe.supabase.co/functions/v1/schola-inbox',
    publishable:'sb_publishable_71JJZAqQGphmEjfnGIk8GQ_kAmltORO'},
  {name:'Palabra del día',url:'https://rzjemisvaaqpnvvgfntl.supabase.co/functions/v1/schola-palabra-inbox',
    publishable:'sb_publishable_x4KEF3M2CmSXCPG6XhZ0jw_WSmd58YO'}
]){
  const response=await fetch(source.url,{method:'POST',
    headers:{'content-type':'application/json','Origin':'https://archaiosmagister.github.io',
      apikey:source.publishable,'Authorization':'Bearer '+source.publishable},
    body:'{}',signal:AbortSignal.timeout(15000)});
  if(![401,403].includes(response.status))
    throw Error('La fuente '+source.name+' no rechaza solicitudes sin JWT docente: HTTP '+response.status);
  console.log('OK: '+source.name+' rechaza la consulta sin sesión docente');
}

// API administrativa: todas las operaciones (incluidas las lecturas) deben
// rechazar credenciales públicas, sin crear o modificar registros.
const adminUrl='https://wpwlguufpkfnzlbyproe.supabase.co/functions/v1/schola-vocab-admin';
for(const action of ['words.list','words.save','reports.list','reports.review']){
  const response=await fetch(adminUrl,{
    method:'POST',
    headers:{'content-type':'application/json',
      Origin:'https://archaiosmagister.github.io',apikey:key,
      Authorization:'Bearer '+key},
    body:JSON.stringify({action}),signal:AbortSignal.timeout(15000)
  });
  if(![401,403].includes(response.status))
    throw Error('La administración permitió '+action+' sin JWT docente: '+response.status);
  console.log('OK: administración de Vocabula deniega '+action+' sin JWT AAL2');
}
