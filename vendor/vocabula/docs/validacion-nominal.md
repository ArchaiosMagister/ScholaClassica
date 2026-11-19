# Cotejo automático de flexiones nominales latinas y griegas

## Objetivo

Ampliar la cobertura de los lemas de los vocabularios de clase sin incorporar automáticamente formas mal identificadas. La fase actual compara **sustantivos y adjetivos** de Wiktextract/Wikcionario con los registros UniMorph ya utilizados en la web.

La comparación utiliza el **lema, categoría léxica, caso, número y (para adjetivos) género**. Se excluyen automáticamente los duales, etiquetas de variantes no reconocidas, casillas sin información suficiente, homónimos entre categorías, paradigmas con contradicciones y posibles respuestas con múltiples formas incompatibles.

## Resultados reales del primer cotejo (10 de noviembre de 2026)

| Indicador | Latín | Griego antiguo |
|---|---:|---:|
| Paradigmas compatibles con suficientes casillas explícitas | 322 | 84 |
| Casillas concordantes | 4.872 | 784 |
| Casillas ausentes en el índice UniMorph, propuestas para validar | 124 | 69 |
| Paradigmas con contradicción en casillas compartidas | 3 | 16 |
| Entradas sin casillas cotejables en UniMorph | 11 | 70 |

Las 193 casillas adicionales **no son todavía respuestas publicadas ni se consideran aprobadas**.

## Segunda comprobación de formas regulares

La integración con un modelo **independiente** de [Collatinus](https://github.com/biblissima/collatinus) (revisión fijada `e1fef78818b5c5f8e7f9754cf58f50062b30abff`, licencia GPL-3.0) ha confirmado **40 adjetivos latinos de tres terminaciones** para genitivo y dativo singular femenino: **80 casillas**. De los 62 adjetivos propuestos por el primer cotejo, 13 tenían un enunciado docente que no correspondía a este tipo de adjetivo (por ejemplo, nombres propios) y 9 no tenían un modelo cotejable; se excluyen. 

Para los sustantivos griegos, el genitivo y el nominativo recogidos en UniMorph permiten contrastar los dativos propuestos con **reglas regulares explícitas de primera, segunda y tercera declinación**. Han encajado **63 de 69**; seis casos, en especial masculinos de primera declinación, quedan fuera de esta versión de las reglas y necesitan tratamiento especial.

Ambos resultados permanecen etiquetados **PENDIENTES DE PUBLICACIÓN EN CLASE** mientras se comprueban la unidad curricular y las posibles duplicaciones con el banco existente. Los archivos `data/collatinus-verified-adjectives.json` y `data/greek-regular-datives.json` se generan como artefactos técnicos en GitHub Actions; no se cargan en `gramatica.html`. Las cifras de concordancia tampoco equivalen a paradigmas completos o a un porcentaje global de cobertura.

**Limitación importante: las fuentes no son totalmente independientes.** El latín de UniMorph procede de Wikcionario inglés, como Wiktextract; un mismo error editorial puede estar presente en ambos índices. Por tanto, la concordancia entre ellos solo permite una **comprobación de consistencia**, no una certificación filológica.

Para admitir formas nuevas en la autocorrección se necesita una tercera fuente independiente o un generador bien caracterizado con los datos léxicos necesarios, especialmente cuando hay irregularidades o variantes.

## Funcionamiento

1. `scripts/import_wiktextract_candidates.mjs` extrae candidatos en streaming sin alterar la aplicación de alumnos. Desde esta fase se guardan también todas las etiquetas originales en `raw_tags`, con objeto de no confundir positivos, comparativos, dialectos o variantes.
2. `scripts/crosscheck_wiktextract_nominals.mjs` recorre las partes UniMorph y coteja las casillas explícitas de cada lema. El informe JSON resultante identifica por separado acuerdos, contradicciones y formas que requieren otra comprobación.
3. `tests/check-wiktextract-crosscheck-fixtures.mjs` introduce ejemplos sintéticos de coincidencia, contradicción y homonimia para garantizar que un dato dudoso nunca supera el filtro.
4. `tests/check-wiktextract-crosscheck.mjs` comprueba la consistencia del informe obtenido del corpus real y que **ningún candidato se haya incorporado a `gramatica.html`**.
5. `.github/workflows/import-wiktextract-candidates.yml` ejecuta automáticamente el cotejo de los dos idiomas y guarda los resultados como artefactos de Actions, pero no los publica como soluciones.

## Cómo consultar y reproducir

En la [pull request de esta fase](https://github.com/ArchaiosMagister/VocabulaLatinaGraecaque/pull/5) y la sección **Actions → Preparar candidatos Wiktextract sin publicar respuestas** se pueden consultar los resultados y descargar los informes técnicos.

```sh
node scripts/import_wiktextract_candidates.mjs grc
node scripts/crosscheck_wiktextract_nominals.mjs grc
node tests/check-wiktextract-crosscheck.mjs grc

node scripts/import_wiktextract_candidates.mjs lat
node scripts/crosscheck_wiktextract_nominals.mjs lat
node tests/check-wiktextract-crosscheck.mjs lat
```

Las formas candidatas conservan los enlaces de procedencia y no se usan en la página de clase. Los datos Wikcionario/Wiktextract requieren atribución CC BY-SA 4.0. UniMorph conserva su licencia CC BY-SA 3.0 y sus revisiones fijadas en el manifiesto.

## Próxima etapa

Incorporar y evaluar por separado una fuente realmente independiente (Collatinus para latín; generador griego con temas verbales identificados y un repertorio nominal contrastable para griego). Solo las formas que superen los controles podrán alimentar la autocorrección. La finalidad es aumentar el número de **lemas de tu vocabulario** que cuentan con paradigmas, no multiplicar indiscriminadamente formas de modelos ya cubiertos.
