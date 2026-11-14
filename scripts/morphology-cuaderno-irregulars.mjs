// Paradigmas íntegros de los cuatro irregulares de las pp. 77–78 del
// Cuaderno de Latín II 2026–2027. Revisión de las erratas cotejadas con
// Allen & Greenough / Dickinson, OSU y UK National Archives.
// El imperfectum de fio presenta morfología activa de valor pasivo;
// sus perfectos compuestos usan factus + sum. No se simula perfecto simple.
import assert from 'node:assert/strict';
const PERSONS=[['1.ª','singular'],['2.ª','singular'],['3.ª','singular'],
  ['1.ª','plural'],['2.ª','plural'],['3.ª','plural']];
const AUXILIAR={
  perfecto:{indicativo:['sum','es','est','sumus','estis','sunt'],
    subjuntivo:['sim','sis','sit','simus','sitis','sint']},
  pluscuamperfecto:{indicativo:['eram','eras','erat','eramus','eratis','erant'],
    subjuntivo:['essem','esses','esset','essemus','essetis','essent']},
  'futuro perfecto':{indicativo:['ero','eris','erit','erimus','eritis','erunt']}
};
const DECL=['nominativo','vocativo','acusativo','genitivo','dativo','ablativo'];
const GENDERS=['masculino','femenino','neutro'];
const word = (form,analysis,more={})=>({form,analysis,...more});
const desc=(headword,person,number,tense,mood,voice,gender=null)=>
 'verbo · '+headword+' · '+person+' persona · '+number+' · '+tense+' · '+mood+
 ' · voz '+voice+(gender?' · concordancia '+gender:'');
function appendTense(forms,headword,tense,mood,voice,variants){
  assert.equal(variants.length,6,headword+' '+tense+' '+mood);
  variants.forEach((value,i)=>{
    const [person,number]=PERSONS[i];
    for(const form of [value].flat()){
      assert.ok(form,'Casilla vacía de '+headword);
      forms.push(word(form,desc(headword,person,number,tense,mood,voice),
        {person:person+' '+number,number,tense,mood,voice}));
    }
  });
}
function compound(forms,headword,stem,voice){
  for(const [tense,moods] of Object.entries(AUXILIAR)){
    for(const [mood,aux] of Object.entries(moods)){
      aux.forEach((helper,i)=>{
        const [person,number]=PERSONS[i];
        for(const gender of GENDERS){
          const ending=number==='singular'?{
            masculino:'us',femenino:'a',neutro:'um'
          }[gender]:{masculino:'i',femenino:'ae',neutro:'a'}[gender];
          forms.push(word(stem+ending+' '+helper,
            desc(headword,person,number,tense,mood,voice,gender),
            {person:person+' '+number,number,tense,mood,voice,gender}));
        }
      });
    }
  }
}
function chart(headword,id,entries,{compoundStem=null,compoundVoice='pasiva'}={}){
  const forms=[];
  for(const [tense,mood,voice,table] of entries)
    appendTense(forms,headword,tense,mood,voice,table);
  if(compoundStem)compound(forms,headword,compoundStem,compoundVoice);
  const imperatives={
    fero:[['fer','singular','activa'],['ferte','plural','activa'],
      ['ferre','singular','pasiva'],['ferimini','plural','pasiva']],
    eo:[['i','singular','activa'],['ite','plural','activa']]
  };
  for(const [form,number,voice] of imperatives[id]||[]){
    forms.push(word(form,desc(headword,'2.ª',number,'presente','imperativo',voice),
      {person:'2.ª '+number,number,tense:'presente',mood:'imperativo',voice}));
  }
  // Allen y Greenough §204: fīmus y fītis son formas de empleo restringido
  // en prosa clásica. Se mantienen como flexiones legítimas, pero fuera del
  // sorteo ordinario hasta decisión docente.
  if(id==='fio')for(const f of forms){
    if(['fimus','fitis'].includes(f.form)&&f.tense==='presente'&&f.mood==='indicativo')
      f.usage='forma poco frecuente en prosa clásica';
  }
  const seen=new Set();
  return {id:'latin2-cuaderno-irregular-'+id,language:'latin2',unit:0,
    kind:'verbo',headword,paradigm:headword,
    forms:forms.filter(f=>{const key=f.form+'|'+f.analysis;if(seen.has(key))return false;seen.add(key);return true;}),
    evidence:{source:'Cuaderno de Latín II 2026–27, pp. 77–78; contraste con gramáticas externas',
      file:'shared/academic/latin2/cuaderno-2026-27-morfologia.tsv',
      unit:0,topic:'Verbos irregulares',caption:id,
      status:'paradigma-documentado',
      verification:'se han cotejado las erratas del cuaderno antes de la incorporación',
      notes:'Paradigma de seis personas, todas las formas explícitas de indicativo y subjuntivo, con valor semántico de fio y concordancia en tiempos compuestos.'}};
}
function fero(){
  const h='fero, ferre, tuli, latum (irregular)',a='activa',p='pasiva';
  return chart(h,'fero',[
    ['presente','indicativo',a,['fero','fers','fert','ferimus','fertis','ferunt']],
    ['imperfecto','indicativo',a,['ferebam','ferebas','ferebat','ferebamus','ferebatis','ferebant']],
    ['futuro','indicativo',a,['feram','feres','feret','feremus','feretis','ferent']],
    ['perfecto','indicativo',a,['tuli','tulisti','tulit','tulimus','tulistis','tulerunt']],
    ['pluscuamperfecto','indicativo',a,['tuleram','tuleras','tulerat','tuleramus','tuleratis','tulerant']],
    ['futuro perfecto','indicativo',a,['tulero','tuleris','tulerit','tulerimus','tuleritis','tulerint']],
    ['presente','subjuntivo',a,['feram','feras','ferat','feramus','feratis','ferant']],
    ['imperfecto','subjuntivo',a,['ferrem','ferres','ferret','ferremus','ferretis','ferrent']],
    ['perfecto','subjuntivo',a,['tulerim','tuleris','tulerit','tulerimus','tuleritis','tulerint']],
    ['pluscuamperfecto','subjuntivo',a,['tulissem','tulisses','tulisset','tulissemus','tulissetis','tulissent']],
    ['presente','indicativo',p,['feror',['ferris','ferre'],'fertur','ferimur','ferimini','feruntur']],
    ['imperfecto','indicativo',p,['ferebar','ferebaris','ferebatur','ferebamur','ferebamini','ferebantur']],
    ['futuro','indicativo',p,['ferar','fereris','feretur','feremur','feremini','ferentur']],
    ['presente','subjuntivo',p,['ferar','feraris','feratur','feramur','feramini','ferantur']],
    ['imperfecto','subjuntivo',p,['ferrer','ferreris','ferretur','ferremur','ferremini','ferrentur']]
  ],{compoundStem:'lat'});
}
function eo(){
  const h='eo, ire, ii (ivi), itum (irregular)',a='activa';
  const record=chart(h,'eo',[
    ['presente','indicativo',a,['eo','is','it','imus','itis','eunt']],
    ['imperfecto','indicativo',a,['ibam','ibas','ibat','ibamus','ibatis','ibant']],
    ['futuro','indicativo',a,['ibo','ibis','ibit','ibimus','ibitis','ibunt']],
    ['perfecto','indicativo',a,[['ii','ivi'],['isti','ivisti'],['iit','ivit'],
      ['iimus','ivimus'],['istis','ivistis'],['ierunt','iverunt']]],
    ['pluscuamperfecto','indicativo',a,['ieram','ieras','ierat','ieramus','ieratis','ierant']],
    ['futuro perfecto','indicativo',a,['iero','ieris','ierit','ierimus','ieritis','ierint']],
    ['presente','subjuntivo',a,['eam','eas','eat','eamus','eatis','eant']],
    ['imperfecto','subjuntivo',a,['irem','ires','iret','iremus','iretis','irent']],
    ['perfecto','subjuntivo',a,['ierim','ieris','ierit','ierimus','ieritis','ierint']],
    ['pluscuamperfecto','subjuntivo',a,['issem','isses','isset','issemus','issetis','issent']]
  ]);
  // A&G §203: los perfectos con v son variantes reales, aunque menos
  // habituales en la forma simple eo. Se conservan todos sus tiempos.
  const extra=[];
  for(const f of record.forms){
    if(/^ier/.test(f.form)&&
       ['perfecto','pluscuamperfecto','futuro perfecto'].includes(f.tense)){
      extra.push({...f,form:f.form.replace(/^ier/,'iver'),
        usage:'variante de perfecto con v, poco frecuente en prosa clásica'});
    }
    if(/^iss/.test(f.form)&&f.tense==='pluscuamperfecto'&&
       f.mood==='subjuntivo'){
      extra.push({...f,form:f.form.replace(/^iss/,'iviss'),
        usage:'variante de perfecto con v, poco frecuente en prosa clásica'});
    }
    if(/^iv/.test(f.form))
      f.usage='variante de perfecto con v, poco frecuente en prosa clásica';
  }
  const impersonal=[
    ['itur','presente','indicativo'],['ibatur','imperfecto','indicativo'],
    ['ibitur','futuro','indicativo'],['eatur','presente','subjuntivo'],
    ['iretur','imperfecto','subjuntivo'],
    ['itum est','perfecto','indicativo'],
    ['itum erat','pluscuamperfecto','indicativo'],
    ['itum erit','futuro perfecto','indicativo'],
    ['itum sit','perfecto','subjuntivo'],
    ['itum esset','pluscuamperfecto','subjuntivo']
  ];
  for(const [form,tense,mood] of impersonal){
    record.forms.push(word(form,desc(h,'3.ª','singular',tense,mood,'pasiva')+
      ' (impersonal)',{person:'3.ª singular',number:'singular',
        tense,mood,voice:'pasiva',construction:'impersonal'}));
  }
  const seen=new Set(record.forms.map(f=>f.form+'|'+f.analysis));
  for(const f of extra){
    const key=f.form+'|'+f.analysis;
    if(!seen.has(key)){record.forms.push(f);seen.add(key);}
  }
  return record;
}
function fio(){
  const h='fio, fieri, factus sum (irregular)';
  const a='activa (sentido pasivo o de cambio de estado)';
  return chart(h,'fio',[
    ['presente','indicativo',a,['fio','fis','fit','fimus','fitis','fiunt']],
    ['imperfecto','indicativo',a,['fiebam','fiebas','fiebat','fiebamus','fiebatis','fiebant']],
    ['futuro','indicativo',a,['fiam','fies','fiet','fiemus','fietis','fient']],
    ['presente','subjuntivo',a,['fiam','fias','fiat','fiamus','fiatis','fiant']],
    ['imperfecto','subjuntivo',a,['fierem','fieres','fieret','fieremus','fieretis','fierent']]
  ],{compoundStem:'fact'});
}
function volo(){
  const h='volo, velle, volui (irregular)',a='activa';
  return chart(h,'volo',[
    ['presente','indicativo',a,['volo','vis','vult','volumus','vultis','volunt']],
    ['imperfecto','indicativo',a,['volebam','volebas','volebat','volebamus','volebatis','volebant']],
    ['futuro','indicativo',a,['volam','voles','volet','volemus','voletis','volent']],
    ['perfecto','indicativo',a,['volui','voluisti','voluit','voluimus','voluistis','voluerunt']],
    ['pluscuamperfecto','indicativo',a,['volueram','volueras','voluerat','volueramus','volueratis','voluerant']],
    ['futuro perfecto','indicativo',a,['voluero','volueris','voluerit','voluerimus','volueritis','voluerint']],
    ['presente','subjuntivo',a,['velim','velis','velit','velimus','velitis','velint']],
    ['imperfecto','subjuntivo',a,['vellem','velles','vellet','vellemus','velletis','vellent']],
    ['perfecto','subjuntivo',a,['voluerim','volueris','voluerit','voluerimus','volueritis','voluerint']],
    ['pluscuamperfecto','subjuntivo',a,['voluissem','voluisses','voluisset','voluissemus','voluissetis','voluissent']]
  ]);
}
function infinitives(id,headword,values){
  return {id:'latin2-cuaderno-irregular-infinitivo-'+id,language:'latin2',
    unit:0,kind:'infinitivo',headword,paradigm:headword,
    forms:values.map(([form,tense,voice])=>word(form,
      'infinitivo · '+headword+' · '+tense+' · voz '+voice,{tense,voice})),
    evidence:{source:'Cuaderno de Latín II, pp. 76–78; gramáticas contrastadas',
      file:'shared/academic/latin2/cuaderno-2026-27-morfologia.tsv',
      unit:0,status:'paradigma-documentado',topic:'Infinitivos irregulares',caption:id,
      notes:'Se preserva la construcción completa de infinitivo compuesto.'}};
}
function declension(stem,kind){
  const out=[];
  for(const gender of GENDERS)for(const number of ['singular','plural']){
    const neut=gender==='neutro',suffix=number==='singular'?
      (gender==='masculino'?['us','e','um','i','o','o']:
        neut?['um','um','um','i','o','o']:['a','a','am','ae','ae','a']):
      (gender==='masculino'?['i','i','os','orum','is','is']:
        neut?['a','a','a','orum','is','is']:['ae','ae','as','arum','is','is']);
    for(let i=0;i<6;i++)out.push({
      form:stem+suffix[i],case:DECL[i],number,gender,
      analysis:'participio · '+kind.headword+' · '+kind.tense+
        ' · voz '+kind.voice+' · '+DECL[i]+' · '+gender+' · '+number});
  }
  return out;
}
function irregularParticiples(){
  const h='fero, ferre, tuli, latum (irregular)';
  const forms=[];
  for(const gender of GENDERS)for(const number of ['singular','plural']){
    const neut=gender==='neutro';
    const all=number==='singular'?
      [ 'ferens','ferens',neut?'ferens':'ferentem','ferentis','ferenti','ferente']:
      [neut?'ferentia':'ferentes',neut?'ferentia':'ferentes',
        neut?'ferentia':'ferentes','ferentium','ferentibus','ferentibus'];
    all.forEach((form,i)=>forms.push({
      form,case:DECL[i],gender,number,
      analysis:'participio · '+h+' · presente · voz activa · '+
        DECL[i]+' · '+gender+' · '+number}));
  }
  forms.push(...declension('lat',{headword:h,tense:'perfecto',voice:'pasiva'}));
  forms.push(...declension('latur',{headword:h,tense:'futuro',voice:'activa'}));
  return {id:'latin2-cuaderno-irregular-participio-fero',language:'latin2',
    unit:0,kind:'participio',headword:h,paradigm:h,forms,
    evidence:{source:'Cuaderno de Latín II, pp. 76–78; paradigma latino contrastado',
      file:'shared/academic/latin2/cuaderno-2026-27-morfologia.tsv',
      unit:0,status:'paradigma-documentado',topic:'Participios de fero',
      caption:'ferens; latus; laturus',notes:'Se distingue cada tiempo y voz.'}};
}
export function compileCuadernoIrregulars(){
  const records=[fero(),eo(),fio(),volo()];
  assert.equal(new Set(records.map(x=>x.id)).size,4);
  for(const r of records){
    const modes=new Set(r.forms.map(f=>f.mood));
    assert.deepEqual([...modes],['indicativo','subjuntivo']);
    assert.ok(r.forms.length>=60,r.id);
  }
  records.push(infinitives('fero',records[0].headword,[
    ['ferre','presente','activa'],['ferri','presente','pasiva'],
    ['tulisse','perfecto','activa'],['latum esse','perfecto','pasiva'],
    ['laturum esse','futuro','activa'],['latum iri','futuro','pasiva']]));
  records.push(infinitives('eo',records[1].headword,[
    ['ire','presente','activa'],['isse','perfecto','activa'],
    ['ivisse','perfecto','activa'],['iturum esse','futuro','activa']]));
  records.push(infinitives('fio',records[2].headword,[
    ['fieri','presente','activa (sentido pasivo)'],
    ['factum esse','perfecto','pasiva'],['factum iri','futuro','pasiva']]));
  records.push(infinitives('volo',records[3].headword,[
    ['velle','presente','activa'],['voluisse','perfecto','activa']]));
  records.push(irregularParticiples());
  return records;
}
