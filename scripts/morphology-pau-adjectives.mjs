// Ampliación por paradigmas escolares completos de adjetivos documentados en
// las preguntas PAU. Las terminaciones se aplican solo a lemas y temas
// expresamente declarados: no se toma una forma aislada por un paradigma.
import assert from 'node:assert/strict';
import {latinFold} from './morphology-pau-latin2.mjs';
const CASES=['nominativo','vocativo','acusativo','genitivo','dativo','ablativo'];
const GENDERS=['masculino','femenino','neutro'];
const FIRST=[
  // lema | enunciado | tema | grado | tipo
  ['medius','medius, media, medium','medi'],['quietus','quietus, quieta, quietum','quiet'],
  ['nonnullus','nonnullus, nonnulla, nonnullum','nonnull'],
  ['totus','totus, tota, totum','tot','positivo','pronominal'],
  ['magnus','magnus, magna, magnum','magn'],
  ['novissimus','novissimus, novissima, novissimum','novissim','superlativo'],
  ['saevus','saevus, saeva, saevum','saev'],
  ['reliquus','reliquus, reliqua, reliquum','reliqu'],
  ['suus','suus, sua, suum','su'],
  ['maturus','maturus, matura, maturum','matur'],
  ['pruinosus','pruinosus, pruinosa, pruinosum','pruinos'],
  ['acerbus','acerbus, acerba, acerbum','acerb'],
  ['clarissimus','clarissimus, clarissima, clarissimum','clarissim','superlativo'],
  ['facundissimus','facundissimus, facundissima, facundissimum','facundissim','superlativo'],
  ['prudentissimus','prudentissimus, prudentissima, prudentissimum','prudentissim','superlativo'],
  ['opportunus','opportunus, opportuna, opportunum','opportun'],
  ['universus','universus, universa, universum','univers'],
  ['decimus','decimus, decima, decimum','decim'],
  ['proximus','proximus, proxima, proximum','proxim'],
  ['parvus','parvus, parva, parvum','parv'],
  ['liber','liber, libera, liberum','liber'],
  ['omnis','omnis, omne','omn', 'positivo','tercera clase'],
  ['secundus','secundus, secunda, secundum','secund'],
  ['nullus','nullus, nulla, nullum','null','positivo','pronominal'],
  ['alius','alius, alia, aliud','ali','positivo','pronominal'],
  ['ipse','ipse, ipsa, ipsum','ips','positivo','pronominal'],
  ['alter','alter, altera, alterum','alter','positivo','pronominal']
];
const THIRD_TWO=[
  ['fatalis','fatalis, fatale','fatal'],['mediocris','mediocris, mediocre','mediocr'],
  ['agrestis','agrestis, agreste','agrest'],['communis','communis, commune','commun'],
  ['singularis','singularis, singulare','singular'],
  ['reliquis','reliquus, reliqua, reliquum','reliqu'],
  ['innocens','innocens, innocentis','innocent','una terminación'],
  ['recens','recens, recentis','recent','una terminación'],
  ['supplex','supplex, supplicis','supplic','una terminación'],
  ['prudens','prudens, prudentis','prudent','una terminación']
];
const COMPARATIVES=[
  ['citerior','citerior, citerius','citerior'],
  ['acrior','acrior, acrius','acrior'],['minor','minor, minus','minor'],
  ['superior','superior, superius','superior'],
  ['amplior','amplior, amplius','amplior'],
  ['miserior','miserior, miserius','miserior']
];

const CUADERNO_FIRST=[
 ['publicus','publicus, publica, publicum','public'],
 ['humanissimus','humanissimus, humanissima, humanissimum','humanissim','superlativo'],
 ['creber','creber, crebra, crebrum','crebr'],
 ['integer','integer, integra, integrum','integr'],
 ['plurimus','plurimus, plurima, plurimum','plurim','superlativo'],
 ['brevissimus','brevissimus, brevissima, brevissimum','brevissim','superlativo'],
 ['durus','durus, dura, durum','dur'],
 ['multus','multus, multa, multum','mult'],
 ['bonus','bonus, bona, bonum','bon']
];
const CUADERNO_THIRD=[
 ['fortis','fortis, forte','fort'],
 ['nobilis','nobilis, nobile','nobil']
];
const CUADERNO_COMPARATIVES=[
 ['gravior','gravior, gravius','gravior'],
 ['dulcior','dulcior, dulcius','dulcior'],
 ['fortior','fortior, fortius','fortior']
];

const NUMBERS=['singular','plural'];
const V1=(stem,gender,number)=>(
  number==='singular'?
    ({masculino:[stem+'us',stem+'e',stem+'um',stem+'i',stem+'o',stem+'o'],
      femenino:[stem+'a',stem+'a',stem+'am',stem+'ae',stem+'ae',stem+'a'],
      neutro:[stem+'um',stem+'um',stem+'um',stem+'i',stem+'o',stem+'o']})[gender]:
    ({masculino:[stem+'i',stem+'i',stem+'os',stem+'orum',stem+'is',stem+'is'],
      femenino:[stem+'ae',stem+'ae',stem+'as',stem+'arum',stem+'is',stem+'is'],
      neutro:[stem+'a',stem+'a',stem+'a',stem+'orum',stem+'is',stem+'is']})[gender]
);
function nominalFirst(lemma,stem,gender,number){
  if(['liber','creber','integer'].includes(lemma)&&
      gender==='masculino'&&number==='singular'){
    const f=V1(stem,gender,number);f[0]=lemma;f[1]=lemma;return f;
  }
  if(lemma==='totus'||lemma==='nullus'||lemma==='alius'||lemma==='alter'||lemma==='ipse'){
    const f=V1(stem,gender,number);
    if(number==='singular'){
      if(lemma==='alter'&&gender==='masculino'){f[0]='alter';f[1]='alter';}
      if(lemma==='ipse'&&gender==='masculino'){f[0]='ipse';f[1]='ipse';}
      if(lemma==='alius'&&gender==='neutro'){f[0]='aliud';f[1]='aliud';f[2]='aliud';}
      if(lemma==='alter'&&gender==='neutro'){f[0]='alterum';f[1]='alterum';}
      if(lemma==='totus'||lemma==='nullus'||lemma==='alius'||lemma==='alter'){
        f[3]=({totus:'totius',nullus:'nullius',alius:'alterius',alter:'alterius'})[lemma];
        f[4]=({totus:'toti',nullus:'nulli',alius:'alii',alter:'alteri'})[lemma];
      }
      if(lemma==='ipse'){f[3]='ipsius';f[4]='ipsi';}
    }
    return f;
  }
  return V1(stem,gender,number);
}
function nominalThird(stem,gender,number,{one=false,lemma,comparative=false}={}){
  const n=number==='singular';
  if(comparative){
    const nom=gender==='neutro'?stem.slice(0,-2)+'us':stem;
    if(n)return [nom,nom,gender==='neutro'?nom:stem+'em',
      stem+'is',stem+'i',stem+'e'];
    return [gender==='neutro'?stem+'a':stem+'es',
      gender==='neutro'?stem+'a':stem+'es',
      gender==='neutro'?stem+'a':stem+'es',
      stem+'um',stem+'ibus',stem+'ibus'];
  }
  if(n){
    const nom=one?lemma:(gender==='neutro'?stem+'e':stem+'is');
    return [nom,nom,gender==='neutro'?nom:stem+'em',
      stem+'is',stem+'i',lemma==='supplex'?stem+'e':stem+'i'];
  }
  return [gender==='neutro'?stem+'ia':stem+'es',
    gender==='neutro'?stem+'ia':stem+'es',
    gender==='neutro'?stem+'ia':stem+'es',
    stem+(lemma==='supplex'?'um':'ium'),stem+'ibus',stem+'ibus'];
}
function record(lemma,headword,degree,type,flex){
  const forms=[];
  for(const gender of GENDERS)for(const number of NUMBERS){
    const values=flex(gender,number);
    assert.equal(values.length,6,'Paradigma incompleto '+lemma);
    values.forEach((form,i)=>forms.push({form,case:CASES[i],gender,number,
      analysis:'adjetivo · grado '+degree+' · '+headword+' · '+
        CASES[i]+' · '+gender+' · '+number+' · tipo '+type}));
    if(lemma==='supplex'){
      const supplemental=number==='singular'?
        [{form:'supplici',case:'ablativo',usage:'variante menos frecuente'}]:
        [{form:'supplicium',case:'genitivo',usage:'variante rara'}];
      for(const variant of supplemental)forms.push({
        ...variant,gender,number,
        analysis:'adjetivo · grado '+degree+' · '+headword+' · '+
          variant.case+' · '+gender+' · '+number+' · tipo '+type
      });
    }
  }
  return {id:'latin2-pau-school-adjective-'+lemma,language:'latin2',unit:0,
    kind:'adjetivo',headword,paradigm:headword,forms,
    evidence:{source:'Paradigma latino escolar y lemas PAU CV',
      file:[...CUADERNO_FIRST,...CUADERNO_THIRD,...CUADERNO_COMPARATIVES].some(x=>x[0]===lemma)?
        'shared/academic/latin2/cuaderno-2026-27-morfologia.tsv':
        'shared/academic/latin2/pau-cv-2006-2026.tsv',unit:0,
      status:'paradigma-documentado',topic:'Lemas PAU de adjetivos',
      caption:lemma,verification:'generación escolar; cada forma requiere cotejo si se desea certificarla individualmente',
      notes:'Paradigma completo derivado únicamente de modelo y tema declarados.'}};
}
export function compilePauSchoolAdjectives(exams,existing){
  const requested=new Set(exams.flatMap(q=>q.forms.map(latinFold)));
  const seen=new Set(existing.filter(x=>x.language==='latin2'&&x.kind==='adjetivo')
    .map(r=>latinFold(r.headword.split(',')[0])));
  const outputs=[];
  function add(row){
    if(seen.has(row.id.replace('latin2-pau-school-adjective-','')))return;
    if(!row.forms.some(f=>requested.has(latinFold(f.form))))return;
    if(outputs.some(x=>x.id===row.id))return;
    outputs.push(row);
  }
  for(const [lemma,headword,stem,degree='positivo',type='primera clase'] of [...FIRST,...CUADERNO_FIRST]){
    if(type==='tercera clase')continue;
    if(lemma==='alius'||lemma==='ipse'||lemma==='alter')continue; // pronombres / paradigmas ya declarados.
    add(record(lemma,headword,degree,type,(g,n)=>nominalFirst(lemma,stem,g,n)));
  }
  for(const [lemma,headword,stem,one] of [...THIRD_TWO,...CUADERNO_THIRD]){
    if(lemma==='reliquis')continue;
    add(record(lemma,headword,'positivo','tercera clase, '+(one||'dos terminaciones'),
      (g,n)=>nominalThird(stem,g,n,{one:one==='una terminación',lemma})));
  }
  for(const [lemma,headword,stem] of [...COMPARATIVES,...CUADERNO_COMPARATIVES]){
    add(record(lemma,headword,'comparativo','tercera declinación, dos terminaciones',
      (g,n)=>nominalThird(stem,g,n,{comparative:true})));
  }
  return outputs;
}
