import React from 'react';
import { 
  BookOpen, 
  HelpCircle, 
  Sparkles, 
  ShieldCheck, 
  TrendingUp, 
  ArrowRight, 
  CheckCircle2, 
  Info,
  DollarSign,
  Lock,
  Layers
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export default function RetirementEducation() {
  const { isDark } = useTheme();

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Education Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-1">
          <BookOpen size={14} />
          <span>Retirement Knowledge Base</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Understanding Retirement Investing</h2>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
          Learn how long-term retirement accounts operate, how discipline compounds over time, and how the CGA 20% annual bonus functions.
        </p>
      </div>

      {/* 20% Annual CGA Bonus Visual Calculation Card (Section 19 Specification) */}
      <div className={`p-6 sm:p-8 rounded-3xl border shadow-xl relative overflow-hidden ${
        isDark 
          ? 'bg-gradient-to-br from-[#0d162e] via-[#0a1022] to-[#060a16] border-emerald-500/30' 
          : 'bg-gradient-to-br from-emerald-50/70 via-white to-slate-50 border-emerald-200'
      }`}>
        <div className="relative z-10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
            <div>
              <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <Sparkles size={15} />
                <span>Dedicated Product Benefit</span>
              </div>
              <h3 className="text-xl font-bold tracking-tight">Your 20% Annual CGA Retirement Bonus</h3>
            </div>
            <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30 self-start sm:self-auto">
              12-Month Eligibility Cycle
            </span>
          </div>

          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Eligible CGA Retirement investments can qualify for an additional annual bonus of up to <strong className="text-foreground">20% of the eligible investment amount</strong>, subject to the applicable CGA retirement terms and a 12-month holding requirement.
          </p>

          {/* Side-by-Side Visual Calculation Examples (Section 19) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Example 1 */}
            <div className={`p-5 rounded-2xl border text-center space-y-3 ${
              isDark ? 'bg-white/[0.02] border-white/10' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Example A</div>
              <div className="space-y-2">
                <div className="text-lg font-bold text-foreground">$5,000 eligible investment</div>
                <div className="text-xs font-semibold text-emerald-400 flex items-center justify-center gap-1">
                  ↓ 20% annual CGA bonus
                </div>
                <div className="text-2xl font-extrabold text-emerald-400">+$1,000 bonus</div>
                <div className="text-xs text-muted-foreground pt-1 border-t border-white/5">
                  Total After Bonus: <strong className="text-foreground">$6,000</strong>
                </div>
              </div>
            </div>

            {/* Example 2 */}
            <div className={`p-5 rounded-2xl border text-center space-y-3 ${
              isDark ? 'bg-white/[0.02] border-white/10' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Example B</div>
              <div className="space-y-2">
                <div className="text-lg font-bold text-foreground">$25,000 eligible investment</div>
                <div className="text-xs font-semibold text-emerald-400 flex items-center justify-center gap-1">
                  ↓ 20% annual CGA bonus
                </div>
                <div className="text-2xl font-extrabold text-emerald-400">+$5,000 bonus</div>
                <div className="text-xs text-muted-foreground pt-1 border-t border-white/5">
                  Total After Bonus: <strong className="text-foreground">$30,000</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Clear Distinction Banner (Section 6 & 19) */}
          <div className={`p-4 rounded-2xl border text-xs leading-relaxed flex items-start gap-2.5 ${
            isDark ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-300/90' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}>
            <Info size={17} className="text-emerald-400 shrink-0 mt-0.5" />
            <p>
              <strong>Important Distinction:</strong> This bonus is a separate CGA benefit and should not be presented as the underlying investment's market return or guaranteed investment performance. It is an isolated incentive reward recorded in your dedicated Retirement Bonus Ledger.
            </p>
          </div>
        </div>
      </div>

      {/* How CGA Retirement Works (Section 6 Specification) */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-bold tracking-tight">How CGA Retirement Works</h3>
          <p className="text-xs text-muted-foreground">Five streamlined steps designed for straightforward wealth compounding.</p>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {[
            {
              step: 'Step 1',
              title: 'Open Your Account',
              desc: 'Create your CGA Retirement Account and complete the required account information. Your retirement profile is securely connected to your CGA account with isolated ledger accounting.',
              icon: <ShieldCheck size={18} className="text-emerald-400" />
            },
            {
              step: 'Step 2',
              title: 'Fund Your Account',
              desc: 'Add funds according to the applicable contribution and account rules. Your retirement balance is tracked separately from your regular CGA wallet.',
              icon: <DollarSign size={18} className="text-blue-400" />
            },
            {
              step: 'Step 3',
              title: 'Choose Your Investment',
              desc: 'Select an eligible retirement investment option available through the plan. Your investment activity and retirement balance are displayed in one place.',
              icon: <Layers size={18} className="text-purple-400" />
            },
            {
              step: 'Step 4',
              title: 'Your Investment Works Over Time',
              desc: 'Your retirement funds remain invested according to the selected investment strategy. Investment values can change depending on underlying investment performance.',
              icon: <TrendingUp size={18} className="text-amber-400" />
            },
            {
              step: 'Step 5',
              title: 'Receive Eligible CGA Bonus Benefits',
              desc: 'Eligible CGA Retirement investments can qualify for an additional annual bonus of up to 20% of the eligible investment amount, subject to applicable CGA retirement terms and 12-month eligibility cycles.',
              icon: <Sparkles size={18} className="text-lime-400" />
            }
          ].map((item, idx) => (
            <div
              key={idx}
              className={`p-4 sm:p-5 rounded-2xl border flex items-start gap-4 transition-all ${
                isDark ? 'bg-[#0b1021]/80 border-white/10' : 'bg-white border-slate-200'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                {item.icon}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">{item.step}</span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <h4 className="text-sm font-bold text-foreground">{item.title}</h4>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Core Educational Concepts (Section 18 Specification) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* What is a 401(k)? */}
        <div className={`p-6 rounded-3xl border space-y-3 ${
          isDark ? 'bg-[#0b1021]/80 border-white/10' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center gap-2 text-emerald-400">
            <HelpCircle size={18} />
            <h4 className="text-sm font-bold text-foreground">What is a 401(k)?</h4>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            A 401(k) is a U.S. employer-sponsored retirement plan that allows eligible employees to contribute part of their compensation into an individual account, with the money generally invested according to the plan's available options.
          </p>
          <div className="text-[11px] text-muted-foreground/80 pt-2 border-t border-white/5">
            The IRS describes 401(k)s as qualified plans that can provide tax advantages and allow employer contributions depending on the plan structure and applicable law.
          </div>
        </div>

        {/* How does the money grow? */}
        <div className={`p-6 rounded-3xl border space-y-3 ${
          isDark ? 'bg-[#0b1021]/80 border-white/10' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center gap-2 text-blue-400">
            <TrendingUp size={18} />
            <h4 className="text-sm font-bold text-foreground">How does the money grow?</h4>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Your retirement balance can change through new contributions, investment gains or losses, applicable employer contributions, bonuses, and fees.
          </p>
          <div className="text-[11px] text-muted-foreground/80 pt-2 border-t border-white/5">
            The U.S. Department of Labor notes that defined-contribution retirement account values depend on contributions, investment performance, and applicable fees.
          </div>
        </div>
      </div>

      {/* Regulatory & Jurisdictional Disclosure (Section 2) */}
      <div className={`p-4 rounded-2xl border text-xs leading-relaxed text-muted-foreground ${
        isDark ? 'bg-white/[0.01] border-white/5' : 'bg-slate-50 border-slate-200'
      }`}>
        <strong className="text-foreground">Important Disclosure:</strong> Retirement account eligibility, tax treatment, contribution limits, withdrawals, and applicable benefits depend on the plan structure, jurisdiction, and applicable laws. CGA provides retirement-focused investment accounts designed to help users build long-term wealth with isolated ledger protection and dedicated annual platform bonuses.
      </div>
    </div>
  );
}
