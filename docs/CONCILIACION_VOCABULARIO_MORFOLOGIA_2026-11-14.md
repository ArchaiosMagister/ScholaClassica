# Conciliación de vocabulario exigible y práctica morfológica
**Fecha:** 14 de noviembre de 2026  
**Ámbito:** ScholaClassica, Latín I y Griego I, bloques curriculares I–III  
**Estado:** revisión en PR #74, dependiente de PR #73 y PR #72; **sin publicar**

## 1. Alcance y fuentes

La comprobación utiliza exclusivamente las revisiones bloqueadas en
`config/sources.lock.json` de **Vocabula** y **Appendix grammaticae**, y el banco
que compila la aplicación. Ningún dato del repositorio independiente se
modifica. La conciliación se repite mediante:

```sh
npm run build
npm run audit:morfologia:vocabulario
npm test
```

El comando de auditoría genera un informe JSON de **uso docente** con el grupo
literal del vocabulario, la unidad de habilitación segura, el lema, sus
posibles fichas morfológicas y la cobertura de las cuatro modalidades básicas.
No se añade ese informe a la PWA pública.

## 2. Distinguir vocabulario general, exigible y lección de gramática

| Fuente | Total | Exigible («examen») | General |
|---|---:|---:|---:|
| Vocabula Latín I | 856 | 115 | 741 |
| Vocabula Griego I | 503 | 171 | 332 |

**Reservas que se conservan y no se sortean automáticamente:**

- **184** entradas generales de Griego I sin unidad acreditada. No se
  convierten en vocabulario exigible ni se asignan retrospectivamente.
- **140** entradas generales de Latín I etiquetadas `UD 11–12`, fuera del
  currículo de morfología integrado (que finaliza en UD10). No se trasladan
  a UD9 o UD10 por comodidad.
- Las etiquetas `UD 1–4`, `UD 6–7`, `UD 9–10` se conservan literalmente.
  En el sorteo, cuando una palabra depende exclusivamente de ese grupo,
  la unidad segura es el **extremo final del bloque**.
- **Palabras básicas** y **Preposiciones** de Griego I son categorías
  transversales; la ausencia de una ficha declinable no equivale a un
  paradigma morfológico que falte.
- El vocabulario exigible de Griego I no contiene grupos UD11–UD14
  específicos en la revisión fijada. La gramática sí llega a UD14, pero
  esto no autoriza a crear un supuesto listado exigible de esas unidades.

Se distinguen la **primera aparición gramatical** y la **primera unidad en
que el vocabulario es exigible**. Por ejemplo, *ἄνθρωπος* aparece expresamente
en un ejemplo de la gramática UD1, pero su ficha léxica corresponde al bloque
«UD 1–4». Es legítimo practicarlo como modelo en UD1; no se afirma que todo
el vocabulario de ese bloque deba exigirse desde UD1.

## 3. Sustantivos griegos conciliados individualmente por lema

El tercer lote incorpora **nueve** sustantivos seleccionados del vocabulario
de examen (no del general). Cada uno requiere diez casillas individualizadas
en UniMorph, nominativo y genitivo compatibles con el enunciado de Vocabula,
artículo de género acreditado, declinación prevista por Appendix, y SHA
de origen. Se conservan los diacríticos y la iota suscrita. Ninguna forma se
obtiene añadiendo desinencias automáticamente.

| Unidad habilitada | Grupo literal Vocabula | Nuevas entradas |
|---|---|---|
| UD5 | UD 5 | ἀρχή, στρατηγός |
| UD7 | UD 6–7 | ἐπιστολή, κεφαλή, μάχη, πέτρα |
| UD9 | UD 9 | οὐρανός |
| UD10 | UD 10 | ὅπλον, φόβος |

**No constituye certificación filológica individual:** el cotejo estructural
de UniMorph, Vocabula y Appendix no equivale a una revisión docente de cada
lectura ni a la documentación de cada aparición textual. Se preserva la nota
de revisión individual pendiente en cada ficha. El listado de 24 sustantivos
griegos conciliados se mantiene como **lista blanca cerrada** de seguridad.

**Género contextual:** *ἄνθρωπος* conserva género común ὁ/ἡ y se practica
individualmente, pero no se incorpora a los sintagmas atributivos que exigen
un género único. Los otros 23 sustantivos acreditados sí pueden alimentar la
modalidad de artículo + sustantivo + adjetivo.

## 4. Matriz de fichas por unidad

La unidad de cada ficha es la **primera habilitación de práctica de ese
paradigma**. Las unidades son acumulativas y no se adelanta ninguna ficha
de unidades posteriores.

| Latín I | Fichas nuevas en la unidad | Acumuladas |
|---|---:|---:|
| UD1 | 11 | 11 |
| UD2 | 7 | 18 |
| UD3 | 13 | 31 |
| UD4 | 16 | 47 |
| UD5 | 6 | 53 |
| UD6 | 4 | 57 |
| UD7 | 19 | 76 |
| UD8 | 3 | 79 |
| UD9 | 7 | 86 |
| UD10 | 3 | **89** |

| Griego I | Fichas nuevas en la unidad | Acumuladas |
|---|---:|---:|
| UD1 | 3 | 3 |
| UD2 | 2 | 5 |
| UD3 | 6 | 11 |
| UD4 | 10 | 21 |
| UD5 | 6 | 27 |
| UD6 | 2 | 29 |
| UD7 | 13 | 42 |
| UD8 | 18 | 60 |
| UD9 | 2 | 62 |
| UD10 | 6 | 68 |
| UD11 | 2 | 70 |
| UD12 | 4 | 74 |
| UD13 | 3 | 77 |
| UD14 | 15 | **92** |

Los números cuentan **fichas o paradigmas de práctica**, no entradas léxicas
distintas, formas individuales ni palabras de vocabulario.

## 5. Modalidades y defectos atendidos

Se comprueba **por ficha**, con el banco realmente compilado:

- **Elegir una forma**: todas las 89 fichas de Latín I y las 92 de Griego I
  pueden iniciar preguntas tras la corrección de *se, sui, sibi*. Este
  pronombre ofrece únicamente **tres respuestas documentadas** en opción
  múltiple, sin inventar una cuarta grafía.
- **Analizar una forma** y **escribir la forma**: las mismas 181 fichas tienen
  preguntas elegibles. Se preservan lecturas sincréticas y variantes.
- **Completar una declinación**: no procede aplicarla a verbos, infinitivos
  ni a pronombres personales sin género/caso comparables. La ausencia de
  tabla en esos casos no es una carencia curricular.
- **Sintagmas griegos completos**: los nombres de género único amplían
  las parejas posibles de concordancia, con ambas posiciones atributivas
  y sin incluir *ἄνθρωπος*.

La selección aleatoria equilibrada por categorías introducida en los
bloques anteriores permanece activa. La auditoría comprueba que las
fichas efectivamente generan opciones correctas, no solo que existan
en `paradigmas.json`.

## 6. Reservas para el siguiente bloque

1. Completar la **conciliación individual** de las entradas exigibles
   restantes, empezando por los sustantivos con diez formas documentadas
   pero género o genitivo no suficientemente acreditados. Las fichas
   con datos discordantes no se admitirán por reconstrucción.
2. Revisar la diferencia entre palabras enseñadas en la gramática y
   palabras exigibles por grupo, antes de introducir un eventual filtro
   «solo vocabulario exigible» en la interfaz.
3. Contrastar las etiquetas genéricas que siguen sin unidad y decidir
   el destino de la agrupación latina UD11–12 **solo mediante decisión
   docente** y cambios a la fuente persistente autorizados.
4. Añadir pruebas de interacción de las actividades incorporadas al
   catálogo de ejercicios, incluida la conservación de progreso offline.

## 7. Condiciones de integración

No se modifica Vocabula ni Appendix independientes, ni se expone el
informe docente en la web del alumnado. Los tres bloques se mantienen
en **PR #72 → #73 → #74**, todos en borrador. No se debe fusionar ni
publicar sin pruebas verdes y nueva autorización.
