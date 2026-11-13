# Práctica de morfología — primera fase académica

## Objetivo

Crear ejercicios propios de ScholaClassica sin heredar el antiguo repaso morfológico de Vocabula ni incorporar formas no verificadas procedentes de diccionarios externos. **No se modifican** Appendix, Vocabula, Evolutio, Palabra del día ni GeneradorExamenes.

El banco inicial se compila a partir del archivo `assets/curriculum.json` del commit fijado de Appendix (`config/sources.lock.json`). No se generan paradigmas por analogía; el compilador extrae literalmente las formas y las desinencias de tablas identificadas por tema y título. Si desaparece una tabla o cambia su estructura, el build debe **fallar**.

## Cobertura comprobable

| Materia | Unidades habilitadas | Tablas importadas | No incluidos |
| --- | --- | --- | --- |
| Latín I | UD1–UD2 | `rosa`, `dominus`, `bellum`; presente activo de las cuatro conjugaciones, mixta y `sum`; imperfecto activo | Pasiva de UD3 y siguientes, tercera declinación, adjetivos |
| Griego I | UD1–UD3 | Terminaciones de segunda declinación masculina y neutra; presente de `εἰμί` y `λύω`; artículo | Flexión completa de sustantivos no atestiguados, primera declinación con sus variantes, formas posteriores |

Los sustantivos latinos se muestran con formas completas cuando el Appendix ofrece paradigmas completos. Cuando el Appendix solo ofrece **desinencias** griegas, se practican únicamente esas desinencias: no se reconstruyen sustantivos enteros.

El artículo griego aparece solo desde UD3. La selección de unidad es **acumulativa** y solo muestra los niveles que tienen fichas documentadas. No se ofrecen los niveles posteriores como si ya tuvieran una base validada.

## Evidencia de cada ficha

En el archivo generado `apps/morfologia/data/paradigmas.json` figuran:
- Commit SHA exacto del Appendix consultado.
- Unidad, tema y título de la tabla fuente.
- Tipo de paradigma y formas con análisis gramaticales.
- Marca técnica `paradigma-documentado`.

Esta marca significa que la **tabla curricular** contiene las formas. **No equivale a una verificación individual de cualquier forma generable** ni demuestra que todo el léxico de Vocabula esté revisado. La importación falla ante cambios estructurales de tablas para evitar regresiones silenciosas.

## Modalidades y criterios de corrección

1. **Elegir la forma correcta.** Se pregunta por caso y número, o por persona, número y tiempo, y se presentan distractores seleccionados exclusivamente entre formas distintas del mismo paradigma.
2. **Analizar una forma.** Se muestra una forma y deben reconocerse todas sus características morfológicas. Cuando una misma forma corresponde a diversos casos o números, se agrupan **todos** los análisis atestiguados, sin presentar uno de ellos como la única respuesta válida.

Se corrige en la propia página, se indica el resultado de la tanda y se enlaza a la unidad de Appendix correspondiente para consultar la explicación. No se almacenan notas ni respuestas en servidores y no hay solucionario docente independiente.

## PWA, límites y pruebas

El módulo tiene service worker y caché propios (`schola-morphology-`) con alcance `/apps/morfologia/`. No intercepta navegación hacia Appendix, Vocabula, Evolutio ni Etymologicon y solo borra sus propias versiones anteriores. Las preguntas y el banco se pueden abrir offline una vez que se han cargado los recursos correctamente.

Las pruebas incluyen recompilación desde el currículo fijado, comprobación de unidades, rechazo de niveles aún no disponibles, corrección de casos sincréticos, rutas reales de GitHub Pages, comprobación en Chromium de las dos modalidades y lectura del banco sin conexión.

**Fase siguiente recomendada:** ampliar Latín I a UD3 (pasiva y personales), Latín I a UD4 (tercera declinación y sistema de perfecto) y Griego I a UD3 (primera declinación con variantes y concordancia del artículo). Cada ampliación requerirá datos inequívocos y controles específicos de sincretismo, acentuación y orden del artículo, antes de habilitar sus ejercicios.
