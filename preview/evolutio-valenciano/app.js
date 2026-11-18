// Interfaz del HTML autónomo de revisión; no usa fetch, cookies, SW ni almacenamiento.
(()=>{
 'use strict';
 const data=window.__SCHOLA_VA_PILOT__;
 const engine=EvolutioVaPilotEngine;
 const app=document.getElementById('app');
 const tabPractice=document.getElementById('tab-practice');
 const tabStudy=document.getElementById('tab-study');
 const theme=document.getElementById('theme');
 const rules=new Map((data?.rules??[]).map(x=>[x.id,x.name]));
 const state={view:'setup',deck:[],index:0,finished:[],card:null,feedback:null,drafts:[]};

 function el(name,attributes={},...children){
  const node=document.createElement(name);
  for(const [key,value] of Object.entries(attributes)){
   if(key==='class')node.className=value;
   else if(key==='text')node.textContent=value;
   else if(key==='htmlFor')node.htmlFor=value;
   else if(key==='value')node.value=value;
   else if(key==='disabled')node.disabled=Boolean(value);
   else node.setAttribute(key,String(value));
  }
  for(const child of children.flat(1)){
   if(child!==null&&child!==undefined)node.append(child instanceof Node?child:document.createTextNode(String(child)));
  }
  return node;
 }
 const p=(content,cls='')=>el('p',{class:cls,text:content});
 const heading=(text)=>el('h2',{text});
 const button=(label,fn,cls='secondary',id=null)=>{
  const b=el('button',{type:'button',class:cls,text:label});
  if(id)b.id=id;
  b.addEventListener('click',fn);
  return b;
 };
 const feedback=(message,kind='')=>el('div',{class:'feedback '+kind,role:'status',text:message});
 const ruleName=id=>rules.get(id)??id;
 const badge=text=>el('span',{class:'tag',text});
 function section(kicker,title){
  return el('section',{class:'panel'},p(kicker,'subhead'),heading(title));
 }
 function setActive(view){
  const practice=view==='practice';
  tabPractice.setAttribute('aria-pressed',String(practice));
  tabStudy.setAttribute('aria-pressed',String(!practice));
 }
 function setup(){
  state.view='setup';state.card=null;state.feedback=null;state.deck=[];state.index=0;state.finished=[];
  setActive('practice');
  app.replaceChildren();
  const panel=section('Evolució fonètica · prova docent','Practica les set evolucions seleccionades');
  panel.append(p('Dos passos: escriu el resultat patrimonial valencià i identifica les normes que expliquen cada fragment de la forma llatina.','muted'));
  panel.append(p('Les tres formes sense norma i els casos filològics reservats no entren en els exercicis.','small-note'));
  const field=el('div',{class:'field'});
  const countLabel=el('label',{htmlFor:'session-count',text:'Nombre de paraules (1–7)'});
  const count=el('input',{id:'session-count',type:'number',min:'1',max:'7',step:'1',value:'7',class:'number-input'});
  field.append(countLabel,count);panel.append(field);
  const row=el('div',{class:'button-row'});
  row.append(button('Començar la pràctica',()=>{
   const n=Number(count.value);
   if(!Number.isInteger(n)||n<1||n>7){count.setCustomValidity('Tria un nombre entre 1 i 7.');count.reportValidity();return;}
   count.setCustomValidity('');
   state.deck=engine.shuffle(data.words,n);
   state.index=0;state.finished=[];state.card=engine.card(state.deck[0]);state.drafts=[];state.feedback=null;
   state.view='practice';renderCard();
  },'primary','start-session'));
  panel.append(row);
  const note=el('section',{class:'panel'});
  note.append(heading('Normes presents en el pilot'));
  note.append(p(data.rules.map(x=>x.name).join(' · '),'muted'));
  note.append(p('La pèrdua de -m final és fixa i no és una norma que s’haja de seleccionar.','small-note'));
  app.append(panel,note);
 }
 function study(){
  state.view='study';state.feedback=null;setActive('study');app.replaceChildren();
  const panel=section('Consulta · set formes','Estudia les evolucions del pilot');
  panel.append(p('Cada targeta mostra la forma patrimonial i les normes seleccionables. Esta vista és de preparació, no una prova.','muted'));
  const grid=el('div',{class:'study-grid'});
  for(const word of data.words){
   const card=el('article',{class:'study-item'});
   card.append(el('h3',{text:word.latin,'lang':'la'}));
   card.append(p('→ '+word.answer,'latin-sm'));
   for(const change of word.changes){
    const parts=engine.fragments(word.latin,change.span);
    const frag=el('div',{class:'change-head'});
    const fragment=el('span',{class:'fragment'});
    fragment.append(parts[0],el('mark',{text:parts[1]}),parts[2]);
    frag.append(fragment,badge(ruleName(change.rule)));card.append(frag);
   }
   card.append(p('La -m final és fixa i no es pregunta.','small-note'));
   grid.append(card);
  }
  panel.append(grid);
  app.append(panel);
 }
 function cardHeader(panel,word){
  const counter=el('div',{class:'counter'});
  counter.append(el('span',{text:'Targeta '+(state.index+1)+' de '+state.deck.length}),
   el('span',{text:'Pilot de 7 formes · sense progrés desat'}));
  const bar=el('div',{class:'progress',role:'progressbar','aria-valuemin':'0',
   'aria-valuemax':String(state.deck.length),'aria-valuenow':String(state.index)});
  bar.append(el('span',{style:'width:'+(state.index/state.deck.length*100)+'%'}));
  panel.append(counter,bar,el('div',{class:'latin',lang:'la',text:word.latin}));
 }
 function summaryNext(){
  state.finished.push({id:state.card.word.id,correct:state.card.correct,revealed:state.card.revealed});
  state.index++;
  state.feedback=null;state.drafts=[];
  if(state.index>=state.deck.length){summary();return;}
  state.card=engine.card(state.deck[state.index]);renderCard();
 }
 function phaseResult(panel){
  const card=state.card;
  panel.append(p('Escriu el resultat patrimonial en valencià:'));
  const field=el('form',{class:'field',id:'result-form'});
  field.append(el('label',{htmlFor:'result-input',text:'Resultat valencià'}));
  const input=el('input',{id:'result-input',type:'text',class:'text-input',autocapitalize:'off',
   autocomplete:'off',spellcheck:'false',required:'true',maxlength:'80',placeholder:'Escriu la paraula'});
  field.append(input,p('Intents disponibles: '+(3-card.resultAttempts)+' de 3','small-note'));
  const row=el('div',{class:'button-row'});
  const send=el('button',{type:'submit',class:'primary',id:'check-result',text:'Comprovar resultat'});
  row.append(send,button('No ho sé · Mostra la solució',()=>{
   engine.reveal(card);state.feedback=null;renderCard();
  },'secondary','reveal-result'));
  field.append(row);
  field.addEventListener('submit',event=>{
   event.preventDefault();
   const outcome=engine.answer(card,input.value);
   state.feedback=outcome.status==='correct'?{text:'Resultat correcte. Ara identifica les normes.',kind:'good'}:
    outcome.status==='empty'?{text:'Escriu una resposta abans de comprovar.',kind:''}:
    outcome.status==='revealed'?{text:'Has esgotat els tres intents. Es mostra la solució, sense puntuar.',kind:'error'}:
    {text:'Encara no és correcte. Intents restants: '+outcome.remaining,kind:'error'};
   state.drafts=card.word.changes.map(()=>'');
   renderCard();
  });
  panel.append(field);
  if(state.feedback)panel.append(feedback(state.feedback.text,state.feedback.kind));
  else queueMicrotask(()=>input.focus());
 }
 function fragmentNode(word,span){
  const parts=engine.fragments(word.latin,span);
  return el('div',{class:'fragment'},parts[0],el('mark',{text:parts[1]}),parts[2]);
 }
 function phaseRules(panel){
  const card=state.card,word=card.word;
  panel.append(p('Resultat correcte: '+word.answer,'feedback good'));
  panel.append(p('Associa una norma a cada fragment assenyalat del mot llatí. La -m final no s’avalua.','muted'));
  const form=el('form',{id:'rules-form'});
  const group=el('div',{class:'changes'});
  word.changes.forEach((change,i)=>{
   const row=el('div',{class:'change'});
   const left=el('div');
   left.append(p('Canvi '+(i+1),'subhead'),fragmentNode(word,change.span));
   const right=el('div',{class:'field'});
   right.append(el('label',{htmlFor:'rule-'+i,text:'Norma del fragment '+change.fragment}));
   const select=el('select',{id:'rule-'+i,class:'rule-select'});
   select.append(el('option',{value:'',text:'— Tria una norma —'}));
   for(const rule of data.rules)select.append(el('option',{value:rule.id,text:rule.name}));
   select.value=state.drafts[i]??'';
   select.addEventListener('change',()=>{state.drafts[i]=select.value;});
   right.append(select);
   if(card.ruleStatus.length){
    right.append(p(card.ruleStatus[i]?'✓ Norma correcta':'Revisa esta norma.',
     card.ruleStatus[i]?'small-note':'feedback error'));
   }
   row.append(left,right);group.append(row);
  });
  form.append(group,p('Comprovacions disponibles: '+(3-card.ruleAttempts)+' de 3','small-note'));
  const row=el('div',{class:'button-row'});
  row.append(el('button',{type:'submit',class:'primary',id:'check-rules',text:'Comprovar normes'}));
  row.append(button('No ho sé · Mostra la solució',()=>{
   engine.reveal(card);state.feedback=null;renderCard();
  },'secondary','reveal-rules'));
  form.append(row);
  form.addEventListener('submit',event=>{
   event.preventDefault();
   const outcome=engine.checkRules(card,state.drafts);
   state.feedback=outcome.status==='empty'?{text:'Tria una norma per a cada fragment. No consumix cap intent.',kind:''}:
    outcome.status==='correct'?{text:'Has identificat totes les normes.',kind:'good'}:
    outcome.status==='revealed'?{text:'Has esgotat els tres intents de normes. Es mostra la solució.',kind:'error'}:
    {text:'Algunes normes no coincidixen. Intents disponibles: '+outcome.remaining,kind:'error'};
   renderCard();
  });
  panel.append(form);
  if(state.feedback)panel.append(feedback(state.feedback.text,state.feedback.kind));
 }
 function phaseEnd(panel){
  const card=state.card,word=card.word;
  panel.append(feedback(card.correct?'Targeta completada. Resultat i normes correctes.':
   'Solució mostrada. Esta targeta no compta com a encert.',card.correct?'good':'error'));
  panel.append(p('Forma patrimonial: '+word.answer,'latin-sm'));
  const list=el('div',{class:'changes'});
  for(const change of word.changes){
   const item=el('div',{class:'change'});
   item.append(fragmentNode(word,change.span),el('strong',{text:ruleName(change.rule)}));list.append(item);
  }
  panel.append(list,p('La pèrdua de -m final és fixa; no es compta com a apòcope.','small-note'));
  const row=el('div',{class:'button-row'});
  row.append(button(state.index+1===state.deck.length?'Veure el resum':'Paraula següent →',summaryNext,'primary','next-card'));
  panel.append(row);
 }
 function renderCard(){
  state.view='practice';setActive('practice');app.replaceChildren();
  const panel=el('section',{class:'panel'});
  const w=state.card.word;
  cardHeader(panel,w);
  panel.append(p(state.card.phase==='result'?'Pas 1 de 2 · resultat patrimonial':
   state.card.phase==='rules'?'Pas 2 de 2 · normes fonètiques':
   'Solució de la targeta','subhead'));
  if(state.card.phase==='result')phaseResult(panel);
  else if(state.card.phase==='rules')phaseRules(panel);
  else phaseEnd(panel);
  const row=el('div',{class:'button-row'});
  row.append(button('Acabar la sessió',setup,'ghost','stop-session'));
  panel.append(row);app.append(panel);
 }
 function summary(){
  state.view='summary';setActive('practice');app.replaceChildren();
  const success=state.finished.filter(x=>x.correct).length;
  const panel=section('Sessió acabada','Resum de la prova');
  const grid=el('div',{class:'summary-grid'});
  for(const [label,value] of [['Targetes',state.finished.length],['Resoltes',success],['Pendents',state.finished.length-success]]){
   const cell=el('div',{class:'stat'});cell.append(el('strong',{text:String(value)}),p(label));grid.append(cell);
  }
  panel.append(grid,p('Els resultats no es guarden. Este pilot docent no modifica el progrés de ScholaClassica.','muted'));
  const row=el('div',{class:'button-row'});
  row.append(button('Nova pràctica',setup,'primary','restart-session'),button('Veure fitxes',study,'secondary','study-from-summary'));
  panel.append(row);app.append(panel);
 }
 try{
  engine.validate(data);
  tabPractice.addEventListener('click',setup);
  tabStudy.addEventListener('click',study);
  theme.addEventListener('change',()=>{document.documentElement.dataset.theme=theme.value;});
  setup();
 }catch(error){
  app.replaceChildren(el('section',{class:'panel'},heading('No s’ha pogut obrir el pilot'),p(error.message,'feedback error')));
 }
})();
