# Plan de integración progresiva

1. **Appendix grammaticæ — integrado y verificado:** copia inmutable, rutas por lengua y curso, contenido en castellano/valenciano y pruebas de Chromium.
2. **Evolutio — integrado y verificado:** datos y motor conservados, adaptación aislada del service worker exclusivamente en el artefacto, tests de funcionamiento offline y de coexistencia entre cachés.
3. **Vocabula Latina Græcaque — léxico integrado:** ejercicios, filtros y progreso local conservados mediante copia desde commit fijado; la gestión docente sigue en su servidor Supabase, sin alterarlo. Se excluyen las dos páginas de práctica morfológica y gramatical, pendientes de reconstrucción.
4. **GeneradorExamenes — pendiente:** diseñar protección efectiva del área docente antes de incluirlo en la plataforma; preservar HTML autónomo, borradores, edición bidireccional, lematización y exportaciones Word.
5. **Repaso morfológico revisado — pendiente:** nuevo módulo de ScholaClassica con banco auditable, progresión curricular y corrección de sincretismos.
6. **Modificación preverbial — primera versión:** práctica de la cuestión 3D de Latín II. Latinismos queda pendiente.

La práctica de modificación preverbial usa las formas PAU de los dos documentos de Word aportados y el léxico de los dos PDF de trabajo. El banco inicial tiene ocho familias. Incluye rondas de junio de 2025, julio de 2025 (reserva) y el modelo de 2026, con enlaces al enunciado, y tres combinaciones de práctica. Aplica el reparto de [los criterios de junio de 2025](https://universitats.gva.es/documents/389338055/393318644/Criterios%2BLATI%2BJunio%2B2025.pdf/7cb2cd85-e40c-e174-880a-ab0d66901e48). Las respuestas fuera del banco quedan pendientes de revisar.

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
