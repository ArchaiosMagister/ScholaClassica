# Propagación filológica de dos vocativos desde Appendix (15-XI-2026)

Ámbito: corrección **acotada** del contenido de gramática de Latín I, Latín de 4.º y Griego I; sin modificar ejercicios, vocabulario ni bancos de GeneradorExamenes.

## Origen y fundamento

- `acer, acris, acre`: vocativo masculino singular **acer**, no `acris`. La forma femenina sigue siendo `acris` (Harkness, *A Latin Grammar for Schools and Colleges*, §151).
- `ἐλπίς, ἐλπίδος`: vocativo singular **ἐλπί** (Goodwin, *Greek Grammar*, §221); el nominativo sigue siendo `ἐλπίς`.

PR original de Appendix: https://github.com/ArchaiosMagister/Appendix-grammaticae/pull/10.

## Actualización académica con control de versión

Para validar la corrección **sin alterar el repositorio original ni desplegar ScholaClassica**, esta rama fija Appendix al commit `0d0901c0a9cce46735f8479c7286ad3c77d8ab3e` de la PR de corrección. Las versiones de Vocabula y Evolutio permanecen sin cambios.

Las dos variantes lingüísticas (ES/VA) de los HTML de gramática y sus `curriculum.json` contienen la corrección. La compilación debe reproducirla, además, en los paradigmas `latin-adj-acer`, `latin4-appendix-latin-adj-acer` y `griego-ud8-noun-113-0-0`.

Se añade una prueba con identidad del SHA académico y control de las tres casillas de la fuente compilada. No se cambia la unidad de exigibilidad ni el vocabulario de curso.

**Dependencia:** antes de integrar esta PR, fusionar la corrección de Appendix, sustituir el SHA provisional por el commit efectivo de la fuente integrada y volver a pasar la batería completa. Esta rama se limita a comprobar que esa propagación es reproducible y **no debe publicarse aún**.
