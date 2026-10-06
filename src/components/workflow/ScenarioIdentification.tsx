import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Tag, CheckCircle } from 'lucide-react';
import type { ScenarioResult } from '@/data/types';

interface ScenarioIdentificationProps {
  scenarioResult: ScenarioResult;
  onAccept: () => void;
}

function ThinkingSteps() {
  const [stepIdx, setStepIdx] = useState(0);
  const steps = [
    'Analyzing RFX type and attributes…',
    'Matching against procurement rules…',
    'Scoring scenario confidence…',
  ];
  useEffect(() => {
    const iv = setInterval(() => setStepIdx(i => Math.min(i + 1, steps.length - 1)), 400);
    return () => clearInterval(iv);
  }, []);
  return (
    <div className="space-y-1.5 mt-2">
      {steps.map((step, i) => (
        <motion.div
          key={step}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: i <= stepIdx ? 1 : 0.3, x: 0 }}
          transition={{ duration: 0.2, delay: i * 0.05 }}
          className="flex items-center gap-1.5 text-[10px] text-slate-500"
        >
          {i < stepIdx ? (
            <CheckCircle size={10} className="text-green-500 shrink-0" />
          ) : i === stepIdx ? (
            <motion.div
              className="h-2 w-2 rounded-full bg-[#084A90] shrink-0"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
          ) : (
            <div className="h-2 w-2 rounded-full bg-slate-200 shrink-0" />
          )}
          {step}
        </motion.div>
      ))}
    </div>
  );
}

export function ScenarioIdentification({ scenarioResult, onAccept }: ScenarioIdentificationProps) {
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowResult(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-4">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Scenario Identification Agent
      </h4>

      <div className="rounded-lg border border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50 p-4">
        {!showResult ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-[#084A90] animate-spin" />
              <span className="text-xs font-medium text-slate-600">Identifying procurement scenario...</span>
            </div>
            <ThinkingSteps />
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-[#084A90]" />
              <span className="text-xs font-semibold text-[#084A90]">Scenario Identified</span>
              <span className="ml-auto rounded-full bg-[#084A90]/10 px-2 py-0.5 text-[10px] font-medium text-[#084A90]">
                {scenarioResult.confidence}% confidence
              </span>
            </div>

            <div className="flex items-center gap-2 rounded-md bg-white/60 px-3 py-2.5">
              <Tag size={16} className="text-[#084A90]" />
              <div>
                <span className="text-sm font-bold text-slate-900">{scenarioResult.scenarioType}</span>
                <p className="text-[10px] text-slate-500">{scenarioResult.procurementCategory}</p>
              </div>
            </div>

            <p className="text-sm leading-relaxed text-slate-700">{scenarioResult.reasoning}</p>

            <div className="space-y-1">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Matched Rules</span>
              <div className="flex flex-wrap gap-1.5">
                {scenarioResult.matchedRules.map((rule) => (
                  <span key={rule} className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 text-[10px] font-medium text-slate-600 ring-1 ring-slate-200">
                    <CheckCircle size={10} className="text-green-500" />
                    {rule}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {showResult && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <button
            onClick={onAccept}
            className="w-full rounded-lg bg-[#084A90] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#063A70]"
          >
            Proceed to Validation →
          </button>
        </motion.div>
      )}
    </div>
  );
}
