import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, Sparkles, Inbox, ExternalLink, Send } from 'lucide-react';
import { IncomingEmailCard } from '@/components/email/IncomingEmailCard';
import { EmailModal } from '@/components/email/EmailModal';
import type { RfxMismatch, EmailItem } from '@/data/types';

interface RfxMismatchEmailProps {
  mismatch: RfxMismatch;
  onMismatchEmailSent: (sent: EmailItem) => void;
  hasMismatchReply: boolean;
  onRevalidate: () => void;
  onGoToInbox?: () => void;
}

// Synthetic incoming email that triggered the mismatch flag
function buildTriggerEmail(mismatch: RfxMismatch): EmailItem {
  return {
    id: 'trigger-mismatch',
    from: 'Buyer',
    fromEmail: mismatch.emailDraft.to,
    to: 'PO Team',
    toEmail: 'po-team@company.com',
    subject: `RFX Request — Quantity Clarification Needed`,
    preview: 'Attached RFX and annexure for PO creation. Portal updated with revised quantity.',
    body: `Dear PO Team,

Please process the attached RFX for PO creation. The portal has been updated with the revised quantity (150 EA as per latest indent). Kindly use this as the basis.

Annexure will be shared shortly. Please proceed with PO creation at the negotiated rate.

Regards,
Buyer
Engine MRO — Réau`,
    date: '26 Mar 2026',
    read: true,
    attachments: ['RFX_3012438300.pdf'],
    type: 'incoming',
  };
}

function buildDraftEmail(mismatch: RfxMismatch): EmailItem {
  return {
    id: `draft-mismatch-${Date.now()}`,
    from: 'PO Team',
    fromEmail: 'po-team@company.com',
    to: mismatch.emailDraft.to,
    toEmail: mismatch.emailDraft.to,
    cc: mismatch.emailDraft.cc,
    subject: mismatch.emailDraft.subject,
    preview: mismatch.emailDraft.body.slice(0, 80) + '…',
    body: mismatch.emailDraft.body,
    date: new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }),
    read: true,
    attachments: mismatch.emailDraft.attachments,
    type: 'outgoing',
  };
}

export function RfxMismatchEmail({
  mismatch,
  onMismatchEmailSent,
  hasMismatchReply,
  onRevalidate,
  onGoToInbox,
}: RfxMismatchEmailProps) {
  const [emailSent, setEmailSent] = useState(false);
  const [showComposeModal, setShowComposeModal] = useState(false);

  const triggerEmail = buildTriggerEmail(mismatch);
  const draftEmail = buildDraftEmail(mismatch);

  const handleModalSend = (sent: EmailItem) => {
    setEmailSent(true);
    setShowComposeModal(false);
    onMismatchEmailSent(sent);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          RFX Mismatch — Clarification Required
        </h4>
        {onGoToInbox && (
          <button
            onClick={() => {
              setShowComposeModal(false);
              onGoToInbox();
            }}
            className="flex items-center gap-1 text-[11px] font-medium text-[#084A90] hover:underline"
          >
            View in Inbox <ExternalLink size={10} />
          </button>
        )}
      </div>

      {/* Incoming email that triggered the mismatch */}
      <IncomingEmailCard
        email={triggerEmail}
        agentNote="AI detected quantity discrepancy between this email's attached RFX (200 EA) and the portal value (150 EA). Escalation email drafted automatically."
      />

      {/* Mismatch Diff Table — resolved state when reply received */}
      {hasMismatchReply ? (
        <div className="rounded-lg border border-green-200 bg-green-50 overflow-hidden">
          <div className="px-3 py-2 border-b border-green-200">
            <div className="flex items-center gap-2">
              <CheckCircle size={14} className="text-green-600" />
              <span className="text-xs font-semibold text-green-700">Discrepancies Resolved</span>
            </div>
          </div>
          <div className="grid grid-cols-[1fr_1fr_1fr_1fr] gap-2 px-3 py-1.5 border-b border-green-100">
            {['Field', 'Original PDF', 'Portal Value', 'Confirmed'].map((h) => (
              <span key={h} className="text-[10px] font-semibold uppercase tracking-wide text-green-500">{h}</span>
            ))}
          </div>
          {mismatch.mismatches.map((m) => (
            <div key={m.field} className="grid grid-cols-[1fr_1fr_1fr_1fr] gap-2 px-3 py-2 text-xs border-b border-green-50 items-center">
              <span className="font-medium text-slate-700">{m.label}</span>
              <span className="text-slate-500 line-through">{m.pdfValue}</span>
              <span className="text-slate-500 line-through">{m.portalValue}</span>
              <span className="font-semibold text-green-700">{m.resolvedValue ?? m.pdfValue} ✓</span>
            </div>
          ))}
          {mismatch.missingDocs.length > 0 && (
            <div className="px-3 py-2">
              <span className="text-[10px] font-semibold text-green-600">Documents Received:</span>
              {mismatch.missingDocs.map((doc) => (
                <p key={doc} className="text-xs text-green-600 mt-0.5">✓ {doc}</p>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-red-200 bg-red-50 overflow-hidden">
          <div className="px-3 py-2 border-b border-red-200">
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} className="text-red-600" />
              <span className="text-xs font-semibold text-red-700">Field Discrepancies</span>
            </div>
          </div>
          <div className="grid grid-cols-[1fr_1fr_1fr] gap-2 px-3 py-1.5 border-b border-red-100">
            {['Field', 'PDF Value', 'Portal Value'].map((h) => (
              <span key={h} className="text-[10px] font-semibold uppercase tracking-wide text-red-400">{h}</span>
            ))}
          </div>
          {mismatch.mismatches.map((m) => (
            <div key={m.field} className="grid grid-cols-[1fr_1fr_1fr] gap-2 px-3 py-2 text-xs border-b border-red-50">
              <span className="font-medium text-red-700">{m.label}</span>
              <span className="font-semibold text-slate-800">{m.pdfValue}</span>
              <span className="font-semibold text-red-600">{m.portalValue}</span>
            </div>
          ))}
          {mismatch.missingDocs.length > 0 && (
            <div className="px-3 py-2">
              <span className="text-[10px] font-semibold text-red-600">Missing Documents:</span>
              {mismatch.missingDocs.map((doc) => (
                <p key={doc} className="text-xs text-red-600 mt-0.5">❌ {doc}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reply received state */}
      {hasMismatchReply ? (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 flex items-start gap-2">
            <Inbox size={16} className="text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-blue-700">Reply received from Buyer</p>
              <p className="text-[11px] text-blue-600 mt-0.5">
                Confirmed — the correct quantity is 250 EA as per the latest indent. Revised annexure attached.
              </p>
              <div className="mt-1.5 flex items-center gap-1">
                <Sparkles size={10} className="text-blue-500" />
                <span className="text-[10px] text-blue-600 font-medium">AI analyzed reply — mismatch resolved</span>
              </div>
            </div>
          </div>
          <button
            onClick={onRevalidate}
            className="mt-3 w-full rounded-lg bg-[#084A90] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#063A70]"
          >
            Confirm & Re-validate →
          </button>
        </motion.div>
      ) : emailSent ? (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="rounded-lg border border-green-200 bg-green-50 p-3 flex items-start gap-2">
            <CheckCircle size={16} className="text-green-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-green-700">Clarification email sent</p>
              <p className="text-[11px] text-green-600 mt-0.5">
                Waiting for reply from requester. Check your Inbox — a reply will arrive shortly.
              </p>
            </div>
          </div>
        </motion.div>
      ) : (
        /* Send Clarification Button */
        <button
          onClick={() => setShowComposeModal(true)}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#084A90] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#063A70]"
        >
          <Send size={14} />
          Send Clarification Email →
        </button>
      )}

      {/* Compose Modal */}
      {showComposeModal && (
        <EmailModal
          email={draftEmail}
          mode="compose"
          showFollowUp={true}
          onClose={() => setShowComposeModal(false)}
          onSend={handleModalSend}
        />
      )}
    </div>
  );
}
