# Respaldo online de la gramática clásica

## Estado y arquitectura

La página `gramatica.html` conserva como fuente principal sus índices de flexión locales y sus paradigmas docentes. El **respaldo online es opcional y se activa a petición del estudiante o profesor**, sin bloquear el repaso si falla la red.

Se ha comprobado que las páginas de Collatinus-web y Eulexis-web son consultables, pero **no** exponen para nuestra aplicación una API pública estructurada y utilizable mediante CORS que se haya podido validar. Por eso se enlazan como fuentes de consulta filológica, no se incrustan como claves de autocorrección.

En su lugar se usa para las formas latinas la **[Latin Dictionary API](https://latindictionary.co/docs/api)**, que devuelve paradigmas JSON estructurados y anuncia acceso sin clave con un límite de consultas. Se comprobó en una petición HTTP real que admite CORS (`Access-Control-Allow-Origin: *`).

El adaptador `gramatica-respaldo-online.js` consulta **un lema por acción** en `https://latindictionary.co/api/v1/entry/<lema>`. No descarga todo un diccionario ni realiza centenares de solicitudes por clase; la fuente establece límites de peticiones, por lo que se utiliza deliberadamente de manera puntual. Los datos consultados son solo lemas públicos del vocabulario docente.

## Criterios de incorporación a la práctica

1. Debe tratarse de una palabra que aparezca en el vocabulario del **curso y unidades seleccionadas**.
2. **Verbos:** deben tener un enunciado completo documentado (presente, perfecto, supino, conjugación). Las partes principales y la conjugación devueltas por la API deben coincidir. Si hay discrepancias, no se añaden formas. **Sustantivos y adjetivos:** se comprueban los enunciados nominales (nominativo/genitivo o tres géneros), la categoría léxica y el género cuando se conoce; las coincidencias dudosas se descartan.
3. **Verbos:** solo casillas con **modo, voz, tiempo, persona y número explícitos**, compatibles con el currículo; se exige un mínimo de cuatro personas/números distintos por grupo. **Nominales:** solo casillas con caso y número (y género para adjetivos) y paradigmas con cobertura mínima suficiente. No se incluyen plurales de nombres propios. En tablas que mezclan formas derivadas como *puella* y *puellula*, solo se toma la primera forma de la casilla; no se aceptan automáticamente las restantes como variantes.
4. Para ejercicios de análisis, se excluyen las formas con lecturas múltiples dentro del conjunto de las tablas utilizadas. Las variantes verbales documentadas se admiten en escritura.
5. Se evita duplicar una pregunta idéntica ya existente en el banco local. El resto de los ejercicios locales siguen disponibles.
6. **La interfaz y la corrección son exactamente las mismas**: en el motor los datos externos se convierten al esquema de ejercicios `id`, `subject`, `unit`, `topic`, `category`, `mode`, `lemma`, `prompt`, `answer`, `accepted`, `explanation`, `language`, `source`.
7. Si la fuente deja de responder, se muestra un mensaje y el banco local sigue funcionando. Es posible desactivar completamente el respaldo desde la pantalla de preparación.

La información se muestra con atribución a **Latin Dictionary** y sus fuentes (Wikcionario, Perseus, etc.), conforme al campo de atribución suministrado por su API. No se reutilizan descripciones ni textos extensos de diccionario.

**Griego:** de momento no hemos validado una API de generación de paradigmas con la calidad suficiente. Se ofrece la consulta a Eulexis y Logeion, pero no la autocorrección con sus páginas externas.

## Relación con GeneradorExamenes

**La base local de los dos repositorios no es una sola base compartida.**

- `VocabulaLatinaGraecaque` dispone de los paradigmas docentes y el índice UniMorph filtrado para el currículo.
- `GeneradorExamenes` tiene su propio índice UniMorph y sus reglas de examen; la página complementaria `morfologia.html` ya reutiliza uno de sus archivos `lat-v.json`.
- Se revisó ese archivo como posible respaldo automático: sus coincidencias con nuestros vocabularios corresponden sobre todo a **deponentes**, de modo que no aporta un banco general de conjugaciones activas. Por eso el nuevo respaldo de `gramatica.html` utiliza Latin Dictionary API, no atribuye incorrectamente esas formas a verbos activos.
- La estructura normalizada de los datos permite preparar posteriormente **un índice de paradigmas validado y reutilizable por ambos repositorios**. Todavía no se ha conectado a la generación automática de exámenes para evitar introducir análisis no contrastados.

## Pruebas

`node tests/check-online-backup.cjs` verifica las categorías y accidentes morfológicos, el contraste de enunciados y las unidades. La prueba de navegador `tests/check-grammar-browser.cjs` sustituye la API por una respuesta de control para comprobar que las formas externas se muestran como ejercicios normales, que no se duplican y que el respaldo puede desactivarse.

Los enlaces externos de Collatinus, Eulexis y Logeion pueden abrirse en otra pestaña. Su presentación es la de cada sitio; solo se garantiza el mismo formato **para las formas incorporadas realmente como preguntas en nuestra aplicación**.
