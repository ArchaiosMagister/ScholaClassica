# Cierre de dos reservas morfológicas de Latín I · UD1 y UD2

**Fecha:** 16 de noviembre de 2026. **Alcance:** únicamente la copia
integrada de ScholaClassica. Sin cambios en Appendix, Vocabula,
GeneradorExamenes, Supabase ni los historiales locales de los alumnos.

## UD1 — Cinco infinitivos de presente activo

El epígrafe `Infinitivo de presente activo` de Appendix presenta
**literalmente** estos cinco ejemplos:

| Forma | Modelo mostrado en el ejercicio |
| --- | --- |
| *amare* | *amo*, 1.ª conjugación |
| *habere* | *habeo*, 2.ª conjugación |
| *ducere* | *duco*, 3.ª conjugación |
| *audire* | *audio*, 4.ª conjugación |
| *capere* | *capio*, 3.ª mixta |

Una ficha independiente, `latin-ud1-infinitivos-presente-ejemplos`,
desbloquea estas cinco formas en UD1 como **infinitivo**, y permite
análisis, elección de forma y respuesta escrita. Los diez infinitivos
de presente activo/pasivo y las cuatro formas compuestas del modelo
anterior de UD8 **permanecen en UD8**, con sus propios IDs y resultados
guardados. No se copian las flexiones de UD8 a UD1 ni se introducen
infinitivos pasivos antes de explicarlos.

## UD2 — Reconocimiento de locativos, no declinación

Appendix enseña que el locativo **no es un caso productivo** y
documenta cinco ejemplos:

| Forma | Valor expresado en Appendix |
| --- | --- |
| *Corinthi* | en Corinto |
| *Romæ* | en Roma |
| *domi* | en casa |
| *humi* | en el suelo |
| *ruri* | en el campo |

La ficha `latin-ud2-locativos-ejemplos` contiene **solo esas cinco
formas**. Se etiqueta técnicamente como registro nominal para ofrecer
en el banco acumulativo preguntas de **reconocimiento de forma y valor
locativo**. Las formas no constituyen una declinación ni acreditan que
el caso se forme regularmente en otros nombres de lugar. El motor
prohíbe expresamente preguntas de producción de forma, respuestas
escritas y tablas a partir de esta ficha. Las mismas grafías pueden
presentar lecturas de otros casos en otros contextos; aquí solo se
practica el valor explícito del ejemplo escolar.

## Protección de datos y regresión

Los dos registros se **anexan al final** del banco compilado, detrás
de todos los paradigmas de Latín II y de las decisiones docentes
nominales. No cambia la posición, la clave ni la interpretación de
ninguna ficha anterior. El banco pasa de 92 a **94** fichas de Latín I;
Latín 4.º (76), Griego I (94) y Latín II (500) siguen intactos.

El compilador comprueba el texto del Appendix original fijado:
si desaparece una forma o su valor escolar, interrumpe la compilación.
Las pruebas cubren las cinco preguntas de análisis y selección
de infinitivos, las cinco escritas, las cinco preguntas de reconocimiento
de locativos, la prohibición de producción y tablas, la presencia
de la ficha exclusivamente desde su unidad, la conservación de IDs,
el motor de revisión y las regresiones de navegador y de PWA.

## Relación con la auditoría #118

La PR de auditoría de morfología por unidades (#118) es **separada**.
Se creó cuando Latín I tenía 92 registros y detectó estas reservas.
Si se integra más adelante, deberá reconciliarse con el nuevo censo
de 94 y reconocer que ambas reservas han quedado subsanadas. No es
correcto fusionar la auditoría antigua sin actualizar sus aserciones.
