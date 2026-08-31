/* =========================================================
   Kitsch · Customer Experience Scorecard
   Base app logic — reads data.json, allows editing "Actual"
   values and headcounts, recalculates attainment/tiers live,
   and persists edits in localStorage.
========================================================= */

const STORAGE_KEY = "kitschScorecardOverrides_v1";
let DATA = null;       // raw data.json content
let STATE = null;      // working copy (data.json + overrides applied)

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
  let weightSum = 0;
  const rows = fn.metrics.map((m) => {
    const { attainment, belowCap } = computeAttainment(m);
    weighted += attainment * m.weight;
    weightSum += m.weight;
    return { ...m, attainment, belowCap };
  });
  const score = weightSum > 0 ? weighted / weightSum * weightSum : 0; // weights already sum ~1
  return { rows, score: weighted };
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
    return raw ? JSON.parse(raw) : { csr: {}, cssr: {}, headcount: {} };
  } catch (e) {
    return { csr: {}, cssr: {}, headcount: {} };
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

  STATE = clone;
}

/* ---------------- Rendering: Metric cards ---------------- */
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
  renderAll();
}

init();
