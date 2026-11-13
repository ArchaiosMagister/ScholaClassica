// Exporta las funciones docentes de CONSULTA de gramática de Vocabula.
// No copia cuentas, contraseñas, notas ni registros de alumnos.
import {readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import vm from 'node:vm';

function jsonAssignment(src,name){
  const anchor='window.'+name+'=';
  const i=src.indexOf(anchor);
  if(i<0)throw Error('No se encuentra '+anchor);
  const raw=src.slice(i+anchor.length).trim().replace(/;\s*$/,'');
  return JSON.parse(raw);
}
export async function buildDocenteGrammarIndex({vocabulaSource,out}){
  const read=name=>readFile(join(vocabulaSource,name),'utf8');
  const [contentJs,paradigmJs,enunciationJs,grammarJs,dataJs,coverageJs]=await Promise.all([
    read('gramatica-contenidos.js'),read('gramatica-paradigmas.js'),
    read('gramatica-enunciados.js'),read('gramatica.js'),
    read('data.js'),read('data/morphology-coverage.json')
  ]);
  const syllabiSource=jsonAssignment(contentJs,'GRAMMAR_CONTENT');
  const paradigms=jsonAssignment(paradigmJs,'GRAMMAR_PARADIGMS');
  const vocabulary=jsonAssignment(dataJs,'VOCAB');
  const coverage=JSON.parse(coverageJs);
  if(coverage.schema!==1||!coverage.subjects?.lat1||!coverage.subjects?.gr1||!coverage.subjects?.lat4)
    throw Error('Informe original de gramática incompleto');
  const sandbox={window:{GRAMMAR_CONTENT:syllabiSource,
    GRAMMAR_PARADIGMS:paradigms,VOCAB:vocabulary},
    localStorage:{getItem:()=>null},
    console:{warn:()=>{}},
  };
  vm.runInNewContext(enunciationJs,sandbox,{timeout:1500,filename:'gramatica-enunciados.js'});
  const start=grammarJs.indexOf('const $=id=>');
  const end=grammarJs.indexOf('const exercises=buildExercises();');
  if(start<0||end<=start)throw Error('Motor original de gramática cambió: revisar antes de publicar');
  const core=grammarJs.slice(start,end);
  const result=vm.runInNewContext('(function(){\n'+core+'\nreturn {exercises:buildExercises(),syllabi};\n})()',sandbox,{
    timeout:10000,filename:'gramatica-extract.js'
  });
  const exercises=result.exercises.map(({id,subject,unit,topic,category,mode,prompt,answer})=>({
    id,subject,unit,topic,category,mode,prompt,answer
  }));
  if(exercises.length<100||exercises.some(x=>x.unit==='UD 0'||!x.id||!x.prompt||!x.answer))
    throw Error('Banco docente de ejercicios de gramática incompleto');
  const index={schema:1,source:'VocabulaLatinaGraecaque',syllabi:result.syllabi,exercises};
  await writeFile(join(out,'docente/gramatica-banco.json'),JSON.stringify(index));
  await writeFile(join(out,'docente/gramatica-cobertura.json'),JSON.stringify(coverage));
  console.log('Índice docente de gramática:',exercises.length,'ejercicios, sin datos personales');
  return index;
}
