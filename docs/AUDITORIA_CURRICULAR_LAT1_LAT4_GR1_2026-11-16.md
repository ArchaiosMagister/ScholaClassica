# Auditoría curricular transversal: Latín I, Latín 4.º y Griego I

**Fecha:** 16/11/2026. **Intervención:** solo lectura y pruebas.
**Alcance:** Appendix (castellano y valenciano), Vocabula (General/Examen
y copia integrada), morfología y sus fronteras de unidades.
**No se modifica** ninguna ficha, forma, análisis, unidad, ID ni progreso;
no se altera ninguno de los repositorios originales ni se publica
un currículo nuevo.

## Resumen contrastado

La matriz procede del banco de Vocabula fijado de 2055 entradas y de
la [auditoría transversal existente](../scripts/audit-filologia-transversal.mjs)
que lee los currículos y paradigmas **compilados** de ScholaClassica.

| Curso | Unidades de gramática ES/VAL | Modelos de morfología | General | Examen |
| :--- | ---: | ---: | ---: | ---: |
| Latín I | 10 / 10 | 92 | 741 | 115 |
| Latín 4.º | 8 / 8 | 76 | 379 | 127 |
| Griego I | 14 / 14 | 94 | 332 | 171 |

Las dos lenguas presentan la misma secuencia de unidades y la misma
cantidad de apartados por unidad. La paridad estructural **no** demuestra
la equivalencia filológica de todas las traducciones. Los 2055 IDs del
banco histórico siguen en la copia integrada; no se convierte
General en Examen ni se fusionan glosas distintas.

El contraste de géneros explícitos no ha producido candidatos
discordantes. Esto **no** equivale a demostrar que todos los 2055 lemas
o los 262 modelos de las tres materias hayan sido verificadas
individualmente en diccionarios: son bancos y motores de cometido
distinto, por lo que muchos lemas carecen legítimamente de modelo
flexivo específico.

## Diagnósticos por curso

### Latín I

- Las diez unidades del Appendix y las 92 fichas de morfología están
  dentro de las unidades previstas.
- Las 115 fichas de **Examen** llegan solo hasta **UD7**. No hay listas
  propias de Examen para UD8, UD9 ni UD10.
- En **General** hay **82 fichas cuya única adscripción numérica está
  fuera de las diez unidades de gramática**: grupo histórico
  `UD 11–12`. Además, 58 fichas General combinan ese grupo con
  alguna unidad dentro del currículo 1–10. La procedencia se conserva.
- No sería correcto declarar por analogía que esas 82 fichas son de UD10
  ni fabricar un Examen UD8–10 a partir del banco General.

### Latín de 4.º de ESO

- El Appendix y la práctica están secuenciados exclusivamente por
  **UD1–8**, según el criterio docente. Las UD9 y UD10 se conservan
  únicamente como ampliación optativa en Vocabula.
- **49 fichas** del banco fuente tienen adscripción exclusivamente
  fuera de UD1–8: **43 General** y **6 Examen**. Otras **39 General**
  tienen unidades tanto dentro como fuera del currículo habitual.
- Las seis fichas Examen de **UD10** son:
  - `admīror, admīrātus sum` (1.ª);
  - `cōnor, cōnātus sum` (1.ª);
  - `lavor, lavatus sum` (1.ª), cuyo uso medio-pasivo/reflexivo
    requiere el matiz didáctico ya incorporado;
  - `persĕquor, persĕcūtus sum` (3.ª);
  - `pollĭcĕor, pollĭcĭtus sum` (3.ª);
  - `ūtor, ūsus sum` (3.ª).
- El bloque histórico de **17** fichas Examen `UD 8–9` ya fue
  conciliado individualmente contra General UD8; en la **copia
  integrada** aparece como UD8, conservando identificadores,
  respuestas y prueba de procedencia. No confundirlo con las seis
  fichas de UD10: **no** están reasignadas a UD8.
- La interfaz integrada de Vocabula **oculta UD9 y UD10 por defecto**
  y las recupera al marcar «Mostrar ampliación». La auditoría nueva
  verifica ese contrato; no se propone borrar esas palabras del banco.

### Griego I

- Los 14 temas de gramática en ambos idiomas y los 94 modelos de
  morfología están dentro del intervalo previsto.
- El corpus Examen tiene 171 fichas y grupos explícitos hasta **UD10**.
  No hay una lista Examen específica incorporada para UD11–14.
- **184** fichas de **General** conservan la etiqueta
  «Sin unidad acreditada». Ninguna pertenece a Examen. Se mantienen
  disponibles en General, pero **no** se adjudican automáticamente
  a ninguna unidad ni se promueven a Examen. Los grupos
  «Palabras básicas» y «Preposiciones» son grupos transversales
  propios y no cuentan como errores de unidad.

## Riesgos e interpretación

1. **Exigibilidad y ampliación:** el peligro no es conservar un bloque
   suplementario, sino que una futura adaptación del selector lo incluya
   involuntariamente en exámenes o en la selección inicial del alumnado.
   La nueva prueba detecta alteraciones de las seis fichas de UD10,
   de los 17 cambios de UD8, y de la ocultación inicial de UD9–10.
2. **Etiquetado no acreditado en Griego I:** 184 fichas General sin
   unidad no implican 184 errores filológicos. Son una reserva
   **curricular**: exigir asignación requeriría una decisión docente
   basada en materiales, no una inferencia por cercanía al modelo
   de morfología.
3. **Incompletitud de Examen en etapas tardías:** la ausencia de
   Examen UD8–10 de Latín I o UD11–14 de Griego I no prueba que se
   necesiten listas nuevas. No generar exigibilidad automáticamente.

## Medidas técnicas incorporadas en esta PR

- `scripts/audit-curricular-scope.mjs`: analiza exactamente los
  currículos y bancos compilados, compara los 2055 IDs y genera
  `build/academic-audits/curricular/alcance-curricular-v1.json`.
- `tests/curricular-scope.test.mjs`: comprueba los límites actuales
  y fuerza anomalías controladas (traslado de Examen UD10 a UD8,
  promoción de Griego General sin UD, y aparición de morfología
  UD9 en Latín 4.º). Deben ser rechazadas.
- `npm run audit:curriculum:scope` y paso de GitHub Actions,
  con archivado del JSON por **30 días**.
- Sin cambios en `data.js` ni en `dist`/PWA: no hace falta
  desplegar para incorporar esta auditoría.

## Preguntas docentes posibles para una fase posterior

**Latín I:** ¿las 82 fichas de General etiquetadas únicamente
`UD 11–12` deben continuar visibles como ampliación, o prefieres
ocultarlas salvo activación expresa como en Latín 4.º?

**Griego I:** ¿mantener las 184 fichas General sin adscripción explícita
o iniciar una revisión **documentada** para asignar unidades a algunas,
sin cambiar el corpus Examen?

Estas preguntas **no bloquean** el cierre de esta auditoría. Hasta
que se responda, conservar la clasificación, la navegación y el
historial existentes es el curso más seguro.

## Verificación

La prueba automática de GitHub de esta PR es la comprobación oficial
del código. Ningún resultado aquí afirma que una entrada concreta
sea correcta o incorrecta sin contraste filológico individual.
