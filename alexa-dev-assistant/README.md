# Asistente de Código — Skill de Alexa para developers

Skill personalizada de Alexa (Alexa Skills Kit + Node.js) con utilidades de programación por voz, en español (es-MX / es-US).

**Invocación:** "Alexa, abre **asistente de código**"

## Qué puede hacer

| Función | Ejemplos de frases |
|---|---|
| Códigos HTTP | "qué significa el código 404", "me sale un error 502" |
| Recetas de Git (el comando exacto llega a la app de Alexa) | "cómo deshago el último commit", "cómo creo una rama", "comando para hacer un stash" |
| Glosario de conceptos | "qué es un closure", "explícame Docker", "qué significa idempotencia" |
| Conversión de bases | "convierte 255 a hexadecimal", "cuánto es 10 en binario" |
| Generadores | "genera un UUID", "dame una contraseña segura", "necesito un puerto" |
| Pomodoro (Timers API) | "inicia un pomodoro", "modo enfoque de 50 minutos" |
| Modo patito de hule (rubber duck debugging) | "modo patito", "tengo un bug" → responde en voz alta y di "siguiente"; "lo encontré" para salir |
| Estado de un repositorio de GitHub | "cómo va mi repositorio", "cuántos pull requests tengo abiertos" |
| Consejos | "dame un consejo de programación" |
| Preguntas abiertas con Claude (opcional) | "pregunta cómo invierto una lista en Python" |

Si un concepto o una tarea de Git no está en el glosario y Claude está configurado, la skill le pregunta a Claude en automático.

Uso directo sin abrir la skill: "Alexa, pregúntale a asistente de código qué significa el código 429".

## Estructura

```
alexa-dev-assistant/
├── ask-resources.json            # Config del ASK CLI (despliegue a AWS Lambda propio)
├── skill-package/
│   ├── skill.json                # Manifiesto: locales, permisos (timers), categoría
│   └── interactionModels/custom/ # Modelo de voz es-MX / es-US (GENERADO, no editar a mano)
├── scripts/build-model.js        # Genera el modelo de voz: intents + slot types desde lambda/data
└── lambda/                       # Código del backend (lo que corre en Lambda)
    ├── index.js                  # SkillBuilder: registra handlers en orden
    ├── handlers/                 # core, reference (HTTP/Git/conceptos/bases/generadores), duck, pomodoro, github, claude
    ├── lib/                      # speech (SSML, slots, respuestas), claude, github, env
    ├── data/                     # httpCodes, gitCommands, concepts, tips  ← agrega contenido aquí
    └── test/                     # Pruebas con peticiones simuladas de Alexa (node --test)
```

## Desarrollo local

Requiere Node.js 18 o superior (usa `fetch` nativo). Si tu skill Alexa-hosted corre en un runtime anterior, cámbialo o usa la opción B.

```bash
cd alexa-dev-assistant/lambda
npm install
npm test              # 25 pruebas: handlers, permisos, modo patito, GitHub, Claude (simulado) y modelo al día
npm run build:model   # regenera skill-package/interactionModels/custom/*.json
```

### Agregar contenido

- **Nuevo concepto o receta de Git:** agrega una entrada en `lambda/data/concepts.js` o `lambda/data/gitCommands.js` (`id`, `synonyms` y el texto) y corre `npm run build:model`. El primer sinónimo es el valor canónico del slot.
- **Nuevo intent:** agrégalo en `scripts/build-model.js` con sus frases de ejemplo, crea el handler en `lambda/handlers/`, regístralo en `lambda/index.js` y corre `npm run build:model && npm test`. La prueba "Cada intent del modelo tiene un handler" falla si se te olvida el handler, y la prueba del modelo falla si no regeneraste el JSON.

## Despliegue

Necesitas una cuenta gratuita en [developer.amazon.com](https://developer.amazon.com/alexa/console/ask) (usa la misma cuenta de Amazon de tu Echo para probar en tus dispositivos sin publicar).

### Opción A — Alexa-hosted (gratis, sin cuenta de AWS)

1. En la [Alexa Developer Console](https://developer.amazon.com/alexa/console/ask) → **Create Skill** → nombre "Asistente de Código", idioma **Spanish (MX)**, tipo **Custom**, backend **Alexa-hosted (Node.js)**, plantilla **Start from Scratch**.
2. **Build → Interaction Model → JSON Editor:** pega el contenido de `skill-package/interactionModels/custom/es-MX.json` y da **Save** y **Build skill**.
3. **Build → Permissions:** activa **Timers** (necesario para el pomodoro).
4. **Code:** reemplaza `index.js` y `package.json` y sube las carpetas `handlers/`, `lib/` y `data/` de `lambda/`. Si quieres Claude o un token de GitHub, crea `lambda/.env` a partir de `.env.example` (no lo subas a GitHub). Da **Deploy**.
5. **Test:** cambia a "Development" y escribe o di "abre asistente de código".

También puedes usar el ASK CLI: `ask init --hosted-skill-id <id>` clona la skill hosted en local; copia ahí `lambda/` y `skill-package/` de este proyecto y haz `git push` para desplegar.

### Opción B — ASK CLI + tu propia AWS Lambda

```bash
npm install -g ask-cli
ask configure                    # vincula tu cuenta de Amazon developer y un perfil de AWS
cd alexa-dev-assistant
ask deploy                       # crea la skill, la Lambda (nodejs20.x, us-east-1) y sube el modelo
ask dialog --locale es-MX        # prueba por texto desde la terminal
```

Define las variables de entorno (`ANTHROPIC_API_KEY`, `GITHUB_TOKEN`, etc.) en la consola de AWS Lambda → Configuration → Environment variables.

## Configuración (variables de entorno)

| Variable | Para qué | Por defecto |
|---|---|---|
| `ANTHROPIC_API_KEY` | Activa "pregunta …" y las respuestas de respaldo con Claude | desactivado |
| `SKILL_CLAUDE_MODEL` | Modelo de Claude | `claude-opus-5-5` |
| `SKILL_CLAUDE_EFFORT` | Nivel de esfuerzo (`low`, `medium`, `high`…) | `low` |
| `GITHUB_REPO` | Repo para "cómo va mi repositorio" (`owner/nombre`) | `oscar-eduardo-roman-veloz/Portafolio` |
| `GITHUB_TOKEN` | Token para repos privados o más límite de peticiones | sin token (API pública) |

### Notas sobre Claude

- Alexa exige responder en **8 segundos**. La skill limita la llamada a 7 s, usa esfuerzo `low`, pide respuestas de máximo tres oraciones y manda una respuesta progresiva ("Déjame pensarlo") mientras espera. Si aun así ves timeouts, usa `SKILL_CLAUDE_MODEL=claude-haiku-5-5`, que es más rápido y barato.
- Con Opus 5.5, Opus 5, Fable 5.1 o Sonnet 5.5 se activa `fallbacks: "default"`: si el modelo rechaza una petición por sus filtros de seguridad, la API la reintenta en otro modelo automáticamente.
- La respuesta completa (con el código, si lo hay) aparece en la tarjeta de la app de Alexa; por voz se lee una versión sin Markdown.

## Privacidad

- Las contraseñas generadas **no se dicen en voz alta**; solo aparecen en la tarjeta de la app de Alexa.
- Las preguntas de "pregunta …" se envían a la API de Anthropic solo si configuras `ANTHROPIC_API_KEY`.
