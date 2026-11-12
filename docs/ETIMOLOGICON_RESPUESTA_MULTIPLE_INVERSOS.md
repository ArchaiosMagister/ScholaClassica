# Etymologicon · Respuesta múltiple y ejercicios inversos

**Estado:** dos modalidades añadidas al módulo de Griego I de ScholaClassica. No se ha publicado la webapp ni activado Griego II.

## Preguntas de respuesta múltiple

Se presenta un étimo griego y cuatro palabras castellanas del banco cerrado y auditado. Una opción es un derivado admitido del étimo. Los distractores proceden del mismo catálogo, pero no constan como derivados admitidos del étimo preguntado. No se inventan palabras ni se afirma que toda correspondencia ausente sea filológicamente imposible.

La respuesta se corrige inmediatamente y se registra con **1 punto por acierto o 0 por fallo**, independientemente de las puntuaciones 1/0,5/0 del ejercicio de escritura. Solo se registra un intento por pregunta.

## Identificación inversa

El alumno ve un derivado castellano autorizado y escribe su étimo griego. Solo se seleccionan derivados con un **único étimo propietario en el catálogo global**; los compartidos se excluyen.

Se admite escribir directamente en griego (sin exigir acentos ni espíritus), con caracteres latinos y vista previa automática, o mediante teclado griego virtual. Cuando la transliteración es unívoca, se muestra el lema canónico con acentos. Las entradas no reconocidas se muestran solo de manera orientativa, nunca se aceptan por semejanza.

Ejemplos de conversión: philos → φίλος; sophia → σοφία; logos → λόγος.

El corrector determinista otorga **1 / 1 punto** cuando la identificación es inequívoca, y **0 / 1** cuando corresponde a otro étimo, no se encuentra en el banco o es ambigua. Una falta ortográfica no se acepta por parecido. El código no marca como verificadas las relaciones cuyo indicador editorial inverseReady continúa pendiente: esta modalidad de práctica deriva del inventario directo aprobado y la revisión filológica específica para exámenes inversos sigue siendo independiente.

## Progreso y protección de datos

El archivo local versionado incorpora agregados independientes para respuesta múltiple e inversos, sin conservar las palabras escritas. Los JSON antiguos (sin modalidades nuevas) pueden importarse sin borrar los registros originales. Los fallos alimentan el repaso inteligente, manteniendo la puntuación histórica de escritura inalterada.

Los archivos quiz.mjs y quiz-ui.mjs forman parte de la precarga atómica de la PWA aislada. Ambas modalidades funcionan sin conexión, sin acceso a APIs externas. Se conservan las selecciones de unidades, modo claro/oscuro/OLED y copias de progreso.

## Comprobaciones

- Preguntas de los 108 étimos elegibles con cuatro opciones catalogadas sin distractores aprobados para la respuesta.
- Identificación inversa desde derivados de atribución única, rechazo de ambigüedades.
- Transliteración, griego sin diacríticos, entradas mixtas y reconocimiento estricto.
- Persistencia, repetición y exportación/importación retrocompatible.
- Pruebas en Chromium online/offline y ausencia de regresiones en Appendix y Evolutio.

Sin publicación, sin cambios en repositorios originales.

