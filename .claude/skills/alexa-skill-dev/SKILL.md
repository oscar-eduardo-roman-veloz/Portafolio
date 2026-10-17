---
name: alexa-skill-dev
description: Desarrolla y extiende la skill de Alexa "Asistente de Código" de este repo (alexa-dev-assistant/). Úsala cuando el usuario quiera agregar un intent, un concepto, una receta de Git u otra función de voz a Alexa, cambiar el modelo de interacción, depurar un handler, probar la skill o desplegarla con el ASK CLI o Alexa-hosted.
---

# Desarrollo de la skill de Alexa "Asistente de Código"

El proyecto vive en `alexa-dev-assistant/` (Node.js + `ask-sdk-core`, locales es-MX y es-US). Lee `alexa-dev-assistant/README.md` para el panorama general.

## Reglas del proyecto

- **El modelo de voz es generado.** Nunca edites `skill-package/interactionModels/custom/*.json` a mano: edita `scripts/build-model.js` (intents y frases) o `lambda/data/*.js` (slot types GIT_TASK y DEV_CONCEPT) y corre `npm run build:model` desde `lambda/`.
- **Frases de ejemplo:** en español, sin signos de puntuación ni dígitos (escribe "cuatrocientos" o usa un slot `AMAZON.NUMBER`), y nunca la misma frase en dos intents. `AMAZON.SearchQuery` necesita una frase de arranque ("pregunta {question}") y no puede compartir intent con otros slots.
- **Voz:** todo texto dinámico que vaya a `speak()` pasa por `escapeSsml` (`lambda/lib/speech.js`). Usa `answer()` para responder con voz + tarjeta y dejar la sesión abierta. Lo largo o exacto (comandos, código, contraseñas) va a la tarjeta, no a la voz.
- **Orden de handlers** en `lambda/index.js`: gana el primero cuyo `canHandle` sea true. Los handlers que dependen de un modo de sesión (como `DuckNextHandler`) van antes de los genéricos.
- **Límite de 8 segundos:** cualquier llamada externa lleva timeout (ver `lib/github.js` y `lib/claude.js`) y un mensaje de error hablado.
- **Variables de entorno** con prefijo propio (`SKILL_…`, `GITHUB_…`, `ANTHROPIC_API_KEY`); documenta las nuevas en `README.md` y `lambda/.env.example`.

## Agregar un intent nuevo

1. En `scripts/build-model.js`, agrega `intent('MiIntent', [frases...], [slots...])` y, si hace falta, un slot type en `types`.
2. Crea el handler en `lambda/handlers/<área>.js` con `canHandle: (h) => isIntent(h, 'MiIntent')`.
3. Regístralo en `lambda/index.js`.
4. Si usa una API de Alexa con permiso (timers, recordatorios, listas…), agrega el permiso en `skill-package/skill.json` y sigue el patrón de `handlers/pomodoro.js` (revisar el permiso y pedirlo con `Connections.SendRequest`).
5. Agrega pruebas en `lambda/test/skill.test.js` usando `intentRequest(...)` de `test/helpers.js`. Para slots con sinónimos pasa `{ value, id }` para simular entity resolution. Las llamadas a APIs de Alexa ya están interceptadas (`apiCalls`); simula `global.fetch` para APIs HTTP.
6. Corre `cd alexa-dev-assistant/lambda && npm run build:model && npm test`. Las pruebas fallan si un intent del modelo no tiene handler o si el JSON del modelo no se regeneró.

## Agregar contenido sin código

- Concepto: entrada nueva en `lambda/data/concepts.js` (`id` en MAYÚSCULAS, `synonyms` con el valor canónico primero, `text` corto y natural para voz).
- Receta de Git: entrada en `lambda/data/gitCommands.js` (`say` para voz, deletreando guiones y símbolos; `cmd` con el comando exacto para la tarjeta).
- Código HTTP: `lambda/data/httpCodes.js`. Consejo: `lambda/data/tips.js`.
- Después: `npm run build:model && npm test`.

## Probar y desplegar

- Pruebas locales: `npm test` en `alexa-dev-assistant/lambda`.
- ASK CLI (Lambda propia): `ask deploy` desde `alexa-dev-assistant/`, luego `ask dialog --locale es-MX` para conversar por texto.
- Alexa-hosted: pegar el JSON del modelo en la consola y subir `lambda/` (pasos en el README).
