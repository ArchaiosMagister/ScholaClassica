# Sincronización controlada de Appendix · 16/11/2026

## Alcance
- Origen: `ArchaiosMagister/Appendix-grammaticae`.
- Revisión previa: `4c89f9b032e356f033f507eafbb66b49d6bb6761`.
- Revisión fijada nueva: `6e9ae22d98c10f8752329d0fa65ad8dd882dcde9` (main del 16/11/2026).
- Dos commits posteriores y diez archivos de origen modificados: `assets/search-data.json`, `assets/style.css`, `conjunciones.html`, `scripts/validate-site.mjs`, `sintaxis.html`, `subordinadas.html`, `val/conjunciones.html`, `val/search-data.json`, `val/sintaxis.html`, `val/subordinadas.html`.

Se mantienen intactos los repositorios originales, el motor de morfología, los 2.055 registros de vocabulario, sus ID, unidades y progreso. ScholaClassica solo consume una versión reproducible del origen.

## Control de integración
1. La revisión coincide en `config/sources.lock.json` y `.github/workflows/integracion.yml`.
2. La construcción mantiene las adaptaciones locales y las páginas de Latín II: consulta de subordinadas por nexo, guía de conjunciones, ejemplos latinos en cursiva y guiones de subtipos en castellano y valenciano.
3. Se incorporan a la precaché propia `schola-gramatica-*` seis páginas estáticas de sintaxis y conjunciones ES/VAL. El cambio de contenido genera automáticamente una nueva versión de caché por SHA; no se modifican los service workers de Evolutio, Vocabula ni Etymologicon.
4. Los tests comparan el SHA real del checkout con el lock, inspeccionan el contenido bilingüe y comprueban la precaché. En la PR, CI construye el artefacto sin desplegarlo.

## Otras fuentes examinadas
- **Evolutio:** el origen `main` y la revisión fijada coinciden. No se requiere actualización.
- **Vocabula:** el origen tiene dos commits posteriores al SHA fijado `0e16505b7631298a0448c4160a5d258f82732bfe`, con cambios en la interfaz y en `teacher.js`, además del backend y pruebas. **No se importa automáticamente**: requiere auditoría específica del contrato de la copia integrada y de su interacción con el área docente. Se conserva el banco y el progreso.
- **PR #91 de ScholaClassica:** permanece abierta. El trabajo de auditoría de la #92 ya está fusionado, pero la #91 incluye una enmienda léxica diferente sobre `polliceor` en dos registros. Por tanto, no debe cerrarse como redundante ni fusionarse sin revisión académica individual.

## Criterio de publicación
Esta rama y su PR **no publican GitHub Pages**. Una eventual fusión a `main` requiere comprobación positiva de toda la CI, de la navegación y el funcionamiento offline, y autorización de publicación.
