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
import {ruleName} from '../vendor/evolutio/src/rules.mjs';

const RAW=`
49|capram|cabra|S2=b
55|cĕntum|ciento|A4=o,D1=ie,P0=c
57|cĕrvum|ciervo|A4=o,D1=ie,P0=c
79|cultellum|cuchillo|A7=o,P2-4=ch,P5-7=ll,D4=ie
85|dĕcem|diez|C3=∅,D1=ie,P2=z
94|dixi|dije|A3=e,P2=j
95|dixit|dijo|P2=j,C4=∅
100|dubĭtare|dudar|I2-4=∅,S4=d,C7=∅
103|exercere|ejercer|P1=j,C7=∅
107|factum|hecho|A4=o,H0=h,P2-4=ch
108|facturam|hechura|H0=h,P2-4=ch
120|filiam|hija|H0=h,P2-4=j
121|filictum|helecho|A1=e,H0=h,P4-6=ch,A6=o,A3=e
135|frigĭdum|frío|A6=o,I4=∅,I3=∅,I5=∅
139|fustigare|hostigar|A1=o,H0=h,C8=∅
141|gĕlum|hielo|A3=o,D1=ie
142|gemmam|yema|P0=y,L2-4=m
149|heredĭtātem|heredad|I5=∅,S6=d,J4-7=d,S8=d,C9=∅
157|integrum|entero|A0=e,I4=∅,A6=o
166|lacrimam|lágrima|S2=g
167|lactem|leche|P2-4=ch
168|lactucam|lechuga|P2-4=ch,S5=g
178|lego|leo|I2=∅
187|macrum|magro|A4=o,S2=g
195|mascŭlum|macho|A6=o,P2-6=ch,I4=∅
197|materiam|madera|I5=∅,S2=d
200|maxillam|mejilla|P2=j,P4-6=ll
224|pacem|paz|C3=∅,P2=z
229|pariētem|pared|C6=∅,I3=∅,S5=d
230|patrem|padre|S2=d
232|pectus|pecho|P2-4=ch,A4=o,C5=∅
233|perdicem|perdiz|C6=∅,P5=z
236|petram|piedra|D1=ie,S2=d
237|pineam|piña|P2-4=ñ
254|quattuor|cuatro|L3-5=t,T6-8=ro
256|radicem|raíz|C5=∅,P4=z,I2=∅
260|rancidum|rancio|A6=o,P3-5=ci,I5=∅
264|recipere|recibir|S4=b,C7=∅
265|regem|rey|P2-4=y
269|sacratum|sagrado|A6=o,S2=g,S5=d
276|scutarium|escudero|A7=o,R0-0=e,S3=d,Q4-7=er
292|sitim|sed|A1=e,S2=d,C3=∅,A3=e
295|sŏlet|suele|D1=ue,C4=∅
310|super|sobre|A1=o,S2=b,T3-5=re
317|tegŭlam|teja|P2-5=j,I3=∅
318|tĕnĕrum|tierno|A5=o,D1=ie,I3=∅,T2-5=rn
324|tingit|tiñe|P2-4=ñ,C5=∅,A4=e
326|tristitiam|tristeza|A5=e,P6-8=z
328|vadeam|vaya|P2-4=y
334|vexare|vejar|P2=j,C5=∅
336|vindĭcāre|vengar|A1=e,I4=∅,S5=g,C8=∅,I3=∅
337|vineam|viña|P2-4=ñ
348|augustum|agosto|A3=o,M0-2=a,A6=o
375|duplare|doblar|A1=o,S2=b,C6=∅
376|duritiam|dureza|A3=e,P4-6=z
378|fluxum|flojo|A2=o,P3=j,A4=o
399|lucrum|logro|A1=o,A4=o,S2=g
413|novitatem|novedad|A3=e,S4=d,S6=d,C7=∅
426|providere|proveer|I5=∅,C8=∅,A4=e
428|puteum|pozo|A1=o,A4=o,P2-4=z
490|comitatum|condado|A7=o,I3=∅,S4=d,S6=d,B2=n
506|semitam|senda|I3=∅,S4=d,B2=n
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
955|consuturam|costura|L2-4=s,I4=∅
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
 L:['SIMPL','simplificación'],N:['CONS','consonantización'],
 T:['METAT','metátesis'],Q:['METAT','metátesis'],B:['ASMIL','asimilación'],J:['SIMPL','simplificación']
});
export const ADDITION_SOURCE=Object.freeze({
 file:'banco_evolucion_fonetica_PAU_2026_actualizado.xlsx',
 sha256:'c9ce2716b1eb68183f20c4bb28615841a6ae9300317ebd6c57d046f0e0cb28be',
 sheet:'Banco',lot:21
});
const comparable=text=>String(text).toLocaleLowerCase('es')
 .replace(/æ/g,'ae').replace(/œ/g,'oe').replace(/v/g,'u')
 .normalize('NFD').replace(/[\u0300-\u036f]/g,'');

// Toda anotación revisada explicita el nombre de la norma del catálogo,
 // sin confundir la pérdida fija de -m con la apócope seleccionable.
function nameChange(change){
 if(change.rule==='FIX_M')return change;
 const name=ruleName(change.rule);
 if(change.note.startsWith(name+':'))return change;
 return {...change,note:name+': '+change.note};
}
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
   ...(insertion?{spans:[],anchor:a}:['T','J'].includes(match[1])?{spans:[[a,a+1],[b-1,b]]}:{spans:[[a,b]]}),
   output,
   note:match[1]==='J'
    ? 'Tras la sonorización y la síncopa, d y d quedan en contacto y se reducen a una sola d.'
    : match[1]==='Q'
    ? 'El sufijo -arium pasa a -airum por metátesis; tras la evolución de -um, -airo se reduce a -ero. La abertura final se evalúa por separado.'
    : match[1]==='T'&&row===318
    ? 'Tras la síncopa de la e postónica, el grupo -nr- se reordena en -rn-.'
    : insertion
    ? 'Prótesis: se añade «'+output+'» al principio de la palabra.'
    : description.charAt(0).toUpperCase()+description.slice(1)+': «'+fragment+'» → «'+output+'».'
  };
 }).map(nameChange);
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
const ADDITION_NOTES=Object.freeze({
  "490": "Asimilación de m en n ante la dental tras la síncopa de i y la sonorización; no se trata de disimilación.",
  "506": "Asimilación de m en n ante la dental tras la síncopa de i y la sonorización.",
  "955": "Simplificación de ns en s y síncopa de la primera u de -suturam; no se pierde la u tónica de costura.",
  "79": "El castellano medieval cuchiello documenta la diptongación de ĕ; el diptongo -ie- se reduce después a -i- ante la lateral palatal.",
  "95": "Apócope de -t final. La terminación -o de dixo (medieval) y dijo se explica por analogía con los perfectos débiles; no se exige una abertura hipotética de la i de la desinencia.",
  "107": "La yod originada por -ct- cierra la a en e (factu > faito > feito > fecho > hecho); no es la abertura i/u de N01.",
  "108": "La yod del grupo -ct- explica el cambio a > e, además de la palatalización; no es abertura.",
  "141": "La palatalización de g ante ĕ confluye con la semiconsonante de la diptongación; la h de hielo es gráfica, no resultado de f inicial.",
  "149": "La secuencia hered(i)dade se reduce por síncopa y simplificación de las dos dentales sonoras contiguas; no se exige una pérdida independiente de d.",
  "167": "La yod de -ct- provoca el cierre de a > e (lacte > laite > leite > leche); no se etiqueta como abertura.",
  "168": "La yod de -ct- explica a > e en lechuga; este cierre vocálico no corresponde a N01.",
  "195": "Tras síncopa, el grupo secundario -scl- desemboca en ch con pérdida de s integrada en la evolución del grupo; se señala el grupo original completo.",
  "200": "La yod asociada a x provoca el cierre de la a pretónica en e; no es abertura.",
  "254": "La secuencia vocálica -uo- se reduce a -o- (quattuor > *quattor) y la metátesis desplaza la r final: castellano medieval quatro, después cuatro. La reducción de hiato no se puntúa aparte.",
  "264": "El resultado del infinitivo en -ir supone un reajuste de la conjugación; no se presenta e > i como abertura.",
  "292": "Tras la pérdida fija de -m, la abertura de i final en e precede a la apócope de esa e después de d (sed).",
  "324": "La palatalización del grupo -ng- ante i da ñ; la abertura de i final en e sigue a la apócope de t.",
  "336": "La síncopa de ĭ deja el grupo -dc-; se produce asimismo la síncopa de d interior y la sonorización c > g. La pérdida de e final es apócope.",
  "348": "La reducción de au a a en augustum se distingue del resultado habitual au > o; interviene la disimilación vocálica ante la u de la sílaba siguiente.",
  "135": "En frīgĭdum, la primera i es larga y tónica, y se conserva. La segunda ĭ es breve y postónica. Síncopa de g, de ĭ postónica y de d; abertura de u final en o. No se impone un orden cronológico único a las síncopas.",
  "317": "Síncopa de ŭ postónica y palatalización del grupo secundario -gl-, que desemboca en j. La norma específica -CUL- no se aplica a -GUL-.",
  "426": "Abertura de i átona en e, síncopa de d intervocálica y apócope de e final del infinitivo."
});
export const CASTILIAN_ADDITIONS=Object.freeze(RAW.split('\n').map(rowToWord).map(word=>{
 const note=ADDITION_NOTES[word.source.row];
 return note?{...word,explanation:word.explanation+' '+note}:word;
}));
if(CASTILIAN_ADDITIONS.length!==100)throw Error('Lote castellano: deben constar 100 fichas exactas.');

// Correcciones filológicas por ID y cambio; la fuente vendorizada permanece intacta.
const SYNCOPE_FIXES=Object.freeze({
 'xl-29':'auricŭlam',
 'xl-80':'cunicŭlum'
});
// Intervalos documentados por la propia explicación de cada ficha.
const POSITION_FIXES=new Map([["xl-36",["cæcare","t2","SONOR",0,2]],["xl-37",["cæcum","t3","SONOR",0,2]],["xl-78",["cucullum","t2","SONOR",0,2]],["xl-246",["pŏpŭlum","t2","SONOR",0,2]],["xl-87",["decollare","t3","APOC",1,8]],["xl-201",["meliorem","t2","APOC",1,6]],["xl-921",["pensare","t2","APOC",1,6]],["xl-509",["temptare","t2","APOC",1,7]],["xl-825",["despoliare","t2","APOC",1,9]],["xl-285",["serpĕntem","t1","DIPT",1,4]]]);
const EDITORIAL_COMPLETIONS=Object.freeze({
  "xl-196": {
    "latin": "mataxam",
    "note": "La yod del grupo x favorece además el cierre de a pretónica en e. No es una abertura de i/u."
  },
  "xl-1027": {
    "latin": "calcem",
    "change": {
      "rule": "PALAT",
      "spans": [
        [
          3,
          4
        ]
      ],
      "output": "z",
      "note": "La segunda c, ante e, se palataliza históricamente y acaba en la sibilante escrita z."
    },
    "replace": {
      "id": "t2",
      "note": "Apócope: cae la -e final de calce en la forma castellana coz."
    },
    "explanation": "Calcem > coz: vocalización de -al- > au > o, palatalización histórica de la segunda c ante e (z actual), apócope de e y pérdida fija de m. No confundir con cauce (< calicem)."
  },
  "xl-1028": {
    "latin": "falcem",
    "change": {
      "rule": "PALAT",
      "spans": [
        [
          3,
          4
        ]
      ],
      "output": "z",
      "note": "La c ante e se palataliza históricamente y acaba en z."
    },
    "explanation": "Falcem > hoz: aspiración de f inicial, vocalización de -al- > au > o, palatalización histórica de c ante e (z actual), apócope de e y pérdida fija de m."
  },
  "xl-1034": {
    "latin": "luminaria",
    "change": {
      "rule": "METAT",
      "spans": [
        [
          5,
          8
        ]
      ],
      "output": "er",
      "note": "-aria evoluciona por metátesis a -aira y después a -era, según el mismo criterio didáctico que -arium > -ero."
    },
    "replace": {
      "id": "t1",
      "note": "El grupo -min- pasa a -mbr- en lumbrera."
    },
    "explanation": "Luminaria (plural neutro) > lumbrera: transformación -min- > -mbr- y metátesis de -aria > -aira > -era. «Luminaria» es el doblete culto."
  }
});
function completeCastilianSourceWords(words){
 const found=new Set();
 const result=words.map(word=>{
  const entry=EDITORIAL_COMPLETIONS[word.id];
  if(!entry)return word;
  if(word.latin!==entry.latin)throw Error('Evolutio: étimo editorial alterado '+word.id);
  found.add(word.id);
  let changes=word.changes.map(c=>c.id===entry.replace?.id?{...c,note:entry.replace.note}:c);
  if(entry.change){
   const id='t'+(changes.length+1);
   if(changes.some(c=>c.id===id||c.rule===entry.change.rule))throw Error('Evolutio: cambio editorial duplicado '+word.id);
   changes=[...changes,{id,...entry.change}];
  }
  return {...word,changes,explanation:entry.explanation??word.explanation+' '+entry.note};
 });
 if(found.size!==Object.keys(EDITORIAL_COMPLETIONS).length)throw Error('Evolutio: faltan fichas editoriales');
 return result;
}
// Revisión de explicaciones y de las etapas documentadas en el banco histórico.
const HISTORICAL_REVIEW=Object.freeze({
  "xl-289": {
    "latin": "sigĭllum",
    "explanation": "Sigĭllum > sello: abertura de ambas i en e, síncopa de g intervocálica, reducción del hiato ee (documentado en seello medieval), palatalización de ll, abertura de u final en o y pérdida fija de -m. La segunda i es tónica en latín; no se clasifica su reducción como síncopa postónica ni como monoptongación de un diptongo latino.",
    "patches": {
      "t2": {
        "rule": "SINC",
        "spans": [
          [
            2,
            3
          ]
        ],
        "output": "",
        "note": "Síncopa de g intervocálica; el hiato resultante se reduce después."
      }
    },
    "append": [
      {
        "id": "t6",
        "rule": "ABER",
        "spans": [
          [
            3,
            4
          ]
        ],
        "output": "e",
        "note": "Abertura de ĭ tónica en e, antes de la reducción del hiato."
      }
    ]
  },
  "xl-608": {
    "latin": "temperare",
    "explanation": "Temperare > templar: síncopa de la segunda e (pretónica respecto a la a de -are), disimilación de las dos vibrantes (la primera pasa a l) y apócope de e final del infinitivo.",
    "patches": {
      "t1": {
        "note": "Síncopa de la e pretónica intermedia (temperāre)."
      }
    }
  },
  "xl-145": {
    "latin": "grŏssum",
    "explanation": "grŏssum > grueso: diptongación de ŏ tónica en ue, simplificación de ss, abertura de u final en o y pérdida fija de -m."
  },
  "xl-125": {
    "latin": "flammam",
    "explanation": "flammam > llama: palatalización de fl- inicial en ll-, simplificación de mm y pérdida fija de -m. No hay aspiración de f aislada."
  },
  "xl-156": {
    "latin": "insŭlam",
    "explanation": "insŭlam > isla: simplificación de ns en s, síncopa de ŭ postónica y pérdida fija de -m. No hay diptongación."
  },
  "xl-165": {
    "latin": "labŏrāre",
    "explanation": "labŏrāre > labrar: síncopa de o pretónica y apócope de e final del infinitivo."
  },
  "xl-25": {
    "latin": "asĭnum",
    "explanation": "asĭnum > asno: síncopa de ĭ postónica, abertura de u final en o y pérdida fija de -m."
  },
  "xl-570": {
    "latin": "hederam",
    "explanation": "hederam > hiedra: diptongación de la primera e tónica en ie, síncopa de la segunda e postónica y pérdida fija de -m. La h es etimológica, no aspiración de f."
  },
  "xl-458": {
    "latin": "uiridem",
    "explanation": "uiridem > verde: abertura de la primera i en e, síncopa de la segunda i postónica y pérdida fija de -m."
  },
  "xl-88": {
    "latin": "delĭcātum",
    "explanation": "delĭcātum > delgado: sonorización de c y t en g y d, síncopa de ĭ pretónica, abertura de u final en o y pérdida fija de -m. Delicado es el doblete culto o semiculto."
  },
  "xl-508": {
    "latin": "septem",
    "explanation": "septem > siete: diptongación de e tónica en ie, simplificación de pt en t y pérdida fija de -m."
  },
  "xl-728": {
    "latin": "parabolam",
    "explanation": "parabolam > palabra: síncopa de o postónica, metátesis de r y l y pérdida fija de -m."
  },
  "xl-733": {
    "latin": "sibilare",
    "explanation": "sibilare > silbar: síncopa de la segunda i pretónica, metátesis de b y l y apócope de e final del infinitivo."
  },
  "xl-266": {
    "latin": "regŭlam",
    "explanation": "regŭlam > regla: síncopa de ŭ postónica y pérdida fija de -m; se conserva el grupo -gl- sin palatalización."
  },
  "xl-267": {
    "latin": "rodēre",
    "explanation": "rodēre > roer: síncopa de d intervocálica y apócope de e final del infinitivo. No se trata de sonorización."
  },
  "xl-724": {
    "latin": "integrare",
    "explanation": "integrare > entregar: abertura de i inicial en e, metátesis de r (egr → reg) y apócope de e final. No confundir con el cultismo integrar.",
    "patches": {
      "t2": {
        "spans": [
          [
            3,
            5
          ],
          [
            5,
            6
          ]
        ],
        "output": "reg",
        "note": "Metátesis de r, que pasa delante del grupo eg: egr → reg."
      }
    }
  },
  "xl-502": {
    "latin": "rupturam",
    "explanation": "rupturam > rotura: abertura de la primera u pretónica en o, asimilación de pt en tt y simplificación de tt en t, conforme al modelo oficial. La sílaba tónica es -tū-. Pérdida fija de -m. Ruptura es el doblete culto.",
    "patches": {
      "t1": {
        "note": "Abertura de la primera u pretónica en o; la u de -tū- es tónica y se conserva."
      }
    }
  },
  "xl-64": {
    "latin": "comitem",
    "explanation": "comitem > conde: síncopa de i postónica, sonorización de t en d y asimilación de m en n ante la dental. Pérdida fija de -m."
  },
  "xl-203": {
    "latin": "mensem",
    "explanation": "mensem > mes: simplificación de ns en s, apócope de e final y pérdida fija de -m."
  },
  "xl-605": {
    "latin": "marmorem",
    "explanation": "marmorem > mármol: disimilación de las dos r (la segunda pasa a l), apócope de e final y pérdida fija de -m."
  },
  "xl-606": {
    "latin": "roborem",
    "explanation": "roborem > roble: síncopa de la segunda o postónica, disimilación de las dos r (la segunda pasa a l) y pérdida fija de -m."
  },
  "xl-722": {
    "latin": "crustam",
    "explanation": "crustam > costra: abertura de u en o, metátesis de r desde el grupo inicial cr- hasta detrás de t y pérdida fija de -m."
  },
  "xl-726": {
    "latin": "inter",
    "explanation": "inter > entre: abertura de i inicial en e y metátesis de r final (er → re)."
  },
  "xl-732": {
    "latin": "semper",
    "explanation": "semper > siempre: diptongación de e tónica en ie y metátesis de r final (er → re)."
  },
  "xl-304": {
    "latin": "sponsam",
    "explanation": "sponsam > esposa: prótesis de e, simplificación de ns en s y pérdida fija de -m."
  },
  "xl-305": {
    "latin": "sponsum",
    "explanation": "sponsum > esposo: prótesis de e, simplificación de ns en s, abertura de u final en o y pérdida fija de -m."
  },
  "xl-284": {
    "latin": "sensum",
    "explanation": "sensum > seso: simplificación de ns en s, abertura de u final en o y pérdida fija de -m."
  },
  "xl-239": {
    "latin": "planctum",
    "explanation": "planctum > llanto: palatalización de pl- inicial en ll-, simplificación de nct en nt, abertura de u final en o y pérdida fija de -m. No corresponde la palatalización ct → ch."
  },
  "xl-716": {
    "latin": "acerem",
    "explanation": "acerem > arce: síncopa de la primera e, metátesis de c y r y pérdida fija de -m. No confundir con acre."
  },
  "xl-720": {
    "latin": "catenatum",
    "explanation": "catenatum > candado: sonorización de ambas t en d, síncopa de e pretónica, metátesis del grupo secundario dn → nd, abertura de u final en o y pérdida fija de -m."
  },
  "xl-736": {
    "latin": "uiduam",
    "explanation": "uiduam > viuda: metátesis de d y u (du → ud) y pérdida fija de -m."
  },
  "xl-917": {
    "latin": "monstrare",
    "explanation": "monstrare > mostrar: simplificación de ns en s y apócope de e final."
  },
  "xl-922": {
    "latin": "pinsare",
    "explanation": "pinsare > pisar: simplificación de ns en s y apócope de e final. La base popular puede reconstruirse como *pinsare."
  },
  "xl-927": {
    "latin": "trans",
    "explanation": "trans > tras: simplificación de ns en s. Se conserva también trans- como prefijo culto."
  },
  "ge-EVF-0362": {
    "latin": "committere",
    "explanation": "committere > cometer: simplificación de ambas geminadas mm y tt, abertura de i en e y apócope de e final."
  },
  "ge-EVF-0441": {
    "latin": "supportare",
    "explanation": "supportare > soportar: abertura de u en o, simplificación de pp en p y apócope de e final. No hay sonorización."
  },
  "ge-EVF-0936": {
    "latin": "translatum",
    "explanation": "translatum > traslado: simplificación de ns en s, sonorización de t en d, abertura de u final en o y pérdida fija de -m."
  },
  "xl-33": {
    "latin": "autumnum",
    "explanation": "autumnum > otoño: monoptongación de au en o, abertura de u tónica en o, palatalización de mn en ñ, abertura de u final en o y pérdida fija de -m. La sílaba penúltima -tum- es larga por posición (mn), por lo que lleva el acento.",
    "patches": {
      "t2": {
        "note": "Abertura de la u tónica de la penúltima sílaba en o, no de una vocal postónica."
      }
    }
  },
  "ge-EVF-0367": {
    "latin": "cuminum",
    "explanation": "cuminum > comino: abertura de la primera u pretónica en o y de la u final en o; pérdida fija de -m. La i de cumīnum es larga y tónica, y se conserva. No hay evolución de -MIN- → -MBR-."
  },
  "xl-70": {
    "latin": "cŏrium",
    "explanation": "cŏrium > cuero: diptongación de ŏ tónica en ue, abertura de u final en o y pérdida fija de -m. La i breve de la penúltima sílaba da lugar a una yod que se reestructura; no se exige una síncopa vocálica independiente."
  },
  "xl-134": {
    "latin": "fricāre",
    "explanation": "fricāre > fregar: abertura de i pretónica en e, sonorización de c intervocálica en g y apócope de e final. El acento latino recae en la ā de -āre."
  },
  "xl-65": {
    "latin": "compărāre",
    "explanation": "compărāre > comprar: síncopa de ă pretónica (com-pa-rā-re → com-prā-re) y apócope de e final. La ā larga de la penúltima sílaba es tónica. No hay sonorización de p."
  },
  "xl-106": {
    "latin": "fabŭlam",
    "explanation": "fabŭlam > habla: síncopa de ŭ postónica, aspiración de f inicial y pérdida fija de -m. La penúltima sílaba abierta con ŭ breve es átona. Fábula es el doblete culto."
  },
  "xl-182": {
    "latin": "littĕram",
    "explanation": "littĕram > letra: abertura de i tónica en e, simplificación de tt, síncopa de ĕ postónica y pérdida fija de -m. La ĕ breve en sílaba abierta no lleva el acento."
  },
  "xl-213": {
    "latin": "nĕbŭlam",
    "explanation": "nĕbŭlam > niebla: diptongación de ĕ tónica en ie, síncopa de ŭ postónica y pérdida fija de -m. La penúltima sílaba abierta con vocal breve desplaza el acento a la antepenúltima."
  },
  "xl-307": {
    "latin": "stabĭlem",
    "explanation": "stabĭlem > estable: prótesis de e, síncopa de ĭ postónica del grupo -bĭl- y pérdida fija de -m. La penúltima sílaba abierta con ĭ breve es átona."
  },
  "xl-950": {
    "latin": "calidum",
    "explanation": "calidum > caldo: síncopa de i postónica, abertura de u final en o y pérdida fija de -m. La i de calĭdum es breve en sílaba abierta. Cálido es el doblete culto."
  },
  "ge-EVF-0211": {
    "latin": "mutabĭlem",
    "explanation": "mutabĭlem > mudable: sonorización de t intervocálica en d, síncopa de ĭ postónica del sufijo -bĭl- y pérdida fija de -m. La tónica corresponde a la ā de mutābĭlem."
  },
  "ge-EVF-0221": {
    "latin": "opĕram",
    "explanation": "opĕram > obra: sonorización de p en b, síncopa de ĕ postónica y pérdida fija de -m. La ĕ breve no es tónica y no diptonga."
  },
  "ge-EVF-0295": {
    "latin": "sŏlĭdum",
    "explanation": "sŏlĭdum > sueldo: diptongación de ŏ tónica en ue, síncopa de ĭ postónica, abertura de u final en o y pérdida fija de -m."
  },
  "ge-EVF-0310": {
    "latin": "supĕrāre",
    "explanation": "supĕrāre > sobrar: abertura de u pretónica en o, sonorización de p en b, síncopa de ĕ pretónica y apócope de e final. El acento latino recae en ā."
  }
});
function reviewHistoricalWords(words){
 const seen=new Set();
 const result=words.map(word=>{
  const entry=HISTORICAL_REVIEW[word.id];
  if(!entry)return word;
  if(entry.latin!==word.latin)throw Error('Evolutio: cambió el étimo revisado '+word.id);
  seen.add(word.id);
  const changes=word.changes.map(c=>({...c,...entry.patches?.[c.id]}));
  for(const c of entry.append??[]){
   if(changes.some(old=>old.id===c.id))throw Error('Evolutio: cambio duplicado '+word.id);
   changes.push(c);
  }
  return {...word,explanation:entry.explanation,changes:changes.map(nameChange)};
 });
 if(seen.size!==Object.keys(HISTORICAL_REVIEW).length)throw Error('Evolutio: faltan fichas históricas revisadas');
 return result;
}
export function correctCastilianSourceWords(words){
 const seen=new Set();
 let crucemFound=false;
 const positionSeen=new Set();
 const corrected=words.map(word=>{
  if(POSITION_FIXES.has(word.id)){
   const [latin,id,rule,oldPos,newPos]=POSITION_FIXES.get(word.id);
   const change=word.changes.find(c=>c.id===id);
   if(word.latin!==latin||change?.rule!==rule||JSON.stringify(change.spans)!==JSON.stringify([[oldPos,oldPos+1]])||comparable([...latin][oldPos])!==comparable([...latin][newPos]))
    throw Error('Evolutio: cambió el intervalo fuente '+word.id);
   positionSeen.add(word.id);
   return {...word,changes:word.changes.map(c=>c===change?{...c,spans:[[newPos,newPos+1]]}:c)};
  }
  if(word.id==='xl-75'){
   const change=word.changes.find(c=>c.id==='t1');
   if(word.latin!=='crucem'||change?.rule!=='PALAT'||JSON.stringify(change.spans)!=='[[0,1]]')
    throw Error('Evolutio: cambió la ficha fuente de crucem');
   crucemFound=true;
   return {...word,changes:word.changes.map(c=>c===change?{...c,spans:[[3,4]]}:c)};
  }
  if(!Object.hasOwn(SYNCOPE_FIXES,word.id))return word;
  const change=word.changes.find(c=>c.id==='t3');
  if(word.latin!==SYNCOPE_FIXES[word.id]||change?.rule!=='SINC'||
   JSON.stringify(change.spans)!=='[[1,2]]'||[...word.latin][5]!=='ŭ')
   throw Error('Evolutio: cambió la ficha fuente de síncopa '+word.id);
  seen.add(word.id);
  return {...word,changes:word.changes.map(c=>c===change?{...c,spans:[[5,6]]}:c)};
 });
 if(!crucemFound||positionSeen.size!==POSITION_FIXES.size||seen.size!==Object.keys(SYNCOPE_FIXES).length)throw Error('Evolutio: faltan fichas de corrección');
 const explanations=Object.freeze({
  "xl-29": "auricŭlam > oreja: monoptongación de au en o; abertura de i breve tónica en e; síncopa de la segunda u (ŭ postónica) y evolución de -CUL- > -J-. La -m del acusativo se pierde por la norma fija.",
  "xl-75": "crucem > cruz: palatalización histórica de la segunda c (ante e), que da z; apócope de e final y pérdida fija de -m.",
  "xl-36": "cæcare > cegar: monoptongación de æ en e; sonorización de la segunda c en g y apócope de e final del infinitivo.",
  "xl-37": "cæcum > ciego: monoptongación de æ en e seguida de diptongación en ie; sonorización de la segunda c en g, abertura de u final en o y pérdida fija de -m.",
  "xl-78": "cucullum > cogollo: abertura de las tres u en o; sonorización de la segunda c en g; palatalización de ll y pérdida fija de -m. El cambio de sentido se apoya en el de «capucho» a «parte interior o extrema».",
  "xl-80": "cunicŭlum > conejo: abertura de la primera u en o y de i en e; síncopa de la ŭ postónica, evolución de -CUL- > -J-, abertura de u final en o y pérdida fija de -m.",
  "xl-87": "decollare > degollar: sonorización de c en g, palatalización de ll y apócope de e final del infinitivo.",
  "xl-201": "meliorem > mejor: palatalización de li ante vocal en j; apócope de e final y pérdida fija de -m.",
  "xl-246": "pŏpŭlum > pueblo: diptongación de ŏ en ue, sonorización de la segunda p en b, síncopa de ŭ postónica, abertura de u final en o y pérdida fija de -m.",
  "xl-285": "serpĕntem > serpiente: diptongación de la segunda e (ĕ tónica) en ie y pérdida fija de -m.",
  "xl-509": "temptare > tentar: simplificación del grupo -mpt- > -nt- y apócope de e final del infinitivo.",
  "xl-825": "despoliare > despojar: palatalización de li ante vocal en j y apócope de e final del infinitivo. Distinto del cultismo expoliar.",
  "xl-921": "pensare > pesar: simplificación de -ns- en s y apócope de e final del infinitivo. Pensar es un doblete conservador de la misma familia.",
  "xl-196": "mataxam > madeja: sonorización de t intervocálica en d, palatalización de x (/ks/) en la antigua fricativa que hoy se escribe j y pérdida fija de -m. La yod del grupo x favorece el cierre de a pretónica en e; no es una abertura de i/u.",
  "xl-1027": "Calcem > coz: vocalización de -al- > au > o (una sola norma específica), palatalización histórica de la segunda c ante e (z actual), apócope de e y pérdida fija de -m. No confundir con cauce (< calicem).",
  "xl-1028": "Falcem > hoz: aspiración de f inicial, vocalización de -al- > au > o (una sola norma específica), palatalización histórica de c ante e (z actual), apócope de e y pérdida fija de -m.",
  "xl-1034": "Luminaria (plural neutro) > lumbrera: evolución de -MIN- → -MBR- (una norma específica) y metátesis de -aria > -aira > -era. «Luminaria» es el doblete culto."
});
 return reviewHistoricalWords(completeCastilianSourceWords(corrected)).map(word=>{
  const explanation=explanations[word.id];
  return explanation?{...word,explanation,changes:word.changes.map(nameChange)}:word;
 }).map(explainSpecificRules);
}

// Las normas específicas no sustituyen indiscriminadamente los fenómenos generales.
function explainSpecificRules(word){
 const special=word.changes.find(c=>['CUL','MIN_MBR','VOC'].includes(c.rule));
 if(!special)return word;
 const policy=special.rule==='MIN_MBR'
  ? 'Criterio de corrección: -MIN- → -MBR- se evalúa como una sola norma específica; la síncopa y la epéntesis internas no se cuentan por separado.'
  : special.rule==='VOC'
  ? 'Criterio de corrección: vocalización al → au → o; no se evalúa una monoptongación adicional del mismo grupo.'
  : special.subtype==='-CUL- > -G-'
  ? 'Criterio de corrección: evolución de -CUL- > -G-, con síncopa, sonorización y metátesis de las líquidas como etapas evaluables según el criterio docente vigente.'
  : 'Criterio de corrección: síncopa de la u postónica y evolución de -CUL- > -J-; no se añade palatalización general del mismo grupo.';
 return {...word,explanation:word.explanation+' '+policy,changes:word.changes.map(nameChange)};
}

export function assertCastilianSpecificRules(words){
 const overlap=(a,b)=>a.spans.some(([i,j])=>b.spans.some(([k,l])=>i<l&&k<j));
 for(const word of words){
  for(const change of word.changes){
   if(!['CUL','MIN_MBR','VOC'].includes(change.rule))continue;
   const [a,b]=change.spans[0]??[];
   const fragment=comparable([...word.latin].slice(a,b).join(''));
   const expected=change.rule==='CUL'?'cul':change.rule==='MIN_MBR'?'min':'al';
   if(change.spans.length!==1||fragment!==expected)
    throw Error('Evolutio: fragmento de norma específica incorrecto '+word.latin);
   if(word.changes.some(c=>c!==change&&c.rule===change.rule&&overlap(c,change)))
    throw Error('Evolutio: norma específica duplicada '+word.latin);
   if(change.rule==='MIN_MBR'){
    if(change.output!=='mbr'||word.changes.some(c=>c!==change&&(
      (['SINC','EPENT','PALAT','ASMIL','DISIMIL','SIMPL'].includes(c.rule)&&overlap(c,change))||
      (c.rule==='EPENT'&&Number.isInteger(c.anchor)&&c.anchor>a&&c.anchor<b))))
     throw Error('Evolutio: duplicación de -MIN- → -MBR- '+word.latin);
   }else if(change.rule==='VOC'){
    if(change.output!=='o'||word.changes.some(c=>c.rule==='MONOP'&&overlap(c,change)))
     throw Error('Evolutio: duplicación de vocalización '+word.latin);
   }else{
    if(word.changes.some(c=>c.rule==='PALAT'&&overlap(c,change)))
     throw Error('Evolutio: duplicación de palatalización y -CUL- '+word.latin);
    const isJ=change.subtype==='-CUL- > -J-'&&change.output==='j';
    const isG=change.subtype==='-CUL- > -G-'&&/^g(?:$| )/.test(change.output);
    if(!isJ&&!isG)throw Error('Evolutio: subtipo de -CUL- incoherente '+word.latin);
    if(isG&&(!word.changes.some(c=>c.rule==='SONOR'&&c.output==='g'&&JSON.stringify(c.spans)===JSON.stringify([[a,a+1]]))||
      !word.changes.some(c=>c.rule==='METAT'&&c.spans.some(([i,j])=>i===b-1&&j===b))))
     throw Error('Evolutio: faltan etapas del subtipo -CUL- > -G- '+word.latin);
   }
  }
 }
}
export function assertCastilianSyncopeSpans(words){
 const overlap=(a,b)=>a.spans.some(([i,j])=>b.spans.some(([k,l])=>i<l&&k<j));
 for(const word of words){
  const syncopes=word.changes.filter(c=>c.rule==='SINC');
  for(const s of syncopes){
   if(word.changes.some(c=>c.rule==='MONOP'&&overlap(c,s)))
    throw Error('Evolutio: síncopa sobre monoptongación '+word.latin);
   if(word.changes.some(c=>c.rule==='ABER'&&overlap(c,s)))
    throw Error('Evolutio: síncopa sobre abertura '+word.latin);
  }
  for(const cul of word.changes.filter(c=>c.rule==='CUL')){
   const [a,b]=cul.spans[0]??[];
   if(b-a===3&&/^c[uŭ]l$/iu.test([...word.latin].slice(a,b).join(''))&&
    !syncopes.some(s=>JSON.stringify(s.spans)===JSON.stringify([[a+1,a+2]])))
    throw Error('Evolutio: síncopa de -cul- mal ubicada '+word.latin);
  }
 }
}

export function assertCastilianPositionSpans(words){
 for(const word of words){
  const letters=[...word.latin.normalize('NFC')];
  const end=letters.length-(letters.at(-1)?.toLowerCase()==='m'?1:0);
  for(const change of word.changes){
   if(change.rule==='APOC'&&!change.spans.some(([,b])=>b===end))
    throw Error('Evolutio: apócope no final '+word.latin);
   if(change.rule==='SINC'&&change.spans.some(([a,b])=>a===0||b>=end))
    throw Error('Evolutio: síncopa no interior '+word.latin);
   if(change.rule==='SONOR'&&change.spans.some(([a])=>a===0))
    throw Error('Evolutio: sonorización asignada a consonante inicial '+word.latin);
  }
 }
}
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
 const words=[...correctCastilianSourceWords(base.words),...additions];
 assertCastilianSyncopeSpans(words);
 assertCastilianPositionSpans(words);
 assertCastilianSpecificRules(words);
 return {...base,words};
}
