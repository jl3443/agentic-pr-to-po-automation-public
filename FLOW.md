# Application Flow — Operations Readiness Manager

This document maps the complete interaction flow of the demo, from login through all resolution paths to handoff completion.

---

## 1. Top-Level Navigation Flow

```mermaid
flowchart TD
    A([Login]) --> B[Dashboard\nKPIs · Charts · Recent Exceptions]
    B --> C[Shipment Overview List\n11 shipments · 4 demo scenarios]

    C --> S1[SHP-20481\nMissing ISF\nCritical · open]
    C --> S2[SHP-20482\nInvoice Value & Weight Mismatch\nHigh · in-review]
    C --> S3[SHP-20483\nUnreadable MSDS – Hazmat\nMedium · waiting]
    C --> S4[SHP-20484\nCutoff Risk Escalation\nCritical · WAR ROOM]

    S1 & S2 & S3 & S4 --> OV

    subgraph OV[Shipment Detail]
        direction LR
        OV1[Overview\nReadiness · Gate Check · Docs]
        OV2[Exceptions\nException Workbench]
        OV3[Documents\nUpload Zone]
        OV4[Communications\nEmail Drafts · Inbox]
        OV5[Timeline\nResolution History]
    end
```

---

## 2. Exception Resolution — Three Paths

```mermaid
flowchart TD
    EW[Exception Workbench\nSelect Exception] --> EP[Exception Detail Panel\nAI Assessment · Impact · Actions]

    EP --> PA{Action Type}

    PA -->|type: email| E1
    PA -->|type: escalation| E2
    PA -->|type: override| E3
    PA -->|type: internal| E4

    subgraph E1[📧 Email Path]
        direction TB
        E1A[AI Draft Generated\nper recipient tab] --> E1B[Review & Send]
        E1B --> E1C[Sent Email Log]
        E1C --> E1D[Reply Received\nInbox · mark read]
        E1D --> E1E[Exception Action Confirmed]
    end

    subgraph E2[🚨 Escalation Path]
        direction TB
        E2A[Escalation Modal Opens] --> E2B[Loading\nAI Analyzing Risk Profile]
        E2B --> E2C[Risk Snapshot\nTime to cutoff · Revenue at risk]
        E2C --> E2D[AI Recommended Actions\nRECOMMENDED · ALTERNATIVE · FALLBACK]
        E2D --> E2E{Human Reviews\n& Selects Action}
        E2E --> E2F[Approve Action ▸\nOne-click approval]
        E2F --> E2G[Executing Animation]
        E2G --> E2H[Stakeholder Notifications\nCarrier · Customer · Ops]
        E2H --> E2I[Exception Resolved]
    end

    subgraph E3[⚖️ Compliance Override Path]
        direction TB
        E3A[Compliance Override Modal] --> E3B[AI Reviews\nRisk Assessment]
        E3B --> E3C[Trade Manager Approves]
        E3C --> E3D[Override Logged\nAudit Trail]
        E3D --> E3E[Exception Resolved]
    end

    subgraph E4[⚡ Internal Action Path]
        direction TB
        E4A[Auto-Confirmed\n800ms delay] --> E4B[Toast Confirmation]
        E4B --> E4C[Exception Action Confirmed]
    end

    E1E & E2I & E3E & E4C --> RES{All Actions\nConfirmed?}
    RES -->|No| EP
    RES -->|Yes| DONE[Exception Resolved\nStatus → resolved]
```

---

## 3. Document Upload Resolution Path

```mermaid
flowchart TD
    DZ[Documents Page\nDrop Zone] --> UP[File Dropped / Selected\nHTML · PDF]

    UP --> AI1
    AI1 --> AI2
    AI2 --> AI3

    subgraph AI[AI Processing Animation]
        direction LR
        AI1[OCR Extraction\nExtracting fields & metadata]
        AI2[Classify Agent\nDocument type · Confidence score]
        AI3[Confirm Validation\nCross-reference shipment data]
    end

    AI3 --> MT{Doc Type\nMatches Exception?}
    MT -->|isf| RSV1[ISF Exception Resolved]
    MT -->|bol| RSV2[BOL Exception Resolved]
    MT -->|ci / pl / other| RSV3[Relevant Exception Resolved]

    RSV1 & RSV2 & RSV3 --> TOAST[Toast: AI-validated\nException resolved]
    TOAST --> RDY[Readiness Score Updates]
```

---

## 4. War Room — SHP-20484 Specific Flow

```mermaid
flowchart TD
    W1[SHP-20484 Selected\n2 Blocking Exceptions] --> W2

    W2[⚠️ Risk Banner\nCRITICAL CUTOFF RISK]
    W2 --> W3[Live Countdown\n4h 00m → 0h 00m]
    W2 --> W4[Blocker Chips\nISF remains unfiled · BOL version conflict]
    W2 --> W5[Launch Escalation Button]

    W5 --> ESC[War Room Escalation Modal]

    subgraph ESC[Escalation Modal — Human Approval Required]
        direction TB
        L1[Loading: Scanning exception timeline] --> L2[Loading: Evaluating resolution pathways]
        L2 --> L3[Loading: Scoring risk vs cost tradeoffs]
        L3 --> L4[Loading: Generating recommended action plan]
        L4 --> RS[Risk Snapshot\n⏱ 4h to cutoff · 💰 $85,200 at risk]
        RS --> AC[AI Recommended Actions]

        subgraph AC[Action Cards]
            direction LR
            AC1[🟢 RECOMMENDED\nEmergency ISF Filing via Flexport\n92% success · ~45 min · +$1,200]
            AC2[🔵 ALTERNATIVE\nRequest 2-Hour Maersk Extension\n67% success · ~30 min · No cost]
            AC3[⚪ FALLBACK\nRoll to Next Sailing Mar 22\n100% certainty · Next day · +$12,000]
        end

        AC --> APV[Approving as: Operations Manager\nFull escalation authority · Audit trail]
        APV --> BTN[Approve Action ▸]
    end

    BTN --> EX1[Executing Animation\n700ms]
    EX1 --> DR[Communication Draft Panel\nCarrier · Customer · Ops drafts]
    DR --> EX2[Both Exceptions Resolved\nReadiness 38% → 100%]
    EX2 --> HP[Cleared for Handoff 🎉]

    subgraph ALT[Alternative: Document Upload]
        U1[Upload ISF_SHP-20484.html] --> U2[OCR → Classify → Validate]
        U2 --> U3[ISF Exception Resolved]
        U4[Upload BOL_MSKU7294810_v3.html] --> U5[OCR → Classify → Validate]
        U5 --> U6[BOL Exception Resolved]
        U3 & U6 --> EX2
    end
```

---

## 5. Happy Path — All Exceptions Cleared

```mermaid
flowchart LR
    R0[Readiness 0–37%\nMultiple blockers] -->|Exceptions resolve one by one| R1
    R1[Readiness 38–69%\nPartial resolution] -->|Final exception cleared| R2
    R2[Readiness 100%\nAll exceptions resolved]

    R2 --> HP[Happy Path Triggered\nauto-pivot to Overview]

    subgraph HP[Cleared for Handoff Screen]
        direction TB
        H1[✅ Green pulsing animation]
        H2[Shipment ID · Lane · Vessel]
        H3[All documents validated]
        H4[Gate Check: All stages complete]
        H5[Ready for customs handoff]
    end

    HP --> GC[Gate Check Complete\nDocs Received ✓ · Validated ✓\nCompliance ✓ · Handoff Ready ✓]
```

---

## 6. Quick Actions Flow

```mermaid
flowchart TD
    QA[Quick Actions Panel\nper Exception] --> QAT{Action Type}

    QAT -->|Single email action| QA1[Open Draft → Send]
    QAT -->|Execute All button| QA2[Batch Send All Drafts\nfor this exception]
    QAT -->|Escalation action| QA3[Open Escalation Modal]

    QA1 & QA2 --> SD[handleSendDraft\nwith directActionId]
    SD --> INB[Add to Sent Log\nGenerate Inbox Reply]
    INB --> RPL[Reply arrives in Inbox\nMark read → action confirmed]
    RPL --> RSV[Exception action\nmarked replied]

    QA3 --> ESC[Escalation Modal\nsee War Room flow]
```
