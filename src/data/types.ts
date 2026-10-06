// ---------------------------------------------------------------------------
// PO Orchestrator — Indirect Procurement (RFX Path)
// Type Definitions
// ---------------------------------------------------------------------------

// --- Persona ---
export type Persona = 'maker' | 'checker';

// --- View ---
export type ViewTab = 'dashboard' | 'analytics' | 'inbox' | 'sent';

// --- RFX Ticket Status ---
export type RfxStatus =
  | 'new'
  | 'extracting'
  | 'identifying'
  | 'validating'
  | 'hold'
  | 'po-creating'
  | 'po-created'
  | 'pending-qc'
  | 'releasing'
  | 'released'
  | 'updating-ticket'
  | 'completed'
  | 'rejected';

// --- Agent Definitions ---
export type AgentId =
  | 'content-extraction'
  | 'scenario-identification'
  | 'validation'
  | 'po-creation'
  | 'po-release'
  | 'ticket-updation';

export type AgentStatus = 'pending' | 'running' | 'complete' | 'error' | 'hold' | 'skipped';

export interface AgentExecution {
  agentId: AgentId;
  label: string;
  status: AgentStatus;
  startedAt?: string;
  completedAt?: string;
  duration?: string;
  output?: string;
  fieldsProcessed?: number;
  confidence?: number;
}

// --- Extracted RFX Data (15+ fields) ---
export interface RfxExtractedData {
  rfxNumber: string;
  rfxType: string;
  indentNumber: string;
  prNumber: string;
  prCreatorName: string;
  materialNumber: string;
  materialDescription: string;
  category: string;
  commodityVertical: string;
  plant: string;
  plantDescription: string;
  storageLocation: string;
  quantity: number;
  unit: string;
  currentValueLacs: number;
  cumulativeValueLacs: number;
  purchasingOrg: string;
  purchasingGroup: string;
  rfxDate: string;
  email: string;
  procurementType: string;
  docsAvailable: DocStatus[];
}

export interface DocStatus {
  name: string;
  type: 'rfx-pdf' | 'annexure' | 'rate-negotiation' | 'approval' | 'quotation';
  present: boolean;
  fileName?: string;
}

// --- Portal Values (from RMS portal) ---
export interface PortalValues {
  ticketId: string;
  rfxNumber: string;
  requestDate: string;
  requesterName: string;
  requesterDepartment: string;
  location: string;
  contactNo: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  subCategory: string;
  remarks: string;
  portalQuantity: number;
  portalUnit: string;
}

// --- Supplier Quotes (from RFX comparison) ---
export interface SupplierQuote {
  supplierCode: string;
  supplierName: string;
  location: string;
  rfxResponseNo: string;
  validityStart: string;
  validityEnd: string;
  basicRate: number;
  negotiatedRate: number;
  netLandedRate: number;
  taxCode: string;
  paymentTerms: string;
  deliveryTerms: string;
  deliveryDays: number;
  sobPercent: number;
  sobValueLacs: number;
  level: string;
  selected: boolean;
}

// --- Scenario Identification ---
export interface ScenarioResult {
  scenarioType: string;
  confidence: number;
  reasoning: string;
  matchedRules: string[];
  procurementCategory: string;
}

// --- Validation Result ---
export interface ValidationResult {
  status: 'pass' | 'fail' | 'warning';
  checks: ValidationCheck[];
  overallConfidence: number;
  holdReason?: string;
  passCount: number;
  failCount: number;
  warningCount: number;
}

export interface ValidationCheck {
  field: string;
  label: string;
  expected: string;
  actual: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
}

// --- SAP PO Data ---
export interface SapPoData {
  poNumber: string;
  poType: string;
  companyCode: string;
  purchasingOrg: string;
  purchasingGroup: string;
  supplierCode: string;
  supplierName: string;
  createdBy: string;
  createdDate: string;
  validityStart: string;
  validityEnd: string;
  lineItems: SapPoLineItem[];
  totalValue: number;
  currency: string;
  incoterms: string;
  incotermsLocation: string;
  paymentTerms: string;
  status: 'created' | 'released' | 'amended';
}

export interface SapPoLineItem {
  itemNumber: string;
  materialNumber: string;
  description: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalPrice: number;
  plant: string;
  storageLocation: string;
  materialGroup: string;
  taxCode: string;
  deliveryDate: string;
}

// --- Checker QC Review ---
export interface CheckerReview {
  reviewerName: string;
  reviewDate?: string;
  status: 'pending' | 'approved' | 'rejected' | 'hold';
  notes?: string;
  revalidationChecks: ValidationCheck[];
}

// --- Exception: RFX Mismatch ---
export interface RfxMismatch {
  type: 'rfx-mismatch';
  mismatches: { field: string; label: string; pdfValue: string; portalValue: string; resolvedValue?: string }[];
  missingDocs: string[];
  emailDraft: EmailDraftData;
  resolved: boolean;
}

// --- Exception: Checker Data Issue (typo in PO) ---
export interface CheckerDataException {
  type: 'checker-data-issue';
  issues: { field: string; label: string; poValue: string; correctValue: string }[];
  resolved: boolean;
}

// --- Exception: Checker Budget Exceeded ---
export interface CheckerBudgetException {
  type: 'checker-budget-issue';
  sioCode: string;
  allocatedBudget: number;
  poValue: number;
  shortfall: number;
  reason: string;
  emailDraft: EmailDraftData;
  resolved: boolean;
  requiresMakerFix?: boolean;
  budgetFixDetails?: {
    fromQty: number;
    toQty: number;
    unitPrice: number;
    unit: string;
  };
  /** SAP PO data to create after budget is resolved */
  pendingSapPo?: SapPoData;
}

// --- Exception: Post-PO Amendment ---
export interface PostPoAmendment {
  type: 'post-po-amendment';
  amendments: AmendmentItem[];
  reason: string;
  requesterName: string;
  requesterEmail: string;
  poNumber: string;
  originalTotalValue: number;
  amendedTotalValue: number;
  resolved: boolean;
}

export interface AmendmentItem {
  field: string;
  label: string;
  originalValue: string;
  requestedValue: string;
  impact: string;
}

// --- Email Draft ---
export interface EmailDraftData {
  to: string;
  cc: string;
  subject: string;
  body: string;
  attachments: string[];
}

// --- Email Item (Inbox / Sent) ---
export interface EmailItem {
  id: string;
  from: string;
  fromEmail: string;
  to: string;
  toEmail: string;
  cc?: string;
  subject: string;
  preview: string;
  body: string;
  date: string;
  read: boolean;
  attachments: string[];
  type: 'incoming' | 'outgoing';
  relatedTicketId?: string;
  relatedPO?: string;
  isReply?: boolean; // true = this is the simulated reply arriving in inbox
  forPersona?: 'maker' | 'checker'; // which persona sees this email (undefined = both)
}

// --- Main RFX Ticket (replaces PurchaseRequisition) ---
export interface RfxTicket {
  id: string;
  rfxId: string;
  status: RfxStatus;
  priority: 'critical' | 'high' | 'medium' | 'low';
  extractedData: RfxExtractedData;
  portalValues: PortalValues;
  supplierQuotes: SupplierQuote[];
  scenarioResult?: ScenarioResult;
  validationResult?: ValidationResult;
  sapPo?: SapPoData;
  checkerReview?: CheckerReview;
  agentExecutions: AgentExecution[];
  workflowStage: number;
  exception?: RfxMismatch | PostPoAmendment | CheckerDataException | CheckerBudgetException;
  totalValue: number;
  createdAt: string;
}

// --- Demo Scenario (replaces PoScenario) ---
export interface DemoScenario {
  id: string;
  name: string;
  description: string;
  primaryPriority: 'critical' | 'high' | 'medium' | 'low';
  tickets: RfxTicket[];
  emails: EmailItem[];
  dashboardStats: {
    totalTickets: number;
    inProgress: number;
    onHold: number;
    completed: number;
    avgProcessingTime: string;
    aiAccuracy: number;
    autoCreatedPO: number;
    avgPoCreationTime: string;
    zeroTouchRate: number;
    exceptionRate: number;
  };
  aiHeroSummary: string;
  aiHeroChips: { label: string; type: 'critical' | 'warning' | 'positive' }[];
}

// --- Escalation Target (kept for notification flows) ---
export interface EscalationTarget {
  id: string;
  role: string;
  name: string;
  organization: string;
  status: 'pending' | 'sent' | 'confirmed';
}
