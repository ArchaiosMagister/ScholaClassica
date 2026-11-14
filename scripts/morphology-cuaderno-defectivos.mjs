// Defectivos y auxiliares de las unidades del Cuaderno de Latín II.
// No se inventan personas para licet: es impersonal de 3.ª singular.
const mood=(headword,form,tense,modo,voice='activa')=>({
  form,person:'3.ª singular',number:'singular',tense,mood:modo,voice,
  analysis:'verbo · '+headword+
    ' · 3.ª persona · singular · '+tense+' · '+modo+' · voz '+voice+
    ' (impersonal)'
});
const evidence=(label)=>({
  source:'Cuaderno de Latín II 2026–27, pp. 5, 39 y 49',
  file:'shared/academic/latin2/cuaderno-2026-27-morfologia.tsv',
  unit:0,topic:'Verbos impersonales e infinitivo de sum',caption:label,
  status:'paradigma-documentado',
  notes:'Se conservan únicamente las personas admisibles y el enunciado completo.'});
export function compileCuadernoDefectives(){
  const head='licet, licere, licuit (2.ª impersonal)';
  const forms=[
    ['licet','presente','indicativo'],
    ['licebat','imperfecto','indicativo'],
    ['licebit','futuro','indicativo'],
    ['licuit','perfecto','indicativo'],
    ['licuerat','pluscuamperfecto','indicativo'],
    ['licuerit','futuro perfecto','indicativo'],
    ['liceat','presente','subjuntivo'],
    ['liceret','imperfecto','subjuntivo'],
    ['licuerit','perfecto','subjuntivo'],
    ['licuisset','pluscuamperfecto','subjuntivo']
  ].map(([form,tense,modo])=>mood(head,form,tense,modo));
  const h='sum, esse, fui (irregular)';
  const inf=[
    ['esse','presente','activa'],
    ['fuisse','perfecto','activa'],
    ['futurum esse','futuro','activa'],
    ['fore','futuro','activa']
  ].map(([form,tense,voice])=>({
    form,tense,voice,analysis:'infinitivo · '+h+' · '+tense+' · voz '+voice
  }));
  return [
    {id:'latin2-cuaderno-impersonal-licet',language:'latin2',unit:0,
      kind:'verbo',headword:head,paradigm:head,forms,evidence:evidence('licet')},
    {id:'latin2-cuaderno-infinitivo-sum',language:'latin2',unit:0,
      kind:'infinitivo',headword:h,paradigm:h,forms:inf,evidence:evidence('sum')}
  ];
}
