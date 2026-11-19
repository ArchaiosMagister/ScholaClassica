# Revisión de 100 formas flexionadas — latín y griego ático

**Fecha:** 12 de noviembre de 2026. **Ámbito:** 100 comprobaciones *individuales*, distribuidas en **25 de Latín I, 25 de Latín de 4.º y 50 de Griego I (ático)**.

## Criterio

Se han elegido **20 paradigmas del banco del profesor**, cinco formas de caso/número por paradigma. Cada una de las 100 comprobaciones lleva la ficha exacta del banco, la forma clásica esperada, el caso y número y un enlace a una gramática de referencia.

Los datos de partida son los Word docentes conservados en `originals`, cotejados previamente con las 44 listas curriculares. La autoridad **gramatical externa** (Allen y Greenough para latín, Smyth para griego ático y una tabla clásica de tercera declinación) determina si la **flexión importada** es válida. Se comprueba el índice real de `data/unimorph-syllabus/`; no se infieren formas desde las traducciones.

**No se considera «verificada» una forma que no figure en el índice**: se marca como ausente. No se han cambiado unidades, palabras exigibles ni enunciados docentes para hacer cuadrar el resultado.

## Resultado comprobado

| Estado | Índice previo | Tras regenerar UniMorph con la corrección |
| --- | ---: | ---: |
| Formas comprobadas | 100 | **100** |
| Coincidentes con la forma clásica | 87 | **95** |
| Ausentes en el índice | 13 | **5** |
| Formas discordantes con la gramática | 0 | **0** |
| Variantes adicionales contradictorias | 0 | **0** |

**Las 50 formas latinas han coincidido**, repartidas en 25 controles de Latín I y 25 de Latín de 4.º. En Griego I, **45 de las 50 formas** se encuentran y coinciden con las esperadas del ático clásico; cinco no aparecen todavía en UniMorph.

### Reparación de una pérdida sistemática

El importador descartaba casi todos los **dativos singulares griegos con artículo** porque no reconocía `τῷ` y `τῇ` cuando la normalización convertía la iota suscrita en iota escrita. La corrección afecta a `scripts/import_unimorph.mjs`, sin modificar el corpus upstream.

En la regeneración, el número de registros griegos conservados pasa de **1.451 a 1.535** (**84 registros recuperados**). De los **diez dativos singulares** específicos de la muestra, ocho quedan incorporados y cotejados.

### Cinco formas que permanecen ausentes

| Lema | Caso y número | Forma ática contrastada | Situación |
| --- | --- | --- | --- |
| **πατήρ** | Genitivo singular | πατρός | Ausente en el índice |
| **πατήρ** | Dativo singular | πατρί | Ausente en el índice |
| **πατήρ** | Genitivo plural | πατέρων | Ausente en el índice |
| **μήτηρ** | Genitivo singular | μητρός | Ausente en el índice |
| **μήτηρ** | Dativo singular | μητρί | Ausente en el índice |

Estas cinco formas **sí están documentadas como áticas** en [Smyth, *Greek Grammar*, §262](https://ccel.org/ccel/smyth/grammar/html/smyth_2e_uni.htm), pero **no están registradas en el índice UniMorph importado**. No se han fabricado filas atribuyéndolas falsamente a UniMorph. Una incorporación posterior debería ser **curada por separado**, con referencia a Smyth y pruebas de origen explícitas.

## Paradigmas inspeccionados

| Curso | Paradigmas | Casos cotejados |
| --- | --- | --- |
| Latín I | *bellum, corpus, civis, miles, ager* | Gen. sg., dat. sg., ac. sg., nom. pl., gen. pl. |
| Latín de 4.º | *puella, rex, dux, res, consul* | Gen. sg., dat. sg., ac. sg., nom. pl., gen. pl. |
| Griego ático | λόγος, ἄνθρωπος, δῶρον, φύλαξ, σῶμα, πατήρ, μήτηρ, γῆ, στρατηγός, πρᾶγμα | Cinco flexiones por lema; en γῆ se usan únicamente formas singulares para evitar mezclar plurales de otros registros |

En el caso de **γῆ**, las cinco comprobaciones se han limitado conscientemente al singular. Algunos plurales citados por fuentes griegas pertenecen a tradiciones literarias distintas o no son corrientes en el ático escolar; esta muestra **no los certifica**.

## Fuentes gramaticales

- [Allen y Greenough, *New Latin Grammar*: desinencias y paradigmas de las cinco declinaciones](https://romanreader.lyceum.institute/grammar/allen-greenough/inflection-and-nouns).
- [Dickinson College Commentaries: *Case Endings of the Five Declensions*](https://dcc.dickinson.edu/grammar/latin/case-endings-five-declensions).
- [Smyth, *Greek Grammar*, morfología nominal y flexión de πατήρ, μήτηρ](https://ccel.org/ccel/smyth/grammar/html/smyth_2e_uni.htm).
- [Tabla de tercera declinación griega: φύλαξ y σῶμα](https://www.caterhamschool.co.uk/wp-content/uploads/2022/05/Greek-Grammar-Summary.pdf).

## Trazabilidad y prevención de regresiones

- `tests/fixtures/revision-100-formas-clasicas.json`: los **100 controles** con lema, ficha docente, forma y autoridad.
- `tests/check-100-classical-forms.cjs`: cotejo de las formas realmente presentes, con cuatro estados separados: `matched`, `absent`, `extra-variants` y `contradictory`.
- La prueba general de GitHub Actions exige las **50 formas latinas coincidentes** y no admite ninguna forma contradictoria.
- La prueba del importador exige recuperar al menos **ocho dativos singulares griegos** de la muestra; los dos restantes se mantienen como faltantes documentados.
- Cada ejecución guarda un **informe detallado de las 100 observaciones** en JSON y Markdown, descargable desde los artefactos del workflow.

**Limitación:** la revisión de 100 posiciones no certifica las restantes formas latinas o griegas de UniMorph. En Griego se mantiene el criterio **exclusivamente ático**; la mera coincidencia del lema con un diccionario general no acredita el dialecto de todas sus flexiones.
