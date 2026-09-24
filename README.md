# Quizzes UTN

Bancos de preguntas de repaso para materias de ISI (UTN FRRe), con corrección inmediata, puntaje estilo
Moodle y progreso guardado en el navegador. Es un sitio estático: HTML, CSS y JavaScript vanilla con ES
modules, sin frameworks, sin build y sin dependencias en runtime.

Repositorio: <https://github.com/gonzaorban/quizzis-utn/>

Materias incluidas:

| Materia | Carpeta | Preguntas |
|---|---|---|
| Administración de Sistemas de Información | `subjects/asi/` | 87 (78 con puntaje + 9 informativas) |
| Redes de Información | `subjects/redes/` | 98, con links a la teoría |

## Estructura

```
index.html              # landing: lista las materias de subjects/subjects.json
engine/
  quiz.js               # motor común (render, puntaje, filtros, progreso)
  quiz.css              # diseño común (claro/oscuro, mobile-first)
subjects/
  subjects.json         # manifiesto: slugs de las materias que muestra la landing
  asi/
    index.html          # carga el motor con initQuiz({ slug: "asi" })
    questions.json
    img/                # imágenes referenciadas por las preguntas
  redes/
    index.html
    questions.json
    sources/            # PDFs de teoría + mapping-report.md
scripts/
  validate.mjs          # valida todos los questions.json
  rank-sources.mjs      # sugiere páginas de la teoría para cada pregunta
vercel.json             # cleanUrls + trailingSlash
serve.json              # misma configuración para `npx serve`
```

## Correrlo local

`fetch` no funciona abriendo los archivos con `file://`, así que hace falta un servidor:

```sh
npx serve .
```

y abrí la URL que imprime (por defecto <http://localhost:3000>). `serve.json` replica la configuración de
Vercel, así que las URLs se comportan igual que en producción.

## Agregar una materia

1. Creá `subjects/<slug>/` (slug en minúsculas, sin espacios; por ejemplo `sistemas-operativos`).
2. Copiá `subjects/redes/index.html` a la carpeta nueva y cambiá el `<title>` y el slug en
   `initQuiz({ slug: "<slug>" })`.
3. Escribí `subjects/<slug>/questions.json` siguiendo el esquema de abajo. Los ids de las preguntas
   empiezan con `<slug>-`.
4. Agregá el slug a `subjects/subjects.json` para que aparezca en la landing.
5. Corré `node scripts/validate.mjs` hasta que no marque errores.

El progreso de cada materia se guarda en `localStorage` con la clave `quiz-<slug>-v1`. Si cambiás los ids de
preguntas ya publicadas, las respuestas guardadas de esas preguntas se pierden.

## Esquema de `questions.json`

```jsonc
{
  "subject": "Redes de Información",          // nombre visible
  "description": "Banco de preguntas…",        // opcional, subtítulo
  "accent": "#2F6FD6",                         // color de acento (#RRGGBB)
  "accentDark": "#5B8FE6",                     // opcional, acento en modo oscuro
  "emptyFeedback": "La cátedra no incluyó…",   // texto si falta "fb"; null oculta la sección
  "topicFilter": "multi",                      // opcional: "multi" (chips independientes) o
                                               // "single" (uno a la vez + "Todas")
  "labels": {                                  // opcional, textos del filtro
    "topics": "Temas", "allTopics": "Todos los temas", "noTopics": "Ninguno", "section": "Sección"
  },
  "imageCaption": "Imagen de referencia",      // opcional, título de las imágenes en la revisión
  "about": ["<p>…</p>"],                       // opcional, HTML: bloque "Sobre este banco de preguntas"
  "footer": "…",                               // opcional, HTML: texto al pie
  "topics": {
    "1": { "name": "Modelo de capas", "color": "#E8772E", "striped": true, "note": "…" }
  },
  "questions": [ /* ver abajo */ ]
}
```

`about` y `footer` se insertan como HTML sin escapar. Son contenido del repo, no de los usuarios.
En `topics`, `striped` dibuja la muestra rayada (como los pares de cable T568B) y `note` agrega una
aclaración sobre el tema, visible en los filtros y en cada pregunta.

### Preguntas

| Campo | Tipos | Descripción |
|---|---|---|
| `id` | todos | Único en todo el sitio, con prefijo `<slug>-`. |
| `topic` | todos | Clave de `topics` (número o string). |
| `type` | todos | `single`, `multi`, `tf`, `match` o `info`. |
| `text` | todos | Enunciado. Los saltos de línea (`\n`) se respetan. |
| `opts` | single, multi, tf | Opciones. En `tf` son `["Verdadero", "Falso"]`. |
| `correct` | single, multi, tf, match | Índices correctos. En `match`, uno por stem: índice en `choices`. `[]` = sin respuesta confirmada (no se corrige). |
| `stems`, `choices` | match | Ítems a emparejar y opciones del desplegable. |
| `answer` | info | Texto que se revela con "Ver respuesta". Las `info` no suman puntaje. |
| `fb` | opcional | Explicación de la cátedra. |
| `note` | opcional | Aviso que se muestra al responder (por ejemplo, una respuesta dudosa). |
| `section` | opcional | Sub-agrupación (por ejemplo, "1er parcial 2024"). Se muestra como badge y habilita el filtro por sección. |
| `img` | opcional | Ruta relativa a la carpeta de la materia (`img/x.jpg`). |
| `source` | opcional | `{ "file": "sources/x.pdf", "page": 12, "confidence": "high" \| "medium" \| "low" }`. Muestra "Ver en la teoría", que abre `x.pdf#page=12`. `page` es la página física del PDF (empieza en 1). |

### Puntaje

Cada pregunta vale 1:

- `single` / `tf`: 1 si la opción es correcta, 0 si no.
- `multi`: `max(0, (aciertos − errores) / cantidad de correctas)`.
- `match`: pares correctos / total de pares.

## Validación

```sh
node scripts/validate.mjs
```

Recorre `subjects/*/questions.json` y verifica, entre otras cosas:

- ids únicos y con el prefijo correcto
- `topic` existente
- índices de `correct` dentro de rango
- `match` con tantos `correct` como `stems`
- campos obligatorios por tipo
- que existan los archivos de `img` y `source`
- que `subjects.json` esté sincronizado con las carpetas

Si encuentra errores, sale con código 1.

## Referencias a la teoría

`scripts/rank-sources.mjs` necesita `pdftotext` (poppler). Sugiere, para cada pregunta, las páginas del PDF
con más términos del enunciado y de la respuesta correcta:

```sh
node scripts/rank-sources.mjs redes                 # todas las preguntas
node scripts/rank-sources.mjs redes redes-c8 --top 5
```

Son solo candidatos: la página y la confianza de cada `source` las decide una persona. El detalle de
las asignaciones actuales de Redes, con el fragmento que justifica cada una, está en
[`subjects/redes/sources/mapping-report.md`](subjects/redes/sources/mapping-report.md).

## Deploy en Vercel

1. En Vercel: **Add New → Project** e importá este repositorio.
2. Framework preset: **Other**. Dejá vacíos el *Build Command* y el *Install Command*, y poné `.` como
   *Output Directory* (o dejalo vacío).
3. Deploy. `vercel.json` activa `cleanUrls` y `trailingSlash`: `/subjects/redes` redirige a
   `/subjects/redes/`, así los paths relativos (`questions.json`, `img/…`, `sources/…`) se resuelven bien.

Cada push a la rama principal publica una versión nueva. Las ramas generan previews.
