# Evolutio valenciano — conciliación académica (actualización 17/11/2026) · sexta tanda e inventario completo

## Integración académica de 66 correspondencias (sin publicación)

Las **66 correspondencias contrastadas** de las dos revisiones (18 + 63) se han incorporado efectivamente al banco académico `conciliacion-curada.json`, con el estado **`contrastat_lexic_sense_fonetica`** y la fuente individual de cada registro. **No se han añadido reglas fonéticas ni se ha alterado ningún ejercicio del alumnado.**

La matriz reproducible `matriz-522.json` distingue ahora cuatro estados: **120** correspondencias con análisis fonético editorial (aún sin certificación normativa), **66** con contraste léxico pero fonética pendiente, **52** propuestas no promovidas —incluidas las 15 reservas de las dos últimas revisiones— y **284** sin propuesta. Total: **522**. Las tres reservas exclusivas para castellano siguen fuera del valenciano.

- Fuentes de las 66: **64 DCVB, 1 IEC y 1 GDLC**. Se conservan la forma propuesta, los IDs de origen y el vínculo al expediente individual.
- Cada una de las 66 tiene `normas: null`, `estadoNormas: pendent`, `aprobadoDocente: false` y `aptoParaPractica: false`. Las 120 revisiones fonéticas anteriores permanecen intactas y siguen sin ser ejercicios.
- Se crea `cola-fonetica-66-2026-11-17.json`, con **66 verificaciones pendientes** de DNV, cadena histórica, leyes, posiciones Unicode y validación docente. Es una cola de investigación, **no** la afirmación de que estas verificaciones estén completadas.
- La separación entre el contraste del léxico y la validación de leyes evita convertir una correspondencia etimológica respaldada en un ejercicio incorrecto.

**Siguiente paso:** revisar individualmente los 66 itinerarios fonéticos, empezando por las transformaciones más sencillas, sin alterar el original ni publicar hasta completar las evidencias. Las 15 reservas requieren examen filológico o decisión docente independientes.

## Revisión concentrada de las 63 candidaturas restantes (17/11/2026)

Se ha revisado de forma individual **la totalidad de las 63 propuestas** que quedaban de la cola original de 81 casos sin contraste. El expediente `shared/academic/evolutio-valenciano/revisio-restants-63-2026-11-17.json` identifica cada étimo, respuesta propuesta, fuente consultada, observación filológica, reserva y situación de aprobación.

- **50 correspondencias con respaldo léxico/etimológico** (DCVB en la mayoría; estudio del IEC para `credere → creure` y GDLC para `cuminum → comí`). Su respaldo **no equivale** a certificación de cambios fonéticos ni de uso valenciano en el DNV.
- **13 reservas motivadas**, entre ellas `datum → dau` (etimología discutida), `leguminem → llegum` (acusativo latino neutro incorrecto), `planctum → plany` (derivado postverbal), `sensum → seny` (origen germánico), `luxum → luxe` / `stabĭlem → estable` / `uitium → vici` (préstamos); también `pluuiam → pluja` (base vulgar), `iacere → jaure` (uso valenciano actual), `uiduam → viuda` (doblete de estratos), `acutiare → agutzar` (variante no acreditada en DCVB), `mutabĭlem → mutable` (documentación etimológica individual no recuperada) y `curtare → curtar` (verbo no acreditado).
- **Las 81 candidaturas originales quedaron examinadas y clasificadas** en el expediente histórico de 18 + 63. Desde entonces, las 66 respaldadas han pasado al nuevo estado léxico intermedio. **No están verificadas fonéticamente** ni son evaluables.
- En el corte anterior, la matriz expresaba **120 documentadas, 118 propuestas y 284 pendientes**. Tras la promoción exclusivamente léxica, ahora distingue **120 + 66 + 52 + 284**, con cero fichas aptas para práctica. Las 100 ampliaciones castellanas siguen intactas.

### Siguiente bloqueo académico

Comprobar DNV individualmente, decidir qué préstamos y étimos alternativos son admisibles con fines didácticos, reconstruir y verificar los pasos fonéticos de las correspondencias respaldadas, someter al docente las reservas que necesiten criterio y **solo después** promover fichas en una PR separada. No hay permiso para fusionar ni desplegar este trabajo por ahora.

## Estado vigente y protección de la versión publicada

Este trabajo **sigue siendo privado y no jugable**. La matriz valenciana conserva **522** étimos identificados por ID del origen fijado (Evolutio independiente); la ampliación de **100 fichas castellanas** recientemente publicada en ScholaClassica **no se traduce automáticamente ni se incorpora** a esta matriz. Por tanto, las 100 nuevas palabras siguen solo en castellano.

| Estado (17/11/2026) | Entradas | Significado |
|---|---:|---|
| Correspondencia léxica `documentat` | **120** | Etimología y acepción corroboradas en el DCVB; no equivale a validación normativa del DNV |
| `contrastat_lexic_sense_fonetica` | **66** | Contraste de forma, acepción y etimología; sin análisis de leyes ni validación DNV |
| `proposta` | **52** | Propuestas con reserva o evidencia insuficiente; ninguna habilitada |
| `pendent` | **284** | Sin solución habilitada; incluye tres reservas solo castellanas |
| Análisis fonéticos editoriales | **120** | Análisis léxicos y fonéticos individuales acumulados; ninguno certificado para práctica |
| Casos reservados solo castellano | **3** | `octo`, `dictum`, `sigĭllum`: ninguna respuesta valenciana entregable |
| Normas certificadas para evaluación | **0** | Sigue faltando contraste normativo individual y aprobación integral |
| Fichas habilitadas para test valenciano | **0** | No publicar hasta cerrar la verificación |

### Decisiones docentes consolidadas

- `noctem → nit`: **VOCALITZACIÓ y SIMPLIFICACIÓ**, provisionalmente, con etapa *nuit* explícita; no se certifica el encadenamiento histórico.
- `matrem → mare`: **SIMPLIFICACIÓ** de `-tr-` por pérdida de *t*.
- `fabam → fava` y `caballum → cavall`: debilitamiento intervocálico `-b- → -v-` **explicado sin ley seleccionable**. En `caballum`, revisar **PALATALITZACIÓ** de `-ll-` y **APÒCOPE** de `-u`; `fabam` conserva únicamente pérdida fija de `-m` y no sirve para un test de leyes.
- `cælum → cel`: **MONOFTONGACIÓ** y **PALATALITZACIÓ** según decisión docente. La pérdida de la vocal final no se certifica como norma adicional.
- `fĕrrum → ferro`: **OBERTURA** de `-u` a `-o`; se mantiene sin añadir falsa diptongación.
- `ocŭlum → ull`: **SÍNCOPE** de `ŭ` postónica, seguida de **PALATALITZACIÓ** del grupo `-cl-`, con base vulgar `ŏclu` documentada por DCVB.

Las decisiones sobre el análisis de una palabra **no significan** que se hayan verificado todas sus reglas con DNV ni que la ficha quede aprobada para evaluación. Los indicadores `dnvIndividualChecked`, `teacherApproved` y `playable` permanecen en `false`.

### Sexta tanda: inventario exhaustivo de las 146 propuestas anteriores (17/11/2026)

Se ha realizado un **inventario íntegro de todas las 146 propuestas**, guardado en `auditoria-pendents-146-2026-11-17.json`. Importante: **inventariar no equivale a comprobar**. Se distingue expresamente qué fichas cuentan con contraste etimológico individual y cuáles permanecen sin evidencia, para evitar certificaciones ficticias.

| Resultado de las 146 propuestas iniciales | Casos | Alcance |
|---|---:|---|
| Correspondencia y acepción documentadas de nuevo en DCVB | **28** | 28 análisis editoriales individuales; aún sin contraste DNV ni certificación de las leyes |
| Reservas ya fundamentadas en las cuatro colas anteriores | **22** | Conservan la razón y referencia histórica, sin análisis ni aprobación |
| Nuevas reservas individualizadas por étimo, préstamo, arcaísmo o cadena | **15** | Enumeradas en `incidencies-15-2026-11-17.json`, con referencia DCVB |
| Pendientes de cotejo lexicográfico individual suficiente | **81** | **No verificadas**; no se inventan fuentes ni reglas, siguen como propuestas |

**Resultado global del corte histórico previo a la promoción de 66:** 120 correspondencias documentadas, **118 propuestas aún sin cerrar**, 284 sin propuesta —incluidas tres reservas docentes exclusivamente castellanas—, 120 análisis editoriales y **cero fichas aptas para práctica valenciana**. Se preservan todas las fichas e IDs latinos, la versión independiente, y las 100 palabras añadidas únicamente en castellano.

**Veintiocho nuevas correspondencias documentadas:** `aucam → oca`, `comitem → comte`, `maiorem → major`, `multum → molt`, `spartum → espart`, `cæcare → cegar`, `capillum → cabell`, `chŏrdam → corda`, `cupam → cuba`, `grŏssum → gros`, `maurum → moro`, `littĕram → lletra`, `pensare → pesar`, `damnum → dany`, `minorem → menor`, `minutum → menut`, `mustum → most`, `linguam → llengua`, `urticam → ortiga`, `siluam → selva`, `pinnam → penya`, `gubernare → governar`, `inimicum → enemic`, `martium → març`, `regŭlam → regla`, `undam → ona`, `pedem → peu`, `mensuram → mesura`.

Los cambios históricos especificados en `revisio-120-2026-11-17.json` son **editoriales y no certificables aún**. Por ejemplo, `gubernare → governar` explica la lenición `-b- → -v-` sin incorporarla como norma seleccionable; `pedem → peu` conserva la vocalización editorial pero requiere contrastar la cadena; `maurum → moro` mantiene el vocalismo final pendiente de verificación. Las vocales y consonantes se señalan sobre la secuencia Unicode latina, y la pérdida fija de -m no se evalúa como ley elegible.

**Cuatro posibles incompatibilidades de étimo en el banco que requieren decisión docente**, sin corregir automáticamente la palabra latina original:

- `alium → all`: el [DCVB (all)](https://dcvb.iec.cat/results.asp?word=all) parte de **allĭum**, con dos eles; el banco conserva `alium`.
- `cæpullam → ceba`: el [DCVB (ceba)](https://dcvb.iec.cat/results.asp?word=ceba) ofrece **cēpa**; la forma del banco necesita una justificación distinta si se quiere utilizar.
- `ballænam → balena`: el [DCVB (balena)](https://dcvb.iec.cat/results.asp?word=balena) utiliza **bālaena**, no la geminada del banco.
- `nomĭnem → nom`: para el sustantivo neutro latino **nomen**, el acusativo regular es **nomen**, no `nomĭnem`; revisar paradigma y forma de partida.

**Otras once reservas nuevas:** préstamos latinos `uoluntatem → voluntat`, `nauigare → navegar`, `integrare → integrar`; `fundum → fons` por discrepancia de forma casual y terminación; `forum → fur` por la especialización semántica; `lignum → lleny` por el sentido arcaico 'embarcación'; y las cadenas históricas no justificadas de `auricŭlam → orella`, `spatium → espai`, `maium → maig`, `radium → raig`, `crucem → creu`. Estas correspondencias pueden ser lexicográficamente correctas, pero no se dan por **fonéticamente completas** ni elegibles para un test.

**Trabajo pendiente y límite de evidencia:** las 81 propuestas sin contraste individual, la comprobación normativa DNV entrada por entrada y la acreditación de cada ley antes de evaluación. Se registra el resultado de la revisión sin declarar las 81 como verificadas. `dnvIndividualChecked`, `teacherApproved` y `playable` siguen en falso para todas las entradas. Se mantiene la prohibición de publicar.

### Quinta tanda: 21 candidatas, 12 documentadas, 9 reservas (17/11/2026)

Se han contrastado **21** candidatos con el [Diccionari català-valencià-balear (DCVB)](https://dcvb.iec.cat/): doce correspondencias (forma, sentido y etimología) pasan a `documentat`, con 12 análisis fonéticos individuales en `revisio-92-2026-11-17.json`; nueve conservan `proposta` por circunstancias etimológicas que impiden certificar automáticamente una evolución patrimonial. La cola `cola-revisio-21-2026-11-17.json` contiene la fuente y el motivo para cada una.

| Étimo | Valenciano | Leyes editoriales **sin certificación** | Precaución |
|---|---|---|---|
| `latrare` | lladrar | PALATALITZACIÓ, SONORITZACIÓ, APÒCOPE | Verbo 'ladrar', no el homónimo 'robar' |
| `ligare` | lligar | PALATALITZACIÓ, APÒCOPE | El DCVB atestigua *ligar* antiguo y pronunciación valenciana de -r |
| `pugnum` | puny | PALATALITZACIÓ, APÒCOPE | `gn` → `ny`; sin atribuir OBERTURA inexistente |
| `saporem` | sabor | SONORITZACIÓ, APÒCOPE | `p` intervocálica → `b`; se conserva -r valenciana |
| `stagnum` | estany | PRÒTESI, PALATALITZACIÓ, APÒCOPE | *Estany* 'laguna', no metal 'estaño' de `stannum` |
| `nominare` | nomenar | OBERTURA, APÒCOPE | **Nomenar** para designar cargo; muchos otros sentidos usan *anomenar* |
| `siccum` | sec | OBERTURA, SIMPLIFICACIÓ, APÒCOPE | Adjetivo 'seco', no `séc` 'marca/surco' |
| `sŏmnum` | son | SIMPLIFICACIÓ, APÒCOPE | Sustantivo 'sueño', no posesivo *son* de `suum` |
| `sagitta` | sageta | OBERTURA, SIMPLIFICACIÓ | Forma latina en -a: **no** lleva regla fija -m |
| `pullum` | poll | OBERTURA, PALATALITZACIÓ, APÒCOPE | 'Pollito' de `pullu`, no 'piojo' de `peduculu` ni árbol de `populu` |
| `grunnire` | grunyir | PALATALITZACIÓ, APÒCOPE | **Nasal -nn- > -ny-**, no lateral; se conserva -r |
| `peccatum` | pecat | SIMPLIFICACIÓ, APÒCOPE | `-cc-` → `-c-`, -u y -m desaparecen |

**Las nueve reservas de esta tanda** continúan como `proposta` y sin normas ni práctica evaluable:

- `temperare → temperar`, `squamam → escama`, `passum → pas`: el DCVB usa explícitamente *pres del llatí* para estas voces; son **préstamos**, no ejemplos certificados de evolución patrimonial.
- `serpĕntem → serp`: el DCVB señala el étimo directo **sĕrpe**, no *serpentem*; no admitir la equivalencia por parecido.
- `sponsam → esposa` y `sponsum → espòs`: relación latina documentada, pero el DCVB señala uso casi exclusivamente literario y conviene revisar la cadena de síncopa/protesis antes de utilizarla en exámenes.
- `catenatum → cadenat`: el DCVB explica `cadenat` como derivado de *cadena*, no como resultado directo comprobado de *catenatum*.
- `latronem → lladre`: el DCVB cita *latro* como origen; la reconstrucción desde la forma acusativa precisa etapas consonánticas y vocálicas no justificadas todavía.
- `cunicŭlum → conill`: correspondencia léxica atestiguada, con variación vocálica valenciana, pero la secuencia histórica entre síncopa y palatalización necesita evidencia adicional.

**Criterios de integridad:** 92 análisis acumulados, con controles de fragmentos Unicode, 522 IDs del banco bloqueado, 35 nombres propios castellanos excluidos de práctica según criterio existente, y 100 fichas castellanas suplementarias sin traducción automática. *Aprobación docente*, *verificación DNV individual*, *certificación de leyes* y *apto para práctica valenciana* permanecen en **false/cero**. Se mantiene intacta la prohibición de publicar la matriz valenciana.

La prioridad siguiente será el análisis de las 146 propuestas y, antes de activar ninguna ficha, un cotejo individual del [Diccionari normatiu valencià de la AVL](https://www.avl.gva.es/lexicval/) junto a pruebas escolares de las leyes concretas. No se atribuye una revisión normativa que no se ha ejecutado.

### Cuarta tanda: 18 candidatas transparentes y homónimas (17/11/2026)

La cuarta tanda contrasta **18** candidaturas de las 172 anteriores: **14** se incorporan al repertorio lexicalmente documentado en el DCVB y **4** permanecen expresamente reservadas. La matriz de 522 IDs históricos contiene ahora 80 documentadas, 158 propuestas y 284 pendientes, de ellas tres reservas originales solo castellanas. Todas siguen sin autorización para practicar; el contraste DNV individual **no se ha completado**.

| Étimo | Valenciano | Leyes en análisis editorial provisional | Advertencia |
|---|---|---|---|
| `molam` | mola | Ninguna seleccionable (solo -m fija) | Acepción de piedra de molino; otros sentidos pueden remontarse a `mōle` |
| `uallem` | vall | PALATALITZACIÓ + APÒCOPE | **Vall femenina** 'valle', no *vall* masculino 'foso' de `vallum` |
| `aurum` | or | MONOFTONGACIÓ + APÒCOPE | El DCVB registra el estadio histórico *aur* |
| `mensem` | mes | SIMPLIFICACIÓ + APÒCOPE | Sustantivo 'mes del año', no *mes* adversativo |
| `uentum` | vent | APÒCOPE | La u consonántica latina se representa v |
| `cŏrnu` | corn | APÒCOPE | Sin pérdida de -m porque la forma latina no acaba en m |
| `uĕntrem` | ventre | Ninguna seleccionable (solo -m fija) | Sin diptongación de ĕ; no copiar el análisis castellano |
| `ferum` | fer | APÒCOPE | Adjetivo 'salvaje', **no** el verbo *fer* procedente de `facere` |
| `mŏllem` | moll | PALATALITZACIÓ + APÒCOPE | Adjetivo 'blando'; no *moll* 'muelle del puerto', de origen italiano |
| `semper` | sempre | METÀTESI | Transposición final *-er* > *-re*; sin -m de acusativo |
| `ordinare` | ordenar | OBERTURA + APÒCOPE | El DCVB registra las variantes antiguas *ordinar* y *ordonar*; carácter regular de la abertura pendiente de certificar |
| `intrare` | entrar | OBERTURA + APÒCOPE | ĭ inicial > e como análisis provisional |
| `curtum` | curt | APÒCOPE | La ŭ tónica se conserva como u; no inventar abertura |
| `calĕntem` | calent | APÒCOPE | La ĕ tónica no se diptonga en valenciano |

Las dos primeras palabras sin leyes seleccionables y otras equivalencias idénticas son léxicamente válidas para el **estudio**, pero no necesariamente sirven como preguntas en las que se evalúan cambios fonéticos. La pérdida fija de -m se incorpora automáticamente solo cuando procede.

**Cuatro reservas adicionales:**

- `totum → tot`: el [DCVB](https://dcvb.iec.cat/results.asp?word=tot) da como origen inmediato la forma vulgar `tottu`, intensiva de `tōtum`. Hace falta justificar esta mediación antes de puntuar.
- `bonum → bo`: [DCVB: bo](https://dcvb.iec.cat/results.asp?word=bo). La base es `bonu`, pero es necesario explicar la pérdida de -n y la alternancia *bo/bon*.
- `nouem → nou`: [DCVB: nou](https://dcvb.iec.cat/results.asp?word=nou). El numeral nueve comparte grafía con el fruto 'nuez', el adjetivo 'nuevo' y otros homónimos, todos de procedencia diferente; el final *-ve > -u* requiere contrastar etapas.
- `milium → mill`: [DCVB: mill](https://dcvb.iec.cat/results.asp?word=mill), sustantivo de 'mijo', procedente de `mīlĭu`, distinto del numeral *mil* (< `mīlle`). Se reserva la cadena de palatalización.

Estas cuatro quedan **como propuestas con fuente y razón de reserva, sin análisis ni respuesta practicable**. Las tres reservas históricas de *octo*, *dictum* y *sigillum* siguen estrictamente *solo castellano*. La cola `cola-revisio-18-2026-11-17.json` deja constancia de cada decisión y del estado de verificación. La revisión `revisio-80-2026-11-17.json` conserva los 66 análisis previos y añade únicamente los 14 nuevos.

**Límite de evidencia:** «etimología documentada» no significa certificación de las 17 leyes ni cotejo individual del DNV. Todos los indicadores `dnvIndividualChecked`, `teacherApproved`, `playable` siguen en falso.

### Tercera tanda: 19 casos contrastados (17/11/2026)

La tercera tanda ha revisado 19 étimos del grupo aún propuesto, **documentando léxicamente 16** en el DCVB. Su identificación (incluyendo acepciones, homonimias y cambios editoriales provisionales) se conserva en `cola-revisio-19-2026-11-17.json`. Los 16 casos se integran en `revisio-66-2026-11-17.json` y en la matriz reproducible de 522 IDs. No se han alterado las 100 fichas añadidas posteriormente solo al castellano.

| Latín | Valenciano | Revisión editorial, pendiente de certificación |
|---|---|---|
| `clamare` | clamar | APÒCOPE de la vocal final del infinitivo |
| `hĕrbam` | herba | Solo caída fija de `-m`; sin diptongación castellana |
| `spinam` | espina | PRÒTESI de `e-` ante `sp-` |
| `serram` | serra | Solo caída fija de `-m`; no inventar ley para `rr` |
| `cæcum` | cec | MONOFTONGACIÓ, PALATALITZACIÓ inicial y APÒCOPE de `-u`; no aceptar `cego` como resultado normativo |
| `turrem` | torre | OBERTURA de `ŭ` a `o`; se conserva la `-e` final |
| `securum` | segur | SONORITZACIÓ de `c` intervocálica y APÒCOPE de `-u` |
| `formicam` | formiga | SONORITZACIÓ de `-c-` a `-g-` |
| `fossam` | fossa | Solo caída fija de `-m` |
| `fumum` | fum | APÒCOPE de `-u`, caída fija de `-m` |
| `pŏrcum` | porc | APÒCOPE de `-u`, sin diptongación de `ŏ` |
| `truncum` | tronc | OBERTURA de `ŭ` y APÒCOPE de `-u` |
| `paucum` | poc | MONOFTONGACIÓ de `au` en `o` y APÒCOPE |
| `causam` | cosa | MONOFTONGACIÓ de `au` en `o`; seleccionar acepción latina vulgar 'cosa' y no el préstamo culto `causa` |
| `spumam` | espuma | PRÒTESI de `e-`; forma usada en valenciano según DCVB, pendiente de DNV individual |
| `fel` | fel | Identidad formal, sin leyes seleccionables |

**Tres reservas nuevas:**

1. **`fĕbrem → febre`**: el [DCVB](https://dcvb.iec.cat/results.asp?word=febre) documenta la derivación latina, pero el [acuerdo de la AVL de 20 de mayo de 2002](https://www.avl.gva.es/wp-content/uploads/2022/04/Acord-normatiu-de-20-de-maig-del-2002.pdf) recoge **febra como preferente** frente a febre. El [libro de estilo de À Punt/CVMC](https://www.cvmc.es/llibre/partb.html) describe `febra` como entrada principal y `febre` como secundaria aceptada. Se reserva el resultado didáctico hasta resolver qué variantes mostrar, **sin interpretar una preferencia normativa como una ley fonética**.
2. **`fibram → fibra`**: el [DCVB](https://dcvb.iec.cat/results.asp?word=fibra) señala expresamente *pres del llatí*, indicio de préstamo culto. No debe premiarse como evolución patrimonial sin evidencia adicional.
3. **`nigrum → negre`**: correspondencia léxica [DCVB](https://dcvb.iec.cat/results.asp?word=negre) documentada, pero la evolución de la terminación `-u` a `-e` no está reconstruida en la matriz con evidencia suficiente. Continúa como propuesta no evaluable.

En la nueva cola consta la fuente pública por cada caso, la razón de reserva y el estado distinto de *evidencia léxica*, *evaluación de las leyes* y *aprobación docente*. **El DNV no ha sido verificado entrada por entrada** por este proceso y todas las nuevas fichas conservan `dnvIndividualChecked=false`, `teacherApproved=false`, `playable=false`. Los registros `hĕrbam`, `serram`, `fossam` y `fel` ilustran por qué una coincidencia léxica documentada sin leyes seleccionables **no es necesariamente una buena pregunta de evolución fonética**.

**Resumen global (17/11):** 66 documentadas, 172 propuestas, 284 sin propuesta, tres reservas históricas *solo castellano*, 66 análisis editoriales, **0 fichas autorizadas para test valenciano**. No se ha activado el cambio de lengua ni modificado Evolutio independiente.

### Segunda tanda: contraste individual de 24 candidatas (16/11/2026)

Se han examinado las 24 entradas de la primera cola de revisión, contrastando forma, acepción y etimología con el DCVB y distinguiendo las reservas que impiden trasladarlas automáticamente a un test escolar. **18 correspondencias** pasan a `documentat` con su ficha DCVB individual y análisis editorial; **6 permanecen en `proposta`** con motivo explícito. El DNV no ha podido consultarse entrada por entrada por los medios disponibles: **ninguna** de las 18 tiene `dnvIndividualChecked=true`, `ruleVerified=true`, `teacherApproved=true` ni `playable=true`.

| Latin | Valenciano | Criterio escolar provisional |
|---|---|---|
| `pœnam` | pena | MONOFTONGACIÓ, solo acepción 'castigo/aflicción'; evitar confundir con `penna` / `pinna` |
| `scutum` | escut | PRÒTESI y APÒCOPE, sin abrir -u a -o |
| `spicam` | espiga | PRÒTESI y SONORITZACIÓ **-c- → -g-**, no `p` |
| `cannam` | canya | PALATALITZACIÓ `-nn-` → `-ny-` |
| `guttam` | gota | OBERTURA y SIMPLIFICACIÓ |
| `pannum` | pany | PALATALITZACIÓ y APÒCOPE; advertencia de evolución semántica |
| `septem` | set | SIMPLIFICACIÓ y APÒCOPE; solo numeral siete (no `set` 'sed') |
| `iurare` | jurar | CONSONANTITZACIÓ y APÒCOPE |
| `surdum` | sord | OBERTURA y APÒCOPE |
| `hŏrtum` | hort | APÒCOPE; sin aspiración castellana |
| `sortem` | sort | APÒCOPE; evitar el homónimo toponímico |
| `pellem` | pell | PALATALITZACIÓ de `ll` y APÒCOPE |
| `crustam` | crosta | OBERTURA **con advertencia de analogía vocálica en DCVB**; no certificar ley |
| `timorem` | temor | OBERTURA y APÒCOPE; conservar -r final valenciana |
| `muscam` | mosca | OBERTURA de ŭ |
| `fŏrtia` | força | PALATALITZACIÓ de `-ti-`; DCVB confirma la base vulgar |
| `rŏtam` | roda | SONORITZACIÓ de `-t-` intervocálica |
| `iuncum` | jonc | CONSONANTITZACIÓ, OBERTURA editorial y APÒCOPE; DCVB documenta variantes valencianas con *o* y *u* |

Los cambios editoriales se localizan sobre los caracteres Unicode del étimo; la pérdida fija de `-m` del acusativo se añade fuera de las leyes seleccionables. La presencia de las 18 fichas en la matriz **no** garantiza que todas esas reglas sean evaluables o que la reconstrucción sea históricamente exhaustiva.

**Seis reservas tras el contraste**

- `senatum → senat` y `uirtutem → virtut`: el DCVB utiliza *pres del llatí*; no convertir estos préstamos cultos en evoluciones patrimoniales automáticas.
- `uitem → vit`: la acepción correspondiente a `vīte` ('sarmiento') se documenta como femenina **antigua**, mientras otras acepciones de *vit* responden a étimos distintos.
- `caput → cap`: el DCVB señala `capum` vulgar como origen inmediato, variante de `caput`; falta justificar la cadena a partir del étimo del banco.
- `spissum → espés`: comprobación DCVB y DNV no cerrada para la grafía valenciana propuesta.
- `falcem → falç`: vínculo etimológico recogido en el [Gran Diccionari de la Llengua Catalana](https://www.diccionari.cat/GDLC/falc-0), pero falta la ficha individual DCVB y el contraste DNV que exige la matriz.

La cola conserva para las 24 fichas `reviewOutcome`, referencias comprobadas cuando proceden y una explicación de cada reserva. Queda pendiente la certificación normativa, la valoración por ley y la decisión docente de habilitación. Se protege el banco valenciano de 522 frente al lote de 100 fichas **exclusivamente castellanas** publicado con anterioridad.

### Seis correspondencias documentadas de nuevo

| Forma latina | Resultado valenciano | DCVB | Análisis editorial no certificado |
|---|---|---|---|
| `cælum` | cel | [cel](https://dcvb.iec.cat/results.asp?word=cel) | MONOFTONGACIÓ + PALATALITZACIÓ |
| `ocŭlum` | ull | [ull](https://dcvb.iec.cat/results.asp?word=ull) | SÍNCOPE + PALATALITZACIÓ |
| `scholam` | escola | [escola](https://dcvb.iec.cat/results.asp?word=escola) | PRÒTESI + EVOLUCIÓ DE GRAFIES GREGUES |
| `fŏntem` | font | [font](https://dcvb.iec.cat/results.asp?word=font) | APÒCOPE |
| `salutem` | salut | [salut](https://dcvb.iec.cat/results.asp?word=salut) | APÒCOPE |
| `portum` | port (port marítimo) | [port](https://dcvb.iec.cat/results.asp?word=port) | APÒCOPE |

**Reserva histórica:** `octo → huit` y `dictum → dit` quedan apartadas hasta contrastar sus etapas históricas. `sigĭllum → segell` puede anotarse para estudio histórico interno, con aviso explícito de que el DCVB lo caracteriza como voz arcaica reintroducida en el uso culto; **no** autoriza una evolución patrimonial evaluable. La reserva se conserva como dato privado, mientras que las tres fichas aparecen **solo en castellano**.

**Segunda tanda:** `shared/academic/evolutio-valenciano/cola-revisio-24.json` registra el contraste de 24 candidatas: 18 correspondencias lexicalmente documentadas en el DCVB y 6 reservas explícitas. Ninguna queda autorizada para preguntas; el DNV y la evaluación completa de leyes permanecen pendientes.

Archivos activos: `conciliacion-curada.json`, `revisio-120-2026-11-17.json`, `matriz-522.json`, `normas.json`, `auditoria-pendents-146-2026-11-17.json`, `incidencies-15-2026-11-17.json` y las cuatro colas de revisión previas. Se conservan las revisiones históricas de 26, 32, 50, 66, 80 y 92 sin alteración. El generador sigue bloqueando la activación accidental de respuestas, la asignación de leyes ajenas al repertorio y la publicación de datos valencianos no revisados.

---

## Foto histórica del arranque (13/11/2026; sustituida por el estado de arriba)

Se ha preparado la **matriz de los 522 étimos** del banco de Evolutio integrado en ScholaClassica, con el mismo SHA de origen establecido en `config/sources.lock.json`. No se ha cambiado el banco castellano, ni el motor, ni el servicio offline. **No se ha activado la práctica en valenciano.**

| Estado del resultado valenciano | Entradas | Acredita |
|---|---:|---|
| `documentat` | **26** | Correspondencia y etimología de la acepción en el DCVB (documentación léxica inicial) |
| `proposta` | **215** | Hipótesis de equivalencia pendiente de contraste individual; **no** cuenta como verificación |
| `pendent` | **281** | Sin resultado propuesto por ahora |
| Análisis valencianos con propuesta editorial revisada | **22** | Se han localizado los cambios y posiciones; falta validación normativa individual y autorización docente |
| Discrepancias fonéticas individuales | **4** | Se reservan para decisión docente con justificación |
| Normas con validación completa para práctica | **0** | No están certificadas ni aprobadas para sorteo |
| Fichas valencianas autorizadas para práctica | **0** | No se publica contenido inacabado |

## Primera revisión filológica individual (13/11/2026)

Se han contrastado las etimologías de las **26 correspondencias documentadas**, consultando el artículo y la acepción adecuada del DCVB. Los tramos de norma se han revisado editorialmente **para 22 étimos**, sin copiar el análisis castellano. Quedan **4 discrepancias** documentadas: `noctem → nit`, `matrem → mare`, `fabam → fava` y `caballum → cavall`. En las dos últimas no debe equipararse la lenición de `-b-` a `-v-` con la sonorización de una oclusiva sorda.

El archivo `shared/academic/evolutio-valenciano/revisio-26.json` contiene las 22 segmentaciones revisadas, las explicaciones y los motivos de cada discrepancia. El generador valida que **cada intervalo coincida exactamente con los caracteres Unicode del étimo**, y registra automáticamente la pérdida fija de `-m` cuando procede. `mel → mel` carece de normas seleccionables: es apta conceptualmente para consulta, pero no para una pregunta que exija identificar cambios.

**Límites de esta revisión:** el DNV de la AVL no ha podido consultarse entrada por entrada por la vía automatizada utilizada. Se ha contrastado directamente la etimología en el DCVB, pero no se certifica la comprobación normativa individual del DNV. El estado `analisi_editorial_revisada` **no equivale a `normasVerificadas`**, ni a aceptación docente, ni habilita el ejercicio: los tres indicadores permanecen en cero cuando así corresponde.

La revisión de `clauem → clau` distingue la **clau femenina** procedente de `clāve` de la **clau masculina** procedente de `clavu`. En otras palabras, como `coll`, se conserva la acepción etimológica precisa. Las normas que describen cambios fonéticos sin cambio de letra (p. ej., `-ll-` latina geminada → `ll` palatal) llevan nota explícita.

Los recuentos se recalculan a partir de `matriz-522.json`; no deben darse por verificados todos los resultados solo por estar escritos. La opción `documentat` **no** significa aprobación docente ni comprobación completa de las leyes de evolución.

## Ficheros

- `shared/academic/evolutio-valenciano/normas.json`: **17 normas valencianas exactamente como las facilitó el docente**, más `FIX_M` no seleccionable. Las categorías castellanas `ASPIR`, `MIN_MBR` y `CUL` no se transfieren automáticamente.
- `shared/academic/evolutio-valenciano/conciliacion-curada.json`: 26 correspondencias con fuente y 215 propuestas de trabajo diferenciadas, con notas de revisión cuando corresponde.
- `shared/academic/evolutio-valenciano/matriz-522.json`: todas las fichas por **ID original**, forma latina, respuestas castellanas, procedencia y resultado valenciano documentado/propuesto/pendiente. Cada fila conserva campos separados para normas, explicación, dificultad, aprobación docente y disponibilidad en práctica; permanecen vacíos/bloqueados hasta revisarse.
- `scripts/reconcile-evolutio-valenciano.mjs`: generador determinista que comprueba el SHA del origen y rechaza duplicados, candidaturas ajenas al banco y documentación falsa.
- `tests/evolutio-valenciano-conciliacion.test.mjs`: asegura cobertura, reglas, integridad, reproducibilidad y ausencia del registro en la web publicada.

Para comprobar la conciliación sin modificar ficheros: `npm run evolutio:val:check`. Para reconstruir la matriz deliberadamente tras revisar `conciliacion-curada.json`: `npm run evolutio:val:build`. Ambos comandos requieren el repositorio `.sources/evolutio` en el **commit exacto** establecido en el bloqueo. La CI verifica de forma obligatoria que la matriz esté actualizada.

## Primeras correspondencias documentadas

El *Diccionari català-valencià-balear* (DCVB) proporciona, para estas acepciones, el lema valenciano/catalán y una etimología latina explícita. El *Diccionari normatiu valencià* (AVL) se utilizará para la **confirmación normativa de cada resultado** antes de pasarlo a la modalidad de práctica.

| Étimo | Castellano | Valenciano | Referencia |
|---|---|---|---|
| `focum` | fuego | **foc** | [DCVB: foc](https://dcvb.iec.cat/results.asp?word=foc) |
| `noctem` | noche | **nit** | [DCVB: nit](https://dcvb.iec.cat/results.asp?word=nit) |
| `clauem` | llave | **clau** (femenino) | [DCVB: clau](https://dcvb.iec.cat/results.asp?word=clau) |
| `lupum` | lobo | **llop** | [DCVB: llop](https://dcvb.iec.cat/results.asp?word=llop) |
| `filium` | hijo | **fill** | [DCVB: fill](https://dcvb.iec.cat/results.asp?word=fill) |
| `matrem` | madre | **mare** | [DCVB: mare](https://dcvb.iec.cat/results.asp?word=mare) |
| `uitam` | vida | **vida** | [DCVB: vida](https://dcvb.iec.cat/results.asp?word=vida) |
| `tĕrram` | tierra | **terra** | [DCVB: terra](https://dcvb.iec.cat/results.asp?word=terra) |
| `pŏrtam` | puerta | **porta** | [DCVB: porta](https://dcvb.iec.cat/results.asp?word=porta) |
| `fĕrrum` | hierro | **ferro** | [DCVB: ferro](https://dcvb.iec.cat/results.asp?word=ferro) |
| `pontem` | puente | **pont** | [DCVB: pont](https://dcvb.iec.cat/results.asp?word=pont) |
| `caballum` | caballo | **cavall** | [DCVB: cavall](https://dcvb.iec.cat/results.asp?word=cavall) |

También se han consignado los resultados documentados de `buccam → boca`, `chartam → carta`, `annum → any`, `farinam → farina`, `fabam → fava`, `catenam → cadena`, `gallinam → gallina`, `scalam → escala`, `cuppam → copa`, `caulem → col`, `collum → coll`, `flammam → flama`, `ollam → olla` y `mel → mel`. Cada referencia individual está guardada en el registro de curación.

La palabra `clau` presenta homonimia: la acepción **femenina** 'llave' corresponde a `clauem`, no el masculino 'clavo' procedente de `clavum`. Se conserva la distinción explícita. En `pluuiam → pluja`, el DCVB remite a una base vulgar `plŏia`; por ello se mantiene como **propuesta**, no como correspondencia histórica definitivamente verificada del étimo clásico escrito en el banco.

## Política de revisión de las normas

El inventario de **17** nombres valencianos está aprobado como **catálogo**, no como análisis de los 522 étimos. Está prohibido copiar automáticamente `changes`, `spans`, resultados parciales o explicaciones del castellano.

La revisión por ficha debe establecer: (1) resultado y acepción valencianos con comprobación normativa, (2) relación etimológica exacta y carácter patrimonial/culto, (3) todas las normas valencianas aplicables con fragmentos localizados en el étimo, (4) la caída fija de `-m` cuando proceda, (5) explicación didáctica, (6) revisión docente. Las fichas con discrepancias se apartan del sorteo; si no existe un resultado adecuado, se mantiene únicamente la modalidad castellana.

Para poder alternar de lengua **a mitad de una misma sesión**, el futuro motor exigirá pares completos verificables en las dos lenguas; guardará por lengua las respuestas, intentos y correcciones. Una coincidencia de grafía (p. ej. `uitam → vida` en las dos lenguas) **no implica** coincidencia automática de análisis ni aprobación.

## Próxima tanda de auditoría

Primero comprobar, con DNV/DCVB y fuentes históricas, la segmentación individual de las **26 correspondencias léxicas documentadas**; después contrastar las **215 propuestas** por lotes, dando prioridad a los étimos patrimoniales transparentes y a las normas menos representadas. Mantener las **281 restantes** sin resultado hasta reunir evidencia, en lugar de crear equivalencias por semejanza.

**Alcance de esta entrega:** registro, fuentes, propuestas, clasificación de evidencia y controles. Sin cambio de interfaz, sin datos de respuesta valencianos públicos y sin alteración de repositorios originales.
