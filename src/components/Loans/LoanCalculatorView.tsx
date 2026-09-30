import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Calculator, 
  DollarSign, 
  Calendar, 
  Percent, 
  ArrowRight,
  TrendingDown,
  Sparkles,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { 
  calculateLoanEstimates, 
  generateRepaymentSchedule, 
  LOAN_PRODUCTS,
  LoanProductDefinition
} from '../../services/loanService';

interface LoanCalculatorViewProps {
  onSelectProductToApply: (product: LoanProductDefinition, amount: number, term: number) => void;
}

export default function LoanCalculatorView({ onSelectProductToApply }: LoanCalculatorViewProps) {
  const [selectedProductId, setSelectedProductId] = useState<string>('personal');
  const selectedProduct = LOAN_PRODUCTS.find(p => p.id === selectedProductId) || LOAN_PRODUCTS[0];

  const [amount, setAmount] = useState<number>(25000);
  const [term, setTerm] = useState<number>(36);
  const [customRate, setCustomRate] = useState<number>(selectedProduct.baseInterestRate);

  const { monthlyPayment, totalPayment, totalInterest } = calculateLoanEstimates(
    amount,
    customRate,
    term
  );

  const schedule = generateRepaymentSchedule(amount, customRate, term).slice(0, 12);

  const handleProductChange = (prodId: string) => {
    setSelectedProductId(prodId);
    const prod = LOAN_PRODUCTS.find(p => p.id === prodId);
    if (prod) {
      setCustomRate(prod.baseInterestRate);
      const safeAmount = Math.max(prod.minAmount, Math.min(prod.maxAmount, amount));
      setAmount(safeAmount);
      if (!prod.termOptions.includes(term)) {
        setTerm(prod.termOptions[0] || 12);
      }
    }
  };

  return (
    <div className="space-y-8 text-left">
      {/* Intro Card */}
      <div className="p-6 bg-gradient-to-br from-emerald-500/10 via-white/[0.02] to-transparent border border-emerald-500/20 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <Calculator size={13} />
              Interactive Loan Simulation
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Estimate Your Monthly Payments
            </h2>
            <p className="text-xs text-white/60 mt-1 max-w-xl leading-relaxed">
              Explore dynamic amortization and adjust parameters to plan your borrowing. Calculations are transparent and interest is computed on an amortized basis.
            </p>
          </div>

          <div className="p-4 bg-[#0a0d13] border border-white/10 rounded-2xl flex items-center gap-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-white/40 block">Estimated Payment</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-emerald-400 font-mono">
                  ${monthlyPayment.toFixed(2)}
                </span>
                <span className="text-xs text-white/40">/ mo</span>
              </div>
            </div>
            <button
              onClick={() => onSelectProductToApply(selectedProduct, amount, term)}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-500/20 cursor-pointer flex items-center gap-1.5"
            >
              <span>Apply</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Column */}
        <div className="lg:col-span-2 space-y-6 bg-[#0b0e14]/80 border border-white/5 rounded-3xl p-6 sm:p-8">
          {/* Select Loan Type */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-white/70 block mb-2">
              Select Loan Type
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => handleProductChange(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500/50 cursor-pointer"
            >
              {LOAN_PRODUCTS.map((p) => (
                <option key={p.id} value={p.id} className="bg-[#0b0e14] text-white">
                  {p.name} (from {p.baseInterestRate}% APR • up to ${p.maxAmount.toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          {/* Amount Slider */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-white/70">
                Loan Amount
              </label>
              <div className="flex items-center bg-white/5 border border-white/10 rounded-xl px-3 py-1 font-mono text-emerald-400 font-bold text-sm">
                <span className="mr-1">$</span>
                <input
                  type="number"
                  min={selectedProduct.minAmount}
                  max={selectedProduct.maxAmount}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-28 bg-transparent text-white focus:outline-none"
                />
              </div>
            </div>
            <input
              type="range"
              min={selectedProduct.minAmount}
              max={selectedProduct.maxAmount}
              step={selectedProduct.maxAmount > 100000 ? 5000 : 500}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500 mt-2"
            />
            <div className="flex justify-between text-[11px] text-white/40 mt-1 font-mono">
              <span>${selectedProduct.minAmount.toLocaleString()}</span>
              <span>${selectedProduct.maxAmount.toLocaleString()}</span>
            </div>
          </div>

          {/* Term Selector */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-white/70 block mb-2">
              Loan Term
            </label>
            <div className="flex flex-wrap gap-2">
              {selectedProduct.termOptions.map((termOpt) => (
                <button
                  key={termOpt}
                  type="button"
                  onClick={() => setTerm(termOpt)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    term === termOpt
                      ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                      : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/5'
                  }`}
                >
                  {termOpt} Months
                </button>
              ))}
            </div>
          </div>

          {/* Interest Rate Adjustment */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-white/70">
                Interest Rate (APR)
              </label>
              <span className="text-xs font-mono font-bold text-emerald-400">
                {customRate.toFixed(2)}%
              </span>
            </div>
            <input
              type="range"
              min={3.5}
              max={18.0}
              step={0.1}
              value={customRate}
              onChange={(e) => setCustomRate(Number(e.target.value))}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] text-white/40 mt-1">
              <span>3.5% (Prime)</span>
              <span>18.0%</span>
            </div>
          </div>
        </div>

        {/* Results Column */}
        <div className="space-y-6">
          <div className="p-6 bg-[#0b0e14]/80 border border-white/5 rounded-3xl space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white border-b border-white/5 pb-3">
              Payment Breakdown
            </h3>

            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between items-center text-white/60">
                <span>Monthly Payment:</span>
                <span className="text-lg font-mono font-black text-emerald-400">
                  ${monthlyPayment.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center text-white/60">
                <span>Total Principal:</span>
                <span className="font-mono font-bold text-white">
                  ${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center text-white/60">
                <span>Total Interest:</span>
                <span className="font-mono font-bold text-amber-400">
                  ${totalInterest.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center text-white/60 pt-2 border-t border-white/5">
                <span className="font-semibold text-white">Total Repayment:</span>
                <span className="font-mono font-black text-white text-sm">
                  ${totalPayment.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <button
              onClick={() => onSelectProductToApply(selectedProduct, amount, term)}
              className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-black text-xs font-black uppercase tracking-wider transition-all duration-200 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Apply for this Loan</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {/* Quick Notice */}
          <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl text-[11px] text-white/40 leading-relaxed space-y-1.5">
            <p>
              • Pre-approval does not affect credit scores.
            </p>
            <p>
              • Repayments are executed from your Available CGA Balance with zero hidden penalties for early payoff.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
