> **Ampliación:** preguntas de respuesta múltiple e identificación inversa, con transliteración y teclado virtual. Ver ETIMOLOGICON_RESPUESTA_MULTIPLE_INVERSOS.md.

# Etymologicon · tarjetas de memoria y relación de étimos

Estado: dos nuevas modalidades incorporadas a la versión de pruebas de ScholaClassica. No se habilita despliegue público ni Griego II.

## Tarjetas de memoria

El alumno selecciona «Tarjetas de memoria» y ve inicialmente un étimo griego sin su significado ni sus derivados. Al pulsar **«Mostrar significado y derivados»** aparecen el significado previamente revisado y los derivados castellanos admitidos por el banco editorial. Después puede indicar «Lo recordaba» o «Necesito repasarlo».

Esta clasificación es una **autoevaluación**, no una calificación filológica ni una nota de examen. Solo se registra una respuesta por tarjeta revelada; revelar sin evaluarse no guarda un ejercicio. Los errores de recuerdo pasan al repaso inteligente y se consideran superados tras dos recuperaciones positivas consecutivas.

## Relación entre étimos y derivados

La segunda modalidad genera rondas de **hasta cuatro parejas**, utilizando exclusivamente las relaciones admitidas. Para no enseñar correspondencias únicas que sean filológicamente ambiguas, cada derivado utilizado debe estar asociado a **un único étimo en el conjunto global de las relaciones aprobadas**, no solo entre las opciones visibles.

El alumno elige un étimo griego y su derivado castellano mediante botones accesibles al teclado. Puede corregir un fallo y completar la ronda; al finalizar recibe la cantidad de relaciones resueltas **al primer intento** y cuáles deben repasarse. La ronda solo se registra una vez, cuando todas las parejas están resueltas. En conjuntos insuficientes para formar dos parejas, aparece un aviso y no se generan respuestas inventadas.

## Reutilización del progreso

La clave de almacenamiento se mantiene: \`scholaclassica-etymologicon-progress-v1\`. El registro agrega dos secciones opcionales:

- \`activities.cards.records\` (autoevaluación de recuerdo, olvidos, racha y necesidad de repaso).
- \`activities.matching.records\` (relaciones resueltas a la primera, que necesitaron reintento y racha).

El esquema continúa siendo compatible con los **JSON previamente exportados sin actividades**. Al importarlos, se inicializan las nuevas estadísticas vacías, conservando todas las notas anteriores. Las nuevas copias incluyen también las estadísticas de tarjetas y relaciones, manteniendo la separación de Griego II, todavía vacío.

Los 1 / 0,5 / 0 puntos del ejercicio de escritura **no cambian**. Las tarjetas y las relaciones tienen métricas separadas para que la autopercepción de recordar un término no se convierta en una nota académica equivalente. Los étimos fallados en cualquiera de las tres modalidades entran en «Repasar mis errores» y reciben mayor peso en la selección inteligente.

## Seguridad y continuidad

Los nuevos ejercicios utilizan \`apps/etymologicon/study.mjs\` y \`activities-ui.mjs\`, ambos independientes del corrector \`write-two.mjs\`. No se crean lemas ni enlaces etimológicos. Solo se muestran datos explícitos del catálogo de **111 étimos, 201 derivados admitidos y 217 relaciones**; se mantienen fuera del sorteo los tres étimos de consulta.

Los dos nuevos módulos forman parte de la caché aislada y versionada de la PWA. Funciona sin conexión después de la primera precarga, incluida la actualización de estadísticas. Se mantienen la interfaz en castellano, el modo claro/oscuro/OLED, la exportación/importación validada y las protecciones para las fuentes originales.

Pruebas: \`npm test\` cubre el banco, rondas unívocas, controles de progreso, importación compatible y no regresiones; \`npm run test:browser\` cubre los dos flujos en Chromium, el repaso de errores y ambas modalidades offline, además de Appendix y Evolutio.

Sin despliegue, sin cambios en GeneradorExamenes, Evolutio, Appendix ni Vocabula Latina Graecaque.

