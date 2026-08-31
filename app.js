/* =========================================================
   Kitsch · Customer Experience Scorecard
   App logic — data.json driven, Agent View + Team View
   (Team Health / Metrics / Scorecard / Top Performers /
   Rollout), TL Mode gating, 1:1 coaching modal with history
   + printable/PDF-ready export, personalized tips engine,
   and localStorage persistence.
========================================================= */

const KITSCH_LOGO_DATA_URI = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAATcAAAE6CAYAAABzvBXsAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAADUmSURBVHhe7d13eBTV3gfw72xL3fRCCSR0kKYiiChFERQEUS427L1xQfS1AYoFUETAgoqoeAVEroIUlabSe68h1EBISK+72TYz57x/ZMMlm+xmk92EcPx9nofHx5lJMrsz851zZk6ROOcchBAiGI3rAkIIEQGFGyFESJKp1MKl7LOuywkh5IpGJTdCiJAo3AghQqJwI4QIicKNECIkCjdCiJAo3AghQqJwI4QIicKNECIkCjdCiJAo3AghQqJwI4QIicKNECIkCjdCiJAo3AghQqJwI4QIicKNECIkCjdCiJAo3AghQqJwI4QIicKNECIkCjdCiJAo3AghQqJwI4QIicKNECIkCjdCiJAo3AghQqJwI4QIicKNECIkCjdCiJAo3AghQqJwI4QIicKNECIkCjdCiJAo3AghQqJwI4QIicKNECIkCjdCiJAo3AghQqJwI4QIicKNECIkCjdCiJAo3AghQqJwI4QIicKNECIkCjdCiJAo3AghQqJwI4QIicKNECIkCjdCiJAo3AghQqJwI4QIicKNECIkCjdCiJAo3AghQqJwI4QIicKNECIkCjdCiJAo3AghQqJwI4QIicKNECIkCjdCiJAo3AghQqJwI4QIicKNECIkCjdCiJAo3AghQqJwI4QIicKNECIkCjdCiJAo3AghQqJwI4QIicKNECIkCjdCiJAo3AghQqJwI4QIicKNECIkCjdCiJAo3AghQqJwI4QIicKNECIkCjdCiJAo3AghQqJwI4QIicKNECIkCjdCiJAo3AghQqJwI4QIicKNECIkCjdCiJAo3AghQqJwI4QIicKNECIkCjdCiJAo3AghQqJwI4QIicKNECIkCjdCiJAo3AghQqJwI4QIicKNECIkCjdCiJAo3AghQqJwI4QIicKNECIkCjdCiJAo3AghQqJwI4QIicKNECIkCjdCiJAo3AghQqJwI4QIicKNECIkCjdCiJAo3AghQqJwI4QIicKNECIkCjdCiJAo3AghQqJwI4QIicKNECIkocONcw7OuetiQq5IiqLAZrfDIcuuq4SjMgab3Q6L1QpZUVxXe0UylVq4lH3WdfkV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lQRA0pQNRSXLCgb174tXX3jG7Uuby82ncAOAc+czsPiPVQgLDcXDIzwPI1RbR1NO4O8t22CzO6p87V9TWq0WISHBeHD4MIQZPb/8YJzDarXiu4W/lE3/5gWNRgODwQC9Xger1eb121qPnEP/9Op+Lbpf3cVtuMF5VzeXluKvTduwbfc+pJw8haISExgrGwFCkiTo9To0b9IYV3fuiIH9eqNd65ZejZXmT4wxOGQZJrMZySdO4fipVJxNO4+MrGxk5+bBXGoBY+xisEhS2XcbZjSiaeN4tE5KxDWdO6L7NV1hDA3x6zD2iqLAYrXiUHIKDiUfx5m0NGRl56KwuPhiO8XyAI6PjUVS86bo3L4druncEZER4Z7n61BVnEo959XjCW9JkoQwo7HK2aYYYziXfgH5BYXOIol/NE9oipjoqEql0obC53DjzofSkiTV2YVR/jf8rSb7zLgX3WLqQU32maOslGSz2ZGdm4ecvDzIsoKQ4GA0a9oYxtBQBAUGQKPVVtnHsb5xZ8NXWZYhKyosFgsKCotQarWCM46goEBER0bAGBoKg14PvUHv10BzhzvnS1UUBYqilvUe4WWlGK1GC71OB71B79UzPlJ/fA43QghpiOhWQwgREoUbIURIFG6EECFRuBFChEThRggREoUbIURIFG6EECFRuBFChEThRggREoUbIURIFG6EECFRuBFChEThRggREoUbIURIFG6EECFRuBFChEThRggREoUbIURIFG6EECFRuBFChEThRggREoUbIURIFG6EECFRuBFChEThRggREoUbIURIFG6EECFRuBFChEThRggREoUbIURIFG6EECFRuBFChEThRggREoUbIURIFG6EECFRuBFChEThRggREoUbIURIFG6EECFRuBFChEThRggREoUbIURIFG6EECFRuBFChEThRggREoUbIURIFG6EECFRuBFChEThRggREoUbIURIFG6EECFRuBFChEThRggREoUbIURIFG6EECFRuBFChEThRggREoUbIURIFG6EECFRuBFChEThRggREoUbIURIFG6EECFRuBFChEThRggREoUbIURIFG6EECFRuBFChEThRggREoUbIURIFG6EECFRuBFChEThRggREoUbIURIFG6EECFRuBFChEThRggREoUbIURIFG6EECFRuBFChEThRggREoUbIURIFG6EECFRuBFChEThRggREoUbIURIFG6EECFRuBFChEThRggREoUbIURIFG6EECFRuBFChEThRggREoUbIURIFG6EECFRuBFChEThRggREoUbIURIFG6EECFRuBFChEThRggREoUbIURIFG6EECFRuBFChEThRggREoUbIURIFG6EECFRuBFChEThRggREoUbIURIFG6EECFRuBFChEThRggREoUbIURIFG6EECFRuBFChEThRggREoUbIURIFG6EECH9P9/UDI5ZkJgwAAAAAElFTkSuQmCC";
const STORAGE_KEY = "kitschScorecardOverrides_v5";
let DATA = null;
let STATE = null;

let appMode = "agent";
let selectedAgentIdx = 0;
let tlMode = false;
let teamSubview = "health";
let metricsFuncTab = "csr";

let modalAgentIdx = null;
let modalActionItems = [];
let modalIsDirty = false;

/* ---------------- Utility formatting ---------------- */
function fmtUnit(value, unit) {
  if (unit === "%") return (value * 100).toFixed(1) + "%";
  if (unit === "sec") return Math.round(value) + "s";
  if (unit === "min") return Math.round(value) + "m";
  return Math.round(value) + " " + unit;
}
function fmtGoalPlain(m) {
  return (m.direction === "higher" ? ">= " : "<= ") + fmtUnit(m.goal, m.unit);
}
function fmtPct(value) { return (value * 100).toFixed(1) + "%"; }
function firstName(fullName) { return fullName.split(" ")[0]; }
function todayISO() { return new Date().toISOString().slice(0, 10); }
function escapeHtml(str) {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");
}

/* ---------------- Core scoring logic ---------------- */
function computeAttainment(metric) {
  const { actual, goal, cap, direction } = metric;
  let raw;
  if (direction === "higher") raw = goal > 0 ? actual / goal : 0;
  else raw = actual > 0 ? goal / actual : 0;
  const attainment = Math.max(0, Math.min(raw, 1));
  let belowCap = direction === "higher" ? actual < cap : actual > cap;
  return { attainment, belowCap };
}

function computeFunctionScore(fn) {
  let weighted = 0;
  const rows = fn.metrics.map((m) => {
    const { attainment, belowCap } = computeAttainment(m);
    weighted += attainment * m.weight;
    return { ...m, attainment, belowCap };
  });
  return { rows, score: weighted };
}

function computeAgentMetrics(agent) {
  const fn = STATE[agent.function];
  return fn.metrics.map((m) => {
    const actual = agent.actuals[m.name];
    const modified = { ...m, actual };
    const { attainment, belowCap } = computeAttainment(modified);
    return { ...modified, attainment, belowCap };
  });
}
function computeAgentScore(agent) {
  const rows = computeAgentMetrics(agent);
  let weighted = 0;
  rows.forEach((r) => (weighted += r.attainment * r.weight));
  return weighted;
}

function getTierIndex(score) {
  const tiers = STATE.tiers;
  for (let i = 0; i < tiers.length; i++) if (score >= tiers[i].min) return i;
  return tiers.length - 1;
}
function getTier(score) { return STATE.tiers[getTierIndex(score)]; }

function statusColors(attainment, belowCap) {
  if (belowCap) return { bg: "var(--critical)", ink: "#fff", label: "Below Minimum" };
  if (attainment >= 0.95) return { bg: "var(--good)", ink: "var(--good-ink)", label: "On Track" };
  if (attainment >= 0.85) return { bg: "var(--ok)", ink: "var(--ok-ink)", label: "Watch" };
  return { bg: "var(--bad)", ink: "var(--bad-ink)", label: "At Risk" };
}

/* ---------------- Personalized tips engine ---------------- */
function getAgentTips(rows, tierIndex, score) {
  const problems = rows.filter((r) => r.belowCap || r.attainment < 0.95).sort((a, b) => a.attainment - b.attainment).slice(0, 3);
  if (problems.length === 0) {
    if (tierIndex === 0) return [{ icon: "🌟", title: "Outstanding work!", text: "You're delivering perfect execution against every goal this month. Keep setting the standard for the team!", tone: "positive" }];
    const nextTier = STATE.tiers[tierIndex - 1];
    const gapPts = ((nextTier.min - score) * 100).toFixed(1);
    return [{ icon: "🌟", title: "Great job!", text: `You're on track across all your metrics this month. Keep this consistency and you're only ${gapPts} points away from ${nextTier.emoji} ${nextTier.name}!`, tone: "positive" }];
  }
  return problems.map((r) => {
    const tip = (STATE.metricTips && STATE.metricTips[r.name]) || { icon: "💡", title: `Improve ${r.name}`, advice: "Actual is {actual} (goal {goal}). Talk to your TL for a focused coaching plan on this metric." };
    const text = tip.advice.replace("{actual}", fmtUnit(r.actual, r.unit)).replace("{goal}", fmtUnit(r.goal, r.unit));
    return { icon: tip.icon, title: tip.title, text, tone: r.belowCap ? "critical" : "normal" };
  });
}

function getEstadoMessage(tierIndex) {
  const name = STATE.tiers[tierIndex].name;
  if (name === "Platinum") return "Outstanding! You're delivering perfect execution against every goal this month. 🎉";
  if (name === "Gold") return "Strong performance! You're hitting your goals. A little more consistency gets you to Platinum.";
  if (name === "Silver") return "Solid performance. You're meeting the bar, but there's room to push into Gold — check your tips below.";
  return "There are clear opportunities to improve this month — focus on the flagged metrics below to get back on track.";
}

/* ---------------- Persistence ---------------- */
function loadOverrides() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { csr: {}, cssr: {}, headcount: {}, agents: {}, oneOnOnes: {} };
  } catch (e) {
    return { csr: {}, cssr: {}, headcount: {}, agents: {}, oneOnOnes: {} };
  }
}
function saveOverrides(overrides) { localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides)); }

function buildState() {
  const overrides = loadOverrides();
  const clone = JSON.parse(JSON.stringify(DATA));
  ["csr", "cssr"].forEach((key) => {
    if (overrides.headcount && overrides.headcount[key] != null) clone[key].headcount = overrides.headcount[key];
    clone[key].metrics.forEach((m, idx) => {
      const o = overrides[key] && overrides[key][idx];
      if (o != null) m.actual = o;
    });
  });
  if (overrides.agents && clone.agents) {
    clone.agents.forEach((agent, idx) => {
      const agentOverride = overrides.agents[idx];
      if (agentOverride) Object.keys(agentOverride).forEach((metricName) => { agent.actuals[metricName] = agentOverride[metricName]; });
    });
  }
  STATE = clone;
}

/* ================================================================
   TL MODE
================================================================ */
function applyTlModeToDOM() {
  document.getElementById("tlBanner").classList.toggle("show", tlMode);
  const tlBtn = document.getElementById("tlToggleBtn");
  tlBtn.classList.toggle("on", tlMode);
  tlBtn.textContent = tlMode ? "🔓 TL Mode: ON" : "🔒 TL Mode";
  document.querySelectorAll(".actual-input, .hc-input").forEach((el) => { el.disabled = !tlMode; });
  document.querySelectorAll(".sc-onetoone-btn").forEach((btn) => { btn.disabled = !tlMode; });
}

function initTlToggle() {
  document.getElementById("tlToggleBtn").addEventListener("click", () => {
    tlMode = !tlMode;
    persistUiState();
    applyTlModeToDOM();
  });
  document.getElementById("tlExitBtn").addEventListener("click", () => {
    tlMode = false;
    persistUiState();
    applyTlModeToDOM();
  });
}

function persistUiState() {
  const overrides = loadOverrides();
  overrides.ui = { tlMode, selectedAgentIdx };
  saveOverrides(overrides);
}

/* ================================================================
   AGENT VIEW
================================================================ */
function renderAgentPicker() {
  const picker = document.getElementById("agentPicker");
  const csrAgents = STATE.agents.map((a, i) => ({ a, i })).filter((x) => x.a.function === "csr");
  const cssrAgents = STATE.agents.map((a, i) => ({ a, i })).filter((x) => x.a.function === "cssr");
  picker.innerHTML = `
    <optgroup label="🎫 CSR — Tickets">${csrAgents.map(({ a, i }) => `<option value="${i}">${a.name}</option>`).join("")}</optgroup>
    <optgroup label="💬 CSSR — Social Media">${cssrAgents.map(({ a, i }) => `<option value="${i}">${a.name}</option>`).join("")}</optgroup>
  `;
  picker.value = String(selectedAgentIdx);
  picker.addEventListener("change", (e) => {
    selectedAgentIdx = parseInt(e.target.value, 10);
    persistUiState();
    renderAgentView();
  });
}

function renderAgentView() {
  if (!STATE.agents || STATE.agents.length === 0) return;
  if (selectedAgentIdx >= STATE.agents.length) selectedAgentIdx = 0;

  const agent = STATE.agents[selectedAgentIdx];
  const rows = computeAgentMetrics(agent);
  const score = computeAgentScore(agent);
  const tierIndex = getTierIndex(score);
  const tier = STATE.tiers[tierIndex];
  const fnLabel = agent.function === "csr" ? "CSR Agent" : "CSSR Agent";
  const bonusEligible = !rows.some((r) => r.belowCap);

  document.getElementById("agentPicker").value = String(selectedAgentIdx);
  document.getElementById("greetTitle").textContent = `👋 Hi, ${firstName(agent.name)}`;
  document.getElementById("greetSub").textContent = `${agent.name} · ${fnLabel} · ${STATE.meta.scorePeriod}`;
  document.getElementById("greetBadges").innerHTML = `
    <span class="pill-badge ${bonusEligible ? "bonus-yes" : "bonus-no"}">${bonusEligible ? "✅ Bonus Eligible" : "🚫 Not Bonus Eligible"}</span>
    <span class="pill-badge" style="background:${tier.color};color:var(--ink);">${tier.emoji} ${tier.name}</span>
  `;

  const pct = Math.max(0, Math.min(score, 1)) * 100;
  document.getElementById("gaugeOuter").style.background = `conic-gradient(#8E7CE8 ${(pct*3.6*0.5).toFixed(1)}deg, #5FA9E8 ${(pct*3.6).toFixed(1)}deg, #EAE6F5 0deg)`;
  document.getElementById("gaugeScore").textContent = fmtPct(score);

  const filledStars = Math.max(0, Math.min(5, Math.floor(score * 5)));
  document.getElementById("starsRow").innerHTML = Array.from({ length: 5 }, (_, i) => i < filledStars ? `<span class="star-filled">★</span>` : `<span class="star-empty">★</span>`).join("");
  document.getElementById("starsTier").textContent = `${tier.emoji} ${tier.name}`;
  const onTrackCount = rows.filter((r) => !r.belowCap && r.attainment >= 0.95).length;
  document.getElementById("starsSub").textContent = `${onTrackCount}/${rows.length} metrics on track`;

  document.getElementById("estadoTier").innerHTML = `${tier.emoji} ${tier.name}`;
  document.getElementById("estadoStatus").innerHTML = bonusEligible ? `On Target <span class="status-icon good">✓</span>` : `Below Minimum <span class="status-icon bad">✕</span>`;
  document.getElementById("estadoMessage").innerHTML = `<span style="font-size:1.2rem;">💬</span><span>${getEstadoMessage(tierIndex)}</span>`;

  document.getElementById("agentMetricsGrid").innerHTML = rows.map((r) => {
    const colors = statusColors(r.attainment, r.belowCap);
    return `
      <div class="agent-tile">
        <div class="tile-label">${r.name}</div>
        <div class="tile-value" style="color:${colors.ink === '#fff' ? '#B23A3A' : colors.ink};">${fmtUnit(r.actual, r.unit)}</div>
        <div class="tile-goal">Goal ${r.direction === "higher" ? "≥" : "≤"} ${fmtUnit(r.goal, r.unit)}</div>
        <div class="tile-track"><div class="tile-fill" style="width:${(r.attainment*100).toFixed(1)}%;background:${colors.bg};"></div></div>
        <span class="tile-tag" style="background:${colors.bg};color:${colors.ink};">${colors.label}</span>
      </div>
    `;
  }).join("");

  const tips = getAgentTips(rows, tierIndex, score);
  document.getElementById("tipsList").innerHTML = tips.map((t) => `
    <div class="tip-card ${t.tone === "critical" ? "critical" : (t.tone === "positive" ? "positive" : "")}">
      <div class="tip-icon">${t.icon}</div>
      <div><p class="tip-title">${t.title}</p><p class="tip-text">${t.text}</p></div>
    </div>
  `).join("");
}

/* ================================================================
   TEAM VIEW — Team Health / Metrics
================================================================ */
function renderMetrics(containerId, fnKey) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";
  const fn = STATE[fnKey];
  fn.metrics.forEach((m, idx) => {
    const { attainment, belowCap } = computeAttainment(m);
    const colors = statusColors(attainment, belowCap);
    const card = document.createElement("div");
    card.className = "metric-card";
    card.innerHTML = `
      <div><div class="metric-name">${m.name}</div><div class="metric-note">${m.note || ""}</div></div>
      <div><div class="metric-sub">Weight</div><div class="metric-val">${(m.weight * 100).toFixed(0)}%</div></div>
      <div><div class="metric-sub">Goal / Min</div><div class="metric-val">${fmtUnit(m.goal, m.unit)} <span style="color:var(--ink-soft);font-weight:500;">/ ${fmtUnit(m.cap, m.unit)}</span></div></div>
      <div><div class="metric-sub">Actual</div><input type="number" step="any" class="actual-input" data-fn="${fnKey}" data-idx="${idx}" value="${m.actual}" ${tlMode ? "" : "disabled"} /></div>
      <div class="attain-block">
        <div class="attain-top"><span>${fmtPct(attainment)}</span><span class="status-tag" style="background:${colors.bg};color:${colors.ink};">${colors.label}</span></div>
        <div class="progress-track"><div class="progress-fill" style="width:${(attainment*100).toFixed(1)}%;background:${colors.bg};"></div></div>
      </div>
    `;
    container.appendChild(card);
  });
  container.querySelectorAll(".actual-input").forEach((input) => input.addEventListener("input", onActualChange));
}

function renderFunctionTotal(containerId, fnKey) {
  const fn = STATE[fnKey];
  const { score } = computeFunctionScore(fn);
  const tier = getTier(score);
  document.getElementById(containerId).innerHTML = `
    <div><div style="font-weight:700;color:var(--ink-soft);font-size:0.85rem;text-transform:uppercase;letter-spacing:.03em;">Total / Weighted Score</div><div class="score-big">${fmtPct(score)}</div></div>
    <div class="tier-pill" style="background:${tier.color};color:var(--ink);">${tier.emoji} ${tier.name}</div>
  `;
}

function initMetricsFuncToggle() {
  document.querySelectorAll(".func-toggle-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".func-toggle-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      metricsFuncTab = btn.dataset.func;
      document.getElementById("csrMetrics").style.display = metricsFuncTab === "csr" ? "flex" : "none";
      document.getElementById("csrTotal").style.display = metricsFuncTab === "csr" ? "flex" : "none";
      document.getElementById("cssrMetrics").style.display = metricsFuncTab === "cssr" ? "flex" : "none";
      document.getElementById("cssrTotal").style.display = metricsFuncTab === "cssr" ? "flex" : "none";
    });
  });
}

function renderOverview() {
  const csrRes = computeFunctionScore(STATE.csr);
  const cssrRes = computeFunctionScore(STATE.cssr);
  const csrTier = getTier(csrRes.score);
  const cssrTier = getTier(cssrRes.score);
  const totalHC = STATE.csr.headcount + STATE.cssr.headcount;
  const csrShare = totalHC > 0 ? STATE.csr.headcount / totalHC : 0;
  const cssrShare = totalHC > 0 ? STATE.cssr.headcount / totalHC : 0;
  const deptScore = csrShare * csrRes.score + cssrShare * cssrRes.score;
  const deptTier = getTier(deptScore);

  document.getElementById("overviewCards").innerHTML = `
    <div class="card func-card">
      <div class="card-top-strip" style="background:linear-gradient(90deg,var(--rb-pink),var(--rb-peach));"></div>
      <h3>🎫 ${STATE.csr.label}</h3><p class="sub">Ticket handling team</p>
      <div class="func-row"><span style="color:var(--ink-soft);font-weight:600;font-size:0.85rem;">Headcount</span><input type="number" min="0" class="hc-input" data-fn="csr" value="${STATE.csr.headcount}" ${tlMode ? "" : "disabled"} /></div>
      <div class="func-row"><span style="color:var(--ink-soft);font-weight:600;font-size:0.85rem;">% of Team</span><span style="font-weight:700;">${fmtPct(csrShare)}</span></div>
      <div class="score-big">${fmtPct(csrRes.score)}</div>
      <div class="progress-track"><div class="progress-fill" style="width:${(csrRes.score*100).toFixed(1)}%;background:${csrTier.color};"></div></div>
      <div class="tier-pill" style="background:${csrTier.color};color:var(--ink);">${csrTier.emoji} ${csrTier.name}</div>
    </div>
    <div class="card func-card">
      <div class="card-top-strip" style="background:linear-gradient(90deg,var(--rb-sky),var(--rb-lavender));"></div>
      <h3>💬 ${STATE.cssr.label}</h3><p class="sub">Social media team</p>
      <div class="func-row"><span style="color:var(--ink-soft);font-weight:600;font-size:0.85rem;">Headcount</span><input type="number" min="0" class="hc-input" data-fn="cssr" value="${STATE.cssr.headcount}" ${tlMode ? "" : "disabled"} /></div>
      <div class="func-row"><span style="color:var(--ink-soft);font-weight:600;font-size:0.85rem;">% of Team</span><span style="font-weight:700;">${fmtPct(cssrShare)}</span></div>
      <div class="score-big">${fmtPct(cssrRes.score)}</div>
      <div class="progress-track"><div class="progress-fill" style="width:${(cssrRes.score*100).toFixed(1)}%;background:${cssrTier.color};"></div></div>
      <div class="tier-pill" style="background:${cssrTier.color};color:var(--ink);">${cssrTier.emoji} ${cssrTier.name}</div>
    </div>
  `;

  document.getElementById("deptTotal").innerHTML = `
    <div style="font-weight:700;color:var(--ink-soft);font-size:0.9rem;text-transform:uppercase;letter-spacing:.03em;">Total Headcount / Department Score</div>
    <div class="score-big">${fmtPct(deptScore)}</div>
    <div class="tier-pill" style="background:${deptTier.color};color:var(--ink);">${deptTier.emoji} ${deptTier.name}</div>
    <p>${totalHC} agents · CSR ${fmtPct(csrShare)} / CSSR ${fmtPct(cssrShare)}</p>
  `;

  document.getElementById("tierLegend").innerHTML = STATE.tiers.map((t, i) => {
    const nextMin = i === 0 ? "100%" : (t.min === 0 ? "" : `\u2265 ${(t.min*100).toFixed(0)}%`);
    return `<div class="chip"><span class="sw" style="background:${t.color};"></span>${t.emoji} ${t.name} ${nextMin ? "("+nextMin+")" : "(< 85%)"}</div>`;
  }).join("");

  document.querySelectorAll(".hc-input").forEach((input) => input.addEventListener("input", onHeadcountChange));
}

/* ================================================================
   TEAM VIEW — Scorecard (Excel-master style table)
================================================================ */
function renderScorecardTables() {
  const wrap = document.getElementById("scorecardTables");
  const groups = [
    { key: "csr", label: "🎫 CSR — Tickets", stripe: "linear-gradient(90deg,var(--rb-pink),var(--rb-peach))" },
    { key: "cssr", label: "💬 CSSR — Social Media", stripe: "linear-gradient(90deg,var(--rb-sky),var(--rb-lavender))" },
  ];

  wrap.innerHTML = groups.map((g) => {
    const agentsInGroup = STATE.agents.map((a, i) => ({ a, i })).filter((x) => x.a.function === g.key);
    const metrics = STATE[g.key].metrics;
    const groupScores = agentsInGroup.map(({ a }) => computeAgentScore(a));
    const groupAvg = groupScores.length ? groupScores.reduce((s, v) => s + v, 0) / groupScores.length : 0;

    const rowsHtml = agentsInGroup.map(({ a, i }) => {
      const rows = computeAgentMetrics(a);
      const score = computeAgentScore(a);
      const tier = getTier(score);
      const filledStars = Math.max(0, Math.min(5, Math.floor(score * 5)));
      const starsHtml = Array.from({ length: 5 }, (_, k) => k < filledStars ? "★" : "☆").join("");
      const metricCells = rows.map((r) => {
        const colors = statusColors(r.attainment, r.belowCap);
        return `<td><span class="sc-cell" style="background:${colors.bg};color:${colors.ink};">${fmtUnit(r.actual, r.unit)}</span></td>`;
      }).join("");
      return `
        <tr>
          <td>${a.name}</td>
          <td><span class="sc-stars">${starsHtml}</span> <span style="color:var(--ink-soft);font-size:0.72rem;">${filledStars}/5</span></td>
          <td><span class="sc-tier-pill" style="background:${tier.color};color:var(--ink);">${tier.emoji} ${tier.name}</span></td>
          ${metricCells}
          <td><span class="sc-final" style="color:${tier.textColor};">${fmtPct(score)}</span></td>
          <td><button class="sc-onetoone-btn" data-agent-idx="${i}" ${tlMode ? "" : "disabled"}>📝 1:1</button></td>
        </tr>
      `;
    }).join("");

    return `
      <div class="sc-table-wrap">
        <div class="panel-strip" style="background:${g.stripe};"></div>
        <div class="sc-group-title">${g.label} <span class="sc-group-count">${agentsInGroup.length} agents · avg ${fmtPct(groupAvg)}</span></div>
        <table class="sc-table">
          <thead><tr><th>Agent</th><th>Score</th><th>Tier</th>${metrics.map((m) => `<th>${m.short}</th>`).join("")}<th>Final %</th><th>1:1</th></tr></thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </div>
    `;
  }).join("");

  wrap.querySelectorAll(".sc-onetoone-btn").forEach((btn) => {
    btn.addEventListener("click", () => { if (!btn.disabled) openOneOnOne(parseInt(btn.dataset.agentIdx, 10)); });
  });
}

/* ================================================================
   TEAM VIEW — Top Performers
================================================================ */
function renderTopPerformers() {
  const list = STATE.agents.map((agent, idx) => ({ agent, idx, score: computeAgentScore(agent) })).sort((a, b) => b.score - a.score);
  const top3 = list.slice(0, 3);
  const medals = ["🥇", "🥈", "🥉"];
  document.getElementById("tpPodium").innerHTML = top3.map((item, rank) => {
    const tier = getTier(item.score);
    return `
      <div class="tp-card rank-${rank+1}">
        <div class="tp-medal">${medals[rank]}</div>
        <div class="tp-name">${item.agent.name}</div>
        <div class="tp-score">${fmtPct(item.score)}</div>
        <div class="tier-pill" style="background:${tier.color};color:var(--ink);margin-top:8px;">${tier.emoji} ${tier.name}</div>
      </div>
    `;
  }).join("");

  document.getElementById("tpList").innerHTML = list.map((item, rank) => {
    const tier = getTier(item.score);
    return `
      <div class="tp-row">
        <div class="tp-rank">${rank + 1}</div>
        <div class="tp-row-name">${item.agent.name} <span style="color:var(--ink-soft);font-weight:500;font-size:0.78rem;">(${item.agent.function === "csr" ? "CSR" : "CSSR"})</span></div>
        <div class="tp-row-bar"><div class="progress-track"><div class="progress-fill" style="width:${(item.score*100).toFixed(1)}%;background:${tier.color};"></div></div></div>
        <div style="font-weight:800;width:64px;text-align:right;">${fmtPct(item.score)}</div>
        <div class="tier-pill" style="background:${tier.color};color:var(--ink);">${tier.emoji}</div>
      </div>
    `;
  }).join("");
}

/* ================================================================
   TEAM VIEW — Rollout
================================================================ */
function renderRollout() {
  const track = document.getElementById("rolloutTrack");
  const start = new Date(STATE.meta.contractStartDate + "T00:00:00");
  const today = new Date();
  const daysSinceStart = Math.floor((today - start) / (1000 * 60 * 60 * 24));
  const ranges = [{ min: 0, max: 30 }, { min: 30, max: 60 }, { min: 60, max: 90 }];
  let currentPhaseIndex = -1;
  if (daysSinceStart >= 0) {
    ranges.forEach((r, i) => { if (daysSinceStart >= r.min && daysSinceStart < r.max) currentPhaseIndex = i; });
    if (daysSinceStart >= 90) currentPhaseIndex = 2;
  }
  track.innerHTML = STATE.rollout.map((phase, i) => {
    const isCurrent = i === currentPhaseIndex;
    return `
      <div class="phase-card p${i+1} ${isCurrent ? "is-current" : ""}">
        <div class="phase-head">
          <h3>${phase.phase} — ${phase.name}</h3>
          <div style="display:flex;gap:8px;align-items:center;">
            ${isCurrent ? '<span class="current-flag">● CURRENT PHASE</span>' : ""}
            <span class="phase-weight">Active weight: ${(phase.activeWeight*100).toFixed(0)}%</span>
          </div>
        </div>
        <p class="phase-desc">${phase.description}</p>
      </div>
    `;
  }).join("");
  const phaseBadge = document.getElementById("phaseBadge");
  if (daysSinceStart < 0) phaseBadge.textContent = `Starts ${STATE.meta.contractStartDate}`;
  else if (currentPhaseIndex >= 0) phaseBadge.textContent = `Day ${daysSinceStart + 1} · ${STATE.rollout[currentPhaseIndex].name}`;
  else phaseBadge.textContent = "Rollout complete";
}

/* ================================================================
   1:1 COACHING MODAL
================================================================ */
function getOneOnOneHistory(agentIdx) {
  const overrides = loadOverrides();
  return (overrides.oneOnOnes && overrides.oneOnOnes[agentIdx]) || [];
}

function openOneOnOne(agentIdx) {
  modalAgentIdx = agentIdx;
  modalIsDirty = false;
  const agent = STATE.agents[agentIdx];
  const rows = computeAgentMetrics(agent);
  const score = computeAgentScore(agent);
  const tier = getTier(score);

  document.getElementById("modalAgentName").textContent = agent.name;
  document.getElementById("modalAgentMeta").innerHTML = `
    <span>${agent.function === "csr" ? "🎫 CSR" : "💬 CSSR"}</span>
    <span class="tier-chip" style="background:${tier.color};color:var(--ink);">${tier.emoji} ${tier.name}</span>
    <span>📊 ${fmtPct(score)}</span>
    <span>🗓️ ${STATE.meta.scorePeriod}</span>
  `;

  document.getElementById("modalMetricsGrid").innerHTML = rows.map((r) => {
    const colors = statusColors(r.attainment, r.belowCap);
    return `<div class="modal-metric-tile"><div class="mm-label">${r.short}</div><div class="mm-value" style="color:${colors.ink === '#fff' ? '#B23A3A' : colors.ink};">${fmtUnit(r.actual, r.unit)}</div></div>`;
  }).join("");

  document.getElementById("modalSessionDate").value = todayISO();
  document.getElementById("modalStrengths").value = "";
  document.getElementById("modalOpportunities").value = "";
  document.getElementById("modalTlNotes").value = "";
  document.getElementById("modalAgentComments").value = "";
  document.getElementById("modalNextDate").value = "";
  modalActionItems = [];
  renderActionItems();
  renderHistoryList(agentIdx);

  document.getElementById("oneOnOneOverlay").classList.add("show");

  ["modalStrengths", "modalOpportunities", "modalTlNotes", "modalAgentComments", "modalSessionDate", "modalNextDate"].forEach((id) => {
    document.getElementById(id).addEventListener("input", () => { modalIsDirty = true; });
  });
}

function renderActionItems() {
  const list = document.getElementById("actionItemsList");
  list.innerHTML = modalActionItems.map((item, idx) => `
    <div class="action-item-row ${item.done ? "done" : ""}">
      <input type="checkbox" data-idx="${idx}" class="ai-check" ${item.done ? "checked" : ""} />
      <input type="text" data-idx="${idx}" class="ai-text" value="${item.text.replace(/"/g, '&quot;')}" placeholder="E.g., Review 3 QA calls" />
      <button class="action-remove-btn" data-idx="${idx}">✕</button>
    </div>
  `).join("");

  list.querySelectorAll(".ai-check").forEach((cb) => cb.addEventListener("change", (e) => {
    modalActionItems[parseInt(e.target.dataset.idx, 10)].done = e.target.checked;
    modalIsDirty = true;
    renderActionItems();
  }));
  list.querySelectorAll(".ai-text").forEach((inp) => inp.addEventListener("input", (e) => {
    modalActionItems[parseInt(e.target.dataset.idx, 10)].text = e.target.value;
    modalIsDirty = true;
  }));
  list.querySelectorAll(".action-remove-btn").forEach((btn) => btn.addEventListener("click", (e) => {
    modalActionItems.splice(parseInt(e.target.dataset.idx, 10), 1);
    modalIsDirty = true;
    renderActionItems();
  }));
}

function renderHistoryList(agentIdx) {
  const history = getOneOnOneHistory(agentIdx);
  const el = document.getElementById("historyList");
  if (history.length === 0) { el.innerHTML = `<div class="history-empty">No previous 1:1s saved yet.</div>`; return; }
  el.innerHTML = history.slice().reverse().map((h) => {
    const doneCount = (h.actionItems || []).filter((a) => a.done).length;
    const totalCount = (h.actionItems || []).length;
    return `
      <div class="history-item">
        <div class="history-item-date">📅 ${h.date}${h.nextDate ? ` → next: ${h.nextDate}` : ""}</div>
        <div class="history-item-summary">${totalCount > 0 ? `${doneCount}/${totalCount} action items completed` : "No action items"}${h.strengths ? " · has strengths notes" : ""}${h.opportunities ? " · has opportunity notes" : ""}</div>
      </div>
    `;
  }).join("");
}

function buildSessionObject() {
  return {
    date: document.getElementById("modalSessionDate").value || todayISO(),
    strengths: document.getElementById("modalStrengths").value,
    opportunities: document.getElementById("modalOpportunities").value,
    actionItems: JSON.parse(JSON.stringify(modalActionItems)),
    tlNotes: document.getElementById("modalTlNotes").value,
    agentComments: document.getElementById("modalAgentComments").value,
    nextDate: document.getElementById("modalNextDate").value,
    savedAt: new Date().toISOString(),
  };
}

/* ---------------- Printable / PDF-ready 1:1 view ---------------- */
function buildPrintableOneOnOneHtml(session, agent, rows, score, tier) {
  const fnLabel = agent.function === "csr" ? "CSR" : "CSSR";
  const now = new Date();
  const generatedAt = now.toLocaleDateString(undefined, { year: "numeric", month: "2-digit", day: "2-digit" }) +
    ", " + now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

  const metricsRows = rows.map((r) => `
    <tr>
      <td class="pr-metric-name">${r.short}</td>
      <td>${fmtUnit(r.actual, r.unit)}</td>
      <td class="pr-goal">${fmtGoalPlain(r)}</td>
    </tr>
  `).join("");

  function section(label, content) {
    if (!content || String(content).trim() === "") return "";
    return `
      <div class="pr-section">
        <div class="pr-section-title">${label}</div>
        <div class="pr-section-box">${escapeHtml(content)}</div>
      </div>
    `;
  }

  let actionItemsHtml = "";
  if (session.actionItems && session.actionItems.length > 0) {
    actionItemsHtml = `
      <div class="pr-section">
        <div class="pr-section-title">✅ ACTION ITEMS</div>
        <div class="pr-section-box" style="padding:6px 18px;white-space:normal;">
          <ul class="pr-action-list">${session.actionItems.map((a) => `<li>${a.done ? "☑" : "☐"} ${escapeHtml(a.text || "")}</li>`).join("")}</ul>
        </div>
      </div>
    `;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>1:1 Session — ${agent.name}</title>
<style>
  @page { margin: 24px; }
  * { box-sizing: border-box; }
  body {
    font-family: 'Segoe UI', Arial, sans-serif; color: #2E2B3B; margin: 0; padding: 32px;
    background: #FAF9FC;
  }
  .pr-print-btn {
    background: linear-gradient(90deg, #5B6FE8, #5FA9E8); color: #fff; border: none;
    padding: 12px 22px; border-radius: 10px; font-weight: 700; font-size: 0.95rem;
    cursor: pointer; margin-bottom: 24px; display: inline-flex; align-items: center; gap: 8px;
  }
  .pr-title {
    color: #5B6FE8; font-size: 1.5rem; font-weight: 800; margin: 4px 0 6px;
    display: flex; align-items: center; gap: 10px;
  }
  .pr-agent-name { font-size: 1.15rem; font-weight: 700; margin: 0 0 14px; color: #2E2B3B; }
  .pr-meta-box {
    background: #F3F1FB; border-radius: 10px; padding: 12px 18px; margin-bottom: 26px;
    display: flex; flex-wrap: wrap; gap: 18px; font-size: 0.86rem; color: #4A4560; font-weight: 600;
  }
  .pr-meta-box span { display: flex; align-items: center; gap: 5px; }
  .pr-tier-chip { padding: 2px 10px; border-radius: 999px; font-weight: 700; }
  .pr-section { margin-bottom: 24px; }
  .pr-section-title {
    color: #5B6FE8; font-weight: 800; font-size: 0.95rem; margin-bottom: 8px;
    padding-bottom: 6px; border-bottom: 1px solid #E4E0F2;
  }
  .pr-section-box {
    background: #fff; border: 1px solid #ECE8F4; border-radius: 10px; padding: 14px 18px;
    font-size: 0.9rem; line-height: 1.55; white-space: pre-wrap;
  }
  table.pr-metrics-table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 10px; overflow: hidden; }
  table.pr-metrics-table th {
    background: #F3F1FB; color: #4A4560; text-align: left; font-size: 0.78rem;
    text-transform: uppercase; letter-spacing: .02em; padding: 10px 16px; font-weight: 700;
  }
  table.pr-metrics-table td { padding: 10px 16px; font-size: 0.9rem; border-top: 1px solid #ECE8F4; }
  .pr-metric-name { font-weight: 700; }
  .pr-goal { color: #6B6780; }
  .pr-action-list { margin: 8px 0; padding-left: 4px; list-style: none; font-size: 0.9rem; line-height: 1.8; }
  .pr-footer { text-align: center; color: #9A94AE; font-size: 0.78rem; margin-top: 34px; padding-top: 16px; border-top: 1px solid #ECE8F4; }
  @media print {
    body { background: #fff; padding: 0 24px; }
    .pr-print-btn { display: none; }
  }
</style>
</head>
<body>
  <button class="pr-print-btn" onclick="window.print()">🖨️ Imprimir / Guardar como PDF</button>

  <div style="display:flex;align-items:center;gap:14px;margin-bottom:4px;">
    <img src="${KITSCH_LOGO_DATA_URI}" alt="Kitsch" style="width:40px;height:40px;border-radius:11px;object-fit:cover;flex-shrink:0;" />
    <div class="pr-title" style="margin:0;">📝 Sesión 1:1</div>
  </div>
  <div class="pr-agent-name">${agent.name}</div>

  <div class="pr-meta-box">
    <span>📅 Fecha: ${session.date}</span>
    <span>👥 ${fnLabel}</span>
    <span class="pr-tier-chip" style="background:${tier.color};">${tier.emoji} ${tier.name}</span>
    <span>📊 ${fmtPct(score)}</span>
    <span>🗓️ ${STATE.meta.scorePeriod}</span>
  </div>

  <div class="pr-section">
    <div class="pr-section-title">📊 MÉTRICAS DEL MES</div>
    <table class="pr-metrics-table">
      <thead><tr><th>Métrica</th><th>Valor</th><th>Meta</th></tr></thead>
      <tbody>${metricsRows}</tbody>
    </table>
  </div>

  ${section("🎯 FORTALEZAS", session.strengths)}
  ${section("⚠️ ÁREAS DE OPORTUNIDAD", session.opportunities)}
  ${actionItemsHtml}
  ${section("📝 NOTAS DEL TL", session.tlNotes)}
  ${section("💬 COMENTARIOS DEL AGENTE", session.agentComments)}
  ${session.nextDate ? section("📅 PRÓXIMO 1:1", session.nextDate) : ""}

  <div class="pr-footer">Generado desde Kitsch CX Scorecard · ${generatedAt}</div>
</body>
</html>`;
}

function openPrintableOneOnOne() {
  if (modalAgentIdx == null) return;
  const agent = STATE.agents[modalAgentIdx];
  const rows = computeAgentMetrics(agent);
  const score = computeAgentScore(agent);
  const tier = getTier(score);
  const session = buildSessionObject();
  const html = buildPrintableOneOnOneHtml(session, agent, rows, score, tier);

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow pop-ups to open the printable 1:1 view.");
    return;
  }
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
}

function sessionToPlainText(session, agentName) {
  const lines = [];
  lines.push(`1:1 Session — ${agentName}`);
  lines.push(`Date: ${session.date}`);
  if (session.nextDate) lines.push(`Next 1:1: ${session.nextDate}`);
  lines.push("");
  lines.push("STRENGTHS:");
  lines.push(session.strengths || "(none noted)");
  lines.push("");
  lines.push("AREAS OF OPPORTUNITY:");
  lines.push(session.opportunities || "(none noted)");
  lines.push("");
  lines.push("ACTION ITEMS:");
  if (session.actionItems.length === 0) lines.push("(none)");
  else session.actionItems.forEach((a) => lines.push(`  [${a.done ? "x" : " "}] ${a.text}`));
  lines.push("");
  lines.push("TL NOTES:");
  lines.push(session.tlNotes || "(none)");
  lines.push("");
  lines.push("AGENT COMMENTS:");
  lines.push(session.agentComments || "(none)");
  return lines.join("\n");
}

function initModalControls() {
  document.getElementById("addActionBtn").addEventListener("click", () => {
    modalActionItems.push({ text: "", done: false });
    modalIsDirty = true;
    renderActionItems();
  });

  document.getElementById("modalCloseBtn").addEventListener("click", () => {
    if (modalIsDirty && !confirm("You have unsaved changes in this 1:1. Close without saving?")) return;
    document.getElementById("oneOnOneOverlay").classList.remove("show");
  });

  document.getElementById("modalSaveBtn").addEventListener("click", () => {
    if (modalAgentIdx == null) return;
    const session = buildSessionObject();
    const overrides = loadOverrides();
    if (!overrides.oneOnOnes) overrides.oneOnOnes = {};
    if (!overrides.oneOnOnes[modalAgentIdx]) overrides.oneOnOnes[modalAgentIdx] = [];
    overrides.oneOnOnes[modalAgentIdx].push(session);
    saveOverrides(overrides);
    modalIsDirty = false;
    renderHistoryList(modalAgentIdx);
    const saveBtn = document.getElementById("modalSaveBtn");
    const original = saveBtn.textContent;
    saveBtn.textContent = "✅ Saved!";
    setTimeout(() => { saveBtn.textContent = original; }, 1400);
  });

  document.getElementById("modalCopyBtn").addEventListener("click", async () => {
    const agent = STATE.agents[modalAgentIdx];
    const text = sessionToPlainText(buildSessionObject(), agent.name);
    try { await navigator.clipboard.writeText(text); }
    catch (e) {
      const ta = document.createElement("textarea");
      ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); } catch (e2) { /* no-op */ }
      document.body.removeChild(ta);
    }
    const btn = document.getElementById("modalCopyBtn");
    const original = btn.textContent;
    btn.textContent = "✅ Copied!";
    setTimeout(() => { btn.textContent = original; }, 1400);
  });

  document.getElementById("modalPrintBtn").addEventListener("click", () => { openPrintableOneOnOne(); });
}

/* ---------------- Event handlers (team edits) ---------------- */
function onActualChange(e) {
  if (!tlMode) return;
  const fnKey = e.target.dataset.fn;
  const idx = parseInt(e.target.dataset.idx, 10);
  const value = parseFloat(e.target.value);
  if (isNaN(value)) return;
  const overrides = loadOverrides();
  if (!overrides[fnKey]) overrides[fnKey] = {};
  overrides[fnKey][idx] = value;
  saveOverrides(overrides);
  buildState();
  renderAll(false);
}

function onHeadcountChange(e) {
  if (!tlMode) return;
  const fnKey = e.target.dataset.fn;
  const value = parseFloat(e.target.value);
  if (isNaN(value)) return;
  const overrides = loadOverrides();
  if (!overrides.headcount) overrides.headcount = {};
  overrides.headcount[fnKey] = value;
  saveOverrides(overrides);
  buildState();
  renderAll(false);
}

/* ---------------- Mode toggle & subnav ---------------- */
function initModeToggle() {
  document.querySelectorAll(".mode-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".mode-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      appMode = btn.dataset.mode;
      document.getElementById("mode-agent").style.display = appMode === "agent" ? "block" : "none";
      document.getElementById("mode-culture").style.display = appMode === "culture" ? "block" : "none";
      document.getElementById("mode-team").style.display = appMode === "team" ? "block" : "none";
    });
  });
}

/* ================================================================
   OUR CULTURE
================================================================ */
function renderCulture() {
  const c = STATE.culture;
  if (!c) return;

  document.getElementById("cultureTagline").textContent = c.tagline || "";
  document.getElementById("cultureStory").innerHTML = (c.story || []).map((p) => `<p>${p}</p>`).join("") + `
    <div class="founder-card">
      <div class="founder-avatar">👩‍💼</div>
      <div>
        <p class="founder-name">${c.founder}</p>
        <p class="founder-title">Founder &amp; CEO · Founded ${c.founded}</p>
        ${(c.founderBio || []).map((p) => `<p>${p}</p>`).join("")}
      </div>
    </div>
  `;

  document.getElementById("cultureMission").textContent = c.mission || "";
  document.getElementById("cultureVision").textContent = c.vision || "";

  document.getElementById("cultureValues").innerHTML = (c.values || []).map((v) => `
    <div class="value-card">
      <div class="value-icon">${v.icon}</div>
      <div class="value-name">${v.name}</div>
      <div class="value-desc">${v.description}</div>
    </div>
  `).join("");

  const km = c.kitschMomentsInCX || {};
  document.getElementById("cultureKmIntro").innerHTML = km.intro || "";
  document.getElementById("cultureKmGrid").innerHTML = (km.behaviors || []).map((b) => `
    <div class="km-card">
      <div class="km-icon">${b.icon}</div>
      <div class="km-title">${b.title}</div>
      <div class="km-desc">${b.description}</div>
    </div>
  `).join("");

  const gb = c.givingBack || {};
  document.getElementById("cultureGbIntro").textContent = gb.intro || "";
  document.getElementById("cultureGbGrid").innerHTML = (gb.items || []).map((it) => `
    <div class="gb-card">
      <div class="gb-icon">${it.icon}</div>
      <div><div class="gb-title">${it.title}</div><div class="gb-desc">${it.description}</div></div>
    </div>
  `).join("");

  const lead = c.leadershipPhilosophy || {};
  document.getElementById("leadershipTitle").textContent = lead.title || "How We Lead";
  document.getElementById("leadershipIntro").textContent = lead.intro || "";
  document.getElementById("leadershipPillars").innerHTML = (lead.pillars || []).map((p) => `
    <div class="fi-pillar">
      <div class="fi-pillar-head">
        <span class="fi-pillar-icon">${p.icon}</span>
        <p class="fi-pillar-name">${p.name}</p>
      </div>
      <p class="fi-pillar-desc">${p.description}</p>
      <ul class="fi-practices">${(p.practices || []).map((pr) => `<li>${pr}</li>`).join("")}</ul>
    </div>
  `).join("");
}

function initTeamSubnav() {
  document.querySelectorAll(".subnav-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".subnav-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      teamSubview = btn.dataset.view;
      document.querySelectorAll("#mode-team .view").forEach((v) => v.classList.remove("active"));
      document.getElementById("view-" + teamSubview).classList.add("active");
    });
  });
}

/* ---------------- Master render ---------------- */
function renderAll(reflowMeta = true) {
  if (reflowMeta) document.getElementById("versionBadge").textContent = STATE.meta.version;
  renderAgentView();
  renderCulture();
  renderOverview();
  renderMetrics("csrMetrics", "csr");
  renderFunctionTotal("csrTotal", "csr");
  renderMetrics("cssrMetrics", "cssr");
  renderFunctionTotal("cssrTotal", "cssr");
  renderScorecardTables();
  renderTopPerformers();
  renderRollout();
  applyTlModeToDOM();
}

/* ---------------- Reset ---------------- */
function initReset() {
  document.getElementById("resetBtn").addEventListener("click", () => {
    if (!confirm("This will clear all edits, 1:1 history, and TL mode state saved on this device. Continue?")) return;
    localStorage.removeItem(STORAGE_KEY);
    selectedAgentIdx = 0;
    tlMode = false;
    buildState();
    renderAgentPicker();
    renderAll();
  });
}

/* ---------------- Boot ---------------- */
function showBootError(message) {
  const wrap = document.querySelector(".page-wrap");
  if (!wrap) return;
  const banner = document.createElement("div");
  banner.style.cssText = "background:#FFF0F0;border:2px solid #FFB3B3;border-radius:14px;padding:18px 22px;margin-bottom:16px;color:#B23A3A;font-weight:700;font-size:0.9rem;line-height:1.6;";
  banner.innerHTML = `⚠️ Couldn't load the scorecard data.<br><span style="font-weight:500;font-size:0.85rem;">${message}</span><br><span style="font-weight:500;font-size:0.85rem;">Check that <code>data.json</code> exists in the same folder as <code>index.html</code>, that its name is exactly lowercase, and try a hard refresh (Ctrl/Cmd+Shift+R).</span>`;
  wrap.prepend(banner);
}

async function init() {
  try {
    const res = await fetch("data.json?v=" + Date.now());
    if (!res.ok) throw new Error(`data.json request failed with status ${res.status}`);
    DATA = await res.json();
  } catch (err) {
    console.error("Failed to load data.json:", err);
    showBootError(err.message || String(err));
    return;
  }

  const overrides = loadOverrides();
  if (overrides.ui) {
    tlMode = !!overrides.ui.tlMode;
    if (overrides.ui.selectedAgentIdx != null) selectedAgentIdx = overrides.ui.selectedAgentIdx;
  }

  buildState();
  initModeToggle();
  initTeamSubnav();
  initMetricsFuncToggle();
  initTlToggle();
  initReset();
  initModalControls();
  renderAgentPicker();
  renderAll();
}

init();
