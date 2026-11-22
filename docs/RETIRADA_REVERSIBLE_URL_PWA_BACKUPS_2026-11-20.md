# Preparación de retirada reversible · URL históricas, PWA y respaldo local
*20 de noviembre de 2026 · exclusivamente auditoría; no implica autorización de archivo ni borrado.*

> **Revisión de alcance (22/11/2026):** la decisión actual es **valorar un archivo reversible, no borrar**. Ya **no se exige conservar ni migrar el progreso de las aplicaciones antiguas**, ni crear copias físicas en el Mac para continuar la evaluación. Los procedimientos de respaldo y traspaso que aparecen más abajo **permanecen disponibles, pero son opcionales**. El informe actualizado es [Dictamen de archivo reversible](DICTAMEN_ARCHIVO_REVERSIBLE_2026-11-22.md). Los controles que siguen etiquetados como "requisito" en este documento eran criterios conservadores anteriores, no obligaciones vigentes para este usuario; la continuidad de Pages y los servicios remotos sí deben comprobarse. El archivo sigue pendiente de autorización individual.

## Estado comprobado frente a reservas pendientes

La compilación de ScholaClassica necesita **cero checkouts** de los repositorios académicos originales: Appendix, Evolutio y Vocabula se conservan íntegros bajo `vendor/`, con árbol Git y SHA académico fijado. Sus repositorios de origen, webs antiguas, cachés y vínculos siguen siendo **independientes**.

| Comprobación | Evidencia automática | Requisito adicional antes de archivo |
| --- | --- | --- |
| Independencia de compilación | `npm run audit:repositorios:retirada` y validación de fuentes internas | Ninguno, ya superado |
| Vocabulario exportación/importación | `tests/vocabula-traspaso-browser.mjs` con dos instalaciones aisladas | Una prueba manual real en Safari iPadOS |
| Repaso gramatical exportación/importación | `tests/repaso-legado-traspaso-browser.mjs` con dos instalaciones aisladas | Una prueba manual real en Safari iPadOS |
| URL antiguas y nuevas accesibles | Matriz v2: 18 pares, 10 destinos nuevos y 12 verificaciones de caché/avisos; workflow `vigilar-rutas-legadas.yml` | Revisar enlaces de materiales de clase, QR, marcadores y aplicaciones instaladas |
| Avisos y cachés de transición | Ocho verificaciones sobre scripts de aviso, cliente de progreso y service workers | Observar actualización de una PWA instalada en un dispositivo real |
| Copia restaurable de código con referencias | `scripts/backup-two-copies.mjs` prepara ambas copias y verifica restauración de la segunda en dos volúmenes; se mantienen las herramientas anteriores y sus tests ficticios | Ejecutar en Mac con disco externo independiente y cifrado, confirmar físicamente el soporte y guardar ambas copias |
| Datos remotos de Supabase/servicios | Fuera del ámbito de los bundles Git | Inventario de proyectos, configuraciones, permisos, políticas y exportaciones de datos necesarias |
| Archivo de repositorio | **No autorizado** | Nueva decisión expresa, individual por repositorio |
| Borrado de repositorio | **No autorizado** | Evaluación posterior, diferente del archivo |

## Auditoría de URL publicada: qué comprueba

La ampliación del 21 de noviembre usa el esquema `schola-live-legacy-routes/v2` y distingue tres ámbitos:

- **18 pares de rutas** de repositorios antiguos frente a ScholaClassica. Appendix cubre accesos generales y directos a Latín I (incluida UD10), Latín II, Griego I (UD5), Griego II, morfología y sintaxis en castellano y valenciano. Se mantienen Evolutio, Vocabula y el antiguo repaso gramatical.
- **10 destinos integrados sin homólogo directo**: portada, unidades propias de Latín 4.º, Morfología nativa, Etymologicon, acceso por Griego I a Vocabula y al repaso. No se presentan como equivalentes a una página antigua que no existe.
- **12 comprobaciones de scripts y cachés**: avisos legados, conservación del progreso del repaso y aislamiento de cachés de gramática, Morfología, Etymologicon, Evolutio, Vocabula y Repaso.

Cada par exige que ambas URL devuelvan HTML identificable del módulo esperado y que no redirijan a otra ruta, aunque permanezcan dentro de GitHub Pages. Se preserva exactamente la cadena de consulta de curso y unidad en los pares de Appendix. Un documento HTML genérico o una redirección silenciosa no se considera equivalencia comprobada.

**Limitación fundamental:** la respuesta HTTP, el título y una marca de módulo no demuestran que todas las preguntas, paradigmas, filtros, conexiones Supabase o datos de cada página sean equivalentes. Las pruebas de navegador de ScholaClassica verifican aparte el currículo y los ejercicios integrados; la verificación docente en iPad físico sigue pendiente antes de cualquier archivo.

El script solo lee contenidos públicos: no inicia sesiones, no genera respuestas, no usa datos del alumnado y no redirige a nadie. El informe v2 se almacena exclusivamente como artefacto temporal de Actions, **no en GitHub Pages**.

La ejecución automática semanal es una alerta de disponibilidad; una respuesta 200 no demuestra por sí misma que la web funcione correctamente en un iPad, ni que Pages continúe sirviendo desde el repositorio original si se archivase o borrase.

El flujo es independiente de `integracion.yml`: un fallo transitorio de la web antigua no suspende ni fuerza automáticamente la publicación de ScholaClassica.

### Comandos de auditoría

Desde la copia local de ScholaClassica, con Node.js 22 o posterior:

```bash
npm run audit:retirada:urls
```

El informe queda en `build/academic-audits/retirada/urls-vivas.json`, una ruta de compilación no publicada. La prueba offline del propio auditor es:

```bash
node --test tests/retirada-rutas-publicas.test.mjs
```

## Respaldo Git restaurable: instrucciones para Mac y Linux

**El respaldo no se ha generado automáticamente.** Se puede preparar desde un ordenador personal, con Node.js 22 o posterior y Git instalado. El archivo incluye historial y ramas Git, por lo que **podría conservar secretos antiguos** si los hubiera en commits históricos. No publicarlo en Pages, no adjuntarlo a incidencias ni enviarlo al chat.

1. Crear una carpeta segura **fuera del repositorio ScholaClassica**, preferentemente en un disco externo cifrado.
2. Ver el plan sin descargar nada:
   ```bash
   npm run backup:plan
   ```
3. Para generar las tres copias locales, cambiar la carpeta del ejemplo por una propia:
   ```bash
   node scripts/backup-originals.mjs --dest "$HOME/Documentos/RespaldosScholaClassica"
   ```
4. La herramienta clona en modo espejo **únicamente** `Appendix-grammaticae`, `EvolucionFonetica` y `VocabulaLatinaGraecaque`, fijados en `config/sources.lock.json`. Para cada uno genera un `.bundle`, comprueba que contiene el commit académico original, ejecuta `git bundle verify`, restaura temporalmente un clon espejo independiente, coteja sus ramas y etiquetas y comprueba integridad con `git fsck`.
5. En el destino se crea `respaldo-git-verificado.json` con los SHA-256, número de referencias, commit académico fijado y revisión `main` incluida. La herramienta no sobreescribe copias anteriores.
6. **Duplicar después** la carpeta en otro soporte físico protegido; no subir los archivos a GitHub, correo ni a ChatGPT. La creación de la primera carpeta no acredita la segunda copia.
7. Comprobar automáticamente la segunda copia en el Mac o Linux (ambas carpetas deben ser accesibles, con Git y Node 22):
   ```bash
   npm run backup:verify-copies -- "$HOME/Documentos/RespaldosScholaClassica" "/Volumes/DiscoSeguro/RespaldosScholaClassica"
   ```
   Se verifican los manifiestos idénticos, tamaño y SHA-256 de **cada bundle de ambas carpetas**. La herramienta restaura los bundles de la **segunda** carpeta a repositorios Git temporales, compara el commit académico, rama principal y cantidad de referencias, ejecuta `git bundle verify` y `git fsck`, y borra los clones temporales. No borra ni modifica los originales, la segunda copia ni los repositorios de GitHub.
8. Comprobar **manualmente** que la segunda carpeta está realmente en otro dispositivo o soporte cifrado. El programa no acredita independencia física a partir de dos rutas y no genera certificados que autoricen archivo o borrado. Si falla cualquier comprobación, conservar los originales y resolver primero la incidencia.

Una restauración futura desde el bundle se podría iniciar mediante:

```bash
git clone --mirror Appendix-grammaticae.bundle Appendix-grammaticae-restaurado.git
git -C Appendix-grammaticae-restaurado.git fsck --full --no-reflogs
```

**Límites:** un Git bundle no guarda configuraciones de GitHub Pages, permisos, secretos de Actions, datos de Supabase, fotografías o archivos Git LFS externos, instalaciones PWA, preferencias de Safari ni respuestas de alumnos guardadas localmente. Estos componentes requieren inventario y, cuando proceda, respaldos independientes. **No incluye GeneradorExamenes**, que debe continuar como PWA y repositorio independiente.

## Comprobación manual pendiente en iPad

La emulación Playwright Chromium/WebKit es útil, pero **no se ha probado un iPad físico en esta auditoría**. Antes de solicitar el archivo del original, comprobar en Safari:

- [ ] Abrir los enlaces históricos de las tres aplicaciones y confirmar que las antiguas páginas siguen funcionando sin redirección forzosa.
- [ ] Vocabula: generar una respuesta de prueba en la web antigua, exportar el JSON en Archivos, importarlo en ScholaClassica y comprobar el mismo total y el mismo progreso. Mantener el archivo.
- [ ] Repaso gramatical: repetir el traspaso con su **JSON diferente** de gramática, sin mezclarlo con el de léxico. Comprobar también una pregunta nueva del módulo integrado.
- [ ] En la pantalla de inicio de iPadOS, abrir cada PWA instalada previamente y comprobar acceso, navegación, actualización y disponibilidad de los ejercicios ya descargados sin conexión.
- [ ] Revisar al menos un QR, enlace de aula o documento compartido que apunte a cada URL antigua, especialmente si usa `?lengua=`, `?curso=`, `?unidad=` o fragmentos `#`.
- [ ] Confirmar que no se han borrado respuestas ni historiales tras las pruebas y que las exportaciones se encuentran almacenadas en un lugar seguro. **No compartir archivos del alumnado**.

## Próxima puerta de decisión

Tras disponer de un informe de URL satisfactorio, un respaldo real con segunda copia confirmada, inventario de servicios externos y comprobación de iPad, presentar una recomendación **por repositorio** (mantener activo / archivar reversiblemente / conservar por dependencias). No tomar decisiones de eliminación o archivo a partir de una batería verde por sí sola.

La versión valenciana de Evolutio sigue aplazada. Vocabula integrado es **solo vocabulario**, Repaso gramatical y Morfología tienen sus módulos independientes. No modificar las bases académicas, IDs ni progreso.

## Guía de navegación visible para el alumnado (21/11/2026)

La portada incorpora «¿Qué ocurre con los enlaces a las webs antiguas?» como ayuda plegable. Relaciona los cuatro accesos académicos anteriores con sus módulos correspondientes de ScholaClassica y enlaza el apartado existente para exportar e importar progreso de Vocabula y Repaso.

**No se ha configurado ninguna redirección** en los repositorios originales ni en GitHub Pages. Los marcadores antiguos, materiales de clase, QR y PWA ya instaladas siguen apuntando al proyecto de origen. La navegación consolidada no implica migración silenciosa de datos.

Para tomar una decisión futura por cada repositorio siguen pendientes la comprobación manual en iPad, los respaldos Git verificados y duplicados y la auditoría de servicios externos. GeneradorExamenes se mantiene separado; no se autoriza retirar ningún repositorio en esta fase.

## Estado de dependencia remota comprobado el 21/11/2026

Consulta **solo de metadatos**, sin descargar filas, identidades ni claves: los proyectos de Supabase de **Vocabulario clásico** y **Palabra del día** siguen en estado `ACTIVE_HEALTHY`. Se identificaron como activas las cuatro funciones de vocabulario y docencia (`vocabulary`, `schola-login`, `schola-vocab-admin`, `schola-inbox`) y el puente `schola-palabra-inbox`. Las verificaciones de JWT de las funciones declaradas concuerdan con las necesidades de sus puntos de entrada: login público protegido por su propia lógica; bandejas y administración autenticadas; puente entre proyectos con comprobación de sesión en la función.

Esta observación no demuestra que las funciones puedan reconstruirse a partir del repositorio, que exista un respaldo PostgreSQL restaurable, que se haya exportado el almacenamiento ni que una función responda a una sesión real. **No** se han cambiado políticas, usuarios, secretos ni configuraciones.

La automatización del segundo respaldo permite cerrar una prueba **técnica**, pero no reemplaza la comprobación del soporte externo en un Mac, la migración real en iPad ni el respaldo privado de los dos proyectos Supabase. No se puede considerar apto para archivar ningún repositorio solo por pasar esta batería.

## Diferencias entre los repositorios originales y los snapshots integrados (21/11/2026)

La compilación es autónoma, pero los SHA de `vendor/` son **snapshots académicos**, no copias actualizadas automáticamente desde `main`. La inspección de GitHub `compare` de las revisiones fijadas frente a los repositorios públicos actuales dio estos resultados:

| Original | Commits posteriores al snapshot | Archivos modificados en la comparación | Interpretación |
| --- | ---: | ---: | --- |
| Appendix-grammaticae | 4 | 3 | Enlaces y avisos de transición, más sus comprobaciones |
| EvolucionFonetica | 6 | 4 | Aviso de transición, SW antiguo con caché aislada y sus pruebas |
| VocabulaLatinaGraecaque | 12 | 7 | Avisos, exportación de progreso gramatical, pruebas y metadatos de cobertura morfológica |

Estas diferencias son **conocidas**, pero **no forman parte necesariamente de las copias académicas en `vendor/`**. Los avisos de migración y la exportación de progreso se han implantado en las **webs originales** y se prueban allí; ScholaClassica dispone de su propia navegación y puente de progreso. La coincidencia de objetivos no permite afirmar equivalencia línea a línea. Tampoco hay que sobrescribir `vendor/` con los commits nuevos sin revisar sus efectos sobre adaptadores, identificadores, unidades y progreso.

El inventario `config/source-drift-baseline.json` fija, por cada fuente, el último SHA original revisado, el número de commits y el conjunto de rutas modificadas. El auditor `scripts/audit-source-drift.mjs` consulta en modo **solo lectura** los metadatos de `main` y la comparación GitHub con el snapshot académico. Si alguno de esos datos cambia, produce un informe de **revisión pendiente**, sin fusionar cambios ni modificar fuentes. Incluso con todo conocido, `safeToArchive` y `safeToDelete` permanecen a `false`.

La vigilancia se ejecuta por separado de la publicación de GitHub Pages (semanal y ante cambios del auditor). Su informe se guarda solo como artefacto temporal de Actions; no contiene tokens ni datos de alumnado. Un fallo de esta vigilancia **no despliega ni cancela** ScholaClassica, pero obliga a revisar las fuentes antes de decidir cualquier archivo.

Comprobación manual con Node.js 22:

```bash
npm run audit:fuentes:drift
```

La inspección de nuevos cambios se hace **por repositorio**, con decisión docente posterior de conservar la modificación exclusivamente en la web original, incorporarla a una adaptación de ScholaClassica o aplazarla. **No se sincronizan commits automáticamente**. Los respaldos privados reales, la independencia física de los soportes, las pruebas en iPad y las dependencias de Supabase siguen siendo condiciones pendientes.

## Comprobación física unificada (21/11/2026)

Consultar **[Protocolo de Mac e iPad](PROTOCOLO_MAC_IPAD_RETIRADA_2026-11-21.md)**. Ofrece un solo comando local para crear y verificar ambas copias en volúmenes diferentes, además de un recorrido detallado por Appendix, Vocabula (léxico y repaso independientes), Evolutio y las PWA instaladas. La prueba automatizada **no puede acreditar físicamente** que el segundo volumen sea un disco separado o cifrado; el titular debe comprobarlo. Ni la preparación del protocolo ni superar sus tests demuestran una prueba real en el dispositivo.
