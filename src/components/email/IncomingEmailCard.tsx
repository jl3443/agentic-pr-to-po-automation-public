import { useState } from 'react';
import { Mail, ChevronDown, ChevronUp, Sparkles, Paperclip } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EmailItem } from '@/data/types';

interface IncomingEmailCardProps {
  email: EmailItem;
  agentNote: string;
}

export function IncomingEmailCard({ email, agentNote }: IncomingEmailCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50/60 overflow-hidden">
      {/* Header row */}
      <button
        onClick={() => setExpanded(p => !p)}
        className="w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-blue-50 transition-colors"
      >
        {/* Avatar */}
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white text-[11px] font-bold mt-0.5">
          {email.from.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-800 truncate">{email.from}</span>
            <div className="flex items-center gap-1.5 ml-2 shrink-0">
              <span className="text-[10px] text-slate-400">{email.date}</span>
              {expanded ? <ChevronUp size={12} className="text-slate-400" /> : <ChevronDown size={12} className="text-slate-400" />}
            </div>
          </div>
          <p className="text-[11px] font-medium text-slate-700 mt-0.5">{email.subject}</p>
          {!expanded && <p className="text-[10px] text-slate-500 mt-0.5 truncate">{email.preview}</p>}
        </div>
      </button>

      {/* Expanded body */}
      {expanded && (
        <div className="border-t border-blue-200 px-3 py-2 bg-white">
          <div className="space-y-0.5 mb-2 text-[10px] text-slate-500">
            <div><span className="font-medium">From:</span> {email.from} &lt;{email.fromEmail}&gt;</div>
            <div><span className="font-medium">To:</span> {email.to} &lt;{email.toEmail}&gt;</div>
            {email.cc && <div><span className="font-medium">CC:</span> {email.cc}</div>}
          </div>
          <p className="text-[11px] text-slate-700 leading-relaxed whitespace-pre-line">{email.body}</p>
          {email.attachments.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {email.attachments.map(a => (
                <span key={a} className="flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">
                  <Paperclip size={9} />{a}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* AI Agent note */}
      <div className="border-t border-blue-200 px-3 py-1.5 bg-blue-100/50 flex items-center gap-1.5">
        <Sparkles size={11} className="text-blue-600 shrink-0" />
        <p className="text-[10px] text-blue-700">{agentNote}</p>
      </div>
    </div>
  );
}

// Compact mail icon badge for use in flows
export function EmailBadge({ label, className }: { label: string; className?: string }) {
  return (
    <div className={cn('flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[10px] font-medium text-blue-700', className)}>
      <Mail size={11} />
      {label}
    </div>
  );
}
