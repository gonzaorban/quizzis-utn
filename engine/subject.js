// Subject level: subjects/<slug>/subject.json lists the subject's exams, and each exam lives in
// subjects/<slug>/<exam>/ with its own questions.json. The landing uses loadSubject for its cards and every
// subject page calls initSubject({ slug }) to let the user pick the exam.
import { esc, repoLink, applyAccent, backToTop } from "./quiz.js";

export const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

async function getJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// subject.json plus each exam's questions.json (as exam.data, or exam.error if it failed to load).
// base: URL of the subject folder, with the trailing slash
export async function loadSubject(base) {
  const meta = await getJSON(new URL("subject.json", base));
  const exams = await Promise.all(meta.exams.map(async (e) => {
    try { return { ...e, data: await getJSON(new URL(`${e.slug}/questions.json`, base)) }; }
    catch (err) { return { ...e, error: err.message }; }
  }));
  return { ...meta, exams };
}

// empty exams are placeholders for a future bank: shown, but not playable yet
export const isReady = (e) => e.data && e.data.questions.length > 0;

export async function initSubject({ slug, root = document.getElementById("app") }) {
  backToTop();
  let S;
  try {
    S = await loadSubject(new URL("./", document.baseURI));
  } catch (e) {
    root.innerHTML = `<div class="wrap"><div class="card empty-state">No se pudo cargar la materia «${esc(slug)}» (${esc(e.message)}).
      Si abriste el archivo directamente, levantá un servidor local: <code>npx serve .</code></div></div>`;
    return;
  }
  applyAccent(S);
  const cards = S.exams.map((e) => {
    if (e.error) return `<li class="card empty-state">No se pudo cargar «${esc(e.name)}» (${esc(e.error)}).</li>`;
    if (!isReady(e)) return `<li><div class="subject soon" aria-disabled="true">
        <h2>${esc(e.name)} <span class="badge">Próximamente</span></h2>
        <p>Todavía no hay preguntas cargadas.</p>
      </div></li>`;
    const d = e.data;
    const topicsLabel = (d.labels && d.labels.topics ? d.labels.topics : "Temas").toLowerCase();
    return `<li><a class="subject" href="${esc(e.slug)}/">
        <h2>${esc(e.name)}</h2>
        ${d.description ? `<p>${esc(d.description)}</p>` : ""}
        <p class="counts">${plural(d.questions.length, "pregunta", "preguntas")} · ${Object.keys(d.topics).length} ${esc(topicsLabel)}</p>
      </a></li>`;
  });
  document.title = `${S.name}: parciales`;
  root.innerHTML = `<div class="wrap">
    <div class="topbar"><a class="home" href="../../">← Todas las materias</a>${repoLink()}</div>
    <h1>${esc(S.name)}</h1>
    <p class="sub">${S.description ? `${esc(S.description)} ` : ""}Elegí el parcial que querés practicar.</p>
    <ul class="subjects">${cards.join("")}</ul>
  </div>`;
}
