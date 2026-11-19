"""Ampliación conservadora de fenómenos raros del Excel docente.

Uso: python tools/build_scarce_batch.py /mnt/data/evolution_source_analysis.json
El JSON de entrada se obtiene del Excel del docente y preserva fila, lote y fuentes.
No incorpora automáticamente ninguna ficha: solo entradas revisadas aquí.
Por seguridad, el script SOLO admite ejecutarse contra el banco previo de 252 fichas.
"""
import collections, hashlib, json, re, sys, unicodedata
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
SOURCE=Path(sys.argv[1]) if len(sys.argv)>1 else Path('/mnt/data/evolution_source_analysis.json')
source={item['row']:item for item in json.loads(SOURCE.read_text())}
current=json.loads((ROOT/'data/pilot.json').read_text())
assert len(current['words'])==252, 'Solo debe ejecutarse sobre el banco anterior de 252 entradas.'
BASE_ROWS=current['words']

def N(s):
    return ''.join(c for c in unicodedata.normalize('NFD',s.casefold()) if unicodedata.category(c)!='Mn')

def SP(word, fragment, index=0):
    n=N(word); f=N(fragment)
    assert len(n)==len(word),word
    occurrences=[match.start() for match in re.finditer(re.escape(f),n)]
    assert index<len(occurrences),(word,fragment,index,occurrences)
    a=occurrences[index];return [a,a+len(f)]

def T(rule, fragment=None, output='', note='', *, nth=0, subtype=None, parts=None, anchor=None, stages=None):
    assert note and (fragment is not None or anchor is not None or parts)
    return dict(rule=rule,frag=fragment,output=output,note=note,nth=nth,subtype=subtype,parts=parts,anchor=anchor,stages=stages)

# IDs de las normas oficiales: la pérdida final de -m no se confunde con APOC.
A='ABER'; P='APOC'; AS='ASPIR'; D='DIPT'; E='EPENT'; G='GRIE'; ME='METAT'; MO='MONOP'; PA='PALAT'; PR='PROT'; SI='SIMPL'; S='SINC'; SO='SONOR'; V='VOC'; M='MIN_MBR'; C='CUL'; CO='CONS'
CULJ='-CUL- > -J-'

entries={
 # Fenómenos casi ausentes en el corpus (epéntesis, vocalización, grafías griegas).
 611:[
  T(AS,'f','h','La f- latina dio h- gráfica (aspiración medieval, después perdida).'),
  T(PA,'li','j','-li- ante vocal dio una consonante palatal, representada hoy por j.',subtype='-li- + vocal > -j-'),
  T(SO,'t','d','En la forma antigua hojalde, la t latina corresponde a d.'),
  T(S,'ĭ','','La ĭ postónica de -tĭl- se pierde durante la reducción del grupo.',nth=1),
  T(ME,parts=[('t',0),('l',1)],output='ld',note='La segunda l ocupa una posición anterior a la consonante d en hojalde; no confundir con la l anterior palatalizada.'),
  T(E,output='r',anchor=6,note='La r aparece por repercusión de líquida en la fase castellana hojalde → hojaldre, NO directamente en el latín.',stages=['foliatĭlem → hojalde → hojaldre']),
 ],
 1027:[
  T(V,'al','o','La secuencia -alC- vocaliza l (al > au) y se reduce finalmente a o, según la norma oficial.',stages=['calce → *cauce → coz']),
  T(P,'e','','Cae la -e final de calce en la forma castellana coz. La evolución c+e > z no dispone de una norma específica del catálogo.'),
 ],
 711:[T(G,'th','t','La grafía grecolatina th se adapta a t; latín tardío thius, del griego θεῖος. No es un cultismo moderno.')],
 # Consonantización i semiconsonántica.
 527:[T(CO,'i','y','La i consonántica inicial (yod) se representa con y en castellano.'),
      T(PA,'c','c','La velar latina c ante e se palataliza históricamente (grafía c conservada, pronunciación distinta).',subtype='c + e > consonante palatal'),
      T(P,'e','','Se pierde la -e final del infinitivo latino.',nth=1)],
 164:[T(CO,'i','j','La semiconsonante inicial i- se representa con j-.'),
      T(SO,'t','d','La t de -tutem en la posición final evoluciona a d, con reajuste de la terminación.',nth=1),
      T(P,'e','','La e final de -tem desaparece; el sufijo romance termina en -tud.',nth=1)],
 # -MIN- → -MBR- en palabras inequívocas del banco docente.
 1031:[T(AS,'f','h','La f- inicial se refleja en h- (antiguo fambre → hambre).'),
       T(M,'min','mbr','-min- > -mn- > -mbr-; el étimo *faminem es una reconstrucción vulgar, no la forma clásica famem.',stages=['*faminem → fambre → hambre'])],
 1032:[T(AS,'f','h','La f- inicial de ferruminem se convirtió en h-; ant. ferrumbre.'),
       T(M,'min','mbr','-min- > -mbr- por síncopa y epéntesis interna; antiguo ferrumbre → herrumbre.')],
 1034:[T(M,'min','mbr','El grupo -min- pasa a -mbr- en lumbrera; el resto del sufijo -aria evoluciona a -era (sin adjudicar una ley no prevista).')],
 1037:[T(M,'min','mbr','-min- > -mbr- por síncopa y reorganización del grupo.'),
       T(P,'e','','Se pierde la -e del infinitivo -are → -ar.',nth=1)],
 # Metátesis y reordenaciones bien reflejadas en las fichas docentes.
 731:[T(ME,'ro','or','La vibrante r cambia de posición dentro de pro: pro → por.')],
 736:[T(ME,'du','ud','Se invierte el orden de d y u: -dua- → -uda-; viuda conserva la a final.')],
 716:[T(S,'e','','Desaparece la e interna de acerem.'),
      T(ME,parts=[('c',0),('r',0)],output='rc',note='Se reordenan la c y la r: ac(e)re → arce; no confundir con acre.')],
 724:[T(A,'i','e','La i átona inicial se abre en e: in- → en-.'),
      T(ME,parts=[('e',0),('r',0)],output='re',note='La r desplaza su posición en -egr-: *entegrar → entregar.'),
      T(P,'e','','Pérdida de -e final del infinitivo -are.',nth=1)],
 720:[T(SO,'t','d','La primera t intervocálica se sonoriza a d.',nth=0),
      T(SO,'t','d','La segunda t intervocálica se sonoriza a d.',nth=1),
      T(S,'e','','Síncopa de e pretónica: cadenado → cadnado.'),
      T(ME,parts=[('t',0),('n',0)],output='nd',note='En la etapa cadnado se intercambia el orden de d y n: -dn- → -nd-.',stages=['catenatum → cadenado → cadnado → candado'])],
 # El grupo -CUL- > -J- se ofrece siempre con síncopa específica, salvo casos ya
 # simplificados por el documento docente; evitar confundirlo con -CUL- > -G-.
 219:[T(S,'ŭ','','Desaparece la ŭ del grupo -cŭl-.'),T(C,'cŭl','j','-cŭl- > -cl- > -j-. La forma plural conserva -os.',subtype=CULJ)],
 1053:[T(S,'u','','Síncopa de u postónica del grupo -cul-.'),
       T(C,'cul','j','-cul- > -cl- > -j-. Se conserva la i precedente (no debe etiquetarse abertura falsa).',subtype=CULJ)],
 # Simplificación, más necesaria que seguir repitiendo abertura en -um.
 917:[T(SI,'ns','s','Se simplifica el grupo -ns- > -s-.',subtype='-ns- > -s-'),T(P,'e','','Se pierde la vocal final -e del infinitivo latino -are.')],
 922:[T(SI,'ns','s','La nasal desaparece de -ns-, resultando s.',subtype='-ns- > -s-'),T(P,'e','','La -e final del infinitivo se pierde.')],
 919:[T(SI,'ss','s','La geminada -ss- se simplifica en -s-.',subtype='-ss- > -s-')],
 927:[T(SI,'ns','s','El grupo -ns- pierde la nasal en la variante romance tras; trans- también se conserva como prefijo culto.',subtype='-ns- > -s-')],
 912:[T(SI,'ns','s','Desaparición de n en -ns- > -s-.',subtype='-ns- > -s-'),T(P,'e','','Cae la -e final del infinitivo.',nth=1)],
 520:[T(AS,'f','h','La f- inicial pasa a h- muda.'),T(D,'o','ue','La ŏ tónica diptonga a ue.'),
      T(SI,'ss','s','La geminada -ss- se simplifica.',subtype='-ss- > -s-')],
 748:[T(MO,'au','o','El diptongo latino au se monoptonga y da o en castellano.'),T(PA,'ll','ll','La -ll- latina se palataliza en ll castellana.',subtype='-ll- > -ll-')],
 750:[T(MO,'au','o','Au > o por monoptongación.'),T(P,'e','','Pérdida de -e final del infinitivo.')],
 785:[T(MO,'au','o','El diptongo au evoluciona a o.'),T(P,'e','','Pérdida de -e del infinitivo -are.')],
 807:[T(MO,'æ','e','Monoptongación de ae a e.'),T(PA,'ll','ll','La geminada -ll- tiene resultado palatal castellano.',subtype='-ll- > -ll-')],
 812:[T(MO,'æ','e','El diptongo ae se reduce a e.'),T(SO,'p','b','-p- intervocálica se sonoriza a -b-.'),
      T(A,'u','o','La u breve latina se abre en o en la evolución castellana.'),T(PA,'ll','ll','La geminada -ll- da ll palatal.',subtype='-ll- > -ll-')],
 343:[T(SO,'t','d','-t- de la desinencia vivite > vivid se sonoriza en d.'),T(P,'e','','Se pierde -e final del imperativo plural.')],
 234:[T(SO,'c','g','La c se sonoriza en g durante la fase romance periglo.'),
      T(S,'ŭ','','Síncopa de ŭ postónica en -cŭl-.'),
      T(C,'cŭl','g','El grupo -cŭl- produce una secuencia con g y líquida: *periglo, antes de la metátesis. Ejemplo de evolución semiculta, no del subtipo -J-.',subtype='-CUL- > -G-',stages=['pericŭlum → *periglo → peligro']),
      T(ME,parts=[('r',0),('l',0)],output='lr',note='Las líquidas r y l permutan sus posiciones en *periglo → peligro.')],
 1055:[T(A,'i','e','La primera i breve del étimo pasa a e.',nth=0),
       T(A,'i','e','La segunda i breve pasa a e.',nth=1),
       T(S,'u','','Síncopa de la u del grupo -cul-.'),
       T(C,'cul','j','-cul- > -cl- > -j-; aquí «vencejo» significa atadura de mieses, no el pájaro.',subtype=CULJ)],

}

oldForms={N(w['latin']) for w in BASE_ROWS};oldIds={w['id'] for w in BASE_ROWS}
new=[]
for row in sorted(entries):
 src=source[row];lat=unicodedata.normalize('NFC',src['latin']);
 assert src['lot'] and src['lot']['class']=='PATRIMONIAL',(row,src['lot']);
 assert f'xl-{row}' not in oldIds and N(lat) not in oldForms,(row,lat)
 changes=[]
 for spec in entries[row]:
  c={k:spec[k] for k in ('rule','output','note')}
  if spec['subtype'] is not None:c['subtype']=spec['subtype']
  if spec['stages'] is not None:c['stages']=spec['stages']
  if spec['parts']:c['spans']=[SP(lat,frag,n) for frag,n in spec['parts']]
  elif spec['frag'] is not None:c['spans']=[SP(lat,spec['frag'],spec['nth'])]
  else:c['spans']=[]
  if spec['anchor'] is not None:c['anchor']=spec['anchor']
  c['id']=f't{len(changes)+1}'
  changes.append(c)
 if N(lat).endswith('um'):
  idx=len(lat)-2
  if not any(c['rule']==A and c['output']=='o' and [idx,idx+1] in c['spans'] for c in changes):
   changes.append({'id':f't{len(changes)+1}','rule':A,'spans':[[idx,idx+1]],'output':'o','note':'Abertura de la u final de -um a -o (norma seleccionable).'})
 if N(lat).endswith('m'):
  changes.append({'id':f't{len(changes)+1}','rule':'FIX_M','spans':[[len(lat)-1,len(lat)]],'output':'∅','note':'Pérdida fija de la -m del acusativo (no es apócope seleccionable).'})
 new.append({'id':f'xl-{row}','latin':lat,'answers':[src['spanish']],
             'source':{'file':'banco_evolucion_fonetica_con_filtro_didactico.xlsx','sheet':'Banco','row':row,'lot':src['lot']['batch'],
                       'classification':src['lot']['class'],'legacyRules':src['rules'],'sourceUrl':src['lot'].get('source')},
             'status':'reviewed-pilot','changes':changes,
             'explanation':src['lot'].get('justification') or src.get('notes') or ''})
 oldForms.add(N(lat));oldIds.add(f'xl-{row}')

assert len(new)==len(entries)
oldDigest=hashlib.sha256(json.dumps(BASE_ROWS,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()
newdata={**current,'words':BASE_ROWS+new}
(ROOT/'data/pilot.json').write_text(json.dumps(newdata,ensure_ascii=False,indent=2)+'\n')
counts=collections.Counter(r for w in new for r in set(c['rule'] for c in w['changes'] if c['rule']!='FIX_M'))
manifest={'label':'Lote IV: prioridad en normas con pocos ejemplos','source':'banco_evolucion_fonetica_con_filtro_didactico.xlsx',
 'previousCount':len(BASE_ROWS),'newCount':len(new),'totalCount':len(newdata['words']),
 'previousWordsSha256':oldDigest,'ids':[w['id'] for w in new],'rows':[w['source']['row'] for w in new],
 'bySourceLot':dict(sorted(collections.Counter(w['source']['lot'] for w in new).items())),
 'summaryRules':dict(sorted(counts.items())), 'fixedMCount':sum(w['latin'].endswith('m') for w in new),
 'sourcePolicy':'Solo filas PATRIMONIAL con segmentación manual. Se excluyen duplicados gráficos, cultismos y etiquetas no justificadas.',
 'reviewNotes':['La aféresis, asimilación y disimilación no tienen nuevas filas PATRIMONIAL seguras en esta selección.',
                'Hojaldre: la r es repercusión de líquida en el estadio romance hojalde, no inserción directa en latín.',
                'Coz: c ante e cambia de articulación, pero no se asigna una subnorma no prevista para esta africación.',
                'Tío: latín tardío thium, préstamo griego antiguo integrado; no se presenta como cultismo moderno.',
                'Hambre: *faminem es una reconstrucción de latín vulgar frente a famem clásico.',
                'Cuerda: la ficha chŏrdam ya existía; la duplicada chordam se excluye.']}
(ROOT/'data/batches/2026-11-12-normas-escasas.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print(f'{len(new)} fichas nuevas: {len(newdata["words"])} en total; {len(counts)} normas reforzadas; {sum(w["latin"].endswith("m") for w in new)} -m fijas')
print('Reparto por norma:',dict(sorted(counts.items(),key=lambda x:x[1])))
