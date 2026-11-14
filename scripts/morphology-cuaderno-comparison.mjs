// Comparación nominal irregular y sus familias del Cuaderno de Latín II, p. 67.
// El paradigma flexivo se limita a formas escolares documentadas y al lema
// realmente explicado; no se crea un *veterior* como comparativo automático.
import assert from 'node:assert/strict';
const GENDERS=['masculino','femenino','neutro'];
const CASES=['nominativo','vocativo','acusativo','genitivo','dativo','ablativo'];
const NUMBERS=['singular','plural'];
const FIRST=[
  ['malus','malus, mala, malum','mal','positivo'],
  ['propinquus','propinquus, propinqua, propinquum','propinqu','positivo'],
  ['optimus','optimus, optima, optimum','optim','superlativo'],
  ['pessimus','pessimus, pessima, pessimum','pessim','superlativo'],
  ['maximus','maximus, maxima, maximum','maxim','superlativo'],
  ['minimus','minimus, minima, minimum','minim','superlativo'],
  ['plurimus','plurimus, plurima, plurimum','plurim','superlativo'],
  ['veterrimus','veterrimus, veterrima, veterrimum','veterrim','superlativo'],
  ['proximus','proximus, proxima, proximum','proxim','superlativo'],
  ['facillimus','facillimus, facillima, facillimum','facillim','superlativo'],
  ['pulcherrimus','pulcherrimus, pulcherrima, pulcherrimum','pulcherrim','superlativo'],
  ['altissimus','altissimus, altissima, altissimum','altissim','superlativo']
];
const COMPARATIVES=[
  ['melior','melior, melius'],
  ['peior','peior, peius'],
  ['maior','maior, maius'],
  ['minor','minor, minus'],
  ['propior','propior, propius'],
  ['vetustior','vetustior, vetustius']
];
function first(stem,gender,number){
  if(number==='singular')return {
    masculino:[stem+'us',stem+'e',stem+'um',stem+'i',stem+'o',stem+'o'],
    femenino:[stem+'a',stem+'a',stem+'am',stem+'ae',stem+'ae',stem+'a'],
    neutro:[stem+'um',stem+'um',stem+'um',stem+'i',stem+'o',stem+'o']
  }[gender];
  return {
    masculino:[stem+'i',stem+'i',stem+'os',stem+'orum',stem+'is',stem+'is'],
    femenino:[stem+'ae',stem+'ae',stem+'as',stem+'arum',stem+'is',stem+'is'],
    neutro:[stem+'a',stem+'a',stem+'a',stem+'orum',stem+'is',stem+'is']
  }[gender];
}
function comparative(stem,gender,number){
  const neut=gender==='neutro';
  if(number==='singular'){
    const nominative=neut?stem.slice(0,-2)+'us':stem;
    return [nominative,nominative,neut?nominative:stem+'em',
      stem+'is',stem+'i',stem+'e'];
  }
  const nom=neut?stem+'a':stem+'es';
  return [nom,nom,nom,stem+'um',stem+'ibus',stem+'ibus'];
}
function record(id,headword,degree,type,generate){
  const forms=[];
  for(const gender of GENDERS)for(const number of NUMBERS){
    const values=generate(gender,number);
    assert.equal(values.length,6);
    for(const [i,cas] of CASES.entries()){
      const form=values[i];
      forms.push({form,case:cas,gender,number,
        analysis:'adjetivo · grado '+degree+' · '+headword+
          ' · '+cas+' · '+gender+' · '+number+' · tipo '+type});
    }
  }
  return {id:'latin2-cuaderno-nominal-adjective-'+id,language:'latin2',
    unit:0,kind:'adjetivo',headword,paradigm:headword,forms,
    evidence:{source:'Cuaderno de Latín II 2026–27, p. 67; Allen y Greenough §§125–129',
      file:'shared/academic/latin2/cuaderno-2026-27-morfologia.tsv',
      unit:0,topic:'Comparación irregular y adjetivos del cuaderno',
      caption:headword,status:'paradigma-documentado',
      verification:'flexión escolar de temas léxicos explícitos; no certificación individual de cada forma',
      notes:'Se conserva el grado del lema. Vetustior se distingue de veterrimus y no se infiere veteranamente de vetus.'}};
}
function plures(){
  const head='plures, plura',forms=[];
  for(const gender of GENDERS){
    const neut=gender==='neutro';
    const values=[neut?'plura':'plures',neut?'plura':'plures',
      neut?'plura':'plures','plurium','pluribus','pluribus'];
    for(const [i,cas] of CASES.entries()){
      forms.push({form:values[i],case:cas,gender,number:'plural',
        analysis:'adjetivo · grado comparativo · '+head+' · '+
          cas+' · '+gender+' · plural · tipo comparativo irregular'});
    }
  }
  return {id:'latin2-cuaderno-nominal-adjective-plures',language:'latin2',
    unit:0,kind:'adjetivo',headword:head,paradigm:head,forms,
    evidence:{source:'Cuaderno Latín II p. 67; Allen y Greenough §129 (multus, plus / plures)',
      file:'shared/academic/latin2/cuaderno-2026-27-morfologia.tsv',
      unit:0,status:'paradigma-documentado',topic:'Comparativos plurales',
      caption:head,notes:'No se inventa singular masculino o femenino de plures; plūs exige paradigma distinto.'}};
}
export function compileCuadernoComparativeReference(existing=[]){
  const known=new Set(existing.filter(r=>r.language==='latin2'&&r.kind==='adjetivo')
    .map(r=>r.headword.split(',')[0].toLowerCase().normalize('NFD')
      .replace(/[\u0300-\u036f]/g,'')));
  const candidates=[
    ...FIRST.map(([id,head,stem,degree])=>
      record(id,head,degree,'primera clase, tres terminaciones',
        (g,n)=>first(stem,g,n))),
    ...COMPARATIVES.map(([id,head])=>
      record(id,head,'comparativo','tercera declinación, dos terminaciones',
        (g,n)=>comparative(id,g,n))),
    plures()
  ];
  const result=candidates.filter(r=>!known.has(r.headword.split(',')[0].toLowerCase()));
  assert.ok(result.every(r=>r.forms.length===36||r.forms.length===18));
  return result;
}
