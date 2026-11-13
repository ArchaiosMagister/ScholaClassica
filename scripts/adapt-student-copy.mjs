import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';

// Ajusta únicamente las COPIAS integradas en dist, nunca los repositorios de origen.
// Las notas académicas y las evidencias siguen en los datos y documentos internos.
function one(source,from,to,context){
  assert.equal(source.split(from).length,2,
    'Cambió el texto de '+context+': revisar adaptación de alumnado');
  return source.replace(from,to);
}
async function edit(directory,path,transform){
  const file=join(directory,path);
  const before=await readFile(file,'utf8');
  const after=transform(before);
  assert.notEqual(after,before,'Sin ajustes de alumnado en '+path);
  await writeFile(file,after,'utf8');
}

export async function adaptEvolutioStudentCopy(destination){
  await edit(destination,'index.html',html=>{
    html=one(html,'EVOLVTIO · Banco de 522 palabras',
      'EVOLVTIO · Evolución fonética','pie de Evolutio');
    html=one(html,'Basado en las normas oficiales de evolución fonética facilitadas por el docente.',
      'Practica las normas de evolución fonética del latín al castellano.','pie de Evolutio');
    return one(html,'Preparando el banco de palabras…',
      'Preparando las palabras…','carga de Evolutio');
  });
  await edit(destination,'src/app.mjs',js=>{
    js=one(js,
      "if(w.source?.generatorId)return '<p class=\"transmission-note\">Ficha importada de GeneradorExamenes: anotación posicional comprobada, pendiente de certificación filológica individual.</p>';",
      "if(w.source?.generatorId)return '';",
      'procedencia de Evolutio');
    const sourceFunction=/function wordSourceNote\(w\)\{[\s\S]*?\n\}\n/;
    assert.ok(sourceFunction.test(js),'Falta la función de fuente de Evolutio');
    js=js.replace(sourceFunction,'');
    js=one(js,'<p class="study-source">${wordSourceNote(w)}</p>','',
      'procedencia en la ficha de Evolutio');
    js=one(js,
      "${w.source?.generatorId?'Ficha importada · GeneradorExamenes':'Ficha filológica · Banco revisado'} · ",
      '', 'etiqueta de ficha de Evolutio');
    js=one(js,'Consulta las palabras revisadas o una de las 20 normas oficiales.',
      'Consulta las palabras disponibles o una de las 20 normas oficiales.',
      'texto de estudio de Evolutio');
    js=one(js,'${words.length} fichas revisadas',
      '${words.length} palabras','recuento de Evolutio');
    js=one(js,
      'Los ejemplos oficiales se presentan como referencia didáctica; solo las palabras ya incorporadas al banco pueden abrirse como tarjetas.',
      'Consulta los ejemplos y practica con las palabras disponibles.',
      'ayuda de normas de Evolutio');
    js=one(js,
      'Los cambios se muestran según las anotaciones didácticas verificadas, sin reconstruir etapas que no figuren en el banco.',
      'La ficha explica los cambios que intervienen en cada palabra.',
      'ayuda de ficha de Evolutio');
    js=one(js,'Etapas documentadas:','Etapas de la evolución:',
      'etapas de Evolutio');
    return one(js,'La ficha recoge las transformaciones anotadas en el banco.',
      'Observa las transformaciones de esta palabra.',
      'explicación de Evolutio');
  });
}

export async function adaptVocabulaStudentCopy(destination){
  await edit(destination,'app.js',js=>{
    js=one(js,
      'El general es alfabético: las unidades se vinculan por lema coincidente con examen, ignorando acentos y espíritus, sin inferir por traducción. Los grupos 1–4 y 6–7 no se separan. Básicas y preposiciones son grupos propios; el resto queda sin unidad acreditada.',
      'Elige las unidades y los grupos de Griego I que quieras practicar.',
      'instrucciones de Vocabula');
    js=one(js,'Variantes originales (','Variantes y acepciones (',
      'diccionario de Vocabula');
    return one(js,'Otras acepciones originales','Otras acepciones',
      'respuesta de Vocabula');
  });
  await edit(destination,'index.html',html=>{
    html=one(html,'Practica el vocabulario original de Latín y Griego por unidades, con tarjetas, test y traducción.',
      'Practica el vocabulario de Latín y Griego por unidades, con tarjetas, test y traducción.',
      'descripción de Vocabula');
    html=one(html,'El botón Todas incluye también los bloques sin unidad acreditada, si los hay.',
      'El botón Todas incluye también los grupos sin unidad específica.',
      'ayuda de Vocabula');
    html=one(html,'En Griego general, 148 entradas tienen correspondencia con las unidades de examen y 184 quedan sin unidad acreditada. Los grupos de unidades se mantienen unidos; no se asignan unidades por traducción o parecido ortográfico.',
      'En Griego general encontrarás palabras organizadas por unidades y otros grupos para repasar.',
      'clasificación interna de Vocabula');
    return one(html,'app.js?v=20261112','app.js?v=20261113-alumnos1',
      'actualización del JS de Vocabula');
  });
}
