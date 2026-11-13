// Segunda auditoría: distinguir palabras de otras categorías gramaticales,
// curriculum futuro, lecturas incompletas y decisiones verdaderamente docentes.
// NUNCA cambia paradigmas ni usa una categoría heurística como solución.
import assert from 'node:assert/strict';

const norm=s=>String(s||'').toLocaleLowerCase('el').normalize('NFD')
 .replace(/\p{M}/gu,'').replace(/ς/g,'σ')
 .replace(/æ/g,'ae').replace(/œ/g,'oe').trim();
function category(item){
  const form=String(item.sources?.[0]?.form||'');
  const lemma=String(item.lemma||'');
  const tail=form.split(',').slice(1).join(',').trim();
  const reason=String(item.reason||'');
  const n=norm(lemma), t=norm(tail);
  if(item.status!=='pendiente')return {group:item.status,confidence:'documental'};
  if(item.language==='latin'){
    // Enunciados verbales inequívocos por sus marcas de conjugación,
    // lexema sum/possum y formas de infinitivo o perfecto.
    if(/\b(?:[1-5]ª|mx\.|irr\.|deponente|vbo|verb\.)/iu.test(form)||
      /^(?:sum|possum|absum|praesum|nolo|volo|timeo|careo|disco|fugio|moror|complector|conor|intueor|laetor|proficiscor|soleo|vereor|audeo|gaudeo|gratulor|loquor|miror|nascor|obliviscor|orior|patior|polliceor|revertor|sequor|utor|elabor|urgeo|resisto|admiror|lavor|persequor)$/u.test(n))
      return {group:'verbo-para-fase-posterior',confidence:'enunciado-inequivoco'};
    // El enunciado -is/-e (M/F-N) es propio de adjetivos de la
    // tercera declinación, no un genitivo nominal.
    if(/^[-–−]?e(?:\s|$|\()/u.test(t)&&/(?:is|iens|ens)$/u.test(n))
      return {group:'adjetivo-para-fase-posterior',confidence:'enunciado-de-dos-terminaciones'};
    if(reason.includes('Unidad posterior a UD10'))
      return {group:'unidad-superior-a-ud10',confidence:'unidad-docente-explicita'};
    if(/^(?:quis|tres)$/u.test(n))
      return {group:'pronombre-numeral-fase-posterior',confidence:'enunciado-docente'};
    if(reason.includes('Genitivos divergentes'))
      return {group:'homonimia-o-declinacion-mixta-revision',confidence:'pendiente'};
    if(reason.includes('Faltan casillas')||reason.includes('Sin paradigma')||
      reason.includes('Sin lema nominal'))
      return {group:'fuente-incompleta-o-ausente',confidence:'no-inferir'};
    return {group:'pendiente-lexicografia',confidence:'no-inferir'};
  }
  if(item.language==='griego'){
    // Enunciados -ος,-ον inequívocamente adjetivales: no se
    // reclasifican como sustantivos aunque puedan sustantivarse en contexto.
    if(/ος$/u.test(n)&&/^[–−-]\s*ον(?:\s|$)/u.test(t))
      return {group:'adjetivo-para-fase-posterior',confidence:'enunciado-de-dos-terminaciones'};
    if(reason.includes('No hay diez'))
      return {group:'fuente-incompleta-o-ausente',confidence:'no-inferir'};
    if(reason.includes('Modelo flexivo'))
      return {group:'modelo-fuera-del-curriculo-o-irregular',confidence:'no-inferir'};
    return {group:'pendiente-lexicografia',confidence:'no-inferir'};
  }
  throw Error('Idioma ajeno a triage');
}
const choiceSpec=[
 {id:'latin-domus',language:'latin',lemma:'domus',
  issue:'La cuarta declinación de domus tiene formas mezcladas con la segunda.',
  recommendation:'conservar-variantes-documentadas',
  choices:[
    {value:'conservar-variantes-documentadas',label:'Incluir las variantes documentadas'},
    {value:'solo-cuarta',label:'Exigir solo la cuarta declinación'},
    {value:'aplazar',label:'No incluir hasta revisión posterior'}],
  source:'https://dcc.dickinson.edu/grammar/latin/4th-declension-case-forms'},
 {id:'latin-liber',language:'latin',lemma:'liber',
  issue:'liber, libri (libro) y liber, libera, liberum (libre) son lemas/homónimos distintos.',
  recommendation:'separar-libro',
  choices:[
    {value:'separar-libro',label:'Solo liber, libri en sustantivos'},
    {value:'guardar-ambos',label:'Guardar por separado sustantivo y adjetivo'},
    {value:'aplazar',label:'Dejar ambos fuera del sorteo'}],
  source:'https://en.wiktionary.org/wiki/liber#Latin'},
 {id:'latin-cantus',language:'latin',lemma:'cantus',
  issue:'El banco presenta cantus, -us; la fuente mezcla posibles variantes de genitivo.',
  recommendation:'cuarta-sin-mezcla',
  choices:[
    {value:'cuarta-sin-mezcla',label:'Restringir al tema de cuarta'},
    {value:'estudiar-variantes',label:'Examinar también los genitivos alternantes'},
    {value:'aplazar',label:'Mantener el lema en cuarentena'}],
  source:'https://dcc.dickinson.edu/grammar/latin/4th-declension-case-forms'},
 {id:'griego-anthropos',language:'griego',lemma:'ἄνθρωπος',
  issue:'El lema admite empleo masculino y femenino. Su declinación puede practicarse sin fijar género.',
  recommendation:'morfologia-sin-concordancia',
  choices:[
    {value:'morfologia-sin-concordancia',label:'Solo declinación, sin sintagmas'},
    {value:'masculino-docente',label:'Usar el masculino en los sintagmas'},
    {value:'ambos-generos',label:'Practicar ambas concordancias'}],
  source:'https://www.antiquitas.lv/wp-content/uploads/2020/12/Book_Antiquitas_Viva_V__2019_.pdf'},
 {id:'griego-pais',language:'griego',lemma:'παῖς',
  issue:'Se documenta como masculino y femenino; las formas nominales son comunes a ambos.',
  recommendation:'morfologia-sin-concordancia',
  choices:[
    {value:'morfologia-sin-concordancia',label:'Solo declinación sin género asignado'},
    {value:'ambos-generos',label:'Artículo y concordancia en ambos géneros'},
    {value:'masculino-docente',label:'Priorizar el masculino en práctica'}],
  source:'https://en.wiktionary.org/wiki/παῖς'},
 {id:'griego-athenai',language:'griego',lemma:'Ἀθῆναι',
  issue:'Topónimo pluralia tantum; el subconjunto UniMorph fijado no aporta las diez casillas.',
  recommendation:'plural-documentado-pendiente-fuente',
  choices:[
    {value:'plural-documentado-pendiente-fuente',label:'Incluir cuando se reúna el plural documentado'},
    {value:'solo-estudio',label:'Mantener solo en estudio, sin calificación'},
    {value:'aplazar',label:'Exclusión provisional total'}],
  source:'https://en.wiktionary.org/wiki/Ἀθῆναι'}
];
export function triageNounCandidates(catalog){
  assert.ok(Array.isArray(catalog)&&catalog.length>=500,'Falta inventario docente');
  const grouped={};const items=[];
  for(const item of catalog){
    if(item.status!=='pendiente')continue;
    const result=category(item);
    grouped[result.group]=(grouped[result.group]||0)+1;
    items.push({language:item.language,course:item.course||'gr1',
      lemma:item.lemma,form:item.sources?.[0]?.form||'',
      reason:item.reason,group:result.group,confidence:result.confidence,
      sourceIds:item.sources?.map(x=>x.id)||[]});
  }
  // Las decisiones no sustituyen ninguna fuente y no afectan al banco de nota.
  const choices=choiceSpec.filter(x=>catalog.some(y=>
    y.lemma.normalize('NFD').replace(/\p{M}/gu,'').toLowerCase()===
    x.lemma.normalize('NFD').replace(/\p{M}/gu,'').toLowerCase()&&
    y.language===x.language));
  return {schema:'schola-nominal-triage/v1',total:items.length,
    counts:grouped,classified:items,teacherChoices:choices,
    policy:'Reetiquetado solo de auditoría, no calificación ni corrección de fuentes'};
}
