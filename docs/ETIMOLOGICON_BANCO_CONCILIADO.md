# Etymologicon · reconciliación individual del banco Griego I

La auditoría docente adjuntada el **12 de noviembre de 2026** se ha cotejado contra la instantánea del GeneradorExamenes sin modificar ningún repositorio original.

## Resultados confirmados

- **111 étimos griegos**: 108 elegibles y 3 destinados exclusivamente a consulta (`δῶρον`, `δίκη`, `παιδίον`).
- **201 derivados castellanos admitidos**, 1 excluido pero documentado (`heliópolis`).
- **217 relaciones** entre étimos y derivados; una palabra española puede relacionarse con varios elementos griegos.
- **22 decisiones editoriales**; las grafías y variantes ortográficas se conservan.
- **6 altas** respecto al generador: `atelectasia`, `atelocardia`, `geniogloso`, `helioterapia`, `prosélito`, `prosodia`. Baja del sorteo: `heliópolis`.
- Se conservan en el libro auditado las definiciones didácticas originales, 11 fichas con variantes aceptadas y las referencias lexicográficas correspondientes.

## Fuente inmutable y salidas

La fuente editorial, transformada de Excel a registros compactos, está fragmentada en cuatro archivos Base64 en `shared/academic/greek-etymology/source/`, con SHA-256 del Excel original en `teacher-audit-manifest.json`. Se reconstruye y verifica sin intervención humana mediante `npm run etymology:compile`. La salida **no publicada** es `build/etymologicon/gr1-audited.json` y se ofrece como artefacto de GitHub Actions para su inspección.

El banco candidato inicial se conserva por trazabilidad; la reconstrucción del banco original no sobrescribe las decisiones del Excel. Las 201 definiciones se atribuyen al libro docente y sus fuentes de consulta, pero sus URLs **no han sido revisadas una por una** en esta sesión. Las relaciones editoriales aprobadas y la verificación lexicográfica externa se mantienen separadas.

## Regla de calificación prevalente

Una norma antigua del Excel asigna 0 puntos a las faltas ortográficas. La norma docente posterior prevalece: **1 punto** por respuesta correctamente escrita o variante aceptada; **0,5 puntos** por el mismo derivado con errata inequívoca; **0 puntos** por respuesta incorrecta, no catalogada o ambigua. La semejanza por sí misma nunca autoriza una correspondencia etimológica.

## Exclusiones y siguientes trabajos

Las fichas con una sola respuesta nunca se habilitan por analogía. Griego II sigue vacío y desactivado. Los significados de los 111 étimos no constan en la tabla principal del Excel y requieren aportación o comprobación específica antes de la publicación. Los ejercicios inversos y de descomposición necesitan componentes documentados uno a uno. No existe todavía una PWA Etymologicon y no se ha activado el despliegue de ScholaClassica.

