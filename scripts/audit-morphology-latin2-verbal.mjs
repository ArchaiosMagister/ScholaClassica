// Auditoría verbal de Latín II, fase 2: flexiones irregulares, deponentes,
// imperativos, formas impersonales y concurrencia entre categorías gramaticales.
// La comprobación estructural no es una certificación individual lexicográfica.
import assert from 'node:assert/strict';
const norm=x=>String(x||'').normalize('NFC').toLowerCase()
  .replace(/æ/g,'ae').replace(/œ/g,'oe')
  .normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
const verbKinds=['verbo','infinitivo','participio'];
const IMPERATIVES=[
  // Lema | singular | plural | tipo
  ['latin2-pau-regular-verb-amo','ama','amate','activa'],
  ['latin2-pau-regular-verb-habeo','habe','habete','activa'],
  ['latin2-pau-regular-verb-moneo','mone','monete','activa'],
  ['latin2-pau-regular-verb-duco','duc','ducite','activa'],
  ['latin2-pau-regular-verb-dico','dic','dicite','activa'],
  ['latin2-pau-regular-verb-facio','fac','facite','activa'],
  ['latin2-pau-regular-verb-capio','cape','capite','activa'],
  ['latin2-pau-regular-verb-audio','audi','audite','activa'],
  ['latin2-pau-regular-verb-moror','morare','moramini','deponente'],
  ['latin2-pau-regular-verb-populor','populare','populamini','deponente'],
  ['latin2-pau-regular-verb-polliceor','pollicere','pollicemini','deponente'],
  ['latin2-pau-regular-verb-sequor','sequere','sequimini','deponente'],
  ['latin2-pau-regular-verb-proficiscor','proficiscere','proficiscimini','deponente'],
  ['latin2-pau-regular-verb-patior','patere','patimini','deponente'],
  ['latin2-pau-regular-verb-adorior','adorire','adorimini','deponente'],
  ['latin2-cuaderno-irregular-fero','fer','ferte','activa'],
  ['latin2-cuaderno-irregular-eo','i','ite','activa'],
  ['latin2-pau-irregular-sum','es','este','activa'],
  ['latin2-cuaderno-irregular-confero','confer','conferte','activa'],
  ['latin2-cuaderno-irregular-refero','refer','referte','activa'],
  ['latin2-cuaderno-irregular-differo','differ','differte','activa']
];
const INVALID=[
  ['latin2-pau-regular-verb-dico','dice','imperativo'],
  ['latin2-pau-regular-verb-duco','duce','imperativo'],
  ['latin2-pau-regular-verb-facio','face','imperativo'],
  ['latin2-pau-regular-verb-sequor','seque','imperativo'],
  ['latin2-pau-regular-verb-patior','pati','imperativo'],
  ['latin2-pau-regular-verb-polliceor','pollice','imperativo'],
  ['latin2-cuaderno-irregular-fio','fecit','perfecto'],
  ['latin2-cuaderno-irregular-eo','itae sunt','perfecto']
];
const CANONICAL=[
  ['latin2-cuaderno-irregular-fero','feram','futuro','indicativo','activa'],
  ['latin2-cuaderno-irregular-fero','feram','presente','subjuntivo','activa'],
  ['latin2-cuaderno-irregular-fio','fiam','futuro','indicativo','activa'],
  ['latin2-cuaderno-irregular-fio','fiam','presente','subjuntivo','activa'],
  ['latin2-cuaderno-irregular-eo','ierunt','perfecto','indicativo','activa'],
  ['latin2-cuaderno-irregular-eo','iverunt','perfecto','indicativo','activa'],
  ['latin2-cuaderno-irregular-eo','itur','presente','indicativo','pasiva'],
  ['latin2-cuaderno-irregular-eo','itum est','perfecto','indicativo','pasiva'],
  ['latin2-cuaderno-irregular-fio','factus est','perfecto','indicativo','pasiva'],
  ['latin2-cuaderno-irregular-fio','facta sim','perfecto','subjuntivo','pasiva'],
  ['latin2-cuaderno-irregular-volo','vellem','imperfecto','subjuntivo','activa'],
  ['latin2-cuaderno-irregular-volo','voluit','perfecto','indicativo','activa'],
  ['latin2-cuaderno-irregular-refero','rettuli','perfecto','indicativo','activa'],
  ['latin2-cuaderno-irregular-refero','retuli','perfecto','indicativo','activa'],
  ['latin2-cuaderno-irregular-confero','collata erant','pluscuamperfecto','indicativo','pasiva'],
  ['latin2-pau-regular-verb-mitto','mitteris','presente','indicativo','pasiva'],
  ['latin2-pau-regular-verb-mitto','mitteris','futuro','indicativo','pasiva'],
  ['latin2-pau-regular-verb-instituo','instituit','presente','indicativo','activa'],
  ['latin2-pau-regular-verb-instituo','instituit','perfecto','indicativo','activa']
];
const NO_PERSONAL_PASSIVE=['latin2-cuaderno-irregular-eo','latin2-cuaderno-irregular-fio'];
function reportIssue(issues,code,id,form,detail){issues.push({code,id,form,detail});}
const isVariant=f=>/variante|poco frecuente|menos frecuente|rara/i.test(f.usage||'');
function hasMorph(r,form,tense,mood,voice){
  return r?.forms.some(f=>norm(f.form)===norm(form)&&
    f.analysis.includes(' · '+tense+' · '+mood+' · voz '+voice))||false;
}
export function auditLatin2Verbal(bank){
  assert.ok(Array.isArray(bank?.records)&&bank.coverage?.latin2?.includes(0));
  const records=bank.records.filter(r=>r.language==='latin2'&&verbKinds.includes(r.kind));
  const lookup=new Map(records.map(r=>[r.id,r]));
  const blocking=[],review=[];
  let cells=0,compounds=0;
  for(const r of records){
    if(!r.headword||!r.forms?.length){
      reportIssue(blocking,'EMPTY_VERBAL_PARADIGM',r.id,'','Falta enunciado o formas');
      continue;
    }
    for(const f of r.forms){
      cells++;
      if(f.form?.includes(' '))compounds++;
      if(typeof f.form!=='string'||!f.form.trim()||
         typeof f.analysis!=='string'||
         !f.analysis.startsWith(r.kind+' · '+r.headword+' · ')){
        reportIssue(blocking,'INVALID_VERBAL_SOURCE',r.id,f.form,
          'Falta categoría, enunciado o forma');
        continue;
      }
      if(!f.analysis.includes(' · voz ')){
        reportIssue(blocking,'VOICE_MISSING',r.id,f.form,'Voz no documentada');
      }
      if(r.kind==='verbo'&&!/^verbo · .+ · [123]\.ª persona · (singular|plural) · (presente|imperfecto|futuro|perfecto|pluscuamperfecto|futuro perfecto) · (indicativo|subjuntivo|imperativo) · voz /.test(f.analysis)){
        reportIssue(blocking,'INVALID_FINITE_ANALYSIS',r.id,f.form,
          'Persona, número, tiempo o modo inválidos');
      }
      if(r.kind==='participio'&&!f.analysis.includes(' · '+f.case+' · '+
          f.gender+' · '+f.number)){
        reportIssue(blocking,'PARTICIPLE_ACCIDENT_MISSING',r.id,f.form,
          'Caso, género o número ausentes');
      }
    }
  }
  for(const [id,singular,plural,type] of IMPERATIVES){
    const r=lookup.get(id);
    if(!r){reportIssue(blocking,'EXPECTED_VERB_MISSING',id,'','Falta paradigma');continue;}
    for(const [number,form] of [['singular',singular],['plural',plural]]){
      const hits=r.forms.filter(f=>norm(f.form)===norm(form)&&
        f.mood==='imperativo'&&f.number===number&&
        f.analysis.includes('2.ª persona · '+number+' · presente · imperativo'));
      if(!hits.length||type==='deponente'&&!hits.some(f=>f.voice?.includes('deponente')))
        reportIssue(blocking,'IMPERATIVE_MISSING',id,form,'Imperativo presente '+number+' '+type);
    }
  }
  const fero=lookup.get('latin2-cuaderno-irregular-fero');
  for(const [form,number] of [['ferre','singular'],['ferimini','plural']]){
    if(!fero?.forms.some(f=>norm(f.form)===form&&f.mood==='imperativo'&&
      f.voice==='pasiva'&&f.number===number))
      reportIssue(blocking,'FERO_PASSIVE_IMPERATIVE_MISSING',fero?.id||'fero',form,'A&G §200');
  }
  for(const [id,form,type] of INVALID){
    const r=lookup.get(id);
    if(r?.forms.some(f=>norm(f.form)===form&&
      (type==='imperativo'?f.mood==='imperativo':
        f.tense===type&&f.mood==='indicativo')))
      reportIssue(blocking,'INVENTED_VERBAL_FORM',id,form,
        'El paradigma no admite esta forma o este accidente gramatical');
  }
  for(const [id,form,tense,mood,voice] of CANONICAL){
    const r=lookup.get(id);
    if(!hasMorph(r,form,tense,mood,voice))
      reportIssue(blocking,'ATTESTED_READING_MISSING',id,form,
        tense+' '+mood+' '+voice);
  }
  const eo=lookup.get('latin2-cuaderno-irregular-eo');
  if(eo){
    for(const f of eo.forms.filter(f=>f.voice==='pasiva')){
      if(f.person!=='3.ª singular'||f.construction!=='impersonal')
        reportIssue(blocking,'EO_PERSONAL_PASSIVE',eo.id,f.form,
          'El eo simple solo posee pasiva impersonal de 3.ª singular');
    }
    for(const form of ['ivi','ivisti','iveram','iveris','ivissem']){
      const occurrences=eo.forms.filter(f=>norm(f.form)===form);
      if(!occurrences.length||!occurrences.every(isVariant))
        reportIssue(blocking,'EO_VARIANT_NOT_LABELLED',eo.id,form,
          'La forma con -v- debe distinguirse como variante de uso menos frecuente');
    }
  }
  const fio=lookup.get('latin2-cuaderno-irregular-fio');
  for(const form of ['fimus','fitis']){
    const entries=fio?.forms.filter(f=>norm(f.form)===form)||[];
    if(!entries.length||!entries.every(isVariant))
      reportIssue(blocking,'FIO_RARE_FORM_UNLABELLED',fio?.id||'fio',form,
        'Forma de empleo restringido que no debe sortearse normalmente');
  }
  const eoPart=lookup.get('latin2-audit-irregular-participle-eo');
  if(!eoPart||!['iens','euntis','euntium','iturus','iturae'].every(
    form=>eoPart.forms.some(f=>norm(f.form)===form)))
    reportIssue(blocking,'EO_PARTICIPLES_INCOMPLETE','eo','iens/iturus',
      'Faltan paradigmas presentes/futuros de eo');
  if(eoPart?.forms.some(f=>['itus','ita','itum'].includes(norm(f.form))))
    reportIssue(blocking,'EO_FALSE_PERSONAL_PERFECT_PARTICIPLE',eoPart.id,'itus',
      'No se admite participio perfecto personal de eo');
  for(const id of NO_PERSONAL_PASSIVE){
    const r=lookup.get(id);
    if(!r)continue;
    if(id.endsWith('-fio')&&r.forms.some(f=>f.form==='feci'))
      reportIssue(blocking,'FIO_SYNTHETIC_PERFECT',id,'feci',
        'feci pertenece a facio, no a fio');
  }
  if(lookup.get('latin2-pau-regular-verb-noceo'))
    review.push({code:'NOCEO_PASSIVE_USAGE',id:'latin2-pau-regular-verb-noceo',
      detail:'Las formas pasivas personales figuran en algunos repertorios, pero se utiliza preferentemente la pasiva impersonal; cotejo de corpus pendiente'});
  review.push({code:'PARADIGM_GENERATION_NOT_INDIVIDUALLY_CERTIFIED',
    id:'latin2-all-verbs',detail:'La auditoría estructural no implica cotejo de cada una de las casillas con textos clásicos'});
  return {
    schema:'schola-latin2-verbal-audit/v1',scope:'Latín II, sistema verbal por conjugación',
    summary:{records:records.length,checkedCells:cells,
      compounds,byCategory:Object.fromEntries(verbKinds.map(k=>
        [k,records.filter(r=>r.kind===k).length])),
      imperativeModels:IMPERATIVES.length,canonicalReadings:CANONICAL.length,
      negativeControls:INVALID.length},
    blockingIssues:blocking,reviewIssues:review,
    completeIndividualVerification:false};
}
export function assertLatin2VerbalAuditPasses(report){
  assert.equal(report.blockingIssues.length,0,
    'Errores verbales bloqueantes: '+report.blockingIssues.map(
      x=>x.code+' '+x.id+' '+x.form).join(' | '));
}
