# Transición segura desde Appendix, Evolutio y Vocabula a ScholaClassica

**Auditoría y mejoras: 20 de noviembre de 2026.** Esta fase no archiva ni borra repositorios, no importa cambios académicos nuevos, no altera bancos ni motores y no modifica cuentas ni datos personales.

## Situación técnica contrastada

| Origen | Commit académico fijado en ScholaClassica | Versión del original observada (main) | Diferencias posteriores contrastadas | Qué se conserva |
| --- | --- | --- | --- | --- |
| [Appendix-grammaticae](https://github.com/ArchaiosMagister/Appendix-grammaticae) | `6e9ae22d98c10f8752329d0fa65ad8dd882dcde9` | `40d06bff955087d81c5b3ab502422d77caf3186a` | 4 commits posteriores: aviso bilingüe hacia ScholaClassica en `assets/theme.js`, pruebas y workflow Pages; sin modificación del banco curricular | Ambos idiomas, páginas antiguas y enlaces a sus secciones |
| [EvolucionFonetica](https://github.com/ArchaiosMagister/EvolucionFonetica) | `901dacb125ee7894ea9d11faf7b0d0afa7e713b5` | `5a464a2c67f6dbc3bd6f6a7c45e862dc6af71349` | 6 commits posteriores: aviso visible de continuidad en la web antigua, precaución con la caché del service worker, pruebas; banco de 522 palabras intacto | App histórica; copia interna ampliada con 100 ejercicios solo en ScholaClassica |
| [VocabulaLatinaGraecaque](https://github.com/ArchaiosMagister/VocabulaLatinaGraecaque) | `a7be2161a2401816ede78a96981daaac6850b8d2` | `8214e538e3ed242cf6aab1e06cb59e9ed5ee6174` | 12 commits posteriores: aviso de transición, exportación/importación del progreso del repaso gramatical antiguo, tema y pruebas; `data/morphology-coverage.json` regenerado, sin modificaciones de `data.js` ni del motor de vocabulario | Vocabulario y sus fichas, IDs, tres corpus e historial; repaso separado en ScholaClassica |

Las diferencias fueron verificadas con la comparación de commits de GitHub para cada origen. Los tres repositorios originales tienen GitHub Pages habilitado (`has_pages=true`), pero **eso no equivale a comprobar cada URL mediante un dispositivo real**, ni garantiza que un PWA instalado se haya actualizado o que nadie siga utilizando esas páginas.

### Equivalencias y límites

- Appendix (material de consulta): [web anterior](https://archaiosmagister.github.io/Appendix-grammaticae/) → [gramática en ScholaClassica](https://archaiosmagister.github.io/ScholaClassica/apps/gramatica/index.html). La versión antigua añade un aviso informativo y un enlace a la ruta equivalente, sin redirigir ni borrar preferencias locales.
- Evolutio: [web anterior](https://archaiosmagister.github.io/EvolucionFonetica/) → [Evolutio integrado](https://archaiosmagister.github.io/ScholaClassica/apps/evolucion-fonetica/index.html). El original sigue activo y el aviso señala que el banco de ScholaClassica está ampliado. No se ha encontrado historial de respuestas exportable en el motor clásico; sus temas visuales son preferencias locales de cada origen.
- Vocabula: [vocabulario anterior](https://archaiosmagister.github.io/VocabulaLatinaGraecaque/) → [vocabulario integrado](https://archaiosmagister.github.io/ScholaClassica/apps/vocabulario/index.html). Conserva `classics-progress-v1`, 2.055 IDs y JSON `{version:1, progress}`. La migración real entre **dos contextos independientes** ya está cubierta por `tests/vocabula-traspaso-browser.mjs`. Vocabula **solo** ofrece práctica de vocabulario en ScholaClassica.
- Repaso: [gramática práctica antigua](https://archaiosmagister.github.io/VocabulaLatinaGraecaque/gramatica.html) → [repaso gramatical independiente](https://archaiosmagister.github.io/ScholaClassica/apps/repaso-gramatica/index.html). El original actual incorpora `gramatica-progreso.js`, cuyo Git blob (`cc6e010ac002aa69f7e3ca2dc8a1657926368ebb`) coincide **byte por byte** con `scripts/grammar-progress-client.js` de ScholaClassica. Exporta `schola-grammar-progress/v1`, con `kind:"grammar"`, `storageKey:"classics-grammar-v1"`. La versión integrada ahora ofrece 144 preguntas, 87 de sintaxis; las primeras 120 mantienen exactamente sus índices e identificadores.

**No existe transferencia automática de `localStorage` entre orígenes diferentes.** Es imprescindible exportar un archivo JSON e importarlo desde el módulo correspondiente. Nunca pedir contraseñas ni datos personales; la operación se ejecuta en el navegador del alumnado. Conservar siempre el archivo exportado y comprobar las estadísticas antes de desinstalar la aplicación anterior.

## Trabajo incorporado en esta fase

1. La portada incluye un apartado plegable «Conservar mi progreso de las aplicaciones antiguas» con enlaces a las dos herramientas de origen y destino e instrucciones para el alumnado. No se incorporan redirecciones, botones con acciones ocultas ni sincronización externa.
2. `tests/repaso-legado-traspaso-browser.mjs` reproduce una instalación antigua y una nueva en contextos independientes de Chromium. Inserta **solo en el servidor de pruebas**, sin modificar `vendor/`, la versión del cliente exportador idéntica a la ya publicada en Vocabula antiguo. Comprueba una práctica real, exportación, importación, historial antiguo, preguntas nuevas posteriores a `concept-119`, traspaso de vuelta y rechazo de un JSON de vocabulario. Mantiene intacta la clave `classics-progress-v1`.
3. `tests/migracion-progreso-legado.test.mjs` protege los enlaces, la redacción, la compatibilidad de esquema y la prohibición de retiradas automáticas.
4. GitHub Actions incorpora esta prueba de navegador como **barrera previa a cualquier publicación**. No se modifica el flujo de Pages ni las fuentes académicas.

## Bloqueos reales para archivar originales

Aunque ScholaClassica puede construir Appendix, Evolutio y Vocabula con **cero checkouts originales**, ese hecho no demuestra que sea seguro archivar o borrar los repositorios. Debe completarse individualmente:

- **Uso actual y compatibilidad:** verificar enlaces de clases y documentos, favoritos compartidos, QR, accesos antiguos y aplicaciones instaladas en iPad/iPhone. Los enlaces antiguos deben seguir teniendo un destino accesible y no debe haberse producido una pérdida de progreso.
- **Respaldo fuera del repositorio:** una copia restaurable de cada origen, que incluya historia Git, ramas, etiquetas y recursos; respaldar por separado datos/servicios que no formen parte del código. No afirmar que el backup está hecho si no hay constancia.
- **Pruebas reales del traslado:** al menos una exportación/importación en Safari de iPadOS y comprobación de la versión instalada del service worker, además de CI.
- **Backend y URL:** revisar el impacto de Supabase, avisos, dominios, Pages y SW; archivar un repositorio no significa automáticamente apagar Pages, y borrar sí puede afectar al servicio histórico.
- **Decisión docente independiente:** autorizar primero, si procede, el **archivo reversible** de cada origen. No solicitar ni aplicar todavía borrado definitivo. GeneradorExamenes, Palabra del día, Examinator2 y el creador de textos tienen finalidades propias; **no son repositorios candidatos a retirar en esta fase**.

**Conclusión actual:** la transición informativa y el traslado del progreso de vocabulario y de repaso gramatical están respaldados por implementaciones verificables y pruebas automáticas; **ninguna fuente original tiene autorización para archivo o eliminación**. Mantenerla activa hasta cerrar la lista anterior.
