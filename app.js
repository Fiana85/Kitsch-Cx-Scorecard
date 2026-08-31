/* =========================================================
   Kitsch · Customer Experience Scorecard
   App logic — data.json driven, Agent View + Team View
   (Team Health / Metrics / Scorecard / Top Performers /
   Rollout), TL Mode gating, 1:1 coaching modal with history,
   personalized tips engine, and localStorage persistence.
========================================================= */

const STORAGE_KEY = "kitschScorecardOverrides_v4";
let DATA = null;
let STATE = null;

let appMode = "agent";          // "agent" | "team"
let selectedAgentIdx = 0;
let tlMode = false;
let teamSubview = "health";     // health | metrics | scorecard | topperformers | rollout
let metricsFuncTab = "csr";     // csr | cssr

let modalAgentIdx = null;
let modalActionItems = [];      // working copy while modal is open
let modalIsDirty = false;

/* ---------------- Utility formatting ---------------- */
function fmtUnit(value, unit) {
  if (unit === "%") return (value * 100).toFixed(1) + "%";
  if (unit === "sec") return Math.round(value) + "s";
  if (unit === "min") return Math.round(value) + "m";
  return Math.round(value) + " " + unit;
}
function fmtPct(value) { return (value * 100).toFixed(1) + "%"; }
function firstName(fullName) { return fullName.split(" ")[0]; }
function todayISO() { return new Date().toISOString().slice(0, 10); }

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
  const problems = rows
    .filter((r) => r.belowCap || r.attainment < 0.95)
    .sort((a, b) => a.attainment - b.attainment)
    .slice(0, 3);

  if (problems.length === 0) {
    if (tierIndex === 0) {
      return [{ icon: "🌟", title: "Outstanding work!", text: "You're delivering perfect execution against every goal this month. Keep setting the standard for the team!", tone: "positive" }];
    }
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
   TEAM VIEW — Team Health
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
          <thead>
            <tr>
              <th>Agent</th><th>Score</th><th>Tier</th>
              ${metrics.map((m) => `<th>${m.short}</th>`).join("")}
              <th>Final %</th><th>1:1</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </div>
    `;
  }).join("");

  wrap.querySelectorAll(".sc-onetoone-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.disabled) return;
      openOneOnOne(parseInt(btn.dataset.agentIdx, 10));
    });
  });
}

/* ================================================================
   TEAM VIEW — Top Performers
================================================================ */
function renderTopPerformers() {
  const list = STATE.agents.map((agent, idx) => ({ agent, idx, score: computeAgentScore(agent) }))
    .sort((a, b) => b.score - a.score);

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
    document.getElementById(id).addEventListener("input", () => { modalIsDirty = true; }, { once: false });
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
  if (history.length === 0) {
    el.innerHTML = `<div class="history-empty">No previous 1:1s saved yet.</div>`;
    return;
  }
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

function sessionToText(session, agentName) {
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
    const text = sessionToText(buildSessionObject(), agent.name);
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch (e2) { /* no-op */ }
      document.body.removeChild(ta);
    }
    const btn = document.getElementById("modalCopyBtn");
    const original = btn.textContent;
    btn.textContent = "✅ Copied!";
    setTimeout(() => { btn.textContent = original; }, 1400);
  });

  document.getElementById("modalDownloadBtn").addEventListener("click", () => {
    const agent = STATE.agents[modalAgentIdx];
    const session = buildSessionObject();
    const text = sessionToText(session, agent.name);
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `1on1_${agent.name.replace(/\s+/g, "_")}_${session.date}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
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
      document.getElementById("mode-team").style.display = appMode === "team" ? "block" : "none";
    });
  });
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
async function init() {
  const res = await fetch("data.json");
  DATA = await res.json();

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
