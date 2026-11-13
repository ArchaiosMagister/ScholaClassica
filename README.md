# ScholaClassica

Plataforma modular de estudio de latín y griego en construcción **sin publicación para el alumnado**.

## Estado (fase 3 · interfaz etimológica en pruebas)

- **Appendix grammaticæ**: copia completa y sin alteraciones desde un commit fijado, en `dist/apps/gramatica/`.
- **Evolutio**: copia completa en `dist/apps/evolucion-fonetica/`, con una adaptación **solo en la copia** del service worker para aislar la caché; el banco y el motor siguen idénticos.
- **Etymologicon**: primera modalidad nativa de dos derivados castellanos, corrección determinista (1 / 0,5 / 0) e interfaz con filtros de Griego I. Preparada como **PWA independiente** para instalar y practicar sin conexión tras descargar los recursos, en `dist/apps/etymologicon/`. Su servicio offline no afecta a otras aplicaciones.
- **Vocabula Latina Græcaque**: léxico integrado desde un commit fijado. Se mantienen los ejercicios, el progreso local y el servicio Supabase; la morfología antigua no se incorpora, en espera de un módulo académico revisado.
- **GeneradorExamenes**: todavía no incluido en el resultado.
- **Zona docente**: usuario, contraseña y TOTP; función de inicio de sesión con correo exclusivamente en servidor y control Turnstile, además de bandeja de avisos con autorización de segundo factor. **No activada ni desplegada**: falta aprovisionar la identidad central, secretos y un **origen HTTPS aislado** para la zona privada (no compartir el origen de las aplicaciones públicas), además de verificar el extremo a extremo.
- Los repositorios originales siguen siendo las únicas fuentes editables de sus aplicaciones durante la migración.

## Construcción reproducible

Se necesita Node.js 22 y tres fuentes descargadas en modo lectura, en los commits exactos de `config/sources.lock.json`:

```bash
git clone https://github.com/ArchaiosMagister/Appendix-grammaticae.git .sources/appendix
git -C .sources/appendix checkout a3d54209b3bb8a31efd3d57d62b09d6de8d85f5c
git clone https://github.com/ArchaiosMagister/EvolucionFonetica.git .sources/evolutio
git -C .sources/evolutio checkout 0897aae01b6d4c905aafa1c1a6bac5af0810c812
git clone https://github.com/ArchaiosMagister/VocabulaLatinaGraecaque.git .sources/vocabula
git -C .sources/vocabula checkout 0e16505b7631298a0448c4160a5d258f82732bfe
npm run build
npm test
```

El workflow de GitHub Actions realiza automáticamente las comprobaciones originales, la construcción, los tests de copia y la navegación en Chromium (incluida la caché de Evolutio). `dist/` se guarda **solo como artefacto de pruebas** y no se activa GitHub Pages. El catálogo de Etymologicon se genera desde el inventario auditado; su versión de navegador solo contiene los campos necesarios para estudiar y corregir, no el Excel original ni las notas de revisión.

Para servirlo localmente: `python3 -m http.server 8000 -d dist`.

## Adaptación de Vocabula

El artefacto incorpora solamente recursos de **vocabulario**; copia de forma idéntica los scripts léxicos y los iconos, adapta el enlace interno de gramática a Appendix y permite abrir una asignatura desde el portal. El backend de Supabase continúa en el servicio original, sin modificaciones. Las pruebas de integración simulan el servicio y no alteran datos reales. Las páginas de ejercicios gramaticales y de morfología no se incluyen; sus bancos siguen en la fuente original, pendientes de un corrector nuevo y auditado. Véase `docs/VOCABULA_INTEGRACION_Y_MORFOLOGIA.md`.

## Sincronización

Las versiones originales están fijadas en `config/sources.lock.json`. No se copian archivos editables duplicados al repositorio: se importan durante la compilación; una actualización requiere aprobar una nueva versión auditada. La creación automática de propuestas de actualización aún está pendiente. El proceso no realiza escrituras en ningún repositorio externo.

Documentación: `docs/ARQUITECTURA.md`, `docs/SEGURIDAD.md`, `docs/DOCENTE_AUTENTICACION.md`, `docs/PLAN_INTEGRACION.md`.

## Instalación y modo offline de Etymologicon

La compilación añade `manifest.webmanifest`, iconos 192/512, icono maskable 512, icono Apple 180 y un `sw.js` generado con versión derivada del contenido. El trabajador offline **solo** controla `apps/etymologicon/` y no elimina cachés de otras herramientas.

La primera visita requiere HTTPS (o localhost en pruebas) y conexión para guardar todos los recursos y el banco auditado; después se puede abrir directamente Etymologicon sin red. La actualización del banco y del motor se aplica de manera conjunta después de pulsar «Aplicar nueva versión». En iOS/iPadOS se usa Safari > Compartir > Añadir a pantalla de inicio; en Android/ordenadores se puede utilizar la opción de instalación del navegador cuando esté disponible. La pantalla muestra instrucciones integradas.

**Todavía no se ha desplegado la web:** el artefacto de GitHub Actions sirve para pruebas técnicas, no constituye una URL HTTPS instalable para alumnado. Falta comprobar la experiencia de instalación en dispositivos físicos antes de publicarla. Detalles y pruebas: [`docs/ETIMOLOGICON_PWA.md`](docs/ETIMOLOGICON_PWA.md).

## Progreso local en Etymologicon

Etymologicon incorpora repaso general adaptativo, repaso de errores y selección por unidad, con estadísticas por étimo y unidad, conservación offline, exportación/importación JSON validada y borrado voluntario. No almacena respuestas escritas ni requiere cuentas. Griego II permanece reservado. Véase [`docs/ETIMOLOGICON_PROGRESO_Y_REPASO.md`](docs/ETIMOLOGICON_PROGRESO_Y_REPASO.md).

## Modalidades adicionales de Etymologicon

Se incorporan **tarjetas de memoria** (revelar significado y derivados, autoevaluación de recuerdo) y **relación de étimos y derivados** (rondas de hasta cuatro parejas unívocas del banco auditado), con estadísticas diferenciadas y repetición inteligente común. Ambos ejercicios funcionan sin conexión tras instalar la PWA. Véase [`docs/ETIMOLOGICON_TARJETAS_RELACIONES.md`](docs/ETIMOLOGICON_TARJETAS_RELACIONES.md). La escritura de dos derivados y su nota 1 / 0,5 / 0 se mantienen.

## Opción múltiple e identificación inversa

Etymologicon añade preguntas de cuatro opciones y reconocimiento de étimos griegos desde derivados castellanos, con transliteración y teclado virtual. Utiliza el banco cerrado, sin aceptar atribuciones ambiguas, y funciona offline. Detalles: docs/ETIMOLOGICON_RESPUESTA_MULTIPLE_INVERSOS.md.

## Descomposición etimológica en Griego I

Etymologicon incorpora un primer banco cerrado de **16 palabras castellanas con dos componentes griegos contrastados** mediante DLE. Las restantes 185 fichas siguen pendientes de auditoría individual para esta modalidad; no se consideran automáticamente incorrectas. Los ejercicios admiten griego o transliteración latina, muestran la explicación filológica, puntúan hasta 2 y funcionan offline. Ver [`docs/ETIMOLOGICON_DESCOMPOSICION_PILOTO.md`](docs/ETIMOLOGICON_DESCOMPOSICION_PILOTO.md).


## Construcción aislada de la zona docente (sin publicación)

El portal general se genera en `dist/`, con el acceso docente expresamente desactivado. La zona privada se construye **por separado** con `npm run build:docente`, que genera `dist-docente/` en modo bloqueado por defecto. La activación requiere un hostname HTTPS distinto del de las herramientas del alumnado, una cuenta Supabase Auth y configuración explícita. El proyecto Supabase actual de Vocabula es el candidato provisional para albergar esta cuenta, sin afectar a su sistema de sesiones propio. **No se ha creado ningún usuario ni desplegado el sitio o las funciones; el correo docente no se incorpora al artefacto público.** Véase `docs/DOCENTE_AUTENTICACION.md`.


## Alojamiento docente: Cloudflare Pages (sin activar)

Se ha elegido Cloudflare Pages para un **origen separado** del portal público. Su publicación será por **Direct Upload manual**, sin integración automática con GitHub. El artefacto `dist-docente/` incluye cabeceras `_headers` verificables, `robots.txt` y `404.html`, y **permanece desactivado por defecto**. Una versión activada necesita el SDK Supabase local con huella SHA-256 revisada; no se carga desde CDN. CI ejecuta `npm run audit:docente:cloudflare` y no sube el sitio a Cloudflare. Procedimiento y bloqueos: [`docs/CLOUDFLARE_PAGES_DOCENTE.md`](docs/CLOUDFLARE_PAGES_DOCENTE.md).


El procedimiento de aprovisionamiento sin publicación y los paneles de Cloudflare/Supabase están documentados en [`docs/ACTIVACION_GUIADA_DOCENTE.md`](docs/ACTIVACION_GUIADA_DOCENTE.md). El preflight estático de una construcción docente activa puede ejecutarse con `npm run check:docente:readiness`; por diseño falla si el acceso permanece desactivado o faltan dependencias verificadas. **No existe aún un proyecto Pages ni una cuenta docente real activada.**


## Itinerario por asignatura y curso

La portada incorpora un selector contextual de **Latín de 4.º de ESO, Latín I, Latín II, Griego I y Griego II**. Muestra solo enlaces a herramientas integradas y comprobadas: gramática por curso, vocabulario cuando existe, Evolutio para Latín I y Etymologicon para Griego I. No ofrece Etymologicon para Griego II, morfología pendiente ni el generador de exámenes. No se altera ningún archivo de las tres aplicaciones originales; únicamente se actualiza el portal.

El navegador guarda localmente solo el código del curso y el identificador de la última herramienta abierta desde el selector, para ofrecer «Continuar». No almacena vocabulario estudiado, respuestas ni datos del alumnado y funciona sin iniciar sesión. Las pruebas comprueban las rutas y el funcionamiento en Chromium antes de cualquier publicación.
