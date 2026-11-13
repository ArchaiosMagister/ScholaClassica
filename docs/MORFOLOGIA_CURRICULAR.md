# Práctica de morfología — ampliaciones curriculares contrastadas

## Objetivo

Crear ejercicios propios de ScholaClassica sin heredar el antiguo repaso morfológico de Vocabula ni incorporar formas no verificadas procedentes de diccionarios externos. **No se modifican** Appendix, Vocabula, Evolutio, Palabra del día ni GeneradorExamenes.

El banco se compila a partir de `assets/curriculum.json` y del capítulo enlazado `sustantivos.html`, ambos del **mismo commit** fijado de Appendix (`config/sources.lock.json`). No se generan paradigmas por analogía; el compilador extrae literalmente las formas y las desinencias de tablas identificadas por tema y título. Si desaparece una tabla o cambia su estructura, el build debe **fallar**.

## Cobertura comprobable

| Materia | Unidades habilitadas | Tablas importadas | No incluidos |
| --- | --- | --- | --- |
| Latín I | UD1–UD5 | `rosa`, `dominus`, `bellum`; presentes e imperfectos activos y `sum`; UD3 pasiva presente e imperfecta en cinco conjugaciones y sus desinencias; UD4 `dux`, `civis`, `flumen`, `mare` | Perfectos, adjetivos, conjugaciones o declinaciones posteriores |
| Griego I | UD1–UD5 | Terminaciones de segunda declinación masculina y neutra; presente de `εἰμί` y `λύω`; artículo; cinco modelos de desinencias de primera declinación (femenino alfa puro, eta y mixto; masculino alfa y eta) | Flexión completa de sustantivos no atestiguados, adjetivos y unidades posteriores |

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
