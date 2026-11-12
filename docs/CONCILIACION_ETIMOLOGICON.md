> **Conciliación posterior (2026-11-12):** el Excel docente ya se ha incorporado. Consulta [ETIMOLOGICON_BANCO_CONCILIADO.md](ETIMOLOGICON_BANCO_CONCILIADO.md). El texto inferior documenta exclusivamente el estado preliminar, previo a recibir el archivo.

# Etymologicon · conciliación académica, fase 1

**Fecha:** 12 de noviembre de 2026  
**Destino:** ScholaClassica, sin tocar otros repositorios y sin publicación.

## Fuente preservada

Se ha extraído, sin modificar, el literal `greekEtymologyUnits` de `GeneradorExamenes/index.html` en el commit \`ae96718559e6ce6a6f2216dced7ea47c71ec48b0\`. El archivo `source/gr1-generador.snapshot.json` conserva las 12 unidades y las 117 apariciones originales.

La importación se ha normalizado provisionalmente en 111 étimos, 196 formas castellanas distintas y 212 relaciones étimo–derivado distintas, incluyendo relaciones de apariciones posteriores de un mismo lema.

**Importante:** todos esos registros están en `pending_review` y ninguna relación está habilitada como respuesta de ejercicios. No se han inventado significados griegos, definiciones, variantes ni citas del DLE.

## Conciliación cuantitativa

| Concepto | Fuente GeneradorExamenes (todos los registros) | Auditoría docente declarada |
|---|---:|---:|
| Étimos únicos | 111 | 111 |
| Étimos con dos derivados en la primera ficha del generador | 105 | 108 elegibles |
| Derivados distintos con grafía registrada | 196 | 201 admitidos |
| Relaciones únicas étimo–derivado | 212 | No se aportó cifra equivalente |

Los recuentos de **196/212** preservan todas las filas de unidades repetidas. Si se aplicara la lógica actual del generador que conserva únicamente la primera lista no vacía por étimo, el recuento sería **195 derivados distintos y 211 relaciones**: el derivado *ginecólogo* de \`γυνή, γυναικός\` en UD10 quedaría omitido. Por eso este inventario no descarta relaciones posteriores.

La auditoría docente de 111 étimos, 108 elegibles y 201 derivados, descrita previamente en otra conversación, aún no está disponible aquí como inventario individual accesible. Las diferencias de **3 étimos elegibles** y **5 formas castellanas** no se resuelven inventando entradas ni marcando automáticamente como aprobado lo existente.

## Pendientes concretos

- **Sin dos derivados en la fuente:** δῶρον, δίκη, πρός, παιδίον, ἀτέλο− y γένειον (esta última tiene *genioplastia*). No implica que sean étimos incorrectos ni su exclusión definitiva de todos los tipos de actividad.
- **Grafías griegas a cotejar:** la fuente todavía contiene \`θέος\`, \`φοβός\`, \`ψευδός\` y \`πρόκτος\`; la auditoría anterior mencionó correcciones editoriales a \`θεός\`, \`φόβος\`, \`ψευδής\` y \`πρωκτός\`. Se conservan las grafías originales en \`sourceSpellings\` sin aceptarlas como variantes.
- **Lemas combinados:** \`γράφω | γράμμα\`, \`σοφός | σοφία\`, \`ἀρχή | ἄρχω\` y otros necesitan decidir si se modelan como étimos independientes relacionados; el normalizador del generador usa solo el primer miembro como clave de agrupación.
- **Clasificación etimológica:** determinar relaciones directas e indirectas, casos de composición griega, tecnicismos y nombres propios antes de habilitar la escritura de dos derivados.
- **Definiciones y variantes:** incorporar texto didáctico original con fuente DLE o alternativa acreditada para cada derivado. No se ha realizado aún esa comprobación léxica.

## Archivos y separación de responsabilidades

- `source/gr1-generador.snapshot.json`: evidencia inmutable de las 117 entradas extraídas.
- `candidates/*.json`: normalización técnica trazable, **no** banco de respuestas aprobado.
- `courses/gr1.json`: asignación de unidades procedente del generador (pendiente de cotejo editorial).
- `courses/gr2.json`: selector previsto; banco vacío y no disponible para alumnos.
- `editorial/decisions.json`: capa destinada a decisiones aprobadas. Permanece vacía para no suponerlas a partir de recuentos.
- `model-v1.schema.json`: contrato de aprobación y trazabilidad para entidades, definiciones y relaciones.
- `audit/reconciliation.json`: cifras, diferencias y condiciones que impiden publicar.

**No se debe editar ningún fichero de candidatos para aprobar respuestas.** Las decisiones docentes se incorporarán en un registro editorial separado, inmutable por la reconstrucción de candidatos. Una aplicación futura deberá leer un catálogo aprobado compilado con estas decisiones; nunca el directorio `candidates/` como solucionario.

## Criterios de aceptación de la siguiente etapa

1. Recuperar el inventario auditado completo (étimos, derivados, exclusiones y variantes) para una comparación por identificador, no solo por totales.
2. Resolver cada diferencia con decisión filológica explícita; registrar evidencias y fuentes.
3. Obtener exactamente el inventario aprobado o documentar cualquier cambio autorizado de cifras.
4. Generar un catálogo **cerrado y verificable** destinado al corrector, sin incluir relaciones en revisión.
5. No publicar Etymologicon ni modificar GeneradorExamenes hasta superar las auditorías específicas y las pruebas de regresión.

Esta fase no implementa la interfaz, el corrector, la transliteración ni la PWA.

