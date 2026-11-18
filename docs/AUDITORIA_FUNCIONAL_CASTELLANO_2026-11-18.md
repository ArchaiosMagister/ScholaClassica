# Auditoría funcional en castellano · Inicio y matriz de regresión (18/11/2026)

## Objetivo y estado

Prioridad docente actual: **estabilizar todos los módulos de ScholaClassica en castellano** y, después, hacer que el repositorio sea autónomo antes de archivar o borrar fuentes originales. La versión valenciana de Evolutio queda aplazada; se preservan sin fusionar los avances de las PR #45, #46, #119, #122 y #123.

**Base auditada:** \`main\` a \`09f533e8d45da5e5cee4ce0b0e17be17818c1db2\`. La ejecución de GitHub Actions del 17/11/2026 \`44038131170\` completó con éxito validación, navegación Chromium, compilación y publicación. **Una batería verde no certifica que todas las combinaciones de la aplicación estén libres de errores**: el objetivo de esta PR es eliminar puntos ciegos relevantes, no declarar un resultado universal sin pruebas.

Esta PR es **exclusivamente de auditoría**: no cambia ningún motor académico, contenido de alumnado, lógica de morfología, bancos, identidad, datos de Supabase ni configuración de Pages. La rama parte directamente de \`main\`; no introduce dependencias de la versión valenciana. No fusionar ni publicar hasta revisar resultados.

## Cobertura antes y después de la primera tanda

| Componente | Pruebas preexistentes en \`main\` | Riesgo descubierto | Nueva comprobación |
|---|---|---|---|
| Portal | Elección de curso, rutas, tema, PWA offline y cachés, Chromium | El buen funcionamiento de la portada no prueba todas las sesiones | Se conserva batería existente; sin cambios funcionales |
| Appendix castellano | Unidades y apartados de Latín I, Latín 4.º, Griego I, sintaxis Latín II, navegación y caché | El código sigue importado desde otro repo; no autónomo | Se registra origen en el inventario para retirada segura |
| Vocabula | Selección de UD, corpus General/Examen/Todo, procedencias, progreso, avisos simulados, offline y navegación | Faltaba matriz **completa** de cursos × corpus × actividades; se podía pasar una UI que no generara ejercicios para ciertos filtros | **4 cursos × 3 corpus × 5 actividades = 60** sesiones reales, verificadas por Chromium tras marcar unidades; registro JSON |
| Morfología | Latín I, Latín II, Latín 4.º, Griego I; unidades, acuerdos, sintagmas, formas, escritura, offline | Gran cantidad de combinaciones curriculares; no se confunde la prueba por curso con una verificación de cada paradigma | Se conserva CI y auditoría curricular de 32 unidades y 73 epígrafes; próximos bloques de cobertura por combinaciones |
| Evolutio castellano | Tests del repo original, copia y dificultad integradas, arranque y PWA offline | Faltaba recorrido real de **respuesta castellana → normas → resultado**, más revelación y modo focalizado | Búsqueda \`uitam → vida\`, respuesta correcta obtenida del banco integrado, identificación de normas reales, resumen, tres errores y revelación sin acierto, foco SONOR en modo ciego |
| Etymologicon | Banco léxico, corrección, tarjetas, emparejamientos, test, inversión, descomposición, progreso exportado/importado, accesibilidad y offline | Riesgo residual: combinaciones exhaustivas por unidad/actividad no alcanzadas por un test de humo | Pruebas existentes de navegación extremadamente amplias; próximas ampliaciones solo si se detectan huecos concretos |
| Área docente | Supabase, AAL2/TOTP, autorización, bandeja, aislamiento y pruebas Chromium | El éxito del entorno de pruebas no debe confundirse con acceso real de un usuario | Mantener controles; no tocar secretos ni ejecutar altas |

**Informes reproducibles** generados por CI en \`build/academic-audits/castellano/\` (no se incluyen en el sitio de alumnado):
- \`vocabula-matriz-funcional.json\`: resumen de las 60 sesiones y tamaño del vocabulario tras los filtros.
- \`evolutio-flujo-funcional.json\`: recorrido guiado corregido, tres intentos, modo focalizado a ciegas.
- \`dependencias-originales.json\`: estado de autonomía para retirada de originales.

Se archivan en GitHub Actions como \`scholaclassica-auditoria-funcional-castellano\` exclusivamente para revisión docente. Los nuevos comandos son \`npm run test:browser:castellano:vocabula\`, \`npm run test:browser:castellano:evolutio\` y \`npm run audit:repositorios:retirada\`.

## Dependencia de repositorios originales: prohibido borrar todavía

La compilación de \`main\` usa \`config/sources.lock.json\`, obtiene repositorios originales mediante Actions y copia ficheros desde \`.sources/\`:

| Repositorio | Commit incorporado | Construcción autónoma | Situación |
|---|---|---|---|
| \`ArchaiosMagister/Appendix-grammaticae\` | \`6e9ae22d98c10f8752329d0fa65ad8dd882dcde9\` | **NO**: \`scripts/build.mjs\` copia gramática y adapta cursos | Mantener; primer candidato a sustituir por fuente interna versionada |
| \`ArchaiosMagister/EvolucionFonetica\` | \`901dacb125ee7894ea9d11faf7b0d0afa7e713b5\` | **NO**: copia el motor y el banco, adapta dificultad y service worker | Mantener; segundo candidato |
| \`ArchaiosMagister/VocabulaLatinaGraecaque\` | \`a7be2161a2401816ede78a96981daaac6850b8d2\` | **NO**: depende de scripts, banco y contrato de administración | Mantener; retirar más tarde tras verificar banco y backend |
| \`ArchaiosMagister/GeneradorExamenes\` | Integración funcional futura; \`integrated=false\` | Aplicación **independiente por decisión docente** | Mantener sin fusión |
| \`Examinator2\`, \`cuadernotextoslatinos\`, \`Palabra-del-dia\` | No forman parte de estos tres checkouts | Aplicaciones de uso diferenciado | No considerarlas redundantes |

El auditor automático **debe impedir conclusiones falsas**: comprueba que cada código original requerido por \`scripts/build.mjs\` también tenga un checkout del mismo SHA en el workflow. No archiva ni borra por sí mismo.

## Condiciones de retirada de Appendix, y luego de los otros

1. Congelar una copia verificable del código fuente de Appendix dentro de ScholaClassica, **incluyendo licencias, fuentes de datos y activos**, sin sustituirla por solo HTML de \`dist\`.
2. Cambiar el compilador para trabajar desde esa fuente interna, con los mismos adaptadores y resultados. No cambiar simultáneamente los contenidos docentes.
3. Eliminar el checkout de Appendix del workflow, ejecutar desde un entorno **sin clon de Appendix**, comparar hash/archivos esenciales del resultado y ejecutar toda la CI (Node + Chromium + rutas Pages + offline).
4. Revisar qué URLs antiguas, enlaces y PWA instaladas seguirán funcionando o exigirán una transición explícita; disponer de copia de seguridad restaurable.
5. Solo después, **archivar** el original como paso reversible. El **borrado definitivo** requerirá otra revisión, backup y autorización expresa. Un repo archivado sigue existiendo y no significa autónomamente que sus Pages o PWA dejen de ser usados.

**Próxima secuencia de trabajo tras esta PR:** resolver las incidencias reproducidas en castellano, completar matrices curriculares de Morfología, cerrar auditoría de navegación de Appendix, y luego preparar una PR independiente de **autonomía de Appendix**. No fusionar repositorios originales con otros proyectos personales ajenos a la plataforma de alumnado.
