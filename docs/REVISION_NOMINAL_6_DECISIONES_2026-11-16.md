# Revisión nominal transversal de la PR #35 — 16 de noviembre de 2026

## Alcance y principios

Se han cotejado las seis decisiones docentes del 13-11-2026 con `main@e023e8bca8ea87a4994b61de35a713aaf00ca087`, los 2055 registros originales de Vocabula fijados en `a7be2161a2401816ede78a96981daaac6850b8d2`, las rutinas curriculares y el motor de producción escrita. Se preserva todo ID anterior, número de formas, historial de progreso y adscripción de cada ficha. **No se incorpora en bloque la PR #35**.

## Matriz por lema

| Decisión histórica | Situación de `main` al iniciar la revisión | Acción de esta PR | Requisitos para habilitar nuevas formas |
| --- | --- | --- | --- |
| `anthropos: masculino-docente` | `griego-sustantivo-anthropos` ya dispone de 10 casillas y `gender: 'común'`; se excluía de todos los sintagmas por prudencia. | **Recuperada:** únicamente en sintagmas de Griego I desde UD5 se habilita la concordancia masculina aprobada; `gender: 'común'`, las 10 casillas y su ID quedan intactos. Nuevas claves de ejercicio terminan en `:masculino`. | La concordancia femenina no se habilita automáticamente. |
| `pais: ambos-generos` | Vocabula conserva dos fichas `παῖς, παιδός` de UD8 con ὁ/ἡ, pero no hay paradigma nominal individual equivalente incorporado al banco de ejercicios. UniMorph contiene los diez casos/ números, sin contar el dual. | **Conservada en manifiesto**, sin generar ejercicios nuevos. | Importar sus diez casillas con acentos y espíritus contrastados, un ID único y dos claves de concordancia distintas; no duplicar la declinación. |
| `athenae: plural-documentado-pendiente-fuente` | Vocabula contiene `Ἀθῆναι, –ῶν` General y Examen (UD1–4), pero no existe su paradigma específico; el validador de ejercicios exige actualmente al menos seis casillas y las tablas exigen ambos números, salvo la excepción de `οὐρανός`. | **Conservada en manifiesto**; no se añade singular inventado. | Registrar únicamente Ἀθῆναι, Ἀθῆναι, Ἀθήνας, Ἀθηνῶν, Ἀθήναις, con una excepción explícita de *pluralia tantum* en validación y tablas; excluir los sintagmas que precisen singular. |
| `cantus: cuarta-sin-mezcla` | Vocabula de Latín I contiene `cantus, –us` en UD7; el generador de sustantivos para Latín II ya tiene un modelo regular de cuarta, pero no se debe propagar automáticamente como ficha independiente de Latín I. | **Conservada**, sin mezclar homónimos ni cambiar el banco. | Validar doce casillas de cuarta y crear un paradigma de Latín I en UD7 por una vía aislada. |
| `domus: conservar-variantes-documentadas` | Vocabula contiene fichas con notación de segunda y cuarta, varias unidades (UD2, 5, 6, 7, 9–10 y 11–12). No es lícito resolver todas las formas por una tabla simple ni modificar sus unidades de vocabulario. | **Conservada**, sin forzar una declinación exclusiva ni publicar locativos no cotejados. | Contrastar singular/plural por caso y marcar frecuencia; separar el locativo `domī` (y variante `domuī`) del genitivo homógrafo. |
| `liber: guardar-ambos` | Vocabula incluye el sustantivo `liber, –bri` (libro) en Latín I y modelos escolares en Latín II. El adjetivo `līber, lībera, līberum` (libre) no debe confundirse con él. | **Conservada la reserva adjetival**, registro académico `latin-adjetivo-reserva-liber-free` explícitamente `notForGrading: true`. No entra en `dist`, sorteos ni progreso. | Crear más adelante el paradigma nominal de `liber, librī` separado del adjetivo; no inventar respuestas por homografía. |

## Evidencias

- UniMorph fijado bajo Vocabula: *παῖς* tiene 15 filas, de las que 10 corresponden a singular/plural; sus artículos documentan los dos géneros.
- Logeion y Wiktionary (ático): https://logeion.uchicago.edu/morpho/%E1%BC%88%CE%B8%E1%BF%86%CE%BD%CE%B1%CE%B9 y https://en.wiktionary.org/wiki/%E1%BC%88%CE%B8%E1%BF%86%CE%BD%CE%B1%CE%B9 respaldan las cinco formas áticas de Atenas y las variantes dialectales que NO deben introducirse.
- Dickinson College Commentaries (Allen & Greenough §93): https://dcc.dickinson.edu/grammar/latin/4th-declension-case-forms describe la alternancia de `domus` y las restricciones de genitivos y locativo.
- El adjetivo `līber, lībera, līberum` se archiva como reserva aprobada, no como ficha calificable.

## Seguridad y compatibilidad

- Se conservan **seis decisiones históricas en `config/nominal-teacher-decisions.json`** y una reserva de adjetivo fuera del paquete.
- En los ejercicios existentes no cambia ningún ID ni lectura previa. Solo se agregan sintagmas masculinos de `ἄνθρωπος`, con claves nuevas y su unidad curricular original.
- No se alteran `VocabulaLatinaGraecaque`, `Appendix-grammaticae`, `GeneradorExamenes`, Supabase ni los archivos originales de UniMorph.
- En `tests/nominal-teacher-decisions-current.test.mjs` se verifica manifiesto, documento en reserva, bloqueos, integridad de las 2055 fichas y respuesta de concordancia.
- El resto de decisiones requiere PR individual para no reintroducir los generadores masivos de #35 ni mutar arbitrariamente el corrector de producción escrita.

**Estado:** revisión documental completa, recuperación conservadora de una decisión en la práctica, otras cinco reservadas explícitamente. Sin fusión ni publicación hasta superar las pruebas.
