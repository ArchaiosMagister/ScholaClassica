# Auditoría filológica, tanda 3: Latín de 4.º y preposiciones griegas

**Fecha:** 12 de noviembre de 2026. **Alcance:** 23 fichas modificadas (13 de Latín de 4.º y 10 de Griego I), sobre las **2.055 fichas** del banco estático. Los documentos originales se han consultado por curso, modalidad y unidad. Los cambios exactos, con identificador y transcripción literal del Word, constan en `tests/fixtures/lexical-reviewed-batch3.json`.

## Política de fuentes

La lista docente original fija **qué palabras y unidades** se exigen. Se respeta literalmente en `originals`, aunque contenga una errata. El campo operativo `form` o `meaning` solo se corrige cuando existe evidencia gramatical o lexicográfica. Las **respuestas admitidas** pueden aclararse o ampliarse si son correctas; una glosa fuente no se conserva automáticamente cuando induce un error de régimen.

Las dos lecturas nuevas del lema causadas por caracteres cirílicos se autorizan individualmente en `tests/fixtures/vocabulary-provenance.json`. La auditoría sigue contrastando todas las unidades contra los lemas de los Word originales. No se recalculan las huellas para disimular una discrepancia.

## Latín de 4.º: 13 fichas revisadas

| Unidad/modalidad | Original conservado | Forma operativa corregida | Motivación |
|---|---|---|---|
| UD5, General | `rĕgĭō, –onis (m.)` | `rĕgĭō, –onis (f.)` | *regiō* es **femenino** |
| UD8, General | `mŭlĭĕr, –ris` | `mŭlĭĕr, –eris (f.)` | Genitivo *mulieris*, género femenino |
| UD6, General | `mărĕ, –is` | `mărĕ, –is (n.)` | Género neutro acreditado en UD5 |
| UD6, General | `cōnsŭl, –is` | `cōnsŭl, –is (m.)` | Género masculino acreditado en UD5, UD8 y UD10 |
| UD7, General | `īmpĕrātŏr, –oris` | `īmpĕrātŏr, –oris (m.)` | Género masculino acreditado en UD5–6 |
| UD7, General | `hŏmō̆, –minis` | `hŏmō̆, –minis (m.)` | Género masculino acreditado en UD6 y UD9 |
| UD10, General | `lĕgĭō̆, –onis` | `lĕgĭō̆, –onis (f.)` | Género femenino acreditado en UD5, UD7 y UD8 |
| UD6, General | `ōppūgnātĭō̆, –onis` | `ōppūgnātĭō̆, –onis (f.)` | Género femenino acreditado en UD5 |
| UD4, General | `pŭgno (1ª)` | `pūgno (1ª)` | *pūgnō*: cantidad larga acreditada, también presente en UD2–3 |
| UD5, General/Examen | `cūrro (3ª)` | `currō (3ª)` | Se elimina macrón de la *u*: se conserva la forma usada en UD8 y registrada en Logeion; **dos fichas** |
| UD10, General | `Mўrō̆, –onis (m.)` | `Myrō̆, –onis (m.)` | Sustituida la letra cirílica «ў» por la **y latina**; sin imponer variante de nominativo |
| UD10, General | `stўlus, –ī` | `stylus, –ī` | Misma corrupción de carácter; *stilus* es la grafía clásica preferida por Lewis–Short, pero no se sustituye la variante pretendida por el profesor |

Referencias: [*regiō*](https://logeion.uchicago.edu/regio), [*mulier*](https://logeion.org/mulier), [*mare*](https://logeion.uchicago.edu/Mare), [*pūgnō*](https://logeion.uchicago.edu/pugno), [*currō*](https://logeion.uchicago.edu/curro), [*stilus* (Lewis–Short)](https://alatius.com/ls/index.php?l=stilus).

**Importante acerca de los signos de cantidad.** No se han eliminado automáticamente marcas como `pā̆trĭa`, `hŏmō̆` o `lĕgĭō̆`. La notación larga/breve superpuesta puede expresar variantes prosódicas: de hecho, Lewis–Short recoge `pā̆trĭa`. Solo se modificaron las cantidades de *pūgnō* y *currō* tras cotejo independiente y con otras unidades del banco.

## Griego I: régimen de las preposiciones

Se han examinado las **20 entradas de General y 11 de Examen** del apartado de preposiciones. Se han modificado las diez fichas indicadas a continuación; las demás conservan su lectura docente por ser válidas o por no haber prueba suficiente para alterar su formulación.

| Preposición y corpus | Revisión | Régimen |
|---|---|---|
| **διά**, General | «a través de / por medio de» para gen.; «a causa de / por» para ac. | Genitivo y acusativo diferenciados |
| **διά**, Examen | Se retira «a través de» como respuesta de `διά + acusativo`; «a causa de» y «por» permanecen | Acusativo causal ordinario |
| **μετά**, General y Examen | «con / entre» con gen.; «después de» con ac., con puntuación clara | Se mantienen ambos casos |
| **περί**, General | «sobre / acerca de» con gen.; «alrededor de» con ac. o dat. | Explicación de los valores principales sin retirar casos del Word |
| **περί**, Examen | Se añade «acerca de» al gen.; se conservan «sobre» y la glosa local «alrededor de» del Word | No se convierte una diferencia de uso en un falso error |
| **ὑπό**, General y Examen | Se distingue «por» como agente con gen. frente a «debajo de» como acepción espacial | Conserva los regímenes exigibles |
| **ὑπέρ**, General, con gen./ac. | Se explicita «a favor de / por» con gen.; «sobre / más allá de» con ac. | «A favor de» ya figura en otra entrada del mismo Word |
| **παρά**, General | Se sustituye «a lado de» por «al lado de» | Solo corrección ortográfica castellana; casos originales intactos |

La gramática de **Smyth (§§1675–1679)** documenta las correspondencias principales de régimen y significado: [Smyth, preposiciones en prosa ática](https://services.perseids.org/sg/body.1_div1.4_div2.19.html). Se ha contrastado también la descripción de [ὑπό en Logeion](https://www.logeion.org/%E1%BD%91%CF%80%CF%8C).

**Matices preservados:**
- No se ha retirado de *περί + genitivo* toda acepción local: son posibles usos espaciales, aunque la glosa ordinaria en prosa ática suele ser «sobre/acerca de».
- La lista general incluye dativo con *ἀμφί*. Smyth lo registra fundamentalmente en usos poéticos y algunos dialectales; **no se elimina** del vocabulario del profesor ni se presenta como régimen normal sin advertencia.
- *ἐπί*, *κατά* y *παρά* muestran otros cambios de sentido según el caso: conviene documentar ejemplos de clase antes de sustituir las glosas compactas de esos lemas.
- No se fusionan las dos fichas de *ὑπέρ* ni se adjudica unidad a palabras de «Sin unidad acreditada».
- Se conservan las acepciones acumuladas de cada Word salvo el valor de «a través de» atribuido expresamente al **acusativo** de *διά*, porque resultaría engañoso en un ejercicio elemental.

## Integridad y pruebas

- El banco sigue teniendo **2.055 fichas**.
- No se modifican identificadores, unidades, programas de selección, ni las cadenas originales de `originals`.
- Las dos sustituciones de caracteres cirílicos tienen **excepciones de procedencia individuales** que conservan las huellas históricas de UD10.
- `tests/check-lexical-batch3.cjs` exige los 23 registros revisados, género, cantidad, respuestas válidas, ausencia de caracteres cirílicos en latín y documentación de cada cambio.
- `tests/check-vocabulary-browser.cjs` comprueba en Chromium las respuestas correctas e incorrectas de *διά*, *περί*, *ὑπό* y *παρά*.
- Las pruebas de las tandas anteriores y las 44 correspondencias por unidades continúan siendo obligatorias en CI.

**Alcance de la certificación:** se acredita individualmente esta tanda y se clasifica el resto del apartado de preposiciones como conservado, **no** como revisado al mismo nivel en todas sus acepciones. Latín II sigue pendiente de su documento original.
