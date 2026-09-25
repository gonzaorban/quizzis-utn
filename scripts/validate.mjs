// Validates every subject (subjects/<slug>/subject.json) and each of its exams
// (subjects/<slug>/<exam>/questions.json). No dependencies: `node scripts/validate.mjs`.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const subjectsDir = path.join(root, "subjects");
const TYPES = ["single", "multi", "tf", "match", "info"];
const CONFIDENCE = ["high", "medium", "low"];
const HEX = /^#[0-9a-fA-F]{6}$/;

let errors = 0;
const allIds = new Map(); // id -> "<slug>/<exam>", to catch duplicates across the whole site
const readJSON = (file) => JSON.parse(fs.readFileSync(file, "utf8"));

function checkSubject(slug) {
  const dir = path.join(subjectsDir, slug);
  const err = (msg) => { errors++; console.error(`✘ ${slug}: ${msg}`); };
  let meta;
  try { meta = readJSON(path.join(dir, "subject.json")); }
  catch (e) { err(`no se pudo leer subject.json: ${e.message}`); return; }
  if (typeof meta.name !== "string" || !meta.name) err("subject.json: falta 'name'");
  if (!HEX.test(meta.accent || "")) err(`subject.json: 'accent' debe ser un color #RRGGBB (vino ${JSON.stringify(meta.accent)})`);
  if (meta.accentDark !== undefined && !HEX.test(meta.accentDark)) err("subject.json: 'accentDark' debe ser un color #RRGGBB");
  if (!fs.existsSync(path.join(dir, "index.html"))) err("falta index.html (la página para elegir el parcial)");
  if (!Array.isArray(meta.exams) || !meta.exams.length) { err("subject.json: 'exams' vacío o ausente"); return; }

  const listed = meta.exams.map((e) => e?.slug);
  meta.exams.forEach((e, i) => {
    if (typeof e?.slug !== "string" || !/^[a-z0-9-]+$/.test(e.slug)) err(`subject.json: exams[${i}].slug inválido (minúsculas, números y guiones)`);
    else if (listed.indexOf(e.slug) !== i) err(`subject.json: el parcial '${e.slug}' está repetido`);
    if (typeof e?.name !== "string" || !e.name) err(`subject.json: exams[${i}] sin 'name'`);
  });
  const folders = fs.readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && fs.existsSync(path.join(dir, d.name, "questions.json"))).map((d) => d.name);
  for (const f of folders) if (!listed.includes(f)) err(`${slug}/${f} no está en los 'exams' de subject.json (no aparecerá)`);
  for (const e of meta.exams) {
    if (typeof e?.slug !== "string") continue;
    if (!folders.includes(e.slug)) { err(`subject.json lista '${e.slug}' pero no existe ${slug}/${e.slug}/questions.json`); continue; }
    if (!fs.existsSync(path.join(dir, e.slug, "index.html"))) err(`falta ${slug}/${e.slug}/index.html`);
    checkExam(slug, e, meta);
  }
}

function checkExam(slug, exam, meta) {
  const dir = path.join(subjectsDir, slug, exam.slug);
  const label = `${slug}/${exam.slug}`;
  const err = (where, msg) => { errors++; console.error(`✘ ${label}${where ? ` [${where}]` : ""}: ${msg}`); };
  let data;
  try { data = readJSON(path.join(dir, "questions.json")); }
  catch (e) { err("", `no se pudo leer questions.json: ${e.message}`); return; }

  if (typeof data.subject !== "string" || !data.subject) err("", "falta 'subject'");
  else if (data.subject !== meta.name) err("", `'subject' debe ser el nombre de la materia («${meta.name}»)`);
  if (data.exam !== exam.name) err("", `'exam' debe ser el nombre del parcial en subject.json («${exam.name}»)`);
  if (!HEX.test(data.accent || "")) err("", `'accent' debe ser un color #RRGGBB (vino ${JSON.stringify(data.accent)})`);
  if (data.accentDark !== undefined && !HEX.test(data.accentDark)) err("", "'accentDark' debe ser un color #RRGGBB");
  if (data.topicFilter !== undefined && !["pick", "multi"].includes(data.topicFilter)) err("", "'topicFilter' debe ser pick|multi");
  if (!data.topics || typeof data.topics !== "object") { err("", "falta 'topics'"); return; }
  for (const [k, t] of Object.entries(data.topics)) {
    if (!t || typeof t.name !== "string") err(`topic ${k}`, "falta 'name'");
    if (!HEX.test(t?.color || "")) err(`topic ${k}`, "'color' debe ser #RRGGBB");
  }
  if (!Array.isArray(data.questions)) { err("", "falta 'questions'"); return; }
  if (!data.questions.length) { console.log(`· ${label}: sin preguntas todavía (se muestra como «Próximamente»)`); return; }

  const inRange = (arr, n) => Array.isArray(arr) && arr.every((c) => Number.isInteger(c) && c >= 0 && c < n);
  data.questions.forEach((q, i) => {
    const where = q.id || `#${i}`;
    const e = (msg) => err(where, msg);
    if (typeof q.id !== "string" || !q.id) e("falta 'id'");
    else if (!q.id.startsWith(slug + "-")) e(`el id debe empezar con '${slug}-'`);
    else if (allIds.has(q.id)) e(`id duplicado (ya existe en ${allIds.get(q.id)})`);
    else allIds.set(q.id, label);
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
      if (s?.file === undefined) {
        // sin PDF: solo la imagen de la página, con su rótulo
        if (typeof s?.img !== "string") e("source sin 'file' necesita 'img'");
        if (typeof s?.label !== "string" || !s.label) e("source sin 'file' necesita 'label'");
      } else if (typeof s.file !== "string") e("source.file debe ser un string");
      else if (!fs.existsSync(path.join(dir, s.file))) e(`no existe ${s.file}`);
      if (!Number.isInteger(s?.page) || s.page < 1) e("source.page debe ser un entero ≥ 1");
      if (!CONFIDENCE.includes(s?.confidence)) e(`source.confidence debe ser ${CONFIDENCE.join("|")}`);
      if (s?.img !== undefined && !fs.existsSync(path.join(dir, s.img))) e(`no existe la imagen ${s.img}`);
    }
  });
  const byType = {};
  data.questions.forEach((q) => { byType[q.type] = (byType[q.type] || 0) + 1; });
  const withSource = data.questions.filter((q) => q.source).length;
  console.log(`· ${label}: ${data.questions.length} preguntas, ${Object.keys(data.topics).length} temas, ` +
    `${JSON.stringify(byType)}${withSource ? `, ${withSource} con source` : ""}`);
}

const slugs = fs.readdirSync(subjectsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory() && fs.existsSync(path.join(subjectsDir, d.name, "subject.json")))
  .map((d) => d.name).sort();
const manifest = path.join(subjectsDir, "subjects.json");
if (fs.existsSync(manifest)) {
  const listed = readJSON(manifest);
  for (const s of listed) if (!slugs.includes(s)) { errors++; console.error(`✘ subjects.json lista '${s}' pero no existe subjects/${s}/subject.json`); }
  for (const s of slugs) if (!listed.includes(s)) { errors++; console.error(`✘ subjects/${s} no está en subjects.json (no aparecerá en la landing)`); }
}
slugs.forEach(checkSubject);
if (errors) { console.error(`\n${errors} error(es).`); process.exit(1); }
console.log("\nOK: sin errores.");
