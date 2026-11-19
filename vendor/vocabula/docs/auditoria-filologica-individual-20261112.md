# Revisión filológica individual del vocabulario — primera tanda

**Fecha:** 12 de noviembre de 2026  
**Alcance:** 13 fichas operativas de `data.js` sobre 2.055; Latín I general y examen y Latín de 4.º, sin modificar ningún identificador ni adscripción de unidad.

La auditoría anterior cotejó la **procedencia por unidades**. Esta segunda fase revisa **enunciados, traducciones y respuestas admitidas**. Se conserva la transcripción histórica del documento en `originals`, aunque contenga una errata, para no perder trazabilidad.

## Correcciones efectuadas

| Corpus | Lema | Antes en la web | Ahora en la web | Evidencia |
| --- | --- | --- | --- | --- |
| Latín I general | *dux, ducis (m.)* | «conducir» aceptado | «general» | El vocabulario de examen tiene «general»; Lewis & Short lo clasifica como sustantivo |
| Latín I general | *gens, gentis* | Género masculino | Género **femenino** | Lewis & Short y la entrada de UD4 |
| Latín I general | *magister* | «mæstro» se admitía junto a «maestro» | Solo «maestro» | Ortografía castellana |
| Latín I general | *importo* | «trær» | «traer» | Error ortográfico; Lewis & Short confirma la acepción de introducir/traer |
| Latín I general | *reduco* | «trær» | «traer» | Error ortográfico; se mantiene la acepción original |
| Latín I general | *impono* | «trær» | «poner encima», «imponer» | Lewis & Short: no significa «traer» |
| Latín I general | *ferme* | «aporximadamente» | «aproximadamente» | Error ortográfico |
| Latín I general | *cado* | «cær» | «caer» | Error ortográfico |
| Latín I general | *confero* | «refugiarse» | «reunir», «llevar juntos» | Lewis & Short: «refugiarse» es contextual en construcciones reflexivas (*se conferre*) |
| Latín I general y examen | *appello* | Comilla inicial duplicada | «llamar» | Error de transcripción, dos fichas |
| Latín 4.º general y examen | *vetus* | Traducción truncada «viejo…» | «viejo/a» | Misma palabra acreditada como «viejo/a» en otra unidad, dos fichas |

Hay **13 fichas modificadas** porque *appello* y *vetus* aparecen en ambas modalidades. Las correcciones de *dux*, *impono* y *confero* corrigen también el contenido filológico, no únicamente la ortografía, por lo que quedan explícitamente documentadas.

**Fuentes externas para las decisiones semánticas:**
- [Lewis & Short, *dux* (Classical Latin Dictionary, BBAW)](https://cld.bbaw.de/lemma/lat/dux)
- [Lewis & Short, *gens* (BBAW)](https://cld.bbaw.de/lemma/lat/gens)
- [Lewis & Short, *impono* (MPIWG)](https://thrax.mpiwg-berlin.mpg.de/mpiwg-mpdl-cms-web/lt/GetDictionaryEntries?dictionary=ls&inputType=lemma&language=lat&outputFormat=html&outputType=dictFull&query=impono)
- [Lewis & Short, *confero*](https://alatius.com/ls/index.php?l=confero)
- [Lewis & Short, *importo*](https://www.alatius.com/ls/index.php?l=importo)

## Pendientes que no deben corregirse automáticamente

1. **Latín I, UD7:** aparece `solis, –is (m.)` como enunciado del sustantivo «sol». Es probable que deba ser `sol, solis (m.)`, pero no se ha cambiado en esta tanda porque alteraría el lema respecto a la lista docente original y requiere registrar una excepción de procedencia.
2. **Latín I, UD4–9:** hay entradas del mismo lema con variantes de enunciado y traducción (por ejemplo, *silva*, *civitas*, *res*, *noster*). Las diferencias no implican necesariamente erratas: pueden ser acepciones válidas o convenciones de cada unidad.
3. **Griego I general:** las dos fichas de `ὑπέρ` tienen distinto régimen y grafías con diferente espíritu. Es preciso cotejar el enunciado, las construcciones y la correspondencia con las listas de examen antes de fusionarlas o reasignarlas; el documento general sigue siendo alfabético.
4. **Diferencias entre vocabulario general y examen:** se han localizado 47 grupos de lemas con traducciones o explicaciones distintas. No se han homogenizado a ciegas, porque hay glosas ampliadas, regímenes verbales y sinónimos perfectamente compatibles.
5. **Entradas adicionales del profesor:** la web puede incorporar fichas desde el servicio en línea. Este cotejo certifica únicamente el banco estático del repositorio; las ediciones del profesor conservan su propia procedencia.

## Garantías de regresión

`tests/fixtures/lexical-reviewed-corrections.json` registra identificador, transcripción original, corrección y justificación para cada ficha. `tests/check-lexical-corrections.cjs` impide que una regeneración vuelva a aceptar erratas o pierda la corrección, y verifica que ninguna transcripción original se borre.

Las pruebas anteriores de procedencia por unidades, opciones múltiples, filtrado estricto y navegador siguen siendo obligatorias antes de publicar.

**Limitación:** no se han verificado filológicamente una por una las 2.055 fichas. Este documento es el registro de una **primera tanda de 13**; no equivale a certificar todo el diccionario.
