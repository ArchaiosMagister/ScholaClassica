# Etymologicon · Instalación PWA y funcionamiento sin conexión

**Estado:** recursos y pruebas preparados dentro de ScholaClassica; **sin GitHub Pages ni despliegue público**.

## Qué se entrega

- Identidad PWA propia: \`apps/etymologicon/manifest.webmanifest\`, con \`id\`, \`start_url\` y \`scope\` relativos a \`apps/etymologicon/\`, \`display: standalone\` y lengua castellana.
- Iconografía diferenciada: épsilon griega y libro, iconos PNG de **192 y 512 píxeles**, PNG \`maskable\` de 512 y \`apple-touch-icon\` de **180 píxeles**. Se incluye icono vectorial SVG.
- Soporte de iPhone/iPad (Safari: Compartir → «Añadir a pantalla de inicio»), Android (opción de instalar del navegador) y ordenadores compatibles. No se afirma validación en hardware real: la prueba automatizada se ejecuta en Chromium de escritorio y vista móvil.
- Un \`sw.js\` **generado** durante \`npm run build\`. Su versión se deriva de SHA-256 de los recursos del módulo y de su plantilla. No se modifica ningún service worker de otro proyecto.

## Precarga y funcionamiento offline

En la primera visita bajo HTTPS (o \`localhost\` durante pruebas), el navegador descarga y guarda en CacheStorage la página, CSS, controlador JS, **el corrector original**, el banco mínimo de Griego I (111 étimos, 201 derivados y 217 relaciones), el manifiesto y los iconos.

Una vez **completada** la instalación del trabajador offline, el alumno puede volver a abrir \`/apps/etymologicon/\` o \`/apps/etymologicon/index.html\`, seleccionar unidades y étimos, introducir dos derivados, recibir 1 / 0,5 / 0 puntos con resaltado de faltas y cambiar de tema, **sin acceso a la red**. No hay peticiones a diccionarios remotos para corregir.

La página contiene una sección «Instalación y uso sin conexión»: mensaje sobre la disponibilidad offline, botón «Buscar actualizaciones», botón «Aplicar nueva versión» cuando exista una versión preparada, botón «Instalar Etymologicon» cuando el navegador emita el evento \`beforeinstallprompt\`, e instrucciones de instalación manual en Safari.

**Primera instalación:** requiere una conexión y que el navegador permita service workers. Si no lo permite, la actividad online sigue funcionando, pero no se promete funcionamiento offline. Las preferencias visuales y las estadísticas agregadas se guardan por separado en \`localStorage\`. No se conservan las palabras escritas. El nuevo módulo de progreso también se precarga para trabajar sin conexión.

## Aislamiento y actualización sin regresiones

El service worker solo se registra desde Etymologicon con \`scope: './'\`, equivalente a \`/apps/etymologicon/\` dentro de una web. No intercepta navegación ni recursos del portal principal, Appendix, Evolutio, Vocabula o GeneradorExamenes.

El prefijo de caché exclusivo es \`schola-etymologicon-\`. Durante la activación **solo** elimina claves con ese prefijo que difieran de la versión actual; conserva \`schola-evolutio-\` y cualquier otra caché ajena.

Todos los recursos del módulo se precargan **atómicamente durante la instalación**; una descarga fallida impide instalar ese trabajador y evita declarar una versión incompleta como offline. Los recursos se sirven desde la misma versión de caché, de modo que un banco actualizado no se combina accidentalmente con un corrector antiguo.

Las versiones nuevas no llaman a \`skipWaiting()\` automáticamente. Cuando hay una actualización lista, la pantalla solicita confirmación mediante «Aplicar nueva versión», y entonces activa el nuevo trabajador y recarga la página. Esto evita interrumpir la corrección de una respuesta en curso. Para refrescar contenido e iconos en iOS puede ser necesario abrir de nuevo o, en casos de caché de iconos del sistema, eliminar y recrear el acceso a la pantalla de inicio; el botón no puede forzar al sistema operativo a sustituir un icono almacenado.

## Validación

- \`npm run etymology:pwa:test\` (después de \`npm run build\`) comprueba manifiesto, rutas, formato y descompresión de PNG, precarga completa, integridad del archivo corrector y versión de caché reproducible.
- \`npm test\` ejecuta también las pruebas del banco filológico y del corrector determinista.
- \`npm run test:browser\` prueba en Chromium el registro dentro de \`/apps/etymologicon/\`, el almacenamiento de recursos, **la navegación y la corrección de 1,5/2 completamente desconectado**, y la coexistencia posterior de la caché con Evolutio.
- Las pruebas históricas verifican las copias exactas de Appendix y el aislamiento del service worker de Evolutio.

## Publicación

**No se ha publicado nada.** El repositorio de ScholaClassica continúa en fase de pruebas y el flujo de GitHub Actions solo guarda \`dist/\` como artefacto temporal. Para instalar la PWA en un iPhone real habrá que servir la integración aprobada bajo HTTPS mediante un despliegue explícito posterior; esta tarea no lo activa.

Griego II sigue sin banco y la primera modalidad de dos derivados conserva su puntuación exacta y sus decisiones docentes.


## Progreso y copia de seguridad offline

Las estadísticas y la repetición inteligente ya se gestionan en el cliente, sin API ni servidor. La PWA precarga `progress.mjs` y conserva los datos locales cuando actualiza el banco o el corrector. El alumnado puede exportar, importar tras validación y confirmación, o borrar voluntariamente sus estadísticas. Consulta [la guía de progreso](ETIMOLOGICON_PROGRESO_Y_REPASO.md).
