import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  X, 
  AlertTriangle, 
  ShieldAlert, 
  ArrowRight, 
  CheckCircle2, 
  Building,
  HelpCircle,
  Clock
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { requestRetirementWithdrawal } from '../../services/retirementService';
import { toast } from 'sonner';

interface RetirementWithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableCash: number;
}

export default function RetirementWithdrawModal({
  isOpen,
  onClose,
  availableCash
}: RetirementWithdrawModalProps) {
  const { user } = useAuth();
  const { isDark } = useTheme();

  const [amount, setAmount] = useState<string>('');
  const [payoutMethod, setPayoutMethod] = useState<'crypto_usdt' | 'crypto_btc' | 'bank_settlement'>('crypto_usdt');
  const [destination, setDestination] = useState<string>('');
  const [reason, setReason] = useState<string>('Standard Scheduled Distribution');
  const [agreedToDisclosures, setAgreedToDisclosures] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);

    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Please enter a valid withdrawal amount.');
      return;
    }

    if (numAmount > availableCash) {
      toast.error('Amount exceeds your unallocated retirement liquid cash balance.');
      return;
    }

    if (!destination.trim()) {
      toast.error('Please enter your payout destination account or wallet address.');
      return;
    }

    if (!agreedToDisclosures) {
      toast.error('Please acknowledge the retirement distribution compliance and tax notice.');
      return;
    }

    if (!user) return;

    try {
      setLoading(true);
      await requestRetirementWithdrawal(user.uid, numAmount, {
        payoutMethod,
        destinationAddress: destination.trim(),
        reason,
        agreedToDisclosures
      });
      toast.success('Retirement distribution request submitted for administrative compliance review.');
      onClose();
    } catch (err: any) {
      console.error('Withdrawal request error:', err);
      toast.error(err.message || 'Withdrawal submission failed.');
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
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <ShieldAlert size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-tight">Retirement Distribution</h2>
              <p className="text-xs text-muted-foreground">Compliance review & distribution request</p>
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

        {/* Warning Banner */}
        <div className={`mx-6 mt-4 p-3.5 rounded-2xl border text-xs leading-relaxed space-y-1.5 ${
          isDark ? 'bg-amber-950/20 border-amber-500/30 text-amber-200/90' : 'bg-amber-50 border-amber-200 text-amber-900'
        }`}>
          <div className="font-semibold flex items-center gap-1.5 text-amber-400">
            <AlertTriangle size={15} />
            <span>Important Distribution & Tax Notice</span>
          </div>
          <p>
            Retirement account distributions can be subject to plan rules, eligibility requirements, taxes, potential early-distribution withholding penalties, and jurisdictional laws. Funds in active 12-month bonus cycles remain locked until cycle completion.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="font-medium text-muted-foreground">Distribution Amount (USD)</span>
              <span className="text-muted-foreground">
                Unallocated Cash:{' '}
                <button
                  type="button"
                  onClick={() => setAmount(availableCash.toString())}
                  className="text-emerald-400 font-semibold hover:underline"
                >
                  ${availableCash.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </button>
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-muted-foreground font-semibold text-sm">$</span>
              <input
                type="number"
                step="any"
                min="10"
                max={availableCash}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className={`w-full pl-8 pr-4 py-2.5 rounded-xl border text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              />
            </div>
          </div>

          {/* Distribution Reason */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Distribution Reason / Category</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                isDark ? 'bg-[#0f172a] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            >
              <option value="Standard Scheduled Distribution">Standard Scheduled Distribution</option>
              <option value="Reached Target Retirement Age">Reached Target Retirement Age</option>
              <option value="Financial Hardship / Emergency Distribution">Financial Hardship / Emergency Distribution</option>
              <option value="Plan Rollover / Transfer">Plan Rollover / Transfer</option>
              <option value="Other Qualifying Event">Other Qualifying Event</option>
            </select>
          </div>

          {/* Payout Method */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Payout Settlement Method</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'crypto_usdt', label: 'USDT (TRC20)' },
                { id: 'crypto_btc', label: 'Bitcoin (BTC)' },
                { id: 'bank_settlement', label: 'Bank Wire' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPayoutMethod(m.id as any)}
                  className={`p-2.5 rounded-xl border text-center text-xs font-medium transition-all ${
                    payoutMethod === m.id
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                      : isDark
                        ? 'border-white/10 bg-white/[0.02] text-slate-400 hover:bg-white/5'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Destination Account */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Destination {payoutMethod === 'bank_settlement' ? 'IBAN / Routing & Account Number' : 'Wallet Address'}
            </label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder={payoutMethod === 'bank_settlement' ? 'Bank Name, Account & Routing # / IBAN' : 'Enter recipient wallet address'}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            />
          </div>

          {/* Disclosure Checkbox */}
          <div className="flex items-start gap-2.5 pt-1">
            <input
              type="checkbox"
              id="distAck"
              checked={agreedToDisclosures}
              onChange={(e) => setAgreedToDisclosures(e.target.checked)}
              className="mt-0.5 rounded border-white/20 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
            />
            <label htmlFor="distAck" className="text-[11px] text-muted-foreground leading-normal cursor-pointer">
              I acknowledge that retirement distributions undergo compliance validation, are not processed instantly, and may impact eligibility for upcoming 20% CGA Annual Bonuses.
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 py-3 px-4 rounded-xl font-medium text-xs transition-colors ${
                isDark ? 'hover:bg-white/10 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-600'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !agreedToDisclosures || availableCash <= 0}
              className="flex-1 py-3 px-6 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Request Distribution'}
              {!loading && <ArrowRight size={14} />}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
