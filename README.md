# kitsch-cx-scorecard

Kitsch Customer Experience Scorecard — CSR + CSSR. Updated: v1.0.0

Interactive, mobile-friendly scorecard for the Kitsch Customer Experience department (CSR — tickets, and CSSR — social media), built to support the 30-60-90 Day Improvement Plan.

## What it does

- **📊 Overview** — headcount-weighted Department Summary (CSR + CSSR), overall tier classification, and tier legend.
- **🎫 CSR Scorecard** — QA, SLA Attainment, Attendance/Adherence, CSAT, AHT, First Response Time, Backlog Health.
- **💬 CSSR Scorecard** — Sentiment Score, Brand Voice/Tone QA, First Response Time, Resolution Time, Volume/Productivity, Escalation Rate.
- **🗓️ 30-60-90 Rollout** — timeline of the three implementation phases (Diagnose → Structure → Scale & Accountability), auto-highlighting the current phase based on the contract start date.

## How scoring works

Each metric has a **Weight**, **Goal**, and **Cap/Minimum**:

- **Goal** = target used to calculate attainment %, capped at 100% (a metric can never contribute more than its assigned weight, even if performance exceeds goal).
- **Cap/Minimum** = the disqualifying threshold; falling below it flags the metric as "Below Minimum" regardless of its attainment score.
- Attainment = `Actual / Goal` for "higher is better" metrics, or `Goal / Actual` for "lower is better" metrics (e.g. AHT, response/resolution time, escalation rate).
- **Tiers**: 💎 Platinum = 100% · 🏆 Gold ≥ 95% · ⭐ Silver ≥ 85% · 🔧 Needs Improvement < 85%.

## Editing data

All starting values (weights, goals, caps, sample actuals, headcount) live in [`data.json`](./data.json) — edit that file to update the baseline. End users can also edit **Actual** values and **headcount** directly in the app; those edits are saved locally in the browser (`localStorage`) and can be cleared anytime with **↺ Reset to sample data**.

## Files

| File | Purpose |
|---|---|
| `index.html` | App shell, layout and styling |
| `app.js` | Rendering, scoring logic, tabs, and edit/reset handling |
| `data.json` | Source data: metrics, weights, goals, caps, headcount, rollout phases |
| `.github/workflows/static.yml` | GitHub Pages deployment |

## Design

Soft rainbow pastel palette (pink · peach · yellow · mint · sky · lavender) with generous spacing, rounded cards, and a fully responsive layout — optimized for both desktop and mobile.

## Roadmap ideas

- Per-agent breakdown (once real headcount/roster data is available).
- PDF/image export of the scorecard.
- Historical trend view once monthly snapshots accumulate.

