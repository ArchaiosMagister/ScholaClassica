# Cuaderno de Latín II 2026–2027 · ampliación de morfología

## Material y alcance

**Fuente primaria:** `cuaderno lat2 26.27.pdf`, documento aportado por el
docente (78 páginas). Solo se conserva en el repositorio un índice de formas
solicitadas, nunca el PDF, sus textos completos ni materiales literarios.

**Índice versionado**:
`shared/academic/latin2/cuaderno-2026-27-morfologia.tsv`.

- **Páginas 18–48:** 119 formas y grupos verbales que el autor ha subrayado
  explícitamente en los textos de traducción. Las marcas se han localizado
  visualmente en las líneas de subrayado del PDF vectorial, no por elección
  de vocablos dentro del texto. La página 20 no presenta subrayados y
  la 24 contiene solo tres; se conservan ambos hechos sin inventar tareas.
- **Páginas 49–54:** 120 propuestas explícitas de los niveles α–ζ:
  sustantivos, adjetivos, infinitivos, pronombres, participios, verbos
  personales y expresiones pasivas compuestas.
- **Total:** 239 apariciones, 223 grafías diferentes antes de la
  normalización contextual. La comprobación automatizada preserva las
  apariciones y exige cobertura de todas las grafías normalizadas.
- **Páginas 64–76:** tablas de declinación, pronombres y modelos regulares.
- **Páginas 77–78:** cuatro paradigmas irregulares **fero, eo, fio y volo**,
  con las seis personas y los tiempos disponibles del indicativo y subjuntivo.
  **sum** forma parte de los paradigmas ordinarios y se incluyen sus infinitivos.

Los textos de las páginas 8–17 permiten observar construcciones y
desambiguar formas, pero no se atribuye indiscriminadamente a todos sus
vocablos la condición de **formas subrayadas** o preguntas explícitas.

## Política de incorporación

Cada forma documentada se asocia a su enunciado **completo** y al
paradigma flexivo. No se agregan respuestas aisladas que sirvan únicamente
para superar la comprobación de cobertura. El esquema de Latín II
continúa sin unidades (`unit:0`).

El banco incorpora casos y números completos de sustantivos (incluidos
`puer, pueri`, `liber, libri`, `deus, dei` y `genu, genūs`),
grados y concordancias adjetivales, pronombres, participios de presente
y perfecto, modos indicativo y subjuntivo con ambos sistemas verbales,
e infinitivos. La ampliación mantiene los registros PAU previos sin
reemplazar enunciados aprobados.

Para los verbos deponentes, sus formas de perfecto incluyen de modo
inseparable el participio y la forma de `sum`, como
`profectus sum` (de `proficiscor`) o
`secutae erant` (de `sequor`).
`collata erant` procede de `confero`, no se analiza
`erant` como palabra independiente.

En formas sin contexto, el corrector mantiene **todos los análisis
morfológicos posibles**, incluidos `instituit` (presente o perfecto
de indicativo de `instituo`), `mitteris` (presente o futuro pasivo),
`feram` (futuro indicativo y presente subjuntivo) y `fiam`
(futuro indicativo y presente subjuntivo de `fio`).
El contexto latino, cuando se muestra, es el que permite seleccionar
el análisis sintácticamente pertinente.

## Verbos irregulares incluidos por completo

- `fero, ferre, tuli, latum`: seis tiempos del indicativo activo,
  cuatro del subjuntivo activo; además infectum pasivo, perfecto
  pasivo compuesto (indicativo y subjuntivo), infinitivos y
  participios de presente, perfecto y futuro.
- `eo, ire, ii (ivi), itum`: indicativo de seis tiempos y
  subjuntivo de cuatro, incluidas variantes clásicas
  `ii / ivi` y `ierunt / iverunt`; infinitivos.
- `fio, fieri, factus sum`: formas simples del infectum de
  morfología activa con **sentido pasivo/cambio de estado**; perfecto
  **compuesto** con `factus, -a, -um` + auxiliar, en indicativo
  y subjuntivo. No se genera un perfecto sintético inexistente.
- `volo, velle, volui`: las seis personas de los seis tiempos
  del indicativo y de los cuatro tiempos del subjuntivo, más
  infinitivos. No se le atribuye voz pasiva ordinaria.
- Se completan también los prefijados de `fero` con temas
  separados: `confero, contuli, collatum`,
  `refero, retuli, relatum`,
  `differo, distuli, dilatum`.

## Correcciones antes de incorporar

El PDF es un documento docente de referencia, **no una autoridad
automática para validar todas las casillas**. Las anomalías
detectadas se dejan documentadas en vez de reproducirlas:

| Página | En el PDF | Incorporado | Justificación |
| --- | --- | --- | --- |
| 22 | `comsumpserat` | `consumpserat` | Perfecto de `consumo, consumpsi, consumptum` |
| 50 | Ligadura `fl` perdida en extracción | `flumina` | Lectura cotejada de la página |
| 51 | `sensitur` | `sentitur` | Presente pasivo de `sentio` |
| 73 | `erint` (futuro de `sum`) | `erunt` | 3.ª plural del futuro |
| 74 | Celdas pasivas de 1.ª y 2.ª plural copiadas de la voz activa | Formas pasivas `-mur`, `-mini` | No copiar las erratas de columnas |
| 75 | `fuerunt` en subjuntivo perfecto de `sum` | `fuerint` | 3.ª plural del perfecto de subjuntivo |
| 77 | `volit` | `voluit` | 3.ª singular perfecto indicativo |
| 77 | `tulerunt` en futuro perfecto | `tulerint` | 3.ª plural del futuro perfecto |
| 78 | `tulissst` | `tulisses` | 2.ª singular del pluscuamperfecto de subjuntivo |

Fuentes adicionales para cotejo de los irregulares:
[National Archives, Latin grammar](https://www.nationalarchives.gov.uk/latin/stage-2-latin/resources/stage-2-latin-grammar-resource/),
[Allen & Greenough, Dickinson College Commentaries — fio](https://dcc.dickinson.edu/it/grammar/latin/irregular-verbs-f%C4%AB%C5%8D),
[OSU — fero](https://classics.osu.edu/Undergraduate-Studies/Latin-Program/Grammar/Paradigms/Irregular-Fero).
La proveniencia de tablas de UniMorph reutilizadas en el banco PAU
mantiene su atribución y licencia CC BY-SA 3.0 en el módulo original.

## Auditoría y pruebas

La construcción genera
`apps/morfologia/data/cuaderno-latin2-audit.json`, que compara
todas las grafías normalizadas con los **paradigmas de Latín II**.
Un `assert` bloquea la construcción si falta una forma.

`tests/morphology-cuaderno-latin2.test.mjs` comprueba marcas,
todos los irregulares y sus tiempos, correcciones del PDF,
homografías, declinación de participios y las **diez expresiones**
compuestas del nivel ε como verbos del lema correspondiente.

El banco ampliado no altera los repositorios originales
`Appendix-grammaticae`, `VocabulaLatinaGraecaque` ni
`GeneradorExamenes`. Solo se integra en ScholaClassica.
