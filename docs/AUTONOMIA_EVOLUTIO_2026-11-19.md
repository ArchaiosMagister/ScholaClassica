# Evolutio castellano: fuente íntegra interna (19-11-2026)

## Alcance y decisiones
ScholaClassica conserva el Evolutio de origen completo en `vendor/evolutio`,
sin modificar su fuente docente ni activar la versión valenciana inacabada.

- Repositorio original: `ArchaiosMagister/EvolucionFonetica`.
- Commit fuente fijado: `901dacb125ee7894ea9d11faf7b0d0afa7e713b5`.
- Árbol Git fuente y copia: `91fb41736365ab4bd4f81ca8b265ceb765907354`.
- Inventario original: **53 archivos**, **1.608.767 bytes**, **522 étimos** en `data/pilot.json`.
- ScholaClassica añade en la **copia de compilación** 100 vocablos, mantiene 622
  identificadores distintos, aplica las etiquetas de dificultad ya revisadas,
  el funcionamiento castellano, el aprendizaje y la práctica.
- El árbol de origen contiene los scripts, pruebas, documentación, iconos y el
  banco original completo. Los cambios de ScholaClassica se aplican en `dist`,
  no en `vendor/evolutio`.
- Se preservan sin publicar las matrices de trabajo de valenciano; solamente
  se sustituye la ruta de origen para su contraste contra el mismo SHA original.
- Los workflows de integración y LEMLAT3 no descargarán los repositorios
  independientes de Appendix, Evolutio ni Vocabula para compilar.
- GeneradorExamenes seguirá siendo PWA independiente.

## Barreras de integridad y regresión
`audit:evolutio:vendor` coteja el árbol Git, cada blob y el banco. El build
rechaza `EVOLUTIO_SOURCE`. La auditoría transversal debe comunicar **cero**
checkouts externos requeridos para los tres módulos académicos.

Se conservarán en CI: pruebas originales de Evolutio, comprobación de 622
fichas, matriz de castellano en Chromium, triple intento y autorrevelado,
PWA/offline y progreso; el resto de módulos y la identidad docente.

## Retirada de originales
**Independencia de compilación no autoriza archivar ni borrar** los repositorios
originales. Requiere revisar URLs históricas, instalaciones PWA, enlaces
externos, backends y respaldos restaurables y solicitar autorización
independiente antes de archivar. Esta PR no elimina repositorios ni los publica
en otras URL, y tampoco publica la versión valenciana aplazada.
