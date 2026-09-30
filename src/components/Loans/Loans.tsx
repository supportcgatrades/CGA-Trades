import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Landmark, 
  Search, 
  Filter, 
  CreditCard, 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Calculator, 
  ChevronRight, 
  ShieldCheck, 
  DollarSign, 
  ArrowRight,
  TrendingUp,
  Sparkles,
  Inbox
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useMode } from '../../contexts/ModeContext';
import { 
  LOAN_PRODUCTS, 
  LoanProductDefinition, 
  Loan, 
  LoanApplication, 
  subscribeUserLoans, 
  subscribeUserApplications,
  acceptLoanOffer
} from '../../services/loanService';
import LoanCard from './LoanCard';
import LoanDetailModal from './LoanDetailModal';
import LoanApplicationModal from './LoanApplicationModal';
import ActiveLoanDetailModal from './ActiveLoanDetailModal';
import MakePaymentModal from './MakePaymentModal';
import LoanCalculatorView from './LoanCalculatorView';
import { toast } from 'sonner';

type LoansTab = 'marketplace' | 'my-loans' | 'applications' | 'calculator';
type CategoryFilter = 'all' | 'personal' | 'business' | 'property' | 'specialized';

export default function Loans() {
  const { user, profile } = useAuth();
  const { isLite } = useMode();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Strict CGA Lite Isolation: Loans MUST NOT exist in CGA Lite
  useEffect(() => {
    if (isLite) {
      navigate('/home', { replace: true });
    }
  }, [isLite, navigate]);

  const activeTab = (searchParams.get('tab') as LoansTab) || 'marketplace';
  const categoryParam = (searchParams.get('category') as CategoryFilter) || 'all';

  const [activeCategory, setActiveCategory] = useState<CategoryFilter>(categoryParam);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Real-time data from Firestore
  const [userLoans, setUserLoans] = useState<Loan[]>([]);
  const [userApplications, setUserApplications] = useState<LoanApplication[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal states
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<LoanProductDefinition | null>(null);
  const [selectedProductForApply, setSelectedProductForApply] = useState<LoanProductDefinition | null>(null);
  const [applyInitialAmount, setApplyInitialAmount] = useState<number | undefined>(undefined);
  const [applyInitialTerm, setApplyInitialTerm] = useState<number | undefined>(undefined);

  const [selectedActiveLoan, setSelectedActiveLoan] = useState<Loan | null>(null);
  const [loanForPayment, setLoanForPayment] = useState<Loan | null>(null);

  // Subscriptions
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubLoans = subscribeUserLoans(
      user.uid,
      (loans) => {
        setUserLoans(loans);
        setLoading(false);
      },
      () => setLoading(false)
    );

    const unsubApps = subscribeUserApplications(
      user.uid,
      (apps) => setUserApplications(apps),
      () => setLoading(false)
    );

    return () => {
      unsubLoans();
      unsubApps();
    };
  }, [user]);

  // Tab change handler
  const handleTabChange = (tab: LoansTab) => {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set('tab', tab);
      return p;
    });
  };

  // Category filter handler
  const handleCategoryChange = (cat: CategoryFilter) => {
    setActiveCategory(cat);
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set('category', cat);
      return p;
    });
  };

  // Filter products by category and search query
  const filteredProducts = LOAN_PRODUCTS.filter((p) => {
    const matchesCat = activeCategory === 'all' || p.category === activeCategory;
    const matchesQuery = !searchQuery.trim() || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.shortDescription.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  const activeLoansCount = userLoans.filter(l => l.status === 'Active').length;
  const pendingAppsCount = userApplications.filter(a => a.status === 'Submitted' || a.status === 'Under Review' || a.status === 'Offer Available').length;

  if (isLite) {
    return null;
  }

  return (
    <div className="min-h-screen text-white pb-24 pt-4 sm:pt-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Simple & Premium Page Header (Section 3 Specification) */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-6 text-left">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold tracking-widest uppercase">
                CGA Beta Lending
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Loans
            </h1>
            <p className="text-sm text-white/60 mt-1">
              Choose a loan that fits your needs.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-3">
            {activeLoansCount > 0 && (
              <div 
                onClick={() => handleTabChange('my-loans')}
                className="px-4 py-2.5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-emerald-500/30 transition-all cursor-pointer text-left"
              >
                <span className="text-[10px] uppercase font-bold text-white/40 block">Active Loans</span>
                <span className="text-sm font-mono font-bold text-emerald-400">
                  {activeLoansCount} Active
                </span>
              </div>
            )}

            {pendingAppsCount > 0 && (
              <div 
                onClick={() => handleTabChange('applications')}
                className="px-4 py-2.5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-amber-500/30 transition-all cursor-pointer text-left"
              >
                <span className="text-[10px] uppercase font-bold text-white/40 block">Pending Applications</span>
                <span className="text-sm font-mono font-bold text-amber-400">
                  {pendingAppsCount} Reviewing
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            <button
              onClick={() => handleTabChange('marketplace')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'marketplace'
                  ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                  : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              Available Loans ({LOAN_PRODUCTS.length})
            </button>

            <button
              onClick={() => handleTabChange('my-loans')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer relative ${
                activeTab === 'my-loans'
                  ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                  : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span>My Loans</span>
              {activeLoansCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 bg-black/20 text-white rounded-full text-[10px] font-mono">
                  {activeLoansCount}
                </span>
              )}
            </button>

            <button
              onClick={() => handleTabChange('applications')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer relative ${
                activeTab === 'applications'
                  ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                  : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span>Applications</span>
              {pendingAppsCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 bg-amber-500 text-black rounded-full text-[10px] font-mono font-bold">
                  {pendingAppsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => handleTabChange('calculator')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'calculator'
                  ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                  : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              Loan Calculator
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* TAB 1: AVAILABLE LOANS MARKETPLACE */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'marketplace' && (
          <div className="space-y-6">
            {/* Search & Category Filter Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                {(['all', 'personal', 'business', 'property', 'specialized'] as CategoryFilter[]).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => handleCategoryChange(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                      activeCategory === cat
                        ? 'bg-white/15 text-white font-bold'
                        : 'text-white/50 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Search Input */}
              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search 20 loan products..."
                  className="w-full pl-9 pr-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-white/40 focus:outline-none focus:border-emerald-500/50"
                />
              </div>
            </div>

            {/* 20 Loan Category Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map((product) => (
                <LoanCard
                  key={product.id}
                  product={product}
                  onViewLoan={(p) => setSelectedProductForDetail(p)}
                />
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-16 bg-white/[0.01] border border-white/5 rounded-3xl">
                <Search size={32} className="text-white/20 mx-auto mb-3" />
                <h3 className="text-base font-bold text-white">No loan products found</h3>
                <p className="text-xs text-white/50 mt-1">Try adjusting your category filter or search query.</p>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 2: MY LOANS (Active & Disbursed Loans) */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'my-loans' && (
          <div className="space-y-6 text-left">
            {userLoans.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {userLoans.map((loan) => {
                  const progressPct = Math.min(
                    100,
                    Math.round(((loan.original_amount - loan.outstanding_balance) / loan.original_amount) * 100)
                  );

                  return (
                    <motion.div
                      key={loan.id}
                      whileHover={{ y: -2 }}
                      className="p-6 bg-[#0b0e14]/90 border border-white/5 hover:border-emerald-500/30 rounded-3xl shadow-xl space-y-5 transition-all"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${
                              loan.status === 'Active'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-white/10 text-white/60 border-white/10'
                            }`}>
                              {loan.status}
                            </span>
                            <span className="text-xs font-mono text-white/40">
                              {loan.id}
                            </span>
                          </div>
                          <h3 className="text-lg font-black text-white tracking-tight">
                            {loan.loan_name}
                          </h3>
                        </div>

                        <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl">
                          {loan.interest_rate}% APR
                        </span>
                      </div>

                      {/* Payoff Progress */}
                      <div>
                        <div className="flex justify-between text-xs mb-1.5 font-medium">
                          <span className="text-white/60">Payoff Progress</span>
                          <span className="text-emerald-400 font-mono font-bold">{progressPct}%</span>
                        </div>
                        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>

                      {/* Financial Key Numbers */}
                      <div className="grid grid-cols-3 gap-2.5 p-3.5 bg-white/[0.02] border border-white/5 rounded-2xl text-xs">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-white/40 block">Outstanding</span>
                          <span className="font-mono font-bold text-amber-400 text-sm">
                            ${loan.outstanding_balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-white/40 block">Monthly Due</span>
                          <span className="font-mono font-bold text-white text-sm">
                            ${loan.monthly_payment.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-white/40 block">Next Due Date</span>
                          <span className="text-xs font-medium text-emerald-400 block truncate">
                            {loan.next_payment_date || 'N/A'}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-3 pt-2">
                        <button
                          onClick={() => setSelectedActiveLoan(loan)}
                          className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-all cursor-pointer text-center"
                        >
                          View Details & Schedule
                        </button>

                        {loan.status === 'Active' && loan.outstanding_balance > 0 && (
                          <button
                            onClick={() => setLoanForPayment(loan)}
                            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer"
                          >
                            <DollarSign size={14} />
                            <span>Make Payment</span>
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-20 bg-white/[0.01] border border-white/5 rounded-3xl space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 mx-auto">
                  <CreditCard size={28} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">No active loans</h3>
                  <p className="text-xs text-white/50 max-w-sm mx-auto mt-1">
                    You do not currently have any active or disbursed loans with CGA.
                  </p>
                </div>
                <button
                  onClick={() => handleTabChange('marketplace')}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  Browse Available Loans
                </button>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 3: APPLICATIONS (Status Tracking & Offer Acceptance) */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'applications' && (
          <div className="space-y-4 text-left">
            {userApplications.length > 0 ? (
              <div className="space-y-3">
                {userApplications.map((app) => {
                  const prod = LOAN_PRODUCTS.find(p => p.id === app.loan_type);
                  const isOfferReady = app.status === 'Offer Available' || app.status === 'Approved';

                  return (
                    <div
                      key={app.id}
                      className="p-5 bg-[#0b0e14]/90 border border-white/5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                            app.status === 'Submitted' || app.status === 'Under Review'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : isOfferReady
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 animate-pulse'
                              : app.status === 'Disbursed' || app.status === 'Accepted'
                              ? 'bg-teal-500/10 text-teal-400 border-teal-500/20'
                              : app.status === 'Declined'
                              ? 'bg-red-500/10 text-red-400 border-red-500/20'
                              : 'bg-white/10 text-white/60 border-white/10'
                          }`}>
                            {app.status}
                          </span>
                          <span className="text-xs font-mono text-white/40">
                            {app.id}
                          </span>
                          <span className="text-xs text-white/30">•</span>
                          <span className="text-xs text-white/50">
                            {new Date(app.created_at).toLocaleDateString()}
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-white tracking-tight">
                          {prod ? prod.name : app.loan_type} • ${app.requested_amount.toLocaleString()}
                        </h3>

                        <p className="text-xs text-white/60">
                          Term: {app.requested_term_months} Months • Purpose: {app.purpose}
                        </p>

                        {app.review_notes && (
                          <div className="text-xs p-2.5 bg-white/[0.02] border border-white/5 rounded-xl text-white/70 max-w-xl">
                            <span className="font-semibold text-emerald-400">Review Note:</span> {app.review_notes}
                          </div>
                        )}
                      </div>

                      {/* Status CTA or Acceptance */}
                      <div className="flex items-center gap-3">
                        {isOfferReady ? (
                          <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl flex items-center gap-4">
                            <div className="text-right">
                              <span className="text-[10px] uppercase font-bold text-emerald-400 block">Offer Ready</span>
                              <span className="text-xs font-mono font-bold text-white">
                                ${app.approved_amount?.toLocaleString()} at {app.approved_interest_rate}% APR
                              </span>
                            </div>
                            <button
                              onClick={async () => {
                                try {
                                  await acceptLoanOffer(app.id, user);
                                  toast.success("Offer accepted! Underwriters will finalize disbursement.");
                                } catch (err: any) {
                                  toast.error(err.message || "Failed to accept offer.");
                                }
                              }}
                              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black uppercase rounded-xl transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
                            >
                              Accept Offer
                            </button>
                          </div>
                        ) : (
                          <div className="text-right">
                            <span className="text-[11px] text-white/40 block">Review Progress</span>
                            <span className="text-xs font-medium text-white/70">
                              {app.status === 'Submitted' ? 'Underwriting Queued' : app.status}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-20 bg-white/[0.01] border border-white/5 rounded-3xl space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 mx-auto">
                  <Inbox size={28} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">No loan applications yet</h3>
                  <p className="text-xs text-white/50 max-w-sm mx-auto mt-1">
                    Apply for any of our 20 loan products to track underwriting status here.
                  </p>
                </div>
                <button
                  onClick={() => handleTabChange('marketplace')}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  Explore Loans
                </button>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 4: LOAN CALCULATOR VIEW */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'calculator' && (
          <LoanCalculatorView
            onSelectProductToApply={(product, amount, term) => {
              setSelectedProductForApply(product);
              setApplyInitialAmount(amount);
              setApplyInitialTerm(term);
            }}
          />
        )}

        {/* ------------------------------------------------------------- */}
        {/* MODALS */}
        {/* ------------------------------------------------------------- */}
        {/* 1. Loan Detail Modal */}
        <LoanDetailModal
          product={selectedProductForDetail}
          isOpen={!!selectedProductForDetail}
          onClose={() => setSelectedProductForDetail(null)}
          onApply={(prod, amt, trm) => {
            setSelectedProductForApply(prod);
            setApplyInitialAmount(amt);
            setApplyInitialTerm(trm);
          }}
        />

        {/* 2. Loan Application Modal (5-Step) */}
        <LoanApplicationModal
          product={selectedProductForApply}
          initialAmount={applyInitialAmount}
          initialTerm={applyInitialTerm}
          isOpen={!!selectedProductForApply}
          onClose={() => setSelectedProductForApply(null)}
          onSuccess={() => {
            setSelectedProductForApply(null);
            handleTabChange('applications');
          }}
        />

        {/* 3. Active Loan Detail Modal */}
        <ActiveLoanDetailModal
          loan={selectedActiveLoan}
          isOpen={!!selectedActiveLoan}
          onClose={() => setSelectedActiveLoan(null)}
        />

        {/* 4. Make Payment Modal */}
        <MakePaymentModal
          loan={loanForPayment}
          isOpen={!!loanForPayment}
          onClose={() => setLoanForPayment(null)}
          onPaymentSuccess={() => {
            setLoanForPayment(null);
          }}
        />

      </div>
    </div>
  );
}
