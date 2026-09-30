import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  Sparkles, 
  AlertCircle,
  HelpCircle,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { calculateRetirementProjection } from '../../services/retirementService';

interface RetirementCalculatorProps {
  initialBalance?: number;
}

export default function RetirementCalculator({ initialBalance = 10000 }: RetirementCalculatorProps) {
  const { isDark } = useTheme();

  const [currentBalance, setCurrentBalance] = useState<number>(initialBalance || 10000);
  const [monthlyContribution, setMonthlyContribution] = useState<number>(500);
  const [currentAge, setCurrentAge] = useState<number>(32);
  const [targetAge, setTargetAge] = useState<number>(65);
  const [expectedReturn, setExpectedReturn] = useState<number>(7); // 7% annual market return
  const [cgaBonusRate, setCgaBonusRate] = useState<number>(20); // 20% CGA annual bonus

  const projection = useMemo(() => {
    return calculateRetirementProjection(
      currentBalance,
      monthlyContribution,
      currentAge,
      targetAge,
      expectedReturn / 100,
      cgaBonusRate / 100
    );
  }, [currentBalance, monthlyContribution, currentAge, targetAge, expectedReturn, cgaBonusRate]);

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-1">
          <Calculator size={14} />
          <span>Interactive Wealth Planner</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Retirement Goal Calculator</h2>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
          Simulate how consistent monthly contributions, market compounding, and the 20% annual CGA retirement bonus can accumulate toward your future.
        </p>
      </div>

      {/* Main Grid: Inputs Left, Projections Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Inputs Column */}
        <div className={`lg:col-span-5 rounded-3xl border p-6 space-y-4 ${
          isDark ? 'bg-[#0b1021]/80 border-white/10' : 'bg-white border-slate-200'
        }`}>
          <h3 className="text-sm font-bold flex items-center gap-2">
            <span>Projection Variables</span>
          </h3>

          <div className="space-y-3.5 text-xs">
            {/* Current Retirement Balance */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-muted-foreground">Starting Retirement Balance</span>
                <span className="font-bold text-foreground">${currentBalance.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="0"
                max="250000"
                step="2500"
                value={currentBalance}
                onChange={(e) => setCurrentBalance(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* Monthly Contribution */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-muted-foreground">Monthly Contribution</span>
                <span className="font-bold text-foreground">${monthlyContribution.toLocaleString()}/mo</span>
              </div>
              <input
                type="range"
                min="50"
                max="5000"
                step="50"
                value={monthlyContribution}
                onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* Age Sliders */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-muted-foreground">Current Age</span>
                  <span className="font-bold text-foreground">{currentAge}</span>
                </div>
                <input
                  type="number"
                  min="18"
                  max="80"
                  value={currentAge}
                  onChange={(e) => setCurrentAge(Math.min(targetAge - 1, Number(e.target.value)))}
                  className={`w-full px-3 py-1.5 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                    isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-muted-foreground">Target Age</span>
                  <span className="font-bold text-foreground">{targetAge}</span>
                </div>
                <input
                  type="number"
                  min={currentAge + 1}
                  max="90"
                  value={targetAge}
                  onChange={(e) => setTargetAge(Math.max(currentAge + 1, Number(e.target.value)))}
                  className={`w-full px-3 py-1.5 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                    isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>
            </div>

            {/* Expected Market Return */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-muted-foreground">Expected Market Return</span>
                <span className="font-bold text-foreground">{expectedReturn}% / yr</span>
              </div>
              <input
                type="range"
                min="3"
                max="14"
                step="0.5"
                value={expectedReturn}
                onChange={(e) => setExpectedReturn(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <span className="text-[10px] text-muted-foreground">Historical broad market benchmarks ~6–8%</span>
            </div>

            {/* Annual CGA Bonus Rate */}
            <div className={`p-3 rounded-2xl border ${
              isDark ? 'bg-emerald-950/20 border-emerald-500/20' : 'bg-emerald-50/80 border-emerald-200'
            }`}>
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-emerald-400 flex items-center gap-1">
                  <Sparkles size={13} /> Annual CGA Bonus
                </span>
                <span className="font-bold text-emerald-400">+{cgaBonusRate}%</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                Separate annual platform benefit for eligible 12-month holding cycles.
              </p>
            </div>
          </div>
        </div>

        {/* Projections Output Column */}
        <div className={`lg:col-span-7 rounded-3xl border p-6 space-y-6 ${
          isDark 
            ? 'bg-gradient-to-br from-[#0c142e] to-[#070b18] border-white/10' 
            : 'bg-gradient-to-br from-white to-slate-50 border-slate-200'
        }`}>
          {/* Prominent Projected Output Label (Section 20 Requirement) */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-0.5">
                Illustrative Projection
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-foreground">
                ${projection.finalTotal.toLocaleString()}
              </h3>
              <p className="text-xs text-muted-foreground">
                Projected total balance at age {targetAge} ({projection.years} years of compounding)
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                Age {targetAge} Milestone
              </span>
            </div>
          </div>

          {/* Breakdown Pills */}
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className={`p-3 rounded-2xl border ${isDark ? 'bg-white/[0.02] border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
              <span className="text-[10px] text-muted-foreground block mb-0.5">Your Contributions</span>
              <span className="font-bold text-sm text-foreground">${projection.finalContributed.toLocaleString()}</span>
            </div>

            <div className={`p-3 rounded-2xl border ${isDark ? 'bg-white/[0.02] border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
              <span className="text-[10px] text-muted-foreground block mb-0.5">Market Compounding</span>
              <span className="font-bold text-sm text-blue-400">+${Math.round(projection.finalMarketValue - projection.finalContributed).toLocaleString()}</span>
            </div>

            <div className={`p-3 rounded-2xl border ${isDark ? 'bg-white/[0.02] border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
              <span className="text-[10px] text-muted-foreground block mb-0.5">CGA Annual Bonuses</span>
              <span className="font-bold text-sm text-emerald-400">+${projection.finalCumulativeBonus.toLocaleString()}</span>
            </div>
          </div>

          {/* Horizon Milestones Table Preview */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-muted-foreground block">Compounding Milestones</span>
            <div className="space-y-1.5">
              {projection.projectionByYear
                .filter((p, i, arr) => i === 0 || p.year === 5 || p.year === 10 || p.year === 20 || i === arr.length - 1)
                .map((m) => (
                  <div
                    key={m.year}
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                      isDark ? 'bg-white/[0.02] border-white/5' : 'bg-slate-50 border-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">Year {m.year}</span>
                      <span className="text-muted-foreground">• Age {m.age}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground">Contrib: ${m.totalContributed.toLocaleString()}</span>
                      <span className="font-bold text-emerald-400">${m.totalProjectedBalance.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Mandatory Section 20 Disclaimer */}
          <div className={`p-3.5 rounded-2xl border text-[11px] leading-relaxed flex items-start gap-2 ${
            isDark ? 'bg-amber-950/20 border-amber-500/20 text-amber-200/90' : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}>
            <AlertCircle size={15} className="text-amber-400 shrink-0 mt-0.5" />
            <p>
              <strong>Important Disclaimer:</strong> This calculator produces an illustrative projection based solely on user-selected inputs and mathematical assumptions. It does not present projected figures as guaranteed outcomes or investment advice. Actual market returns fluctuate, and bonus eligibility requires fulfilling plan terms.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
