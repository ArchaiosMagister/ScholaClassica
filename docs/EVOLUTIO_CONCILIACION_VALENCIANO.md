# Evolutio valenciano — conciliación académica (actualización 17/11/2026) · sexta tanda e inventario completo

## Segundo contraste histórico: 11 correspondencias y la trampa de las falsas síncopas (17/11/2026)

Se han incorporado **11 contrastes filológicos adicionales**, sin repetir los 9 del bloque anterior, en `contrast-fonetica-historica-uoc-gec11-2026-11-17.json`. Fuentes: *Del llatí al català* de **Esperança Borrell i Vidal y Mònica Miró i Vinaixa (FUOC, 2009)**, consultado en [una copia textual alojada por terceros](https://www.scribd.com/document/800091730/El-Llati-en-El-Mon-Medieval-i-Modern-Del-Llati-Al-Catala) y contrastado en su atribución con la [guía docente de la UOC](https://cv.uoc.edu/tren/trenacc/web/GAT_EXP.PLANDOCENTE?any_academico=20241&cache=S&cod_asignatura=04.542&idioma=CAT&pagina=PD_PREV_PORTAL); la [Gran Enciclopèdia Catalana](https://www.enciclopedia.cat/gran-enciclopedia-catalana/catala) y [RodaMots, que reproduce una explicación de Gómez Llauger y Serra Casals (2014)](https://rodamots.cat/escreix/in-articulo-mortis/). **La copia UOC consultada no está alojada en el servidor original y no se considera prueba documental primaria de testimonios medievales.**

| Correspondencia | Aportación concreta de la fuente | Reserva |
|---|---|---|
| `uiridem → verd` | FUOC p. 17: síncope esquemática `uiride(m) > uir'de > verd` | La notación académica no equivale a una forma medieval datada |
| `sŏlĭdum → sou` | FUOC p. 17: `solidu(m) > sol'du > sou` | Faltan fases posteriores; se conserva sin ley candidata en la cola |
| `dŏmĭnam → dona` | FUOC p. 17: `domina(m) > dom'na > dona` | La simplificación del grupo nasal sigue pendiente |
| `pŏpŭlum → poble` | FUOC p. 17: `populu(m) > pop'lu > poble` | Evidencia directa de síncope; sonorización no certificada individualmente |
| `capere → cabre` | FUOC p. 25: `capere > caber / cabre`, entre las oclusivas intervocálicas | Sonorización de `p` respaldada por el contexto; otras fases pendientes |
| `cŏrpus → cos` | FUOC p. 30: `cos < corpus` en el tratamiento especial de `-s` final | No explica la reducción consonántica `-rp-`; sigue sin ley |
| `magistrum → mestre` | FUOC p. 26: `magister > maester > mestre` | **El ejemplo está en nominativo, no en el acusativo del banco** |
| `draconem → dragó` | GEC: `dracone > dragó` | El ejemplo no explica directamente cada fase de `c > g` |
| `seniorem → senyor` | GEC: `seniore(m) > senyor`, ejemplo de derivación acusativa | El tratamiento de `-ni-` sigue sin cadena individual |
| `pericŭlum → perill` | RodaMots: `periculum > perill` y evolución `-cul- > -ll-` | No equiparar automáticamente este resultado con síncope segura |
| `ocŭlos → ulls` | GEC: `oculu > ull` **solo en singular** | No trasladar sin más las etapas al plural acusativo `ocŭlos` |

### Reserva especial sobre falsas síncopas

El material de FUOC, al tratar las **falsas síncopas**, recuerda que algunos diminutivos terminados en `-clum` admitieron una vocal de apoyo y se escribieron también `-culum`: su desaparición posterior aparente **no puede considerarse siempre una pérdida de una vocal de la base etimológica**. Se han marcado para estudio morfológico-histórico individual `specŭlum`, `ouicŭlam`, `articulum`, `pericŭlum` y `ocŭlos`. Esto **no invalida automáticamente las reglas escolares aprobadas en otros ejemplos ni reetiqueta ninguna de las cinco fichas**. Las 72 hipótesis siguen exactamente como estaban.

**Diferencia entre evidencias:** ahora **20 de las 66** entradas tienen al menos un testimonio normativo histórico o fonético adicional específico: 9 del bloque anterior y 11 nuevas. **No hay 20 cadenas completas demostradas**, sino 20 expedientes parciales enlazados. Todos los indicadores de certificación y práctica siguen en cero.

### Incidencia técnica del DNV

La [interfaz oficial de búsqueda del DNV](https://www.avl.gva.es/lexicval/) se ha podido leer como página base, pero en este entorno muestra **«Sessió caducada»** y una búsqueda inicial vacía con **«No hi ha resultats»**; esto **no permite concluir que un lema esté ausente**. Los otros accesos oficiales ensayados no permitieron recuperar ningún artículo individual. El informe `acces-dnv-electronic-2026-11-17.json` documenta el límite, sin atribuirle al diccionario errores lingüísticos ni inventar resultados. `DNV verificadas individualmente = 0`; continúan pendientes las 66 consultas y los contrastes posteriores de forma, significado y distribución valenciana.

Las pruebas `tests/evolutio-valenciano-fonetica-uoc-gec11.test.mjs` y la regresión de las 66 fichas impiden activar resultados o perder las reservas, sin editar la fuente independiente de Evolutio, las fichas originales, sus IDs ni la versión castellana.

## Primer contraste normativo oficial y fonética histórica publicada (17/11/2026)

El buscador electrónico del **Diccionari normatiu valencià (DNV)**, que sigue siendo la referencia normativa vigente de la AVL, no ha resultado accesible directamente para verificar lemas individuales. Por ello, el expediente sigue indicando **cero comprobaciones individualizadas del DNV**. Se ha localizado, en cambio, el [acuerdo normativo de la AVL de 20 de mayo de 2002](https://www.avl.gva.es/wp-content/uploads/2022/04/Acord-normatiu-de-20-de-maig-del-2002.pdf), que proporciona evidencia normativa **histórica y oficial** para cuatro fichas relacionadas:

| Ficha en el banco | Evidencia real del acuerdo AVL (2002) | Alcance |
|---|---|---|
| `continere → contindre` | apartado II.2.8: `contindre` expresamente reconocido entre los compuestos de `tindre` | **Lema exacto**; no prueba una ley fonética directa |
| `specŭlum → espill` | apartado II.3.1: `espill` entre las palabras valencianas oficialmente reconocidas | **Lema exacto**; no valida por sí solo las tres reglas propuestas |
| `thesaurum → tresor` | apartado II.1.3: `tresor` con **r patrimonial** | **Lema exacto**; no establece la secuencia de metátesis y monoptongación |
| `homĭnem → home` | apartado II.2.2: plurales `hòmens / homes` | **Relación morfológica indirecta**; no comprobación singular de `home` |

**Precaución adicional:** el acuerdo incluye `tòs` (con acento) en su repertorio, palabra que **no** debe utilizarse para acreditar `tos` 'acción de toser' procedente de `tussem`. La homonimia y la acentuación importan.

Como comprobación independiente de fonética histórica, se han consultado las secciones pertinentes de [*català*, Gran Enciclopèdia Catalana](https://www.enciclopedia.cat/gran-enciclopedia-catalana/catala). Se documentan estas **cuatro correspondencias expresas**:

- `cadere → caure`: se cita en el tratamiento de una consonante de grupo romance que se resuelve en una semivocal `[u]`, sin exponer todas las fases.
- `lŭcta → lluita`: la fuente explica el tratamiento palatal de la velar en `-ct-`; **el banco utiliza el acusativo `luctam`**, no el nominativo del ejemplo.
- `sem(i)nare → sembrar`: ejemplo explícito de síncope y aparición de consonante en el grupo `m'n`. Esta evidencia fortalece la **candidatura editorial** de epéntesis de `b`, pero no introduce aún una ley certificada ni cambia los fragmentos de la ficha.
- `laudare → lloar`: par expreso usado para comparar el tratamiento de consonantes intervocálicas en distintos contextos prosódicos. No da una reconstrucción separada de la `PALAT` inicial o de la `MONOP` de `au`.

La misma obra contrasta las formas romances `ben` y `bé` (junto con `bon` y `bo`) en función del contexto proclítico. Esto es **evidencia indirecta** para `bene → bé`, **no** una declaración individual de su cadena fonética desde BENE.

Quedan registrados **9 expedientes de evidencia puntual** en `shared/academic/evolutio-valenciano/contrast-normatiu-avl-i-fonetica-historica-2026-11-17.json`, enlazados con la cola de las 66 fichas. Se distingue entre **3 lemas reconocidos explícitamente por la AVL**, **1 plural emparentado**, **4 pares históricos explícitos** y **1 contraste prosódico indirecto**. Ninguno equivale a cotejo de la entrada electrónica vigente del DNV ni a aprobación de una ley escolar.

**El estado evaluable permanece inalterado:** 522 fichas, 66 con contraste lexicográfico, 47 con 72 hipótesis de ley y 19 sin ley segura; **0 cadenas completas acreditadas, 0 leyes valencianas certificadas, 0 tarjetas prácticas**. Los datos en castellano y las fuentes originales no se editan. Las nuevas comprobaciones se realizan con `tests/evolutio-valenciano-avl-fonetica-20261117.test.mjs`.

## Cierre editorial de las 19 cadenas complejas y clasificación de 27 reservas (17/11/2026)

La consulta directa de las **19 entradas adicionales del DCVB** está registrada, una por una, en `contrastos-historics-dcvb-complexos19-2026-11-17.json`, relacionada con la cola de 66. En **18 de las 19** la entrada del diccionario formula explícitamente el étimo; la de **`credere → creure`** documenta formas flexivas medievales y pronunciación valenciana, **pero no presenta una línea etimológica explícita** en el artículo consultado. Las formas conjugadas citadas no acreditan una derivación fonética completa del infinitivo.

**Comprobación especialmente útil de la reserva sobre `pilum → pèl`:** el DCVB sí precisa el étimo latino **PĬLU**, con *i* breve. El banco mantiene `pilum` y su identificador original; cualquier anotación de cantidad en el enunciado debe revisarse separadamente. El mismo resultado de búsqueda contiene el homógrafo `pel` (contracción de *per* + *el*), ajeno a la ficha.

Los testimonios documentados se han clasificado sin convertirlos en leyes:

- `tonare → tronar`: la `r` se explica por analogía con **tro**; la metátesis citada por el DCVB corresponde a la historia de **tro**, **no** al verbo `tonare`.
- `thesaurum → tresor`: antiguas `tesor`, `tesaur` y `tresaur`; no se fija por ello el orden de una cadena de metátesis y monoptongación.
- `insŭlam → illa`: antiguas `ila`, `yla`, `ylla` y `hila`. La variante moderna `isla` que recoge el DCVB se relaciona con influencia castellana, no es un eslabón etimológico patrimonial.
- `magistram → mestra` y `magistrum → mestre`: se documentan `maestra` y `maestre`; las formas antiguas `masestre`/`mesestre` del segundo son señaladas como posibles ultracorrecciones, no fases históricas obligadas.
- `sŏlĭdum → sou` presenta `sol` antiguo; `cŏrpus → cos` presenta `cors` antiguo; `bene → bé` mantiene `ben` proclítico con nasal. Son testimonios históricos de formas, **no certificaciones de los segmentos escolares**.
- `compărāre → comprar`: el étimo dado por el DCVB es la variante vulgar `compĕrāre`, por lo que la forma latina usada para señalar una eventual síncope necesita una decisión filológica previa.
- `continere → contindre`: el artículo se titula `contenir`, pero registra la pronunciación valenciana correspondiente a `contindre`; queda por verificar su estatus normativo y la distinción entre variante verbal y cambio fonético seleccionable.
- `podium → puig`: el artículo indica la evolución semántica de *pedestal/soporte* a *elevación del terreno*, que no debe contarse como ley fonética.

**Resultado:** hay ahora **66/66 fichas con contraste lexicográfico individual registrado**: 47 con 72 propuestas de ley/segmento **no certificadas**, y 19 con cadena compleja o sin ley escolar segura, **también sin certificar**. En las 19 complejas **no se ha añadido ninguna norma seleccionable**. No se atribuye falsa validación al DNV ni a las cadenas históricas.

### Priorización independiente de las 27 advertencias

La segunda revisión de las 47 candidaturas se conserva en `triage-27-advertencies-2026-11-17.json`, enlazada con los dos informes de 16 y 31 entradas. Clasificación **editorial, no normativa**:

| Motivo prioritario | Casos | Tratamiento pendiente |
|---|---:|---|
| Homonimia o acepción etimológica | 6 | Fijar la acepción correspondiente al étimo |
| Vigencia, pronunciación o variante valenciana | 4 | Contrastar con el **DNV** y el uso docente |
| Etimología de base, analogía o estrato léxico | 5 | Asegurar el étimo pertinente y distinguir préstamos/cultismos |
| Cadena de cambios incompleta o variantes históricas insuficientes | 12 | Justificar pasos fonológicos y fragmentos latinos |
| **Total** | **27** | **Sin promocionar fichas todavía** |

Las otras 20 candidaturas no llevan esta advertencia especial, pero **tampoco se han certificado**. Se conservan las 522 fichas, todos sus identificadores, las decisiones docentes anteriores y la práctica existente en castellano. `DNV individual = 0`, `leyes fonéticas valencianas certificadas = 0`, `fichas habilitadas en valenciano = 0`. La PR sigue sin fusión ni despliegue.

La fase siguiente exige contraste normativo del **Diccionari Normatiu Valencià (AVL)** y fuentes de fonética histórica individual suficientemente explícitas para las reglas y los segmentos, seguido de aprobación docente caso por caso. **La etimología del DCVB por sí sola no supera estos requisitos.**

## Contraste individual de las 47 candidaturas con leyes editoriales (17/11/2026)

Se han consultado las **47 entradas léxicas individualmente** para las que el expediente fonético contiene hipótesis de leyes (16 en el primer bloque, 31 en el segundo). Los informes son `contrastos-historics-dcvb-16-2026-11-17.json` y `contrastos-historics-dcvb-restants31-2026-11-17.json`. En conjunto: **46 referencias al DCVB** y **1 al GDLC** (comí). Todas están enlazadas por étimo y forma en `cola-fonetica-66-2026-11-17.json`.

Se ha contrastado **etimología, acepción y, cuando aparece, pronunciación valenciana y variantes históricas**. Este trabajo añade trazabilidad, pero **la forma o el étimo documentados no certifican automáticamente una ley fonética**. Sigue faltando consultar el **DNV de la AVL** por palabra, documentar el encadenamiento histórico completo de los cambios y la revisión docente final. No se ha logrado acceder sistemáticamente al servicio normativo desde esta sesión; en consecuencia, **DNV comprobado = 0; leyes certificadas = 0; ejercicios habilitados = 0**.

### Hallazgos que exigen cautela docente

- `monstrare → mostrar`: el DCVB registra *monstrar* en la tradición histórica; existe evidencia de la variante, pero no por sí sola certificación de una ley fonética universal.
- `tædam → tea`: el DCVB presenta las etapas *teda > tesa > tea* y la variante *teia*. La etapa histórica es una evidencia real, pero las leyes escolares sobre cada segmento requieren revisión.
- `asĭnum → ase`: aunque etimológicamente documentado, el DCVB advierte del retroceso de *ase* como denominación habitual del animal en valenciano. Revisar pertinencia para el alumnado.
- `legere → llegir`: la entrada documenta variedad de pronunciaciones valencianas de la consonante inicial. No declarar universal una palatalización inicial.
- `picare → pegar` alude a adherir con pega; evitar usarlo indistintamente con *pegar* 'golpear'.
- `consilium → consell` debe distinguirse de las variantes y significados interferidos por `concilium`; `pausare → posar` no se confunde con el homónimo relacionado con francés *poser*.
- `ausare → gosar` presenta hipótesis distintas sobre la consonante inicial; `imperatorem → emperador` convive con pronunciación valenciana *emperaor*. No asignar automáticamente un único cambio final.

**27 de las 47 fichas llevan una marca de atención filológica o docente** (7 del primer bloque y 20 del segundo). Esta marca sirve para priorizar revisiones, no equivale a una ficha incorrecta. Las restantes 20 tampoco se consideran normativamente certificadas.

**Se preserva el estado de trabajo anterior:** 522 fichas e IDs, 120 análisis editoriales previos, 66 contrastes léxicos nuevos y 72 segmentos de leyes únicamente propuestos. El valenciano no se habilita, el castellano no se modifica y la PR permanece sin fusionar.

**Siguiente fase:** cotejo externo del DNV, clasificación de las 27 advertencias (variantes, cultismos, bases latinas o secuencias problemáticas) y reconstrucción de los pasos fonéticos antes de que haya una primera ficha autorizada para test.

## Revisión fonética individual de las 66 fichas (17/11/2026)

Se han **revisado editorialmente, una por una, las 66 correspondencias con contraste léxico**. Los resultados quedan reproducidos en `shared/academic/evolutio-valenciano/cola-fonetica-66-2026-11-17.json` (esquema `v2`) y protegidos por `tests/evolutio-valenciano-fonetica66-editorial.test.mjs`.

- **66/66 revisiones individuales registradas**, cada una con observación sobre las transformaciones, fuente léxica conservada y reserva de sus dudas históricas.
- **47 fichas** tienen al menos una transformación fonética **hipotética** representada sobre el étimo latino: **72 candidatos de ley/segmento** en total, todos con posición de grafemas Unicode revisada mecánicamente. Los segmentos siguen la escritura latina fijada por ID, no se trasladan reglas castellanas.
- **19 fichas** permanecen sin regla seleccionable candidata debido a una evolución compleja, falta de etapas históricas documentadas, homonimia o ausencia de cambio escolar identificable. `bŏnam → bona` no recibe una ley inventada: la `-m` del acusativo se clasifica como pérdida fija no seleccionable.
- Se documentan con especial reserva `tonare → tronar` (el DCVB explica la `r` por analogía de *tro*, no por metátesis regular), `cadere → caure`, `thesaurum → tresor`, `credere → creure`, `insŭlam → illa`, `cŏrpus → cos`, `pretium → preu`, `magistrum → mestre`, `sŏlĭdum → sou`, `continere → contindre` y `bene → bé`.
- Los candidatos de ley nunca se incorporan a `revisio-120-2026-11-17.json` ni a `matriz-522.json`. Se mantiene el banco académico en **120 + 66 + 52 + 284** y `aptasParaPractica=0` para preservar el historial anterior.
- **No se ha completado una comprobación individual en el DNV**, cuya consulta oficial no ha podido verificarse de forma sistemática a través de este entorno. Tampoco se ha certificado la cadena histórica completa de ninguna de estas 66 ni se ha obtenido aprobación docente para evaluarlas. Por tanto, el estado correcto sigue siendo «análisis editorial, no ficha verificada o jugable».

**Próximo control antes de publicar:** cotejar los resultados con el DNV de la AVL, aportar bibliografía histórica específica a los pasos todavía hipotéticos (especialmente en las 19 evoluciones complejas), validar una a una las leyes escolares sobre sus segmentos y presentar al docente solo los criterios filológicos que requieran una elección. No se publica ni se modifica la versión castellana.

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
