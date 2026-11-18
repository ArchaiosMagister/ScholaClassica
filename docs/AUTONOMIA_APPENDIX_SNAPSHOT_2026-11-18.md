# Autonomía de Appendix en ScholaClassica — migración interna, 18/11/2026

## Estado de esta PR

La rama `feature/autonomia-appendix-vendor-20261118` incorpora **el código fuente completo de Appendix dentro de ScholaClassica** y modifica sus flujos de compilación y pruebas para dejar de descargar el repositorio independiente. La migración se mantiene en **PR #125 en borrador** y no se publica hasta que todas las pruebas y la revisión de compatibilidad hayan superado la validación.

### Evidencia de que la fuente es idéntica

- Repositorio original: `ArchaiosMagister/Appendix-grammaticae`.
- Commit docente fijado: `6e9ae22d98c10f8752329d0fa65ad8dd882dcde9`.
- Árbol Git original: `ac24b5b997d3a37d78ef43de36085b850b22e472`.
- Árbol Git de `vendor/appendix` en ScholaClassica: **el mismo SHA**.
- Total: **111 archivos y 2.160.046 bytes**, incluidas 90 páginas HTML, ambos currículos completos (castellano y valenciano), archivos ocultos y el PNG `apple-touch-icon.png` de 9.230 bytes.

La importación puntual se ejecutó con GitHub Actions, verificó el SHA del árbol antes de crear el commit y solo incorporó archivos bajo `vendor/appendix/`. La automatización temporal con permiso de escritura fue retirada una vez completada la importación. Se conservan todos los archivos originales como historia y fuente versionada.

### Compilación y dependencias

- `config/sources.lock.json` añade `sourceMode: "vendored"`, `path: "vendor/appendix"` y `treeSha`. Se conserva el SHA original para procedencia académica.
- `scripts/verify-vendored-appendix.mjs` comprueba antes de compilar el árbol Git, los **111 objetos** y sus bytes reales de disco, el tamaño total, los currículos ES/VAL y el icono. Se puede ejecutar con `npm run audit:appendix:vendor`.
- `scripts/build.mjs` copia `vendor/appendix` y aplica los mismos adaptadores y recursos de antes. Rechaza `APPENDIX_SOURCE` externa. El resultado sigue siendo `dist/apps/gramatica`.
- `scripts/build-morphology.mjs` compila sus ejercicios desde el currículo y las páginas conservados en `vendor/appendix`, no desde `.sources/appendix`.
- Los análisis de las 184 fichas griegas sin unidad y todas las pruebas de gramática y Morfología comparan la fuente interna con el resultado publicado en el artefacto.
- Los workflows `integracion.yml` y `lexicografia-lemlat3.yml` **ya no tienen checkout de Appendix**. Ambos comprueban la copia interna. El test `tests/sources-workflows-lock.test.mjs` impide reintroducir la descarga accidentalmente.

Evolutio y Vocabula permanecen como checkouts externos fijados. Etymologicon, Morfología, el portal y el área docente conservan el mismo funcionamiento y su aislamiento.

### Pruebas obligatorias de la fase de autonomía

1. El árbol Git de la copia interna y los 111 archivos deben coincidir con el original (incluidos los binarios).
2. `test ! -d .sources/appendix` debe cumplirse en CI **desde el checkout limpio**.
3. Se debe ejecutar `node vendor/appendix/scripts/validate-site.mjs` usando únicamente la copia integrada.
4. Deben construirse correctamente la gramática ES/VAL, Morfología, Vocabula, Evolutio, Etymologicon y el área docente.
5. La batería Node debe pasar sin consultar `.sources/appendix`; los adaptadores han de preservar los contenidos y los 522 registros académicos valencianos sin publicarlos.
6. Chromium debe comprobar navegación, las rutas de GitHub Pages, los ejercicios de Morfología, los accesos de Vocabula, las PWA offline y el aislamiento docente.
7. El workflow independiente de LEMLAT3 debe conservar su capacidad de compilar sin el repositorio Appendix. Ese flujo requiere sus otras dependencias académicas externas, que no se han modificado.
8. La publicación de Pages debe quedar **omitida** en la rama de PR.

Los resultados verificables se adjuntan a GitHub Actions: `appendix-autonomo-manifiesto-111` (solo manifiesto, por 30 días). Los 111 archivos ya no dependen de la caducidad de los artefactos porque están versionados en el propio repositorio.

### Lo que todavía no debe hacerse

**No archivar ni borrar `Appendix-grammaticae` todavía.** La autonomía técnica de la compilación no demuestra por sí sola que nadie utilice sus URLs históricas ni que las PWA ya instaladas puedan desaparecer. Antes de archivar hay que revisar enlaces, dispositivos, accesos y crear una copia de seguridad fuera de GitHub, además de obtener autorización expresa.

No se fusiona esta PR, no se publica ningún cambio ni se cambia el banco del alumnado mientras la verificación esté pendiente. La versión valenciana de Evolutio sigue aparcada. La PR #124 de auditoría funcional castellana es independiente y está pendiente de revisión e integración controlada.
