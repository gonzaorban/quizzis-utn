// Shared quiz engine. Each exam page (subjects/<slug>/<exam>/) calls initQuiz({ slug, exam }) and the
// engine fetches ./questions.json (relative to the page), renders the UI into #app and keeps progress in
// localStorage under "quiz-<slug>-<exam>-v1". Questions are shown one at a time or all on one page (so the
// browser's Ctrl+F can find any of them).

const kindLabel = {
  single: "Seleccioná una opción",
  multi: "Seleccioná una o más opciones",
  tf: "Verdadero o falso",
  match: "Elegí la opción correcta para cada ítem",
  info: "Tarjeta informativa (sin puntaje): tocá «Ver respuesta»",
};

// Moodle-style score in [0,1]. multi: each wrong pick cancels a right one; match: per pair.
export function score(q, ans) {
  if (q.type === "match") {
    let ok = 0;
    q.correct.forEach((c, i) => { if (ans[i] === c) ok++; });
    return ok / q.correct.length;
  }
  if (q.type === "multi") {
    const hits = ans.filter((a) => q.correct.includes(a)).length;
    const wrong = ans.length - hits;
    return Math.max(0, (hits - wrong) / q.correct.length);
  }
  return ans.length === 1 && q.correct.includes(ans[0]) ? 1 : 0;
}

// info cards and questions without a confirmed key are never scored
export const isScored = (q) => q.type !== "info" && q.correct.length > 0;

// true when an answer (sent or draft) has at least one option or pair chosen
const hasAnswer = (q, ans) => !!ans && (q.type === "match" ? ans.some((a) => a >= 0) : ans.length > 0);

export const REPO_URL = "https://github.com/gonzaorban/quizzis-utn/";
const GITHUB_ICON = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"/></svg>';

// GitHub mark + repo name, used by the landing and every subject page
export function repoLink() {
  return `<a class="repo" href="${REPO_URL}" target="_blank" rel="noopener noreferrer" title="Código fuente en GitHub (se abre en una pestaña nueva)">${GITHUB_ICON}<span>gonzaorban/quizzis-utn</span></a>`;
}

// breadcrumb from an exam page (subjects/<slug>/<exam>/) back to its subject and to the landing
function crumbs(subject) {
  return `<nav class="crumbs" aria-label="Ubicación"><a href="../../../">Materias</a><span aria-hidden="true">›</span><a href="../">${esc(subject)}</a></nav>`;
}

export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// Sets the subject accent as CSS variables; the stylesheet picks light or dark.
export function applyAccent(data, el = document.documentElement) {
  if (data.accent) el.style.setProperty("--accent-light", data.accent);
  el.style.setProperty("--accent-dark", data.accentDark || `color-mix(in srgb, ${data.accent || "#2F6FD6"} 70%, white)`);
}

export function swatch(topic) {
  if (!topic) return "";
  return `<span class="wire${topic.striped ? " striped" : ""}" style="--tc:${esc(topic.color)}" aria-hidden="true"></span>`;
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
const fmt = (n) => n.toFixed(2).replace(".", ",");

// legacyKey: storage key used before the subject was split by exam; read once if the new key is empty
export async function initQuiz({ slug, exam, legacyKey, root = document.getElementById("app") }) {
  const dataUrl = new URL("questions.json", document.baseURI);
  let DATA;
  try {
    const res = await fetch(dataUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    DATA = await res.json();
  } catch (e) {
    root.innerHTML = `<div class="wrap"><div class="card empty-state">No se pudieron cargar las preguntas (${esc(e.message)}).
      Si abriste el archivo directamente, levantá un servidor local: <code>npx serve .</code></div></div>`;
    return;
  }
  applyAccent(DATA);
  const heading = `<div class="topbar">${crumbs(DATA.subject)}${repoLink()}</div>
    ${DATA.exam ? `<p class="kicker">${esc(DATA.exam)}</p>` : ""}
    <h1>${esc(DATA.subject)}</h1>
    ${DATA.description ? `<p class="sub">${esc(DATA.description)}</p>` : ""}`;
  if (!DATA.questions.length) {
    root.innerHTML = `<div class="wrap">${heading}
      <div class="card empty-state">Todavía no hay preguntas cargadas para ${esc(DATA.exam ? `el ${DATA.exam}` : "este cuestionario")}.
        <p><a href="../">Elegir otro parcial</a></p></div></div>`;
    return;
  }
  const asset = (path) => new URL(path, dataUrl).href;
  const STORE_KEY = `quiz-${slug}-${exam}-v1`;
  const topicIds = Object.keys(DATA.topics);
  const topicOf = (q) => DATA.topics[String(q.topic)];
  // "multi": chips toggle independently, all on by default (Redes).
  // "pick": a "Todas" chip plus chips that combine: the first tap narrows to that one, later taps add or remove (ASI).
  const pick = DATA.topicFilter === "pick";
  const L = Object.assign({ topics: "Temas", allTopics: "Todos los temas", noTopics: "Ninguno", section: "Sección", feedback: "Explicación de la cátedra" }, DATA.labels);
  const sections = [...new Set(DATA.questions.map((q) => q.section).filter(Boolean))];

  // ---------- state ----------
  let state = loadState();
  let view = [];          // question indexes after filters
  let cur = 0;            // position inside view (in "all" mode: last card touched)
  let optOrder = {};      // question id -> shuffled option order
  let drafts = {};        // question id -> in-progress answer (not checked yet)
  let bulkMsg = "";       // result of the last "Enviar todas", shown until the next change
  let gridView = null;    // view the dot grid was built for
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");

  function loadState() {
    const base = { answers: {}, topics: topicIds.slice(), section: "all", status: "all", shuffleQ: false, shuffleO: true, mode: "one" };
    try {
      const raw = localStorage.getItem(STORE_KEY) || (legacyKey && localStorage.getItem(legacyKey));
      if (!raw) return base;
      const s = Object.assign(base, JSON.parse(raw));
      s.topics = s.topics.map(String).filter((t) => topicIds.includes(t));
      if (pick && !s.topics.length) s.topics = topicIds.slice();
      if (s.section !== "all" && !sections.includes(s.section)) s.section = "all";
      if (s.mode !== "all") s.mode = "one";
      return s;
    } catch (e) { return base; }
  }
  function saveState() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* storage unavailable: keep in memory */ }
  }

  function orderFor(q) {
    const n = q.type === "match" ? q.choices.length : q.opts.length;
    if (!optOrder[q.id]) {
      const idx = [...Array(n).keys()];
      optOrder[q.id] = state.shuffleO && q.type !== "tf" ? shuffle(idx) : idx;
    }
    return optOrder[q.id];
  }
  function statusOf(q) {
    const a = state.answers[q.id];
    if (!a) return "pending";
    if (q.type === "info") return "seen";
    return a.score >= 0.999 ? "ok" : a.score <= 0 ? "bad" : "part";
  }

  // ---------- layout ----------
  const intro = DATA.about && DATA.about.length
    ? `<details class="intro" id="intro" open><summary>Sobre este banco de preguntas</summary>${DATA.about.join("")}</details>` : "";
  root.innerHTML = `<div class="wrap">
    ${heading}
    ${intro}
    <details class="filters" id="filters" open>
      <summary><span>${esc(L.topics)} y opciones</span><span class="hint" id="filterHint"></span></summary>
      <div class="chips" id="chips" role="group" aria-label="Filtrar por ${esc(L.topics.toLowerCase())}"></div>
      <ul class="topic-notes" id="topicNotes"></ul>
      ${pick ? "" : `<div class="row">
        <button class="linkbtn" id="allTopics" type="button">${esc(L.allTopics)}</button>
        <button class="linkbtn" id="noTopics" type="button">${esc(L.noTopics)}</button>
      </div>`}
      <div class="row" style="margin-top:8px">
        ${sections.length ? `<label>${esc(L.section)}
          <select id="sectionFilter">
            <option value="all">todas</option>
            ${sections.map((s) => `<option value="${esc(s)}">${esc(s)} (${DATA.questions.filter((q) => q.section === s).length})</option>`).join("")}
          </select>
        </label>` : ""}
        <label>Mostrar
          <select id="statusFilter">
            <option value="all">todas</option>
            <option value="pending">sin responder</option>
            <option value="wrong">incorrectas o parciales</option>
          </select>
        </label>
        <label><input type="checkbox" id="shuffleQ"> Mezclar preguntas</label>
        <label><input type="checkbox" id="shuffleO" checked> Mezclar opciones</label>
      </div>
      <div class="row" style="margin-top:6px">
        <button class="linkbtn" id="reset" type="button">Borrar mis respuestas</button>
      </div>
    </details>
    <div class="stats" id="stats"></div>
    <div class="bar"><i id="barFill"></i></div>
    <div class="viewmode" id="viewMode" role="group" aria-label="Cómo mostrar las preguntas">
      <button type="button" class="seg" data-mode="one">Una por vez</button>
      <button type="button" class="seg" data-mode="all" title="Muestra todas las preguntas filtradas juntas, para buscarlas con Ctrl+F">Todas en una página</button>
    </div>
    <main id="main"></main>
    <div class="submit-all" id="submitAll" hidden></div>
    <div class="grid" id="grid" aria-label="Ir a pregunta"></div>
    <footer class="foot">
      <p>Puntaje por pregunta al estilo Moodle: en las de opción múltiple cada error descuenta un acierto; en las de emparejar vale cada par. Tu progreso queda guardado en este navegador.</p>
      <p class="kbd-hint">Con teclado, en «Una por vez»: <kbd>1</kbd>–<kbd>9</kbd> marcan opciones, <kbd>Enter</kbd> envía la respuesta o pasa a la siguiente, <kbd>←</kbd> <kbd>→</kbd> cambian de pregunta.</p>
      ${DATA.footer ? `<p>${DATA.footer}</p>` : ""}
    </footer>
  </div>`;
  const $ = (id) => document.getElementById(id);

  // ---------- filters ----------
  function buildChips() {
    const counts = {};
    DATA.questions.forEach((q) => { counts[q.topic] = (counts[q.topic] || 0) + 1; });
    const all = state.topics.length === topicIds.length;
    const allChip = pick
      ? `<button type="button" class="chip" data-topic="*" aria-pressed="${all}">${esc(L.allTopics)} <span class="n">${DATA.questions.length}</span></button>`
      : "";
    $("chips").innerHTML = allChip + topicIds.map((k) =>
      `<button type="button" class="chip" data-topic="${esc(k)}" aria-pressed="${pick ? !all && state.topics.includes(k) : state.topics.includes(k)}">
         ${swatch(DATA.topics[k])}${esc(DATA.topics[k].name)} <span class="n">${counts[k] || 0}</span>
       </button>`).join("");
    $("chips").querySelectorAll(".chip").forEach((b) => b.addEventListener("click", () => {
      const t = b.dataset.topic;
      if (pick) {
        if (t === "*" || all) state.topics = t === "*" ? topicIds.slice() : [t];
        else {
          state.topics = state.topics.includes(t) ? state.topics.filter((x) => x !== t) : [...state.topics, t];
          if (!state.topics.length) state.topics = topicIds.slice();
        }
        buildChips();
      } else {
        state.topics = state.topics.includes(t) ? state.topics.filter((x) => x !== t) : [...state.topics, t];
        b.setAttribute("aria-pressed", state.topics.includes(t));
      }
      applyFilters();
    }));
  }
  function renderTopicNotes() {
    $("topicNotes").innerHTML = state.topics.filter((k) => DATA.topics[k].note)
      .map((k) => `<li>${swatch(DATA.topics[k])}<span><b>${esc(DATA.topics[k].name)}:</b> ${esc(DATA.topics[k].note)}</span></li>`).join("");
  }
  function applyFilters() {
    let idx = DATA.questions.map((q, i) => i).filter((i) => {
      const q = DATA.questions[i];
      if (!state.topics.includes(String(q.topic))) return false;
      if (state.section !== "all" && q.section !== state.section) return false;
      const st = statusOf(q);
      if (state.status === "pending") return st === "pending";
      if (state.status === "wrong") return st === "bad" || st === "part";
      return true;
    });
    if (state.shuffleQ) idx = shuffle(idx);
    view = idx;
    cur = 0;
    bulkMsg = "";
    saveState();
    $("filterHint").textContent = `${view.length} de ${DATA.questions.length}`;
    renderTopicNotes();
    render();
  }

  // ---------- rendering ----------
  function renderStats() {
    const qs = view.map((i) => DATA.questions[i]);
    const scored = qs.filter(isScored);
    const done = scored.filter((q) => state.answers[q.id]);
    const pts = done.reduce((s, q) => s + state.answers[q.id].score, 0);
    const pct = done.length ? Math.round((pts / done.length) * 100) : 0;
    const by = (st) => done.filter((q) => statusOf(q) === st).length;
    const infos = qs.filter((q) => q.type === "info");
    const seen = infos.filter((q) => state.answers[q.id]).length;
    $("stats").innerHTML = `<span>Respondidas <b>${done.length}/${scored.length}</b></span>
      <span><b class="c-ok">✔︎ ${by("ok")}</b> · <b class="c-bad">✘︎ ${by("bad")}</b> · <b class="c-part">◐︎ ${by("part")}</b></span>
      <span>Puntaje <b>${fmt(pts)}</b></span>
      <span>Acierto <b>${done.length ? pct + "%" : "–"}</b></span>
      ${infos.length ? `<span>Informativas vistas <b>${seen}/${infos.length}</b></span>` : ""}`;
    const total = scored.length + infos.length;
    $("barFill").style.width = total ? ((done.length + seen) / total) * 100 + "%" : "0";
  }

  // the dots are rebuilt only when the filtered view changes; otherwise just their classes are synced
  function renderGrid() {
    if (gridView !== view) {
      gridView = view;
      $("grid").innerHTML = view.map((qi, p) => `<button type="button" class="dot" data-p="${p}" aria-label="Pregunta ${p + 1}">${p + 1}</button>`).join("");
    }
    [...$("grid").children].forEach((d, p) => {
      const st = statusOf(DATA.questions[view[p]]);
      const cls = ["dot", p === cur ? "cur" : "", st !== "pending" ? st : ""].filter(Boolean).join(" ");
      if (d.className !== cls) d.className = cls;
      d.toggleAttribute("aria-current", p === cur);
    });
  }
  $("grid").addEventListener("click", (e) => {
    const d = e.target.closest(".dot");
    if (d) goTo(+d.dataset.p);
  });

  // "Enviar todas": sends every checked-but-unsent answer in the current view at once
  const unsent = () => view.map((i) => DATA.questions[i])
    .filter((q) => isScored(q) && !state.answers[q.id] && hasAnswer(q, drafts[q.id]));
  function renderSubmitAll() {
    const n = unsent().length;
    const box = $("submitAll");
    box.hidden = !n && !bulkMsg;
    box.innerHTML = n
      ? `<p>${n === 1 ? "Tenés <b>1</b> pregunta marcada" : `Tenés <b>${n}</b> preguntas marcadas`} sin enviar. Podés enviarlas una por una o todas juntas; las que no tienen ninguna opción elegida quedan sin responder.</p>
        <button class="btn primary" type="button" id="sendAll">Enviar todas (${n})</button>`
      : bulkMsg;
  }
  $("submitAll").addEventListener("click", (e) => {
    if (!e.target.closest("#sendAll")) return;
    const qs = unsent();
    qs.forEach(record);
    saveState();
    const by = (st) => qs.filter((q) => statusOf(q) === st).length;
    bulkMsg = `<p class="sent" tabindex="-1">Se ${qs.length === 1 ? "envió 1 respuesta" : `enviaron ${qs.length} respuestas`}:
      <b class="c-ok">✔︎ ${by("ok")}</b> · <b class="c-bad">✘︎ ${by("bad")}</b> · <b class="c-part">◐︎ ${by("part")}</b>.
      Las correcciones están en cada pregunta.</p>`;
    render();
    $("submitAll").querySelector(".sent").focus();
  });

  function renderFigure(q) {
    if (!q.img) return "";
    const cap = q.type === "info" ? "" : `<figcaption>${esc(DATA.imageCaption || "Imagen de referencia")}</figcaption>`;
    return `<figure class="figure">${cap}<img src="${esc(asset(q.img))}" alt="Esquema de la pregunta" loading="lazy"></figure>`;
  }

  const cardAt = (p) => $("main").querySelector(`.card[data-p="${p}"]`);

  function render() {
    renderStats();
    renderGrid();
    renderSubmitAll();
    $("viewMode").querySelectorAll(".seg").forEach((b) => b.setAttribute("aria-pressed", b.dataset.mode === state.mode));
    const main = $("main");
    main.dataset.mode = state.mode;
    if (!view.length) {
      main.innerHTML = `<div class="card empty-state">No hay preguntas con estos filtros. ${pick ? `Cambiá la selección en “${esc(L.topics)}”` : "Activá algún tema"} o cambiá “Mostrar”.</div>`;
      return;
    }
    if (state.mode === "all") {
      main.innerHTML = view.map((qi, p) => cardHTML(DATA.questions[qi], p)).join("");
      return;
    }
    main.innerHTML = cardHTML(DATA.questions[view[cur]], cur) + `
      <div class="nav">
        <button class="btn" id="prev" type="button" ${cur === 0 ? "disabled" : ""}>Anterior</button>
        <button class="btn" id="next" type="button" ${cur === view.length - 1 ? "disabled" : ""}>Siguiente</button>
      </div>`;
  }

  // re-renders only the card at position p, so "all" mode keeps its scroll position
  function update(p) {
    if (state.mode !== "all") return render();
    renderStats();
    renderGrid();
    renderSubmitAll();
    cardAt(p).outerHTML = cardHTML(DATA.questions[view[p]], p);
  }

  function cardHTML(q, p) {
    const saved = state.answers[q.id];
    const locked = !!saved;
    const topic = topicOf(q);

    let body = "", actions = "";
    if (q.type === "info") {
      actions = locked
        ? `<button class="btn retry" type="button">Ocultar respuesta</button>`
        : `<button class="btn primary check" type="button">Ver respuesta</button>`;
    } else {
      const answer = saved ? saved.ans : (drafts[q.id] || (q.type === "match" ? q.stems.map(() => -1) : []));
      if (q.type === "match") {
        const order = orderFor(q);
        body = q.stems.map((stem, i) => {
          const sel = answer[i];
          let cls = "pair", fix = "";
          if (locked) {
            cls += sel === q.correct[i] ? " is-ok" : " is-bad";
            if (sel !== q.correct[i]) fix = `<span class="fix">Correcta: ${esc(q.choices[q.correct[i]])}</span>`;
          }
          const options = [`<option value="-1">Elegir…</option>`].concat(order.map((c) =>
            `<option value="${c}" ${sel === c ? "selected" : ""}>${esc(q.choices[c])}</option>`)).join("");
          return `<div class="${cls}"><span class="stem">${esc(stem)}</span>
            <select data-i="${i}" ${locked ? "disabled" : ""} aria-label="${esc(stem)}">${options}</select>${fix}</div>`;
        }).join("");
      } else {
        const order = orderFor(q);
        const inputType = q.type === "multi" ? "checkbox" : "radio";
        body = order.map((o) => {
          const checked = answer.includes(o);
          let cls = "opt" + (locked ? " locked" : ""), tag = "";
          if (locked) {
            const isCorrect = q.correct.includes(o);
            if (checked && isCorrect) { cls += " is-ok"; tag = "Correcta"; }
            else if (checked && !isCorrect) { cls += " is-bad"; tag = "Incorrecta"; }
            else if (!checked && isCorrect) { cls += " is-missed"; tag = "Faltó marcar"; }
          }
          return `<label class="${cls}"><input type="${inputType}" name="q-${esc(q.id)}" value="${o}" ${checked ? "checked" : ""} ${locked ? "disabled" : ""}>
            <span>${esc(q.opts[o])}</span>${tag ? `<span class="tag">${tag}</span>` : ""}</label>`;
        }).join("");
      }
      if (!isScored(q)) actions = `<span class="unscored">Sin respuesta confirmada: no se corrige automáticamente.</span>`;
      else actions = locked
        ? `<button class="btn retry" type="button">Responder de nuevo</button>`
        : `<button class="btn primary check" type="button" ${hasAnswer(q, answer) ? "" : "disabled"}>Enviar respuesta</button>`;
    }

    return `
      <article class="card" data-p="${p}">
        <div class="meta">
          <span class="qnum">Pregunta ${p + 1}</span>${swatch(topic)}<span>${esc(topic ? topic.name : q.topic)}</span>
          ${q.section ? `<span class="badge">${esc(q.section)}</span>` : ""}
          ${q.type === "multi" ? `<span class="badge">Selección múltiple</span>` : ""}
          ${q.type === "info" ? `<span class="badge info">Informativa</span>` : ""}
          ${topic && topic.note ? `<span class="tnote">${esc(topic.note)}</span>` : ""}
        </div>
        <p class="qtext">${esc(q.text)}</p>
        <p class="kind">${kindLabel[q.type]}</p>
        ${body ? `<div class="opts">${body}</div>` : ""}
        <div class="actions">${actions}</div>
        ${locked ? (q.type === "info" ? renderInfoReview(q) : renderReview(q, saved)) : ""}
      </article>`;
  }

  // theory PDF page backing the question (source.page is the physical PDF page): a picture of the page when
  // source.img exists, plus the link to the PDF. Without file, only the picture, captioned with source.label
  function renderSource(q) {
    if (!q.source) return "";
    const { file, page, confidence, img, label } = q.source;
    if (!file) return `<figure class="figure source-page"><figcaption>En la teoría: ${esc(label)}</figcaption>
      <a href="${esc(asset(img))}" target="_blank" rel="noopener" title="Ver la imagen en tamaño completo"><img src="${esc(asset(img))}" alt="${esc(label)}" loading="lazy"></a></figure>`;
    const name = file.split("/").pop();
    const low = confidence === "low" ? " · referencia aproximada (confianza baja)" : "";
    const shot = img ? `<figure class="figure source-page"><figcaption>En la teoría: ${esc(name)}, pág. ${page}</figcaption>
      <a href="${esc(asset(img))}" target="_blank" rel="noopener" title="Ver la imagen en tamaño completo"><img src="${esc(asset(img))}" alt="Página ${page} de ${esc(name)}" loading="lazy"></a></figure>` : "";
    return `${shot}<p class="source"><a href="${esc(asset(file))}#page=${page}" target="_blank" rel="noopener" title="Se abre en una pestaña nueva">Ver en la teoría (${esc(name)}, pág. ${page})${low}</a></p>`;
  }

  function renderNote(q) {
    return q.note ? `<div class="note"><b>Atención:</b> ${esc(q.note)}</div>` : "";
  }

  function renderInfoReview(q) {
    return `<section class="review" aria-live="polite" tabindex="-1">
      <h3>Respuesta</h3>${renderFigure(q)}<div class="answer">${esc(q.answer)}</div>${renderNote(q)}${renderSource(q)}
    </section>`;
  }

  function renderReview(q, saved) {
    const s = saved.score;
    const [cls, label] = s >= 0.999 ? ["ok", "Correcta"] : s <= 0 ? ["bad", "Incorrecta"] : ["part", "Parcialmente correcta"];
    let key;
    if (q.type === "match") {
      key = `<ul>${q.stems.map((st, i) => `<li>${esc(st)} → ${esc(q.choices[q.correct[i]])}</li>`).join("")}</ul>`;
    } else if (q.correct.length > 1) {
      key = `<ul>${q.correct.map((c) => `<li>${esc(q.opts[c])}</li>`).join("")}</ul>`;
    } else {
      key = `<p>${esc(q.opts[q.correct[0]])}</p>`;
    }
    let fb = "";
    if (q.fb) fb = `<h3>${esc(L.feedback)}</h3><div class="fb">${esc(q.fb)}</div>`;
    else if (DATA.emptyFeedback) fb = `<h3>${esc(L.feedback)}</h3><div class="fb empty">${esc(DATA.emptyFeedback)}</div>`;
    return `<section class="review" aria-live="polite" tabindex="-1">
      <span class="verdict ${cls}">${label}: ${fmt(s)} / 1</span>
      <h3>${q.correct.length > 1 || q.type === "match" ? "Respuestas correctas" : "Respuesta correcta"}</h3>${key}
      ${fb}${renderNote(q)}${renderFigure(q)}${renderSource(q)}
    </section>`;
  }

  // one set of delegated listeners serves both modes: the card's data-p says which question it is
  const cardOf = (el) => {
    const card = el.closest(".card[data-p]");
    return card && { card, p: +card.dataset.p, q: DATA.questions[view[+card.dataset.p]] };
  };
  $("main").addEventListener("change", (e) => {
    const c = cardOf(e.target);
    if (!c || state.answers[c.q.id]) return;
    const { card, q } = c;
    const opts = card.querySelector(".opts");
    drafts[q.id] = q.type === "match"
      ? [...opts.querySelectorAll("select")].map((s) => +s.value)
      : [...opts.querySelectorAll("input:checked")].map((i) => +i.value);
    const check = card.querySelector(".check");
    if (check) check.disabled = !hasAnswer(q, drafts[q.id]);
    bulkMsg = "";
    renderSubmitAll();
  });
  $("main").addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    if (btn.id === "prev" || btn.id === "next") { goTo(cur + (btn.id === "next" ? 1 : -1), btn.id); return; }
    const c = cardOf(btn);
    if (!c) return;
    cur = c.p;
    if (btn.classList.contains("check")) submit(c.q);
    else if (btn.classList.contains("retry")) {
      delete state.answers[c.q.id];
      delete drafts[c.q.id];
      delete optOrder[c.q.id];
      saveState();
      update(c.p);
      focusIn(c.p, ".opts input, .opts select, .check");
    }
  });

  function record(q) {
    if (q.type === "info") {
      state.answers[q.id] = { seen: true };
    } else {
      const ans = drafts[q.id] || (q.type === "match" ? q.stems.map(() => -1) : []);
      state.answers[q.id] = { ans, score: score(q, ans) };
      delete drafts[q.id];
    }
  }

  function submit(q) {
    record(q);
    saveState();
    update(cur);
    // the card was re-rendered: move focus to the correction instead of losing it to <body>
    focusIn(cur, ".review");
  }

  function focusIn(p, selector) {
    const card = cardAt(p);
    const el = card && card.querySelector(selector);
    if (el) el.focus({ preventScroll: true });
  }

  // after changing question: if the card doesn't fit where it is (its start is above the screen,
  // or it runs past the bottom), bring its start to the top so the question is read first
  function scrollToCard() {
    const c = $("main").querySelector(".card");
    if (!c) return;
    const r = c.getBoundingClientRect();
    if (r.top < 0 || r.bottom > innerHeight) c.scrollIntoView({ block: "start" });
  }

  // moves to position p; in "one" mode the card slides in the direction of travel.
  // focusId: nav button to keep focused after the re-render ("prev" / "next")
  function goTo(p, focusId) {
    if (p < 0 || p >= view.length) return;
    if (state.mode === "all") { cur = p; renderGrid(); cardAt(cur).scrollIntoView({ block: "start" }); return; }
    if (p === cur) return;
    const back = p < cur;
    cur = p;
    withTransition(back, () => {
      render();
      scrollToCard();
      if (!focusId) return;
      // preventScroll: a taller card pushes the buttons down and focusing them would scroll past the question
      const b = $(focusId), other = $(focusId === "next" ? "prev" : "next");
      if (b && !b.disabled) b.focus({ preventScroll: true });
      else if (other && !other.disabled) other.focus({ preventScroll: true });
    });
  }

  function withTransition(back, fn) {
    if (!document.startViewTransition || reduceMotion.matches) return fn();
    document.documentElement.dataset.dir = back ? "prev" : "next";
    document.startViewTransition(fn);
  }

  // ---------- global controls ----------
  $("statusFilter").value = state.status;
  if ($("sectionFilter")) {
    $("sectionFilter").value = state.section;
    $("sectionFilter").addEventListener("change", (e) => { state.section = e.target.value; applyFilters(); });
  }
  $("shuffleQ").checked = state.shuffleQ;
  $("shuffleO").checked = state.shuffleO;
  $("statusFilter").addEventListener("change", (e) => { state.status = e.target.value; applyFilters(); });
  $("shuffleQ").addEventListener("change", (e) => { state.shuffleQ = e.target.checked; applyFilters(); });
  $("shuffleO").addEventListener("change", (e) => { state.shuffleO = e.target.checked; optOrder = {}; saveState(); render(); });
  $("viewMode").querySelectorAll(".seg").forEach((b) => b.addEventListener("click", () => {
    if (state.mode === b.dataset.mode) return;
    state.mode = b.dataset.mode;
    saveState();
    render();
    if (state.mode === "all") { const c = cardAt(cur); if (c) c.scrollIntoView({ block: "start" }); }
    else scrollToCard();
  }));
  if (!pick) {
    $("allTopics").addEventListener("click", () => { state.topics = topicIds.slice(); buildChips(); applyFilters(); });
    $("noTopics").addEventListener("click", () => { state.topics = []; buildChips(); applyFilters(); });
  }
  $("reset").addEventListener("click", () => {
    if (!confirm("¿Borrar todas tus respuestas guardadas?")) return;
    state.answers = {}; drafts = {}; optOrder = {};
    applyFilters();
  });
  // keyboard, "one" mode only: 1–9 pick options, Enter sends (or goes on once sent), arrows navigate
  document.addEventListener("keydown", (e) => {
    if (state.mode === "all" || e.ctrlKey || e.metaKey || e.altKey || e.target.matches("select, textarea")) return;
    const card = $("main").querySelector(".card");
    if (!card) return;
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      if (e.target.matches("input")) return; // radios use the arrows themselves
      goTo(cur + (e.key === "ArrowRight" ? 1 : -1));
    } else if (e.key === "Enter") {
      if (e.target.matches("button, a, summary")) return; // they already react to Enter
      e.preventDefault();
      const check = card.querySelector(".check");
      if (check) { if (!check.disabled) check.click(); }
      else goTo(cur + 1);
    } else if (/^[1-9]$/.test(e.key)) {
      const input = card.querySelectorAll(".opts input:not(:disabled)")[+e.key - 1];
      if (!input) return;
      e.preventDefault();
      input.checked = input.type === "checkbox" ? !input.checked : true;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }
  });
  if (window.innerWidth < 600) {
    $("filters").open = false;
    if ($("intro")) $("intro").open = false;
  }

  buildChips();
  applyFilters();
}
