// Últimas excepciones de PAU: indefinidos, alius, un adjetivo épico,
// un pluralia tantum y sustantivos con temas explícitos.
import assert from 'node:assert/strict';
import {latinFold} from './morphology-pau-latin2.mjs';
const CASES=['nominativo','acusativo','genitivo','dativo','ablativo'];
const GENDERS=['masculino','femenino','neutro'];
const NUMBERS=['singular','plural'];
const QUIDAM={
  singular:{
    nominativo:[['quidam'],['quaedam'],['quiddam','quoddam']],
    acusativo:[['quendam'],['quandam'],['quiddam','quoddam']],
    genitivo:[['cuiusdam'],['cuiusdam'],['cuiusdam']],
    dativo:[['cuidam'],['cuidam'],['cuidam']],
    ablativo:[['quodam'],['quadam'],['quodam']]
  },
  plural:{
    nominativo:[['quidam'],['quaedam'],['quaedam']],
    acusativo:[['quosdam'],['quasdam'],['quaedam']],
    genitivo:[['quorundam'],['quarundam'],['quorundam']],
    dativo:[['quibusdam'],['quibusdam'],['quibusdam']],
    ablativo:[['quibusdam'],['quibusdam'],['quibusdam']]
  }
};
const QUISQUE={
  singular:{
    nominativo:[['quisque'],['quaeque'],['quidque','quodque']],
    acusativo:[['quemque'],['quamque'],['quidque','quodque']],
    genitivo:[['cuiusque'],['cuiusque'],['cuiusque']],
    dativo:[['cuique'],['cuique'],['cuique']],
    ablativo:[['quoque'],['quaque'],['quoque']]
  },
  plural:{
    nominativo:[['quique'],['quaeque'],['quaeque']],
    acusativo:[['quosque'],['quasque'],['quaeque']],
    genitivo:[['quorumque'],['quarumque'],['quorumque']],
    dativo:[['quibusque'],['quibusque'],['quibusque']],
    ablativo:[['quibusque'],['quibusque'],['quibusque']]
  }
};
const ALIUS={
  singular:{
    nominativo:[['alius'],['alia'],['aliud']],
    acusativo:[['alium'],['aliam'],['aliud']],
    genitivo:[['alterius','alius'],['alterius','alius'],['alterius','alius']],
    dativo:[['alii'],['alii'],['alii']],
    ablativo:[['alio'],['alia'],['alio']]
  },
  plural:{
    nominativo:[['alii'],['aliae'],['alia']],
    acusativo:[['alios'],['alias'],['alia']],
    genitivo:[['aliorum'],['aliarum'],['aliorum']],
    dativo:[['aliis'],['aliis'],['aliis']],
    ablativo:[['aliis'],['aliis'],['aliis']]
  }
};
function lexeme(id,kind,headword,forms,source,detail){
  assert.ok(forms.length>=6&&forms.every(f=>f.form&&f.analysis));
  return {id:'latin2-pau-exception-'+id,language:'latin2',unit:0,kind,
    headword,paradigm:headword,forms,evidence:{
      source,file:'shared/academic/latin2/pau-cv-2006-2026.tsv',
      unit:0,status:'paradigma-documentado',
      topic:'Paradigmas particulares de PAU',caption:id,
      verification:'tabla morfológica explícita; no procede de una única forma aislada',
      notes:detail
    }};
}
function pronoun(id,headword,type,table){
  const forms=[];
  for(const number of NUMBERS)for(const cas of CASES){
    const cells=table[number][cas];assert.equal(cells.length,3);
    for(const [i,gender] of GENDERS.entries()){
      for(const form of cells[i]){
        forms.push({form,case:cas,gender,number,
          ...(id==='alius'&&cas==='genitivo'&&form==='alius'?
            {usage:'genitivo singular poco frecuente; alterius es preferido'}:{}),
          analysis:'pronombre · '+type+' · '+headword+
            ' · '+cas+' · '+gender+' · '+number});
      }
    }
  }
  return lexeme(id,'pronombre',headword,forms,
    'Gramática latina: paradigma de pronombres indefinidos',
    'Se declina el pronombre en cinco casos y ambos números; sin vocativo.');
}
function noun(id,headword,gender,decl,grid){
  const forms=[];
  for(const [number,cells] of grid){
    assert.equal(cells.length,6);
    for(const [i,cas] of ['nominativo','vocativo','acusativo',
      'genitivo','dativo','ablativo'].entries()){
      forms.push({form:cells[i],case:cas,gender,number,
        analysis:'sustantivo · '+headword+' · '+cas+
          ' · '+gender+' · '+number+' · '+decl+' declinación'});
    }
  }
  return lexeme(id,'sustantivo',headword,forms,
    'Gramática latina, enunciado nominal y paradigma de declinación',
    'Género léxico único; para deliciae no se genera singular.');
}
function adjective(id,headword,degree,type,formGenerator){
  const forms=[];
  for(const gender of GENDERS)for(const number of NUMBERS){
    const cells=formGenerator(gender,number);
    if(!cells)continue;
    assert.equal(cells.length,6);
    for(const [i,cas] of ['nominativo','vocativo','acusativo',
      'genitivo','dativo','ablativo'].entries()){
      const variants=Array.isArray(cells[i])?cells[i]:[cells[i]];
      for(const form of variants)forms.push({form,case:cas,gender,number,
        analysis:'adjetivo · grado '+degree+' · '+headword+
          ' · '+cas+' · '+gender+' · '+number+' · tipo '+type});
    }
  }
  return lexeme(id,'adjetivo',headword,forms,
    'Lema latino y paradigma de la tercera declinación',
    'Casillas completas; variantes expresas del neutro plural.');
}
export function compilePauExceptions(exams){
  const requested=new Set(exams.flatMap(q=>q.forms.map(latinFold)));
  const binom=adjective('binominis','binominis, binomine','positivo',
    'tercera declinación, dos terminaciones',(gender,number)=>{
      const neut=gender==='neutro';
      return number==='singular'?
        [neut?'binomine':'binominis',neut?'binomine':'binominis',
          neut?'binomine':'binominem','binominis','binomini','binomini']:
        [neut?'binominia':'binomines',neut?'binominia':'binomines',
          neut?'binominia':'binomines','binominium','binominibus','binominibus'];
    });
  const compl=adjective('complures','complures, complura','positivo',
    'tercera declinación, plural', (gender,number)=>{
      if(number==='singular')return null;
      const neut=gender==='neutro';
      const nom=neut?['complura','compluria']:'complures';
      return [nom,nom,nom,'complurium','compluribus','compluribus'];
    });
  const objects=[
    pronoun('quidam','quidam, quaedam, quiddam (quoddam)','indefinido',QUIDAM),
    pronoun('quisque','quisque, quaeque, quidque (quodque)','distributivo',QUISQUE),
    pronoun('alius','alius, alia, aliud','indefinido pronominal',ALIUS),
    binom,compl,
    noun('deliciae','deliciae, deliciarum','femenino','1.ª',[
      ['plural',['deliciae','deliciae','delicias','deliciarum','deliciis','deliciis']]
    ]),
    noun('civis','civis, civis','masculino','3.ª',[
      ['singular',['civis','civis','civem','civis','civi','cive']],
      ['plural',['cives','cives','cives','civium','civibus','civibus']]
    ]),
    noun('percussor','percussor, percussoris','masculino','3.ª',[
      ['singular',['percussor','percussor','percussorem','percussoris','percussori','percussore']],
      ['plural',['percussores','percussores','percussores','percussorum','percussoribus','percussoribus']]
    ])
  ];
  assert.equal(objects.length,8);
  for(const entry of objects)assert.ok(entry.forms.some(f=>requested.has(latinFold(f.form))),
    'Excepción no presente en el PDF: '+entry.id);
  return objects;
}
