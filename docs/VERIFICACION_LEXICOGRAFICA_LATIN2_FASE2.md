# Latín II — LEMLAT 3.0 como segundo cotejador independiente

**Estado:** segunda fase de auditoría técnica en la PR 68; no es una habilitación académica del sorteo, no implica publicación ni una nueva certificación de flexiones.

## Alcance

La fase 1 compara 22.049 análisis individuales de Latín II con UniMorph Latin. El segundo cotejador selecciona los análisis de prioridad P0 y P1 (grafías procedentes de PAU CV y/o cuaderno docente) y envía las **grafías simples distintas** a LEMLAT3. Las distintas lecturas de una grafía siguen distinguiéndose al cotejar las respuestas del banco; no se interpretan expresiones como `amatus est` como un lema aislado.

La preparación inicial del lote produjo **1.162 análisis P0/P1**, **463 grafías simples** y **28 análisis de expresiones compuestas**, que quedan expresamente fuera de esta etapa (datos de preparación, no resultado de cotejo).

## Fuentes y ejecución

- UniMorph Latin: `unimorph/lat` en `050924c9f013e6aba4d7c87be243a1d79b6c5b10`; corpus derivado de Wiktionary; licencia CC BY-SA 3.0.
- LEMLAT3: `CIRCSE/LEMLAT3` en `e8328948fb4b9b73b625aeda3639137c5e49a1ff`; licencia CC BY-NC-SA 4.0, fuente desarrollada de forma separada de UniMorph.
- El código y los datos de LEMLAT no entran en la PWA ni en `dist/`; se descargan en el entorno aislado de GitHub Actions para auditoría.
- Flujo separado: `.github/workflows/lexicografia-lemlat3.yml`. No tiene despliegue; la publicación ordinaria sigue ligada a `main` tras validaciones.
- Preparación: `node scripts/lemlat3-latin2.mjs prepare`. Resultado: fichero de formas, manifiesto con revisión y contadores.
- Análisis: ejecutable original de LEMLAT, salida **XML** nativa en ISO-8859-1. No se toma una lista de lemas como sustituto de análisis flexivos.
- Conversión: `node scripts/lemlat3-latin2.mjs convert`; salida JSONL con `source`, `revision`, `reference` (ID de lema, análisis y flexión), `nativeFeatures`, `tagset`, `lemma`, `form` y `features`.
- Cotejo: `npm run lexicografia:lat2 -- --independent build/academic-audits/latin2-lexicon/lemlat-evidencias.jsonl`.

## Límites filológicos

1. LEMLAT analiza **tipos**, no desambigua automáticamente palabras en contexto. Las lecturas homógrafas se conservan como alternativas.
2. Se conservan los códigos nativos `codmorf` y `morphological_feats` de LEMLAT. El adaptador traduce únicamente valores documentados a etiquetas comparables; no se supone que un rasgo ausente esté avalado.
3. Las fuentes solo se consideran concordantes cuando los **mismos rasgos pertinentes** encuentran respaldo independiente en ambas (al menos dos dimensiones cotejadas). Múltiples salidas de la misma fuente no constituyen varios testimonios.
4. La comprobación automática de morfología **no es una prueba de atestiguación en autores**, ni una validación filológica individual. Las discrepancias requieren contraste específico y no invalidan el banco.
5. La primera etapa no cubre los 7.307 análisis globales de expresiones compuestas de la fase 1; el conteo de 28 corresponde solo al subconjunto prioritario.
6. Si la ejecución del programa externo falla o el conjunto de evidencias resulta vacío, **no se atribuyen dos fuentes** ni se altera el banco.

## Seguridad del programa externo

La utilidad original de LEMLAT3 usa en `parseCLI.c` búferes de longitud fija (80 bytes) para las rutas pasadas con `-i` y `-x`. El flujo evita rutas largas: copia el lote a `input.txt`, solicita salida `result.xml` en el mismo directorio y luego copia el XML al área aislada. Esto evita el desbordamiento de memoria con rutas extensas de GitHub Actions.

La ejecución del binario embebido depende de bibliotecas de MariaDB; el flujo las instala en un ejecutor Linux específico. **La ejecución debe verificarse mediante GitHub Actions antes de dar por obtenidos resultados del segundo cotejo.**

## Informes

Los artefactos docentes, con retención limitada, se archivan en `build/academic-audits/latin2-lexicon/` y se adjuntan en la ejecución de la PR. Incluyen `lemlat-manifest.json`, `lemlat-resumen.json`, `lemlat-evidencias.jsonl`, `resumen.json`, `evidencias.ndjson` y `revision-prioritaria.tsv`. No se incorporan a la web del alumnado.

## Procedencia

- https://github.com/CIRCSE/LEMLAT3
- https://github.com/CIRCSE/LEMLAT3/wiki
- https://github.com/unimorph/lat
- https://github.com/ArchaiosMagister/ScholaClassica/pull/68


## Resultado de la primera ejecución completa con dos fuentes (14-11-2026)

Ejecución **satisfactoria**: https://github.com/ArchaiosMagister/ScholaClassica/actions/runs/43593474252

- Lote P0/P1: 1.162 análisis; 1.134 análisis de formas simples; 28 análisis de compuestos reservados.
- LEMLAT3: 463 grafías simples distintas; 461 reconocidas, **dos sin resultado** (`duos`, `segestae`); 693 análisis nativos y 2.097 filas de evidencia con lema.
- Cobertura de los análisis prioritarios: 980 con alguna evidencia LEMLAT3; 603 con evidencia UniMorph, sin que ambas cifras deban sumarse por existir solapamiento.
- Clasificación P0/P1: 481 acuerdos documentales de dos fuentes (no testimonio textual); 589 coincidencias parciales; 4 discrepancias pendientes; 53 lemas fuera de cobertura; 7 formas no halladas bajo lema conocido; 28 análisis compuestos pendientes. **Suma: 1.162.**
- Sobre el banco completo (22.049 análisis): 481 acuerdos entre fuentes; 4.307 coincidencias parciales; 153 discrepancias pendientes; 1.593 lemas fuera de cobertura; 8.208 formas no halladas bajo lema conocido; 7.307 análisis compuestos.
- El ejecutable original pudo ejecutarse tras emplear nombres cortos de archivos en lugar de rutas largas y la biblioteca adecuada de MariaDB.
- Ninguna casilla pasó automáticamente a `individualmenteVerificada`. No se introducen alteraciones de preguntas ni habilitaciones del sorteo.

### Cuatro análisis prioritarios que requieren contraste filológico

1. `segestae` de **Segesta**: nominativo plural femenino.
2. `segestae` de **Segesta**: vocativo plural femenino.
3. `nonnullae` de **nonnullus, -a, -um**: genitivo singular femenino.
4. `nonnullae` de **nonnullus, -a, -um**: dativo singular femenino.

En `nonnullae`, UniMorph solo ofrece las lecturas nominativo/vocativo plural femenino, mientras que LEMLAT analiza la grafía con otro lema `non-nullus` (no coincide sin una regla justificada de equivalencia lematizada). La falta de estas lecturas en los recursos no invalida por sí sola los genitivos y dativos previsibles por el paradigma regular. En `segestae`, UniMorph solo aporta genitivo/dativo/locativo singular y el ejecutable LEMLAT3 no la reconoce; la pertinencia de pluralizar un topónimo normalmente singular requiere criterio filológico independiente de la mera desinencia morfológica.

No se han corregido ni excluido estas cuatro casillas de oficio.
