# Automatización de paradigmas latinos y griegos

## Qué se ha automatizado

La auditoría `scripts/audit_morphology.mjs` lee `data.js`, los paradigmas docentes y los registros efectivamente aprovechables en los índices UniMorph que ya se publican. Genera:

- `data/morphology-coverage.json`: todas las entradas sin ejercicios, por curso y con prioridad léxica provisional.
- `data/morphology-coverage.md`: resumen legible y estadísticas por tipo.
- Una vista resumida en el **Área de profesor → Gramática**, una vez publicado el informe.

El flujo `.github/workflows/audit-grammar-coverage.yml` lo ejecuta automáticamente ante cambios relevantes en `main`, valida el resultado y publica los informes en GitHub Pages. En las pull requests adjunta los resultados sin publicar cambios.

**Importante:** «lema con ejercicios» significa **al menos una forma corregible**, no que su paradigma nominal o verbal esté completo. El denominador contiene también algunas palabras invariables y la clasificación estimada no sustituye el análisis filológico.

## Fuente complementaria: Wiktextract / Wikcionario

El importador `scripts/import_wiktextract_candidates.mjs` descarga los diccionarios JSONL de latín y griego antiguo ofrecidos por [kaikki.org](https://kaikki.org/dictionary/rawdata.html). Filtra todos los registros para conservar únicamente las entradas que coinciden con los lemas del vocabulario. Opera en streaming para no descargar los conjuntos completos al navegador ni consumir varios GB de RAM.

El flujo `.github/workflows/import-wiktextract-candidates.yml` ejecuta primero ejemplos de prueba y después la extracción de candidatos. Puede volver a lanzarse manualmente con el idioma deseado. Los resultados se conservan como **artefactos de GitHub Actions de duración limitada**. No se incorporan automáticamente a la web.

**Resultados observados en la primera prueba del 9 de noviembre de 2026:**

| Lengua | Entradas examinadas | Coincidencias por lema y categoría | Lemas únicos aproximados | Formas candidatas | Nominales con caso y número explícitos | Verbales con tiempo, persona y número explícitos |
|---|---:|---:|---:|---:|---:|---:|
| Latín | 893.463 | 708 | 642 | 36.780 | 8.191 | 0 |
| Griego antiguo | 69.171 | 289 | 269 | 32.134 | 3.624 | 0 |

Esos valores **no son paradigmas completos ni respuestas verificadas**. Un mismo lema puede aparecer en varias categorías de Wikcionario (por ejemplo, como sustantivo y verbo), y una entrada puede contener variantes dialectales o lecturas que no corresponden a tu vocabulario.

**Hallazgo técnico decisivo:** en numerosas tablas verbales de Wiktextract, el tiempo y/o la persona se representan en cabeceras de la tabla y **no se repiten en las etiquetas de cada forma**. Por eso, aunque el archivo contiene miles de verbos flexionados, **no se pueden incorporar con seguridad a la autocorrección solo leyendo su campo `forms`**. No vamos a atribuir personas o tiempos por el orden de las filas.

Las formas nominales con caso y número explícitos son candidatas a una segunda fase de validación más estricta, que debe comprobar la categoría léxica, género, declinación, variantes y coincidencia de formas con UniMorph u otra fuente independiente antes de publicarlas para los alumnos.

### Procedimiento técnico

```sh
node scripts/audit_morphology.mjs
node tests/check-morphology-coverage.mjs
node tests/check-wiktextract-candidates.mjs

# Importación completa opcional, requiere Internet y transferencia de archivos grandes
node scripts/import_wiktextract_candidates.mjs grc
node scripts/import_wiktextract_candidates.mjs lat
```

Los archivos `data/wiktextract-candidates-*.json` son **datos intermedios, no publicados como respuestas**. Conservar la distinción entre «candidato», «contrastado» y «utilizable en ejercicios» es una condición de seguridad filológica.

### Procedencia y licencias

Los datos de Wikcionario provienen de sus colaboradores, extraídos mediante Wiktextract/kaikki.org. Los datos derivados se distribuyen con atribución bajo **CC BY-SA 4.0** y deben reconocer la fuente, el enlace al lema y las modificaciones realizadas. Los registros originales UniMorph siguen bajo **CC BY-SA 3.0** y se mantienen separados. Para cualquier generación procedente de Collatinus debe comprobarse expresamente la compatibilidad y las condiciones de su licencia GPL-3.0.

El formato de candidatos conserva `source_page`, `source`, `generated_at` y el estado `CANDIDATE_ONLY_NOT_VALIDATED`.

## Siguiente fase programable sin intervención manual

1. Cruce por lema **y categoría** para evitar homónimos entre sustantivos, adjetivos y verbos.
2. Mapeo de etiquetas de caso/número/género con exclusión de dual, dialectos y análisis insuficientes.
3. Contraste de los nominales con UniMorph y modelos docentes; registrar concordancias, discrepancias y excepciones.
4. Proponer únicamente formas respaldadas por suficientes datos para la autocorrección, primero en una rama de pruebas.
5. Para las formas verbales, integrar un generador con temas léxicos acreditados (p. ej. Collatinus para latín y greek-inflexion para griego), junto con pruebas sobre verbos irregulares y variantes. No deducir el aoristo o el perfecto griego exclusivamente desde el presente.

Así el profesor no tiene que transcribir paradigmas: únicamente las excepciones sin respaldo quedarán pendientes, identificadas automáticamente.
