# Auditoría transversal de Latín I y Griego I — ScholaClassica

**Fecha:** 15 de noviembre de 2026  
**Corte auditado:** `main@534bf986e4d01b880c681e7d4a19a2a37d33169e`, después de integrar la PR #85.  
**Alcance:** gramática bilingüe, práctica morfológica, vocabulario integrado, navegación, cachés y conservación del progreso. **Solo lectura**: esta PR añade exclusivamente el informe; no modifica bancos, código ejecutable, configuración ni repositorios independientes.

## Dictamen ejecutivo

**No se han identificado regresiones bloqueantes** en las matrices de pruebas de gramática, morfología, vocabulario, seguridad y navegación que ejecuta GitHub Actions. La validación del commit definitivo `534bf98` superó **385/385 pruebas generales** y **107/107 pruebas del núcleo**, pruebas de Chromium y de subruta GitHub Pages; el despliegue de la PR #85 finalizó correctamente:

- CI del commit en `main`: https://github.com/ArchaiosMagister/ScholaClassica/actions/runs/43690144001
- PR integrada: https://github.com/ArchaiosMagister/ScholaClassica/pull/85

**Queda una carencia técnica funcional acotada:** el módulo de vocabulario integrado no cuenta con service worker/caché propios. Su funcionamiento offline total **no está garantizado**, a diferencia de la portada, la gramática y la práctica morfológica. Hay asimismo reservas curriculares que **no son defectos**: la ausencia de listas exigibles para las últimas unidades y el vocabulario griego alfabético no adscrito.

## 1. Cobertura académica y secuenciación

| Indicador | Latín I | Griego I | Resultado |
|---|---:|---:|---|
| Unidades de gramática | 10 (UD1–UD10) | 14 (UD1–UD14) | Mismo número y secuencia en castellano y valenciano |
| Fichas/paradigmas de práctica morfológica | 89 | 92 | Unidades acumulativas sin anticipación de fichas |
| Entradas de vocabulario «General» | 741 | 332 | Corpus de estudio; no equivale a exigible |
| Entradas de vocabulario «Examen» | 115 | 171 | Corpus independiente, sin convertir General en exigible |
| «Todo el vocabulario» (fichas después de deduplicación conservadora) | 745 | 385 | Mantiene identidades, sentidos y procedencia |
| Material complementario | 140 entradas etiquetadas UD11–12 | 184 entradas sin unidad acreditada | Etiquetas solo de presentación |
| Última unidad con vocabulario explícito de examen | UD7 | UD10 | Falta de lista adicional documentada: no reasignar automáticamente |

Los recuentos de «Todo» representan **fichas diferentes**, no lemas, familias léxicas ni formas flexivas. Una misma ficha puede incluir varias unidades, por lo que las cifras por grupo **no son sumables**.

**Contraste curricular:** `docs/CONCILIACION_VOCABULARIO_MORFOLOGIA_2026-11-14.md`; `tests/morphology-vocabulary-reconciliation.test.mjs` y `scripts/audit-morphology-vocabulary.mjs`. Se comprueba primera unidad de habilitación segura, unidades agrupadas, tipos de palabra y posibilidad real de producir preguntas. No se presupone que todas las entradas léxicas deban poseer paradigma de práctica.

### Progresión acumulativa de las fichas morfológicas

| Unidad | Latín I: nuevas / acumuladas | Griego I: nuevas / acumuladas |
|---|---|---|
| UD1 | 11 / 11 | 3 / 3 |
| UD2 | 7 / 18 | 2 / 5 |
| UD3 | 13 / 31 | 6 / 11 |
| UD4 | 16 / 47 | 10 / 21 |
| UD5 | 6 / 53 | 6 / 27 |
| UD6 | 4 / 57 | 2 / 29 |
| UD7 | 19 / 76 | 13 / 42 |
| UD8 | 3 / 79 | 18 / 60 |
| UD9 | 7 / 86 | 2 / 62 |
| UD10 | 3 / **89** | 6 / 68 |
| UD11–14 | No procede | UD11: 2 / 70; UD12: 4 / 74; UD13: 3 / 77; UD14: 15 / **92** |

**Limitación filológica:** las 89 y 92 fichas están documentadas conforme al modelo de procedencia del motor, pero esto **no certifica individualmente cada forma** de todos los paradigmas. La evidencia específica de nueve sustantivos griegos cubre 90/90 casillas: `docs/GRIEGO1_COTEJO_90_CASILLAS_9_SUSTANTIVOS_2026-11-14.md`.

El plural de `οὐρανός` conserva sus cinco casillas en el banco y el historial, pero está excluido del sorteo de análisis, elección, escritura, tabla y sintagma por decisión docente, con tests negativos de las cinco exclusiones. El singular sigue practicable.

## 2. Gramática bilingüe: correspondencia y aislamiento

**Griego I:** el currículo fuente fijado tiene 14 unidades en ambas lenguas. La comparación de todos sus epígrafes detecta idéntico número de temas por unidad y **ninguna diferencia en el número de tablas por tema entre ES y VAL**. Las dos interfaces se derivan del mismo SHA bloqueado de Appendix; la corrección ortotipográfica de `ἀγαθή` se incorpora en ambos currículos derivados.

**Latín I:** el currículo de origen tiene 10 unidades y el mismo número de epígrafes por unidad en ambas lenguas. En la fuente original, tres lecciones en castellano de UD4–UD5 y la sustantivación de UD3 se encontraban remitidas a capítulos externos; el build actual las incorpora dentro de los currículos derivados y las comprueba mediante `tests/gramatica-latin1-curriculum.test.mjs`. Las pruebas cotejan paridad de cuatro lecciones, paradigmas, ausencia de recursos externos y exclusión de contenidos del perfecto pasivo antes de UD9. Las correcciones editoriales de UD1, UD3, UD6, UD7 están probadas en ambos idiomas por `tests/gramatica-editorial-latin1-griego1.test.mjs`.

**Separación de productos:** la web de gramática conserva material **teórico sin ejercicios**; la práctica se ofrece exclusivamente en el módulo de morfología. Los adaptadores solo escriben currículos derivados en `dist`. Las fuentes originales de Appendix y las páginas de los demás cursos siguen intactas.

**Reserva de verificación humana:** la paridad estructural y las pruebas automáticas no sustituyen una lectura filológica frase por frase de las traducciones castellanas y valencianas en todas las lecciones.

## 3. Conciliación del vocabulario

- **Latín I:** 140 fichas de General están etiquetadas `UD 11–12`, 82 solo tienen esa etiqueta y **73** no encuentran en General otro registro del mismo lema en una unidad previa. Se muestran como **«Ampliación · fuera de las unidades habituales»**, pero conservan el valor `UD 11–12` en los datos y en los filtros.
- **Griego I:** 184 fichas procedentes del repertorio alfabético carecen de unidad acreditada; se muestran como **«Complementario · sin unidad asignada»**, sin convertirse en exigibles.
- **Fichas de examen ausentes en General:** 2 de Latín I y 22 de Griego I siguen disponibles en «Examen» y «Todo»; esta relación entre corpus es intencionada.
- **Adscripciones distintas aceptadas:** `ac`, `atque`, `flumen`, `Caesar`, `eques` muestran y mantienen las unidades independientes de General y Examen. Diferentes acepciones no se fusionan por coincidencia del lema.
- **Reserva curricular abierta:** Examen de Latín I no tiene etiquetas UD8–UD10 y Examen de Griego I no tiene etiquetas específicas UD11–UD14. Esto es una diferencia entre materiales docentes, no evidencia suficiente para asignar vocabulario de manera automática.

El archivo `data.js` del repositorio independiente, las 2.055 fichas y los IDs están protegidos por pruebas; los ajustes de Latín de 4.º, autorizados anteriormente, se mantienen en la copia integrada. «Todo» respeta unidades y procedencia de cada modalidad, sin perder historial de práctica previo.

## 4. Funcionalidad, dispositivos y almacenamiento

| Recurso | En línea | Uso offline comprobado por CI | Progreso / alcance |
|---|---|---|---|
| Portada ScholaClassica | Sí | **Sí**, precaché propio | Preferencia de itinerario local |
| Gramática ES/VAL, Latín I y Griego I | Sí | **Sí**, caché de contenidos de ambas lenguas | Solo consulta, sin ejercicios |
| Práctica morfológica | Sí | **Sí**, SW propio y banco precargado | Repaso inteligente local bajo `schola-morphology-review-v1` |
| Vocabulario General / Examen / Todo | Sí | **No acreditado**: sin SW ni precaché de su módulo | `classics-progress-v1`, exportación e importación locales |

**Hallazgo funcional V1 — prioridad media:** `scripts/build.mjs` no instala SW propio en `apps/vocabulario`, y `scripts/portal-sw.template.js` excluye expresamente rutas `apps/*`. El test `tests/vocabula-browser.mjs` comprueba en Chromium la aplicación **en línea**, con servicio Supabase simulado, no una navegación offline equivalente. Aunque la caché HTTP del navegador pueda facilitar algún acceso, **no debe prometerse funcionamiento completo sin conexión**. Intervención futura: añadir service worker con ámbito exclusivo de Vocabula, caché versionada de recursos estáticos y pruebas de repaso offline con preservación del progreso; mantener el canal de sincronización/avisos pendiente cuando no hay red.

**Hallazgo funcional V2 — prioridad baja:** en `scripts/adapt-vocabula-all.mjs`, un aviso **genérico** enviado desde «Todo el vocabulario», sin ficha concreta, se transmite al backend con modalidad `general`, porque este no reconoce `all`. Se evita un valor de backend inválido, pero en el contexto docente podría perderse la indicación de que el alumno estaba usando «Todo». Los avisos sobre fichas concretas sí conservan el `entry_id` representativo. Antes de modificarlo, revisar el contrato del endpoint y cómo añadir contexto sin ampliar permisos ni romper el área de profesor.

**Cobertura automatizada y limitaciones:** `tests/browser.mjs`, `tests/morphology-browser.mjs`, `tests/vocabula-browser.mjs` y `tests/pages-subpath-browser.mjs` comprueban navegación, ausencia de errores JavaScript, cachés aisladas, rutas bajo la subcarpeta real de Pages y vistas Chromium. No equivalen a una prueba manual en Safari/iPhone/iPad ni a un cotejo de un banco de 2.055 palabras con fuentes lexicográficas individuales.

## 5. Riesgos, pendientes y orden recomendado

1. **P1 — Offline del vocabulario:** implantar y probar caché aislada en ScholaClassica, sin alterar Vocabula independiente ni los canales docentes; verificar offline en móvil y preservación/importación del progreso.
2. **P2 — Revisión docente de exigibilidad:** decidir si se facilitarán listas de examen para Latín I UD8–UD10 y Griego I UD11–UD14. **No inventar** listas a partir del vocabulario General ni del temario de gramática.
3. **P3 — Contexto de avisos en «Todo»:** resolver el detalle de procedencia genérica preservando las validaciones y el contrato del backend.
4. **P4 — Prueba manual en Safari/iPad:** comprobar restauración de estado, instalación, actualización de SW, navegación entre idiomas y repaso sin conexión de las apps que sí disponen de esa capacidad.

### Resultado de la auditoría

**Gramática y morfología: suficientemente consolidadas a nivel curricular y de pruebas automatizadas**, sin incidencias bloqueantes demostradas. **Vocabulario: coherente curricularmente**, con la **carencia offline** indicada. Las reservas sobre listas exigibles y la verificación filológica individual de todo el banco permanecen expresas, sin fingir que están cerradas.

**Control de cambios:** este documento se conserva en una rama separada; no se modifica código, banco, unidades ni fuente académica y no se publica ninguna corrección adicional.
