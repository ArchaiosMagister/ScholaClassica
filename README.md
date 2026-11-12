# ScholaClassica

Plataforma modular de estudio de latín y griego en construcción **sin publicación para el alumnado**.

## Estado (fase 3 · interfaz etimológica en pruebas)

- **Appendix grammaticæ**: copia completa y sin alteraciones desde un commit fijado, en `dist/apps/gramatica/`.
- **Evolutio**: copia completa en `dist/apps/evolucion-fonetica/`, con una adaptación **solo en la copia** del service worker para aislar la caché; el banco y el motor siguen idénticos.
- **Etymologicon**: primera modalidad nativa de dos derivados castellanos, corrección determinista (1 / 0,5 / 0) e interfaz con filtros de Griego I. Preparada como **PWA independiente** para instalar y practicar sin conexión tras descargar los recursos, en `dist/apps/etymologicon/`. Su servicio offline no afecta a otras aplicaciones.
- **Vocabula** y **GeneradorExamenes**: todavía no incluidos en el resultado.
- **Zona docente**: no publicada; pendiente de autenticación y autorización verificadas en servidor.
- Los repositorios originales siguen siendo las únicas fuentes editables de sus aplicaciones durante la migración.

## Construcción reproducible

Se necesita Node.js 22 y dos fuentes descargadas en modo lectura, en los commits exactos de `config/sources.lock.json`:

```bash
git clone https://github.com/ArchaiosMagister/Appendix-grammaticae.git .sources/appendix
git -C .sources/appendix checkout a3d54209b3bb8a31efd3d57d62b09d6de8d85f5c
git clone https://github.com/ArchaiosMagister/EvolucionFonetica.git .sources/evolutio
git -C .sources/evolutio checkout 0897aae01b6d4c905aafa1c1a6bac5af0810c812
npm run build
npm test
```

El workflow de GitHub Actions realiza automáticamente las comprobaciones originales, la construcción, los tests de copia y la navegación en Chromium (incluida la caché de Evolutio). `dist/` se guarda **solo como artefacto de pruebas** y no se activa GitHub Pages. El catálogo de Etymologicon se genera desde el inventario auditado; su versión de navegador solo contiene los campos necesarios para estudiar y corregir, no el Excel original ni las notas de revisión.

Para servirlo localmente: `python3 -m http.server 8000 -d dist`.

## Sincronización

Las versiones originales están fijadas en `config/sources.lock.json`. No se copian archivos editables duplicados al repositorio: se importan durante la compilación; una actualización requiere aprobar una nueva versión auditada. La creación automática de propuestas de actualización aún está pendiente. El proceso no realiza escrituras en ningún repositorio externo.

Documentación: `docs/ARQUITECTURA.md`, `docs/SEGURIDAD.md`, `docs/PLAN_INTEGRACION.md`.

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
