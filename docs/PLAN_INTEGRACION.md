# Plan de integración progresiva

1. **Appendix grammaticæ — integrado y verificado:** copia inmutable, rutas por lengua y curso, contenido en castellano/valenciano y pruebas de Chromium.
2. **Evolutio — integrado y verificado:** datos y motor conservados, adaptación aislada del service worker exclusivamente en el artefacto, tests de funcionamiento offline y de coexistencia entre cachés.
3. **Vocabula Latina Græcaque — léxico integrado:** ejercicios, filtros y progreso local conservados mediante copia desde commit fijado; la gestión docente sigue en su servidor Supabase, sin alterarlo. Se excluyen las dos páginas de práctica morfológica y gramatical, pendientes de reconstrucción.
4. **GeneradorExamenes — pendiente:** diseñar protección efectiva del área docente antes de incluirlo en la plataforma; preservar HTML autónomo, borradores, edición bidireccional, lematización y exportaciones Word.
5. **Repaso morfológico revisado — pendiente:** nuevo módulo de ScholaClassica con banco auditable, progresión curricular y corrección de sincretismos.
6. **Proyectos nuevos — pendientes:** modificación preverbial y latinismos; Etymologicon ya está en fase de pruebas.

## Puertas de calidad

- CI del original y de ScholaClassica sin fallos.
- Ningún repositorio original modificado.
- Navegación por latín y griego y por herramientas.
- Rutas relativas, castellano y valenciano comprobados.
- Progreso y bancos conservados, sin ascender automáticamente estados filológicos.
- Cachés PWA aisladas y comprobación de funcionamiento sin conexión.
- Generador docente no expuesto sin autenticación y autorización de servidor.
- Publicación en GitHub Pages solo tras validación técnica y docente.

**Estado de publicación:** GitHub Pages de ScholaClassica no activado. `dist/` es una salida de pruebas.
