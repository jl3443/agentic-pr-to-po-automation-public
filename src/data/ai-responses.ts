// ---------------------------------------------------------------------------
// PO Orchestrator AI Chat — Pre-written Responses
// ---------------------------------------------------------------------------

export interface AiAction {
  label: string;
  type: 'navigate' | 'open-ticket' | 'approve' | 'notify' | 'whatif';
  target?: string;
}

export interface AiResponse {
  text: string;
  actions?: AiAction[];
}

// ---------------------------------------------------------------------------
// Context-aware suggestion chips
// ---------------------------------------------------------------------------

export const viewSuggestions: Record<string, string[]> = {
  dashboard: [
    'Summarize today\'s tickets',
    'Which ticket is most urgent?',
    'Show agent processing stats',
    'Any tickets on hold?',
  ],
  extraction: [
    'What fields were extracted?',
    'Any extraction errors?',
    'Show document checklist',
    'Compare PDF vs portal values',
  ],
  validation: [
    'Why did validation fail?',
    'Which fields have warnings?',
    'Can we override the hold?',
    'Show validation summary',
  ],
  po_creation: [
    'Show PO details',
    'Verify line item calculations',
    'Check tax code mapping',
    'Compare with original RFX',
  ],
  checker: [
    'Summarize PO for QC',
    'Any red flags to check?',
    'Show re-validation results',
    'Compare to previous POs',
  ],
  exception: [
    'Explain the mismatch',
    'What needs to be clarified?',
    'Show amendment impact',
    'Draft clarification email',
  ],
};

// ---------------------------------------------------------------------------
// Pre-written responses
// ---------------------------------------------------------------------------

export const aiResponses: Record<string, AiResponse> = {

  // ==========================================================================
  // DASHBOARD CONTEXT
  // ==========================================================================

  'Summarize today\'s tickets': {
    text: '**Today\'s Ticket Summary**\n\nProcessed **12 RFX tickets** today across all agents. **7 completed** end-to-end (Maker → Checker → Released), **4 currently in progress** at various agent stages, and **1 on hold** pending clarification from the requester. Average processing time is **4.2 minutes** per ticket, down from the 45-minute manual baseline. AI accuracy across 216 field validations stands at **97.3%**. Total PO value processed: €2.4 k€.',
    actions: [
      { label: 'View On-Hold Ticket', type: 'open-ticket', target: 'SAF-INC-2026-08835' },
    ],
  },

  'Which ticket is most urgent?': {
    text: '**Most Urgent: SAF-INC-2026-08835**\n\nThis ticket has a **high priority** flag and is currently **on hold** due to a quantity mismatch detected by the Validation Agent. The RFX PDF states 200 EA but the portal shows 150 EA for TITANIUM CAP SCREW M4X6. Additionally, the Annexure Excel is missing. A clarification email has been drafted and is ready to send. Resolving this quickly is critical as it blocks PO creation for Plant 3158.',
    actions: [
      { label: 'Open Ticket', type: 'open-ticket', target: 'SAF-INC-2026-08835' },
    ],
  },

  'Show agent processing stats': {
    text: '**Agent Processing Statistics (Today)**\n\n| Agent | Executions | Avg Time | Success Rate |\n|-------|-----------|----------|-------------|\n| Content Extraction | 12 | 1.8s | 100% |\n| Scenario Identification | 12 | 0.9s | 100% |\n| Validation | 12 | 2.1s | 83% (2 holds) |\n| PO Creation | 10 | 3.2s | 100% |\n| PO Release | 7 | 1.1s | 100% |\n| Ticket Updation | 7 | 0.8s | 100% |\n\nThe Validation Agent flagged 2 tickets for hold — both legitimate issues (quantity discrepancies). No false positives today.',
  },

  'Any tickets on hold?': {
    text: '**Tickets On Hold**\n\n**1 ticket currently on hold:**\n\n- **SAF-INC-2026-08835** (RFX-3012438300) — TITANIUM CAP SCREW M4X6\n  - **Reason**: Quantity mismatch (PDF: 200 EA vs Portal: 150 EA) + missing Annexure Excel\n  - **Hold since**: 26-Mar-2026 08:45 AM (2 hours ago)\n  - **Action needed**: Clarification from requester Buyer\n  - **AI recommendation**: Send drafted clarification email, await response before proceeding\n\nAll other tickets are either completed or actively progressing through the agent pipeline.',
    actions: [
      { label: 'Open Hold Ticket', type: 'open-ticket', target: 'SAF-INC-2026-08835' },
    ],
  },

  // ==========================================================================
  // EXTRACTION CONTEXT
  // ==========================================================================

  'What fields were extracted?': {
    text: '**Content Extraction Agent — Results**\n\nExtracted **18 fields** from the RFX PDF document with high confidence:\n\n- **Material**: 889000087436 — TITANIUM CAP SCREW M4X6\n- **Quantity**: 200 EA\n- **Plant/Storage**: 3158 / U01\n- **Supplier**: B65500 — AERONORM FASTENERS SAS\n- **Negotiated Rate**: €4.57/EA (Basic: €4.80)\n- **Tax Code**: VG | **Payment Terms**: AP02\n- **Incoterms**: FH (Free House)\n- **Validity**: 03/17/2026 — 03/31/2026\n- **SOB**: 100% allocated to selected supplier\n\nAll extracted values will be cross-validated against portal data by the Validation Agent.',
  },

  'Any extraction errors?': {
    text: '**Extraction Quality Report**\n\nNo extraction errors detected. All 18 fields were extracted with **high confidence** (>95%). The OCR quality of the RFX PDF was excellent. Two minor notes:\n\n1. The "Cumulative Value" field had a faint decimal — extracted as 0.0091 k€, verified against line item calculation (200 × 4.57 = €914 = 0.0091 k€) ✓\n2. Supplier name had mixed case formatting — normalized to "AERONORM FASTENERS SAS" per SAP master data.\n\nNo re-extraction needed. Ready to proceed to Scenario Identification.',
  },

  'Show document checklist': {
    text: '**Document Checklist**\n\n✅ RFX Synopsis PDF — Present, extracted successfully\n✅ Annexure Excel — Present, calculations verified\n✅ Rate Negotiation Email — Present, negotiated rate confirmed\n✅ Purchase Approval — Present, IDM approval on file\n\n**All 4 required documents are present.** The Validation Agent can proceed with full field-level validation.',
  },

  'Compare PDF vs portal values': {
    text: '**PDF vs Portal Comparison**\n\n| Field | RFX PDF | Portal | Match |\n|-------|---------|--------|-------|\n| Quantity | 200 EA | 200 EA | ✅ |\n| Material | 889000087436 | 889000087436 | ✅ |\n| Rate | €4.57 | €4.57 | ✅ |\n| Supplier | B65500 | B65500 | ✅ |\n| Plant | 3158 | 3158 | ✅ |\n| Tax Code | VG | VG | ✅ |\n\n**All values consistent** between the RFX PDF and portal data. No discrepancies found for this ticket.',
  },

  // ==========================================================================
  // VALIDATION CONTEXT
  // ==========================================================================

  'Why did validation fail?': {
    text: '**Validation Failure Analysis**\n\nThe Validation Agent detected **2 critical issues** that triggered a HOLD:\n\n1. **Quantity Mismatch** (Critical)\n   - RFX PDF states: **200 EA**\n   - Portal request shows: **150 EA**\n   - A 50-unit discrepancy (33%) exceeds the 5% tolerance threshold\n   - Impact: PO cannot be created until correct quantity is confirmed\n\n2. **Missing Annexure** (Critical)\n   - The Annexure Excel (Approval Calculation Sheet) is not attached\n   - This document is required for value verification and DOA compliance\n   - Impact: Cannot verify approval calculation matches PO value\n\nBoth issues require requester clarification before the PO Creation Agent can proceed.',
    actions: [
      { label: 'Send Clarification Email', type: 'notify', target: 'send-email' },
    ],
  },

  'Which fields have warnings?': {
    text: '**Warning-Level Findings**\n\nBeyond the 2 critical failures, the Validation Agent flagged **1 warning**:\n\n⚠️ **Portal Remarks**: The remarks mention "zero rate po" but the RFX has a negotiated rate of €4.57/EA. This may indicate:\n- A rate contract scenario where zero-rate is used for scheduling agreements\n- A data entry error in the remarks field\n- The requester intended a different PO type\n\nThis warning doesn\'t block PO creation, but should be clarified with the requester alongside the critical issues.',
  },

  'Can we override the hold?': {
    text: '**Hold Override Policy**\n\nThe hold **cannot be overridden** for quantity mismatches exceeding 5%. This is a compliance control per the Maker-Checker protocol. The rationale:\n\n- A 50-unit discrepancy (33%) could result in an incorrect PO value\n- Without the Annexure, the DOA (Delegation of Authority) cannot be verified\n- Override would bypass the Checker QC stage validation\n\n**Recommended action**: Send the drafted clarification email to the requester. The AI has pre-composed an email with all discrepancy details. Once the requester confirms the correct quantity and uploads the Annexure, the Validation Agent will automatically re-run and clear the hold.',
  },

  'Show validation summary': {
    text: '**Validation Summary**\n\n- **Total checks**: 16\n- **Passed**: 13 ✅\n- **Failed**: 2 ❌ (Quantity mismatch, Missing annexure)\n- **Warnings**: 1 ⚠️ (Zero rate remarks)\n- **Overall confidence**: 42%\n\nThe 2 failures are blocking. Once resolved, the expected confidence will rise to **98%** as all other validations passed cleanly.',
  },

  // ==========================================================================
  // PO CREATION CONTEXT
  // ==========================================================================

  'Show PO details': {
    text: '**SAP PO Details — PO 4960162736**\n\n- **Type**: UNB (Standard PO)\n- **Company Code**: AeroCorp S.A.\n- **Supplier**: B65500 — AERONORM FASTENERS SAS, Toulouse\n- **Created by**: AI PO Creation Agent (Maker: Maker)\n- **Date**: 03/26/2026\n\n**Line Items:**\n| Item | Material | Description | Qty | Price | Total |\n|------|----------|-------------|-----|-------|-------|\n| 10 | 889000087436 | TITANIUM CAP SCREW M4X6 | 200 EA | €4.57 | €914.00 |\n\n**Terms**: Payment AP02 | Tax VG | Incoterms FH | Delivery by 03/31/2026\n\nPO is ready for Checker QC review.',
  },

  'Verify line item calculations': {
    text: '**Line Item Verification**\n\n- Quantity: 200 EA ✅ (matches RFX)\n- Unit Price: €4.57 ✅ (matches negotiated rate)\n- Total: 200 × 4.57 = **€914.00** ✅\n- Tax (VG): Input VAT 9% + Output VAT 9% = €164.52\n- **Grand Total with Tax**: €1,078.52\n\nAll calculations verified against the Annexure Excel. No discrepancies found.',
  },

  'Check tax code mapping': {
    text: '**Tax Code Verification**\n\n- **Tax Code**: VG\n- **Description**: VAT on Goods (Standard)\n- **Input VAT**: 9.00%\n- **Output VAT**: 9.00%\n- **Total Tax Rate**: 18.00%\n\nThis is the correct tax code for indirect material procurement (non-flight-critical consumables). The code VG maps to standard VAT treatment for goods at the plant location (Gennevilliers, Réau).',
  },

  'Compare with original RFX': {
    text: '**PO vs Original RFX Comparison**\n\n| Field | RFX Value | PO Value | Match |\n|-------|-----------|----------|-------|\n| Supplier | B65500 | B65500 | ✅ |\n| Rate | €4.57 | €4.57 | ✅ |\n| Quantity | 200 EA | 200 EA | ✅ |\n| Tax Code | VG | VG | ✅ |\n| Payment | AP02 | AP02 | ✅ |\n| Incoterms | FH | FH | ✅ |\n| Plant | 3158 | 3158 | ✅ |\n| Delivery | 03/31/2026 | 03/31/2026 | ✅ |\n\n**100% match** between RFX and PO. The PO Creation Agent faithfully transferred all values from the approved RFX.',
  },

  // ==========================================================================
  // CHECKER CONTEXT
  // ==========================================================================

  'Summarize PO for QC': {
    text: '**Checker QC Summary**\n\nPO **4960162736** is ready for your review.\n\n- **Material**: TITANIUM CAP SCREW M4X6 (889000087436)\n- **Supplier**: AERONORM FASTENERS SAS (B65500)\n- **Value**: €914.00 (200 EA @ €4.57)\n- **AI Agents**: All 4 Maker-stage agents completed successfully\n- **Validation**: 16/16 checks passed, 98% confidence\n- **Key verification**: Rate matches negotiated (€4.57 ≤ €4.80 basic)\n\n**Recommendation**: Approve for release. All values consistent with RFX and within policy.',
    actions: [
      { label: 'Approve & Release', type: 'approve', target: 'release-po' },
    ],
  },

  'Any red flags to check?': {
    text: '**Red Flag Check**\n\nNo red flags detected for PO 4960162736:\n\n✅ Supplier is active in SAP master data\n✅ Rate is within market range and below basic rate\n✅ Tax code matches material category\n✅ Payment terms within standard policy (AP02)\n✅ Delivery date within RFX validity period\n✅ All required documents present and verified\n✅ SOB allocation is 100% (no split required)\n\nThis is a straightforward standard indirect PO with no exceptions or anomalies.',
  },

  'Show re-validation results': {
    text: '**Checker Re-validation Results**\n\n| Check | Status | Detail |\n|-------|--------|--------|\n| PO Number | ✅ | 4960162736 assigned in SAP |\n| Total Value | ✅ | €914.00 matches calculation |\n| Supplier Match | ✅ | B65500 matches RFX winner |\n| Rate Match | ✅ | €4.57 matches negotiated rate |\n\nAll **4 re-validation checks passed**. PO is consistent with the Maker\'s input and the original RFX. Safe to release.',
  },

  'Compare to previous POs': {
    text: '**Historical PO Comparison**\n\nSimilar POs for TITANIUM CAP SCREW M4X6 in the last 90 days:\n\n| PO | Date | Qty | Rate | Supplier | Status |\n|----|------|-----|------|----------|--------|\n| 4960162100 | Mar 2026 | 200 EA | €4.80 | B65500 | Released |\n| 4960161850 | Mar 2026 | 150 EA | €4.95 | S60310 | Released |\n| 4960161600 | Mar 2026 | 200 EA | €5.10 | B65500 | Released |\n\nCurrent negotiated rate of **€4.57** is the **lowest in 90 days** — a 5% improvement from the last order. This reflects successful rate negotiation.',
  },

  // ==========================================================================
  // EXCEPTION CONTEXT
  // ==========================================================================

  'Explain the mismatch': {
    text: '**Mismatch Explanation**\n\nThe Validation Agent found a **quantity discrepancy** between two data sources:\n\n- **RFX PDF** (uploaded document): States **200 EA**\n- **Portal request** (GDC system): Shows **150 EA**\n\nPossible causes:\n1. The requester updated the portal after the RFX was generated\n2. The RFX PDF is from a different revision\n3. Data entry error in either system\n\nThe 50-unit difference (33%) is significant enough that we cannot make an assumption. The AI has drafted a clarification email to the requester with all relevant details.',
  },

  'What needs to be clarified?': {
    text: '**Clarification Needed**\n\nTwo items require requester response:\n\n1. **Correct quantity**: Is it 200 EA (per RFX PDF) or 150 EA (per portal)? This affects PO value and potentially DOA approval level.\n\n2. **Annexure Excel**: The approval calculation sheet is missing. The requester needs to either:\n   - Upload it to the portal, or\n   - Reply to the clarification email with the document attached\n\nAdditionally, the portal remarks say "zero rate po" which contradicts the €4.57 negotiated rate. This should be clarified in the same communication.',
  },

  'Show amendment impact': {
    text: '**Amendment Impact Analysis**\n\nFor PO 2430065326 (Repair of LEAP-1A nacelle latch actuator):\n\n| Field | Original | Amended | Impact |\n|-------|----------|---------|--------|\n| Quantity | 8,000 EA | 9,987 EA | +24.8% increase |\n| Tax Code | VG (Goods) | U1 (Services) | Tax treatment change |\n| Total Value | €24,000 | €29,961 | +€5,961 (+24.8%) |\n\n**Key considerations**:\n- Value increase may require additional DOA approval\n- Tax code change affects VAT treatment (goods → services)\n- Supplier SIGMA AUTOMATION has confirmed capacity for increased quantity\n- Manager approval (Buyer) already obtained via email',
  },

  'Draft clarification email': {
    text: '**Email Draft Ready**\n\nA clarification email has been pre-composed by the AI agent addressed to the requester (Buyer). The email covers:\n\n1. Quantity discrepancy (200 vs 150 EA)\n2. Missing Annexure document\n3. Zero rate remarks clarification\n\nYou can review and edit the email in the workflow panel before sending. The email includes the RFX PDF as an attachment for reference.',
    actions: [
      { label: 'Review Email', type: 'navigate', target: 'email-draft' },
    ],
  },
};

// ---------------------------------------------------------------------------
// Fallback response
// ---------------------------------------------------------------------------

export const aiFallbackResponse: AiResponse = {
  text: 'I can help you with RFX ticket processing, agent status monitoring, validation analysis, PO details, and exception resolution. Currently tracking 12 tickets across the agent pipeline. The most urgent item is SAF-INC-2026-08835 which is on hold pending quantity clarification. Would you like me to summarize the current state or help with a specific ticket?',
  actions: [
    { label: 'View Dashboard', type: 'navigate', target: 'dashboard' },
    { label: 'Open Hold Ticket', type: 'open-ticket', target: 'SAF-INC-2026-08835' },
  ],
};
