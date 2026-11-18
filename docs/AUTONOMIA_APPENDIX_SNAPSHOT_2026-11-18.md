# Autonomía de Appendix · fase 1, fuente original íntegra (18/11/2026)

## Finalidad

Preparar la futura **retirada segura** de \`ArchaiosMagister/Appendix-grammaticae\`, conservando el funcionamiento de las fichas gramaticales en castellano y los materiales originales en valenciano para una futura revisión. Este cambio **NO elimina la dependencia de compilación**, no fusiona ni publica la aplicación y no modifica el código visible de gramática.

La dependencia actual continúa en \`config/sources.lock.json\`:

- Repositorio: \`ArchaiosMagister/Appendix-grammaticae\`
- Commit exacto: \`6e9ae22d98c10f8752329d0fa65ad8dd882dcde9\`
- Fuente de compilación: \`.sources/appendix\`
- Estado: **dependencia activa**, no se autoriza borrar ni archivar el original.

## Primer producto: una copia completa, incluso los activos binarios

El nuevo comando \`npm run snapshot:appendix\` usa el checkout original **ya fijado por CI**:

1. Confirma que \`git rev-parse HEAD\` coincide con el SHA de \`sources.lock.json\`.
2. Lee el índice Git, exige rutas relativas, únicas y archivos normales.
3. Copia **los 111 archivos versionados**, incluidas las páginas HTML originales, ambos \`curriculum.json\`, scripts, estilos, icono \`apple-touch-icon.png\`, \`.nojekyll\` y los workflows históricos.
4. Calcula el **SHA-1 de objeto blob de Git** de cada archivo **antes y después de copiarlo** y coteja con la entrada exacta del índice. Incluye imágenes binarias; no hay conversiones a texto ni PNG regenerados.
5. Crea un manifiesto JSON con las 111 rutas, SHA y longitud de cada archivo.

Los resultados se escriben **solo en** \`build/academic-audits/appendix-autonomia/\`, fuera de \`dist/\` y \`public/\`. El resultado se sube a GitHub Actions **solo en PR** como artefacto \`appendix-fuente-original-verificada\`, con todos los archivos ocultos incluidos, durante 30 días.

La prueba \`tests/appendix-source-snapshot.test.mjs\` comprueba por su cuenta que los 111 SHA de la copia coincidan con el manifiesto y que este describa exactamente la revisión docente fijada. No se cambia el motor, ni el buscador, ni las cursivas, ni las UD, ni las rutas ni el funcionamiento offline de Appendix.

## Fases posteriores necesarias (no realizadas en esta PR)

**Fase 2 — Incorporación estable al repositorio.** Copiar el paquete completo bajo una carpeta fuente versionada, con todos los archivos y metadatos originales. La entrega temporal como artefacto de Actions **no constituye todavía una fuente independiente**: expirará y no sustituye al repositorio original.

**Fase 3 — Cambiar la construcción y las pruebas.** Adaptar \`scripts/build.mjs\` para usar la fuente versionada y eliminar gradualmente las referencias a \`.sources/appendix\`. La CI deberá construir desde un checkout limpio de ScholaClassica sin descargar Appendix ni depender de rutas antiguas, y comparar los recursos integrados por SHA.

**Fase 4 — Compatibilidad y regresiones.** Verificar lectura, navegación por curso y UD, sintaxis, búsquedas, estilos, PWA offline, enlaces internos, iOS, modo oscuro/OLED y acceso a las URL antiguas. Mantener las versiones en castellano y valenciano sin publicarlas ni modificar contenidos mientras se cambia únicamente la fuente.

**Fase 5 — Archivo reversible y borrado eventual.** Solo tras aprobación docente explícita, copia de seguridad y mantenimiento de enlaces, archivar el repositorio original en vez de borrarlo. El borrado definitivo requeriría revisión independiente, confirmación de su no utilización y una orden expresa: no se hace en esta fase.

## Condiciones de seguridad

- La fuente completa proviene exclusivamente del commit académico fijado. No se incorporan cambios posteriores de la rama principal original sin revisión.
- El generador del snapshot **no escribe** en \`dist/\`, \`public/\` ni en los ficheros originales; no ejecuta los workflows contenidos en la copia.
- \`main\` debe seguir compilando con el checkout original hasta que una PR posterior demuestre paridad completa.
- La entrega del snapshot no altera el funcionamiento de Vocabula, Morfología, Evolutio, Etymologicon, el portal ni el área docente.
- **No archivar ni eliminar** por el hecho de que el artefacto exista: todavía hay una dependencia técnica activa.
