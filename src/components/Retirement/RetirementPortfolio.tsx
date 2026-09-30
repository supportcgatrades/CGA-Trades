import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  Sparkles, 
  Calendar, 
  ShieldCheck, 
  ArrowRight, 
  PlusCircle, 
  Clock, 
  Layers, 
  Info,
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  RetirementInvestment, 
  RetirementInvestmentOption, 
  RETIREMENT_OPTIONS 
} from '../../services/retirementService';

interface RetirementPortfolioProps {
  investments: RetirementInvestment[];
  availableCash: number;
  onOpenInvest: (option?: RetirementInvestmentOption) => void;
  onOpenContribute: () => void;
}

export default function RetirementPortfolio({
  investments,
  availableCash,
  onOpenInvest,
  onOpenContribute
}: RetirementPortfolioProps) {
  const { isDark } = useTheme();
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const filteredInvestments = investments.filter(inv => {
    if (filter === 'all') return true;
    return inv.status === filter;
  });

  const totalInvested = investments.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const totalPotentialBonuses = investments.reduce((acc, curr) => acc + (curr.bonusAmount || 0), 0);

  return (
    <div className="space-y-8">
      {/* Portfolio Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Your Retirement Investments</h2>
          <p className="text-xs text-muted-foreground">
            Dedicated 401(k)-style long-term allocations with isolated 20% annual bonus accruals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenInvest()}
            className="py-2.5 px-4 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-black shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <PlusCircle size={15} />
            <span>New Allocation</span>
          </button>
        </div>
      </div>

      {/* Portfolio Financial Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#0b1021]/80 border-white/10' : 'bg-white border-slate-200'}`}>
          <span className="text-xs text-muted-foreground block mb-1">Total Active Principal</span>
          <div className="text-xl font-extrabold text-foreground">${totalInvested.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          <span className="text-[11px] text-muted-foreground mt-0.5 block">{investments.length} Active Positions</span>
        </div>

        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#0b1021]/80 border-white/10' : 'bg-white border-slate-200'}`}>
          <span className="text-xs text-muted-foreground block mb-1">Potential CGA Annual Bonuses</span>
          <div className="text-xl font-extrabold text-emerald-400">+${totalPotentialBonuses.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          <span className="text-[11px] text-muted-foreground mt-0.5 block">20% of eligible principal</span>
        </div>

        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#0b1021]/80 border-white/10' : 'bg-white border-slate-200'}`}>
          <span className="text-xs text-muted-foreground block mb-1">Unallocated Cash</span>
          <div className="text-xl font-extrabold text-foreground">${availableCash.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          <button onClick={onOpenContribute} className="text-[11px] text-emerald-400 hover:underline font-semibold mt-0.5 block">
            + Fund More Cash
          </button>
        </div>
      </div>

      {/* Active Holdings List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold flex items-center gap-2">
            <Layers size={17} className="text-emerald-400" />
            <span>Active Portfolio Holdings</span>
          </h3>

          <div className="flex items-center gap-1">
            {(['all', 'active', 'completed'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-colors ${
                  filter === tab
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {filteredInvestments.length === 0 ? (
          <div className={`p-8 rounded-3xl border text-center space-y-3 ${
            isDark ? 'bg-[#0b1021]/50 border-white/10' : 'bg-white border-slate-200'
          }`}>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
              <TrendingUp size={24} />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold">No investments in this view</h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Explore our available long-term retirement strategies below and start your 12-month 20% CGA bonus cycle.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredInvestments.map((inv) => {
              const invDate = new Date(inv.investmentDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              });
              const eligDate = new Date(inv.eligibilityDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              });

              return (
                <div
                  key={inv.id}
                  className={`rounded-2xl border p-5 transition-all space-y-3 ${
                    isDark ? 'bg-[#0b1021]/80 border-white/10 hover:border-emerald-500/30' : 'bg-white border-slate-200 hover:border-emerald-500/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-semibold tracking-wider uppercase text-emerald-400 block mb-0.5">
                        {inv.strategy}
                      </span>
                      <h4 className="text-sm font-bold text-foreground">{inv.name}</h4>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      {inv.status.toUpperCase()}
                    </span>
                  </div>

                  {/* Numbers Grid */}
                  <div className={`grid grid-cols-2 gap-2 p-3 rounded-xl text-xs ${
                    isDark ? 'bg-white/[0.02] border border-white/5' : 'bg-slate-50 border border-slate-100'
                  }`}>
                    <div>
                      <span className="text-[11px] text-muted-foreground block">Principal Amount</span>
                      <span className="font-bold text-sm">${inv.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-muted-foreground block">Annual CGA Bonus (20%)</span>
                      <span className="font-bold text-sm text-emerald-400">+${inv.bonusAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  {/* Dates & Bonus Status */}
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-white/5">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} /> Invested: {invDate}
                    </span>
                    <span className="flex items-center gap-1 text-foreground font-medium">
                      <Clock size={12} className="text-amber-400" /> Bonus Due: {eligDate}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Available 401(k) Retirement Strategy Options (Section 10 & 14) */}
      <div className="space-y-4 pt-4">
        <div>
          <h3 className="text-base font-bold flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-400" />
            <span>Eligible Retirement Investment Strategies</span>
          </h3>
          <p className="text-xs text-muted-foreground">
            Curated long-horizon portfolios engineered for generational wealth accumulation and eligible for the 20% annual CGA retirement bonus.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {RETIREMENT_OPTIONS.map((opt) => (
            <div
              key={opt.id}
              className={`rounded-3xl border p-5 sm:p-6 transition-all space-y-4 flex flex-col justify-between ${
                isDark ? 'bg-[#0b1021]/80 border-white/10 hover:border-emerald-500/30' : 'bg-white border-slate-200 hover:border-emerald-500/40 shadow-sm'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {opt.tag}
                  </span>
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <Sparkles size={13} /> +20% Annual Bonus
                  </span>
                </div>

                <h4 className="text-base font-bold text-foreground">{opt.name}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{opt.description}</p>

                <div className={`p-3 rounded-2xl border text-xs space-y-1.5 ${
                  isDark ? 'bg-white/[0.02] border-white/5' : 'bg-slate-50 border-slate-200/80'
                }`}>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Target Horizon:</span>
                    <span className="font-semibold text-foreground">{opt.recommendedHorizon}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Risk Profile:</span>
                    <span className="font-semibold text-foreground">{opt.riskLevel}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground pt-1 border-t border-white/5 truncate">
                    Mix: {opt.assetMix}
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => onOpenInvest(opt)}
                  className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-black shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Select & Allocate</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
