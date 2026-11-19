# Conciliación de auditoría castellana y autonomía de Appendix (19/11/2026)

Esta integración reúne las PR #124 (matrices funcionales castellanas) y #125
(copia íntegra de Appendix) sin publicar los avances valencianos de Evolutio.

- Appendix se compila desde `vendor/appendix/`: 111 objetos importados sin alterar
  sus datos ni fuentes. Se prohíbe `APPENDIX_SOURCE` y el checkout externo.
- Vocabula y Evolutio mantienen los checkouts originales fijados a SHA.
- `audit:repositorios:retirada` distingue `vendored` de `external_checkout`.
  El número de dependencias externas para compilar se reduce de tres a dos.
  **La independencia de compilación de Appendix NO autoriza archivar o borrar**
  su repositorio ni garantiza que las URL/PWA antiguas puedan retirarse.
- Conservadas las pruebas nuevas: 60 sesiones Vocabula; Evolutio castellano;
  navegación por unidades de Appendix; matriz del motor y Chromium de Morfología.
- CI exige `npm run audit:appendix:vendor`, ausencia de `.sources/appendix`,
  pruebas Node, Chromium, offline, Pages y controles docentes.
- Los informes de castellano se guardan como artefactos de Actions, fuera de Pages.
- No se cambia ninguna fuente de las PR valencianas; GeneradorExamenes sigue autónomo.

El documento `AUDITORIA_FUNCIONAL_CASTELLANO_2026-11-18.md` reproduce el estado
original anterior a esta conciliación; el estado actualizado figura aquí y en
`build/academic-audits/castellano/dependencias-originales.json`.
El archivo de Appendix y cualquier eliminación futura exigen aprobación expresa.
