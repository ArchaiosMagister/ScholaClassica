// Paradigmas verbales regulares y deponentes de los lemas pedidos en las PAU.
// Flexión sistemática por conjugación y tema verbal explícito; el informe
// mantiene la diferencia entre reconstrucción escolar y comprobación individual.
import assert from 'node:assert/strict';
import {latinFold} from './morphology-pau-latin2.mjs';
const PERSONS=[['1.ª','singular'],['2.ª','singular'],['3.ª','singular'],
  ['1.ª','plural'],['2.ª','plural'],['3.ª','plural']];
const MODELS=[
 // lema | enunciado completo | conjugación (1/2/3/4/m) | tema de presente
 // | tema de perfecto, omitir cuando no acreditado | participio perf. pasivo | tipo
 ['moror','moror, morari, moratus sum (1.ª deponente)','1','mor',null,null,'dep'],
 ['iubeo','iubeo, iubere, iussi, iussum (2.ª)','2','iub','iuss','iuss'],
 ['redigo','redigo, redigere, redegi, redactum (3.ª)','3','redig','redeg','redact'],
 ['noceo','noceo, nocere, nocui, nocitum (2.ª)','2','noc','nocu','nocit'],
 ['permaneo','permaneo, permanere, permansi, permansum (2.ª)','2','perman','permans','permans', 'intrans'],
 ['pervenio','pervenio, pervenire, perveni, perventum (4.ª)','4','perven','perven','pervent','intrans'],
 ['impero','impero, imperare, imperavi, imperatum (1.ª)','1','imper','imperav','imperat'],
 ['reddo','reddo, reddere, reddidi, redditum (3.ª)','3','redd','reddid','reddit'],
 ['proficiscor','proficiscor, proficisci, profectus sum (3.ª deponente)','3','proficisc',null,null,'dep'],
 ['polliceor','polliceor, polliceri, pollicitus sum (2.ª deponente)','2','pollic',null,null,'dep'],
 ['circumplector','circumplector, circumplecti, circumplexus sum (3.ª deponente)','3','circumplect',null,null,'dep'],
 ['scando','scando, scandere, scandi, scansum (3.ª)','3','scand','scand','scans'],
 ['patior','patior, pati, passus sum (3.ª mixta deponente)','m','pat',null,null,'dep'],
 ['decerno','decerno, decernere, decrevi, decretum (3.ª)','3','decern','decrev','decret'],
 ['renovo','renovo, renovare, renovavi, renovatum (1.ª)','1','renov','renovav','renovat'],
 ['conquiro','conquiro, conquirere, conquisivi, conquisitum (3.ª)','3','conquir','conquisiv','conquisit'],
 ['procumbo','procumbo, procumbere, procubui, procubitum (3.ª)','3','procumb','procubu',null,'intrans'],
 ['pervado','pervado, pervadere, pervasi, pervasum (3.ª)','3','pervad','pervas','pervas'],
 ['facio','facio, facere, feci, factum (3.ª mixta)','m','fac','fec','fact', 'no-passive'],
 ['dico','dico, dicere, dixi, dictum (3.ª)','3','dic','dix','dict'],
 ['video','video, videre, vidi, visum (2.ª)','2','vid','vid','vis'],
 ['quaero','quaero, quaerere, quaesivi, quaesitum (3.ª)','3','quaer','quaesiv','quaesit'],
 ['succedo','succedo, succedere, successi, successum (3.ª)','3','succed','success',null,'intrans'],
 ['pando','pando, pandere, pandi, passum (3.ª)','3','pand','pand','pass'],
 ['cedo','cedo, cedere, cessi, cessum (3.ª)','3','ced','cess',null,'intrans'],
 ['peto','peto, petere, petivi, petitum (3.ª)','3','pet','petiv','petit'],
 ['removeo','removeo, removere, removi, remotum (2.ª)','2','remov','remov','remot'],
 ['appropinquo','appropinquo, appropinquare, appropinquavi, appropinquatum (1.ª)','1','appropinqu','appropinquav',null,'intrans'],
 ['vexo','vexo, vexare, vexavi, vexatum (1.ª)','1','vex','vexav','vexat'],
 ['contingo','contingo, contingere, contigi, contactum (3.ª)','3','conting','contig','contact'],
 ['ostendo','ostendo, ostendere, ostendi, ostensum (3.ª)','3','ostend','ostend','ostens'],
 ['ingruo','ingruo, ingruere, ingrui (3.ª)','3','ingru','ingru',null,'intrans'],
 ['incumbo','incumbo, incumbere, incubui, incubitum (3.ª)','3','incumb','incubu',null,'intrans'],
 ['diffugio','diffugio, diffugere, diffugi (3.ª mixta)','m','diffug','diffug',null,'intrans'],
 ['terreo','terreo, terrere, terrui, territum (2.ª)','2','terr','terru','territ'],
 ['veho','veho, vehere, vexi, vectum (3.ª)','3','veh','vex','vect'],
 ['praedico','praedico, praedicare, praedicavi, praedicatum (1.ª)','1','praedic','praedicav','praedicat'],
 ['compono','compono, componere, composui, compositum (3.ª)','3','compon','composu','composit'],
 ['maneo','maneo, manere, mansi, mansum (2.ª)','2','man','mans',null,'intrans'],
 ['appello','appello, appellare, appellavi, appellatum (1.ª)','1','appell','appellav','appellat'],
 ['relinquo','relinquo, relinquere, reliqui, relictum (3.ª)','3','relinqu','reliqu','relict'],
 ['vasto','vasto, vastare, vastavi, vastatum (1.ª)','1','vast','vastav','vastat'],
 ['traduco','traduco, traducere, traduxi, traductum (3.ª)','3','traduc','tradux','traduct'],
 ['gero','gero, gerere, gessi, gestum (3.ª)','3','ger','gess','gest'],
 ['divido','divido, dividere, divisi, divisum (3.ª)','3','divid','divis','divis'],
 ['violo','violo, violare, violavi, violatum (1.ª)','1','viol','violav','violat'],
 ['dissideo','dissideo, dissidere, dissedi (2.ª)','2','dissid','dissed',null,'intrans'],
 ['insequor','insequor, insequi, insecutus sum (3.ª deponente)','3','insequ',null,null,'dep'],
 ['conficio','conficio, conficere, confeci, confectum (3.ª mixta)','m','confic','confec','confect'],
 ['confugio','confugio, confugere, confugi (3.ª mixta)','m','confug','confug',null,'intrans'],
 ['accipio','accipio, accipere, accepi, acceptum (3.ª mixta)','m','accip','accep','accept'],
 ['disco','disco, discere, didici (3.ª)','3','disc','didic',null,'intrans'],
 ['conficio','conficio, conficere, confeci, confectum (3.ª mixta)','m','confic','confec','confect'],
 ['iugulo','iugulo, iugulare, iugulavi, iugulatum (1.ª)','1','iugul','iugulav','iugulat'],
 ['conficio','conficio, conficere, confeci, confectum (3.ª mixta)','m','confic','confec','confect']
];
const SFX={
  '1':{prs:['o','as','at','amus','atis','ant'],impf:['abam','abas','abat','abamus','abatis','abant'],
    fut:['abo','abis','abit','abimus','abitis','abunt'],
    sub:['em','es','et','emus','etis','ent'],
    sImpf:['arem','ares','aret','aremus','aretis','arent'],
    pass:['or','aris','atur','amur','amini','antur'],
    pImpf:['abar','abaris','abatur','abamur','abamini','abantur'],
    pFut:['abor','aberis','abitur','abimur','abimini','abuntur'],
    pSub:['er','eris','etur','emur','emini','entur'],
    pSImpf:['arer','areris','aretur','aremur','aremini','arentur'],
    inf:['are','ari']},
  '2':{prs:['eo','es','et','emus','etis','ent'],impf:['ebam','ebas','ebat','ebamus','ebatis','ebant'],
    fut:['ebo','ebis','ebit','ebimus','ebitis','ebunt'],
    sub:['eam','eas','eat','eamus','eatis','eant'],
    sImpf:['erem','eres','eret','eremus','eretis','erent'],
    pass:['eor','eris','etur','emur','emini','entur'],
    pImpf:['ebar','ebaris','ebatur','ebamur','ebamini','ebantur'],
    pFut:['ebor','eberis','ebitur','ebimur','ebimini','ebuntur'],
    pSub:['ear','earis','eatur','eamur','eamini','eantur'],
    pSImpf:['erer','ereris','eretur','eremur','eremini','erentur'],
    inf:['ere','eri']},
  '3':{prs:['o','is','it','imus','itis','unt'],impf:['ebam','ebas','ebat','ebamus','ebatis','ebant'],
    fut:['am','es','et','emus','etis','ent'],
    sub:['am','as','at','amus','atis','ant'],
    sImpf:['erem','eres','eret','eremus','eretis','erent'],
    pass:['or','eris','itur','imur','imini','untur'],
    pImpf:['ebar','ebaris','ebatur','ebamur','ebamini','ebantur'],
    pFut:['ar','eris','etur','emur','emini','entur'],
    pSub:['ar','aris','atur','amur','amini','antur'],
    pSImpf:['erer','ereris','eretur','eremur','eremini','erentur'],
    inf:['ere','i']},
  '4':{prs:['io','is','it','imus','itis','iunt'],impf:['iebam','iebas','iebat','iebamus','iebatis','iebant'],
    fut:['iam','ies','iet','iemus','ietis','ient'],
    sub:['iam','ias','iat','iamus','iatis','iant'],
    sImpf:['irem','ires','iret','iremus','iretis','irent'],
    pass:['ior','iris','itur','imur','imini','iuntur'],
    pImpf:['iebar','iebaris','iebatur','iebamur','iebamini','iebantur'],
    pFut:['iar','ieris','ietur','iemur','iemini','ientur'],
    pSub:['iar','iaris','iatur','iamur','iamini','iantur'],
    pSImpf:['irer','ireris','iretur','iremur','iremini','irentur'],
    inf:['ire','iri']},
  m:{prs:['io','is','it','imus','itis','iunt'],impf:['iebam','iebas','iebat','iebamus','iebatis','iebant'],
    fut:['iam','ies','iet','iemus','ietis','ient'],
    sub:['iam','ias','iat','iamus','iatis','iant'],
    sImpf:['erem','eres','eret','eremus','eretis','erent'],
    pass:['ior','eris','itur','imur','imini','iuntur'],
    pImpf:['iebar','iebaris','iebatur','iebamur','iebamini','iebantur'],
    pFut:['iar','ieris','ietur','iemur','iemini','ientur'],
    pSub:['iar','iaris','iatur','iamur','iamini','iantur'],
    pSImpf:['erer','ereris','eretur','eremur','eremini','erentur'],
    inf:['ere','i']}
};
const PERF={perfecto:['i','isti','it','imus','istis','erunt'],
  pluscuamperfecto:['eram','eras','erat','eramus','eratis','erant'],
  'futuro perfecto':['ero','eris','erit','erimus','eritis','erint'],
  'perfecto subjuntivo':['erim','eris','erit','erimus','eritis','erint'],
  'pluscuamperfecto subjuntivo':['issem','isses','isset','issemus','issetis','issent']};
const SUM={perfecto:['sum','es','est','sumus','estis','sunt'],
  pluscuamperfecto:['eram','eras','erat','eramus','eratis','erant'],
  'futuro perfecto':['ero','eris','erit','erimus','eritis','erunt']};
const PPP=(stem,gender,number)=>stem+(
  number==='singular'?
    {masculino:'us',femenino:'a',neutro:'um'}[gender]:
    {masculino:'i',femenino:'ae',neutro:'a'}[gender]);
function produce(lemma,headword,cls,stem,perfect,ppp,flag){
  assert.ok(SFX[cls]&&stem&&headword);
  const forms=[],deponent=flag==='dep';
  function add(form,person,number,tense,mood,voice){
    const analysis='verbo · '+headword+' · '+person+' persona · '+number+' · '+
      tense+' · '+mood+' · voz '+voice;
    forms.push({form,person:person+' '+number,tense,
      mood,voice,analysis});
  }
  const charts=deponent?[
    ['presente','indicativo','pasiva (deponente, sentido activo)','pass'],
    ['imperfecto','indicativo','pasiva (deponente, sentido activo)','pImpf'],
    ['futuro','indicativo','pasiva (deponente, sentido activo)','pFut'],
    ['presente','subjuntivo','pasiva (deponente, sentido activo)','pSub'],
    ['imperfecto','subjuntivo','pasiva (deponente, sentido activo)','pSImpf']
  ]:[
    ['presente','indicativo','activa','prs'],
    ['imperfecto','indicativo','activa','impf'],
    ['futuro','indicativo','activa','fut'],
    ['presente','subjuntivo','activa','sub'],
    ['imperfecto','subjuntivo','activa','sImpf'],
    ...(!['intrans','no-passive'].includes(flag)?[
      ['presente','indicativo','pasiva','pass'],
      ['imperfecto','indicativo','pasiva','pImpf'],
      ['futuro','indicativo','pasiva','pFut'],
      ['presente','subjuntivo','pasiva','pSub'],
      ['imperfecto','subjuntivo','pasiva','pSImpf']
    ]:[])
  ];
  for(const [tense,mood,voice,key] of charts){
    let endings=SFX[cls][key];
    assert.equal(endings.length,6);
    endings.forEach((x,i)=>{
      const [person,number]=PERSONS[i];
      add(stem+x,person,number,tense,mood,voice);
    });
  }
  if(perfect&&!deponent){
    for(const [time,endings] of Object.entries(PERF)){
      const subj=time.includes('subjuntivo');
      const tense=time.replace(' subjuntivo','');
      for(const [i,ending] of endings.entries()){
        const [person,number]=PERSONS[i];
        add(perfect+ending,person,number,tense,subj?'subjuntivo':'indicativo','activa');
      }
    }
  }
  if(ppp&&!['intrans','no-passive'].includes(flag)&&!deponent){
    for(const [tense,aux] of Object.entries(SUM)){
      for(const [i,[person,number]] of PERSONS.entries()){
        for(const gender of ['masculino','femenino','neutro']){
          add(PPP(ppp,gender,number)+' '+aux[i],person,number,tense,'indicativo','pasiva');
        }
      }
    }
  }
  const voice=deponent?'pasiva (deponente, sentido activo)':'activa';
  const inf=stem+SFX[cls].inf[0];
  // Los verbos en -io en 3.ª mixta forman pasivos de presente con -i, pero
  // facio tiene el infinitivo pasivo irregular fieri; nunca producir 'faci'.
  forms.push({form:inf,analysis:'infinitivo · '+headword+' · presente · voz '+voice,tense:'presente'});
  if(deponent){
    forms.push({form:stem+SFX[cls].inf[1],analysis:'infinitivo · '+headword+
      ' · presente · voz pasiva (deponente, sentido activo)',tense:'presente'});
  }else if(flag!=='no-passive'){
    forms.push({form:stem+SFX[cls].inf[1],analysis:'infinitivo · '+headword+
      ' · presente · voz pasiva',tense:'presente'});
  }
  if(cls==='1'){
    forms.push({form:stem+'a',analysis:'verbo · '+headword+
      ' · 2.ª persona · singular · presente · imperativo · voz '+voice});
  }
  const dedup=[...new Map(forms.map(f=>[latinFold(f.form)+'|'+f.analysis,f])).values()];
  return {id:'latin2-pau-regular-verb-'+lemma,language:'latin2',unit:0,
    kind:'verbo',headword,paradigm:headword,forms:dedup,
    evidence:{source:'Conjugación escolar latina, modelo declarado y formas PAU',
      file:'shared/academic/latin2/pau-cv-2006-2026.tsv',
      status:'paradigma-documentado',topic:'Conjugaciones de verbos PAU',caption:lemma,unit:0,
      verification:'formas generadas por modelo; sin acreditación individual de todas las flexiones',
      notes:'Tiempos de presente y perfecto de los modos indicativo y subjuntivo; sin extrapolar formas nominales.'}};
}
export function compilePauRegularVerbs(exams){
  const requested=new Set(exams.flatMap(q=>q.forms.map(latinFold)));
  const results=[],seen=new Set();
  for(const [lemma,headword,cls,stem,perfect,ppp,flag] of MODELS){
    if(seen.has(lemma))continue;seen.add(lemma);
    const r=produce(lemma,headword,cls,stem,perfect,ppp,flag);
    if(r.forms.some(x=>requested.has(latinFold(x.form))))results.push(r);
  }
  return results;
}
