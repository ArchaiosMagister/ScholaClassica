# Verificación lexicográfica asistida de Latín II — fase 1

**Estado:** piloto automático reproducible; no implica certificación filológica exhaustiva ni cambio de respuestas, puntuaciones o sorteo. No modifica los repositorios independientes de Appendix, Vocabula ni GeneradorExamenes.

## Objetivo y delimitación

La auditoría estructural previa analizó unas 17.357 casillas verbales y las nominales de Latín II. Esta fase desarrolla un **cotejador individual**, con identidad por **(lema, grafía, análisis gramatical, ficha académica)**: una grafía polisémica como `venit` se comprueba por separado en sus distintas lecturas.

La verificación consiste en contrastar información morfológica documental. Una correspondencia `lema + grafía + rasgos` **NO equivale a un testimonio de un autor latino** ni constituye, por sí sola, una validación crítica individual.

## Primera fuente de datos real: UniMorph Latin

- Repositorio: [unimorph/lat](https://github.com/unimorph/lat).
- Revisión inmutable: `050924c9f013e6aba4d7c87be243a1d79b6c5b10`.
- Archivo original: `lat`, aproximadamente **978 000 filas** (el número exacto procesado consta en el informe).
- Procedencia declarada por UniMorph: **Wiktionary en inglés**.
- Licencia de los datos: [Creative Commons Attribution-ShareAlike 3.0](https://creativecommons.org/licenses/by-sa/3.0/).
- Esta fuente y los fragmentos UniMorph guardados previamente en el repositorio fijado de **Vocabula** proceden del **mismo corpus original**. Nunca cuentan como dos testimonios independientes.
- Solo se recupera el corpus en **GitHub Actions**, dentro de `.sources/unimorph-latin`, en modo de lectura. No se copia a ScholaClassica ni se incluye en el paquete publicado para el alumnado.

Los lemas se comparan con normalización de mayúsculas, macrones y ligaduras `æ/œ`. **No** se confunden automáticamente `u` con `v` ni `i` con `j`, ni se asume una equivalencia sintáctica de formas homógrafas. Las características que UniMorph no anota, como el género de algunos sustantivos, se identifican como **rasgos no comparados**, no como aciertos.

El sistema coteja caso, número y género cuando las etiquetas existen; persona, modo, voz y tiempo solo en correspondencias justificadas. La morfología superficial de **deponentes** no coincide directamente con el valor `ACT` de UniMorph: por ello se evita concluir falsamente que el deponente es incorrecto cuando difiere la terminología de voz.

### Informe y prioridades

Se producen tres archivos **solo docentes**, en
`build/academic-audits/latin2-lexicon/`:

- `resumen.json`: fuentes y revisiones, número de casillas, cobertura e incidencias.
- `evidencias.ndjson`: un registro por identidad de lema, forma y análisis. Se conserva la etiqueta original, dimensiones coincidentes/contradictorias/desconocidas y procedencia de fuente; no se alteran los paradigmas.
- `revision-prioritaria.tsv`: casos para comprobación humana, ordenados **P0** (grafía tanto de PAU como del cuaderno), **P1** (uno de los dos), **P2** (resto).

Los estados distinguen:

| Estado | Interpretación |
| --- | --- |
| `acuerdo-de-fuentes-no-testimonio-textual` | Dos fuentes **independientes** concuerdan en rasgos conocidos. Nunca implica por sí solo atestiguación de un autor |
| `coincidencia-parcial-de-rasgos` | Al menos una fuente respalda lema, grafía y dos o más características explícitas |
| `lema-y-forma-coincidentes-rasgos-insuficientes` | La fuente conoce lema y forma, pero las etiquetas no permiten un cotejo profundo |
| `discrepancia-de-rasgos-pendiente` | La fuente indica rasgos diferentes; requiere cotejo o corrección del mapa, **no** implica errata automática |
| `no-hallada-para-lema` | Lema conocido pero esa forma no aparece en la fuente: **no prueba inexistencia** |
| `lema-fuera-de-cobertura` | El corpus no cubre ese lema: **no prueba inexistencia** |
| `requiere-analizador-de-compuestos` | Una secuencia como `profectus est` requiere analizar participio + auxiliar como **una sola forma verbal**; no se equipara a la entrada aislada `est` |

El primer piloto no marca ninguna casilla como `individualmenteVerificada: true`, no excluye por sí mismo preguntas del alumnado y no modifica el registro académico persistente. Solo emite evidencias para revisión.

## Segunda fuente: adaptador independiente (preparado, no fingido)

Es posible importar un archivo **JSONL** exportado por LEMLAT 3.0 (o Collatinus), previa conversión explícita de sus etiquetas al mismo significado gramatical que UniMorph. Cada línea:

```json
{"source":"LEMLAT3","revision":"sha-inmutable-del-análisis","lemma":"civis","form":"civium","features":["N","GEN","PL"]}
```

`revision` debe ser el identificador real de la extracción, no una versión hipotética. Este archivo **no está incluido** por defecto. Hasta que se produzca una exportación confiable del analizador, **la ejecución automática cuenta exactamente una fuente independiente**.

LEMLAT 3.0 (CIRCSE) tiene licencia **CC BY-NC-SA 4.0**; Collatinus es **GPLv3**. Su integración como programas de auditoría separados debe respetar las licencias respectivas. Nunca copiar indiscriminadamente sus bases o código a la PWA. Tampoco atribuir dos votos independientes a derivados de la misma fuente.

## Cómo ejecutar

El flujo habitual de CI fija la revisión de UniMorph, realiza la construcción de ScholaClassica y ejecuta:

```sh
npm run lexicografia:lat2
```

Para un segundo archivo independiente cuya procedencia y licencia se hayan revisado:

```sh
npm run lexicografia:lat2 -- --independent ruta/a/lemlat-export.jsonl
```

La validación automática rechaza un corpus primario truncado y cualquier ruta de resultados dentro de `dist/` o `public/`. GitHub Actions publica los informes **solo como artefacto de revisión docente** `latin2-verificacion-lexicografica-fase1` (retención: 30 días), nunca como parte de GitHub Pages.

## Próximas etapas (no realizadas en este piloto)

1. Incorporar un **analizador verdaderamente independiente**, con un proceso de exportación versionado y mapeo de sus rasgos comprobado en ejemplos reales.
2. Auditar **homógrafos, verbos compuestos, dativos/ablativos alternantes y formas raras** contra una fuente editorial y testimonios textuales localizables.
3. Autorizar el traspaso de estados de evidencia al banco persistente **únicamente cuando se cumpla un criterio académico explícito**, conservando decisiones docentes y sin sobrescribirlas mediante compilaciones.

## Fuentes

- UniMorph Latin, README y licencia: https://github.com/unimorph/lat
- Especificación UniMorph: https://unimorph.github.io/schema/
- LEMLAT 3.0, edición y licencia: https://github.com/CIRCSE/LEMLAT3
- Collatinus, código y licencia: https://github.com/biblissima/collatinus
