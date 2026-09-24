// Shared quiz engine. Each subject page calls initQuiz({ slug }) and the engine
// fetches ./questions.json (relative to the page), renders the UI into #app and
// keeps progress in localStorage under "quiz-<slug>-v1".

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

export async function initQuiz({ slug, root = document.getElementById("app") }) {
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
  const asset = (path) => new URL(path, dataUrl).href;
  const STORE_KEY = `quiz-${slug}-v1`;
  const topicIds = Object.keys(DATA.topics);
  const topicOf = (q) => DATA.topics[String(q.topic)];
  // "multi": chips toggle independently (Redes). "single": one chip at a time plus "Todas" (ASI).
  const single = DATA.topicFilter === "single";
  const L = Object.assign({ topics: "Temas", allTopics: "Todos los temas", noTopics: "Ninguno", section: "Sección" }, DATA.labels);
  const sections = [...new Set(DATA.questions.map((q) => q.section).filter(Boolean))];

  // ---------- state ----------
  let state = loadState();
  let view = [];          // question indexes after filters
  let cur = 0;            // position inside view
  let optOrder = {};      // question id -> shuffled option order
  let drafts = {};        // question id -> in-progress answer (not checked yet)

  function loadState() {
    const base = { answers: {}, topics: topicIds.slice(), section: "all", status: "all", shuffleQ: false, shuffleO: true };
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return base;
      const s = Object.assign(base, JSON.parse(raw));
      s.topics = s.topics.map(String).filter((t) => topicIds.includes(t));
      if (s.section !== "all" && !sections.includes(s.section)) s.section = "all";
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
    <a class="home" href="../../">← Todas las materias</a>
    <h1>${esc(DATA.subject)}</h1>
    ${DATA.description ? `<p class="sub">${esc(DATA.description)}</p>` : ""}
    ${intro}
    <details class="filters" id="filters" open>
      <summary><span>${esc(L.topics)} y opciones</span><span class="hint" id="filterHint"></span></summary>
      <div class="chips" id="chips" role="group" aria-label="Filtrar por ${esc(L.topics.toLowerCase())}"></div>
      <ul class="topic-notes" id="topicNotes"></ul>
      ${single ? "" : `<div class="row">
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
    <main id="main"></main>
    <div class="grid" id="grid" aria-label="Ir a pregunta"></div>
    <footer class="foot">
      <p>Puntaje por pregunta al estilo Moodle: en las de opción múltiple cada error descuenta un acierto; en las de emparejar vale cada par. Tu progreso queda guardado en este navegador.</p>
      ${DATA.footer ? `<p>${DATA.footer}</p>` : ""}
    </footer>
  </div>`;
  const $ = (id) => document.getElementById(id);

  // ---------- filters ----------
  function buildChips() {
    const counts = {};
    DATA.questions.forEach((q) => { counts[q.topic] = (counts[q.topic] || 0) + 1; });
    const all = state.topics.length === topicIds.length;
    const allChip = single
      ? `<button type="button" class="chip" data-topic="*" aria-pressed="${all}">${esc(L.allTopics)} <span class="n">${DATA.questions.length}</span></button>`
      : "";
    $("chips").innerHTML = allChip + topicIds.map((k) =>
      `<button type="button" class="chip" data-topic="${esc(k)}" aria-pressed="${single ? !all && state.topics.includes(k) : state.topics.includes(k)}">
         ${swatch(DATA.topics[k])}${esc(DATA.topics[k].name)} <span class="n">${counts[k] || 0}</span>
       </button>`).join("");
    $("chips").querySelectorAll(".chip").forEach((b) => b.addEventListener("click", () => {
      const t = b.dataset.topic;
      if (single) {
        state.topics = t === "*" ? topicIds.slice() : [t];
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

  function renderGrid() {
    $("grid").innerHTML = view.map((qi, p) => {
      const st = statusOf(DATA.questions[qi]);
      const cls = ["dot", p === cur ? "cur" : "", st !== "pending" ? st : ""].join(" ");
      return `<button type="button" class="${cls}" data-p="${p}" aria-label="Pregunta ${p + 1}"${p === cur ? ' aria-current="true"' : ""}>${p + 1}</button>`;
    }).join("");
    $("grid").querySelectorAll(".dot").forEach((d) => d.addEventListener("click", () => { cur = +d.dataset.p; render(); scrollToCard(); }));
  }

  function renderFigure(q) {
    if (!q.img) return "";
    const cap = q.type === "info" ? "" : `<figcaption>${esc(DATA.imageCaption || "Imagen de referencia")}</figcaption>`;
    return `<figure class="figure">${cap}<img src="${esc(asset(q.img))}" alt="Esquema de la pregunta" loading="lazy"></figure>`;
  }

  function render() {
    renderStats();
    renderGrid();
    const main = $("main");
    if (!view.length) {
      main.innerHTML = `<div class="card empty-state">No hay preguntas con estos filtros. ${single ? `Elegí otra opción en “${esc(L.topics)}”` : "Activá algún tema"} o cambiá “Mostrar”.</div>`;
      return;
    }
    const q = DATA.questions[view[cur]];
    const saved = state.answers[q.id];
    const locked = !!saved;
    const topic = topicOf(q);

    let body = "", actions = "";
    if (q.type === "info") {
      actions = locked
        ? `<button class="btn" id="retry" type="button">Ocultar respuesta</button>`
        : `<button class="btn primary" id="check" type="button">Ver respuesta</button>`;
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
          return `<label class="${cls}"><input type="${inputType}" name="q" value="${o}" ${checked ? "checked" : ""} ${locked ? "disabled" : ""}>
            <span>${esc(q.opts[o])}</span>${tag ? `<span class="tag">${tag}</span>` : ""}</label>`;
        }).join("");
      }
      const hasAnswer = q.type === "match" ? answer.some((a) => a >= 0) : answer.length > 0;
      if (!isScored(q)) actions = `<span class="unscored">Sin respuesta confirmada: no se corrige automáticamente.</span>`;
      else actions = locked
        ? `<button class="btn" id="retry" type="button">Responder de nuevo</button>`
        : `<button class="btn primary" id="check" type="button" ${hasAnswer ? "" : "disabled"}>Enviar respuesta</button>`;
    }

    main.innerHTML = `
      <article class="card" id="card">
        <div class="meta">
          <span class="qnum">Pregunta ${cur + 1}</span>${swatch(topic)}<span>${esc(topic ? topic.name : q.topic)}</span>
          ${q.section ? `<span class="badge">${esc(q.section)}</span>` : ""}
          ${q.type === "multi" ? `<span class="badge">Selección múltiple</span>` : ""}
          ${q.type === "info" ? `<span class="badge info">Informativa</span>` : ""}
          ${topic && topic.note ? `<span class="tnote">${esc(topic.note)}</span>` : ""}
        </div>
        <p class="qtext">${esc(q.text)}</p>
        <p class="kind">${kindLabel[q.type]}</p>
        ${body ? `<div class="opts" id="opts">${body}</div>` : ""}
        <div class="actions">${actions}</div>
        ${locked ? (q.type === "info" ? renderInfoReview(q) : renderReview(q, saved)) : ""}
      </article>
      <div class="nav">
        <button class="btn" id="prev" type="button" ${cur === 0 ? "disabled" : ""}>Anterior</button>
        <button class="btn" id="next" type="button" ${cur === view.length - 1 ? "disabled" : ""}>Siguiente</button>
      </div>`;
    bindCard(q);
  }

  function renderNote(q) {
    return q.note ? `<div class="note"><b>Atención:</b> ${esc(q.note)}</div>` : "";
  }

  function renderInfoReview(q) {
    return `<section class="review" aria-live="polite">
      <h3>Respuesta</h3>${renderFigure(q)}<div class="answer">${esc(q.answer)}</div>${renderNote(q)}
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
    if (q.fb) fb = `<h3>Explicación de la cátedra</h3><div class="fb">${esc(q.fb)}</div>`;
    else if (DATA.emptyFeedback) fb = `<h3>Explicación de la cátedra</h3><div class="fb empty">${esc(DATA.emptyFeedback)}</div>`;
    return `<section class="review" aria-live="polite">
      <span class="verdict ${cls}">${label}: ${fmt(s)} / 1</span>
      <h3>${q.correct.length > 1 || q.type === "match" ? "Respuestas correctas" : "Respuesta correcta"}</h3>${key}
      ${fb}${renderNote(q)}${renderFigure(q)}
    </section>`;
  }

  function bindCard(q) {
    const opts = $("opts");
    const locked = !!state.answers[q.id];
    if (!locked && $("check")) {
      if (opts) opts.addEventListener("change", () => {
        if (q.type === "match") {
          drafts[q.id] = [...opts.querySelectorAll("select")].map((s) => +s.value);
        } else {
          drafts[q.id] = [...opts.querySelectorAll("input:checked")].map((i) => +i.value);
        }
        const d = drafts[q.id];
        $("check").disabled = q.type === "match" ? !d.some((a) => a >= 0) : d.length === 0;
      });
      $("check").addEventListener("click", () => submit(q));
    } else if (locked) {
      $("retry").addEventListener("click", () => {
        delete state.answers[q.id];
        delete drafts[q.id];
        delete optOrder[q.id];
        saveState();
        render();
      });
    }
    $("prev").addEventListener("click", () => { if (cur > 0) { cur--; render(); scrollToCard(); } });
    $("next").addEventListener("click", () => { if (cur < view.length - 1) { cur++; render(); scrollToCard(); } });
  }

  function submit(q) {
    if (q.type === "info") {
      state.answers[q.id] = { seen: true };
    } else {
      const ans = drafts[q.id] || (q.type === "match" ? q.stems.map(() => -1) : []);
      state.answers[q.id] = { ans, score: score(q, ans) };
      delete drafts[q.id];
    }
    saveState();
    render();
  }

  function scrollToCard() {
    const c = $("card");
    if (c && c.getBoundingClientRect().top < 0) c.scrollIntoView({ block: "start" });
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
  if (!single) {
    $("allTopics").addEventListener("click", () => { state.topics = topicIds.slice(); buildChips(); applyFilters(); });
    $("noTopics").addEventListener("click", () => { state.topics = []; buildChips(); applyFilters(); });
  }
  $("reset").addEventListener("click", () => {
    if (!confirm("¿Borrar todas tus respuestas guardadas?")) return;
    state.answers = {}; drafts = {}; optOrder = {};
    applyFilters();
  });
  document.addEventListener("keydown", (e) => {
    if (e.target.matches("select, input, textarea")) return;
    if (e.key === "ArrowRight" && cur < view.length - 1) { cur++; render(); }
    if (e.key === "ArrowLeft" && cur > 0) { cur--; render(); }
  });
  if (window.innerWidth < 600) {
    $("filters").open = false;
    if ($("intro")) $("intro").open = false;
  }

  buildChips();
  applyFilters();
}
