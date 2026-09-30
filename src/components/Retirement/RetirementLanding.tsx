import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface RetirementLandingProps {
  onOpenAccount: () => void;
  onExploreHowItWorks?: () => void;
}

export default function RetirementLanding({
  onOpenAccount,
}: RetirementLandingProps) {
  const { isDark } = useTheme();

  return (
    <div className="w-full max-w-3xl mx-auto py-8 sm:py-16 px-4">
      {/* Visual Hierarchy: Header */}
      <div className="mb-8 sm:mb-10 text-center sm:text-left">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          401(k) Account
        </h1>
      </div>

      {/* Clean First-Time Experience Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`relative overflow-hidden rounded-3xl p-8 sm:p-12 border transition-all ${
          isDark
            ? 'bg-[#0a0f1d] border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]'
            : 'bg-white border-slate-200/90 shadow-xl'
        }`}
      >
        {/* Subtle Ambient Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-lime-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ShieldCheck size={14} />
            <span>Retirement Investment</span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold">
              +20% Annual Bonus
            </span>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
              Start your 401(k) account
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-lg leading-relaxed">
              Set up your account to start building your retirement investment.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={onOpenAccount}
              className="w-full sm:w-auto py-3.5 px-8 rounded-2xl font-bold text-sm bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <span>Get Started</span>
              <ArrowRight size={16} />
            </button>
          </div>

          {/* Minimal Key Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-white/5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
              <span>Isolated 401(k) Balance</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
              <span>20% Annual CGA Bonus</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
              <span>Institutional Custody</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
