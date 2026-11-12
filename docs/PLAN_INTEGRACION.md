# Plan de integración progresiva

1. **Appendix grammaticæ — integrado y verificado:** copia inmutable, rutas por lengua y curso, contenido en castellano/valenciano y pruebas de Chromium.
2. **Evolutio — integrado y verificado:** datos y motor conservados, adaptación aislada del service worker exclusivamente en el artefacto, tests de funcionamiento offline y de coexistencia entre cachés.
3. **Vocabula Latina Græcaque — pendiente:** conservar ejercicios, filtros, progreso y Supabase. Sustituir los enlaces a datos cambiantes por índices versionados de integración, sin alterar el repositorio original.
4. **GeneradorExamenes — pendiente:** diseñar protección efectiva del área docente antes de incluirlo en la plataforma; preservar HTML autónomo, borradores, edición bidireccional, lematización y exportaciones Word.
5. **Proyectos nuevos — pendientes:** derivación etimológica griega, modificación preverbial y latinismos, después de la integración de las aplicaciones actuales.

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
