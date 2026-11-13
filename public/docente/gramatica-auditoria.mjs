// Consulta académica de cobertura y ejercicios del banco antiguo de Vocabula.
// Información ya pública en la web original; nunca incluye sesiones ni datos de alumnos.
// Las acciones de revisión siguen protegidas por Supabase Auth y TOTP.
const $=id=>document.getElementById(id);
const names={lat1:'Latín I',lat4:'Latín · 4.º ESO',gr1:'Griego I'};
const text=(tag,value,cls='')=>{
  const el=document.createElement(tag);
  el.textContent=String(value??'');
  if(cls)el.className=cls;
  return el;
};
let exercises=[],syllabi={},loaded=false,attached=false,openGrammarReports=null;
const PAGE=25;
let offset=0;

function renderCoverage(coverage){
  const target=$('grammar-coverage-list');
  target.replaceChildren();
  for(const [subject,title] of Object.entries(names)){
    const data=coverage.subjects?.[subject];
    if(!data)continue;
    const article=text('article','', 'notice');
    article.append(
      text('h4',title),
      text('p',data.withExercises+' de '+data.lemmas+' lemas con alguna forma autocorregible'),
      text('small',data.withoutExercises+' sin ejercicios · '+data.importedLemmas+
        ' con UniMorph · '+data.curatedLemmas+' con formas docentes')
    );
    target.append(article);
  }
}
function renderExercises(){
  const subject=$('grammar-audit-subject').value;
  const unit=$('grammar-audit-unit').value;
  const query=$('grammar-audit-search').value.normalize('NFD')
    .replace(/\p{M}/gu,'').toLocaleLowerCase().trim();
  const matches=exercises.filter(e=>e.subject===subject&&(!unit||e.unit===unit)
    &&(!query||(e.prompt+' '+e.answer+' '+e.topic).normalize('NFD')
      .replace(/\p{M}/gu,'').toLocaleLowerCase().includes(query)));
  if(offset>=matches.length)offset=Math.max(0,Math.floor((matches.length-1)/PAGE)*PAGE);
  const page=matches.slice(offset,offset+PAGE);
  const target=$('grammar-audit-results');
  target.replaceChildren();
  for(const item of page){
    const article=text('article','','notice');
    article.append(text('small',item.unit+' · '+item.topic+' · '+
      (item.mode==='write'?'Escritura':'Reconocimiento')),
      text('p',item.prompt));
    const solution=text('p','Solución: ');
    solution.append(text('strong',item.answer));
    article.append(solution);
    target.append(article);
  }
  $('grammar-audit-count').textContent=matches.length+
    ' ejercicios encontrados en el banco heredado; mostrando '+
    (page.length?offset+1:0)+'–'+(offset+page.length)+'.';
  $('grammar-audit-prev').disabled=offset===0;
  $('grammar-audit-next').disabled=offset+PAGE>=matches.length;
}
function updateUnits(){
  const subject=$('grammar-audit-subject').value;
  const selector=$('grammar-audit-unit');
  selector.replaceChildren();
  const all=document.createElement('option');
  all.value='';all.textContent='Todas las unidades';
  selector.append(all);
  for(const [unit] of syllabi[subject]||[]){
    const option=document.createElement('option');
    option.value=unit;option.textContent=unit;
    selector.append(option);
  }
  offset=0;
  renderExercises();
}
async function load(){
  if(!loaded){
    const [bank,coverage]=await Promise.all([
      fetch('./gramatica-banco.json',{cache:'no-store'}),
      fetch('./gramatica-cobertura.json',{cache:'no-store'})
    ]);
    if(!bank.ok||!coverage.ok)throw Error('No se pudo cargar el índice de gramática');
    const [data,stats]=await Promise.all([bank.json(),coverage.json()]);
    if(data.schema!==1||!Array.isArray(data.exercises)||data.exercises.length<100||
        stats.schema!==1||!stats.subjects)throw Error('El informe de gramática es incompleto');
    exercises=data.exercises;syllabi=data.syllabi;
    renderCoverage(stats);loaded=true;
  }
  updateUnits();
  $('grammar-audit-state').textContent='Banco de gramática y cobertura consultados';
}
export function mountGrammarAudit({showGrammarReports}){
  openGrammarReports=showGrammarReports;
  if(attached)return;
  attached=true;
  $('grammar-audit-load').addEventListener('click',()=>load().catch(e=>{
    $('grammar-audit-state').textContent=e.message;
  }));
  $('grammar-audit-form').addEventListener('submit',event=>{
    event.preventDefault();offset=0;renderExercises();
  });
  $('grammar-audit-subject').addEventListener('change',()=>{if(loaded)updateUnits()});
  $('grammar-audit-unit').addEventListener('change',()=>{offset=0;renderExercises()});
  $('grammar-audit-prev').addEventListener('click',()=>{offset=Math.max(0,offset-PAGE);renderExercises()});
  $('grammar-audit-next').addEventListener('click',()=>{offset+=PAGE;renderExercises()});
  $('grammar-audit-reports').addEventListener('click',()=>openGrammarReports?.());
}
export function resetGrammarAudit(){
  exercises=[];syllabi={};loaded=false;offset=0;openGrammarReports=null;
  $('grammar-coverage-list')?.replaceChildren();
  $('grammar-audit-results')?.replaceChildren();
  if($('grammar-audit-state'))$('grammar-audit-state').textContent='Consulta disponible tras iniciar sesión';
  if($('grammar-audit-count'))$('grammar-audit-count').textContent='';
}
