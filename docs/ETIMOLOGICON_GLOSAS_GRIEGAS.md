> Actualización: las 29 glosas provisionales han recibido documentación individual. Véase [revisión de 29 glosas](ETIMOLOGICON_REVISION_29_GLOSAS.md). Los recuentos del informe inferior corresponden al estado anterior.

# Etymologicon · glosas griegas pendientes (fase 2)

Actualización: 12 de noviembre de 2026.

## Cobertura de los 111 étimos de Griego I

Se han incorporado propuestas didácticas de significado para las **54 entradas** que aún no tenían una traducción completa. Estas incluyen **cuatro lemas compuestos o relacionados** que solo disponían del primer miembro glosado.

La cobertura no debe confundirse con la verificación lexicográfica:

| Procedencia de la glosa | Étimos |
|---|---:|
| Vocabulario docente previamente cotejado | 51 |
| Repertorios externos contrastados en la fase anterior | 6 |
| Nuevas consultas individuales a repertorios externos | 25 |
| Propuestas didácticas pendientes de cotejo individual | 29 |
| **Total con glosa redactada** | **111** |

De los **111**, por tanto, **31** tienen contraste externo documentado. Los otros **80** tienen glosa curricular o propuesta pendiente de verificación externa. Ninguna se marca como base suficiente para ejercicios inversos o descomposición sin una auditoría adicional de los componentes.

## Casos de interés

- **γράφω | γράμμα:** «escribir» y «letra, escrito». No confundir la glosa verbal con la nominal.
- **σοφός | σοφία:** «sabio» y «sabiduría». Son dos lemas diferentes.
- **ἀρχή | ἄρχω:** «principio, origen, mando» y «comenzar, gobernar». Consultas independientes a LSJ.
- **λέγω | λόγος:** «decir, hablar» y «palabra, discurso». Mantener el doble análisis.
- **ἀγγέλλω | ἄγγελος:** «anunciar» y «mensajero». La grafía aprobada es ἄγγελος.
- **ἐκ | ἐξ:** variantes de una preposición griega, no lemas distintos; ἐξ ante vocal.
- **ὅρος:** «límite». No confundir con ὄρος, «monte».
- **κόσμος:** en griego significa tanto «orden» como «mundo, universo», entre otros usos.
- **χρῶμα:** también puede significar «tez, color de la piel».
- **-ῖτις:** sufijo originariamente adjetival femenino, posteriormente asociado a enfermedad e inflamación. No presentarlo como sustantivo griego autónomo.

Las fuentes individuales consultadas se almacenan mediante URL en `review/meaning-completion-v1.json`. Entre ellas figuran LSJ y Middle Liddell en Scaife ATLAS y, para el sufijo -ῖτις, la Universidad de Salamanca (Dicciomed). En las 29 glosas sin comprobación individual se conserva un enlace de consulta sugerido a Logeion, **sin atribuirle una verificación realizada**.

## Integridad

El compilador `npm run etymology:compile` ensambla una capa de significado separada del Excel y mantiene los 111 étimos, 201 derivados admitidos y 217 relaciones originales. Las pruebas automáticas rechazan los registros duplicados, las grafías que no coinciden con el libro auditado, los enlaces de fuente ausentes en glosas declaradas verificadas y cualquier intento de dar por comprobada una traducción provisional.

Esta etapa no modifica los originales, no configura Griego II, no publica una PWA y no activa nuevas modalidades evaluables.

## Próximo trabajo

1. Cotejar individualmente las 29 glosas provisionales y, si interesa una confirmación lexicográfica completa, las 51 provenientes solo del vocabulario docente.
2. Reanudar el control de las definiciones españolas restantes y de las fuentes médicas especializadas.
3. Desarrollar el corrector determinista, con pruebas para 1 / 0,5 / 0 puntos, evitando que la semejanza ortográfica admita respuestas no catalogadas.

