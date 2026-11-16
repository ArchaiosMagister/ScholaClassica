# Griego I — revisión individual de 184 fichas sin unidad acreditada

**Fecha:** 16/11/2026. **Ámbito:** corpus `General` del banco
histórico Vocabula; gramática de Appendix en castellano y valenciano;
práctica de morfología integrada en ScholaClassica.

**No se modifica** ninguna ficha del corpus General ni del Examen,
ningún identificador, ninguna unidad, las acepciones, las respuestas,
el banco morfológico, las estadísticas ni el progreso. Tampoco los
repositorios originales.

## Inventario

- `Griego I`: **503 fichas históricas**, 332 General y 171 Examen.
- **184 fichas General** tienen «Sin unidad acreditada».
- **0 fichas Examen** tienen esa etiqueta.
- La clasificación académica de esas 184 fichas **no se infiere** a
  partir del vocabulario de examen ni de la simple presencia en una tabla
  gramatical.

El registro completo **individualizado por ID**, con forma, glosa,
procedencia y evidencias, se genera como
`build/academic-audits/greek-unassigned/griego1-184-fichas-individuales.json`.
Un segundo archivo selecciona solo los registros con alguna evidencia
documentada para revisión docente:
`griego1-candidatas-revision-docente.json`.
Ambos se archivan en la ejecución de CI, no en el sitio público.

## Primer contraste: una coincidencia léxica de especial interés

La ficha General **κίνδυνος, –ου (ὁ)**, «peligro», tiene una segunda ficha
del **mismo lema y la misma glosa** en Examen (`κίνδυνος, –ου`),
que pertenece a **UD5**.

Esto proporciona una **candidatura de adscripción de General a UD5**,
pero no una decisión ejecutada: General y Examen son corpus distintos
y sus procedencias deben conservarse. La ficha de Examen, su UD5 y
ambos IDs permanecen intactos.

## Segundo contraste: quince lemas citados expresamente en la gramática

Los siguientes lemas aparecen como ejemplos en un tema de Appendix,
tanto en castellano como en valenciano. La presencia en el tema
es evidencia de **uso gramatical**, no de su inclusión automática en
un vocabulario exigible.

| Unidad y contenido | Lemas detectados en ambas lenguas |
| --- | --- |
| **UD8** — tercera declinación: consonantes | ἐλπίς, λιμήν, φλέψ |
| **UD10** — participios de presente | μένω |
| **UD12** — aoristo sigmático y temático | ἀγγέλλω, ἀφικνέομαι, βάλλω, εὑρίσκω, πάσχω, πείθω, πέμπω, πράττω, τρέχω |
| **UD13** — perfecto y pluscuamperfecto activos | νομίζω |
| **UD14** — temas en silbante | γένος |

Las unidades UD11–14 **sí existen en la gramática de Griego I**,
pero **no hay una lista propia de Examen** para ellas en la fuente
actual. Citar un verbo en la UD12 para ilustrar un aoristo no
implica que su entrada de General deba convertirse en Examen UD12.

## Tercer contraste: morfología

El auditor compara el lema de cada una de las 184 fichas con los **94
modelos actuales de morfología de Griego I**, por ID, categoría y
unidad. Se consideran **candidatos de cotejo**, no identidad léxica
automática ni prueba de exigibilidad: el normalizador elimina
diacríticos griegos únicamente **para buscar** coincidencias
que deben contrastarse individualmente.

El resumen cuantitativo y las coincidencias se obtienen en
`griego1-184-fichas-individuales.json`, no se modifican los paradigmas.
El auditor rechaza discrepancias entre las unidades donde aparece
un mismo lema en las gramáticas castellana y valenciana.

## Las fichas restantes

A partir del vocabulario de Examen y de las menciones expresas de
Appendix, **168 fichas** no tienen ninguno de esos dos tipos de
evidencia directa; algunas pueden tener un modelo relacionado en
morfología, sin que ello baste para determinar su UD léxica.

Esto **no significa que sean erróneas** ni autoriza borrarlas:
siguen siendo vocabulario General disponible sin adscripción.

## Criterios técnicos y regresiones

`scripts/audit-greek-unassigned-individual.mjs` construye un
registro exhaustivo de los 184 IDs, cada uno con:

- Enunciado y glosa exactos de la fuente original.
- Unidades originales, corpus y constancia de la copia integrada.
- Coincidencias con otros registros de Vocabula: modo, ID,
  unidad y concordancia o diferencia de glosa.
- Unidad y epígrafe de Appendix en castellano y valenciano.
- Posibles paradigmas morfológicos (ID, UD, categoría).
- Categoría de diagnóstico, decisión pendiente y
  `assignUnit: null`, `examPromotion: false`.

`tests/greek-unassigned-individual.test.mjs` detecta pérdidas de
fichas, cambios del corpus, reajustes de unidades, diferencias
bilingües y la desaparición de la coincidencia de **κίνδυνος**.

En la CI se ejecuta `npm run audit:gr1:unassigned` tras compilar
la copia de las tres aplicaciones. Los dos archivos de diagnóstico
se archivan por 30 días. No hay acceso público adicional ni
despliegue de bancos como consecuencia de esta auditoría.

## Decisiones reservadas al docente

1. **κίνδυνος**: mantener la ficha General «Sin unidad acreditada»
   (opción conservadora) **o** reconocerle UD5 como en su ficha de
   Examen, sin fusionar registros ni convertir General en Examen.
2. **Quince menciones gramaticales**: conservarlas como ejemplos
   documentados sin UD léxica asignada (opción conservadora) **o**
   revisar una a una cuáles deben adquirir adscripción. No es
   recomendable trasladar de una vez nueve verbos a UD12 solo
   porque aparecen en el capítulo del aoristo.
3. **Resto del corpus**: conservar las fichas sin unidad
   hasta disponer de una lista de clase o criterio curricular
   explícito; no adelantar ni inventar exigibilidad.

No hace falta resolver estas opciones para integrar la auditoría:
**todos los bancos y unidades permanecen como estaban**.

## Limitaciones metodológicas

El cotejo de lemas recupera candidatos por simplificación tipográfica
de acentos/espíritus griegos; **no** declara sinónimos, traducciones
correctas ni flexiones verificadas. La coincidencia literal en HTML
de un tema puede corresponder a un ejemplo ilustrativo y no a la
presentación curricular del lema. La verificación de equivalencia
ES/VAL se refiere a la presencia del lema por unidad, no a la
corrección de cada traducción o explicación.
