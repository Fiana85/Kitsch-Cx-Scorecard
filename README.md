# kitsch-cx-scorecard

Kitsch Customer Experience Scorecard — CSR + CSSR. Updated: v1.5.1

Interactive, mobile-friendly scorecard for the Kitsch Customer Experience department (CSR — tickets, and CSSR — social media), built to support the 30-60-90 Day Improvement Plan.

## What it does

The app has three modes, switchable from the toggle at the top:

### 👤 Agent View (self-service, individual)
- Pick any agent from the dropdown (grouped by CSR / CSSR).
- Personal greeting, **Bonus Eligible** badge, and tier badge.
- Circular **Final Score** gauge + star rating + "X/Y metrics on track".
- **This Month's Status** card: tier of the month, On Target / Below Minimum status, and a status message that adapts to the agent's tier.
- **My Metrics This Month** — a clean grid of every metric with actual value, goal, progress bar and status tag (On Track / Watch / At Risk / Below Minimum).
- **Personalized Tips** — automatically generated coaching tips based on the agent's 3 weakest metrics (or a positive "gap to next tier" message if everything is on track).

### 🌸 Our Culture (visible to everyone)
A dedicated space so every associate — not just leadership — always has visibility into who Kitsch is and why the work matters:
- **Kitsch logo + tagline** at the top.
- **Our Story** — condensed brand history (founded 2010, grew from door-to-door hair-tie sales to 20,000+ retail locations in 27 countries) plus a **Founder Spotlight** on Cassandra Thurswell.
- **Mission** and **Vision** cards.
- **Our Values** — 5 core values (Community First, Elevated Simplicity, Sustainability with Purpose, Positivity & Grit, Accessible Indulgence).
- **Kitsch Moments in Customer Experience** — a direct translation of the brand's "Kitsch Moments" concept (small daily resets/self-care) into 4 concrete CX behaviors: Reset, Reassure, Delight, Follow Through.
- **Sustainability & Giving Back** — the 4ocean partnership, Charity: Water well project, vegan/cruelty-free stance, and recycled/reusable materials commitment.
- **🧭 How We Lead** — two leadership pillars (Stay Grounded, Lead With Integrity) with concrete day-to-day practices for TLs/SMEs. These principles aren't presented as a separate "extra" framework — they're woven intrinsically into the same language used across the Kitsch Moments behaviors, the Personalized Tips, and the 1:1 coaching structure (Strengths / Opportunities / Action Items / follow-through), so the whole tool consistently reflects the same leadership approach without needing its own branding.

> 📝 Note: Mission, Vision, Values, "Kitsch Moments in CX", and "How We Lead" were drafted for this tool (Kitsch's public materials don't currently publish a formal culture statement). The brand story and founder bio are original summaries — not verbatim copies — of Kitsch's public "Our Story"/"Our Founder" pages. Treat all of this as a **starting draft** to validate with Jeremy/Cassandra or Kitsch leadership before treating it as official company doctrine.

### 👥 Team View (TL / leadership tool)
Organized into 5 sub-tabs:
- **🩺 Team Health** — headcount-weighted Department Summary (CSR + CSSR), overall tier classification, and tier legend.
- **📈 Metrics** — full team-level metric tables (toggle between CSR/CSSR) with editable Actuals (TL Mode required).
- **🏅 Scorecard** — Excel-master style table, one per function (CSR / CSSR), with every agent's stars, tier, all metric columns (color-coded), Final % score, and a **📝 1:1** button per row to open that agent's coaching session.
- **🏆 Top Performers** — podium (🥇🥈🥉) for the top 3 agents department-wide, plus a full ranked leaderboard.
- **🗓️ Rollout** — timeline of the three 30-60-90 implementation phases, auto-highlighting the current phase based on the contract start date.

### 🔒 TL Mode
A toggle in the header (with a banner when active) that gates editing capability: headcount inputs, metric "Actual" edits, and the **1:1** buttons in the Scorecard table are only enabled when TL Mode is ON. This keeps the Team View safe to browse read-only by default, while giving the Team Lead full control when needed. State persists in `localStorage`.

### 📝 1:1 Coaching Sessions
Click **1:1** on any agent row in the Scorecard tab to open a full coaching session modal:
- Session date + agent header (function, tier, score, period).
- **Current Metrics** snapshot (auto-pulled from that agent's live data).
- **Strengths** and **Areas of Opportunity** free-text fields.
- **Action Items** checklist — add, check off, edit or remove items.
- **TL Notes** and **Agent Comments** free-text fields.
- **Next 1:1** date picker.
- **Previous 1:1s** — full history of past sessions for that agent, shown newest-first.
- **Copy** (copies a plain-text summary to the clipboard), **🖨️ Print / Save as PDF** (opens a polished, standalone printable page in a new tab — same clean report layout as the Performance Tracker's 1:1 export, with a metrics table, only the sections that have content, and a "Generado desde Kitsch CX Scorecard" footer with timestamp; use the browser's print dialog to save it as PDF), and **Save** (stores the session in `localStorage`, appended to that agent's history). A confirmation prompt protects against accidentally closing unsaved changes.
- Footnote reminder: sessions are saved only on the current device/browser (`localStorage`) and are not shared or synced anywhere.

## How scoring works

Each metric has a **Weight**, **Goal**, and **Cap/Minimum**:

- **Goal** = target used to calculate attainment %, capped at 100% (a metric can never contribute more than its assigned weight, even if performance exceeds goal).
- **Cap/Minimum** = the disqualifying threshold. Falling below it flags the metric "Below Minimum" and makes the agent **not bonus eligible** for that period, regardless of the overall score.
- Attainment = `Actual / Goal` for "higher is better" metrics, or `Goal / Actual` for "lower is better" metrics (e.g. AHT, response/resolution time, escalation rate).
- **Tiers**: 💎 Platinum = 100% · 🏆 Gold ≥ 95% · ⭐ Silver ≥ 85% · 🔧 Needs Improvement < 85%.
- **Agent scores** reuse the exact same weight/goal/cap/direction configuration as their function's scorecard (CSR or CSSR) — only the individual "Actual" value differs. Editing a goal in `data.json` automatically recalculates every agent's score too.

## How Personalized Tips work

For each agent, the app looks at every metric and flags anything that is either below its Cap/Minimum or below 95% attainment. The **3 weakest metrics** get a tailored tip pulled from the `metricTips` dictionary in `data.json` (icon + title + advice, with `{actual}` and `{goal}` auto-filled). Tips for metrics below the disqualifying Cap are highlighted in red; the rest use a neutral purple accent. If an agent has no flagged metrics, they get a positive message instead.

## Editing data

All starting values (weights, goals, caps, sample actuals, headcount, agent roster, and tip content) live in [`data.json`](./data.json). End users can also edit **Actual** values, **headcount** (TL Mode only), and manage **1:1 sessions** directly in the app; those edits are saved locally in the browser (`localStorage`) and can be cleared anytime with **↺ Reset to sample data** (this also clears all saved 1:1 history and TL Mode state — a confirmation prompt is shown first).

### Adding/editing agents in `data.json`

Each agent needs a `name`, a `function` (`"csr"` or `"cssr"`), and an `actuals` object with one entry per metric name matching that function's metric list exactly:

```json
{ "name": "Jane Doe", "function": "csr", "actuals": { "QA Score": 0.93, "SLA Attainment": 0.88, "Attendance / Adherence": 0.95, "CSAT": 0.88, "AHT (Average Handle Time)": 500, "First Response Time (Tickets)": 260, "Backlog Health (% tickets ≤ 2 days)": 0.70 } }
```

Each metric definition (under `csr.metrics` / `cssr.metrics`) also has a `short` field used as the column header abbreviation in the Scorecard table and the printable 1:1 report (e.g. `"short": "QA"`, `"short": "AHT"`).

### Customizing culture content in `data.json`

Everything shown in the **🌸 Our Culture** tab lives under the `culture` key in `data.json` — story paragraphs, founder bio, mission, vision, the 5 values, the 4 "Kitsch Moments in CX" behaviors, the 4 sustainability/giving-back items, and the "How We Lead" leadership pillars (title, intro, 2 pillars each with their own practices list). Edit any of these directly to refine the wording, add more values, or update the leadership practices as your approach evolves.

### Customizing tips in `data.json`

Each entry in `metricTips` is keyed by the exact metric name and supports `{actual}` / `{goal}` placeholders:

```json
"QA Score": { "icon": "🎯", "title": "Boost your QA Score", "advice": "Your QA Score is {actual} (goal ≥{goal}). Review your last audited interactions with your TL..." }
```

## Files

| File | Purpose |
|---|---|
| `index.html` | App shell, layout and styling (Agent View + Team View + 1:1 modal) |
| `app.js` | Rendering, scoring logic, agent picker, tips engine, TL Mode gating, Scorecard table, Top Performers, 1:1 modal logic + printable/PDF export, and edit/reset handling |
| `data.json` | Source data: metrics, weights, goals, caps, headcount, agent roster, tip content, culture content, rollout phases |
| `kitsch-logo.png` | Kitsch wordmark logo — used in the header, the Our Culture hero, and the printable 1:1 report |
| `.github/workflows/static.yml` | GitHub Pages deployment |

## Troubleshooting: blank / empty-looking page

If the app loads with the layout visible but every value shows as a dash (`—`), empty gauge, and no options in the agent dropdown, it means `data.json` failed to load — most commonly because it's missing from the repo, misnamed (must be exactly lowercase `data.json`), or the browser is serving a stale cached copy. As of v1.5.1, the app now shows a clear red error banner at the top explaining exactly what went wrong instead of failing silently, and it appends a cache-busting query string to the `data.json` request so browsers/CDNs don't serve an outdated version. If you see the banner, double-check that `data.json` is committed at the same folder level as `index.html`, then hard-refresh (Ctrl/Cmd+Shift+R).

## Design

Soft rainbow pastel palette (pink · peach · yellow · mint · sky · lavender) with generous spacing, rounded cards, and a fully responsive layout — optimized for both desktop and mobile. The Scorecard table scrolls horizontally on narrow screens to preserve readability of the dense metric columns. The printable 1:1 report opens in its own clean, print-optimized tab (white background, no app chrome) so it can be printed or saved as a PDF directly from the browser's print dialog.

## Roadmap ideas

- Historical trend view once monthly snapshots accumulate.
- Weekly newsletter tab (highlight top performers, birthdays, etc.), similar to the Performance Tracker Lite project.
- Optional real authentication/roles instead of the local TL Mode toggle, if this needs to be shared across multiple devices.
