// Sobrescritura reproducible EXCLUSIVAMENTE de la copia de Evolutio en dist/.
// El origen GitHub sigue fijado por SHA y no se altera ni se reetiqueta allí.
import {cp,readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {RESULT_DIFFICULTY_METHOD,curatedDifficultyIds} from './evolutio-result-difficulty.mjs';
import {eligiblePracticeWords} from './evolutio-practice-eligibility.mjs';

export async function adaptEvolutioDifficulty({root,target}){
 const modulePath=join(target,'src/difficulty.mjs');
 const extraModulePath=join(target,'src/result-difficulty.mjs');
 const eligibilityModulePath=join(target,'src/practice-eligibility.mjs');
 const difficultyPath=join(target,'data/difficulty.json');
 const appPath=join(target,'src/app.mjs');
 const original=await readFile(modulePath,'utf8');
 const oldData=JSON.parse(await readFile(difficultyPath,'utf8'));
 const bank=JSON.parse(await readFile(join(target,'data/pilot.json'),'utf8'));
 const ids=new Set(bank.words.map(word=>word.id));
 for(const id of curatedDifficultyIds())if(!ids.has(id))
  throw new Error('Curaduría de dificultad: ID ajeno al banco: '+id);
 const practiceBank=eligiblePracticeWords(bank.words);
 if(bank.words.length!==522||practiceBank.length!==487)
  throw new Error('Evolutio: hay que revisar la identificación de nombres propios');
 if(oldData.method!=='criterio-didactico-v1')
  throw new Error('Evolutio cambió el criterio de origen: revisar adaptación de dificultad');
 if(bank.words.length!==Object.keys(oldData.assignments).length)
  throw new Error('Evolutio: las clasificaciones originales no cubren el banco');
 const start=original.indexOf('const RULE_COMPLEXITY=Object.freeze({');
 const end=original.indexOf('export function makeDifficultyData(',start);
 const oldImport="import { FIXED_RULE } from './rules.mjs';";
 if(start<0||end<=start||original.split(oldImport).length!==2)
  throw new Error('Evolutio cambió la interfaz del motor de dificultad: revisar adaptación');
 let patched=original.slice(0,start)
  +"export const difficultyScore=resultDifficultyScore;\nexport const proposedDifficultyLevel=resultDifficultyLevel;\n"
  +original.slice(end);
 patched=patched.replace(oldImport,
  "import {resultDifficultyScore,resultDifficultyLevel} from './result-difficulty.mjs';");
 const oldMethod="'criterio-didactico-v1'";
 if(patched.split(oldMethod).length!==3)
  throw new Error('No coinciden las dos referencias del método de dificultad');
 patched=patched.replaceAll(oldMethod,"'"+RESULT_DIFFICULTY_METHOD+"'");
 await cp(join(root,'scripts/evolutio-result-difficulty.mjs'),extraModulePath);
 await cp(join(root,'scripts/evolutio-practice-eligibility.mjs'),eligibilityModulePath);
 await writeFile(modulePath,patched);

 // Reutiliza la implementación de persistencia y validación del motor ya
 // adaptado: conserva explícitamente las correcciones 'docente'.
 const engine=await import(pathToFileURL(modulePath).href);
 const next=engine.makeDifficultyData(bank.words,oldData.assignments);
 const errors=engine.difficultyErrors(bank.words,next);
 if(errors.length||next.method!==RESULT_DIFFICULTY_METHOD)
  throw new Error('Clasificación de resultado inválida: '+errors.slice(0,4).join(' · '));
 for(const word of bank.words){
  const previous=oldData.assignments[word.id],record=next.assignments[word.id];
  if(!previous||!record)throw new Error('ID perdido al reclasificar: '+word.id);
  if(previous.origin==='docente'&&(record.level!==previous.level||record.origin!=='docente'))
   throw new Error('Se alteró una decisión docente de dificultad: '+word.id);
 }
 await writeFile(difficultyPath,JSON.stringify(next,null,2)+'\n');
 let app=await readFile(appPath,'utf8');
 function patchApp(from,to){
  if(app.split(from).length!==2)
   throw new Error('Interfaz de Evolutio alterada: '+from.slice(0,90));
  app=app.replace(from,to);
 }
 patchApp("import { DIFFICULTY_LEVELS, difficultyErrors, difficultyLabel, filterWordsByDifficultyLevels } from './difficulty.mjs';",
  "import { DIFFICULTY_LEVELS, difficultyErrors, difficultyLabel, filterWordsByDifficultyLevels } from './difficulty.mjs';\nimport {eligiblePracticeWords} from './practice-eligibility.mjs';");
 patchApp("let words=[], difficultyAssignments={}",
  "let words=[], practiceWords=[], difficultyAssignments={}");
 patchApp("isFocused()?availableFocusedWords(words,focusRule):availableWords(words,selected)",
  "isFocused()?availableFocusedWords(practiceWords,focusRule):availableWords(practiceWords,selected)");
 patchApp("availableFocusedWords(words,r.id),difficultyAssignments,practiceDifficulty",
  "availableFocusedWords(practiceWords,r.id),difficultyAssignments,practiceDifficulty");
 patchApp("words=data.words;difficultyAssignments=difficulty.assignments;",
  "words=data.words;practiceWords=eligiblePracticeWords(words);difficultyAssignments=difficulty.assignments;");
 const helperOld="  <p class=\"helper\">${levels.size===0?'No hay niveles seleccionados.': 'Selecciona uno o varios niveles; la ✓ indica cuáles están activos.'}</p>";
 const helperNew=helperOld+
  '\n  <p class="helper">La dificultad valora si es sencillo deducir el resultado castellano mediante cambios habituales, con revisión de casos especialmente transparentes u opacos.</p>'+ 
  '\n  <p class="helper">Los nombres propios no aparecen en las prácticas; puedes consultarlos en Estudiar.</p>';
 if(app.split(helperOld).length!==2)
  throw new Error('Evolutio cambió el selector de dificultad: revisar explicación pedagógica');
 app=app.replace(helperOld,helperNew);
 await writeFile(appPath,app);
 const counts=Object.fromEntries([1,2,3,4].map(level=>[
  level,bank.words.filter(w=>next.assignments[w.id].level===level).length
 ]));
 const changed=bank.words.filter(w=>next.assignments[w.id].level!==oldData.assignments[w.id].level).length;
 return {total:bank.words.length,eligiblePractice:practiceBank.length,
  excludedNames:bank.words.length-practiceBank.length,changed,counts,method:next.method};
}
