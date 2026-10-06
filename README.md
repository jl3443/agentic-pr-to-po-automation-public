# PO Orchestrator — Agentic PR → PO Automation

An AI-native **Procure-to-Order cockpit** for aerospace indirect/MRO procurement. AI agents extract an RFX, identify the procurement scenario, validate against portal + SAP master data, create the purchase order, and drive every exception to resolution — under full **Maker–Checker** governance. The agent does the work; two humans sign.

> Demo environment · all data is fictitious. Branded for a generic aerospace OEM, EUR currency.

---

## The flow (6-stage ceremony)

**Extract → Identify → Validate → Create PO → Release → Update**

- **Maker** creates: extract 18 RFX fields → score the scenario → run validation → write the PO into SAP → submit for QC.
- **Checker** releases: re-validate against master → approve & release → send supplier confirmation.

## Scenarios

| Tier | Flow | What it shows |
|------|------|---------------|
| **Standard** | Zero-touch happy path | RFX → validated → PO created → released, all green |
| **Critical** | RFX mismatch (PDF qty ≠ portal qty) | Agent holds, emails the buyer, resumes on the corrected quantity |
| **Critical** | Checker data issue | QC catches a wrong supplier code; returns to Maker; corrected & resubmitted |
| **Critical** | Budget overshoot | PO exceeds the SIO allocation (reverse-charge VAT); Finance allocates **or** Maker reduces qty |
| **High** | Post-PO amendment | Live PO amended (qty + tax code); Maker approves, Ops verifies, Checker releases |

## Design system

Captured live from a reference aerospace OEM site — see [`design-system/docs/capture/aerospace-design-evidence.md`](design-system/docs/capture/aerospace-design-evidence.md).

- **Font:** Barlow · **Primary:** AeroCorp blue `#084A90` · **Navy:** `#070E1D` · **Radius:** sharp 2px · **Currency:** EUR (€)

## Stack

React 19 · TypeScript · Vite 7 · Tailwind v4 · Framer Motion · Recharts · Lucide.

## Run locally

```bash
npm install
npm run dev      # http://localhost:5173
```

**Demo accounts** (password `Demo@2026`): `maker@company.com` (Maker) · `checker@company.com` (Checker).
