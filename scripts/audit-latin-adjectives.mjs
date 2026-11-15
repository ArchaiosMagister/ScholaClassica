// Matriz de adjetivos latinos cotejada con Allen & Greenough §§110, 114–119.
// No deriva paradigmas por analogía ni modifica las fichas; comprueba cada
// casilla explícita en ambas asignaturas desde fuentes fijadas.
import assert from 'node:assert/strict';

const source='https://dcc.dickinson.edu/grammar/latin/3rd-declension-adjectives-classification-and-paradigms';
const genders=['masculino','femenino','neutro'];
const cases=['nominativo','vocativo','acusativo','genitivo','dativo','ablativo'];
const reference=[
 {name:'bonus',courseUnits:[2,3],ids:['latin-ud2-adjetivo-bonus','latin4-appendix-bonus'],
  sources:['https://dcc.dickinson.edu/grammar/latin/1st-and-2nd-declension-adjectives'],
  rows:[
   ['bonus','bona','bonum','boni','bonæ','bona'],
   ['bone','bona','bonum','boni','bonæ','bona'],
   ['bonum','bonam','bonum','bonos','bonas','bona'],
   ['boni','bonæ','boni','bonorum','bonarum','bonorum'],
   ['bono','bonæ','bono','bonis','bonis','bonis'],
   ['bono','bonā','bono','bonis','bonis','bonis']
  ]},
 {name:'brevis',courseUnits:[5,7],ids:['latin-adj-brevis','latin4-appendix-latin-adj-brevis'],
  sources:[source],rows:[
   ['brevis','brevis','breve','breves','breves','brevia'],
   ['brevis','brevis','breve','breves','breves','brevia'],
   ['brevem','brevem','breve','breves','breves','brevia'],
   ['brevis','brevis','brevis','brevium','brevium','brevium'],
   ['brevi','brevi','brevi','brevibus','brevibus','brevibus'],
   ['brevi','brevi','brevi','brevibus','brevibus','brevibus']
  ]},
 {name:'acer',courseUnits:[5,7],ids:['latin-adj-acer','latin4-appendix-latin-adj-acer'],
  sources:[source],rows:[
   ['acer','acris','acre','acres','acres','acria'],
   ['acer','acris','acre','acres','acres','acria'],
   ['acrem','acrem','acre','acres','acres','acria'],
   ['acris','acris','acris','acrium','acrium','acrium'],
   ['acri','acri','acri','acribus','acribus','acribus'],
   ['acri','acri','acri','acribus','acribus','acribus']
  ]},
 {name:'audax',courseUnits:[5,7],ids:['latin-adj-audax','latin4-appendix-latin-adj-audax'],
  sources:[source],rows:[
   ['audax','audax','audax','audaces','audaces','audacia'],
   ['audax','audax','audax','audaces','audaces','audacia'],
   ['audacem','audacem','audax','audaces','audaces','audacia'],
   ['audacis','audacis','audacis','audacium','audacium','audacium'],
   ['audaci','audaci','audaci','audacibus','audacibus','audacibus'],
   ['audaci','audaci','audaci','audacibus','audacibus','audacibus']
  ]},
 {name:'vetus',courseUnits:[5,7],ids:['latin-adj-vetus','latin4-appendix-latin-adj-vetus'],
  sources:[source],rows:[
   ['vetus','vetus','vetus','veteres','veteres','vetera'],
   ['vetus','vetus','vetus','veteres','veteres','vetera'],
   ['veterem','veterem','vetus','veteres','veteres','vetera'],
   ['veteris','veteris','veteris','veterum','veterum','veterum'],
   ['veteri','veteri','veteri','veteribus','veteribus','veteribus'],
   ['vetere','vetere','vetere','veteribus','veteribus','veteribus']
  ]}
];
export const LATIN_ADJECTIVES_RISK_REFERENCE=Object.freeze(reference);
const normalized=text=>String(text||'').normalize('NFC');
export function auditLatinAdjectiveRisk(bank){
  assert.ok(Array.isArray(bank?.records),'Banco morfológico ausente');
  const results=[];
  for(const item of LATIN_ADJECTIVES_RISK_REFERENCE){
    assert.equal(item.rows.length,6,'Matriz incompleta de '+item.name);
    for(const [i,language] of ['latin','latin4'].entries()){
      const id=item.ids[i],unit=item.courseUnits[i];
      const record=bank.records.find(r=>r.id===id);
      assert.ok(record,'Falta el paradigma '+id);
      assert.equal(record.language,language,id);
      assert.equal(record.unit,unit,id);
      assert.equal(record.kind,'adjetivo',id);
      const actual=new Map();
      for(const form of record.forms){
        const key=form.case+'|'+form.gender+'|'+form.number;
        assert.ok(!actual.has(key),'Casilla repetida: '+id+' '+key);
        actual.set(key,normalized(form.form));
      }
      assert.equal(actual.size,36,'La tabla carece de casillas: '+id);
      let checked=0;
      for(let row=0;row<6;row++){
        assert.equal(item.rows[row].length,6,'Faltan géneros o números '+item.name);
        for(let col=0;col<6;col++){
          const caseName=cases[row],gender=genders[col%3];
          const number=col<3?'singular':'plural';
          const key=caseName+'|'+gender+'|'+number;
          assert.equal(actual.get(key),normalized(item.rows[row][col]),
            'Forma discordante '+id+' '+key);
          checked++;
        }
      }
      results.push({id,course:language,unit,lemma:item.name,
        slotsChecked:checked,source:item.sources,
        status:'cotejo-matricial-con-paradigma-gramatical'});
    }
  }
  assert.equal(results.length,10);
  assert.equal(results.reduce((a,b)=>a+b.slotsChecked,0),360);
  return {schema:'scholaclassica-latin-adjective-risk/v1',
    checkedModels:10,checkedSlots:360,
    noAutomaticNewForms:true,
    note:'La matriz contrasta las 360 posiciones escolares, no acredita 360 ocurrencias textuales en autores latinos.',
    results};
}
