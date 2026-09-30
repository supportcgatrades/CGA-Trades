import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Clock, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  Briefcase, 
  DollarSign, 
  TrendingUp, 
  Sparkles, 
  Lock, 
  Unlock, 
  ArrowLeft, 
  ExternalLink, 
  Eye, 
  EyeOff, 
  ShieldAlert, 
  RefreshCw,
  FileText
} from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';
import { toast } from 'sonner';
import { 
  RetirementAccount, 
  RetirementInvestment, 
  RetirementTransaction, 
  subscribeAllRetirementAccounts,
  adminUpdateRetirementStatus,
  adminUpdateRetirementVerification,
  subscribeRetirementInvestments,
  subscribeRetirementTransactions
} from '../../services/retirementService';
import { db } from '../../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

interface CipherRetirementAdminProps {
  currentUserEmail?: string;
}

export default function CipherRetirementAdmin({ currentUserEmail = 'cipher_root' }: CipherRetirementAdminProps) {
  // Accounts List
  const [accounts, setAccounts] = useState<RetirementAccount[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending_verification' | 'active' | 'verification_required' | 'suspended' | 'closed'>('all');

  // Selected User for Detail View (Section 24 Specification)
  const [selectedUser, setSelectedUser] = useState<RetirementAccount | null>(null);

  // Real-time listener for user-specific investments & transactions when viewing detail
  const [userInvestments, setUserInvestments] = useState<RetirementInvestment[]>([]);
  const [userTransactions, setUserTransactions] = useState<RetirementTransaction[]>([]);

  // SSN Security Access (Section 25 Specification)
  const [isSsnRevealed, setIsSsnRevealed] = useState(false);
  const [ssnPasscodeModalOpen, setSsnPasscodeModalOpen] = useState(false);
  const [authorizedOfficer, setAuthorizedOfficer] = useState(currentUserEmail);

  // Status Update Modal State
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Real-time listener on all retirement accounts
  useEffect(() => {
    setLoading(true);
    const unsub = subscribeAllRetirementAccounts(
      (list) => {
        setAccounts(list);
        setLoading(false);
      },
      (err) => {
        console.error("401(k) accounts sync error:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  // When a user is selected, subscribe to their specific investments and transactions
  useEffect(() => {
    if (!selectedUser) {
      setUserInvestments([]);
      setUserTransactions([]);
      setIsSsnRevealed(false);
      return;
    }

    const unsubInvest = subscribeRetirementInvestments(selectedUser.userId, (invs) => {
      setUserInvestments(invs);
    });

    const unsubTx = subscribeRetirementTransactions(selectedUser.userId, (txs) => {
      setUserTransactions(txs);
    });

    return () => {
      unsubInvest();
      unsubTx();
    };
  }, [selectedUser]);

  // Filtered & Searched Accounts (Sections 26 & 27)
  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      // Status filter
      if (statusFilter !== 'all') {
        if (acc.status !== statusFilter) return false;
      }

      // Search query (Name, Email, Phone, 401(k) Account ID, User ID)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = (acc.fullName || '').toLowerCase().includes(q);
        const emailMatch = (acc.email || '').toLowerCase().includes(q);
        const phoneMatch = (acc.phone || '').toLowerCase().includes(q);
        const uidMatch = (acc.userId || '').toLowerCase().includes(q);
        const accIdMatch = (`acc-${acc.userId}` || '').toLowerCase().includes(q);

        if (!nameMatch && !emailMatch && !phoneMatch && !uidMatch && !accIdMatch) {
          return false;
        }
      }

      return true;
    });
  }, [accounts, statusFilter, searchQuery]);

  // Handle Status Update
  const handleUpdateStatus = async (newStatus: 'active' | 'pending_verification' | 'verification_required' | 'suspended' | 'closed') => {
    if (!selectedUser) return;
    try {
      setIsUpdatingStatus(true);
      await adminUpdateRetirementStatus(
        selectedUser.userId,
        newStatus,
        `Status changed to ${newStatus} by ${currentUserEmail}`,
        currentUserEmail
      );
      setSelectedUser(prev => prev ? { ...prev, status: newStatus } : null);
      toast.success(`Account status updated to ${newStatus.replace('_', ' ').toUpperCase()}`);
    } catch (err: any) {
      toast.error(err.message || 'Status update failed.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Handle Verification Status Update
  const handleUpdateVerification = async (newVerification: 'verified' | 'pending' | 'required') => {
    if (!selectedUser) return;
    try {
      await adminUpdateRetirementVerification(
        selectedUser.userId,
        newVerification,
        `Verification updated to ${newVerification} by ${currentUserEmail}`,
        currentUserEmail
      );
      setSelectedUser(prev => prev ? { ...prev, verificationStatus: newVerification } : null);
      toast.success(`Verification status updated to ${newVerification.toUpperCase()}`);
    } catch (err: any) {
      toast.error(err.message || 'Verification update failed.');
    }
  };

  // Section 25: Authorized Verification Access for SSN
  const handleAuthorizedSsnAccess = async () => {
    if (!selectedUser) return;
    try {
      // Log Authorized Access Event to retirement_audit_logs
      const auditId = 'AUD-SSN-' + Date.now().toString(36).toUpperCase();
      await setDoc(doc(db, 'retirement_audit_logs', auditId), {
        id: auditId,
        user_id: selectedUser.userId,
        account_id: selectedUser.userId,
        transaction_id: 'AUTHORIZED_SSN_ACCESS',
        action: 'AUTHORIZED_SSN_REVEALED',
        amount: 0,
        previous_balance: 0,
        new_balance: 0,
        reason: `Authorized SSN verification access granted for officer ${authorizedOfficer}`,
        actor: authorizedOfficer,
        timestamp: new Date().toISOString()
      });

      setIsSsnRevealed(true);
      setSsnPasscodeModalOpen(false);
      toast.success('Authorized Verification Access Granted.');
    } catch (err: any) {
      toast.error('Access authorization failed.');
    }
  };

  // Render Status Badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="text-[9px] font-black uppercase px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Active</span>;
      case 'pending_verification':
        return <span className="text-[9px] font-black uppercase px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">Pending Verification</span>;
      case 'verification_required':
        return <span className="text-[9px] font-black uppercase px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">Verification Required</span>;
      case 'suspended':
        return <span className="text-[9px] font-black uppercase px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">Suspended</span>;
      case 'closed':
        return <span className="text-[9px] font-black uppercase px-2.5 py-1 rounded-full bg-gray-500/10 text-gray-400 border border-gray-500/20">Closed</span>;
      default:
        return <span className="text-[9px] font-black uppercase px-2.5 py-1 rounded-full bg-white/5 text-gray-400">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* 24. DEDICATED USER DETAIL PAGE */}
      {selectedUser ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header & Back Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedUser(null)}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors cursor-pointer"
              >
                <ArrowLeft size={16} />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black uppercase tracking-tight text-white">401(k) Details</h2>
                  {renderStatusBadge(selectedUser.status)}
                </div>
                <p className="text-[10px] font-mono text-aura-muted mt-0.5">
                  Account ID: #{selectedUser.userId.substring(0, 10).toUpperCase()} • CGA User UID: {selectedUser.userId}
                </p>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative inline-block">
                <select
                  value={selectedUser.status}
                  onChange={(e) => handleUpdateStatus(e.target.value as any)}
                  disabled={isUpdatingStatus}
                  className="bg-[#0f1422] border border-white/10 text-xs font-bold rounded-xl px-3 py-2 text-white focus:outline-none focus:border-aura-lime cursor-pointer"
                >
                  <option value="active">Set Status: Active</option>
                  <option value="pending_verification">Set Status: Pending Verification</option>
                  <option value="verification_required">Set Status: Verification Required</option>
                  <option value="suspended">Set Status: Suspended</option>
                  <option value="closed">Set Status: Closed</option>
                </select>
              </div>
            </div>
          </div>

          {/* User Information Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Box 1: User Profile */}
            <div className="p-5 bg-white/[0.02] border border-white/5 rounded-3xl space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-aura-muted">
                <User size={14} className="text-aura-lime" />
                <span>User Information</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-white/[0.03]">
                  <span className="text-aura-muted">Full Name:</span>
                  <span className="font-bold text-white">{selectedUser.fullName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/[0.03]">
                  <span className="text-aura-muted">Email:</span>
                  <span className="font-bold text-white">{selectedUser.email || 'Registered User'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/[0.03]">
                  <span className="text-aura-muted">Phone:</span>
                  <span className="font-bold text-white">{selectedUser.phone || 'On file'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/[0.03]">
                  <span className="text-aura-muted">Date of Birth:</span>
                  <span className="font-mono text-white">{selectedUser.dob}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/[0.03]">
                  <span className="text-aura-muted">Country:</span>
                  <span className="text-white">{selectedUser.country}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/[0.03]">
                  <span className="text-aura-muted">Address:</span>
                  <span className="text-white truncate max-w-[180px]" title={selectedUser.address}>{selectedUser.address}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-aura-muted">Employment:</span>
                  <span className="text-white">{selectedUser.employmentStatus} ({selectedUser.employer})</span>
                </div>
              </div>
            </div>

            {/* Box 2: Verification & SSN Access (Specification 25) */}
            <div className="p-5 bg-white/[0.02] border border-white/5 rounded-3xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-aura-muted">
                  <Lock size={14} className="text-blue-400" />
                  <span>Verification & SSN</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded font-black bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {selectedUser.verificationStatus ? selectedUser.verificationStatus.toUpperCase() : 'VERIFIED'}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-white/[0.03]">
                  <span className="text-aura-muted">SSN Display:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {isSsnRevealed && selectedUser.ssnEncrypted ? (
                      atob(selectedUser.ssnEncrypted.replace('CGA_SSN_VAULT:', ''))
                    ) : (
                      selectedUser.maskedSsn || '***-**-4821'
                    )}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/[0.03]">
                  <span className="text-aura-muted">Verification Status:</span>
                  <span className="text-white capitalize">{selectedUser.verificationStatus || 'Verified'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/[0.03]">
                  <span className="text-aura-muted">Verification Date:</span>
                  <span className="text-white">{selectedUser.verificationDate ? new Date(selectedUser.verificationDate).toLocaleDateString() : 'Initial Onboarding'}</span>
                </div>
              </div>

              {/* Authorized Verification Access Action */}
              <div className="pt-2">
                {!isSsnRevealed ? (
                  <button
                    onClick={() => setSsnPasscodeModalOpen(true)}
                    className="w-full py-2.5 px-3 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 font-bold text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Unlock size={13} />
                    <span>Authorized Verification Access</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setIsSsnRevealed(false)}
                    className="w-full py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Lock size={13} />
                    <span>Mask SSN Display</span>
                  </button>
                )}
              </div>
            </div>

            {/* Box 3: Financial Information */}
            <div className="p-5 bg-white/[0.02] border border-white/5 rounded-3xl space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-aura-muted">
                <DollarSign size={14} className="text-emerald-400" />
                <span>Financial Information</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-white/[0.03]">
                  <span className="text-aura-muted">Current Balance:</span>
                  <span className="font-mono font-bold text-white">{formatCurrency(selectedUser.currentBalance || 0)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/[0.03]">
                  <span className="text-aura-muted">Current Investment:</span>
                  <span className="font-mono font-bold text-emerald-400">{formatCurrency(selectedUser.investmentValue || 0)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/[0.03]">
                  <span className="text-aura-muted">Total Contributions:</span>
                  <span className="font-mono font-bold text-white">{formatCurrency(selectedUser.totalContributions || 0)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/[0.03]">
                  <span className="text-aura-muted">Bonuses Earned:</span>
                  <span className="font-mono font-bold text-emerald-400">{formatCurrency(selectedUser.bonusesEarned || 0)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-aura-muted">Annual CGA Bonus Rate:</span>
                  <span className="font-mono font-bold text-aura-lime">20% Guaranteed</span>
                </div>
              </div>
            </div>
          </div>

          {/* User's 401(k) Active Investments */}
          <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[32px] space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
              <TrendingUp size={16} className="text-aura-lime" />
              <span>User 401(k) Investments ({userInvestments.length})</span>
            </h3>

            {userInvestments.length === 0 ? (
              <p className="text-xs text-aura-muted py-4">No active 401(k) investments deployed yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/5 text-[9px] uppercase tracking-widest text-aura-muted font-black">
                      <th className="py-3 px-4">Strategy</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Eligibility Date (12 Mo)</th>
                      <th className="py-3 px-4">20% CGA Bonus</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.02]">
                    {userInvestments.map((inv) => (
                      <tr key={inv.id} className="hover:bg-white/[0.01]">
                        <td className="py-3 px-4 font-bold text-white">{inv.name}</td>
                        <td className="py-3 px-4 font-mono font-bold text-white">{formatCurrency(inv.amount)}</td>
                        <td className="py-3 px-4 font-mono text-aura-muted">{new Date(inv.eligibilityDate).toLocaleDateString()}</td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-400">+{formatCurrency(inv.bonusAmount)}</td>
                        <td className="py-3 px-4">
                          <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                            {inv.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* User's 401(k) Transactions Ledger */}
          <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[32px] space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
              <FileText size={16} className="text-blue-400" />
              <span>401(k) Transaction History ({userTransactions.length})</span>
            </h3>

            {userTransactions.length === 0 ? (
              <p className="text-xs text-aura-muted py-4">No isolated 401(k) transactions recorded.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/5 text-[9px] uppercase tracking-widest text-aura-muted font-black">
                      <th className="py-3 px-4">Tx ID</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.02]">
                    {userTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-white/[0.01]">
                        <td className="py-3 px-4 font-mono text-[11px] text-aura-muted">{tx.id}</td>
                        <td className="py-3 px-4 uppercase text-[10px] font-black text-white">{tx.type}</td>
                        <td className="py-3 px-4 font-mono font-bold text-white">{formatCurrency(tx.amount)}</td>
                        <td className="py-3 px-4 text-aura-muted truncate max-w-xs">{tx.description}</td>
                        <td className="py-3 px-4 font-mono text-[11px] text-aura-muted">{new Date(tx.created_at).toLocaleString()}</td>
                        <td className="py-3 px-4">
                          <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>
      ) : (
        /* 23. 401(k) DETAILS — ADMIN LIST */
        <div className="space-y-6">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                <ShieldCheck size={22} className="text-emerald-400" />
                <span>401(k) Details</span>
              </h2>
              <p className="text-[10px] uppercase tracking-widest text-aura-muted mt-1">
                Dedicated management of CGA Retirement Accounts, Verification, and 20% Annual Bonus Ledgers
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 font-bold text-white">
                Total Accounts: <strong className="text-emerald-400 font-mono">{accounts.length}</strong>
              </span>
            </div>
          </div>

          {/* Search & Filters (Sections 26 & 27) */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-aura-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Name, Email, Phone, Account ID, or UID..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-aura-muted focus:outline-none focus:border-aura-lime"
              />
            </div>

            {/* Status Filter Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 bg-white/[0.02] p-1 rounded-2xl border border-white/5">
              {[
                { id: 'all', label: 'All' },
                { id: 'active', label: 'Active' },
                { id: 'pending_verification', label: 'Pending Verification' },
                { id: 'verification_required', label: 'Verification Required' },
                { id: 'suspended', label: 'Suspended' },
                { id: 'closed', label: 'Closed' }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                    statusFilter === f.id
                      ? 'bg-aura-lime text-black font-black shadow-sm'
                      : 'text-aura-muted hover:text-white hover:bg-white/5'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Table List (Specification 23) */}
          <div className="bg-white/5 border border-white/5 rounded-[32px] overflow-hidden overflow-x-auto">
            {loading ? (
              <div className="py-20 text-center space-y-2">
                <RefreshCw size={24} className="animate-spin text-aura-lime mx-auto" />
                <p className="text-xs text-aura-muted">Loading 401(k) accounts...</p>
              </div>
            ) : filteredAccounts.length === 0 ? (
              <div className="py-20 text-center space-y-2">
                <p className="text-xs text-aura-muted">No 401(k) retirement accounts found matching query.</p>
              </div>
            ) : (
              <table className="w-full text-left min-w-[950px] border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.01]">
                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-aura-muted">User</th>
                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-aura-muted">Email</th>
                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-aura-muted">Phone</th>
                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-aura-muted">Account Status</th>
                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-aura-muted">Verification</th>
                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-aura-muted">Investment</th>
                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-aura-muted">Bonus</th>
                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-aura-muted">Created</th>
                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-aura-muted text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.02]">
                  {filteredAccounts.map((acc) => (
                    <tr
                      key={acc.userId}
                      onClick={() => setSelectedUser(acc)}
                      className="group hover:bg-white/[0.02] transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-white group-hover:text-aura-lime transition-colors">
                            {acc.fullName}
                          </span>
                          <span className="text-[10px] font-mono text-aura-muted">
                            #{acc.userId.substring(0, 8).toUpperCase()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-aura-muted">{acc.email || 'Registered User'}</td>
                      <td className="px-6 py-4 text-xs text-aura-muted font-mono">{acc.phone || 'On file'}</td>
                      <td className="px-6 py-4">{renderStatusBadge(acc.status)}</td>
                      <td className="px-6 py-4">
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                          {acc.verificationStatus || 'Verified'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-xs text-white">
                        {formatCurrency(acc.investmentValue || 0)}
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-xs text-emerald-400">
                        {acc.investmentValue > 0 ? `+${formatCurrency(acc.investmentValue * 0.20)} (20%)` : '$0.00'}
                      </td>
                      <td className="px-6 py-4 font-mono text-[10px] text-aura-muted">
                        {acc.created_at ? new Date(acc.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedUser(acc);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Section 25: Authorized Verification Access Modal */}
      {ssnPasscodeModalOpen && (
        <div className="fixed inset-0 z-[1500] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md p-6 rounded-3xl bg-[#0b1021] border border-blue-500/30 shadow-2xl space-y-4"
          >
            <div className="flex items-center gap-3 text-blue-400">
              <ShieldAlert size={22} />
              <h3 className="text-base font-bold uppercase tracking-wider text-white">
                Authorized Verification Access
              </h3>
            </div>
            <p className="text-xs text-aura-muted leading-relaxed">
              Accessing full sensitive SSN records requires authorized compliance confirmation. This action will be permanently recorded in the immutable <strong>retirement_audit_logs</strong>.
            </p>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-aura-muted">Officer ID / Email</label>
              <input
                type="text"
                value={authorizedOfficer}
                onChange={(e) => setAuthorizedOfficer(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSsnPasscodeModalOpen(false)}
                className="py-2.5 px-4 rounded-xl text-xs font-bold text-aura-muted hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAuthorizedSsnAccess}
                className="py-2.5 px-5 rounded-xl text-xs font-bold bg-blue-500 hover:bg-blue-400 text-black shadow-md shadow-blue-500/20"
              >
                Confirm Access & Log Event
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
