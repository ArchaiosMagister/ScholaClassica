"""Tercer lote docente de 100 palabras, transcripción posicional manual sobre el Excel.

Ejecutar SOLO sobre un banco con 152 palabras. Las fichas tienen normas explícitas,
no se infieren automáticamente de las casillas X del Excel. Las controversias
permanecen en docs/REVISION.md; no se incorporan cultismos al corpus patrimonial.
"""
import json,hashlib,re,unicodedata,collections
from pathlib import Path
from selected_batch_3_rows import LOTS
BASE=Path(__file__).resolve().parents[1]
SOURCE={x['row']:x for x in json.loads(Path('/mnt/data/evolution_source_analysis.json').read_text())}
PILOT=BASE/'data/pilot.json'
CURRENT=json.loads(PILOT.read_text())
assert len(CURRENT['words'])==152,'Esta ampliación sólo parte del banco de 152 palabras.'

# Ids de normas oficiales PAU; FIX_M se agrega como norma fija cuando la forma acaba en -m.
A='ABER';F='AFER';P='APOC';AS='ASMIL';H='ASPIR';CO='CONS';D='DIPT';DI='DISIMIL';E='EPENT';G='GRIE';M='METAT';MO='MONOP';L='PALAT';PR='PROT';SI='SIMPL';S='SINC';SO='SONOR';V='VOC';MN='MIN_MBR';CU='CUL'
J='-CUL- > -J-'

def T(rule,frag=None,out='',note='',sub=None,nth=0,anchor=None,pieces=None,stages=None):
 assert note and isinstance(note,str),(rule,frag)
 return dict(rule=rule,frag=frag,output=out,note=note,subtype=sub,nth=nth,anchor=anchor,pieces=pieces,stages=stages)
def norm(t):
 return ''.join(x for x in unicodedata.normalize('NFD',t.casefold()) if unicodedata.category(x)!='Mn')
def span(word,frag,nth=0):
 occurrences=[m.start() for m in re.finditer(re.escape(norm(frag)),norm(word))]
 if len(word)!=len(norm(word)) or nth>=len(occurrences):raise ValueError(f'{word}: no se localiza {frag} n.º {nth}')
 i=occurrences[nth]
 return [i,i+len(norm(frag))]

entries={
# Lote 1. Monoptongación y palatalización de -mn-.
32:[T(MO,'au','o','El diptongo au se reduce a o; la pérdida final de -t de la conjunción no se presenta como apócope romance.')],
33:[T(MO,'au','o','El diptongo au inicial se monoptonga en o.'),T(A,'u','o','La u postónica se abre en o.',nth=1),T(L,'mn','ñ','El grupo -mn- palataliza en ñ.',sub='-mn- > -ñ-')],
# Lote 2. Abertura, laterales, sonorización y diptongación.
50:[T(SO,'p','b','La p intervocálica se sonoriza en b.'),T(A,'u','o','La u final se refleja como o.'),T(P,'t','','Desaparece la t final del étimo latino.')],
56:[T(SO,'p','b','-p- intervocálica > -b-.'),T(A,'u','o','La u breve pasa a o.'),T(L,'ll','ll','Palatalización de la lateral geminada.',sub='-ll- > -ll-')],
70:[T(D,'ŏ','ue','La ŏ tónica diptonga en ue. La yod siguiente se reestructura sin una regla seleccionable aparte.')],
71:[T(D,'ŏ','ue','La ŏ tónica diptonga en ue.'),T(A,'u','o','La u final pasa a o.')],
72:[T(D,'ŏ','ue','La ŏ tónica se convierte en ue.'),T(A,'u','o','La terminación latina -us se adapta a -o; no se contabiliza la s como apócope castellana.')],
78:[T(A,'u','o','La primera u breve se abre en o.',nth=0),T(SO,'c','g','La c intervocálica se sonoriza en g.'),T(A,'u','o','La segunda u breve se abre en o.',nth=1),T(L,'ll','ll','La lateral geminada se palataliza.',sub='-ll- > -ll-')],
83:[T(SO,'t','d','La t intervocálica de la forma verbal se sonoriza en d.'),T(P,'e','','Se pierde la e final de la forma latina.')],
# Lote 3. Dos resultados de -mn-, diptongación, aspiración y -nn-.
97:[T(D,'ŏ','ue','La ŏ tónica diptonga en ue.'),T(S,'ĭ','','Se pierde la ĭ postónica: domina > domna.'),T(L,pieces=[('m',0),('n',0)],out='ñ',note='El grupo -mn- resultante palataliza en ñ.',sub='-mn- > -ñ-',stages=['dominam > domna > doña > dueña'])],
98:[T(D,'ŏ','ue','La ŏ tónica diptonga en ue.'),T(S,'ĭ','','Síncopa de ĭ postónica: dominum > domnum.'),T(L,pieces=[('m',0),('n',0)],out='ñ',note='La secuencia m+n palataliza en ñ tras la síncopa.',sub='-mn- > -ñ-')],
117:[T(H,'f','h','La f- inicial se aspira y pasa a h- muda.'),T(P,'e','','Cae la e final de la terminación romance -orem > -or.',nth=1)],
130:[T(D,'ŏ','ue','La ŏ tónica diptonga en ue.')],
131:[T(D,'ŏ','ue','La ŏ tónica diptonga en ue.'),T(L,'ti','z','El grupo -ti- ante vocal desemboca en la sibilante escrita z.',sub='-ti- + vocal > sibilante')],
132:[T(D,'o','ue','La ŏ tónica diptonga en ue; foro es un doblete culto.')],
136:[T(H,'f','h','La f- inicial evoluciona a h- muda.')],
137:[T(H,'f','h','La f- inicial evoluciona a h- muda.'),T(A,'u','o','La ŭ tónica inicial se abre en o.',nth=0)],
138:[T(H,'f','h','La f- inicial evoluciona a h- muda.'),T(A,'u','o','La ŭ tónica se abre en o.')],
140:[T(L,'nn','ñ','La geminada nasal -nn- palataliza en ñ.',sub='-nn- > -ñ-'),T(SO,'t','d','La t intervocálica se sonoriza en d.')],
# Lote 4. Palatalización: -nn-, -ti-, -x-, -li-, pl-, -di-, -gn-, -ll-.
146:[T(L,'nn','ñ','La geminada -nn- palataliza en ñ.',sub='-nn- > -ñ-'),T(P,'e','','El infinitivo -ire acaba en -ir por pérdida de e.')],
192:[T(A,'i','e','La primera ĭ breve pasa a e.'),T(L,'ti','z','-ti- + vocal origina una sibilante escrita z.',sub='-ti- + vocal > sibilante')],
194:[T(L,'ti','z','-ti- + vocal da la sibilante castellana z.',sub='-ti- + vocal > sibilante')],
196:[T(SO,'t','d','La t intervocálica pasa a d.'),T(L,'x','j','La x latina (/ks/) evoluciona a la palatal medieval y luego a j.',sub='-x- > -j-')],
206:[T(D,'ŏ','ue','La ŏ tónica diptonga en ue.'),T(L,'ll','ll','La geminada latina -ll- da ll palatal.',sub='-ll- > -ll-')],
209:[T(L,'li','j','-li- ante vocal palataliza y pasa a j.',sub='-li- + vocal > -j-'),T(P,'e','','La e final de -erem se pierde.',nth=1)],
214:[T(A,'i','e','La ĭ breve se abre en e.')],
216:[T(MN,'mĭn','mbr','La secuencia -min- pierde su vocal y recibe b epentética: -mbr-.',stages=['-min- > -mn- > -mbr-'])],
217:[T(L,'ct','ch','Palatalización del grupo -ct- en ch.',sub='-ct- > -ch-')],
221:[T(L,'ll','ll','-ll- geminada latina > ll palatal castellana.',sub='-ll- > -ll-')],
238:[T(A,'i','e','La ĭ breve se abre en e.'),T(L,'nn','ñ','La geminada -nn- palataliza en ñ.',sub='-nn- > -ñ-')],
239:[T(L,'pl','ll','El grupo inicial pl- palataliza en ll-.',sub='pl- > ll-'),T(SI,'nct','nt','El grupo -nct- se reduce a -nt-, sin el resultado -ch- de -ct-.',sub='-nct- > -nt-')],
243:[T(L,'pl','ll','El grupo inicial pl- palataliza en ll-.',sub='pl- > ll-')],
244:[T(L,'di','y','-di- + vocal se palataliza en y.',sub='-di- + vocal > -y-')],
246:[T(D,'ŏ','ue','La ŏ tónica diptonga en ue.'),T(SO,'p','b','La p intervocálica se sonoriza en b.'),T(S,'ŭ','','Síncopa de la ŭ postónica antes de l.')],
249:[T(L,'ti','ci','La secuencia -ti- + vocal palataliza en ci.',sub='-ti- + vocal > -ci-')],
251:[T(L,'x','j','La x latina (/ks/) evoluciona a j.',sub='-x- > -j-')],
252:[T(L,'gn','ñ','El grupo -gn- palataliza en ñ.',sub='-gn- > -ñ-')],
253:[T(A,'u','o','La ŭ tónica pasa a o.',nth=0),T(L,'ll','ll','La lateral geminada latina da ll palatal.',sub='-ll- > -ll-')],
255:[T(L,'di','y','El grupo -di- ante vocal da y.',sub='-di- + vocal > -y-'),T(P,'e','','Cae la e final del infinitivo.')],
# Lote 5. -ni-, -gn-, consonantes geminadas y alternancias no automáticas.
266:[T(S,'ŭ','','Síncopa de la ŭ postónica de regŭlam > regla.')],
267:[T(S,'d','','Desaparece la d intervocálica.'),T(P,'e','','Cae la -e final del infinitivo.',nth=1)],
270:[T(S,'g','','Pérdida de g intervocálica.'),T(A,'i','e','La i breve pasa a e.'),T(SI,'tt','t','Simplificación de la geminada -tt-.',sub='-tt- > -t-')],
273:[T(L,'ti','z','El grupo -ti- ante vocal da la sibilante z.',sub='-ti- + vocal > sibilante'),T(P,'e','','La e final de -onem se pierde.')],
278:[T(D,'ĕ','ie','Diptongación de ĕ tónica a ie.'),T(SO,'c','g','Sonorización de c intervocálica a g.'),T(P,'t','','Se pierde la -t final de la forma verbal.')],
283:[T(L,'ni','ñ','-ni- ante vocal produce ñ.',sub='-ni- + vocal > -ñ-'),T(P,'e','','Cae la e final de -orem.',nth=1)],
284:[T(SI,'ns','s','Simplificación -ns- > -s-, conforme a la norma oficial.',sub='-ns- > -s-')],
285:[T(D,'ĕ','ie','La ĕ tónica diptonga en ie.')],
289:[T(A,'i','e','La ĭ inicial se abre en e.'),T(S,'gĭ','','Se pierde el grupo postónico gĭ en sigĭllum > sello.'),T(L,'ll','ll','-ll- geminada latina da ll palatal.',sub='-ll- > -ll-')],
290:[T(A,'i','e','La ĭ breve se abre en e.'),T(L,'gn','ñ','El grupo -gn- palataliza en ñ.',sub='-gn- > -ñ-')],
291:[T(A,'i','e','La primera ĭ se abre en e.',nth=0),T(A,'i','e','La siguiente ĭ se abre en e.',nth=1),T(L,'li','j','-li- ante vocal da j.',sub='-li- + vocal > -j-'),T(P,'e','','Se pierde la e final del infinitivo.')],
301:[T(PR,out='e',note='Aparece e- protética ante sp-.',anchor=0),T(S,'ŭ','','Síncopa de ŭ en el grupo -cŭl-.'),T(CU,'cŭl','j','-cŭl- > -cl- > j.',sub=J)],
305:[T(PR,out='e',note='Se añade e- ante sp-.',anchor=0),T(SI,'ns','s','Simplificación -ns- > -s-.',sub='-ns- > -s-')],
307:[T(PR,out='e',note='Se añade e- ante st-.',anchor=0),T(S,'ĭ','','Pérdida de ĭ postónica de -bĭl-.')],
308:[T(PR,out='e',note='Se añade e- ante st-.',anchor=0),T(L,'gn','ñ','El grupo -gn- palataliza en ñ.',sub='-gn- > -ñ-')],
313:[T(MO,'æ','e','Monoptongación del diptongo ae en e.'),T(S,'d','','Pérdida de la d intervocálica.')],
315:[T(MO,'au','o','El diptongo au se reduce a o.')],
316:[T(L,'ct','ch','Palatalización -ct- > -ch-.',sub='-ct- > -ch-')],
322:[T(L,'x','j','La x latina (/ks/) pasa a j en castellano.',sub='-x- > -j-'),T(P,'e','','Cae la e final del infinitivo.',nth=2)],
341:[T(L,'ti','ci','-ti- + vocal palataliza en ci.',sub='-ti- + vocal > -ci-')],
# Lote 6. Simplificaciones -pt-, -mpt- y apertura, aspiración, ll.
420:[T(A,'i','e','La ĭ breve se abre en e.'),T(SO,'c','g','La c intervocálica se sonoriza en g.'),T(P,'e','','Se pierde la e final del infinitivo.')],
433:[T(A,'i','e','La ĭ tónica pasa a e.')],
449:[T(A,'u','o','La ŭ tónica pasa a o.')],
452:[T(A,'u','o','La ŭ tónica se abre en o.'),T(SI,'ss','s','Simplificación de la geminada -ss-.',sub='-ss- > -s-'),T(P,'e','','Se pierde la e final.')],
455:[T(A,'u','o','La ŭ inicial pasa a o.')],
458:[T(A,'i','e','La ĭ inicial se abre en e.',nth=0),T(S,'i','','Síncopa de la ĭ postónica interior.',nth=1)],
489:[T(SI,'pt','t','Simplificación -pt- > -t-.',sub='-pt- > -t-'),T(P,'e','','Se pierde la -e final del infinitivo.')],
503:[T(MO,'æ','e','Monoptongación æ > e.'),T(SI,'pt','t','Simplificación -pt- > -t-.',sub='-pt- > -t-')],
508:[T(D,'e','ie','Diptongación de la ĕ tónica en ie.'),T(SI,'pt','t','El grupo -pt- se simplifica en t.',sub='-pt- > -t-')],
509:[T(SI,'mpt','nt','El grupo -mpt- se reduce a -nt-.',sub='-mpt- > -nt-'),T(P,'e','','Se pierde la e final del infinitivo.')],
514:[T(H,'f','h','f- inicial > h-.'),T(D,'e','ie','La ĕ tónica se diptonga en ie.')],
517:[T(H,'f','h','f- inicial > h-.'),T(A,'i','e','La ĭ tónica pasa a e.')],
548:[T(L,'ll','ll','La lateral geminada da ll palatal castellana.',sub='-ll- > -ll-')],
# Lote 7. Diptongación, simplificación de -ll-, disimilación y -m.
570:[T(D,'e','ie','Diptongación de ĕ tónica > ie.'),T(S,'e','','Desaparece la vocal postónica interior.',nth=1)],
581:[T(D,'o','ue','La ŏ tónica pasa a ue.')],
575:[T(D,'e','ie','La ĕ tónica se diptonga en ie.')],
576:[T(D,'e','ie','La ĕ tónica se diptonga en ie; se conserva -mbr-.')],
577:[T(D,'e','ie','La ĕ tónica se diptonga en ie.',nth=0),T(SI,'ss','s','La geminada -ss- se simplifica en s.',sub='-ss- > -s-'),T(P,'e','','Se pierde la e final de -essem.',nth=1)],
582:[T(D,'o','ue','Diptongación de ŏ > ue.')],
583:[T(D,'e','ie','La ĕ tónica diptonga en ie.',nth=0),T(S,'d','','Se pierde la d intervocálica.'),T(P,'e','','Se pierde la e final de -edem.',nth=1)],
585:[T(D,'e','ie','Diptongación de ĕ tónica > ie.',nth=0),T(SI,'ll','l','En esta posición la geminada -ll- se simplifica en l, no da ll palatal.',sub='-ll- > -l-'),T(P,'e','','Se pierde la e final de -ellem.',nth=1)],
608:[T(S,'e','','Se pierde la e postónica intermedia.',nth=1),T(DI,pieces=[('r',0),('r',1)],out='l…r',note='Disimilación de las dos líquidas: la primera r pasa a l.',stages=['temperare > templar']),T(P,'e','','Cae la e final del infinitivo.',nth=2)],
# Lote 8. Refuerza -li-, -ti-, -ni-, -mn-, -ct- y pliegues de la palatalización.
747:[T(MO,'au','o','Monoptongación au > o.'),T(S,'d','','Desaparece la d intervocálica.'),T(P,'e','','Se pierde la e final del infinitivo.')],
810:[T(L,'ll','ll','La geminada lateral da ll palatal.',sub='-ll- > -ll-')],
796:[T(SO,'c','g','La c intervocálica se sonoriza en g.'),T(L,'ti','z','-ti- ante vocal desemboca en z.',sub='-ti- + vocal > sibilante'),T(P,'e','','Cae la e final de -are.')],
802:[T(L,'li','j','-li- ante vocal da j.',sub='-li- + vocal > -j-')],
823:[T(L,'mn','ñ','Palatalización -mn- > ñ.',sub='-mn- > -ñ-')],
825:[T(L,'li','j','-li- ante vocal da j.',sub='-li- + vocal > -j-'),T(P,'e','','Se pierde la e final de -are.')],
830:[T(L,'ct','ch','-ct- > -ch- por palatalización.',sub='-ct- > -ch-')],
855:[T(L,'ni','ñ','-ni- ante vocal palataliza en ñ.',sub='-ni- + vocal > -ñ-'),T(P,'e','','Se pierde la e final de -onem.')],
862:[T(PR,out='e',note='Aparece e- protética ante scr-.',anchor=0),T(L,'ni','ñ','-ni- ante vocal > ñ.',sub='-ni- + vocal > -ñ-')],
864:[T(PR,out='e',note='Aparece e- protética ante st-.',anchor=0),T(L,'nn','ñ','-nn- geminada palataliza en ñ.',sub='-nn- > -ñ-')],
# Lote 9. 2 grupos contrastivos: -ct-, -cc- y t > d.
865:[T(PR,out='e',note='Se añade e- protética ante str-.',anchor=0),T(A,'i','e','La ĭ tónica se abre en e.'),T(L,'ct','ch','El grupo -ct- palataliza en ch.',sub='-ct- > -ch-')],
920:[T(SI,'cc','c','Simplificación de la geminada -cc- > -c-.',sub='-cc- > -c-'),T(SO,'t','d','La t intervocálica se sonoriza en d.')],
# Lote 10. Palatalizaciones -CUL-, -ll-, -nn-; regla específica -MIN-.
1038:[T(PR,out='e',note='Se añade e- protética ante st-.',anchor=0),T(MN,'min','mbr','La secuencia -min- > -mbr- por síncopa y epéntesis internas.',stages=['-min- > -mn- > -mbr-'])],
1039:[T(SO,'c','g','La primera c intervocálica pasa a g.',nth=0),T(S,'u','','Síncopa de u del grupo -cul-.',nth=1),T(CU,'cul','j','El grupo -cul- se transforma en j (tras síncopa).',sub=J)],
1040:[T(L,'nn','ñ','La geminada -nn- palataliza en ñ.',sub='-nn- > -ñ-'),T(A,'u','o','La primera u breve se abre en o.',nth=0),T(S,'u','','Se pierde la u postónica del grupo -cul-.',nth=1),T(CU,'cul','j','-cul- > -cl- > j.',sub=J)],
1041:[T(SO,'p','b','La p intervocálica se sonoriza en b.'),T(A,'i','e','La ĭ tónica pasa a e.'),T(S,'u','','Síncopa de u postónica de -cul-.'),T(CU,'cul','j','-cul- > -cl- > j.',sub=J)],
1044:[T(A,'u','o','La u inicial se abre en o.'),T(SI,'tt','t','Simplificación de la geminada -tt-.',sub='-tt- > -t-'),T(S,'u','','Síncopa de u postónica de -cul-.',nth=1),T(CU,'cul','j','-cul- > -cl- > j.',sub=J)],
1048:[T(H,'f','h','f- inicial pasa a h-.'),T(L,'ll','ll','La lateral geminada palataliza en ll.',sub='-ll- > -ll-'),T(A,'i','e','La ĭ tónica se abre en e.'),T(S,'u','','Síncopa de la primera u postónica de -cul-.',nth=0),T(CU,'cul','j','-cul- > -cl- > j.',sub=J)],
1050:[T(A,'i','e','La ĭ tónica se abre en e.'),T(S,'u','','Síncopa de u postónica de -cul-.'),T(CU,'cul','j','-cul- > -cl- > j.',sub=J)],
}

assert set(entries)==set(sum(LOTS.values(),[])),f'Faltan/sobran: {set(sum(LOTS.values(),[]))^set(entries)}'
base_ids={w['id'] for w in CURRENT['words']};base_forms={norm(w['latin']) for w in CURRENT['words']}
new=[]
for lot,rows in LOTS.items():
 for row in rows:
  src=SOURCE[row]
  assert src['lot'] and src['lot']['class']=='PATRIMONIAL' and src['lot']['batch']==lot,(row,src['lot'])
  latin=unicodedata.normalize('NFC',src['latin'])
  assert f'xl-{row}' not in base_ids and norm(latin) not in base_forms,(row,latin)
  changes=[]
  for spec in entries[row]:
   t={k:v for k,v in spec.items() if v is not None and k not in ('frag','pieces','nth','subtype')}
   if spec['subtype'] is not None:t['subtype']=spec['subtype']
   if spec['pieces']:
    t['spans']=[span(latin,f,k) for f,k in spec['pieces']]
   elif spec['frag'] is not None:
    t['spans']=[span(latin,spec['frag'],spec['nth'])]
   else:t['spans']=[]
   t['id']=f't{len(changes)+1}'
   changes.append(t)
  if norm(latin).endswith('um'):
   idx=len(latin)-2
   if not any(t['rule']==A and t['output']=='o' and [idx,idx+1] in t['spans'] for t in changes):
    changes.append({'id':f't{len(changes)+1}','rule':A,'spans':[[idx,idx+1]],'output':'o','note':'La u de -um se abre a o: norma seleccionable confirmada.'})
  if norm(latin).endswith('m'):
   changes.append({'id':f't{len(changes)+1}','rule':'FIX_M','spans':[[len(latin)-1,len(latin)]],'output':'∅','note':'Pérdida de la -m final del acusativo (norma fija).'})
  lotinfo=src['lot']
  new.append({'id':f'xl-{row}','latin':latin,'answers':[src['spanish']],
   'source':{'file':'banco_evolucion_fonetica_con_filtro_didactico.xlsx','sheet':'Banco','row':row,'lot':lot,'classification':lotinfo['class'],'legacyRules':src['rules'],'sourceUrl':lotinfo.get('source')},
   'status':'reviewed-pilot','changes':changes,
   'explanation':lotinfo.get('justification') or src['notes']})
  base_forms.add(norm(latin));base_ids.add(f'xl-{row}')
assert len(new)==100
beforeHash=hashlib.sha256(json.dumps(CURRENT['words'],ensure_ascii=False,separators=(',',':')).encode()).hexdigest()
result={**CURRENT,'words':CURRENT['words']+new}
PILOT.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
manifest={
 'source':'banco_evolucion_fonetica_con_filtro_didactico.xlsx','label':'Lote de ampliación III: 100 nuevas palabras',
 'previousCount':152,'newCount':100,'totalCount':252,'previousWordsSha256':beforeHash,
 'ids':[w['id'] for w in new],'rows':[w['source']['row'] for w in new],
 'bySourceLot':dict(sorted(collections.Counter(w['source']['lot'] for w in new).items())),
 'summaryRules':dict(sorted(collections.Counter(r for w in new for r in set(t['rule'] for t in w['changes'] if t['rule']!='FIX_M')).items())),
 'fixedMCount':sum(w['latin'].endswith('m') for w in new),
 'note':'La fuente tiene apenas nuevos ejemplos de grafías griegas clasificados PATRIMONIAL; los cultismos no se fuerzan al sorteo.'
}
(BASE/'data/batches/2026-11-12-100-tercero.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print('100 nuevas fichas, 252 acumuladas; normas nuevas',manifest['summaryRules'])
