const input=document.querySelector('#search'),results=document.querySelector('#results');
const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/æ/g,'ae').toLowerCase().replace(/ς/g,'σ');
let indexPromise;
function getIndex(){return indexPromise??=fetch('assets/search-data.json').then(r=>{if(!r.ok)throw Error('Carga fallida');return r.json();}).catch(e=>{indexPromise=null;throw e;});}
let sequence=0;
input.addEventListener('input',async()=>{
 const call=++sequence,q=normalize(input.value.trim());results.replaceChildren();results.hidden=!q;if(!q)return;
 try{
 const data=await getIndex();if(call!==sequence)return;
 const words=q.split(/\s+/),hits=data.filter(p=>words.every(w=>normalize(p.title+' '+p.text).includes(w))).sort((a,b)=>Number(normalize(b.title).includes(q))-Number(normalize(a.title).includes(q)));
 const summary=document.createElement('p');summary.textContent=hits.length?`${hits.length} temas encontrados`:'No hay resultados. Prueba con «participio», «ablativo» o «ut».';results.append(summary);
 for(const hit of hits){const a=document.createElement('a'),small=document.createElement('small');a.href=hit.url;a.textContent=hit.title;small.textContent=hit.group;a.append(small);results.append(a);}
 }catch(e){if(call===sequence)results.textContent='No se ha podido cargar el buscador. Puedes consultar los índices de latín y griego.';}
});
input.addEventListener('keydown',e=>{if(e.key==='Escape'){results.hidden=true;input.value='';sequence++;}if(e.key==='ArrowDown'){const first=results.querySelector('a');if(first){e.preventDefault();first.focus();}}});
document.addEventListener('click',e=>{if(!e.target.closest('.searchbar'))results.hidden=true;});
input.addEventListener('focus',()=>{if(input.value.trim())results.hidden=false;});
