// Reproduce el etiquetado inicial; conserva los niveles aprobados manualmente
// marcados como «docente» en data/difficulty.json.
import {readFileSync,writeFileSync} from 'node:fs';
import {makeDifficultyData,difficultyErrors} from '../src/difficulty.mjs';
const bank=JSON.parse(readFileSync(new URL('../data/pilot.json',import.meta.url),'utf8'));
const file=new URL('../data/difficulty.json',import.meta.url);
let previous={};
try{previous=JSON.parse(readFileSync(file,'utf8'))}catch(error){if(error.code!=='ENOENT')throw error}
const dataset=makeDifficultyData(bank.words,previous.assignments||{});
const errors=difficultyErrors(bank.words,dataset);
if(errors.length)throw new Error(errors.slice(0,10).join('; '));
const expected=JSON.stringify(dataset,null,2)+'\n';
if(process.argv.includes('--check')){
 const actual=readFileSync(file,'utf8');
 if(actual!==expected)throw new Error('Clasificación no actualizada: ejecuta npm run difficulty:build');
 process.stdout.write('Clasificación completa y reproducible: '+bank.words.length+' fichas.\n');
}else{
 writeFileSync(file,expected);
 process.stdout.write('Clasificación generada: '+bank.words.length+' fichas.\n');
}
