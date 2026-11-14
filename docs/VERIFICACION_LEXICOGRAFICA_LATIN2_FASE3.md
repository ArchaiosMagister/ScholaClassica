# Latín II — tercera fase: revisión editorial y análisis de 7.307 perífrasis

**Estado:** análisis académico reproducible en la PR 68, no publicado, sin alterar respuestas, sorteo, web de alumnado ni repositorios originales. **No equivale a certificación individual ni testimonio textual.**

## I. Cuatro lecturas revisadas (PAU/cuaderno)

El archivo persistente `shared/academic/latin2/lexicographic-decisions.json` identifica por **ficha, grafía, caso, género y número** las cuatro decisiones, sin editar el banco de la web.

| Lectura | Resolución de la auditoría | Tratamiento |
| --- | --- | --- |
| `nonnullae`, genitivo singular femenino de `nonnullus, -a, -um` | Desinencia femenina singular de primera clase **regular** `-ae`. El homógrafo nominativo/vocativo plural no la excluye | Se conserva como lectura morfológica legítima; no se afirma testimonio individual |
| `nonnullae`, dativo singular femenino | Dativo femenino singular **regular** `-ae`; sincretismo de primera declinación | Se conserva; no se afirma testimonio individual |
| `Segestae`, nominativo plural femenino de `Segesta` | Formalmente construible, pero topónimo usado normalmente en singular: **no hay acreditación de uso plural** | Reserva onomástica; ni certificar ni excluir automáticamente |
| `Segestae`, vocativo plural femenino | Mismo problema de extensión semántica y uso del topónimo | Reserva onomástica; ni certificar ni excluir automáticamente |

El estado documental primitivo de los cuatro análisis se conserva para trazabilidad. La resolución editorial se **anexa** en los informes como `editorialReview`. Por tanto, la categoría técnica de discrepancia puede seguir apareciendo en el informe de fuentes, pero ya existe una conclusión docente explicada; ninguna forma pasa a `individualmenteVerificada` ni se altera la selección de ejercicios.

## II. Auditoría de los 7.307 análisis compuestos

El analizador `scripts/latin2-compounds.mjs`, invocado por `scripts/audit-latin2-compounds.mjs`, cubre los **7.080 análisis finitos** y **227 infinitivos** previamente apartados por la comparación de una sola palabra.

| Resultado estructural | Casillas |
| --- | ---: |
| Participio, auxiliar, flexión y enunciado compatibles | **7.249** |
| Variantes gráficas `adgressus` / `aggressus` documentadas | **54** |
| Forma irregular `futurum esse` (de `sum`) | **1** |
| Citas paradigmáticas del futuro activo de `utor` (`ūsūrus`, `ūsūrī`, `ūsūrae` + `esse`) | **3** |
| **Total** | **7.307** |

### Qué se comprueba

- En verbos personales: la forma de `sum` distingue **persona y número**, modo y sistema temporal (perfecto, pluscuamperfecto y futuro perfecto, también subjuntivo donde procede). El participio se coteja con el tema realmente declarado en el enunciado del banco y con la concordancia de género/número. Se reconoce el orden participio–auxiliar y auxiliar–participio.
- En deponentes: las formas con flexión pasiva conservan el valor semántico activo, sin confundirlo con la voz activa morfológica.
- En infinitivos: se distinguen participio perfecto + `esse`, participio futuro activo + `esse` y supino + `iri`, y se contempla `futurum esse` como caso irregular. Se revisa la función habitual del **acusativo** del participio en ACI.
- Las 54 formas de `adgressus` corresponden a una **variante documentada** del participio de `aggredior`. Se reconoce exclusivamente esta equivalencia, apoyada en Lewis & Short, sin deducir todas las asimilaciones posibles ni convertir las frases en testimonios documentados.
- Las tres formas `usurus esse`, `usuri esse` y `usurae esse` se **conservan como citas paradigmáticas**, respectivamente con participio futuro nominativo masculino singular, masculino plural y femenino plural. Esta presentación fuera de contexto no constituye un ACI: si se construye una oración de infinitivo con sujeto acusativo, el participio debe concordar en **acusativo**. El código conserva esta distinción con el estado `estructura-compatible-con-enunciado-paradigmatico` y la propiedad `aciAccusativeRequired: true`, sin dar por atestiguada ninguna expresión.

### Decisión editorial definitiva para los tres modelos de *utor*

- `ūsūrus esse`: participio futuro, nominativo masculino singular, enunciación de paradigma.
- `ūsūrī esse`: participio futuro, nominativo masculino plural, enunciación de paradigma.
- `ūsūrae esse`: participio futuro, nominativo femenino plural, enunciación de paradigma.

En una proposición subordinada de **acusativo con infinitivo**, el participio futuro concuerda con el sujeto acusativo (por ejemplo, `se usurum esse`). El programa de auditoría **no interpreta automáticamente** las tres fórmulas nominativas como ejemplos de ACI, ni las borra por no estar en acusativo. Cada ficha conserva la decisión en `shared/academic/latin2/lexicographic-decisions.json` y los informes la incorporan mediante `editorialReview`, sin alterar el banco de los ejercicios.

Fuentes: [Allen & Greenough §164](https://dcc.dickinson.edu/grammar/latin/stems), [§498](https://dcc.dickinson.edu/grammar/latin/future-participle) y [§584](https://dcc.dickinson.edu/grammar/latin/tenses-infinitive-indirect-discourse). La forma de cita es una **convención de descripción morfológica**; no se confunde con testimonio textual.

### Evidencia externa en los componentes

El flujo independiente consulta la revisión congelada completa de UniMorph y LEMLAT 3.0; la consulta LEMLAT incluye ahora las **463 grafías simples** prioritarias y **475 tipos de componente** de las expresiones compuestas (más las formas del auxiliar). Manifiesto: 957 consultas distintas; LEMLAT reconoce 955 tipos, con las mismas dos ausencias `duos` y `segestae`; produce 7.564 filas de evidencia.

Sobre los 7.307 análisis: **5.463** tienen evidencia externa para sus dos componentes, **1.844** tienen evidencia para uno, ninguno carece de toda evidencia de componentes. El mero cotejo de lemas y formas de los componentes **no demuestra** la atestiguación de la expresión completa ni la equivalencia filológica de cada lectura; la auditoría conserva las fuentes nativas separadamente.

### Informes y límites de seguridad

Los archivos `compuestos-resumen.json`, `compuestos-evidencias.ndjson` y `compuestos-reservas.tsv` se producen en `build/academic-audits/latin2-lexicon/` (artefacto docente), no en `dist/` ni en GitHub Pages. `compuestos-reservas.tsv` conserva cabecera pero **ninguna reserva pendiente** en el conjunto actual; las **tres** formas de `utor` tienen estado de cita paradigmática, y las variantes ortográficas y el caso irregular permanecen distinguidos en el registro de evidencias.

El cotejo puede ejecutarse con UniMorph solamente (flujo de integración normal, sin fuente independiente adicional) o con el JSONL de LEMLAT (flujo específico, aislado). Pruebas automáticas: estructuras de participio, subjuntivo, deponentes, inversión del orden, concordancia, excepciones, infinitivos y procedencia. Una ejecución válida declara siempre `individuallyVerified: false`, `attestedPhrases: 0` y `modifiedBankRecords: 0`.

### Fuentes gramaticales y filológicas

- Allen & Greenough, [The Three Stems (§164)](https://latindictionary.co/academy/grammar/164), formación de participios y tiempos compuestos.
- Dickinson College Commentaries, [Periphrastic Conjugations](https://dcc.dickinson.edu/el/grammar/latin/periphrastic-conjugations).
- Lewis & Short, [`aggredior` (`adg-`)](https://atlas.perseus.tufts.edu/dictionaries/entry/urn%3Acite2%3Ascaife-viewer%3Adictionary-entries.atlas_v1%3Alat.ls.perseus-eng2-n1556/) y [`aggressus`](https://logeion.org/aggressus).
- [UniMorph Latin](https://github.com/unimorph/lat) y [LEMLAT 3.0](https://github.com/CIRCSE/LEMLAT3), revisiones inmutables detalladas en la [fase 2](VERIFICACION_LEXICOGRAFICA_LATIN2_FASE2.md).

**Resultado:** los 7.307 análisis compuestos quedan clasificados estructuralmente y **no queda ninguna reserva estructural abierta** en el conjunto actual. Las tres lecturas de `utor` se documentan como modelos de cita, no como acusativos de un ACI. Ninguna de las 7.307 expresiones queda individualmente certificada ni atestiguada por esta auditoría; ambas operaciones exigirían evidencia adicional por flexión y contexto.
