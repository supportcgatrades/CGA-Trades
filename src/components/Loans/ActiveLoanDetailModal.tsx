import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  DollarSign, 
  Calendar, 
  Percent, 
  Clock, 
  FileText, 
  ShieldCheck, 
  CheckCircle2, 
  CreditCard,
  Download,
  Eye,
  ArrowRight,
  ExternalLink,
  Receipt
} from 'lucide-react';
import { Loan, LoanRepaymentScheduleItem } from '../../services/loanService';
import MakePaymentModal from './MakePaymentModal';

interface ActiveLoanDetailModalProps {
  loan: Loan | null;
  isOpen: boolean;
  onClose: () => void;
  onMakePaymentRequested?: (loan: Loan) => void;
}

export default function ActiveLoanDetailModal({
  loan,
  isOpen,
  onClose
}: ActiveLoanDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'schedule' | 'documents'>('summary');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<string | null>(null);

  if (!loan || !isOpen) return null;

  const schedule: LoanRepaymentScheduleItem[] = loan.schedule || [];
  const progressPct = Math.min(
    100,
    Math.round(((loan.original_amount - loan.outstanding_balance) / loan.original_amount) * 100)
  );

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/85 backdrop-blur-md"
      />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        transition={{ type: "spring", damping: 25, stiffness: 350 }}
        className="relative w-full max-w-3xl bg-[#0a0d13] border border-white/10 rounded-3xl shadow-2xl p-6 sm:p-8 z-10 overflow-hidden text-left"
      >
        {/* Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />

        {/* Top Header */}
        <div className="flex items-start justify-between gap-4 mb-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                loan.status === 'Active' 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                  : 'bg-white/10 text-white/70 border-white/20'
              }`}>
                {loan.status}
              </span>
              <span className="text-xs font-mono text-white/40">
                {loan.id}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {loan.loan_name}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {loan.status === 'Active' && loan.outstanding_balance > 0 && (
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(true)}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold rounded-xl shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <DollarSign size={14} />
                <span>Make Payment</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Sub Tabs */}
        <div className="flex gap-2 border-b border-white/10 pb-3 mb-6 relative z-10">
          <button
            type="button"
            onClick={() => setActiveTab('summary')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'summary'
                ? 'bg-white/10 text-white'
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            Loan Summary
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('schedule')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'schedule'
                ? 'bg-white/10 text-white'
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            Repayment Schedule ({schedule.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('documents')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'documents'
                ? 'bg-white/10 text-white'
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            Documents & Disclosures
          </button>
        </div>

        {/* TAB 1: SUMMARY */}
        {activeTab === 'summary' && (
          <div className="space-y-6 relative z-10">
            {/* Payoff Progress Bar */}
            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
              <div className="flex justify-between items-center text-xs mb-2">
                <span className="text-white/60 font-medium">Repayment Progress</span>
                <span className="text-emerald-400 font-mono font-bold">{progressPct}% Paid</span>
              </div>
              <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500" 
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-white/40 mt-2 font-mono">
                <span>Principal Repaid: ${(loan.original_amount - loan.outstanding_balance).toLocaleString()}</span>
                <span>Remaining: ${loan.outstanding_balance.toLocaleString()}</span>
              </div>
            </div>

            {/* Core Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 bg-white/[0.02] border border-white/5 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-white/40 block mb-1">
                  Outstanding Balance
                </span>
                <span className="text-lg font-mono font-black text-amber-400">
                  ${loan.outstanding_balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="p-3.5 bg-white/[0.02] border border-white/5 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-white/40 block mb-1">
                  Monthly Payment
                </span>
                <span className="text-lg font-mono font-black text-white">
                  ${loan.monthly_payment.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="p-3.5 bg-white/[0.02] border border-white/5 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-white/40 block mb-1">
                  Interest Rate
                </span>
                <span className="text-lg font-mono font-black text-emerald-400">
                  {loan.interest_rate}% APR
                </span>
              </div>

              <div className="p-3.5 bg-white/[0.02] border border-white/5 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-white/40 block mb-1">
                  Remaining Term
                </span>
                <span className="text-lg font-mono font-black text-white">
                  {loan.remaining_term_months} Months
                </span>
              </div>
            </div>

            {/* Additional Loan Details */}
            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-2.5 text-xs">
              <div className="flex justify-between text-white/60">
                <span>Original Loan Principal</span>
                <span className="font-mono text-white font-bold">${loan.original_amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-white/60">
                <span>Start Date</span>
                <span className="text-white font-medium">{loan.start_date ? new Date(loan.start_date).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div className="flex justify-between text-white/60">
                <span>Next Payment Due Date</span>
                <span className="text-emerald-400 font-medium">{loan.next_payment_date || 'N/A'}</span>
              </div>
              <div className="flex justify-between text-white/60">
                <span>Maturity Date</span>
                <span className="text-white font-medium">{loan.maturity_date || 'N/A'}</span>
              </div>
              <div className="flex justify-between text-white/60">
                <span>Application Reference</span>
                <span className="font-mono text-white/70">{loan.application_id}</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SCHEDULE */}
        {activeTab === 'schedule' && (
          <div className="space-y-4 relative z-10">
            <div className="max-h-80 overflow-y-auto rounded-2xl border border-white/5 bg-white/[0.01]">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/5 text-white/50 sticky top-0 border-b border-white/5 text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">Due Date</th>
                    <th className="p-3">Payment</th>
                    <th className="p-3">Principal</th>
                    <th className="p-3">Interest</th>
                    <th className="p-3">Remaining</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-white/80 font-mono">
                  {schedule.map((item) => (
                    <tr key={item.paymentNumber} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-3 text-white/40">{item.paymentNumber}</td>
                      <td className="p-3 text-white font-sans">{item.dueDate}</td>
                      <td className="p-3 font-bold text-white">${item.amount.toFixed(2)}</td>
                      <td className="p-3 text-emerald-400">${item.principal.toFixed(2)}</td>
                      <td className="p-3 text-white/60">${item.interest.toFixed(2)}</td>
                      <td className="p-3">${item.remainingBalance.toFixed(2)}</td>
                      <td className="p-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-sans font-semibold ${
                          item.status === 'Paid'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-white/5 text-white/60'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: DOCUMENTS (Section 17 Specification) */}
        {activeTab === 'documents' && (
          <div className="space-y-3 relative z-10">
            <p className="text-xs text-white/50 mb-3">
              Official legal notices, truth-in-lending disclosure schedules, and compliance agreements.
            </p>

            {[
              { id: 'agreement', title: 'Master Promissory Note & Loan Agreement', date: loan.start_date || 'Executed' },
              { id: 'schedule_doc', title: 'Truth In Lending (TILA) Amortization Schedule', date: loan.start_date || 'Executed' },
              { id: 'summary_doc', title: 'Application Summary & Underwriting Verification', date: loan.start_date || 'Verified' },
              { id: 'approval_doc', title: 'Formal Credit Approval Notice', date: loan.start_date || 'Approved' }
            ].map((docItem) => (
              <div
                key={docItem.id}
                className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between hover:bg-white/[0.04] transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-emerald-400">
                    <FileText size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white tracking-tight">
                      {docItem.title}
                    </h4>
                    <span className="text-[10px] text-white/40 font-mono">
                      Ref: {loan.id}-{docItem.id.toUpperCase()} • Generated
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setViewingDoc(docItem.title)}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye size={13} />
                  <span>View</span>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Document Quick Preview Modal */}
        <AnimatePresence>
          {viewingDoc && (
            <div className="fixed inset-0 z-[1300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-lg bg-[#0b0e14] border border-white/10 rounded-3xl p-6 text-left space-y-4 shadow-2xl"
              >
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <FileText size={18} className="text-emerald-400" />
                    <h3 className="text-sm font-bold text-white">{viewingDoc}</h3>
                  </div>
                  <button
                    onClick={() => setViewingDoc(null)}
                    className="p-1 rounded-lg text-white/60 hover:text-white"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl text-xs text-white/70 space-y-2 leading-relaxed font-mono">
                  <p className="font-bold text-white uppercase text-[10px] tracking-wider">
                    CGA FINANCIAL & LENDING COMPLIANCE ARCHIVE
                  </p>
                  <p>Document: {viewingDoc}</p>
                  <p>Borrower: {loan.user_name} ({loan.user_id})</p>
                  <p>Loan Ref: {loan.id}</p>
                  <p>Principal: ${loan.original_amount.toLocaleString()}</p>
                  <p>Interest Rate: {loan.interest_rate}% APR</p>
                  <p>Term: {loan.term_months} Months</p>
                  <p className="text-[10px] text-white/40 pt-2 border-t border-white/5">
                    This document is digitally sealed and recorded in the immutable compliance ledger.
                  </p>
                </div>

                <button
                  onClick={() => setViewingDoc(null)}
                  className="w-full py-2.5 rounded-xl bg-white/10 text-white text-xs font-bold hover:bg-white/15"
                >
                  Close Document
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Embedded Make Payment Modal */}
        <MakePaymentModal
          loan={loan}
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
        />
      </motion.div>
    </div>
  );
}
