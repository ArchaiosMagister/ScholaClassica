# Vocabula Latina Græcaque

Repositorio de léxico básico en latín y griego dirigido a estudiantes de Bachillerato.

https://archaiosmagister.github.io/VocabulaLatinaGraecaque/

<img width="300" height="300" alt="qr-code" src="https://github.com/user-attachments/assets/a56fdea4-c0de-4e45-b4f8-a618da9b0286" />

## Administración docente

La administración de las palabras, las consultas de gramática y los avisos
se ha trasladado a
[ScholaClassica · Profesorado](https://archaiosmagister.github.io/ScholaClassica/docente/),
con identificación individual y segundo factor TOTP. La web independiente
sigue ofreciendo el vocabulario original, los ejercicios, la sincronización
de aportaciones y los formularios para avisar de errores en vocabulario y
gramática. **Palabra del día es un proyecto independiente y conserva su
propia administración docente.**

El servicio Supabase `vocabulary` permite exclusivamente
`public_words` (lectura de aportaciones activas) y `report` (envío de
incidencias), con sus límites de solicitudes originales. No admite sesiones
ni escrituras administrativas heredadas. Los datos existentes no se
eliminan ni se reconstruyen.

### Recuperación

La rama `backup/panel-docente-original-20261113` conserva el código anterior.
La reversión, si fuese necesaria, debe coordinar **interfaz y función
Supabase**; restaurar únicamente una de las dos no recupera el acceso.
No restaurar el login antiguo sin comprobar primero su seguridad.
