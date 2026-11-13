# Etymologicon — revisión de componentes etimológicos de Griego I

Fecha: 13 de noviembre de 2026. Ámbito: **Estudio del léxico**, no nuevas respuestas calificables.

## Resultado cuantitativo

- **487/487 derivados españoles** tienen ahora una ficha explícita de análisis de bases o familia etimológica, con su grafía y su valor semántico.
- **438** presentan dos o más elementos identificados; **49** solo una base o familia, porque no conviene inventar una segunda raíz.
- **24** fichas presentan tres o cuatro elementos (según el inventario actual).
- El banco de ejercicios sigue con **111 étimos, 108 elegibles y 487 derivados**; ni un étimo complementario se convierte automáticamente en respuesta válida.
- Las grafías españolas equivalentes **efeméride / efemérides** se mantienen como un único lexema; la variante no genera una ficha duplicada.

## Errores denunciados y correcciones

| Derivado | Análisis mostrado | Observaciones |
|---|---|---|
| antropomorfismo | ἄνθρωπος «ser humano» + μορφή «forma» | μορφή es complementario si no forma parte del programa seleccionado |
| telegrama | τῆλε «lejos» + γράμμα «letra, mensaje escrito» | Distinguir de *telégrafo*: τῆλε + γράφω |
| geodesia | γῆ «tierra» + δαίω «dividir» | No atribuirle automáticamente el étimo μέτρον |
| neumonía | πνεύμων «pulmón» | No confundir con πνεῦμα «aire, aliento» |
| catarata | κατά «hacia abajo» + ῥάσσω «precipitarse» | Compuesto histórico; el sentido ocular es posterior |
| autarquía | αὐτός «uno mismo» + ἀρκέω «bastarse» | Autarquía («autosuficiencia») no debe confundirse con autocracia («poder de uno solo») |

### Criterio metodológico

La nueva capa enumera **una ficha por cada derivado del banco cerrado**, aunque una voz haya llegado al castellano a través del latín, francés u otra lengua moderna. La indicación de raíces griegas en el glosario explica la *formación y parentesco*, y **no equivale siempre a una etimología inmediata**.

Los componentes complementarios que no están en el programa se muestran como tales. Los de origen latino o francés se etiquetan en su lengua correspondiente. Los sufijos de formación española modernos se consideran explicación morfológica, no étimos griegos nuevos. Las 16 descomposiciones autocorregibles siguen teniendo su propio catálogo probado; estas fichas no alteran sus soluciones ni la puntuación de los exámenes.

**Alcance de la verificación:** se ha revisado el inventario **completo** para evitar la omisión sistemática de segundos y terceros componentes. Esto no debe confundirse con haber efectuado 487 comprobaciones lexicográficas individuales frente al DLE. La evidencia puntual y los enlaces constan para las voces cotejadas con una fuente identificada; las propuestas restantes se mantienen como explicación didáctica sujeta a revisiones futuras.

## Fuentes consultadas

Materiales aportados por el docente:

1. José Luis Gálvez Marín, *Etimologías griegas* (414 pp., 2009), especialmente familia de γράμμα / γράφω y telégrafo/telegrama (pág. 371 en el PDF).
2. *Breve diccionario de helenismos de griego clásico* (6 pp.), voces γράμμα y γράφω (pág. 2).
3. Pilar Berberana, *Etimologías griegas*, PAU Griego II (2008–09, 31 pp.), familia de μορφή, incluyendo *antropomorfo* (pág. 17).

Contraste complementario de casos especiales:

- [Antropomorfismo: ἄνθρωπος + μορφή](https://www.filosofia.org/enc/ros/antrop4.htm).
- [Telegrama: τῆλε + γράμμα](https://lalengua.es/d/echegaray/telegrama).
- [Catarata: análisis de καταρράκτης — Dicciomed (Universidad de Salamanca)](https://dicciomed.usal.es/palabra/catarata).
- [Neumonía: lexema πνεύμων — Dicciomed](https://dicciomed.usal.es/lexema/pulmon).
- [Geodesia: γῆ + δαίω](https://www.etymonline.com/word/geodesy).
- [Autarquía: αὐτάρκεια y ἀρκέω](https://dialnet.unirioja.es/descarga/articulo/4859068.pdf).

La composición se conserva en el fichero versionado
`shared/academic/greek-etymology/review/study-components-gr1-20261113.json`
y se exige su cobertura total mediante pruebas en
`tests/etymologicon-lexical-study.test.mjs`.

## Cabecera y tipografía

Las tres páginas principales de Etymologicon llevan botones de navegación equivalentes y «Actualizar / Aplicar versión» en la cabecera. En la zona de estudio hay un controlador de actualización de PWA propio, con el mismo alcance de caché del módulo.

La tipografía griega usa una cadena de familias que prioriza glifos de griego politónico, sin introducir dependencias externas de fuentes: esto preserva el funcionamiento sin conexión. El texto griego normaliza a Unicode NFC en las fichas y se prueba su formato en Chromium; la comprobación visual final en Safari iOS requiere dispositivo real.
