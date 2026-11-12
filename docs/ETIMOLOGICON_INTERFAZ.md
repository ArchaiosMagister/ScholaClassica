> **Actualización:** se ha preparado la PWA independiente y sus recursos offline. Consulta [instalación y funcionamiento sin conexión](ETIMOLOGICON_PWA.md). El resto de esta guía describe la primera interfaz funcional.

# Etymologicon · Primera interfaz funcional

**Alcance:** ejercicio «Escribe dos derivados castellanos a partir de un étimo griego», sin publicación pública.

## Recorrido del alumno

1. Abrir Etymologicon desde la portada de ScholaClassica o directamente en \`/apps/etymologicon/index.html\`.
2. Elegir Griego I, una unidad (o todas) y el étimo, o seleccionar otro al azar.
3. Escribir dos derivados castellanos, corregir y ver el resultado.
4. Leer la puntuación sobre 2, el motivo y, si se reconoce una errata inequívoca, la grafía incorrecta y la correcta resaltadas.
5. Volver a intentar el mismo étimo, borrar respuestas o continuar con otro. Al editar cualquier campo se oculta la nota anterior, evitando un resultado desactualizado.

Se muestran únicamente étimos aprobados para dos derivados (**108** de **111**). Los otros tres están reservados a consulta. El selector de Griego II permanece desactivado hasta recibir su banco propio. Los filtros por unidad provienen de la programación auditada. La página funciona con teclado y lector de pantalla, es adaptable a móvil y ofrece temas automático, claro, oscuro y OLED; solo la preferencia de tema se almacena localmente. **No se han añadido estadísticas ni repetición espaciada en esta etapa.**

## Corrección

La pantalla **importa exactamente** \`shared/academic/greek-etymology/corrector/write-two.mjs\` en la copia de construcción; no duplica ni reimplementa la corrección. Puntuación de 1 punto por forma/variante autorizada, 0,5 por errata inequívoca y 0 por no catalogada, ambigua, no autorizada, excluida, sin respuesta o repetida. Las mayúsculas, espacios accidentales y normalización Unicode no restan puntos.

El resultado tiene una tarjeta por respuesta, con su estado y la puntuación individual. Las faltas se marcan en el segmento erróneo y en la grafía correcta mediante elementos accesibles; se muestra además la forma autorizada completa. Las palabras no catalogadas no se califican como falsas desde el punto de vista filológico.

## Construcción

\`npm run build\` realiza lo siguiente:

- Copia \`apps/etymologicon/\` a \`dist/apps/etymologicon/\`, manteniendo su identidad y su CSS independientes.
- Copia **el mismo** módulo corrector académico a \`dist/apps/etymologicon/corrector/write-two.mjs\`.
- Compila en Node el banco editorial fijado por la auditoría y exporta una versión mínima \`dist/apps/etymologicon/data/gr1.json\` con **111 étimos, 201 derivados y 217 relaciones**.
- Omite la procedencia del Excel, las notas internas, las decisiones editoriales y las definiciones innecesarias para esta modalidad.

**Los derivados autorizados sí se distribuyen en el navegador**, porque la corrección autónoma los necesita. Por tanto, este primer módulo está pensado para **repaso y práctica**, no para un examen de seguridad antitrampas. No contiene contraseñas ni acceso docente.

## Pruebas de regresión

- Tests Node: integridad del banco reducido, ausencia de metadatos internos y compatibilidad idéntica del corrector.
- Tests Chromium: carga, filtros, escritura, nota de 1,5/2, resaltado de erratas, duplicados, limpieza de resultados al editar, selección de otro étimo, tema OLED y persistencia, y adaptación a pantalla de 390 px.
- Continúan ejecutándose todos los tests previos de Appendix y Evolutio, incluidas comprobaciones de caché, enlaces e integridad de las fuentes.

**No se ha habilitado GitHub Pages ni un despliegue público.** La instalación PWA y el funcionamiento sin conexión ya están preparados y comprobados mediante navegador automatizado; consulta [ETIMOLOGICON_PWA.md](ETIMOLOGICON_PWA.md). Aún faltan las otras siete modalidades de ejercicios. Los repositorios originales siguen intactos.
