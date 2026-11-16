// Ampliación editorial exclusiva de ScholaClassica (no altera EvolucionFonetica).
// Fuente: banco_evolucion_fonetica_PAU_2026_actualizado.xlsx, Banco, filas indicadas.
// SHA-256 del Excel aportado: c9ce2716b1eb68183f20c4bb28615841a6ae9300317ebd6c57d046f0e0cb28be.
// Sólo PATRIMONIAL en el Excel; los cambios concretos se registran por fragmento.
// Cada línea: fila|forma latina original|resultado|código-regla/intervalo/resultado.
// Códigos N01-N20: A abertura, D diptongación, P palatalización,
// S sonorización, I síncopa, C apócope, H aspiración, M monoptongación,
// R prótesis, L simplificación, N consonantización.
// FIX_M se añade automáticamente exclusivamente al acabar en -m.
// -um→-o requiere A en la u final, separado de FIX_M.
// La fuente Excel NO constituye verificación etimológica externa individual.
const RAW=`
49|capram|cabra|S2=b
55|cĕntum|ciento|A4=o,D1=ie,P0=c
57|cĕrvum|ciervo|A4=o,D1=ie,P0=c
79|cultellum|cuchillo|A7=o,P2-4=ch
85|dĕcem|diez|C3=∅,D1=ie,P2=z
94|dixi|dije|A3=e,P2=j
95|dixit|dijo|P2=j
100|dubĭtare|dudar|I2-4=∅,S4=d,C7=∅
103|exercere|ejercer|P1=j,C7=∅
107|factum|hecho|A4=o,H0=h,P2-4=ch
108|facturam|hechura|H0=h,P2-4=ch
120|filiam|hija|H0=h,P2-4=j
121|filictum|helecho|A1=e,H0=h,P4-6=ch,A6=o
135|frigĭdum|frío|A6=o,I4=∅
139|fustigare|hostigar|A1=o,H0=h,C8=∅
141|gĕlum|hielo|A3=o,D1=ie
142|gemmam|yema|P0-2=ye,L2-4=m
149|heredĭtātem|heredad|I5=∅,S6=d
157|integrum|entero|A0=e,I4=∅,A6=o
166|lacrimam|lágrima|S2=g
167|lactem|leche|P2-4=ch
168|lactucam|lechuga|P2-4=ch,S5=g
178|lego|leo|I2=∅
187|macrum|magro|A4=o,S2=g
195|mascŭlum|macho|A6=o,P2-4=ch,I4=∅
197|materiam|madera|I5=∅,S2=d
200|maxillam|mejilla|P2=j
224|pacem|paz|C3=∅,P2=z
229|pariētem|pared|C6=∅,I3=∅,S5=d
230|patrem|padre|S2=d
232|pectus|pecho|P2-4=ch,A4=o,C5=∅
233|perdicem|perdiz|C6=∅,P5=z
236|petram|piedra|D1=ie,S2=d
237|pineam|piña|P2-4=ñ
254|quattuor|cuatro|L3-5=t
256|radicem|raíz|C5=∅,P4=z,I2=∅
260|rancidum|rancio|A6=o,P3-5=ci,I5=∅
264|recipere|recibir|S4=b
265|regem|rey|P2-4=y
269|sacratum|sagrado|A6=o,S2=g,S5=d
276|scutarium|escudero|A7=o,R0-0=e,S3=d
292|sitim|sed|A1=e,S2=d,I3=∅
295|sŏlet|suele|D1=ue
310|super|sobre|A1=o,S2=b
317|tegŭlam|teja|P2-5=j,I3=∅
318|tĕnĕrum|tierno|A5=o,D1=ie,I3=∅
324|tingit|tiñe|P2-5=ñ,C5=∅
326|tristitiam|tristeza|A5=e,P6-8=z
328|vadeam|vaya|P2-4=y
334|vexare|vejar|P2=j,C5=∅
336|vindĭcāre|vengar|A1=e,I4=∅,S5=g,C8=∅
337|vineam|viña|P2-4=ñ
348|augustum|agosto|A3=o,M0-2=a,A6=o
375|duplare|doblar|A1=o
376|duritiam|dureza|A3=e,P4-6=z
378|fluxum|flojo|A2=o,P3=j,A4=o
399|lucrum|logro|A1=o,A4=o
413|novitatem|novedad|A3=e,S4=d,S6=d,C7=∅
426|providere|proveer|I5=∅,C8=∅
428|puteum|pozo|A1=o,A4=o,P2-4=z
490|comitatum|condado|A7=o,I3=∅,S4=d,S6=d
506|semitam|senda|I3=∅,S4=d
511|facere|hacer|H0=h,P2=c,C5=∅
512|falconem|halcón|H0=h,C6=∅
513|farturam|hartura|H0=h
515|ferire|herir|H0=h,C5=∅
518|findere|hender|A1=e,H0=h,C6=∅
521|fungum|hongo|A1=o,H0=h,A4=o
522|furonem|hurón|H0=h,C5=∅
523|furtum|hurto|A4=o,H0=h
524|fuscum|hosco|A1=o,H0=h,A4=o
529|iam|ya|N0=y
544|vinum|vino|A3=o
545|vivum|vivo|A3=o
564|equam|yegua|D0=ie,S1-3=gu
768|fœnum|heno|A3=o,H0=h,M1=e
811|cabannam|cabaña|P4-6=ñ
833|folia|hoja|H0=h,P2-4=j
843|luctatorem|luchador|P2-4=ch,S5=d,C8=∅
856|rationem|razón|P2-4=z,C6=∅
859|relaxare|relajar|P4=j,C7=∅
945|amaricare|amargar|I4=∅,S5=g,C8=∅
946|aperire|abrir|C6=∅,I2=∅,S1=b
949|bonitatem|bondad|I3=∅,S4=d,S6=d,C7=∅
953|collocare|colgar|L2-4=l,I4=∅,S5=g,C8=∅
955|consuturam|costura|L2-4=s
959|diabolum|diablo|A6=o,I4=∅
961|eremitam|ermita|I2=∅
965|honorare|honrar|I3=∅,C7=∅
976|litigare|lidiar|S2=d,I4=∅,C7=∅
980|manicam|manga|I3=∅,S4=g
982|nobilem|noble|I3=∅
985|operare|obrar|I2=∅,S1=b,C6=∅
1000|solidare|soldar|I3=∅,C7=∅
1002|stabulum|establo|A6=o,R0-0=e,I4=∅
1003|sucidum|sucio|A5=o,P2-4=ci,I4=∅
1004|tabulam|tabla|I3=∅
1005|traditorem|traidor|S5=d,I3=∅,C8=∅
1006|turbidum|turbio|A6=o,I5=∅
1008|veritatem|verdad|I3=∅,S4=d,S6=d,C7=∅
`.trim();

const RULES=Object.freeze({
 A:['ABER','abertura'],D:['DIPT','diptongación'],P:['PALAT','palatalización'],
 S:['SONOR','sonorización'],I:['SINC','síncopa'],C:['APOC','apócope'],
 H:['ASPIR','aspiración'],M:['MONOP','monoptongación'],R:['PROT','prótesis'],
 L:['SIMPL','simplificación'],N:['CONS','consonantización']
});
export const ADDITION_SOURCE=Object.freeze({
 file:'banco_evolucion_fonetica_PAU_2026_actualizado.xlsx',
 sha256:'c9ce2716b1eb68183f20c4bb28615841a6ae9300317ebd6c57d046f0e0cb28be',
 sheet:'Banco',lot:21
});
const comparable=text=>String(text).toLocaleLowerCase('es')
 .replace(/æ/g,'ae').replace(/œ/g,'oe').replace(/v/g,'u')
 .normalize('NFD').replace(/[\u0300-\u036f]/g,'');

function rowToWord(line){
 const [rowText,latinOriginal,answer,annotated,...rest]=line.split('|');
 const row=Number(rowText);
 if(rest.length||!Number.isInteger(row)||row<2||!latinOriginal||!answer||!annotated)
  throw Error('Lote 100: registro malformado: '+line);
 const latin=latinOriginal.replace(/v/gu,'u');
 const letters=[...latin];
 const changes=annotated.split(',').map((token,i)=>{
  const match=/^([A-Z])(\d+)(?:-(\d+))?=(.*)$/u.exec(token);
  if(!match||!RULES[match[1]])throw Error('Lote 100: anotación no válida: '+line+' / '+token);
  const [rule,description]=RULES[match[1]];
  const a=Number(match[2]),b=match[3]===undefined?a+1:Number(match[3]),output=match[4];
  if(!Number.isInteger(b)||a<0||b>letters.length||a>b||(!match[1].includes('R')&&a===b))
   throw Error('Lote 100: intervalo fuera de la forma: '+line+' / '+token);
  const fragment=letters.slice(a,b).join('');
  const insertion=match[1]==='R';
  return {
   id:'t'+(i+1),rule,
   ...(insertion?{spans:[],anchor:a}:{spans:[[a,b]]}),
   output,
   note:insertion
    ? 'Prótesis: se añade «'+output+'» al principio de la palabra.'
    : description.charAt(0).toUpperCase()+description.slice(1)+': «'+fragment+'» → «'+output+'».'
  };
 });
 if(latin.endsWith('m')){
  changes.push({id:'t'+(changes.length+1),rule:'FIX_M',
   spans:[[letters.length-1,letters.length]],output:'∅',
   note:'La -m final del acusativo desaparece; es una norma fija, no seleccionable.'});
 }
 if(latin.endsWith('um')&&!changes.some(t=>t.rule==='ABER'&&t.spans[0]?.[0]===letters.length-2&&t.output==='o'))
  throw Error('Lote 100: falta la abertura obligatoria de -um: '+latin);
 const labels=[...new Set(changes.filter(t=>t.rule!=='FIX_M').map(t=>t.rule))];
 return {
  id:'xl-'+row,latin,answers:[answer],
  source:{...ADDITION_SOURCE,row,classification:'PATRIMONIAL',
   legacyRules:labels,originalLatin:latinOriginal,provenance:'selección didáctica; no certificación etimológica independiente'},
  status:'reviewed-pilot',
  changes,
  explanation:latinOriginal+' → '+answer+'. Cambios evaluables del Excel docente: '+
    changes.filter(t=>t.rule!=='FIX_M').map(t=>t.note).join(' ')+
    (latin.endsWith('m')?' La -m final se pierde como regla fija.':'')
 };
}
export const CASTILIAN_ADDITIONS=Object.freeze(RAW.split('\n').map(rowToWord));
if(CASTILIAN_ADDITIONS.length!==100)throw Error('Lote castellano: deben constar 100 fichas exactas.');

export function integrateCastilianAdditions(base){
 if(base?.version!==1||base?.words?.length!==522)
  throw Error('Lote 100: cambió el banco fuente fijado de Evolutio');
 const ids=new Set(base.words.map(w=>w.id));
 const forms=new Set(base.words.map(w=>comparable(w.latin)));
 const answers=new Set(base.words.flatMap(w=>w.answers.map(comparable)));
 const additions=[];
 for(const word of CASTILIAN_ADDITIONS){
  if(ids.has(word.id)||forms.has(comparable(word.latin)))
   throw Error('Lote 100: el étimo ya existe: '+word.id+' / '+word.latin);
  // Dos étimos distintos pueden compartir resultado; el identificador es latino.
  if(!word.answers.every(a=>a===a.toLocaleLowerCase('es')))
   throw Error('Lote 100: se detectó un nombre propio');
  if(!word.changes.some(c=>c.rule!=='FIX_M'))
   throw Error('Lote 100: sin ley fonética seleccionable: '+word.latin);
  if(additions.some(w=>comparable(w.latin)===comparable(word.latin)))
   throw Error('Lote 100: duplicado interno: '+word.latin);
  additions.push(word);
 }
 return {...base,words:[...base.words,...additions]};
}
