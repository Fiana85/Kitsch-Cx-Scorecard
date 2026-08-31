/* =========================================================
   Kitsch · Customer Experience Scorecard
   App logic — reads data.json, allows editing "Actual"
   values (function-level and per-agent) and headcounts,
   recalculates attainment/tiers live, and persists edits
   in localStorage.
========================================================= */

const STORAGE_KEY = "kitschScorecardOverrides_v2";
let DATA = null;       // raw data.json content
let STATE = null;      // working copy (data.json + overrides applied)

let agentFilter = "all";
let agentSearchTerm = "";
let agentSort = "score-desc";
const openAgentDetails = new Set(); // agent indices currently expanded

/* ---------------- Utility formatting ---------------- */
function fmtUnit(value, unit) {
  if (unit === "%") return (value * 100).toFixed(1) + "%";
  if (unit === "sec") return Math.round(value) + "s";
  if (unit === "min") return Math.round(value) + "m";
  return Math.round(value) + " " + unit;
}
function fmtPct(value) {
  return (value * 100).toFixed(1) + "%";
}

/* ---------------- Core scoring logic ----------------
   higher-is-better: attainment = min(actual / goal, 1)
   lower-is-better : attainment = min(goal / actual, 1)
   "cap/minimum" is the disqualifying threshold used only
   to flag critical status, it does not change the score.
------------------------------------------------------- */
function computeAttainment(metric) {
  const { actual, goal, cap, direction } = metric;
  let raw;
  if (direction === "higher") {
    raw = goal > 0 ? actual / goal : 0;
  } else {
    raw = actual > 0 ? goal / actual : 0;
  }
  const attainment = Math.max(0, Math.min(raw, 1));

  let belowCap;
  if (direction === "higher") {
    belowCap = actual < cap;
  } else {
    belowCap = actual > cap;
  }
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

/* ---- Agent-level scoring: reuses the parent function's
   weight/goal/cap/direction config, only "actual" changes
   per agent. This keeps agents always in sync if goals are
   edited in data.json. ---- */
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

function getTier(score) {
  const tiers = STATE.tiers;
  for (const t of tiers) {
    if (score >= t.min) return t;
  }
  return tiers[tiers.length - 1];
}

function statusColors(attainment, belowCap) {
  if (belowCap) return { bg: "var(--critical)", ink: "#fff", label: "Below Minimum" };
  if (attainment >= 0.95) return { bg: "var(--good)", ink: "var(--good-ink)", label: "On Track" };
  if (attainment >= 0.85) return { bg: "var(--ok)", ink: "var(--ok-ink)", label: "Watch" };
  return { bg: "var(--bad)", ink: "var(--bad-ink)", label: "At Risk" };
}

/* ---------------- Persistence ---------------- */
function loadOverrides() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { csr: {}, cssr: {}, headcount: {}, agents: {} };
  } catch (e) {
    return { csr: {}, cssr: {}, headcount: {}, agents: {} };
  }
}
function saveOverrides(overrides) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
}

function buildState() {
  const overrides = loadOverrides();
  const clone = JSON.parse(JSON.stringify(DATA));

  ["csr", "cssr"].forEach((key) => {
    if (overrides.headcount && overrides.headcount[key] != null) {
      clone[key].headcount = overrides.headcount[key];
    }
    clone[key].metrics.forEach((m, idx) => {
      const o = overrides[key] && overrides[key][idx];
      if (o != null) m.actual = o;
    });
  });

  if (overrides.agents && clone.agents) {
    clone.agents.forEach((agent, idx) => {
      const agentOverride = overrides.agents[idx];
      if (agentOverride) {
        Object.keys(agentOverride).forEach((metricName) => {
          agent.actuals[metricName] = agentOverride[metricName];
        });
      }
    });
  }

  STATE = clone;
}

/* ---------------- Rendering: Metric cards (function-level) ---------------- */
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
      <div>
        <div class="metric-name">${m.name}</div>
        <div class="metric-note">${m.note || ""}</div>
      </div>
      <div>
        <div class="metric-sub">Weight</div>
        <div class="metric-val">${(m.weight * 100).toFixed(0)}%</div>
      </div>
      <div>
        <div class="metric-sub">Goal / Min</div>
        <div class="metric-val">${fmtUnit(m.goal, m.unit)} <span style="color:var(--ink-soft);font-weight:500;">/ ${fmtUnit(m.cap, m.unit)}</span></div>
      </div>
      <div>
        <div class="metric-sub">Actual</div>
        <input type="number" step="any" class="actual-input" data-fn="${fnKey}" data-idx="${idx}" value="${m.actual}" />
      </div>
      <div class="attain-block">
        <div class="attain-top">
          <span>${fmtPct(attainment)}</span>
          <span class="status-tag" style="background:${colors.bg};color:${colors.ink};">${colors.label}</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" style="width:${(attainment*100).toFixed(1)}%;background:${colors.bg};"></div>
        </div>
      </div>
    `;
    container.appendChild(card);
  });

  container.querySelectorAll(".actual-input").forEach((input) => {
    input.addEventListener("input", onActualChange);
  });
}

function renderFunctionTotal(containerId, fnKey) {
  const fn = STATE[fnKey];
  const { score } = computeFunctionScore(fn);
  const tier = getTier(score);
  const el = document.getElementById(containerId);
  el.innerHTML = `
    <div>
      <div style="font-weight:700;color:var(--ink-soft);font-size:0.85rem;text-transform:uppercase;letter-spacing:.03em;">Total / Weighted Score</div>
      <div class="score-big">${fmtPct(score)}</div>
    </div>
    <div class="tier-pill" style="background:${tier.color};color:var(--ink);">
      ${tier.emoji} ${tier.name}
    </div>
  `;
  return score;
}

/* ---------------- Rendering: Overview / Department Summary ---------------- */
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

  const cards = document.getElementById("overviewCards");
  cards.innerHTML = `
    <div class="card func-card">
      <div class="card-top-strip" style="background:linear-gradient(90deg,var(--rb-pink),var(--rb-peach));"></div>
      <h3>🎫 ${STATE.csr.label}</h3>
      <p class="sub">Ticket handling team</p>
      <div class="func-row">
        <span style="color:var(--ink-soft);font-weight:600;font-size:0.85rem;">Headcount</span>
        <input type="number" min="0" class="hc-input" data-fn="csr" value="${STATE.csr.headcount}" />
      </div>
      <div class="func-row">
        <span style="color:var(--ink-soft);font-weight:600;font-size:0.85rem;">% of Team</span>
        <span style="font-weight:700;">${fmtPct(csrShare)}</span>
      </div>
      <div class="score-big">${fmtPct(csrRes.score)}</div>
      <div class="progress-track"><div class="progress-fill" style="width:${(csrRes.score*100).toFixed(1)}%;background:${csrTier.color};"></div></div>
      <div class="tier-pill" style="background:${csrTier.color};color:var(--ink);">${csrTier.emoji} ${csrTier.name}</div>
    </div>
    <div class="card func-card">
      <div class="card-top-strip" style="background:linear-gradient(90deg,var(--rb-sky),var(--rb-lavender));"></div>
      <h3>💬 ${STATE.cssr.label}</h3>
      <p class="sub">Social media team</p>
      <div class="func-row">
        <span style="color:var(--ink-soft);font-weight:600;font-size:0.85rem;">Headcount</span>
        <input type="number" min="0" class="hc-input" data-fn="cssr" value="${STATE.cssr.headcount}" />
      </div>
      <div class="func-row">
        <span style="color:var(--ink-soft);font-weight:600;font-size:0.85rem;">% of Team</span>
        <span style="font-weight:700;">${fmtPct(cssrShare)}</span>
      </div>
      <div class="score-big">${fmtPct(cssrRes.score)}</div>
      <div class="progress-track"><div class="progress-fill" style="width:${(cssrRes.score*100).toFixed(1)}%;background:${cssrTier.color};"></div></div>
      <div class="tier-pill" style="background:${cssrTier.color};color:var(--ink);">${cssrTier.emoji} ${cssrTier.name}</div>
    </div>
  `;

  const deptTotal = document.getElementById("deptTotal");
  deptTotal.innerHTML = `
    <div style="font-weight:700;color:var(--ink-soft);font-size:0.9rem;text-transform:uppercase;letter-spacing:.03em;">Total Headcount / Department Score</div>
    <div class="score-big">${fmtPct(deptScore)}</div>
    <div class="tier-pill" style="background:${deptTier.color};color:var(--ink);">${deptTier.emoji} ${deptTier.name}</div>
    <p>${totalHC} agents · CSR ${fmtPct(csrShare)} / CSSR ${fmtPct(cssrShare)}</p>
  `;

  const legend = document.getElementById("tierLegend");
  legend.innerHTML = STATE.tiers.map((t, i) => {
    const nextMin = i === 0 ? "100%" : (t.min === 0 ? "" : `\u2265 ${(t.min*100).toFixed(0)}%`);
    return `<div class="chip"><span class="sw" style="background:${t.color};"></span>${t.emoji} ${t.name} ${nextMin ? "("+nextMin+")" : "(< 85%)"}</div>`;
  }).join("");

  cards.querySelectorAll(".hc-input").forEach((input) => {
    input.addEventListener("input", onHeadcountChange);
  });

  return deptScore;
}

/* ---------------- Rendering: Agents view ---------------- */
function getFilteredSortedAgents() {
  if (!STATE.agents) return [];

  let list = STATE.agents.map((agent, idx) => {
    const score = computeAgentScore(agent);
    return { agent, idx, score };
  });

  if (agentFilter !== "all") {
    list = list.filter((a) => a.agent.function === agentFilter);
  }
  if (agentSearchTerm.trim() !== "") {
    const term = agentSearchTerm.trim().toLowerCase();
    list = list.filter((a) => a.agent.name.toLowerCase().includes(term));
  }

  if (agentSort === "score-desc") {
    list.sort((a, b) => b.score - a.score);
  } else if (agentSort === "score-asc") {
    list.sort((a, b) => a.score - b.score);
  } else if (agentSort === "name-asc") {
    list.sort((a, b) => a.agent.name.localeCompare(b.agent.name));
  }

  return list;
}

function renderAgents() {
  const grid = document.getElementById("agentsGrid");
  const countLabel = document.getElementById("agentCountLabel");
  const list = getFilteredSortedAgents();

  countLabel.textContent = `(${list.length} of ${STATE.agents ? STATE.agents.length : 0})`;

  if (list.length === 0) {
    grid.innerHTML = `<div class="no-agents-msg" style="grid-column:1/-1;">No agents match your search/filter. 🌈</div>`;
    return;
  }

  grid.innerHTML = "";

  list.forEach(({ agent, idx, score }) => {
    const tier = getTier(score);
    const isOpen = openAgentDetails.has(idx);
    const rows = computeAgentMetrics(agent);

    const card = document.createElement("div");
    card.className = "agent-card";
    card.innerHTML = `
      <div class="agent-card-head">
        <p class="agent-name">${agent.name}</p>
        <span class="agent-fn-badge ${agent.function}">${agent.function === "csr" ? "🎫 CSR" : "💬 CSSR"}</span>
      </div>
      <div class="agent-score-row">
        <div class="agent-score">${fmtPct(score)}</div>
        <div class="tier-pill" style="background:${tier.color};color:var(--ink);">${tier.emoji} ${tier.name}</div>
      </div>
      <div class="progress-track"><div class="progress-fill" style="width:${(score*100).toFixed(1)}%;background:${tier.color};"></div></div>
      <button class="agent-toggle" data-idx="${idx}">${isOpen ? "▲ Hide metric breakdown" : "▼ View metric breakdown"}</button>
      <div class="agent-detail ${isOpen ? "open" : ""}" data-detail-idx="${idx}">
        ${rows.map((r) => {
          const colors = statusColors(r.attainment, r.belowCap);
          return `
            <div class="agent-metric-row">
              <div class="agent-metric-top">
                <span class="agent-metric-name">${r.name}</span>
                <input type="number" step="any" class="agent-metric-input" data-idx="${idx}" data-metric="${r.name}" value="${r.actual}" />
              </div>
              <div class="agent-metric-track">
                <div class="agent-metric-fill" style="width:${(r.attainment*100).toFixed(1)}%;background:${colors.bg};"></div>
              </div>
              <div style="display:flex;justify-content:space-between;font-size:0.72rem;color:var(--ink-soft);">
                <span>Goal ${fmtUnit(r.goal, r.unit)} / Min ${fmtUnit(r.cap, r.unit)}</span>
                <span style="font-weight:700;">${fmtPct(r.attainment)}</span>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `;
    grid.appendChild(card);
  });

  grid.querySelectorAll(".agent-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.idx, 10);
      if (openAgentDetails.has(idx)) {
        openAgentDetails.delete(idx);
      } else {
        openAgentDetails.add(idx);
      }
      renderAgents();
    });
  });

  grid.querySelectorAll(".agent-metric-input").forEach((input) => {
    input.addEventListener("input", onAgentMetricChange);
  });
}

function initAgentControls() {
  document.querySelectorAll(".filter-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".filter-chip").forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      agentFilter = chip.dataset.filter;
      renderAgents();
    });
  });

  document.getElementById("agentSearch").addEventListener("input", (e) => {
    agentSearchTerm = e.target.value;
    renderAgents();
  });

  document.getElementById("agentSort").addEventListener("change", (e) => {
    agentSort = e.target.value;
    renderAgents();
  });
}

/* ---------------- Rendering: Rollout ---------------- */
function renderRollout() {
  const track = document.getElementById("rolloutTrack");
  const start = new Date(STATE.meta.contractStartDate + "T00:00:00");
  const today = new Date();
  const daysSinceStart = Math.floor((today - start) / (1000 * 60 * 60 * 24));

  const ranges = [
    { min: 0, max: 30 },
    { min: 30, max: 60 },
    { min: 60, max: 90 },
  ];

  let currentPhaseIndex = -1;
  if (daysSinceStart >= 0) {
    ranges.forEach((r, i) => {
      if (daysSinceStart >= r.min && daysSinceStart < r.max) currentPhaseIndex = i;
    });
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
  if (daysSinceStart < 0) {
    phaseBadge.textContent = `Starts ${STATE.meta.contractStartDate}`;
  } else if (currentPhaseIndex >= 0) {
    phaseBadge.textContent = `Day ${daysSinceStart + 1} · ${STATE.rollout[currentPhaseIndex].name}`;
  } else {
    phaseBadge.textContent = "Rollout complete";
  }
}

/* ---------------- Event handlers ---------------- */
function onActualChange(e) {
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

function onAgentMetricChange(e) {
  const idx = parseInt(e.target.dataset.idx, 10);
  const metricName = e.target.dataset.metric;
  const value = parseFloat(e.target.value);
  if (isNaN(value)) return;

  const overrides = loadOverrides();
  if (!overrides.agents) overrides.agents = {};
  if (!overrides.agents[idx]) overrides.agents[idx] = {};
  overrides.agents[idx][metricName] = value;
  saveOverrides(overrides);

  buildState();
  // Keep the detail panel open for the agent being edited, just re-render agents view.
  renderAgents();
}

/* ---------------- Master render ---------------- */
function renderAll(reflowMeta = true) {
  if (reflowMeta) {
    document.getElementById("subtitleText").textContent = STATE.meta.subtitle || STATE.meta.department;
    document.getElementById("versionBadge").textContent = STATE.meta.version;
    document.getElementById("updatedBadge").textContent = "Updated " + STATE.meta.lastUpdated;
    document.getElementById("csrLabel").textContent = "CSR Scorecard";
    document.getElementById("cssrLabel").textContent = "CSSR Scorecard";
  }
  renderOverview();
  renderMetrics("csrMetrics", "csr");
  renderFunctionTotal("csrTotal", "csr");
  renderMetrics("cssrMetrics", "cssr");
  renderFunctionTotal("cssrTotal", "cssr");
  renderAgents();
  renderRollout();
}

/* ---------------- Tabs ---------------- */
function initTabs() {
  const buttons = document.querySelectorAll(".tab-btn");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
      document.getElementById("view-" + btn.dataset.view).classList.add("active");
    });
  });
}

/* ---------------- Reset ---------------- */
function initReset() {
  document.getElementById("resetBtn").addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    openAgentDetails.clear();
    agentFilter = "all";
    agentSearchTerm = "";
    agentSort = "score-desc";
    document.getElementById("agentSearch").value = "";
    document.getElementById("agentSort").value = "score-desc";
    document.querySelectorAll(".filter-chip").forEach((c) => c.classList.remove("active"));
    document.querySelector('.filter-chip[data-filter="all"]').classList.add("active");
    buildState();
    renderAll();
  });
}

/* ---------------- Boot ---------------- */
async function init() {
  const res = await fetch("data.json");
  DATA = await res.json();
  buildState();
  initTabs();
  initReset();
  initAgentControls();
  renderAll();
}

init();
