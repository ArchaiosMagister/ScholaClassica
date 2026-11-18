# Evolutio valenciano: reconciliación y piloto docente de doce fichas (18/11/2026)

**Solo preparación académica. No modifica el generador, la matriz de 522, las 17 normas, el banco castellano ni el acceso del alumnado. No fusionar con `main` ni publicar.** Esta PR depende de la #119 y debe revisarse *después* de resolver las discrepancias señaladas.

## 1. Reconciliación de ramas antiguas

Fuentes congeladas: [PR #45](https://github.com/ArchaiosMagister/ScholaClassica/pull/45), [PR #46](https://github.com/ArchaiosMagister/ScholaClassica/pull/46) y [PR #119](https://github.com/ArchaiosMagister/ScholaClassica/pull/119).

| Estado | PR #46 | PR #119 |
|---|---:|---:|
| Correspondencias léxicas con documentación/contraste | 221 | 120 revisadas + 66 contrastadas sin fonética = **186** |
| Entradas de #46 que la #119 conserva solo como propuestas | — | **38** |
| Entradas de #46 que la #119 deja sin resultado valenciano | — | **3** |
| Conjuntos de normas antes asignados sin traslado a #119 | — | **26** |
| Fichas para práctica | **0** | **0** |

Las **41 discrepancias** (ID, étimo, resultado, estado y reglas de ambas ramas) están archivadas sin editar en [`reconciliacio-pr45-46-119-2026-11-18.json`](../shared/academic/evolutio-valenciano/reconciliacio-pr45-46-119-2026-11-18.json). La reducción de 221 a 186 **no implica 35 errores** ni obliga a promover automáticamente las 41 fichas: responde a alcances de revisión distintos y a reservas posteriores, que deben justificarse individualmente. No se descarta evidencia existente en la #46.

Tres casos se mantienen **sin solución valenciana activa** por las reservas explícitas de la #119: *octo → huit*, *dictum → dit*, *sigĭllum → segell*. Las restantes 38 conservan su propuesta y necesitarán cotejo lexicográfico, normativo o de transmisión antes de mejorar su estado.

**Decisiones docentes de la #45.** Las reglas editoriales de *matrem → mare*, *fabam → fava* y *caballum → cavall* se mantienen en la #119, sin transformar su aceptación escolar en «ficha aprobada para jugar». En *noctem → nit* **sí hay divergencia**: la #45 la calificaba de provisional e incluía `VOC, SIMPL, APOC, FIX_M`; la #119 la clasifica editorialmente como revisada y utiliza `VOC, SIMPL, FIX_M`. La exclusión de `APOC` y la nueva etiqueta requieren confirmación del criterio docente antes de habilitarla. No entra en este piloto.

**Conclusión de integración:** no fusionar las PR #45/#46 sobre #119 ni cerrarlas como «integradas» hasta resolver el destino de cada reserva; mantener todo en ramas separadas.

## 2. Primer piloto: doce formas de deducción sencilla

El fichero [`pilot-candidats-12-2026-11-18.json`](../shared/academic/evolutio-valenciano/pilot-candidats-12-2026-11-18.json) recoge identificadores del banco existente, leyes propuestas, fuentes y bloqueos. Criterios: resultado común, hasta dos leyes seleccionables, relación etimológica registrada en la #119, sin nombres propios ni reservas complejas, sin inventar fases intermedias.

| Étimo | Resultado | Normas seleccionables **propuestas** |
|---|---|---|
| `tĕrram` | terra | — (solo `FIX_M` fija) |
| `pŏrtam` | porta | — (solo `FIX_M` fija) |
| `farinam` | farina | — (solo `FIX_M` fija) |
| `focum` | foc | APÒCOPE |
| `pontem` | pont | APÒCOPE |
| `catenam` | cadena | SONORITZACIÓ |
| `uitam` | vida | SONORITZACIÓ |
| `matrem` | mare | SIMPLIFICACIÓ (criterio docente) |
| `buccam` | boca | OBERTURA + SIMPLIFICACIÓ |
| `cuppam` | copa | OBERTURA + SIMPLIFICACIÓ |
| `aucam` | oca | MONOFTONGACIÓ |
| `cælum` | cel | MONOFTONGACIÓ + PALATALITZACIÓ |

**Valor de las fuentes recuperadas:**
- DCVB, fichas individualizadas que ya registra la #119; ejemplos expresos de *[oca < auca](https://dcvb.iec.cat/results.asp?word=oca)* y *[cel < caelum](https://dcvb.iec.cat/results.asp?word=cel)*. El registro etimológico no demuestra automáticamente cada norma.
- Gran Enciclopèdia Catalana: [sonorización intervocálica](https://www.enciclopedia.cat/gran-enciclopedia-catalana/sonoritzacio), [`boca < bucca` y consonantes geminadas](https://www.enciclopedia.cat/gran-enciclopedia-catalana/catala), [`copa < cuppa`](https://www.enciclopedia.cat/gran-enciclopedia-catalana/catala), [vocalismo](https://www.enciclopedia.cat/gran-enciclopedia-catalana/o-7) y [grafía/fonética de *cel*](https://www.enciclopedia.cat/gran-enciclopedia-catalana/catala). Distinguir leyes generales y ejemplos puntuales de una cadena histórica completa.

Hay deliberadamente tres fichas en que solo opera `FIX_M`: son ejercicios pedagógicamente fáciles para estudiar la correspondencia, pero **no deben usarse para examinar la identificación de una norma seleccionable**. `FIX_M` nunca debe aparecer entre las respuestas elegibles.

## 3. Control de calidad y requisitos de aprobación

En las doce fichas: `normativeDnvIndividualChecked=false`, `completeHistoricalChainCertified=false`, `allSchoolLawsIndividuallyCertified=false`, `approvedByTeacher=false` y `playable=false`.

**Pendientes obligatorios antes de convertirlas en ejercicios:**
1. Consultar el artículo normativo individual vigente de **DNV/AVL** para cada forma, con acepción y grafía; el recuperador no ha permitido acceder de manera fiable a esos artículos, así que no se anotan verificaciones ficticias.
2. Cotejar la explicación de cada cambio escolar, su orden y su segmento Unicode; decidir explícitamente si la prueba histórica disponible basta para ese uso didáctico. Aportar evidencia adicional cuando sea necesario.
3. Pedir aprobación docente del grupo, especialmente de los casos con dos normas, y fijar dificultad.
4. Preparar **otra PR funcional aislada**, con salida valenciana optativa y regresiones de banco, IDs, progreso, castellano, filtros y PWA. No aprovechar directamente los estados editoriales de la #119 como autorización.

La prueba `tests/evolutio-valenciano-pilot12-reconciliacion.test.mjs` comprueba los IDs, correspondencias, normas, dos límites de dificultad, estados no jugables, los 41 desfases y la reserva de *noctem*. La CI completa debe pasar en esta PR dependiente, **sin job de publicación**.

## 4. Límites de alcance

Esta selección no pretende cubrir las 17 normas. Es un primer conjunto pequeño y transparente para contrastar la experiencia docente; más adelante se priorizará cobertura de normas sin introducir artificialmente ejemplos opacos. Toda la revisión se guarda fuera de `public/` y `dist/`.

## 5. Contraste independiente efectuado el 18/11/2026

Expediente reproducible: [`contrast-independent-pilot12-2026-11-18.json`](../shared/academic/evolutio-valenciano/contrast-independent-pilot12-2026-11-18.json). Las doce fichas han sido cotejadas con **entradas etimológicas individuales del DCVB** y el **lema coincidente de las búsquedas oficiales DIEC2/IEC**. Son doce verificaciones léxicas y doce coincidencias en el buscador del IEC, **no doce artículos DNV de la AVL**. La consulta oficial individualizada del DNV sigue en **0/12** por las restricciones del buscador web. Se han contrastado las normas con fuentes específicas de fonética histórica de GEC; **0 cadenas históricas completas certificadas, 0 aprobaciones docentes, 0 fichas aptas para práctica**.

Cada norma de la tabla conserva la clasificación probatoria: **E** (ejemplo explicado expresamente en fuente independiente); **G** (regularidad general, sin historial completo de esa palabra); **P** (pareja etimológica explícita, pero sin análisis específico de todos sus cambios). La etiqueta **E no equivale a certificar la cadena histórica entera ni la regla para evaluación**.

| Étimo → resultado | DCVB / DIEC2 | Normas seleccionables y alcance independiente | Decisión provisional |
|---|---|---|---|
| `tĕrram → terra` | etimología/forma contrastadas | Sin ley seleccionable; `FIX_M` fija | Ejemplo introductorio únicamente |
| `pŏrtam → porta` | etimología/forma contrastadas | Sin ley seleccionable; `FIX_M` fija | Ejemplo introductorio únicamente |
| `farinam → farina` | etimología/forma contrastadas | Sin ley seleccionable; `FIX_M` fija | Ejemplo introductorio únicamente |
| `focum → foc` | etimología/forma contrastadas | APÒCOPE (G); la fuente documenta la pérdida normal de vocales finales no -a | Reservada hasta corroborar DNV y evaluar contexto histórico |
| `pontem → pont` | etimología/forma contrastadas | APÒCOPE (G), con /t/ conservada en pronunciación valenciana del DCVB | Reservada |
| `catenam → cadena` | etimología/forma contrastadas | SONORITZACIÓ (G); el DCVB registra el étimo y pronunciación valenciana | Reservada |
| `uitam → vida` | etimología/forma contrastadas | SONORITZACIÓ (E): la GEC cita *vita → vida* | Mejor candidata para practicar una norma; pendiente de DNV y aprobación |
| `matrem → mare` | etimología/forma contrastadas | SIMPLIFICACIÓ (P): GEC cita *matre → mare*, sin aislar el cambio de -tr- | Reservada por prueba fonética particular incompleta |
| `buccam → boca` | etimología/forma contrastadas | OBERTURA (E) + SIMPLIFICACIÓ (E): la GEC ejemplifica ambos resultados | Candidata especialmente prometedora; revisar desplazamiento semántico ‘galta’ → ‘boca’ |
| `cuppam → copa` | etimología/forma contrastadas | OBERTURA (G) + SIMPLIFICACIÓ (E) | Reservada para acreditación individual de OBERTURA |
| `aucam → oca` | etimología/forma contrastadas | MONOFTONGACIÓ (G), fuente general sobre AU > O | Reservada |
| `cælum → cel` | etimología/forma contrastadas | MONOFTONGACIÓ (P) + PALATALITZACIÓ (G); GEC cita *coelu → cel* | Reservada: falta explicar documentalmente la pérdida de -u final sin introducir una tercera norma evaluable |

Fuentes históricas contrastadas: [Gran Enciclopèdia Catalana, «català», gramática histórica](https://www.enciclopedia.cat/gran-enciclopedia-catalana/catala) — contiene expresamente *vita > vida*, *matre > mare*, *bucca > boca* y *cuppa > copa*, además de pérdida general de vocales finales; [entrada «o», vocalismo histórico](https://www.enciclopedia.cat/gran-enciclopedia-catalana/o-7) — explica vocales de origen `ŭ` y resultados de `au`; [entrada «sonorització»](https://www.enciclopedia.cat/gran-enciclopedia-catalana/sonoritzacio) — describe la regularidad de sonorización intervocálica. El DCVB permite localizar cada registro con URL individual que figura en el JSON; para el DIEC2 se registra el resultado de búsqueda de cada lema. **No citar letras aisladas de GEC (`c-16`, `p-7`, etc.) como artículos sobre evolución histórica**: estas referencias antiguas se han rectificado.

### Criterio para aprobación docente

La aprobación que se puede solicitar con fundamento **ahora** es la de **continuar investigando este lote y sus doce pares etimológicos**, no la de habilitar automáticamente las preguntas. Con DNV pendiente, se propone el siguiente orden:

- Prioridad de verificación normativa y reglada: `uitam → vida`, `buccam → boca`, `cuppam → copa`.
- Segunda tanda: `focum → foc`, `pontem → pont`, `catenam → cadena`, `aucam → oca`, `matrem → mare`.
- Reserva especial: `cælum → cel` (dos mecanismos más el tratamiento de -u), y `noctem → nit` fuera del lote.
- Tres correspondencias con `FIX_M` únicamente para demostración, sin utilizarlas en preguntas que exijan seleccionar alguna de las 17 normas.

**Ninguna de estas prioridades cambia el corpus publicado, los IDs ni los registros de progreso**. Los ensayos automatizados comprobatorios son `tests/evolutio-valenciano-pilot12-reconciliacion.test.mjs` y `tests/evolutio-valenciano-pilot12-evidencia-independiente.test.mjs`.


## 6. Primer trío prioritario: constatación normativa directa en la *Gramàtica normativa valenciana* (AVL)

El **18/11/2026** se ha encontrado la versión de la obra oficial de la Acadèmia Valenciana de la Llengua, [*Gramàtica normativa valenciana*](https://www.upv.es/entidades/spnl/wp-content/uploads/2023/11/gramatica_normativa_valenciana.pdf), alojada por la UPV. En la **página impresa 9 (PDF 9, índice PDF 8)**, «Símbols fonètics», aparecen literalmente: `vida` como ejemplo de **[a]**, `boca` como ejemplo de **[o]** y `copa` como ejemplo de **[p]**. Las tres grafías están por tanto **atestiguadas en una obra normativa oficial de la AVL**, si bien no se trata de la lectura del artículo correspondiente del DNV. No se atribuirá al DNV evidencia que no se ha obtenido.

Documentación exacta e IDs: [`contrast-avl-gnv-vida-boca-copa-2026-11-18.json`](../shared/academic/evolutio-valenciano/contrast-avl-gnv-vida-boca-copa-2026-11-18.json). Nueva prueba automatizada: `tests/evolutio-valenciano-avl-gnv-trio-20261118.test.mjs`.

| Ficha | Prueba de la AVL | Prueba independiente de GEC y DCVB | Estado |
|---|---|---|---|
| `ge-EVF-0338`: `uitam → vida` | GNV p. 9, `vida` bajo [a] | GEC documenta de modo explícito `vita → vida` entre las sordas intervocálicas que se sonorizan: SONOR, `t` [2,3]. DCVB: `vīta`. | Ejemplo de una norma bien respaldada, sin DNV individual ni aprobación docente |
| `xl-354`: `buccam → boca` | GNV p. 9, `boca` bajo [o] (vocal **cerrada**) | GEC: `bǔcca → boca` al explicar ŭ > [o] (ABER `u`, [1,2]) y `bucca → boca` en simplificación de geminadas (`cc`, [2,4]). DCVB: `bŭcca`, semánticamente primero ‘galta’. | Ambas leyes escolares tienen ejemplo fonético directo; cadena completa y DNV pendientes |
| `xl-82`: `cuppam → copa` | GNV p. 9, `copa` bajo [p] (¡**no** confirma allí el timbre de la vocal!) | GEC: `cuppa → copa` expresamente para la simplificación de `pp` [2,4]. La ŭ > o [1,2] se apoya en la norma general de la evolución vocálica y el étimo individual del DCVB `cŭppa`; **no** hay en la fuente vocálica un ejemplo específico `cuppa → copa`. | SIMPL directa; ABER con evidencia general + etimología, pendiente de corroboración individual |

Referencias fonéticas exactas: [GEC, gramática histórica de «català», líneas conceptuales «Interiors simples» y «Geminades»](https://www.enciclopedia.cat/gran-enciclopedia-catalana/catala); [GEC, entrada «o», ŭ clásica > o cerrada, ejemplo de `bǔcca`](https://www.enciclopedia.cat/gran-enciclopedia-catalana/o-7). Etimologías: [DCVB `vida`](https://dcvb.iec.cat/results.asp?word=vida), [`boca`](https://dcvb.iec.cat/results.asp?word=boca), [`copa`](https://dcvb.iec.cat/results.asp?word=copa).

**Nota de nomenclatura docente:** la regla escolar OBERTURA en este proyecto abarca la evolución ŭ > o. En `bŭccam → boca`, la GNV especifica **[o] cerrada**, no [ɔ] abierta; el nombre de la ley **no permite deducir la apertura fonética moderna**. No se renombra automáticamente la norma del catálogo docente, pero debe aclararse en su futura explicación al alumnado.

**Nota de grafía:** la `u` inicial de `uitam` es la grafía consonántica latina equivalente a `v`; se mantiene la forma educativa original y no se marca VOCALITZACIÓ sobre esa `u`.

**Estado resultante:** 3/3 grafías en obra normativa AVL, 3/3 etimologías individuales DCVB, 5/5 mecanismos seleccionables contrastados (4 ejemplos explicados por la GEC y 1 patrón general más étimo), **0/3 artículos individuales DNV**, **0 cadenas fonéticas históricas completas certificadas**, **0 aprobaciones docentes**, **0 fichas jugables**. Los 522 registros de la matriz y el banco castellano siguen intactos.

**Siguiente decisión académica necesaria:** sería razonable someter `uitam → vida` y `buccam → boca` a un criterio docente de aceptación escolar de las normas *sin fingir una reconstrucción diacrónica de etapas no atestiguadas*; `cuppam → copa` necesitaría una fuente individual para la vocal antes de equiparar su grado de evidencia. En cualquier caso la exigencia fijada de consulta individual DNV sigue pendiente para promover a práctica.


## 7. Contraste de las nueve fichas restantes: las doce ya tienen testimonio en obra de la AVL

Nuevo expediente individual: [`contrast-avl-gnv-9-restants-2026-11-18.json`](../shared/academic/evolutio-valenciano/contrast-avl-gnv-9-restants-2026-11-18.json), con fuentes, páginas verificadas de la edición de 2006 de [*Gramàtica normativa valenciana*](https://www.upv.es/entidades/spnl/wp-content/uploads/2023/11/gramatica_normativa_valenciana.pdf), cada segmento Unicode de las leyes y las reservas. Comprobación: `tests/evolutio-valenciano-avl-gnv-restantes9-20261118.test.mjs`.

**Balance del lote de nueve:** 9/9 etimologías individualizadas en DCVB, 9/9 formas atestiguadas en la GNV (10 ejemplos de uso/pronunciación/ortografía; *porta* aparece dos veces), 7 aplicaciones de leyes escolares examinadas (1 con pareja y ley históricas expresas, 4 basadas en generalizaciones, 2 que aún precisan resolución específica), 0 consultas de artículos DNV, 0 cadenas completas certificadas, 0 aprobaciones y 0 ejercicios habilitados.

| Étimo → valenciano | Atestiguación exacta en la **AVL** | Contraste histórico de la ley propuesta | Tratamiento docente |
|---|---|---|---|
| `tĕrram → terra` | GNV **p. 57**: *terra* en minúscula fuera de astronomía | DCVB *terra < tĕrra*. No hay ley seleccionable aparte de `FIX_M`. | **Solo introducción**, no test de normas |
| `pŏrtam → porta` | GNV **pp. 9 y 23**: [ɔ] y regla `-ort/-orta` | DCVB *porta < pŏrta*. No atribuir una OBERTURA nueva solo por la vocal moderna [ɔ]. | **Solo introducción** |
| `farinam → farina` | GNV **p. 159**: usos con cuantificadores | DCVB *farina < farīna*. No introducir aspiración de *f* inicial. Solo `FIX_M`. | **Solo introducción** |
| `focum → foc` | GNV **p. 23**: *foc* con [ɔ] | `APOC` de la vocal postónica `u` después de la pérdida fija de -m. La GEC acredita la regla general, pero no la cadena individual. | Propuesta de **una ley**, pendiente |
| `pontem → pont` | GNV **p. 44**: `pont ↔ pontet` | `APOC` de `e`, según la regla de pérdida de vocal final no -a. El DCVB da pronunciación valenciana con -t conservada. | Propuesta de **una ley**, pendiente |
| `catenam → cadena` | GNV **p. 9**: *cadena* como ejemplo de [ð] | `SONOR`: etimología DCVB **CADENA 1** `catēna` y sonorización intervocálica general GEC. La fricativa [ð] actual **no prueba por sí sola** el proceso histórico. **CADENA 2** tiene otro origen (*carena*). | Propuesta de **una ley**, pendiente |
| `matrem → mare` | GNV **p. 9**: *mare* y [ɾ] | DCVB *matre > mare*; GEC explicita la pareja. **Nueva reserva:** Coromines interpreta el nombre de parentesco como continuación de **MATER nominativo** y no necesariamente de `MATREM` acusativo (artículo sobre leyes fonéticas catalanas, **pp. 202–204**). La etiqueta `SIMPL` es decisión escolar, **no certificación de base acusativa**. | **Reserva filológica**, sin cambio de ID |
| `aucam → oca` | GNV **p. 23**: *oca* con [ɔ] | **Mejora relevante:** en *Estudis Romànics* **39 (2017), p. 467**, se cita expresamente la monoptongación **`AUCA > oca`**, al reseñar la *Gramàtica històrica* de Batlle, Martí i Castell, Moran y Rabella. **Joan Coromines, DECat VI p. 26**, da testimonio de `auca` y `oca` medievales. Se trata del latín **vulgar auca**, no de una derivación simple de *anser*. | **MONOP** con pareja y mecanismo independientes documentados; apta para la **siguiente revisión docente**, no todavía jugable |
| `cælum → cel` | GNV **p. 9**: *cel* ejemplo de [s] | DCVB *caelum > cel*, GEC *coelu > cel*; GEC sobre el vocalismo de **e** explica la generalización clásica `ae > e`, y GEC sobre la gramática histórica explica c ante e > [s]. Ninguna fuente certifica aquí todas las etapas. La vocal final `u` desaparece y **no se ha etiquetado como APOC** por decisión editorial anterior. | **Reserva filológica** de la cadena y de la cobertura escolar |

### Fuentes independientes nuevas y control de variantes

- [*Estudis Romànics* 39 (2017), p. 467, Institut d’Estudis Catalans](https://publicacions.iec.cat/repository/pdf/00000243/00000036.pdf): descripción fonética explícita del patrón `au > [ɔ]` con la pareja *auca > oca*, tomada de una obra de gramática histórica; esto **sí mejora** la evidencia individual de MONOP para *oca*. No debe citarse como si cada estadio medieval estuviera documentado allí.
- [Joan Coromines, *Diccionari etimològic i complementari*, «OCA», vol. VI, p. 26](https://decat.iec.cat/documents/VI/26.pdf): base en latín vulgar, documentación medieval y variantes antiguas; los testimonios con AU y O no constituyen una cronología uniforme para todo el territorio.
- [Joan Coromines, «Algunes lleis fonètiques catalanes no observades fins ara», pp. 202–204, IEC](https://publicacions.iec.cat/repository/pdf/00000149/00000072.pdf): propone una diferencia evolutiva de los grupos originales `-TR-` y las secuencias `-T(E)R-` y, para nombres de parentesco como *mare*, destaca la posible procedencia del **nominativo MATER** en lugar de la base escolar acusativa **MATREM**. No se impone la tesis como única postura: el DCVB presenta `matre` como étimo.
- [Gran Enciclopèdia Catalana, «e», origen latino de los resultados vocálicos](https://www.enciclopedia.cat/gran-enciclopedia-catalana/e-6): ley **general** para la vocal procedente de `ae`; no constituye reconstrucción individual de *cælum*. [GEC, gramática histórica](https://www.enciclopedia.cat/gran-enciclopedia-catalana/catala): apócope de vocales postónicas, sonorización de sordas, `matre > mare` y cambio inicial de `c` ante `e`.

### Decisión de secuenciación después de los doce casos

- **Para proponer con mayor prioridad al docente:** `uitam → vida` (SONOR), `buccam → boca` (ABER/SIMPL), `aucam → oca` (MONOP), porque cada una dispone al menos de un ejemplo individual del mecanismo histórico en fuentes filológicas.
- **Lote posterior con regularidad general suficientemente orientada, pero no ejemplo histórico específico:** `cuppam → copa` (solo SIMPL está ejemplificada individualmente), `focum → foc`, `pontem → pont`, `catenam → cadena`.
- **Reservar hasta decisión filológica:** `matrem → mare` por divergencia de casos nominativo/acusativo; `cælum → cel` por tratamiento de `æ`, variante `coelu` y la `u` final; `noctem → nit` sigue fuera del piloto por su discrepancia #45/#119.
- **Solo ejemplos de correspondencia:** `tĕrram → terra`, `pŏrtam → porta`, `farinam → farina`: `FIX_M` no es norma evaluable.

**Balance global de las doce candidaturas:** 12/12 formas atestiguadas en una obra normativa AVL de 2006; 12/12 etimologías contrastadas en DCVB; **19** aplicaciones de leyes escolares propuestas (12 del primer expediente + 7 restantes). De ellas, 5 tienen mecanismos específicos explicados en fuentes históricas, 10 se fundan en regularidades generales y 4 requieren reserva de mecanismo/cadena. **DNV individual vigente: 0/12. Fichas aprobadas y jugables: 0/12.** Tampoco cambia el corpus castellano ni los 522 IDs valencianos.

La evidencia de GNV **no sustituye al DNV** como fuente de entrada lexicográfica actual, y el soporte de una ley **no equivale** a certificar todas las etapas de una evolución individual. Tras estas pruebas, el siguiente acto adecuado sería una aprobación docente **selectiva** del diseño escolar de las candidaturas prioritarias, antes de promover cualquier fichero a práctica. La PR #122 sigue siendo documental, dependiente de la #119 y sin publicación.
