import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Landmark, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  User, 
  Mail, 
  Phone, 
  DollarSign, 
  Calendar, 
  FileText, 
  AlertCircle, 
  Eye, 
  ArrowRight,
  ShieldCheck,
  Send,
  CreditCard,
  Briefcase,
  Layers,
  History,
  Check
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  LoanApplication, 
  Loan, 
  LoanAuditLog, 
  LOAN_PRODUCTS,
  subscribeAllLoanApplications, 
  subscribeAllLoans,
  subscribeLoanAuditLogs,
  adminReviewLoanApplication,
  adminDisburseLoan,
  calculateMonthlyPayment
} from '../../services/loanService';
import LoanIcon from '../Loans/LoanIcon';

interface CipherLoansAdminProps {
  currentUserEmail?: string;
}

export default function CipherLoansAdmin({ currentUserEmail = 'cipher_root' }: CipherLoansAdminProps) {
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [auditLogs, setAuditLogs] = useState<LoanAuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'applications' | 'active_loans' | 'audit_trail'>('applications');

  // Review Modal State
  const [selectedApp, setSelectedApp] = useState<LoanApplication | null>(null);
  const [reviewDecision, setReviewDecision] = useState<string>('Under Review');
  const [approvedAmount, setApprovedAmount] = useState<string>('');
  const [approvedTerm, setApprovedTerm] = useState<string>('');
  const [approvedRate, setApprovedRate] = useState<string>('5.9');
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Disbursement Modal State
  const [appToDisburse, setAppToDisburse] = useState<LoanApplication | null>(null);
  const [disbursementTarget, setDisbursementTarget] = useState<'available_balance' | 'external_payout'>('available_balance');
  const [isDisbursing, setIsDisbursing] = useState(false);

  // Subscriptions
  useEffect(() => {
    setLoading(true);
    const unsubApps = subscribeAllLoanApplications(
      (list) => {
        setApplications(list);
        setLoading(false);
      },
      (err) => {
        console.error("Admin applications sync error:", err);
        setLoading(false);
      }
    );

    const unsubLoans = subscribeAllLoans(
      (list) => setLoans(list),
      (err) => console.error("Admin loans sync error:", err)
    );

    const unsubAudit = subscribeLoanAuditLogs(
      undefined,
      (logs) => setAuditLogs(logs),
      (err) => console.error("Admin audit sync error:", err)
    );

    return () => {
      unsubApps();
      unsubLoans();
      unsubAudit();
    };
  }, []);

  // When selected app changes, pre-populate review fields
  useEffect(() => {
    if (selectedApp) {
      setReviewDecision(selectedApp.status === 'Submitted' ? 'Under Review' : selectedApp.status);
      setApprovedAmount((selectedApp.approved_amount || selectedApp.requested_amount).toString());
      setApprovedTerm((selectedApp.approved_term_months || selectedApp.requested_term_months).toString());
      setApprovedRate((selectedApp.approved_interest_rate || 5.9).toString());
      setReviewNotes(selectedApp.review_notes || '');
    }
  }, [selectedApp]);

  // Filtering
  const filteredApps = applications.filter((app) => {
    const matchesStatus = statusFilter === 'all' || app.status.toLowerCase() === statusFilter.toLowerCase();
    const query = searchQuery.toLowerCase().trim();
    const matchesQuery = !query || 
      app.user_name.toLowerCase().includes(query) ||
      app.user_email.toLowerCase().includes(query) ||
      app.id.toLowerCase().includes(query) ||
      app.loan_type.toLowerCase().includes(query);
    return matchesStatus && matchesQuery;
  });

  const filteredLoans = loans.filter((ln) => {
    const query = searchQuery.toLowerCase().trim();
    return !query || 
      ln.user_name.toLowerCase().includes(query) ||
      ln.user_email.toLowerCase().includes(query) ||
      ln.id.toLowerCase().includes(query) ||
      ln.loan_name.toLowerCase().includes(query);
  });

  // Metrics
  const totalVolumeDisbursed = loans.reduce((acc, l) => acc + (l.original_amount || 0), 0);
  const totalOutstandingBalance = loans.reduce((acc, l) => acc + (l.outstanding_balance || 0), 0);
  const pendingReviewCount = applications.filter(a => a.status === 'Submitted' || a.status === 'Under Review').length;
  const activeLoansCount = loans.filter(l => l.status === 'Active').length;

  // Handle Review Submission
  const handleSaveReview = async () => {
    if (!selectedApp) return;

    setIsProcessing(true);
    try {
      await adminReviewLoanApplication(
        selectedApp.id,
        reviewDecision as any,
        {
          approvedAmount: parseFloat(approvedAmount) || selectedApp.requested_amount,
          approvedTermMonths: parseInt(approvedTerm, 10) || selectedApp.requested_term_months,
          approvedInterestRate: parseFloat(approvedRate) || 5.9,
          notes: reviewNotes.trim()
        },
        currentUserEmail
      );

      toast.success(`Application updated to ${reviewDecision}`);
      setSelectedApp(null);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to update review status.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Loan Disbursement
  const handleExecuteDisbursement = async () => {
    if (!appToDisburse) return;

    setIsDisbursing(true);
    try {
      const loanId = await adminDisburseLoan(
        appToDisburse.id,
        disbursementTarget,
        currentUserEmail
      );

      toast.success(`Loan successfully disbursed! ID: ${loanId}`);
      setAppToDisburse(null);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to disburse loan.");
    } finally {
      setIsDisbursing(false);
    }
  };

  return (
    <div className="space-y-8 text-left">
      {/* Top Analytics Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white/[0.03] border border-white/5 rounded-3xl">
          <span className="text-[10px] uppercase font-bold tracking-widest text-aura-muted block mb-1">
            Total Applications
          </span>
          <span className="text-2xl font-black font-mono text-white">
            {applications.length}
          </span>
          <span className="text-[11px] text-amber-400 block mt-1 font-semibold">
            {pendingReviewCount} Pending Review
          </span>
        </div>

        <div className="p-5 bg-white/[0.03] border border-white/5 rounded-3xl">
          <span className="text-[10px] uppercase font-bold tracking-widest text-aura-muted block mb-1">
            Active Loans
          </span>
          <span className="text-2xl font-black font-mono text-emerald-400">
            {activeLoansCount}
          </span>
          <span className="text-[11px] text-white/50 block mt-1">
            {loans.length} Total Originated
          </span>
        </div>

        <div className="p-5 bg-white/[0.03] border border-white/5 rounded-3xl">
          <span className="text-[10px] uppercase font-bold tracking-widest text-aura-muted block mb-1">
            Total Disbursed Volume
          </span>
          <span className="text-2xl font-black font-mono text-white">
            ${totalVolumeDisbursed.toLocaleString()}
          </span>
          <span className="text-[11px] text-white/50 block mt-1">
            Across 20 Loan Products
          </span>
        </div>

        <div className="p-5 bg-white/[0.03] border border-white/5 rounded-3xl">
          <span className="text-[10px] uppercase font-bold tracking-widest text-aura-muted block mb-1">
            Total Outstanding
          </span>
          <span className="text-2xl font-black font-mono text-amber-400">
            ${totalOutstandingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[11px] text-emerald-400 block mt-1 font-semibold">
            Principal Portfolio
          </span>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('applications')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'applications'
                ? 'bg-aura-lime text-black'
                : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            Applications ({applications.length})
          </button>

          <button
            onClick={() => setViewMode('active_loans')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'active_loans'
                ? 'bg-aura-lime text-black'
                : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            Originated Loans ({loans.length})
          </button>

          <button
            onClick={() => setViewMode('audit_trail')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'audit_trail'
                ? 'bg-aura-lime text-black'
                : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            Audit Trail ({auditLogs.length})
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-2.5">
          <div className="relative w-64">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search user, ID, email..."
              className="w-full pl-9 pr-3.5 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-white/40 focus:outline-none focus:border-aura-lime"
            />
          </div>

          {viewMode === 'applications' && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#0b0e14]">All Statuses</option>
              <option value="submitted" className="bg-[#0b0e14]">Submitted</option>
              <option value="under review" className="bg-[#0b0e14]">Under Review</option>
              <option value="offer available" className="bg-[#0b0e14]">Offer Available</option>
              <option value="approved" className="bg-[#0b0e14]">Approved</option>
              <option value="accepted" className="bg-[#0b0e14]">Accepted</option>
              <option value="disbursed" className="bg-[#0b0e14]">Disbursed</option>
              <option value="declined" className="bg-[#0b0e14]">Declined</option>
            </select>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. APPLICATIONS TABLE */}
      {/* ------------------------------------------------------------- */}
      {viewMode === 'applications' && (
        <div className="bg-[#0b0e14]/90 border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/[0.03] text-white/50 uppercase tracking-wider text-[10px] border-b border-white/5">
                <tr>
                  <th className="p-4">App ID</th>
                  <th className="p-4">Applicant</th>
                  <th className="p-4">Loan Type</th>
                  <th className="p-4">Requested</th>
                  <th className="p-4">Term</th>
                  <th className="p-4">Income / Exp</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white/80">
                {filteredApps.map((app) => (
                  <tr key={app.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 font-mono font-bold text-white/60">
                      {app.id}
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-white">{app.user_name}</div>
                      <div className="text-[10px] text-white/40">{app.user_email}</div>
                    </td>
                    <td className="p-4">
                      <span className="font-semibold text-white capitalize">
                        {app.loan_type}
                      </span>
                    </td>
                    <td className="p-4 font-mono font-bold text-emerald-400">
                      ${app.requested_amount.toLocaleString()}
                    </td>
                    <td className="p-4 font-mono text-white/70">
                      {app.requested_term_months} mo
                    </td>
                    <td className="p-4 font-mono text-[11px] text-white/60">
                      ${app.monthly_income} / ${app.monthly_expenses}
                    </td>
                    <td className="p-4 text-white/50 font-mono text-[11px]">
                      {new Date(app.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                        app.status === 'Submitted' || app.status === 'Under Review'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : app.status === 'Offer Available' || app.status === 'Approved'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : app.status === 'Accepted'
                          ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 animate-pulse'
                          : app.status === 'Disbursed'
                          ? 'bg-teal-500/10 text-teal-400 border-teal-500/20'
                          : 'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedApp(app)}
                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                      >
                        Review
                      </button>

                      {app.status === 'Accepted' && (
                        <button
                          onClick={() => setAppToDisburse(app)}
                          className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold rounded-lg transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
                        >
                          Disburse
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredApps.length === 0 && (
              <div className="text-center py-12 text-white/40">
                No loan applications matching current criteria.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. ORIGINATED ACTIVE LOANS TABLE */}
      {/* ------------------------------------------------------------- */}
      {viewMode === 'active_loans' && (
        <div className="bg-[#0b0e14]/90 border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/[0.03] text-white/50 uppercase tracking-wider text-[10px] border-b border-white/5">
                <tr>
                  <th className="p-4">Loan ID</th>
                  <th className="p-4">Borrower</th>
                  <th className="p-4">Loan Name</th>
                  <th className="p-4">Original</th>
                  <th className="p-4">Outstanding</th>
                  <th className="p-4">Monthly</th>
                  <th className="p-4">APR</th>
                  <th className="p-4">Next Payment</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white/80">
                {filteredLoans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 font-mono font-bold text-white/70">{loan.id}</td>
                    <td className="p-4">
                      <div className="font-bold text-white">{loan.user_name}</div>
                      <div className="text-[10px] text-white/40">{loan.user_email}</div>
                    </td>
                    <td className="p-4 font-semibold text-white">{loan.loan_name}</td>
                    <td className="p-4 font-mono text-white/70">${loan.original_amount.toLocaleString()}</td>
                    <td className="p-4 font-mono font-bold text-amber-400">
                      ${loan.outstanding_balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-4 font-mono text-white">
                      ${loan.monthly_payment.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-4 font-mono text-emerald-400">{loan.interest_rate}%</td>
                    <td className="p-4 font-mono text-white/70">{loan.next_payment_date || 'N/A'}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                        loan.status === 'Active'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-white/10 text-white/60 border-white/10'
                      }`}>
                        {loan.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredLoans.length === 0 && (
              <div className="text-center py-12 text-white/40">
                No active originated loans recorded.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. AUDIT TRAIL VIEW */}
      {/* ------------------------------------------------------------- */}
      {viewMode === 'audit_trail' && (
        <div className="bg-[#0b0e14]/90 border border-white/5 rounded-3xl p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Immutable Underwriting & Operational Audit Trail
            </h3>
            <span className="text-xs text-white/40 font-mono">{auditLogs.length} events logged</span>
          </div>

          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-2">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold text-white">{log.action}</span>
                    <span className="font-mono text-[10px] text-white/40">({log.actor})</span>
                  </div>
                  <p className="text-white/60 text-[11px]">{log.reason || 'Underwriting action executed'}</p>
                </div>

                <div className="text-right font-mono text-[11px] text-white/40">
                  {new Date(log.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* REVIEW & DECISION MODAL */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {selectedApp && (
          <div className="fixed inset-0 z-[1300] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedApp(null)}
              className="fixed inset-0 bg-black/85 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl bg-[#0b0e14] border border-white/10 rounded-3xl shadow-2xl p-6 sm:p-8 z-10 overflow-hidden text-left space-y-6"
            >
              {/* Header */}
              <div className="flex justify-between items-start border-b border-white/10 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono font-bold uppercase text-aura-lime">
                      Compliance Underwriter Review
                    </span>
                    <span className="text-xs font-mono text-white/40">• {selectedApp.id}</span>
                  </div>
                  <h3 className="text-xl font-bold text-white tracking-tight">
                    {selectedApp.user_name} — {selectedApp.loan_type} Loan
                  </h3>
                </div>

                <button
                  onClick={() => setSelectedApp(null)}
                  className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white"
                >
                  <XCircle size={18} />
                </button>
              </div>

              {/* Applicant Profile Grid */}
              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-white/40 block text-[10px] uppercase">Applicant</span>
                  <span className="font-semibold text-white">{selectedApp.user_name}</span>
                </div>
                <div>
                  <span className="text-white/40 block text-[10px] uppercase">Email</span>
                  <span className="text-white truncate block">{selectedApp.user_email}</span>
                </div>
                <div>
                  <span className="text-white/40 block text-[10px] uppercase">Phone</span>
                  <span className="text-white">{selectedApp.user_phone || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-white/40 block text-[10px] uppercase">Employment</span>
                  <span className="text-white font-medium">{selectedApp.employment_status} ({selectedApp.employer || 'Self'})</span>
                </div>
                <div>
                  <span className="text-white/40 block text-[10px] uppercase">Monthly Income</span>
                  <span className="font-mono text-emerald-400 font-bold">${selectedApp.monthly_income}</span>
                </div>
                <div>
                  <span className="text-white/40 block text-[10px] uppercase">Monthly Expenses</span>
                  <span className="font-mono text-amber-400 font-bold">${selectedApp.monthly_expenses}</span>
                </div>
                <div className="sm:col-span-3 pt-1 border-t border-white/5">
                  <span className="text-white/40 block text-[10px] uppercase">Address</span>
                  <span className="text-white/80">{selectedApp.address || 'Address on file'}</span>
                </div>
              </div>

              {/* Financial & Collateral info if present */}
              {selectedApp.financial_details && (
                <div className="p-3.5 bg-white/[0.02] border border-white/5 rounded-2xl text-xs space-y-1">
                  <span className="text-[10px] uppercase font-bold text-white/50 block mb-1">
                    Financial Settlement & Collateral Data
                  </span>
                  {selectedApp.financial_details.bank_name && (
                    <div className="text-white/70">
                      Bank: {selectedApp.financial_details.bank_name} • Routing: {selectedApp.financial_details.routing_number || 'N/A'}
                    </div>
                  )}
                  {selectedApp.financial_details.collateral_description && (
                    <div className="text-amber-400 font-medium">
                      Collateral: {selectedApp.financial_details.collateral_description} (Est. ${selectedApp.financial_details.collateral_estimated_value?.toLocaleString()})
                    </div>
                  )}
                </div>
              )}

              {/* Decision Workflow Form */}
              <div className="space-y-4 pt-2 border-t border-white/10">
                <h4 className="text-xs font-bold uppercase tracking-wider text-aura-lime">
                  Underwriting Decision & Terms
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-white/70 block mb-1">
                      Status Decision
                    </label>
                    <select
                      value={reviewDecision}
                      onChange={(e) => setReviewDecision(e.target.value)}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-aura-lime cursor-pointer"
                    >
                      <option value="Under Review" className="bg-[#0b0e14]">Under Review</option>
                      <option value="Additional Information Required" className="bg-[#0b0e14]">Additional Info Required</option>
                      <option value="Offer Available" className="bg-[#0b0e14]">Offer Available (Approve with Terms)</option>
                      <option value="Declined" className="bg-[#0b0e14]">Declined</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-white/70 block mb-1">
                      Approved Amount ($)
                    </label>
                    <input
                      type="number"
                      value={approvedAmount}
                      onChange={(e) => setApprovedAmount(e.target.value)}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-mono font-bold text-white focus:outline-none focus:border-aura-lime"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-white/70 block mb-1">
                      Approved Term (Months)
                    </label>
                    <input
                      type="number"
                      value={approvedTerm}
                      onChange={(e) => setApprovedTerm(e.target.value)}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-mono font-bold text-white focus:outline-none focus:border-aura-lime"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-white/70 block mb-1">
                      Approved APR (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={approvedRate}
                      onChange={(e) => setApprovedRate(e.target.value)}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-mono font-bold text-white focus:outline-none focus:border-aura-lime"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-white/70 block mb-1">
                    Compliance & Underwriter Notes
                  </label>
                  <textarea
                    rows={2}
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Provide notes visible to user and recorded in the audit log..."
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-aura-lime"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedApp(null)}
                  disabled={isProcessing}
                  className="w-1/3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveReview}
                  disabled={isProcessing}
                  className="flex-1 py-2.5 rounded-xl bg-aura-lime hover:bg-lime-400 text-black text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-lime-500/20 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <span>Saving Decision...</span>
                  ) : (
                    <>
                      <CheckCircle2 size={15} />
                      <span>Commit Underwriting Decision</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------- */}
      {/* DISBURSEMENT CONFIRMATION MODAL */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {appToDisburse && (
          <div className="fixed inset-0 z-[1300] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAppToDisburse(null)}
              className="fixed inset-0 bg-black/85 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-[#0b0e14] border border-white/10 rounded-3xl p-6 z-10 text-left space-y-4 shadow-2xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <DollarSign size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Execute Loan Disbursement
                  </h3>
                  <p className="text-xs text-white/50">
                    {appToDisburse.user_name} • ${appToDisburse.approved_amount || appToDisburse.requested_amount}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-semibold text-white/70 block">
                  Disbursement Destination
                </label>
                <div className="space-y-2">
                  <label className="p-3 bg-white/[0.03] border border-white/5 rounded-xl flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="disbursementTarget"
                      checked={disbursementTarget === 'available_balance'}
                      onChange={() => setDisbursementTarget('available_balance')}
                      className="text-emerald-500"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-white block">CGA Available Balance</span>
                      <span className="text-white/50 text-[11px]">Instant credit to borrower's account balance</span>
                    </div>
                  </label>

                  <label className="p-3 bg-white/[0.03] border border-white/5 rounded-xl flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="disbursementTarget"
                      checked={disbursementTarget === 'external_payout'}
                      onChange={() => setDisbursementTarget('external_payout')}
                      className="text-emerald-500"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-white block">External Wire / Settlement</span>
                      <span className="text-white/50 text-[11px]">Disbursed to external bank account</span>
                    </div>
                  </label>
                </div>
              </div>

              <p className="text-[11px] text-white/50 leading-relaxed">
                Disbursement creates the official active loan in the ledger, generates the amortization schedule, and logs a permanent disbursement transaction.
              </p>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAppToDisburse(null)}
                  disabled={isDisbursing}
                  className="w-1/3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteDisbursement}
                  disabled={isDisbursing}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
                >
                  {isDisbursing ? 'Disbursing...' : 'Confirm & Disburse'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
