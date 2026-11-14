// Pronombres de Latín II en las tablas explícitas de Appendix grammaticae.
import assert from 'node:assert/strict';
const CASES={Nom:'nominativo',Ac:'acusativo',Gen:'genitivo',Dat:'dativo',Abl:'ablativo'};
const GENDERS=['masculino','femenino','neutro'];
const clean=x=>String(x).replace(/<[^>]+>/g,'').replace(/&nbsp;/g,' ')
  .replace(/&aelig;/g,'ae').replace(/&AElig;/g,'Ae').replace(/æ/g,'ae')
  .replace(/\s+/g,' ').trim().normalize('NFC');
function table(curriculum,unit,topic,caption){
  const html=curriculum.latin.units.find(x=>x.number===unit)?.topics.find(x=>x.title===topic)?.html;
  assert.ok(html,'Falta el tema de pronombres de Latín I');
  const t=[...html.matchAll(/<table\b[^>]*>([\s\S]*?)<\/table>/g)]
    .filter(x=>clean(x[1].match(/<caption[^>]*>([\s\S]*?)<\/caption>/)?.[1])===caption);
  assert.equal(t.length,1,'Tabla pronominal ausente o duplicada '+caption);
  const raw=[...t[0][1].matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/g)]
    .map(m=>[...m[1].matchAll(/<(?:td|th)\b[^>]*>([\s\S]*?)<\/(?:td|th)>/g)]
      .map(x=>clean(x[1])));
  return raw;
}
const split=s=>s.split(/\s+\/\s+/).map(clean);
function record({id,headword,type,forms,unit,topic,caption}){
  assert.ok(forms.length>=8&&forms.every(f=>f.form&&f.analysis));
  return {id:'latin2-pau-pronoun-'+id,language:'latin2',unit:0,kind:'pronombre',
    headword,paradigm:headword,forms,evidence:{
      source:'Appendix grammaticae',file:'assets/curriculum.json',
      unit:0,sourceUnit:unit,topic,caption,status:'paradigma-documentado',
      notes:'Casillas nominales explícitas. No se añaden vocativos, géneros ni personas no declaradas.'}};
}
export function compilePauPronouns(curriculum){
  const results=[];
  const personal=table(curriculum,3,'Pronombres personales','Pronombres personales');
  assert.equal(personal.length,6);
  for(const [col,id,headword,type] of [
    [1,'ego','ego','personal de primera persona'],
    [2,'tu','tu','personal de segunda persona']
  ]){
    const forms=[];
    for(const [number,sourceCol] of [['singular',col],['plural',col+2]]){
      for(const row of personal.slice(1)){
        const cas=CASES[row[0].replace('.','')];
        assert.ok(cas&&row.length===5);
        for(const form of split(row[sourceCol])){
          forms.push({form,case:cas,number,
            analysis:'pronombre · '+type+' · '+headword+' · '+cas+' · '+
              number+' · sin distinción de género'});
        }
      }
    }
    results.push(record({id,headword,type,forms,unit:3,
      topic:'Pronombres personales',caption:'Pronombres personales'}));
  }
  const reflexive=table(curriculum,5,'Pronombre reflexivo y pronombre fórico',
    'Reflexivo de tercera persona');
  assert.equal(reflexive.length,5);
  const forms=[];
  for(const row of reflexive.slice(1)){
    const cas=row[0].toLowerCase();
    assert.ok(['acusativo','genitivo','dativo','ablativo'].includes(cas));
    for(const number of ['singular','plural'])
      forms.push({form:row[1],case:cas,number,
        analysis:'pronombre · reflexivo de tercera persona · sui, sibi, se · '+
          cas+' · '+number+' · sin distinción de género'});
  }
  results.push(record({id:'sui',headword:'sui, sibi, se',type:'reflexivo',
    forms,unit:5,topic:'Pronombre reflexivo y pronombre fórico',
    caption:'Reflexivo de tercera persona'}));
  const is=table(curriculum,5,'Pronombre reflexivo y pronombre fórico',
    'Fórico · is, ea, id');
  assert.equal(is.length,6);
  const formsIs=[];
  for(const row of is.slice(1)){
    const cas=CASES[row[0].replace('.','')];assert.ok(cas&&row.length===7);
    for(let col=1;col<=6;col++){
      const number=col<=3?'singular':'plural',gender=GENDERS[(col-1)%3];
      for(const form of split(row[col])){
        formsIs.push({form,case:cas,gender,number,
          analysis:'pronombre · fórico · is, ea, id · '+cas+' · '+gender+' · '+number});
      }
    }
  }
  results.push(record({id:'is',headword:'is, ea, id',type:'fórico',forms:formsIs,
    unit:5,topic:'Pronombre reflexivo y pronombre fórico',
    caption:'Fórico · is, ea, id'}));
  assert.equal(results.length,4);
  return results;
}
