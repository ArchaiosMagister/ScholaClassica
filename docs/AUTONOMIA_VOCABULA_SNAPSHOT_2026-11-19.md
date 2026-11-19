# Autonomía de Vocabula en ScholaClassica · 19/11/2026

## Objetivo
Desvincular la compilación de ScholaClassica del repositorio externo
`ArchaiosMagister/VocabulaLatinaGraecaque`, preservando el motor, las fichas, IDs,
listas General y Examen, unidad/procedencia, personalización integrada, progreso local,
la PWA y el área de profesor. No modificar el original.

## Snapshot original completo
- Commit de origen: `a7be2161a2401816ede78a96981daaac6850b8d2`.
- Árbol Git del origen: `4d801fa31917dc177ce248eff162a9ad545fae7a`.
- Árbol Git de `vendor/vocabula`: **idéntico**, comprobado en la importación.
- **130 archivos**, **1.903.396 bytes**, incluidos banco completo `data.js`,
  motores de práctica, tests, documentación, recursos auxiliares, SQLite/SQL de
  referencia cuando existan, assets PNG/ICO/SVG y archivos ocultos.
- Importación única realizada por una acción temporal que **eliminó su propio
  workflow con permiso de escritura** antes de confirmar la copia.

## Independencia real
- `scripts/build.mjs` utiliza `vendor/vocabula`; rechaza explícitamente
  `VOCABULA_SOURCE`, y verifica el árbol Git y los 130 blobs antes de compilar.
- Los workflows de integración y auditoría independiente LEMLAT3 no clonan Vocabula.
- `audit:vocabula:vendor` registra la integridad, IDs preservados en la fuente,
  número de archivos, bytes y el banco original, archivado en Actions fuera de Pages.
- Las dos pruebas originales del léxico se ejecutan directamente dentro de
  `vendor/vocabula`; la batería general conserva los tests del alumnado,
  60 sesiones de Vocabula en Chromium, PWA offline, progreso, catálogos, gramática
  y área docente.
- Las adaptaciones filológicas de ScholaClassica continúan ocurriendo exclusivamente
  en `dist/apps/vocabulario`. No se alteran los archivos fuente originales.
- `sources.lock.json` registra los árboles internos de Appendix y Vocabula.
  **Evolutio continúa dependiendo de su checkout original**.

## Publicación y retiro
La PR no borra ni archiva ningún repositorio original. El éxito de compilación
**no** demuestra por sí solo que las URL del Vocabula antiguo, sus PWA instaladas,
los enlaces del alumnado ni un eventual backend antiguo puedan retirarse.
Mantener el original hasta realizar un inventario de URL/PWA, backup restaurable,
transición de usuarios y autorización docente **separada** para archivar.
GeneradorExamenes continúa siendo una aplicación independiente.
La versión valenciana de Evolutio continúa aplazada.

## Control de regresiones
La fusión/publicación sólo es aceptable con ejecución satisfactoria del workflow
completo y de los recorridos del navegador, PWA, contraste de fuentes, protección
de identidad y datos académicos. Si CI falla, no publicar.
