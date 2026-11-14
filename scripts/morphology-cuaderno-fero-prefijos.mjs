// Prefijados irregulares de fero: la prefijación afecta de manera distinta
// al tema de presente (fer-), al perfecto (tul-) y al supino (lat-).
import assert from 'node:assert/strict';
import {compileCuadernoIrregulars} from './morphology-cuaderno-irregulars.mjs';
const MODELS=[
  ['confero','confero, conferre, contuli, collatum (irregular)','con','con','col'],
  ['refero','refero, referre, retuli (rettuli), relatum (irregular)','re','re','re'],
  ['differo','differo, differre, distuli, dilatum (irregular)','dif','dis','di']
];
const replacement=(form,prs,perf,pass)=>
  form.startsWith('fer')?prs+form:
  form.startsWith('tul')?perf+form:
  form.startsWith('lat')?pass+form:
  (()=>{throw Error('Tema inesperado al prefijar fero: '+form)})();
export function compileCuadernoFeroCompounds(){
  const records=compileCuadernoIrregulars();
  const baseFinite=records.find(r=>r.id==='latin2-cuaderno-irregular-fero');
  const baseInf=records.find(r=>r.id==='latin2-cuaderno-irregular-infinitivo-fero');
  const basePart=records.find(r=>r.id==='latin2-cuaderno-irregular-participio-fero');
  assert.ok(baseFinite&&baseInf&&basePart);
  const output=[];
  for(const [id,headword,prs,perf,pass] of MODELS){
    const source='Cuaderno de Latín II 2026–27: paradigmas de fero y textos pp. 18–48';
    const evid={source,file:'shared/academic/latin2/cuaderno-2026-27-morfologia.tsv',
      unit:0,topic:'Compuestos irregulares de fero',caption:id,
      status:'paradigma-documentado',
      verification:'prefijos con los temas de presente, perfecto y supino cotejados por separado',
      notes:'El verbo heredado de fero conserva su paradigma con tema irregular y auxiliar completo.'};
    for(const [parent,kind,suffix] of [
      [baseFinite,'verbo',''],[baseInf,'infinitivo','-infinitivo'],
      [basePart,'participio','-participio']
    ]){
      const forms=parent.forms.map(f=>{
        const form=replacement(f.form,prs,perf,pass);
        return {...f,form,analysis:f.analysis.replaceAll(baseFinite.headword,headword)};
      });
      assert.equal(forms.length,parent.forms.length,id+' '+kind);
      output.push({id:'latin2-cuaderno-irregular-'+id+suffix,
        language:'latin2',unit:0,kind,headword,paradigm:headword,
        forms,evidence:evid});
    }
  }
  const get=(id,form)=>output.find(r=>r.id===id)?.forms.some(f=>f.form===form);
  assert.ok(get('latin2-cuaderno-irregular-confero','collata erant'));
  assert.ok(get('latin2-cuaderno-irregular-differo','differunt'));
  assert.ok(get('latin2-cuaderno-irregular-refero-infinitivo','referri'));
  assert.ok(get('latin2-cuaderno-irregular-confero-participio','collata'));
  return output;
}
