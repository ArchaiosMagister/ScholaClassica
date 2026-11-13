# Práctica de morfología — ampliaciones curriculares contrastadas

## Objetivo

Crear ejercicios propios de ScholaClassica sin heredar el antiguo repaso morfológico de Vocabula ni incorporar formas no verificadas procedentes de diccionarios externos. **No se modifican** Appendix, Vocabula, Evolutio, Palabra del día ni GeneradorExamenes.

El banco se compila a partir de `assets/curriculum.json` y del capítulo enlazado `sustantivos.html`, ambos del **mismo commit** fijado de Appendix (`config/sources.lock.json`). No se generan paradigmas por analogía; el compilador extrae literalmente las formas y las desinencias de tablas identificadas por tema y título. Si desaparece una tabla o cambia su estructura, el build debe **fallar**.

## Cobertura comprobable

| Materia | Unidades habilitadas | Tablas importadas | No incluidos |
| --- | --- | --- | --- |
| Latín I | UD1–UD7 | `rosa`, `dominus`, `bellum`; presentes e imperfectos activos y `sum`; UD3 pasiva presente e imperfecta en cinco conjugaciones y sus desinencias; UD4 `dux`, `civis`, `flumen`, `mare` | Perfectos, adjetivos, conjugaciones o declinaciones posteriores |
| Griego I | UD1–UD7 | Terminaciones de segunda declinación masculina y neutra; presente de `εἰμί` y `λύω`; artículo; cinco modelos de desinencias de primera declinación (femenino alfa puro, eta y mixto; masculino alfa y eta) | Flexión completa de sustantivos no atestiguados, adjetivos y unidades posteriores |

Los sustantivos latinos se muestran con formas completas cuando el Appendix ofrece paradigmas completos. Cuando el Appendix solo ofrece **desinencias** griegas, se practican únicamente esas desinencias: no se reconstruyen sustantivos enteros.

El artículo griego aparece solo desde UD3. La selección de unidad es **acumulativa** y solo muestra los niveles que tienen fichas documentadas. No se ofrecen los niveles posteriores como si ya tuvieran una base validada.

## Evidencia de cada ficha

En el archivo generado `apps/morfologia/data/paradigmas.json` figuran:
- Commit SHA exacto del Appendix consultado.
- Unidad, tema y título de la tabla fuente.
- Tipo de paradigma y formas con análisis gramaticales.
- Marca técnica `paradigma-documentado`.

Esta marca significa que la **tabla curricular** contiene las formas. **No equivale a una verificación individual de cualquier forma generable** ni demuestra que todo el léxico de Vocabula esté revisado. La importación falla ante cambios estructurales de tablas para evitar regresiones silenciosas.

## Modalidades y criterios de corrección

1. **Elegir la forma correcta.** Se pregunta por caso y número, o por persona, número y tiempo, y se presentan distractores seleccionados exclusivamente entre formas distintas del mismo paradigma.
2. **Analizar una forma.** Se muestra una forma y deben reconocerse todas sus características morfológicas. Cuando una misma forma corresponde a diversos casos o números, se agrupan **todos** los análisis atestiguados, sin presentar uno de ellos como la única respuesta válida.

Se corrige en la propia página, se indica el resultado de la tanda y se enlaza a la unidad de Appendix correspondiente para consultar la explicación. No se almacenan notas ni respuestas en servidores y no hay solucionario docente independiente.

## PWA, límites y pruebas

El módulo tiene service worker y caché propios (`schola-morphology-`) con alcance `/apps/morfologia/`. No intercepta navegación hacia Appendix, Vocabula, Evolutio ni Etymologicon y solo borra sus propias versiones anteriores. Las preguntas y el banco se pueden abrir offline una vez que se han cargado los recursos correctamente.

Las pruebas incluyen recompilación desde el currículo fijado, comprobación de unidades, rechazo de niveles aún no disponibles, corrección de casos sincréticos, rutas reales de GitHub Pages, comprobación en Chromium de las dos modalidades y lectura del banco sin conexión.

**Fase siguiente recomendada:** ampliar Latín I a UD3 (pasiva y personales), Latín I a UD4 (tercera declinación y sistema de perfecto) y Griego I a UD3 (primera declinación con variantes y concordancia del artículo). Cada ampliación requerirá datos inequívocos y controles específicos de sincretismo, acentuación y orden del artículo, antes de habilitar sus ejercicios.


## Ampliación: criterio de evidencia y variantes

La **UD3 latina** incorpora diez paradigmas completos de presente e imperfecto pasivos para `amo`, `habeo`, `duco`, `audio` y `capio`, más las desinencias pasivas de la tabla, que explicitan `-ris / -re` en segunda singular. No se inventan formas compuestas con `-re` que no figuren completas en la tabla. `sum` no posee formas pasivas en este bloque.

La **UD4 latina** lee literalmente la tabla «Tercera declinación · cuatro paradigmas» del archivo `sustantivos.html` en el mismo checkout de Appendix. El compilador exige la remisión desde la UD4, las seis filas de casos y las cuatro parejas singular/plural. Comprueba explícitamente `ducum`, `civium`, `fluminum`, `marium`, `maria` y el ablativo `mari`. Las alternativas `cives / civis` del acusativo plural se convierten en dos formas **igualmente válidas**, nunca en un único texto con barra. El motor agrupa estas alternativas por análisis y excluye todas las respuestas válidas de los distractores.

La **UD3 griega** se desglosa en cinco modelos independientes de la primera declinación. El compilador exige la tabla «Primera declinación · tabla 98» y comprueba sus quince celdas de desinencias antes de asociar las variantes de singular descritas en la explicación de la unidad. Solo se practican **desinencias**, no paradigmas completos construidos por analogía; el femenino mixto conserva alfa en nominativo y acusativo, pero eta en genitivo y dativo. Los plurales se toman expresamente de la columna común de esa tabla.

Cada registro lleva unidad, capítulo, título de la tabla, SHA del Appendix y una nota editorial cuando corresponde. La ampliación mantiene la selección acumulativa: UD3 pasiva no aparece al elegir UD2, ni los modelos latinos de UD4 al elegir UD3. Las pruebas automáticas comparan el banco con una recompilación directa de las fuentes y comprueban los cuatro paradigmas de tercera declinación, las cinco variantes griegas, la sincretía y el funcionamiento sin conexión en la subruta GitHub Pages.


## Fase tercera: tiempos perfectivos activos, adjetivos y concordancia

**Fuente fija:** exactamente el mismo checkout de Appendix identificado en `config/sources.lock.json`; se leen `indicativo.html`, `adjetivos.html` y los temas UD4 y UD5 de `assets/curriculum.json`. La compilación falla si la unidad deja de remitir al capítulo correspondiente, desaparece una tabla, cambia su número de filas o se rompe su estructura. Cada nuevo registro documenta curso, unidad, paradigma, título de tabla y archivo de origen.

| Bloque | Unidad | Paradigmas y evidencia | Limitaciones |
| --- | --- | --- | --- |
| Perfecto activo latino | Latín I UD4 | `amo`, `habeo`, `duco`, `audio`, `capio` y `sum`; tablas de perfecto y pluscuamperfecto del indicativo | Los supinos se usan únicamente como parte del enunciado; sin perfectos pasivos |
| Adjetivos latinos de tercera | Latín I UD5 | `brevis`, `acer`, `audax`, `vetus` de `adjetivos.html` | No se inventan declinaciones para otros lemas |
| Adjetivos griegos | Griego I UD5 | Tablas del tipo 2–1–2, 2–2 y los irregulares `πολύς` y `μέγας` | No se importan modelos ajenos a la UD5 |
| Concordancia griega | Griego I UD5 | Artículo de UD3 + adjetivos de UD5, cotejo de caso, género y número | Sin sintagmas con sustantivos sin paradigma completo atestiguado |

La tabla de `βάρβαρος` usa el mismo paradigma para masculino y femenino, que se conserva como dos posibles análisis de la forma. En `πολύς` y `μέγας` hay celdas fusionadas que abarcan nominativo, vocativo y acusativo neutros: la lectura del HTML expande **solo esa celda ya documentada**, sin interpolar formas inexistentes. Se mantienen los acentos escritos en el Appendix, y se eliminan exclusivamente los guiones tipográficos que separan raíz y desinencia en la propia tabla.

La concordancia solicita la forma del adjetivo que concuerda con un artículo griego expresamente documentado, mostrando el análisis de caso, género y número de ese artículo. El motor verifica todas las formas que concuerdan con dichas características y excluye del sorteo de distractores **todas** las soluciones válidas, incluso cuando el paradigma presenta sincretismo. La actividad solo aparece para Griego I desde UD5; la selección de UD4 mantiene el banco acumulado de UD1–UD3, sin fingir nuevas lecciones de morfología.

El bloque completo conserva independencia offline mediante el mismo service worker `schola-morphology-`. Las pruebas comprueban 60 registros, procedencias, casos y géneros, acentos y paradigmas irregulares, concordancia, cuarentena de unidades no habilitadas, regresiones de fuentes y funcionamiento bajo la subruta real de GitHub Pages.


## Práctica activa, variantes y teclado griego

Se incorporan **respuesta escrita**, **declinación completa** y **repetición inteligente**, sin ampliar el banco cerrado de 60 paradigmas documentados. Cada pregunta escrita se construye a partir de una agrupación de formas de un mismo análisis: las variantes `cives / civis` se admiten ambas como válidas; no hay transformación automática de un lema ni búsqueda externa. En los ejercicios de desinencias se admite introducir la terminación sin guion tipográfico inicial. La escritura latina admite `æ` o `ae` en una misma forma.

El corrector normaliza Unicode a NFC y diferencia tres estados: **correcto**, **error ortográfico** y **error morfológico**. En griego se exige una grafía académica exacta para el acierto; si la forma solo difiere en espíritus, acentos o sigma final, el sistema indica un error de ortografía y muestra la solución, sin contabilizarla como acertada. La iota suscrita se conserva en la comparación, porque omitirla no debe considerarse un simple acento prescindible. No se ignoran diferencias en las vocales ni en los morfemas flexivos.

El teclado táctil permite introducir las 24 letras griegas (y sigma final), espacios, retroceso, espíritu suave y áspero, agudo, grave, circunflejo, diéresis e iota suscrita. Los signos se aplican a la vocal anterior al cursor y se recomponen mediante Unicode; el usuario también puede introducir directamente las formas con su teclado habitual. No se solicita instalar ni cambiar un teclado del sistema.

En **completar una declinación**, cada paradigma documentado proporciona las casillas de caso y número existentes. Para adjetivos y artículo se selecciona un género concreto. No se añade el vocativo al artículo griego ni se infieren formas de sustantivos o sintagmas no documentados. Al corregir se presentan las formas de las casillas incorrectas y se registran sus errores para el repaso; las variantes documentadas son aceptadas en cualquiera de sus grafías. Una tabla se considera completamente acertada si todas sus casillas son correctas.

## Repetición inteligente sin servidor

El estado de práctica se almacena únicamente en `localStorage`, bajo la clave versionada `schola-morphology-review-v1`. Guarda claves técnicas de los ejercicios y contadores de intentos, aciertos y errores, junto con un nivel de consolidación y la próxima fecha de repaso. No contiene respuestas literales, nombres de alumnos, sesiones, datos docentes ni acceso a la base de datos de Vocabula o Palabra del día.

Los modos son: **práctica libre**, **repetición inteligente** (primero los ejercicios vencidos, después nuevos), **volver a los errores**, **repasos pendientes** y **formas todavía no practicadas**. Un fallo deja la ficha disponible para repaso inmediato; los aciertos sucesivos aumentan el intervalo (1, 3, 7, 14, 30 y 90 días). Las entradas se validan y limitan a 2000 claves; cuando no queda material para el filtro seleccionado se indica expresamente, sin inventar nuevos ejercicios.

El progreso es local al navegador y puede perderse si se eliminan sus datos. Se puede borrar dentro del módulo con confirmación explícita. Todas estas funciones son opcionales y no alteran la puntuación ni la selección de los ejercicios de respuesta múltiple preexistentes.

## Comprobaciones y exclusiones

Las pruebas verifican la aceptación de variantes, la distinción ortografía/morfología, la preservación de iota suscrita, la conjugación/declinación de tablas completas, el estado local y su borrado, el teclado griego en Chromium móvil y el uso sin conexión en la ruta `/ScholaClassica/apps/morfologia/`. El service worker continúa restringido al módulo y precarga `written.mjs`, `review.mjs` y `greek-keyboard.mjs`.

La **declinación de sintagmas completos** con sustantivos y adjetivos se deja pendiente de una fase específica de concordancia léxica: no se deben combinar paradigmas sin acreditar previamente el género y las formas concretas de cada sustantivo. Las ampliaciones de UD6–UD7 de Latín I y Griego I seguirán requiriendo un control filológico independiente antes de habilitar sus contenidos.


## Extensión académica UD6–UD7 y práctica de sintagmas

El compilador `scripts/morphology-ud6-ud7.mjs` añade **24 fichas completas** transcritas de tablas de los temas originales de `assets/curriculum.json`, sin intervenir en el repositorio Appendix ni consultar un banco externo: cuatro pronombres latinos de UD6 (`hic`, `iste`, `ille`, `qui`), los paradigmas nominales `exercitus`, `cornū` y `res` de UD7, once paradigmas de futuro latino (cinco conjugaciones en activa y pasiva más `sum`), un presente medio-pasivo griego en UD6 (`λύω`) y cinco grupos pronominales griegos de UD7 (demostrativos, anafórico y personales). El total pasa a **84 paradigmas** y las unidades habilitadas son UD1–UD7 de ambas materias.

El compilador impone la presencia de las tablas y sus filas de casos/personas; conserva los acentos griegos y las formas alternativas. Para la segunda singular de `λύω` medio-pasivo solo admite `λύει` y `λύῃ`, exactamente como en la tabla curricular. Los pronombres latinos no adquieren vocativo; los griegos se comprueban con nominativo, acusativo, genitivo y dativo, sin vocativo. La expresión `res, rei` se mantiene como femenina. Las marcas de cantidad vocálica latinas pueden omitirse al contestar, ya que no se exige un teclado con macrones.

El módulo `sintagmas.mjs` añade dos actividades **«Escribir sintagma completo»** y **«Declinar sintagma completo»**, ambas desde UD5:
- **Latín:** el adjetivo precede al sustantivo. Solamente se admiten ocho sustantivos con paradigma completo y género contrastado (`rosa`, `dominus`, `bellum`, `flumen`, `mare`, `exercitus`, `cornū`, `res`); los tres últimos se desbloquean en UD7. Los adjetivos provienen de los paradigmas completos de tercera declinación de UD5. `dux` y `civis` quedan fuera de las combinaciones automáticas al no fijarse su género inequívocamente en las tablas importadas.
- **Griego:** se ofrece artículo más adjetivo **sustantivado**, con los casos y los tres géneros realmente documentados para ambos paradigmas. No se presenta como artículo + sustantivo + adjetivo, ya que Appendix todavía no proporciona en este banco las flexiones completas y verificadas de sustantivos griegos individuales. El artículo carece de vocativo.

Cada forma del sintagma nace de **dos fichas documentadas** y tiene referencias de fuente de ambas unidades; jamás se adjuntan desinencias a un lema nuevo. La corrección, el teclado griego, el repaso espaciado y las tablas completas siguen funcionando sin conexión. Las pruebas verifican casos, género, número, exclusiones, variantes aceptadas y aislamiento de cachés en la ruta real de GitHub Pages.

La siguiente fase académica será la incorporación individual de **sustantivos griegos con paradigma completo y género contrastado**, tras la revisión del banco docente, para pasar del adjetivo sustantivado a los sintagmas de artículo + sustantivo + adjetivo. No se habilitarán esos ejercicios por mera combinación de desinencias.


## Lote de sustantivos griegos con paradigma completo y género

Se incorpora un compilador independiente en `scripts/greek-noun-conciliation.mjs` que lee el vocabulario y el corpus de paradigmas de la revisión **fijada por SHA** de Vocabula, sin modificar sus datos. Selecciona exclusivamente ocho candidatos con unidad de examen acreditada y estructura nominal inequívoca: `ἵππος`, `βίος`, `δίκη`, `ἀρετή` (bloque UD1–4, habilitados conservadoramente en UD4) y `λόγος`, `δῶρον`, `νίκη`, `εἰρήνη` (bloque UD6–7, habilitados en UD7).

Por cada lema exige: identidad entre lema del banco y nominativo singular de UniMorph; genitivo singular congruente con la segunda o primera declinación; artículo nominativo singular explícito que acredite un género concreto; **exactamente diez casillas** (nominativo, vocativo, acusativo, genitivo, dativo × singular y plural), sin duplicidades o variantes sin resolver; y una tabla de la declinación correspondiente en el Appendix fijado. Para los neutros se verifica además la igualdad nominativo/acusativo. Si falta uno de esos elementos, la compilación falla en lugar de generar una forma nueva.

Los signos de cantidad vocálica breve y larga de UniMorph se omiten en las formas de ejercicio, preservando todos los **acentos, espíritus e iotas suscritas**. Se permite que el alumno escriba la misma forma con o sin marcas de cantidad. La fuente nominal, el bloque de vocabulario y su SHA se almacenan en `evidence`, con la indicación **«conciliación interfuentes; pendiente de revisión docente individual»**. La evidencia de Appendix acredita el tipo de declinación, no que todas las formas individuales de UniMorph aparezcan en el capítulo. Se conserva la licencia de los datos derivados **CC BY-SA 3.0** con su atribución explícita. No se incorporan `ἄνθρωπος` (género de uso contextual en los ejemplos), `χώρα` (sin unidad acreditada), ni otros lemas por semejanza formal.

### Concordancia nominal griega completa

El módulo `greek-noun-phrases.mjs` utiliza **tres paradigmas distintos y documentados**: el artículo de Appendix UD3, uno de los ocho sustantivos conciliados y uno de los adjetivos cuyo paradigma completo está en Appendix UD5. Se admiten el modelo 2–1–2 `ἀγαθός`, el modelo 2–2 `βάρβαρος` y el irregular `μέγας`. Se excluye provisionalmente `πολύς` de los sintagmas nominales automáticos por las restricciones semánticas de número y cantidad con nombres contables; permanece disponible en todos los ejercicios existentes.

Se comprueba la igualdad de **caso, género y número** y se permiten las dos órdenes atributivas, con sus formas independientes:
- Primera posición: artículo + adjetivo + sustantivo, como `ὁ ἀγαθὸς ἵππος`.
- Segunda posición: artículo + sustantivo + artículo + adjetivo, como `ὁ ἵππος ὁ ἀγαθός`.

La palabra intermedia oxítona cambia contextual y ortográficamente agudo por grave; no se alteran circunflejos ni acentos de sílabas anteriores. No se confunde la construcción predicativa `ὁ ἵππος ἀγαθός` con una atributiva. Se ofrecen dos nuevas modalidades, respuesta escrita o tabla completa, **desde UD5** para los cuatro nombres de UD4 y con cuatro nombres más al alcanzar UD7. Cada ficha conserva las tres fuentes y las enlaza por separado en la interfaz.

Las ocho entradas constituyen un **primer lote de conciliación interfuentes**, no una validación filológica individual definitiva. Para la fase siguiente se propone revisar con decisiones docentes explícitas los lemas de género variable, los acentos de paradigmas complejos y las variantes de las declinaciones posteriores, manteniéndolos fuera del sorteo hasta su aprobación. El banco anterior de 84 fichas permanece inalterado y el nuevo total es **92**.

## Ampliación por lotes reproducible del léxico nominal griego (propuesta aislada)

El compilador `scripts/greek-noun-bulk.mjs` deja atrás el límite manual de ocho
nombres. Trabaja sobre **los ocho ficheros de UniMorph y el vocabulario de examen
de Griego I del mismo SHA de Vocabula**, sin acceso a red ni modificación de
repositorios originales. Mantiene intactas las primeras ocho fichas.

Solo incorpora nuevas entradas si coinciden el lema, el enunciado y genitivo
del vocabulario, una unidad documentada hasta UD7, el género único del artículo
nominativo, las diez casillas NOM/VOC/ACC/GEN/DAT × SG/PL y el modelo de
primera o segunda declinación en Appendix. La tercera declinación queda
reservada para UD8; tampoco se importan nombres sin unidad, con artículo
ambiguo, variantes no discriminadas o casillas incompletas.

El archivo `build/morfologia/auditoria-sustantivos-griegos.json` separa
**incorporados** y **pendientes de revisión**, con razón individual para los
descartados. La etiqueta «paradigma-documentado» constata la disponibilidad
de las diez casillas en la fuente morfológica, **no** una verificación filológica
individual; `review` lo declara de forma visible. Se conserva CC BY-SA 3.0,
la traza de la ficha de Vocabula y el SHA de procedencia. El alumnado no ve
los descartados. El corpus es estático, corregible y utilizable sin conexión.

Este cambio se prepara en una rama de integración sin fusionar ni publicar.
Eulexis, Perseus/Morpheus y Logeion son futuras fuentes de contraste; **no se
les atribuye una consulta automatizada que este lote no ha realizado**.


## Inventario integral de sustantivos de los vocabularios docentes — 13/11/2026

**Importación cerrada por evidencia, no por una cantidad prefijada.** El
compilador recorre las fichas `general` y `examen` de los tres cursos de
Vocabula (`lat1`, `lat4` y `gr1`) en el SHA fijado; no borra
ninguna ficha original. El inventario conserva para cada candidato todos los
enunciados, significados, curso, unidades y sus identificadores de origen.

Los sustantivos con paradigma **completo y contrastable** se incorporan a
`apps/morfologia/data/paradigmas.json`, con estatus individual de conciliación
pendiente de revisión docente. Las cifras exactas proceden de cada
compilación y del artefacto de auditoría, no de una lista manual fija.
La disponibilidad de un paradigma en UniMorph no implica que un docente
haya revisado individualmente cada flexión.

La selección opera sobre:
- **Latín:** `scripts/latin-noun-bulk.mjs`; 32 fragmentos UniMorph lat,
  enunciado docente, genitivo singular, y doce casillas de seis casos × dos
  números. Se conservan variantes atestiguadas; si un mismo lema contiene
  genitivos de declinaciones divergentes, se aparta para evitar unir
  homónimos. Los géneros inferidos por patrones se identifican como tales y
  **no se presentan como contrastes léxicos independientes**.
- **Griego:** `scripts/greek-noun-bulk.mjs`; ocho fragmentos UniMorph grc,
  diez casillas de cinco casos × dos números, género explícito por artículo
  singular y concordancia con la primera/segunda declinación curricular.
  Se utiliza el nominativo canónico de UniMorph en el paradigma cuando el
  acento del enunciado docente antiguo no coincide.
- **Contraste independiente sin calificación:** se consulta el SHA fijo de
  GeneradorExamenes, que registra propuestas de Wiktionary (CC BY-SA 4.0) y
  decisiones editoriales docentes. Estos materiales se cotejan y documentan
  **sin convertir ninguna propuesta no verificada en una respuesta correcta**.
  Eulexis, Perseus/Morpheus y Logeion son referencias para un cotejo
  lexicográfico adicional, **no fuentes consultadas individualmente por este
  compilador**; su presencia en una lista de fuentes no acredita una forma.

Las entradas sin serie completa, con género contextual o irregularidad no
resuelta, con divergencia de enunciado o cuyo contenido se enseña más tarde
**no se sortean**. La cobertura activa se ha ampliado hasta **UD10** en Griego I y Latín I;
en el primer caso, los temas consonánticos de tercera declinación se
desbloquean en UD8 y, en el segundo, solo se usan modelos de declinación ya
explicados. Las fichas de Latín de 4.º con doce casillas completas se preparan
en una **reserva separada y no calificable**, porque sus unidades no se pueden
trasplantar a Latín I. En ambos idiomas, los lemas sin unidad acreditada se
conservan con sus paradigmas completos en esa misma reserva, cuando existe
evidencia suficiente. Se excluyen las palabras de unidades no cubiertas.
Un sustantivo citado antes de estudiar su tipo flexivo se habilita únicamente
cuando ese modelo ya se haya explicado.

Los informes íntegros **no se publican en la webapp del alumnado**; se archivan
como artefacto de CI:

- `build/morfologia/catalogo-nominal-total.json`: inventario de candidatos,
  identificadores y decisión por palabra.
- `build/morfologia/auditoria-sustantivos-griegos.json`: incorporados y
  descartados, con razones.
- `build/morfologia/auditoria-sustantivos-latinos.json`: ídem para latín,
  con separación explícita de Latín de 4.º.
- `build/morfologia/contraste-nominal-secundario.json`: correspondencias
  bibliográficas y decisiones editoriales (no usadas para calificar).

La CI obtiene únicamente copias **de lectura** de Appendix, Vocabula y
GeneradorExamenes fijadas por SHA, verifica sus dependencias, el banco, la
licencia de ambos corpus UniMorph y las PWAs sin conexión. No se modifican
fuentes originales, la base de datos docente, ni el servicio de autenticación.
La rama se mantiene sin fusionar/publicar hasta decisión explícita posterior.

**Siguiente ampliación nominal pendiente:** corroborar casillas dudosas con
fuentes filológicas complementarias (Perseus/Morpheus, Eulexis, Logeion,
Collatinus para latín, según licencias y disponibilidad) y habilitar por
unidades sus modelos de tercera declinación griega y el itinerario de
Latín de 4.º, sin anticipar adjetivos, pronombres o verbos.


## Continuación: cierre de las excepciones recuperables con fuente (13/11/2026)

Esta revisión supera el límite anterior de UD7 y registra **tres estados**
distintos por lema: incorporado a la PWA por unidad acreditada; paradigma
completo de fuente en reserva no calificable porque falta adscripción
curricular; y ficha con casillas realmente ausentes o con contradicciones.

La tercera declinación griega se limita a **temas consonánticos** testimoniados
caso por caso en el corpus y explicados en el Appendix UD8. No se extrapolan
las formas de los temas vocálicos o silbantes. Los genitivos abreviados y
escritos completos se comparan con la fuente real; la normalización de sigma
final no cambia la ortografía de la solución. Para el género, cuando el
testimonio es ambiguo, **solo una acepción inequívoca consignada en la ficha
docente** autoriza escoger ese género. Se conserva la clase de evidencia
(`genderEvidence`). Los nombres de género expresamente variable sin
decisión docente permanecen en revisión.

La secuencia final `-σι(ν)` de un dativo plural atestiguado en UniMorph se
desdobla en dos **variantes explícitas**, con ν eufónica y sin ella. Se
aceptan ambas en corrección escrita y en las dos posiciones atributivas de
los sintagmas; no se supone dicha alternancia en ninguna otra forma.

En Latín de 4.º se documentan los paradigmas nominales completos de
UniMorph en un archivo de reserva, con su enunciado Vocabula y un
`unit:null` que bloquea su uso en el motor del alumnado. En Griego I se
hace lo mismo con los nombres completos de `Sin unidad acreditada`.
El archivo `build/morfologia/paradigmas-preparados-sin-unidad.json` queda
fuera de `dist`; no existe ruta pública para consultar esas formas. Se
incluye como quinto informe en los artefactos de GitHub Actions.

Los casos restantes se registran con las **casillas exactas que faltan**,
y no se clasifican a todos como sustantivos de flexión desconocida sin
comprobar la categoría. Una propuesta proveniente de Eulexis,
Perseus/Morpheus, Logeion, Wiktionary o Collatinus solo se incorporará como
respuesta automática cuando haya evidencia concreta de su flexión y se
cumplan las condiciones de licencia; el cotejo secundario disponible
hasta ahora no basta por sí solo para aprobar sus propuestas. El motor no
genera formas faltantes mediante una declinación analógica.


## Triaje filológico y fuentes nominales completas (13/11/2026)

El informe `build/morfologia/candidaturas-triaje-filologico.json`
reclasifica automáticamente las candidaturas del inventario como
adjetivos, verbos, pronombres/numerales, entradas de cursos posteriores,
casos sin fuente completa y excepciones o ambigüedades propiamente nominales.
La reclasificación es una **propuesta de auditoría** y no añade soluciones
a la calificación. La propuesta académica de seis decisiones docentes
incluye alternativas y bibliografía con criterio por defecto; ninguna se
aplica sin respuesta del profesor.

La segunda pasada de auditoría consulta los **repositorios originales
completos** `unimorph/grc` y `unimorph/lat`, fijados respectivamente
a `7f4a58df733726c75c1355dd3a038e950d5e308f` y
`050924c9f013e6aba4d7c87be243a1d79b6c5b10`. Sus licencias se
identifican como CC BY-SA 3.0; el código fuente de esos repositorios no
se incorpora al PWA. Solo se analizan las formas nominales de lemas
presentes en el vocabulario docente, con rasgos de caso y número
inequívocos. Cualquier forma suplente incorpora el SHA de su corpus
original a la evidencia de la ficha. El informe
`build/morfologia/lote-unimorph-completo.json` distingue rigurosamente
**filas consultadas** de **paradigmas nuevos habilitados**: el corpus más
grande puede resultar redundante para los lemas docentes ya cotejados,
por lo que no se cuentan coincidencias como incorporaciones.

Para `ἀνήρ`, `γυνή`, `πατήρ` y `μήτηρ`, cuyas tablas del
subconjunto automático son incompletas o no existen, el módulo
`scripts/irregular-greek-nouns.mjs` incorpora **excepciones verificadas
individualmente** con paradigmas gramaticales y lexicográficos publicados.
La unidad de entrada es UD8 y las variantes `-σι(ν)` se separan en dos
respuestas documentadas; no se generan formas por aplicación automática
a otros lemas. Las referencias y la ficha del vocabulario docente
quedan en la evidencia individual y en el informe
`build/morfologia/irregulares-griegos-cotejados.json`.

Las divergencias sin testimonios completos (p. ej. homónimos como
`liber` o variedades de `domus`), el currículo de Latín de 4.º y
los lemas aún sin unidad acreditada permanecen aislados de las
preguntas. El proceso no toca ni publica los repositorios originales y
la PR de integración se mantiene en borrador.
