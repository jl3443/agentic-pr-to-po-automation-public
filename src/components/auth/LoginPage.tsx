import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, LogIn, AlertCircle, FileText, CheckSquare, Sparkles } from 'lucide-react';
import type { Persona } from '@/data/types';

interface LoginPageProps {
  onLogin: (persona: Persona) => void;
}

const DEMO_ACCOUNTS: {
  email: string;
  password: string;
  persona: Persona;
  label: string;
  role: string;
  description: string;
  color: string;
  icon: React.ReactNode;
}[] = [
  {
    email: 'maker@company.com',
    password: 'Demo@2026',
    persona: 'maker',
    label: 'Maker',
    role: 'PO Maker',
    description: 'Create & validate purchase orders',
    color: 'blue',
    icon: <FileText size={18} />,
  },
  {
    email: 'checker@company.com',
    password: 'Demo@2026',
    persona: 'checker',
    label: 'Checker',
    role: 'PO Checker',
    description: 'Review, approve & release POs',
    color: 'emerald',
    icon: <CheckSquare size={18} />,
  },
];

const FEATURES = [
  'AI-powered RFX document extraction',
  'Automated PO creation via SAP integration',
  'Quantity & price mismatch detection',
  'Maker–Checker dual-approval workflow',
  'Exception resolution with email loop-back',
];

export function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const match = DEMO_ACCOUNTS.find(
      (a) => a.email === email.trim().toLowerCase() && a.password === password
    );
    if (!match) { setError('Invalid email or password.'); return; }
    setLoading(true);
    setTimeout(() => onLogin(match.persona), 700);
  };

  const fillAccount = (acc: typeof DEMO_ACCOUNTS[0]) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setError('');
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* ── Left panel: Branding ── */}
      <motion.div
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="lg:w-[440px] flex-shrink-0 bg-gradient-to-br from-[#040d1e] via-[#071a3e] to-[#040d1e] flex flex-col justify-between px-10 py-12 relative overflow-hidden"
      >
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-80px] right-[-80px] w-72 h-72 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="absolute bottom-[-60px] left-[-60px] w-60 h-60 rounded-full bg-blue-600/10 blur-3xl" />
        </div>

        <div className="relative">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 border border-white/20">
              <Sparkles size={18} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">Agentic PR to PO Automation</p>
              <p className="text-blue-200 text-[10px]">AI-Powered Procurement Intelligence</p>
            </div>
          </div>

          {/* Headline */}
          <div className="mt-8">
            <h1 className="text-3xl font-bold text-white leading-tight">
              Intelligent
              <br />
              <span className="text-blue-200">PO Automation</span>
            </h1>
            <p className="mt-4 text-blue-100/80 text-sm leading-relaxed">
              AI agents that extract, validate, and create purchase orders
              from RFX documents — with full Maker–Checker governance.
            </p>
          </div>

          {/* Feature list */}
          <div className="mt-10 space-y-3">
            {FEATURES.map((feat) => (
              <div key={feat} className="flex items-center gap-2.5">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-200 shrink-0" />
                <span className="text-blue-100/90 text-sm">{feat}</span>
              </div>
            ))}
          </div>

          {/* Stats strip */}
          <div className="mt-10 grid grid-cols-3 gap-3">
            {[
              { value: '632', label: 'POs Created' },
              { value: '58%', label: 'Zero-Touch' },
              { value: '5.1m', label: 'Avg. Time' },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-white/10 border border-white/15 px-3 py-2.5 text-center">
                <p className="text-white font-bold text-lg leading-tight">{s.value}</p>
                <p className="text-blue-200 text-[10px] mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative mt-12 border-t border-white/15 pt-6">
          <p className="text-blue-200/60 text-xs">Demo environment · All data is fictitious</p>
          <p className="text-blue-200/40 text-[11px] mt-1">Agentic PR to PO Automation v1.0 · Procurement Shared Services</p>
        </div>
      </motion.div>

      {/* ── Right panel: Login form ── */}
      <div className="flex-1 bg-slate-50 flex items-center justify-center px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="w-full max-w-sm"
        >
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Sign in</h2>
            <p className="mt-1 text-sm text-slate-500">Access your procurement workspace</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email (masked as password) */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                Email
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  autoComplete="username"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400
                             focus:outline-none focus:ring-2 focus:ring-[#084A90] focus:border-transparent transition pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400
                             focus:outline-none focus:ring-2 focus:ring-[#084A90] focus:border-transparent transition pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5"
              >
                <AlertCircle size={14} className="text-red-500 shrink-0" />
                <span className="text-xs text-red-600">{error}</span>
              </motion.div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#084A90] hover:bg-[#052E5A]
                         text-white text-sm font-semibold py-2.5 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                <><LogIn size={15} /> Sign In</>
              )}
            </button>
          </form>

          {/* Persona cards */}
          <div className="mt-8">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-3">
              Demo personas — click to fill
            </p>
            <div className="flex gap-2.5">
              {DEMO_ACCOUNTS.map((acc) => {
                const isBlue = acc.color === 'blue';
                return (
                  <button
                    key={acc.persona}
                    type="button"
                    onClick={() => fillAccount(acc)}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-xl border py-3 font-semibold text-sm transition
                      ${isBlue
                        ? 'border-blue-200 bg-blue-50/60 text-[#084A90] hover:border-[#084A90] hover:bg-blue-50'
                        : 'border-emerald-200 bg-emerald-50/60 text-emerald-700 hover:border-emerald-500 hover:bg-emerald-50'
                      }`}
                  >
                    {acc.icon}
                    {acc.role.replace('PO ', '')}
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
