// Validates every subjects/<slug>/questions.json. No dependencies: `node scripts/validate.mjs`.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const subjectsDir = path.join(root, "subjects");
const TYPES = ["single", "multi", "tf", "match", "info"];
const CONFIDENCE = ["high", "medium", "low"];
const HEX = /^#[0-9a-fA-F]{6}$/;

let errors = 0;
const allIds = new Map(); // id -> slug, to catch duplicates across subjects

function check(slug) {
  const dir = path.join(subjectsDir, slug);
  const file = path.join(dir, "questions.json");
  const err = (where, msg) => { errors++; console.error(`✘ ${slug}${where ? ` [${where}]` : ""}: ${msg}`); };
  let data;
  try { data = JSON.parse(fs.readFileSync(file, "utf8")); }
  catch (e) { err("", `no se pudo leer questions.json: ${e.message}`); return; }

  if (typeof data.subject !== "string" || !data.subject) err("", "falta 'subject'");
  if (!HEX.test(data.accent || "")) err("", `'accent' debe ser un color #RRGGBB (vino ${JSON.stringify(data.accent)})`);
  if (data.accentDark !== undefined && !HEX.test(data.accentDark)) err("", "'accentDark' debe ser un color #RRGGBB");
  if (data.topicFilter !== undefined && !["single", "multi"].includes(data.topicFilter)) err("", "'topicFilter' debe ser single|multi");
  if (!data.topics || typeof data.topics !== "object") { err("", "falta 'topics'"); return; }
  for (const [k, t] of Object.entries(data.topics)) {
    if (!t || typeof t.name !== "string") err(`topic ${k}`, "falta 'name'");
    if (!HEX.test(t?.color || "")) err(`topic ${k}`, "'color' debe ser #RRGGBB");
  }
  if (!Array.isArray(data.questions) || !data.questions.length) { err("", "'questions' vacío o ausente"); return; }

  const inRange = (arr, n) => Array.isArray(arr) && arr.every((c) => Number.isInteger(c) && c >= 0 && c < n);
  data.questions.forEach((q, i) => {
    const where = q.id || `#${i}`;
    const e = (msg) => err(where, msg);
    if (typeof q.id !== "string" || !q.id) e("falta 'id'");
    else if (!q.id.startsWith(slug + "-")) e(`el id debe empezar con '${slug}-'`);
    else if (allIds.has(q.id)) e(`id duplicado (ya existe en ${allIds.get(q.id)})`);
    else allIds.set(q.id, slug);
    if (!(String(q.topic) in data.topics)) e(`topic '${q.topic}' no existe en 'topics'`);
    if (!TYPES.includes(q.type)) { e(`type inválido '${q.type}'`); return; }
    if (typeof q.text !== "string" || !q.text.trim()) e("falta 'text'");

    if (q.type === "info") {
      if (typeof q.answer !== "string" || !q.answer.trim()) e("las info necesitan 'answer'");
    } else if (q.type === "match") {
      if (!Array.isArray(q.stems) || !Array.isArray(q.choices)) e("match necesita 'stems' y 'choices'");
      else {
        if (!Array.isArray(q.correct) || q.correct.length !== q.stems.length)
          e(`match: ${q.stems.length} stems pero ${q.correct?.length} correct`);
        if (!inRange(q.correct, q.choices.length)) e(`índices de 'correct' fuera de rango (0..${q.choices.length - 1})`);
      }
    } else {
      if (!Array.isArray(q.opts) || q.opts.length < 2) e("'opts' necesita al menos 2 opciones");
      else if (!inRange(q.correct, q.opts.length)) e(`índices de 'correct' fuera de rango (0..${q.opts.length - 1})`);
      else if (new Set(q.correct).size !== q.correct.length) e("'correct' tiene índices repetidos");
      else if ((q.type === "single" || q.type === "tf") && q.correct.length > 1) e(`${q.type} admite una sola respuesta correcta`);
      if (q.type === "tf" && q.opts?.length !== 2) e("tf necesita exactamente 2 opciones");
    }

    if (q.img !== undefined && !fs.existsSync(path.join(dir, q.img))) e(`no existe la imagen ${q.img}`);
    if (q.source !== undefined) {
      const s = q.source;
      if (!s || typeof s.file !== "string") e("source.file ausente");
      else if (!fs.existsSync(path.join(dir, s.file))) e(`no existe ${s.file}`);
      if (!Number.isInteger(s?.page) || s.page < 1) e("source.page debe ser un entero ≥ 1");
      if (!CONFIDENCE.includes(s?.confidence)) e(`source.confidence debe ser ${CONFIDENCE.join("|")}`);
      if (s?.img !== undefined && !fs.existsSync(path.join(dir, s.img))) e(`no existe la imagen ${s.img}`);
    }
  });
  const byType = {};
  data.questions.forEach((q) => { byType[q.type] = (byType[q.type] || 0) + 1; });
  const withSource = data.questions.filter((q) => q.source).length;
  console.log(`· ${slug}: ${data.questions.length} preguntas, ${Object.keys(data.topics).length} temas, ` +
    `${JSON.stringify(byType)}${withSource ? `, ${withSource} con source` : ""}`);
}

const slugs = fs.readdirSync(subjectsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory() && fs.existsSync(path.join(subjectsDir, d.name, "questions.json")))
  .map((d) => d.name).sort();
const manifest = path.join(subjectsDir, "subjects.json");
if (fs.existsSync(manifest)) {
  const listed = JSON.parse(fs.readFileSync(manifest, "utf8"));
  for (const s of listed) if (!slugs.includes(s)) { errors++; console.error(`✘ subjects.json lista '${s}' pero no existe subjects/${s}/questions.json`); }
  for (const s of slugs) if (!listed.includes(s)) { errors++; console.error(`✘ subjects/${s} no está en subjects.json (no aparecerá en la landing)`); }
}
slugs.forEach(check);
if (errors) { console.error(`\n${errors} error(es).`); process.exit(1); }
console.log("\nOK: sin errores.");
