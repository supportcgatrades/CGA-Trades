import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  X, 
  TrendingUp, 
  Sparkles, 
  Calendar, 
  ShieldCheck, 
  ArrowRight, 
  DollarSign
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  RetirementInvestmentOption, 
  RETIREMENT_OPTIONS, 
  createRetirementInvestment 
} from '../../services/retirementService';
import { toast } from 'sonner';

interface RetirementInvestModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableRetirementCash: number;
  initialOption?: RetirementInvestmentOption;
}

export default function RetirementInvestModal({
  isOpen,
  onClose,
  availableRetirementCash,
  initialOption
}: RetirementInvestModalProps) {
  const { user } = useAuth();
  const { isDark } = useTheme();

  const [selectedOption, setSelectedOption] = useState<RetirementInvestmentOption>(
    initialOption || RETIREMENT_OPTIONS[0]
  );
  const [amount, setAmount] = useState<string>('5000');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const numAmount = parseFloat(amount) || 0;
  const annualBonusRate = 0.20; // 20% Annual CGA Retirement Bonus
  const calculatedBonus = numAmount * annualBonusRate;

  // Dates
  const startDate = new Date();
  const eligibilityDate = new Date();
  eligibilityDate.setFullYear(eligibilityDate.getFullYear() + 1);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleInvest = async (e: React.FormEvent) => {
    e.preventDefault();

    if (numAmount < 100) {
      toast.error('Minimum investment amount is $100.00.');
      return;
    }

    if (numAmount > availableRetirementCash) {
      toast.error(`Amount exceeds your available 401(k) cash ($${availableRetirementCash.toLocaleString()}). Please fund your 401(k) first.`);
      return;
    }

    if (!user) return;

    try {
      setLoading(true);
      await createRetirementInvestment(user.uid, selectedOption, numAmount);
      toast.success(`Successfully allocated $${numAmount.toLocaleString()} into ${selectedOption.name}!`);
      onClose();
    } catch (err: any) {
      console.error('Retirement allocation error:', err);
      toast.error(err.message || 'Investment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className={`relative w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden my-auto transition-colors ${
          isDark ? 'bg-[#0b1021] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${
          isDark ? 'border-white/5 bg-white/[0.02]' : 'border-slate-100 bg-slate-50/50'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <TrendingUp size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Start Investment</h2>
              <p className="text-[11px] text-muted-foreground">Allocate capital into your 401(k)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              isDark ? 'hover:bg-white/10 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'
            }`}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleInvest} className="p-6 space-y-4">
          {/* Strategy Selector */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Selected Strategy</label>
            <div className="space-y-2">
              {RETIREMENT_OPTIONS.slice(0, 2).map((opt) => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setSelectedOption(opt)}
                  className={`w-full p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    selectedOption.id === opt.id
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : isDark ? 'border-white/5 bg-white/[0.02] hover:bg-white/5' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">{opt.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold">
                      {opt.riskLevel}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">{opt.strategy}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Investment Amount Input */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <label className="font-semibold text-muted-foreground">Investment Amount ($)</label>
              <span className="text-muted-foreground">
                Available Cash: <strong className="text-emerald-400 font-mono">${availableRetirementCash.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
              </span>
            </div>
            <div className="relative">
              <input
                type="number"
                min={100}
                max={availableRetirementCash}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="5000"
                className={`w-full px-3.5 py-3 rounded-xl border text-lg font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                  isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              />
            </div>
          </div>

          {/* 20% Annual Bonus Visual Breakdown (Specification 19 & 20) */}
          <div className={`p-4 rounded-2xl border ${
            isDark ? 'bg-gradient-to-r from-emerald-500/10 to-transparent border-emerald-500/20' : 'bg-emerald-50/70 border-emerald-200'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <Sparkles size={14} />
                <span>Annual CGA Bonus: 20%</span>
              </span>
              <span className="text-xs font-black font-mono text-emerald-400">
                +${calculatedBonus.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Example: For this ${numAmount.toLocaleString()} allocation, you earn an additional guaranteed <strong>+${calculatedBonus.toLocaleString()}</strong> platform bonus credited at the 12-month maturity date.
            </p>
          </div>

          {/* Essential Information Table (Specification 19) */}
          <div className={`rounded-2xl border divide-y overflow-hidden text-xs ${
            isDark ? 'bg-white/[0.02] border-white/10 divide-white/5' : 'bg-slate-50 border-slate-200 divide-slate-200'
          }`}>
            <div className="p-3 flex justify-between items-center">
              <span className="text-muted-foreground">Investment Amount:</span>
              <span className="font-bold text-foreground font-mono">${numAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="p-3 flex justify-between items-center">
              <span className="text-muted-foreground">Annual CGA Bonus:</span>
              <span className="font-bold text-emerald-400">20% (+${calculatedBonus.toLocaleString(undefined, { minimumFractionDigits: 2 })})</span>
            </div>
            <div className="p-3 flex justify-between items-center">
              <span className="text-muted-foreground">Investment Start Date:</span>
              <span className="font-semibold text-foreground">{formatDate(startDate)}</span>
            </div>
            <div className="p-3 flex justify-between items-center">
              <span className="text-muted-foreground">Bonus Eligibility Date:</span>
              <span className="font-semibold text-foreground">{formatDate(eligibilityDate)}</span>
            </div>
            <div className="p-3 flex justify-between items-center">
              <span className="text-muted-foreground">Status:</span>
              <span className="font-semibold text-emerald-400">Ready to Deploy</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || numAmount <= 0 || numAmount > availableRetirementCash}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <span>Deploying...</span>
              ) : (
                <>
                  <span>Invest Now</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
