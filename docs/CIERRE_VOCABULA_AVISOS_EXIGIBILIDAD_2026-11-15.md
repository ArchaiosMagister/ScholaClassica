# Cierre de reservas de Vocabula — avisos y listas de examen

**Fecha:** 15 de noviembre de 2026  
**Ámbito:** exclusivamente la copia de Vocabula integrada en ScholaClassica y la presentación del área docente. No se modifican el banco original ni el servicio Supabase.

## 1. Procedencia de los avisos desde «Todo el vocabulario»

**Incidencia anterior:** el backend `vocabulary` admite `mode = general | examen`, no `all`. El aviso genérico de la tercera opción se enviaba como `general` sin conservar la selección real. Un aviso abierto desde el diccionario combinado recuperaba una sola ficha mediante su ID y perdía las demás procedencias.

**Resolución:**

- El formulario identifica expresamente la selección «Todo el vocabulario». En los avisos genéricos, se conserva `mode=general` por compatibilidad con el backend, **pero el mensaje lleva una anotación explícita** «Selección: Todo el vocabulario (General y Examen)» y las unidades marcadas.
- En los avisos relativos a una ficha combinada, se identifica su registro representativo (`entry_id`) y se registran en el mensaje las procedencias de cada ficha original: General/Examen, sus unidades diferenciadas y sus IDs. El diccionario utiliza la ficha visible combinada, sin perder las fuentes al pulsar «Señalar un error».
- Los informes enviados o almacenados sin conexión comparten la **misma construcción y validación del mensaje**; el límite de 2000 caracteres se respeta sin truncar lo escrito por el alumno. La cola local sigue guardando solamente campos admitidos por el backend.
- En la bandeja de ScholaClassica, la modalidad se presenta como «Todo el vocabulario · General y Examen» al reconocer esta anotación. El registro persistente sigue usando uno de los dos valores admitidos; **no se ha añadido una modalidad a la base de datos**.
- General y Examen independientes mantienen su semántica y sus avisos anteriores no se reescriben. La anotación en el mensaje sirve como información docente y **no representa una acreditación curricular**.

## 2. Auditoría de unidades sin listas específicas de examen

Fuente: `ArchaiosMagister/VocabulaLatinaGraecaque@0e16505b7631298a0448c4160a5d258f82732bfe`, `data.js` fijado por el lock de ScholaClassica. Se han contado las **fichas originales** y las etiquetas literales, no formas flexivas ni posibles lemas derivados.

| Curso | General | Examen | Último grupo acreditado en Examen | Sin lista específica de examen |
| --- | ---: | ---: | --- | --- |
| Latín I | 741 | 115 | UD7 (15 fichas etiquetadas) | UD8, UD9 y UD10 |
| Griego I | 332 | 171 | UD10 (10 fichas etiquetadas) | UD11, UD12, UD13 y UD14 |

### Distribución literal de las fichas de Examen

| Latín I | Fichas | Griego I | Fichas |
| --- | ---: | --- | ---: |
| UD1 | 23 | Palabras básicas | 11 |
| UD2 | 18 | Preposiciones | 11 |
| UD3 | 12 | UD1–4 | 29 |
| UD4 | 21 | UD5 | 39 |
| UD5 | 19 | UD6–7 | 28 |
| UD6 | 9 | UD8 | 30 |
| UD7 | 15 | UD9 | 14 |
| — | — | UD10 | 10 |

Los recuentos por grupo no deben sumarse sin examinar las coincidencias de adscripción. La existencia de contenidos de gramática o vocabulario **General** para una unidad no autoriza a declarar exigible ese material.

**Decisión de seguridad curricular aplicada:** conservar exactamente las listas de General y Examen y sus IDs; no crear listas ficticias ni trasladar entradas de General a Examen. En el selector de Examen se indica discretamente que las últimas unidades no tienen lista específica incorporada. Si el profesor aporta listados para esas unidades, su incorporación exigirá otra decisión docente y una conciliación separada.

## 3. Verificaciones exigidas

- Modelo puro: modo compatible con Supabase, anotación de procedencia, IDs, unidades, acepciones y límite exacto del mensaje.
- Navegador: aviso genérico en Todo; aviso de `flumen` desde diccionario Todo con sus dos orígenes; ausencia de cambio para avisos de General.
- Modo offline: avisos combinados y ordinarios guardados localmente y reenviados con su contexto intacto.
- Área docente: etiqueta diferenciada sin modificar la modalidad guardada.
- Integración general: tests del banco de 2.055 fichas, modos General/Examen/Todo, validaciones de backend y PWA, aislamiento de cachés y despliegue.

**Estado:** incidencias funcionales de procedencia resueltas; huecos de exigibilidad **auditados y explícitamente reservados** hasta que existan listas docentes. Esto evita llamar corrección a una asignación curricular no acreditada.
