# Plan de integración progresiva

1. **Appendix grammaticæ — primera fase:** copiar desde commit fijado sin modificar bytes, validar todas las rutas esenciales, español/valenciano y navegación por materia y curso. Construir portal público solo como artefacto de CI, **sin deploy**.
2. **Evolutio:** integrar el motor y datos exactos; adaptar en el ensamblaje el service worker para borrar solo cachés con su prefijo. Probar desconexión y coexistencia con otra PWA del mismo origen.
3. **Vocabula Latina Græcaque:** conservar ejercicios, filtros y progreso. Verificar servicio docente y cargar índices offline versionados para eliminar enlaces de dependencia a main no fijados.
4. **GeneradorExamenes:** integración tras definir el acceso realmente protegido, preservando borradores, HTML offline, edición bidireccional, exportaciones Word y todo su CI.

## Criterios para aprobar cada fase

- Todos los tests del original y los nuevos de integración pasan.
- Ningún archivo del origen cambia.
- Los dos idiomas, los enlaces relativos y rutas de unidades funcionan.
- No se publican herramientas docentes que se pretenden restringir.
- El resultado de construcción queda trazado a SHA inmutable.
- No se habilita GitHub Pages hasta superar pruebas de aplicación y autorización.
