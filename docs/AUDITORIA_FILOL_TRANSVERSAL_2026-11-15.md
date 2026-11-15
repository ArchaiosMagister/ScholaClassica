# Auditoría filológica transversal — Latín I, Latín de 4.º y Griego I

**Fecha:** 15 de noviembre de 2026.  
**Ámbito:** gramática bilingüe, morfología y vocabulario integrados de ScholaClassica.  
**Estado:** examen inicial documentado en PR #91; enmienda inequívoca de la copia integrada y reservas pendientes de decisión docente. **No integrar/publicar esta PR hasta cerrar las decisiones.**

## 1. Procedimiento y límites

Se han cotejado los artefactos **realmente generados** por `npm run build` con las fuentes fijas de `config/sources.lock.json`:

- Appendix grammaticae: `4c89f9b032e356f033f507eafbb66b49d6bb6761`.
- Vocabula Latina Graecaque: `0e16505b7631298a0448c4160a5d258f82732bfe`.
- Las 2.055 fichas léxicas se cotejan por identidad e ID, admitiendo únicamente las enmiendas ya documentadas y esta enmienda filológicamente acreditada. Los bancos originales no se modifican.
- El informe reproducible `npm run audit:filologia:transversal` comprueba los tres currículos ES/VAL, procedencia y casillas de modelos docentes de 4.º, unidades curriculares, referencias de formas nominales griegas y posibles contradicciones internas entre fichas nominales homónimas.

**Limitación fundamental:** la coincidencia entre fuentes y ausencia de contradicciones *dentro* de los datos no certifica las miles de formas individuales, sus glosas o la calidad de todas las traducciones al valenciano. La comparación por lema entre «Examen» y práctica morfológica no indica que toda palabra sin ficha propia sea un fallo: la práctica contiene paradigmas modelo, no un generador lexicográfico universal.

## 2. Matriz de resultados comprobados

| Indicador | Latín I | Latín de 4.º | Griego I |
| --- | ---: | ---: | ---: |
| Unidades de gramática (ES y VAL) | 10 | 8 | 14 |
| Temas en ambos idiomas | 30 | 15 | 28 |
| Tablas en ambos idiomas | 40 | 22 | 50 |
| Diferencias estructurales ES/VAL | 0 | 0 | 0 |
| Fichas de práctica morfológica | 89 | 76 | 92 |
| Fichas de General | 741 | 379 | 332 |
| Fichas de Examen | 115 | 127 | 171 |
| Identidades de Examen con lema coincidente en un paradigma modelo | 21 | 18 | 38 |
| Diferencias nominales internas por lema/casilla comparables | 0 | 0 | 0 |

**Contraste interfuentes adicional:**

- Latín de 4.º: **26/26** registros docentes, incluidas las formas de imperfecto, preservan la grafía y secuenciación que acreditan sus fuentes; **49/49** modelos procedentes de Appendix conservan íntegramente sus casillas.
- Griego I: **24** paradigmas con referencias explícitas a fichas de Examen de Vocabula; sin ID inexistente, adelanto curricular no justificado ni desajuste de SHA.
- El banco completo de práctica contiene también Latín II; sus **757** registros totales no deben confundirse con las **257** fichas objeto de esta auditoría.

Los valores de «lema coincidente» son **indicadores de cobertura aproximada** y no certificación de paradigma completo ni evidencia para importar automáticamente una forma.

## 3. Enmienda lexicográfica segura: *polliceor*

**Fuente original de Vocabula, Latín de 4.º, Examen UD10:**
`pollĭcĕor, pollĭcĭtus sum (3ª)`, ID `ccb8e344f436ae4b`.

**Corrección acreditada:** `pollĭcĕor, pollĭcĭtus sum (2ª)`, deponente de segunda conjugación. El diccionario de Lewis y Short clasifica el lema como `2, v. dep.`; la lista de vocabulario de la Facultad de Clásicas de Cambridge lo clasifica `verb 2 dep`.

- https://atlas.perseus.tufts.edu/dictionaries/entry/urn%3Acite2%3Ascaife-viewer%3Adictionary-entries.atlas_v1%3Alat.ls.perseus-eng2-n36862/
- https://www.classics.cam.ac.uk/files/media/as_latin-defined-vocabulary-list.pdf

**Aplicación segura:** cambiar exclusivamente `form` en el adaptador persistente del artefacto integrado (`scripts/latin4-lexical-editorial.mjs`); no alterar su ID, traducciones, alternativas, originales transcritos, unidades ni modo Examen. No publicar ni reescribir `VocabulaLatinaGraecaque` independiente. La ficha sigue en UD10; corregir la conjugación **no equivale a autorizar su exigibilidad dentro de las ocho unidades impartidas**.

## 4. Reservas curriculares y docentes

### D1. Seis verbos de Examen de Latín de 4.º fuera de las ocho unidades impartidas

La copia integrada conserva seis fichas de **Examen UD10** pese a que el currículo de gramática y morfología de 4.º concluye en UD8:

| ID original | Enunciado (fuente, salvo enmienda indicada) | Glosa |
| --- | --- | --- |
| `1563de7e47eead57` | admīror, admīrātus sum (1ª) | admirar |
| `91295629d3862db9` | cōnor, cōnātus sum (1ª) | esforzarse |
| `f17ac10e4e2d3b55` | lavor, lavatus sum (1ª) | lavarse |
| `fe206225b0feec71` | persĕquor, persĕcūtus sum (3ª) | perseguir |
| `ccb8e344f436ae4b` | pollĭcĕor, pollĭcĭtus sum (**2ª en copia**) | prometer |
| `47df3a1b50e530d5` | ūtor, ūsus sum (3ª) | utilizar |

General conserva también 44 apariciones de fichas en UD9 y 42 en UD10, en algunos casos palabras presentes igualmente en unidades anteriores. El informe identifica **88 fichas únicas** con alguna etiqueta fuera del currículo de ocho unidades; **seis son las de Examen UD10**.

**Decisión reservada:** mantener disponibles dichos grupos como ampliación expresamente voluntaria o excluirlos de las sesiones ordinarias de examen de 4.º, sin borrarlos ni perder historial. No trasladar automáticamente UD10 a UD8 ni atribuir al currículo de ocho unidades los deponentes no enseñados.

### D2. *lavor* no es necesariamente un verbo deponente en sentido técnico

La ficha `lavor, lavatus sum (1ª)` ofrece la glosa «lavarse». Lewis y Short documentan **`lavo, lavare` como verbo activo**, y construcciones de uso medio/reflexivo en su **voz pasiva**. Esta diferencia importa si UD10 se presenta como lista exclusivamente de *verbos deponentes*: una forma pasiva con valor reflexivo no equivale, por sí sola, a un verbo morfológicamente deponente.

Fuentes para discusión:
- https://logeion.org/lavo
- https://culturaclasica.com/palaestra/palaestra_latina_85.pdf

**Decisión reservada:** aclarar la etiqueta didáctica de `lavor` como pasiva reflexiva de *lavo*, o apartarla de un eventual listado exclusivo de deponentes. No se altera ninguna forma o categoría automáticamente a falta de criterio sobre cómo se imparte UD10.

### Reservas anteriores, sin decisión nueva

- **Latín I:** General contiene 140 fichas en UD11–12, fuera de las diez unidades normales; Examen carece de listas específicas UD8–10. No se convierten en exigibles.
- **Griego I:** General conserva 184 fichas sin unidad acreditada; Examen no aporta listas específicas UD11–14. Ninguna se reasigna sin evidencia.
- La forma singular **ἐλπί*** y su nota de excepción, así como el vocativo latino **acer**, se mantienen en los currículos ES/VAL de Appendix ya incorporados anteriormente; no se reabre su corrección.

## 5. Seguridad y siguiente lote

La PR incluye solo una corrección de enunciado sustentada por diccionarios y un auditor transversal de solo lectura. No se modifican datos de fuente, progresos, claves, servidor o modo de exigibilidad.

Si se aprueban las decisiones D1–D2, conviene añadir controles que impidan proponer material optativo de 4.º en la modalidad ordinaria correspondiente y conservar acceso al archivo histórico. Después debe continuarse con un cotejo **filológico individual selectivo** de los lemas y casos de mayor frecuencia, no con una certificación automática de miles de formas.
