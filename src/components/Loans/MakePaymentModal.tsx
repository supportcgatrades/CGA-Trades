import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle, 
  Wallet, 
  ArrowRight, 
  ShieldCheck,
  Calendar,
  Lock
} from 'lucide-react';
import { toast } from 'sonner';
import { Loan, makeLoanPayment } from '../../services/loanService';
import { useAuth } from '../../contexts/AuthContext';

interface MakePaymentModalProps {
  loan: Loan | null;
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess?: () => void;
}

export default function MakePaymentModal({
  loan,
  isOpen,
  onClose,
  onPaymentSuccess
}: MakePaymentModalProps) {
  const { user, profile } = useAuth();

  const availableBalance = Number(profile?.available_balance || 0);

  const [paymentType, setPaymentType] = useState<'monthly' | 'custom' | 'full'>('monthly');
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isConfirming, setIsConfirming] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!loan || !isOpen) return null;

  const currentOutstanding = loan.outstanding_balance;
  const regularMonthlyPayment = Math.min(loan.monthly_payment, currentOutstanding);

  let targetPaymentAmount = regularMonthlyPayment;
  if (paymentType === 'full') {
    targetPaymentAmount = currentOutstanding;
  } else if (paymentType === 'custom') {
    targetPaymentAmount = Math.max(0, Math.min(currentOutstanding, parseFloat(customAmount) || 0));
  }

  const remainingAvailableBalance = Math.max(0, availableBalance - targetPaymentAmount);
  const newOutstandingAfterPayment = Math.max(0, currentOutstanding - targetPaymentAmount);
  const hasInsufficientFunds = availableBalance < targetPaymentAmount;

  const handlePayClick = () => {
    if (targetPaymentAmount <= 0) {
      toast.error("Please enter a valid payment amount.");
      return;
    }
    if (hasInsufficientFunds) {
      toast.error(`Insufficient Available CGA Balance ($${availableBalance.toFixed(2)}).`);
      return;
    }
    setIsConfirming(true);
  };

  const handleExecutePayment = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      await makeLoanPayment(loan.id, targetPaymentAmount, user, profile);
      toast.success(`Payment of $${targetPaymentAmount.toFixed(2)} successful!`);
      setIsConfirming(false);
      onClose();
      if (onPaymentSuccess) onPaymentSuccess();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Payment execution failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1300] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => {
          if (!isSubmitting) {
            setIsConfirming(false);
            onClose();
          }
        }}
        className="fixed inset-0 bg-black/85 backdrop-blur-md"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-md bg-[#0b0e14] border border-white/10 rounded-3xl shadow-2xl p-6 z-10 overflow-hidden text-left"
      >
        <div className="flex items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <DollarSign size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Make Loan Payment
              </h3>
              <p className="text-xs text-white/50">
                {loan.loan_name} • {loan.id}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setIsConfirming(false);
              onClose();
            }}
            disabled={isSubmitting}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {!isConfirming ? (
          <div className="space-y-4">
            {/* Balance Card */}
            <div className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-white/70">
                  <Wallet size={18} />
                </div>
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40 block">
                    Available CGA Balance
                  </span>
                  <span className="text-sm font-mono font-bold text-white">
                    ${availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40 block">
                  Current Loan Balance
                </span>
                <span className="text-sm font-mono font-bold text-amber-400">
                  ${currentOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Payment Options */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentType('monthly')}
                className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                  paymentType === 'monthly'
                    ? 'bg-emerald-500/10 border-emerald-500/50 text-white'
                    : 'bg-white/[0.02] border-white/5 text-white/70 hover:bg-white/5'
                }`}
              >
                <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-1">
                  Monthly
                </span>
                <span className="text-xs font-mono font-bold block text-white">
                  ${regularMonthlyPayment.toFixed(2)}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentType('full')}
                className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                  paymentType === 'full'
                    ? 'bg-emerald-500/10 border-emerald-500/50 text-white'
                    : 'bg-white/[0.02] border-white/5 text-white/70 hover:bg-white/5'
                }`}
              >
                <span className="text-[10px] uppercase font-bold text-amber-400 block mb-1">
                  Full Payoff
                </span>
                <span className="text-xs font-mono font-bold block text-white">
                  ${currentOutstanding.toFixed(2)}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentType('custom')}
                className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                  paymentType === 'custom'
                    ? 'bg-emerald-500/10 border-emerald-500/50 text-white'
                    : 'bg-white/[0.02] border-white/5 text-white/70 hover:bg-white/5'
                }`}
              >
                <span className="text-[10px] uppercase font-bold text-cyan-400 block mb-1">
                  Custom
                </span>
                <span className="text-xs font-semibold block text-white">
                  Enter amount
                </span>
              </button>
            </div>

            {paymentType === 'custom' && (
              <div>
                <label className="text-[11px] font-semibold text-white/70 block mb-1">
                  Custom Payment Amount ($)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 text-xs">$</span>
                  <input
                    type="number"
                    min="1"
                    max={currentOutstanding}
                    step="0.01"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder="Enter amount..."
                    className="w-full pl-8 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-mono font-bold text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>
            )}

            {/* Calculations Breakdown (Section Specification) */}
            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-2 text-xs">
              <div className="flex justify-between text-white/60">
                <span>Payment Amount</span>
                <span className="font-mono font-bold text-emerald-400">
                  ${targetPaymentAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-white/60">
                <span>Remaining Available Balance</span>
                <span className={`font-mono font-bold ${hasInsufficientFunds ? 'text-red-400' : 'text-white'}`}>
                  ${remainingAvailableBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-white/60">
                <span>Total Outstanding After Payment</span>
                <span className="font-mono font-bold text-white">
                  ${newOutstandingAfterPayment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-white/60">
                <span>Next Payment Date</span>
                <span className="font-medium text-white">{loan.next_payment_date || 'N/A'}</span>
              </div>
            </div>

            {hasInsufficientFunds && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-xs text-red-400">
                <AlertCircle size={16} />
                <span>Insufficient available funds. Please fund your balance first.</span>
              </div>
            )}

            <button
              type="button"
              onClick={handlePayClick}
              disabled={hasInsufficientFunds || targetPaymentAmount <= 0}
              className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 disabled:opacity-40 text-black text-xs font-black uppercase tracking-wider transition-all duration-200 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Continue to Confirmation</span>
              <ArrowRight size={14} />
            </button>
          </div>
        ) : (
          /* Confirmation Screen (Explicit requirement: Require confirmation before submitting) */
          <div className="space-y-4">
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <ShieldCheck size={16} />
                <span>Confirm Repayment Authorization</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-white/70">
                  <span>Loan:</span>
                  <span className="text-white font-semibold">{loan.loan_name}</span>
                </div>
                <div className="flex justify-between text-white/70">
                  <span>Amount Debited:</span>
                  <span className="text-emerald-400 font-mono font-bold text-sm">
                    ${targetPaymentAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-white/70">
                  <span>Source:</span>
                  <span className="text-white font-semibold">Available CGA Balance</span>
                </div>
                <div className="flex justify-between text-white/70">
                  <span>Remaining Outstanding:</span>
                  <span className="text-amber-400 font-mono font-bold">
                    ${newOutstandingAfterPayment.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-white/50 leading-relaxed">
              By authorizing this transaction, ${targetPaymentAmount.toFixed(2)} will be debited from your Available Balance and credited to your loan balance. This action cannot be reversed.
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsConfirming(false)}
                disabled={isSubmitting}
                className="w-1/3 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-all cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleExecutePayment}
                disabled={isSubmitting}
                className="flex-1 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Processing Payment...</span>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Authorize Repayment</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
