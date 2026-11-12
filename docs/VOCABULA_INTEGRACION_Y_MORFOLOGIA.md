# Vocabula: adaptación léxica y decisión sobre morfología

**Estado:** integración técnica en ScholaClassica para pruebas, sin despliegue. Fuente fijada: `ArchaiosMagister/VocabulaLatinaGraecaque@0e16505b7631298a0448c4160a5d258f82732bfe`.

## Qué se importa

- Los scripts y datos de vocabulario, la portada, estilos, el tema, los iconos y el cliente docente se importan **sin modificar sus bytes**.
- Se conservan tarjetas, opción múltiple, escritura directa, ejercicio inverso, repaso de fallos, filtros por curso/unidad y progreso local.
- Solo en el artefacto integrado: la pestaña «Gramática» abre Appendix en lugar de `gramatica.html`; `schola-bridge.js` preselecciona asignatura desde un parámetro permitido (`lat1`, `lat2`, `lat4`, `gr1`) sin seleccionar unidades automáticamente.
- Se conserva `config.js` con el endpoint público de Supabase. El backend no se modifica ni se publica en el artefacto. La gestión docente y los avisos requieren red; el léxico inicial puede funcionar si el sitio está accesible, pero esta integración no promete PWA ni descarga offline.
- No se copian `backend/`, `tests/`, `scripts/`, `docs/`, `data/unimorph-syllabus/`, ni `gramatica.*`, `morfologia.*` y los módulos `gramatica-*`.

## Diagnóstico de la morfología original

**Página `morfologia.html`:** ofrece prácticamente solo personas y números del presente de indicativo activo latino; Griego I no funciona en ella. Consulta `GeneradorExamenes/main/data/unimorph/lat-v.json` en tiempo de ejecución, por tanto depende de la red y de una rama mutable.

**Página `gramatica.html`:** cubre más contenidos (morfología nominal y verbal, test y escritura, paradigmas curriculares, UniMorph y respaldo latino opcional), pero su cobertura real es desigual. El informe de la fuente `data/morphology-coverage.md` indica lemas con algún ejercicio: Latín I **283/663**, Latín de 4.º ESO **171/328** y Griego I **52/348**. Estas cifras no prueban paradigmas completos ni la validez de cada flexión.

Por tanto, no se traslada ninguno de esos dos correctores como un producto acabado. Sus **datos, verificaciones y paradigmas permanecen en el repositorio original** para reutilización crítica.

## Arquitectura acordada

**Módulo autónomo de práctica morfológica dentro de ScholaClassica, sin crear de momento otro repositorio.** Debe tener navegación y almacenamiento propios para no acoplar vocabulario y morfología, pero compartir la interfaz de cursos y el catálogo académico versionado.

La primera etapa exige (1) modelo de forma con lema, enunciado, lengua, curso, unidad de adquisición, rasgos y fuente; (2) evidencia individual y estado de verificación, sin formas dudosas en sorteo; (3) motor determinista separado de la vista y tratamiento explícito de homografías y sincretismos; (4) cobertura progresiva de nominativos y declinaciones, conjugaciones, tiempos y voces según unidad, y comparación con Appendix y los bancos contrastados de GeneradorExamenes; (5) pruebas filológicas, offline, de regresión y de repaso antes de ampliar.

## Puertas de calidad

La construcción exige el SHA del original; los tests comprueban igualdad byte a byte de los recursos importados, rutas relativas, ausencia de correctores antiguos y backend, y selección de cursos y vocabulario en Chromium con Supabase simulado. No se escriben datos reales, no se publica GitHub Pages y no se alteran los repositorios fuente.

La CI no sustituye la comprobación manual del login docente real ni la validación de funcionamiento e instalación en iPhone/iPad.
