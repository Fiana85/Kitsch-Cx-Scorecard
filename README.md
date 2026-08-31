# kitsch-cx-scorecard

Kitsch Customer Experience Scorecard — CSR + CSSR. Updated: v1.1.0

Interactive, mobile-friendly scorecard for the Kitsch Customer Experience department (CSR — tickets, and CSSR — social media), built to support the 30-60-90 Day Improvement Plan.

## What it does

- **📊 Overview** — headcount-weighted Department Summary (CSR + CSSR), overall tier classification, and tier legend.
- **🎫 CSR Scorecard** — QA, SLA Attainment, Attendance/Adherence, CSAT, AHT, First Response Time, Backlog Health.
- **💬 CSSR Scorecard** — Sentiment Score, Brand Voice/Tone QA, First Response Time, Resolution Time, Volume/Productivity, Escalation Rate.
- **👤 Agents** — individual scorecard per agent, using the exact same weights/goals/caps as the team-level scorecards. Includes:
  - Filter chips (All / CSR / CSSR)
  - Search by name
  - Sort by score (high→low, low→high) or name
  - Expandable metric breakdown per agent, with editable "Actual" values per metric
- **🗓️ 30-60-90 Rollout** — timeline of the three implementation phases (Diagnose → Structure → Scale & Accountability), auto-highlighting the current phase based on the contract start date.

## How scoring works

Each metric has a **Weight**, **Goal**, and **Cap/Minimum**:

- **Goal** = target used to calculate attainment %, capped at 100% (a metric can never contribute more than its assigned weight, even if performance exceeds goal).
- **Cap/Minimum** = the disqualifying threshold; falling below it flags the metric as "Below Minimum" regardless of its attainment score.
- Attainment = `Actual / Goal` for "higher is better" metrics, or `Goal / Actual` for "lower is better" metrics (e.g. AHT, response/resolution time, escalation rate).
- **Tiers**: 💎 Platinum = 100% · 🏆 Gold ≥ 95% · ⭐ Silver ≥ 85% · 🔧 Needs Improvement < 85%.
- **Agent scores** reuse the exact same weight/goal/cap/direction configuration as their function's scorecard (CSR or CSSR) — only the individual "Actual" value differs. This means editing a goal in `data.json` automatically recalculates every agent's score too.

## Editing data

All starting values (weights, goals, caps, sample actuals, headcount, and the agent roster) live in [`data.json`](./data.json) — edit that file to update the baseline, replace sample agent names with your real roster, or add/remove agents. End users can also edit **Actual** values (team-level and per-agent) and **headcount** directly in the app; those edits are saved locally in the browser (`localStorage`) and can be cleared anytime with **↺ Reset to sample data**.

### Adding/editing agents in `data.json`

Each agent needs a `name`, a `function` (`"csr"` or `"cssr"`), and an `actuals` object with one entry per metric name matching that function's metric list exactly:

```json
{ "name": "Jane Doe", "function": "csr", "actuals": { "QA Score": 0.93, "SLA Attainment": 0.88, "Attendance / Adherence": 0.95, "CSAT": 0.88, "AHT (Average Handle Time)": 500, "First Response Time (Tickets)": 260, "Backlog Health (% tickets ≤ 2 days)": 0.70 } }
```

## Files

| File | Purpose |
|---|---|
| `index.html` | App shell, layout and styling |
| `app.js` | Rendering, scoring logic, tabs, agent filters/search/sort, and edit/reset handling |
| `data.json` | Source data: metrics, weights, goals, caps, headcount, agent roster, rollout phases |
| `.github/workflows/static.yml` | GitHub Pages deployment |

## Design

Soft rainbow pastel palette (pink · peach · yellow · mint · sky · lavender) with generous spacing, rounded cards, and a fully responsive layout — optimized for both desktop and mobile.

## Roadmap ideas

- PDF/image export of the scorecard.
- Historical trend view once monthly snapshots accumulate.
- Weekly newsletter tab (highlight top performers, birthdays, etc.), similar to the Performance Tracker Lite project.
