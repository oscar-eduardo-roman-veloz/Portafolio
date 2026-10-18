# Entre Nosotros — Preguntas para parejas (v1)

App web (funciona en celular y escritorio, instalable como app) con 110 preguntas para conversar en pareja,
organizadas en 8 categorías, subcategorías y 3 niveles de profundidad.

## Cómo usarla
- **Local:** abre `index.html` en el navegador (doble clic).
- **En el celular:** publica la carpeta (p. ej. GitHub Pages) y desde el navegador elige
  "Agregar a pantalla de inicio". Funciona sin conexión después de abrirla una vez.

El progreso (respondidas, favoritas, nombres) se guarda solo en el dispositivo.

## Estructura de datos
| Archivo | Rol |
|---|---|
| `data/preguntas.json` | **Fuente única de verdad** (documento estilo NoSQL): niveles, categorías con subcategorías y preguntas. |
| `data/preguntas.js` | Generado. Es lo que carga la app. |
| `db/schema.sql` | Esquema relacional (SQLite/PostgreSQL) con llaves foráneas y `texto_normalizado UNIQUE` contra duplicados. |
| `db/seed.sql` | Generado. Inserta todos los datos. |

## Agregar preguntas
1. Añade la pregunta en `data/preguntas.json` con el siguiente ID de su categoría
   (`con-016`, `int-017`, …) y una `subcategoria` y `nivel` existentes.
2. Ejecuta `python3 scripts/build.py`. El script:
   - falla si hay IDs repetidos, categorías/subcategorías/niveles inválidos o textos duplicados
     (comparando sin mayúsculas, acentos ni signos);
   - avisa si una pregunta se parece mucho (≥ 85 %) a otra existente;
   - regenera `data/preguntas.js` y `db/seed.sql`.

Para crear una categoría nueva, agrégala en `categorias` con un `prefijo` de 3 letras único.
