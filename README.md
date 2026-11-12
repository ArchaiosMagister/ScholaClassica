# ScholaClassica

Plataforma modular de estudio de latín y griego en construcción **sin publicación para el alumnado**.

## Estado (fase 3 · interfaz etimológica en pruebas)

- **Appendix grammaticæ**: copia completa y sin alteraciones desde un commit fijado, en `dist/apps/gramatica/`.
- **Evolutio**: copia completa en `dist/apps/evolucion-fonetica/`, con una adaptación **solo en la copia** del service worker para aislar la caché; el banco y el motor siguen idénticos.
- **Etymologicon**: primer ejercicio nativo de dos derivados castellanos, con corrección determinista (1 / 0,5 / 0), filtros de Griego I y resultados visuales; en `dist/apps/etymologicon/`.
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
