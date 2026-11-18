# Evolutio valenciano · primer piloto local aislado (18/11/2026)

## Alcance y autorización

Este prototipo permite **probar en un navegador, desde un único HTML local**, siete correspondencias latín → valenciano con examen en dos fases: respuesta patrimonial y selección de las normas aplicables a los segmentos del étimo. Mantiene **tres intentos por fase** y ofrece revelación de solución sin atribuir un acierto a una tarjeta revelada. Incluye estudio de las siete fichas, repaso aleatorio sin repetición en una sesión, resumen, modo oscuro y OLED.

El docente ha aceptado para **este prototipo local** la grafía atestiguada en la *Gramàtica normativa valenciana* (AVL 2006), contrastada con las etimologías del DCVB y la documentación fonética IEC/GEC. **No se ha consultado el artículo individual del DNV en ninguna de las siete fichas**, ni se presenta la GNV como si fuese el DNV. La autorización está registrada, acotada a este destino, en `shared/academic/evolutio-valenciano/autoritzacio-criteri-gnv-prototip-local-2026-11-18.json`.

**No se autoriza** ninguna publicación en `main` o GitHub Pages, habilitación del banco del alumnado, cambio de identificadores, modificación del progreso, integración en el generador común ni escritura en Supabase.

## Contenidos académicos

| Ficha | Resultado valenciano | Normas |
|---|---|---|
| `ge-EVF-0338`: `uitam` | **vida** | SONORITZACIÓ |
| `xl-354`: `buccam` | **boca** | OBERTURA, SIMPLIFICACIÓ |
| `xl-52`: `catenam` | **cadena** | SONORITZACIÓ |
| `xl-26`: `aucam` | **oca** | MONOFTONGACIÓ |
| `xl-587`: `pontem` | **pont** | APÒCOPE |
| `xl-82`: `cuppam` | **copa** | OBERTURA, SIMPLIFICACIÓ |
| `xl-567`: `focum` | **foc** | APÒCOPE |

Estas siete fichas suman **nueve fenómenos seleccionables**. Las cinco denominaciones empleadas se toman exclusivamente del catálogo valenciano de 17 normas; **FIX_M no aparece entre las opciones** y se explica como fenómeno fijo.

**No se incluye** `tĕrram → terra`, `pŏrtam → porta`, `farinam → farina` (solo ejemplos introductorios), ni `matrem → mare`, `cælum → cel`, `noctem → nit` (reservas filológicas). Tampoco se incorporan las reservas independientes `octo`, `dictum`, `sigĭllum`.

La etiqueta escolar **OBERTURA** de la evolución ŭ > o no implica que la vocal valenciana de *boca* sea [ɔ]; la GNV la ejemplifica con [o] cerrada. En *uitam*, la *u* inicial es consonántica, no vocalización. El prototipo evita evaluar estas últimas como normas.

## Generación y ejecución

La rama funcional es **dependiente** de la PR académica #122, a su vez dependiente de #119, y permanece en borrador. El generador:

```bash
npm run build:preview:evolutio:val
```

produce exclusivamente `build/evolutio-valenciano-piloto/index.html`, **fuera de `dist/` y `public/`**. El HTML incluye estilos, datos limitados, corrector y funcionamiento íntegros, por lo que **basta abrirlo como archivo local** (`file://`) sin servidor, internet, instalación, servicio de actualización ni acceso a cuentas. Los intentos y resultados son temporales: al cerrar o recargar la pestaña se reinician. No se usa `localStorage`, `sessionStorage` ni `serviceWorker`.

En GitHub Actions, cada PR que contiene esta rama genera y prueba el archivo, comprueba su apertura desde `file://` en Chromium y lo guarda como artefacto **`evolutio-val-pilot7-html-local`**, descargable como ZIP desde la ejecución:

1. Abrir la sección **Checks** de la PR funcional o su ejecución en GitHub Actions.
2. En **Artifacts**, descargar `evolutio-val-pilot7-html-local` y descomprimirlo.
3. Abrir el archivo `index.html` en Safari, Chrome u otro navegador actualizado. Seleccionar **Estudiar** o **Practicar**.

Este archivo local no tiene URL pública de ScholaClassica ni instala una segunda PWA. No contiene la matriz docente de 522 entradas, sus evidencias ni notas internas; solo siete IDs, étimos, formas y segmentos seleccionados para el ensayo. Aun así, el código y las siete fichas quedan almacenados en el repositorio y artefacto de pruebas, como corresponde a un prototipo académico.

## Pruebas y criterios de paso

- `tests/evolutio-valenciano-piloto-local.test.mjs`: validación de siete IDs, cinco tipos de norma, nueve cambios, tres intentos, separación de FIX_M y exclusión de casos reservados y de fuentes privadas.
- `tests/evolutio-valenciano-piloto-browser.mjs`: abrir `file://` en Chromium, estudiar siete formas, completar dos tarjetas, comprobar revelación tras tres intentos, modo OLED y ausencia de peticiones externas.
- CI de ScholaClassica: se mantiene intacta la compilación y auditoría de `dist/`, los bancos y la PWA pública. **El empleo docente del piloto no equivale a una autorización de publicación.**

## Puerta de entrada futura al módulo completo

Para trasladar las siete tarjetas a la versión integrada será necesaria una **PR separada**, con aprobación docente expresa del diseño de ejercicios y de las normas evaluables, integración cuidadosamente delimitada del castellano y valenciano, y pruebas específicas de continuidad de progreso e instalación PWA. **No activar todavía el valenciano para el alumnado**: siete palabras no ofrecen variedad suficiente para el módulo general.
