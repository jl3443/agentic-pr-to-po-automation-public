import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Upload,
  CheckCircle2,
  Loader2,
  FileText,
  Cpu,
  GitMerge,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocumentUploadZoneProps {
  compact?: boolean;
  onUploadComplete?: (fileName: string) => void;
}

type UploadState = 'idle' | 'processing' | 'result';

interface AiStage {
  id: string;
  label: string;
  detail: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Icon: any;
  durationMs: number;
  resultLine: string;
}

function getDocumentStages(fileName: string): AiStage[] {
  const n = fileName.toLowerCase();
  const isISF = n.includes('isf') || n.includes('importer');
  const isBOL = n.includes('bol') || n.includes('lading');

  return [
    {
      id: 'ocr',
      label: 'OCR Extraction',
      detail: isISF
        ? 'Extracting CBP ISF-10+2 fields & consignee data...'
        : isBOL
        ? 'Extracting vessel, container, and cargo fields...'
        : 'Reading document fields & signatures...',
      Icon: FileText,
      durationMs: 750,
      resultLine: isISF
        ? 'Confidence: 97% — 12 ISF-10+2 fields extracted'
        : isBOL
        ? 'Confidence: 99% — BOL v3 fields & vessel data extracted'
        : 'Confidence: 98% — 9 fields extracted',
    },
    {
      id: 'classify',
      label: 'Classify Agent',
      detail: isISF
        ? 'Verifying ISF completeness vs CBP §149 requirements...'
        : isBOL
        ? 'Resolving BOL version conflict vs carrier EDI record...'
        : 'Identifying document type and compliance requirements...',
      Icon: Cpu,
      durationMs: 950,
      resultLine: isISF
        ? 'ISF-10+2 confirmed — CN→US Ocean, all fields present ✓'
        : isBOL
        ? 'BOL v3 validated — version conflict cleared ✓'
        : 'Document classified — compliance check passed ✓',
    },
    {
      id: 'validate',
      label: 'Confirm Validation',
      detail: isISF
        ? 'Cross-referencing with PO-2024-8894 & MSKU-7294810...'
        : isBOL
        ? 'Matching consignee vs importer bond and ISF data...'
        : 'Updating validated document package...',
      Icon: GitMerge,
      durationMs: 650,
      resultLine: isISF
        ? 'ISF filed — CBP compliance restored, exception resolved ✓'
        : isBOL
        ? 'BOL v3 accepted — exception EXC-006 resolved ✓'
        : 'Document added to shipment pack ✓',
    },
  ];
}

export function DocumentUploadZone({ compact, onUploadComplete }: DocumentUploadZoneProps) {
  const [state, setState] = useState<UploadState>('idle');
  const [fileName, setFileName] = useState('');
  const [progress, setProgress] = useState(0);
  const [completedIdxs, setCompletedIdxs] = useState<Set<number>>(new Set());
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [activeStages, setActiveStages] = useState<AiStage[]>(() => getDocumentStages(''));
  const inputRef = useRef<HTMLInputElement>(null);
  const startTimeRef = useRef<number>(0);
  const progressRafRef = useRef<number>(0);
  const stageTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(progressRafRef.current);
      stageTimersRef.current.forEach(clearTimeout);
    };
  }, []);

  const simulateUpload = useCallback(
    (name: string) => {
      cancelAnimationFrame(progressRafRef.current);
      stageTimersRef.current.forEach(clearTimeout);
      stageTimersRef.current = [];

      const stages = getDocumentStages(name);
      const totalDuration = stages.reduce((s, st) => s + st.durationMs, 0);

      setFileName(name);
      setActiveStages(stages);
      setState('processing');
      setProgress(0);
      setCompletedIdxs(new Set());
      setCurrentIdx(0);
      startTimeRef.current = performance.now();

      const animateProgress = () => {
        const elapsed = performance.now() - startTimeRef.current;
        const ratio = Math.min(elapsed / totalDuration, 1);
        setProgress(Math.round(ratio * 96));
        if (ratio < 1) {
          progressRafRef.current = requestAnimationFrame(animateProgress);
        }
      };
      progressRafRef.current = requestAnimationFrame(animateProgress);

      let cumulative = 0;
      stages.forEach((stage, idx) => {
        cumulative += stage.durationMs;
        const t = setTimeout(() => {
          setCompletedIdxs((prev) => new Set([...prev, idx]));
          setCurrentIdx(idx + 1);

          if (idx === stages.length - 1) {
            cancelAnimationFrame(progressRafRef.current);
            setProgress(100);
            const resultTimer = setTimeout(() => {
              setState('result');
              onUploadComplete?.(name);
              const resetTimer = setTimeout(() => {
                setState('idle');
                setFileName('');
                setProgress(0);
                setCompletedIdxs(new Set());
                setCurrentIdx(0);
              }, 3500);
              stageTimersRef.current.push(resetTimer);
            }, 150);
            stageTimersRef.current.push(resultTimer);
          }
        }, cumulative);
        stageTimersRef.current.push(t);
      });
    },
    [onUploadComplete]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f) simulateUpload(f.name);
    },
    [simulateUpload]
  );

  // ── Result view ──────────────────────────────────────────────────────
  if (state === 'result') {
    return (
      <div className={cn(
        'rounded-lg border border-green-200 bg-green-50/80',
        compact ? 'px-3 py-2.5' : 'px-4 py-4'
      )}>
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
          <span className="text-xs font-semibold text-green-800">AI Validation Complete</span>
          <span className="ml-auto text-[10px] text-green-600 font-medium bg-green-100 rounded-full px-2 py-0.5">Validated</span>
        </div>
        {!compact && (
          <div className="mt-1.5 space-y-1">
            {activeStages.map((stage) => (
              <div key={stage.id} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-2.5 w-2.5 text-green-500 shrink-0" />
                <span className="text-[10px] text-green-700">
                  <span className="font-medium">{stage.label}:</span> {stage.resultLine}
                </span>
              </div>
            ))}
          </div>
        )}
        {compact && (
          <p className="text-[10px] text-green-700 truncate">{fileName} — all checks passed</p>
        )}
      </div>
    );
  }

  // ── Processing view ───────────────────────────────────────────────────
  if (state === 'processing') {
    return (
      <div className={cn(
        'rounded-lg border border-slate-200 bg-white shadow-sm',
        compact ? 'px-3 py-2.5' : 'px-4 py-4'
      )}>
        <div className="flex items-center gap-2 mb-2.5">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
          <span className="text-xs font-semibold text-foreground truncate flex-1 min-w-0">
            {fileName}
          </span>
          <span className="text-[10px] font-mono text-muted-foreground tabular-nums shrink-0">
            {progress}%
          </span>
        </div>

        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden mb-3">
          <div
            className="h-full rounded-full bg-primary transition-none"
            style={{ width: `${progress}%` }}
          />
        </div>

        {compact ? (
          <div className="flex items-center gap-1.5">
            <Loader2 className="h-2.5 w-2.5 animate-spin text-primary shrink-0" />
            <span className="text-[10px] text-muted-foreground">
              {currentIdx < activeStages.length
                ? activeStages[currentIdx].detail
                : 'Finalising...'}
            </span>
          </div>
        ) : (
          <div className="space-y-1.5">
            {activeStages.map((stage, idx) => {
              const done = completedIdxs.has(idx);
              const active = idx === currentIdx && !done;
              const pending = idx > currentIdx;
              const { Icon } = stage;
              return (
                <div
                  key={stage.id}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors',
                    done && 'bg-green-50',
                    active && 'bg-primary/5',
                    pending && 'opacity-40'
                  )}
                >
                  <div className={cn(
                    'h-5 w-5 rounded-full flex items-center justify-center shrink-0',
                    done && 'bg-green-100',
                    active && 'bg-primary/10',
                    pending && 'bg-muted'
                  )}>
                    {done && <CheckCircle2 className="h-3 w-3 text-green-600" />}
                    {active && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
                    {pending && <Icon className="h-3 w-3 text-muted-foreground" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <span className={cn(
                      'text-[11px] font-medium',
                      done && 'text-green-700',
                      active && 'text-foreground',
                      pending && 'text-muted-foreground'
                    )}>
                      {stage.label}
                    </span>
                    {active && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">{stage.detail}</p>
                    )}
                    {done && (
                      <p className="text-[10px] text-green-600 mt-0.5">{stage.resultLine}</p>
                    )}
                  </div>

                  {done && (
                    <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ── Idle / Drop zone ──────────────────────────────────────────────────
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={cn(
        'rounded-lg border-2 border-dashed cursor-pointer transition-all',
        'flex flex-col items-center',
        isDragOver
          ? 'border-primary bg-primary/5 scale-[1.01]'
          : 'border-border hover:border-primary/40 hover:bg-muted/40',
        compact ? 'px-3 py-3' : 'px-4 py-6'
      )}
    >
      <div className={cn(
        'rounded-full flex items-center justify-center mb-1.5 transition-colors',
        compact ? 'h-7 w-7' : 'h-9 w-9',
        isDragOver ? 'bg-primary/10' : 'bg-muted'
      )}>
        <Upload className={cn(
          'transition-colors',
          compact ? 'h-3.5 w-3.5' : 'h-4 w-4',
          isDragOver ? 'text-primary' : 'text-muted-foreground'
        )} />
      </div>
      <p className={cn(
        'font-medium text-center',
        compact ? 'text-[11px]' : 'text-xs',
        isDragOver ? 'text-primary' : 'text-muted-foreground'
      )}>
        {isDragOver ? 'Drop to upload & validate' : 'Drop document for AI validation'}
      </p>
      {!compact && (
        <div className="flex items-center gap-3 mt-2">
          {[
            { icon: FileText, label: 'OCR Extract' },
            { icon: Cpu, label: 'Classify' },
            { icon: GitMerge, label: 'Validate' },
          ].map(({ icon: Icon, label }) => (
            <span key={label} className="flex items-center gap-1 text-[10px] text-muted-foreground/70">
              <Icon className="h-2.5 w-2.5" />
              {label}
            </span>
          ))}
        </div>
      )}
      {!compact && (
        <p className="text-[10px] text-muted-foreground/60 mt-1.5">PDF, XLSX, images supported</p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.xlsx,.xls,.png,.jpg,.jpeg,.html,.txt"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) simulateUpload(f.name);
        }}
      />
    </div>
  );
}
