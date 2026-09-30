import React from 'react';
import { motion } from 'motion/react';
import { 
  ShieldCheck, 
  TrendingUp, 
  PlusCircle, 
  Clock, 
  ArrowUpRight,
  ArrowRight,
  Sparkles,
  Calendar,
  Lock,
  User,
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  RetirementAccount, 
  RetirementInvestment, 
  RetirementBonus, 
  RetirementTransaction 
} from '../../services/retirementService';

interface RetirementDashboardProps {
  account: RetirementAccount;
  investments: RetirementInvestment[];
  bonuses: RetirementBonus[];
  transactions: RetirementTransaction[];
  onOpenContribute: () => void;
  onOpenInvest: () => void;
  onOpenWithdraw: () => void;
  onSwitchTab: (tab: string) => void;
}

export default function RetirementDashboard({
  account,
  investments,
  bonuses,
  transactions,
  onOpenContribute,
  onOpenInvest,
  onOpenWithdraw,
  onSwitchTab
}: RetirementDashboardProps) {
  const { isDark } = useTheme();

  const liquidCash = Number(account.currentBalance || 0);
  const investedValue = Number(account.investmentValue || 0);
  const accountBalance = liquidCash + investedValue;
  const totalContributions = Number(account.totalContributions || 0);
  const cgaAnnualBonusRate = "20%";

  // Find next upcoming bonus
  const pendingBonuses = bonuses.filter(b => b.status === 'pending');
  const nextBonus = pendingBonuses.length > 0
    ? pendingBonuses.sort((a, b) => new Date(a.eligibility_date).getTime() - new Date(b.eligibility_date).getTime())[0]
    : null;

  const nextBonusDisplay = nextBonus
    ? `+$${nextBonus.bonus_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} (${new Date(nextBonus.eligibility_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})`
    : investedValue > 0 
      ? `+$${(investedValue * 0.20).toLocaleString(undefined, { minimumFractionDigits: 2 })} (12 mo)`
      : '$0.00';

  const createdDateFormatted = account.created_at
    ? new Date(account.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    : 'Active';

  const verificationStatusText = account.verificationStatus === 'verified'
    ? 'Verified'
    : account.verificationStatus === 'required'
      ? 'Verification Required'
      : 'Pending';

  const accountStatusText = account.status === 'active'
    ? 'Active'
    : account.status === 'pending_verification'
      ? 'Pending Verification'
      : account.status === 'verification_required'
        ? 'Verification Required'
        : account.status === 'suspended'
          ? 'Suspended'
          : 'Closed';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* 14. Top Section & Account Balance */}
      <div className={`relative overflow-hidden rounded-3xl p-6 sm:p-8 border shadow-xl transition-all ${
        isDark 
          ? 'bg-[#0a0f1d] border-white/10' 
          : 'bg-white border-slate-200/90'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Account Balance
            </span>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl sm:text-5xl font-black tracking-tight text-foreground font-mono">
                ${accountBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {accountStatusText}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Unallocated Cash: <strong className="text-foreground font-mono">${liquidCash.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong> • Invested: <strong className="text-foreground font-mono">${investedValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={onOpenContribute}
              className="py-3 px-5 rounded-2xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-black shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle size={15} />
              <span>Fund 401(k)</span>
            </button>
            <button
              onClick={onOpenInvest}
              className={`py-3 px-5 rounded-2xl font-bold text-xs border transition-all flex items-center gap-1.5 cursor-pointer ${
                isDark 
                  ? 'border-white/10 hover:bg-white/5 text-white' 
                  : 'border-slate-200 hover:bg-slate-100 text-slate-900'
              }`}
            >
              <TrendingUp size={15} className="text-emerald-400" />
              <span>Start Investment</span>
            </button>
          </div>
        </div>

        {/* Compact Key 401(k) Metrics Grid (Specification 14) */}
        <div className={`grid grid-cols-2 sm:grid-cols-5 gap-3 pt-6 mt-6 border-t ${
          isDark ? 'border-white/5' : 'border-slate-100'
        }`}>
          <div>
            <span className="text-[11px] text-muted-foreground block mb-0.5">Total Contributions</span>
            <span className="text-sm sm:text-base font-bold text-foreground font-mono">
              ${totalContributions.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-muted-foreground block mb-0.5">Investment Value</span>
            <span className="text-sm sm:text-base font-bold text-foreground font-mono">
              ${investedValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-muted-foreground block mb-0.5">CGA Annual Bonus</span>
            <span className="text-sm sm:text-base font-bold text-emerald-400 font-mono">
              {cgaAnnualBonusRate}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-muted-foreground block mb-0.5">Next Bonus</span>
            <span className="text-xs sm:text-sm font-semibold text-emerald-400 truncate block">
              {nextBonusDisplay}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-muted-foreground block mb-0.5">Account Status</span>
            <span className="text-xs sm:text-sm font-semibold text-emerald-400">
              {accountStatusText}
            </span>
          </div>
        </div>
      </div>

      {/* 21. Compact 401(k) Account Details Section */}
      <div className={`p-6 rounded-3xl border transition-all ${
        isDark ? 'bg-[#0a0f1d] border-white/10' : 'bg-white border-slate-200/90'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <User size={16} className="text-emerald-400" />
            <h3 className="text-sm font-bold text-foreground">401(k) Account Details</h3>
          </div>
          <span className="text-xs text-muted-foreground">Account ID: #{account.userId.substring(0, 8).toUpperCase()}</span>
        </div>

        <div className={`rounded-2xl border divide-y overflow-hidden text-xs ${
          isDark ? 'bg-white/[0.015] border-white/5 divide-white/5' : 'bg-slate-50 border-slate-200 divide-slate-200'
        }`}>
          <div className="p-3.5 flex justify-between items-center">
            <span className="text-muted-foreground">Account Name</span>
            <span className="font-semibold text-foreground">{account.fullName}</span>
          </div>
          <div className="p-3.5 flex justify-between items-center">
            <span className="text-muted-foreground">Email</span>
            <span className="font-semibold text-foreground">{account.email || 'Registered CGA Account'}</span>
          </div>
          <div className="p-3.5 flex justify-between items-center">
            <span className="text-muted-foreground">Phone</span>
            <span className="font-semibold text-foreground">{account.phone || 'Verified on file'}</span>
          </div>
          <div className="p-3.5 flex justify-between items-center">
            <span className="text-muted-foreground">Account Status</span>
            <span className="font-semibold text-emerald-400">{accountStatusText}</span>
          </div>
          <div className="p-3.5 flex justify-between items-center">
            <span className="text-muted-foreground">Account Created</span>
            <span className="font-semibold text-foreground">{createdDateFormatted}</span>
          </div>
          <div className="p-3.5 flex justify-between items-center">
            <span className="text-muted-foreground">Verification</span>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-emerald-400" />
              <span className="font-semibold text-emerald-400">{verificationStatusText}</span>
              {account.maskedSsn && (
                <span className="text-[11px] font-mono text-muted-foreground ml-1">({account.maskedSsn})</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Active 401(k) Allocations preview */}
      {investments.length > 0 && (
        <div className={`p-6 rounded-3xl border transition-all ${
          isDark ? 'bg-[#0a0f1d] border-white/10' : 'bg-white border-slate-200/90'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-emerald-400" />
              <h3 className="text-sm font-bold text-foreground">Active 401(k) Investments</h3>
            </div>
            <button
              onClick={() => onSwitchTab('portfolio')}
              className="text-xs text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer font-semibold"
            >
              <span>View All</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div className="space-y-2.5">
            {investments.slice(0, 3).map((inv) => (
              <div
                key={inv.id}
                className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                  isDark ? 'bg-white/[0.02] border-white/5' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div>
                  <h4 className="text-xs font-bold text-foreground">{inv.name}</h4>
                  <span className="text-[11px] text-muted-foreground">
                    Eligibility Date: {new Date(inv.eligibilityDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black font-mono block text-foreground">
                    ${inv.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-400">
                    +${inv.bonusAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} Bonus
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
