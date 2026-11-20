# Preparación de retirada reversible · URL históricas, PWA y respaldo local
*20 de noviembre de 2026 · exclusivamente auditoría; no implica autorización de archivo ni borrado.*

## Estado comprobado frente a reservas pendientes

La compilación de ScholaClassica necesita **cero checkouts** de los repositorios académicos originales: Appendix, Evolutio y Vocabula se conservan íntegros bajo `vendor/`, con árbol Git y SHA académico fijado. Sus repositorios de origen, webs antiguas, cachés y vínculos siguen siendo **independientes**.

| Comprobación | Evidencia automática | Requisito adicional antes de archivo |
| --- | --- | --- |
| Independencia de compilación | `npm run audit:repositorios:retirada` y validación de fuentes internas | Ninguno, ya superado |
| Vocabulario exportación/importación | `tests/vocabula-traspaso-browser.mjs` con dos instalaciones aisladas | Una prueba manual real en Safari iPadOS |
| Repaso gramatical exportación/importación | `tests/repaso-legado-traspaso-browser.mjs` con dos instalaciones aisladas | Una prueba manual real en Safari iPadOS |
| URL antiguas y nuevas accesibles | `scripts/audit-live-legacy-routes.mjs` + workflow separado `vigilar-rutas-legadas.yml` | Revisar enlaces de materiales de clase, QR, marcadores y aplicaciones instaladas |
| Avisos y cachés de transición | Ocho verificaciones sobre scripts de aviso, cliente de progreso y service workers | Observar actualización de una PWA instalada en un dispositivo real |
| Copia restaurable de código con referencias | `scripts/backup-originals.mjs` (herramienta local) y prueba Git con repositorio ficticio | Ejecutar localmente para los repositorios reales; duplicar el respaldo en otro soporte y verificarlo |
| Datos remotos de Supabase/servicios | Fuera del ámbito de los bundles Git | Inventario de proyectos, configuraciones, permisos, políticas y exportaciones de datos necesarias |
| Archivo de repositorio | **No autorizado** | Nueva decisión expresa, individual por repositorio |
| Borrado de repositorio | **No autorizado** | Evaluación posterior, diferente del archivo |

## Auditoría de URL publicada: qué comprueba

La nueva especificación `config/retirada-rutas-publicas.json` fija ocho equivalencias entre páginas antiguas e integradas:

- Appendix: portada, Latín I UD1, sintaxis latina, sintaxis griega y una ruta de gramática valenciana.
- Evolutio: inicio antiguo frente al integrado en castellano.
- Vocabula: entrada de léxico antiguo frente al nuevo módulo de vocabulario.
- Repaso: antigua práctica de gramática frente al módulo separado de ScholaClassica.

El script comprueba que **ambas direcciones** siguen respondiendo con un documento HTML y que **ocho recursos adicionales** conservan los avisos, la importación de progreso gramatical y las cachés separadas de Evolutio y Repaso. No inicia sesiones, no genera respuestas, no usa datos del alumnado y no redirige a nadie. El informe se almacena exclusivamente como artefacto temporal de Actions, **no en GitHub Pages**.

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
6. **Duplicar después** la carpeta en otro soporte físico protegido; comparar sus hashes y dejar constancia de dónde está guardada. La creación de la primera carpeta no acredita la segunda copia.

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
