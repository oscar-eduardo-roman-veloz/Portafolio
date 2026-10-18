# Entre Nosotros — Preguntas para parejas (v1)

App web instalable (PWA) con 50 preguntas de profundidad para conversar en pareja. Funciona en el
navegador de la PC y se instala como app en Android e iPhone. Cada pregunta tiene categoría,
subcategoría, nivel de profundidad, subpreguntas que guían la conversación y, si hace falta,
una nota de contexto.

## Archivos
| Archivo | Para qué sirve |
|---|---|
| `index.html` | Toda la app (diseño y lógica). |
| `preguntas.json` | **Las preguntas.** Es el único archivo que hay que tocar para agregarlas o editarlas. |
| `manifest.webmanifest`, `sw.js`, `icons/` | Lo que permite instalarla como app y usarla sin conexión. |

## Cómo abrirla
Necesita abrirse desde una dirección web (por ejemplo GitHub Pages): por seguridad, los navegadores
no dejan leer `preguntas.json` si se abre `index.html` con doble clic.

- **Probar en la PC:** dentro de esta carpeta, ejecuta `python3 -m http.server` y abre http://localhost:8000
- **Android (Chrome):** abre la dirección y toca 📲 o "Instalar app".
- **iPhone (Safari):** Compartir → "Agregar a pantalla de inicio" (el botón 📲 muestra los pasos).

El progreso (respondidas, favoritas, nombres) se guarda solo en ese dispositivo.

## Agregar o editar preguntas
Agrega un bloque en la lista `preguntas` de `preguntas.json`:

```json
{ "id": "fut-009", "categoria": "futuro", "subcategoria": "rutina", "nivel": 2,
  "texto": "¿Cómo sería una mañana normal de nosotros viviendo juntos?",
  "contexto": "Opcional: una aclaración corta.",
  "subpreguntas": ["¿Quién se levantaría primero?", "¿Desayunaríamos juntos?"] }
```

- `id`: prefijo de la categoría + el siguiente número (`con`, `pro`, `rel`, `fut`, `int`, `val`, `hip`, `gra`).
  No reutilices un ID que ya exista.
- `categoria` y `subcategoria`: usa los `id` definidos en la lista `categorias` del mismo archivo.
- `nivel`: 1 Ligera, 2 Media, 3 Profunda.
- Antes de agregar, busca en el archivo (Ctrl+F) una palabra clave de la pregunta para no duplicarla.
- Si cambias el significado de IDs existentes, sube el número de `"version"`: eso reinicia el
  progreso guardado para que no se mezclen preguntas.
