import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ArrowRight, 
  Clock, 
  Percent, 
  DollarSign, 
  Calendar, 
  CheckCircle2, 
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { LoanProductDefinition, calculateLoanEstimates } from '../../services/loanService';
import LoanIcon from './LoanIcon';

interface LoanDetailModalProps {
  product: LoanProductDefinition | null;
  isOpen: boolean;
  onClose: () => void;
  onApply: (product: LoanProductDefinition, initialAmount?: number, initialTerm?: number) => void;
}

export default function LoanDetailModal({
  product,
  isOpen,
  onClose,
  onApply
}: LoanDetailModalProps) {
  if (!product) return null;

  // Initial preview calculator state
  const defaultAmount = Math.round((product.minAmount + product.maxAmount) / 4);
  const [previewAmount, setPreviewAmount] = useState(defaultAmount);
  const [previewTerm, setPreviewTerm] = useState(product.termOptions[0] || 12);

  const { monthlyPayment, totalPayment, totalInterest } = calculateLoanEstimates(
    previewAmount,
    product.baseInterestRate,
    previewTerm
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="relative w-full max-w-2xl bg-[#0b0e14] border border-white/10 rounded-3xl shadow-2xl p-6 sm:p-8 z-10 overflow-hidden text-left"
          >
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />

            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-6 relative z-10">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <LoanIcon iconName={product.iconName} size={24} className="text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      {product.name}
                    </h2>
                  </div>
                  <p className="text-xs sm:text-sm text-white/60 mt-0.5">
                    {product.shortDescription}
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Core Loan Parameters Matrix (Section 6 Specification) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6 relative z-10">
              <div className="p-3.5 bg-white/[0.03] border border-white/5 rounded-2xl">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40 block mb-1">
                  Loan Amount
                </span>
                <span className="text-sm font-bold text-white">
                  ${product.minAmount.toLocaleString()} – ${product.maxAmount.toLocaleString()}
                </span>
              </div>

              <div className="p-3.5 bg-white/[0.03] border border-white/5 rounded-2xl">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40 block mb-1">
                  Term
                </span>
                <span className="text-sm font-bold text-white">
                  {product.minTermMonths} – {product.maxTermMonths} months
                </span>
              </div>

              <div className="p-3.5 bg-white/[0.03] border border-white/5 rounded-2xl">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40 block mb-1">
                  Interest Rate
                </span>
                <span className="text-sm font-bold text-emerald-400 flex items-center gap-1">
                  <Percent size={13} />
                  Based on eligibility
                </span>
              </div>

              <div className="p-3.5 bg-white/[0.03] border border-white/5 rounded-2xl">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40 block mb-1">
                  Application Fee
                </span>
                <span className="text-sm font-bold text-white">
                  {product.applicationFee === 0 ? '$0.00 (None)' : `$${product.applicationFee}`}
                </span>
              </div>

              <div className="p-3.5 bg-white/[0.03] border border-white/5 rounded-2xl">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40 block mb-1">
                  Funding Time
                </span>
                <span className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Clock size={13} className="text-white/60" />
                  {product.fundingSpeed}
                </span>
              </div>

              <div className="p-3.5 bg-white/[0.03] border border-white/5 rounded-2xl">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40 block mb-1">
                  Collateral Requirement
                </span>
                <span className="text-sm font-bold text-white">
                  {product.requiresCollateral ? 'Collateral Backed' : 'No Collateral'}
                </span>
              </div>
            </div>

            {/* Dynamic Estimated Monthly Payment Box */}
            <div className="p-5 bg-gradient-to-br from-emerald-500/10 via-white/[0.02] to-transparent border border-emerald-500/20 rounded-2xl mb-6 relative z-10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-white/5">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 block mb-0.5">
                    Estimated Monthly Payment
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl sm:text-3xl font-black text-white">
                      ${monthlyPayment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-xs text-white/50">/ month</span>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[10px] uppercase font-medium text-white/40 block">Estimated Total Repayment</span>
                  <span className="text-sm font-mono font-bold text-white">
                    ${totalPayment.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[10px] text-white/40 block mt-0.5">
                    Includes est. ${totalInterest.toLocaleString(undefined, { minimumFractionDigits: 2 })} interest
                  </span>
                </div>
              </div>

              {/* Amount Slider */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center text-xs mb-1.5 font-medium">
                    <span className="text-white/70">Requested Loan Amount</span>
                    <span className="text-emerald-400 font-bold font-mono">
                      ${previewAmount.toLocaleString()}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={product.minAmount}
                    max={product.maxAmount}
                    step={product.maxAmount > 100000 ? 5000 : 500}
                    value={previewAmount}
                    onChange={(e) => setPreviewAmount(Number(e.target.value))}
                    className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <div className="flex justify-between text-[10px] text-white/40 mt-1">
                    <span>${product.minAmount.toLocaleString()}</span>
                    <span>${product.maxAmount.toLocaleString()}</span>
                  </div>
                </div>

                {/* Term selector buttons */}
                <div>
                  <div className="flex justify-between items-center text-xs mb-2 font-medium">
                    <span className="text-white/70">Loan Term</span>
                    <span className="text-emerald-400 font-bold">{previewTerm} Months</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.termOptions.map((term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => setPreviewTerm(term)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          previewTerm === term
                            ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                            : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {term} mo
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Disclaimer & Apply Now Button */}
            <div className="space-y-4 relative z-10">
              <p className="text-[11px] text-white/40 leading-relaxed">
                * Note: Figures shown are estimated calculations based on a representative {product.baseInterestRate}% APR. Final terms, interest rate, and monthly payment are determined based on individual eligibility and credit review.
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-1/3 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-all cursor-pointer text-center"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onApply(product, previewAmount, previewTerm);
                  }}
                  className="flex-1 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-black text-xs font-black uppercase tracking-wider transition-all duration-200 shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Apply Now</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
