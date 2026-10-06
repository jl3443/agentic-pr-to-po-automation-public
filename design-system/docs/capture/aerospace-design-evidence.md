# AeroCorp — Frontend Design System Capture

- **Source:** (reference OEM site — redacted)
- **Captured:** 2026-06-25 · live `getComputedStyle()` via Chrome MCP (Channel A, fully automated)
- **Method:** `extractor.js` (this dir) run in page context; values below are real readings, not inferred.

---

## Fingerprint

| Token | Value |
|-------|-------|
| Font | **Barlow** (Arial fallback) — 1,486 elements; `icomoon` for icons |
| Primary blue | `rgb(8, 74, 144)` → `#084A90` |
| Mid blue (links/accent) | `rgb(37, 91, 142)` → `#255B8E` |
| Sky accent | `rgb(127, 184, 231)` → `#7FB8E7` |
| Dark navy (text/ink) | `rgb(27, 29, 39)` → `#1B1D27` |
| Header/footer navy | `rgb(7, 14, 29)` `#070E1D` · `rgb(2, 20, 58)` `#02143A` · `rgb(17, 39, 83)` `#112753` |
| Light blue-grey (on dark) | `rgb(209, 214, 230)` → `#D1D6E6` |
| Mutes | `#84899F`, `#A4ACBC`, body grey `#212121` |
| Surface greys | white, `#F4F4F4` |
| Warm accent (rare, glow) | `rgba(217, 119, 87, …)` ≈ `#D97757` (inset glow only) |
| Radius | **2px** dominant · 6px · 4.5px · 50px (icon pills) — sharp / industrial |
| Shadow | soft `rgba(0,0,0,0.06) 2px 10px 20px` |
| Motion | `color 0.3s`, `0.3s ease-in-out`, `all` |
| Currency | **EUR (€)** — confirmed by site's own stock ticker "SAF 338.4€ +2.21%" (Euronext Paris) |

## Typography roles (computed)

| Role | Family | Size | Weight | Line | Notes |
|------|--------|------|--------|------|-------|
| h1 (hero) | Barlow | 80px | **200** | 80px | white on navy hero; ultralight |
| h2 | Barlow | 36px | 400 | 42px | |
| h3 | Barlow | 24px | 300 | 29px | |
| body / p | Barlow | 18px | 400 | 26–28.8px | |
| header link | Barlow | 13px | 500 | — | muted `#84899F` |
| nav (uppercase) | Barlow | 13px | 400 | — | `text-transform: uppercase`, `letter-spacing: 0.4px` |
| hero arrow CTA | Barlow | 13px | 600 | — | uppercase, `letter-spacing: 2.8px` |

## CTA variants (deduped by signature)

| Variant | BG | FG | Border | Radius | Font |
|---------|----|----|--------|--------|------|
| Primary | `#084A90` | white | 2px solid `#084A90` | 2px | Barlow 500 / 14px, sentence case |
| Outline | white | `#084A90` | 2px solid `#084A90` | 2px | Barlow 500 / 14px |
| Header nav item | `#1B1D27` | white | — | 0 | Barlow 400 / 13px, **uppercase**, 0.4px tracking |
| Utility (logins/search) | `#02143A` / `#112753` | white | — | 0 | Barlow 500 / 13px |

## Brand assets

- Logo (white): captured from the reference OEM site (URL redacted) — 157×34
- Worldwide / location / hierarchy icon SVGs under `/sites/default/files/...`

## Notes / deferred

- `:root`/`body` exposed **no** `--brand-*` custom properties (values are inline/utility-class driven) — tokens above are reverse-mapped from computed colors, not named vars.
- Captured **homepage only** at 1440px. Inner pages, mobile breakpoint, and font weights beyond {200,300,400,500,600} not yet sampled — re-run extractor if needed.
- Logo SVG path data not fetched (extractor returns `<img src>` only).

## Applied to the PO Orchestrator demo

- `--primary` → `#084A90`; sidebar/navy → `#070E1D`/`#112753`; `--radius` → 2px (sharp).
- Font Geist → **Barlow** (Google Fonts) across app + charts.
- TCS blue `#0000B3` family → AeroCorp blue `#084A90` family.
- Currency ₹/INR → €/EUR; locale `en-IN` → `en-US`.
