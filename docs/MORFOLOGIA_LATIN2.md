# Práctica morfológica: análisis general y Latín II

## Regla común de análisis en ScholaClassica

En «Analizar una forma», cada opción empieza por la **categoría de palabra**:
sustantivo, adjetivo, pronombre, verbo, participio, infinitivo,
artículo o desinencia, según el contenido disponible en cada asignatura.
La forma analizada aparece en primer plano con el enunciado entre paréntesis,
sin repetir arriba el título del paradigma. Las ambigüedades morfológicas se
enumeran; ocasionalmente hay un distractor de categoría para que no baste con
identificar la familia de terminaciones.

En los ejercicios sin oración **no se subraya arbitrariamente** ninguna
lectura: la elección de una función concreta exige contexto sintáctico.
Cuando se incorpore una práctica contextual, el subrayado de la lectura
correspondiente deberá depender de una oración acreditada y de una
solución sintáctica documentada, no de la frecuencia de las formas.

## Latín II: criterios docentes

Latín II se presenta **sin unidades**. El banco inicial reutiliza
exclusivamente flexiones explícitas de los bancos originales de
Appendix grammaticae y Vocabula Latina Graecaque, fijados por SHA en
`config/sources.lock.json`. No se utiliza una unidad de Latín I como
criterio de acceso, ni se da por acreditado todo un paradigma a partir
de formas aisladas de un lema.

| Categoría | Orden del análisis |
| --- | --- |
| Sustantivo | sustantivo, enunciado completo, caso, **un solo género**, número, declinación |
| Adjetivo | adjetivo, grado, enunciado completo, caso, género(s), número, tipo |
| Pronombre | pronombre, tipo, enunciado completo, caso, género(s), número |
| Verbo | verbo, enunciado completo, persona, número, tiempo, modo, voz |
| Participio | participio, enunciado verbal completo, tiempo, voz, caso, género(s), número |
| Infinitivo | infinitivo, enunciado verbal completo, tiempo, voz |

Los rasgos con más de una interpretación (p. ej., `bonæ`) se presentan
en conjunto, sin convertirlas en falsas respuestas mutuamente excluyentes.
La práctica de formas aisladas no determina cuál de las lecturas sería la
empleada en una oración dada. **Sin enunciado textual no hay subrayado**.

Los modelos de participio se obtienen de los dos modelos latinos
documentados (`amans`, `amatus`) y no se inventan géneros, números ni
casos no expresos. Los cinco modelos de infinitivo emplean las
terminaciones atestiguadas en la tabla; los ejemplos de perfecto y futuro
se atribuyen únicamente a `amo`, cuya presencia consta expresamente
en esa fuente.

El primer lote de Latín II es **deliberadamente parcial**: contiene
sustantivos de género conocido, adjetivos de primera y tercera clase,
comparativos, pronombres, tiempos de indicativo, dos participios e
infinitivos. No se pretende que cubra todavía el vocabulario íntegro
de Latín II ni los análisis contextuales. La ampliación exige cotejar
individualmente nuevas formas o incorporar sus tablas curriculares.

## Pruebas y aislamiento

`tests/morphology-latin2.test.mjs` valida seis categorías y sus rasgos,
lecturas sincréticas, enunciado y respuestas escritas; la CI de navegador
comprueba la visualización y acceso sin conexión, incluyendo el selector
«Sin unidades». Las 220 fichas originales permanecen al principio del
archivo de paradigmas en su orden anterior, con sus identificadores
inalterados. Los repositorios originales no se modifican.
