import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  AlertCircle, 
  DollarSign, 
  Calendar, 
  User, 
  Briefcase, 
  Building2, 
  Landmark, 
  FileCheck2,
  Lock,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  LoanProductDefinition, 
  submitLoanApplication, 
  calculateLoanEstimates 
} from '../../services/loanService';
import { useAuth } from '../../contexts/AuthContext';
import LoanIcon from './LoanIcon';

interface LoanApplicationModalProps {
  product: LoanProductDefinition | null;
  initialAmount?: number;
  initialTerm?: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (appId: string) => void;
}

type StepIndex = 1 | 2 | 3 | 4 | 5;

export default function LoanApplicationModal({
  product,
  initialAmount,
  initialTerm,
  isOpen,
  onClose,
  onSuccess
}: LoanApplicationModalProps) {
  const { user, profile } = useAuth();

  const [step, setStep] = useState<StepIndex>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedAppId, setSubmittedAppId] = useState<string | null>(null);

  // Step 1: Loan Details
  const [amount, setAmount] = useState<number>(initialAmount || (product?.minAmount || 5000));
  const [term, setTerm] = useState<number>(initialTerm || (product?.termOptions[0] || 12));
  const [purpose, setPurpose] = useState<string>('');

  // Step 2: Personal Information (prefilled from profile/auth)
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [employmentStatus, setEmploymentStatus] = useState<string>('Employed');
  const [employer, setEmployer] = useState<string>('');
  const [monthlyIncome, setMonthlyIncome] = useState<string>('6500');
  const [monthlyExpenses, setMonthlyExpenses] = useState<string>('2400');
  const [residentialStatus, setResidentialStatus] = useState<string>('Homeowner');
  const [address, setAddress] = useState<string>('');

  // Step 3: Financial Details
  const [bankName, setBankName] = useState<string>('');
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [routingNumber, setRoutingNumber] = useState<string>('');
  const [collateralDescription, setCollateralDescription] = useState<string>('');
  const [collateralEstimatedValue, setCollateralEstimatedValue] = useState<string>('');

  // Step 4: Terms Agreement
  const [termsAgreed, setTermsAgreed] = useState<boolean>(false);

  // Sync initial values when product changes
  useEffect(() => {
    if (product) {
      setAmount(initialAmount || Math.round((product.minAmount + product.maxAmount) / 4));
      setTerm(initialTerm || product.termOptions[0] || 12);
      setPurpose(product.eligiblePurposes[0] || 'General financing');
    }
  }, [product, initialAmount, initialTerm]);

  // Sync profile details
  useEffect(() => {
    if (profile || user) {
      setFullName(profile?.name || user?.displayName || '');
      setEmail(profile?.email || user?.email || '');
      setPhone(profile?.phone || '');
      setAddress(profile?.address || '');
    }
  }, [profile, user]);

  if (!product || !isOpen) return null;

  const { monthlyPayment, totalPayment, totalInterest } = calculateLoanEstimates(
    amount,
    product.baseInterestRate,
    term
  );

  const handleNext = () => {
    if (step === 1) {
      if (amount < product.minAmount || amount > product.maxAmount) {
        toast.error(`Loan amount must be between $${product.minAmount.toLocaleString()} and $${product.maxAmount.toLocaleString()}`);
        return;
      }
      if (!purpose) {
        toast.error("Please select a purpose for your loan.");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!fullName.trim()) {
        toast.error("Please enter your full legal name.");
        return;
      }
      if (!email.trim()) {
        toast.error("Please enter your email address.");
        return;
      }
      if (!monthlyIncome || Number(monthlyIncome) <= 0) {
        toast.error("Please enter your monthly income.");
        return;
      }
      if (!address.trim()) {
        toast.error("Please provide your residential address.");
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (product.requiresCollateral && !collateralDescription.trim()) {
        toast.error("This loan requires collateral. Please describe your collateral asset.");
        return;
      }
      setStep(4);
    } else if (step === 4) {
      if (!termsAgreed) {
        toast.error("Please acknowledge the application terms and truth in lending disclosures.");
        return;
      }
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Please sign in to submit a loan application.");
      return;
    }

    setIsSubmitting(true);
    try {
      const appId = await submitLoanApplication({
        user_id: user.uid,
        user_name: fullName.trim() || user.displayName || 'Applicant',
        user_email: email.trim() || user.email || '',
        user_phone: phone.trim(),
        loan_type: product.id,
        requested_amount: amount,
        requested_term_months: term,
        purpose,
        employment_status: employmentStatus,
        employer: employer.trim(),
        monthly_income: Number(monthlyIncome) || 0,
        monthly_expenses: Number(monthlyExpenses) || 0,
        residential_status: residentialStatus,
        address: address.trim(),
        financial_details: {
          bank_name: bankName.trim(),
          account_number: accountNumber.trim() ? `****${accountNumber.slice(-4)}` : '',
          routing_number: routingNumber.trim(),
          collateral_description: collateralDescription.trim(),
          collateral_estimated_value: Number(collateralEstimatedValue) || 0
        }
      }, user);

      setSubmittedAppId(appId);
      setStep(5);
      toast.success("Loan application submitted successfully!");
      onSuccess(appId);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to submit loan application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setStep(1);
    setSubmittedAppId(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={resetAndClose}
        className="fixed inset-0 bg-black/85 backdrop-blur-md"
      />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        transition={{ type: "spring", damping: 25, stiffness: 350 }}
        className="relative w-full max-w-2xl bg-[#0a0d13] border border-white/10 rounded-3xl shadow-2xl p-6 sm:p-8 z-10 overflow-hidden text-left"
      >
        {/* Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />

        {/* Modal Top Nav & Stepper */}
        {step < 5 && (
          <div className="mb-6 relative z-10">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <LoanIcon iconName={product.iconName} size={20} className="text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    Apply for {product.name}
                  </h2>
                  <p className="text-xs text-white/50">
                    Step {step} of 4: {
                      step === 1 ? 'Loan Details' :
                      step === 2 ? 'Personal Information' :
                      step === 3 ? 'Financial Information' : 'Review & Submit'
                    }
                  </p>
                </div>
              </div>

              <button
                onClick={resetAndClose}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Stepper Progress Bar */}
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    s <= step ? 'bg-emerald-500' : 'bg-white/10'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* --------------------------------------------------------- */}
        {/* STEP 1: LOAN DETAILS */}
        {/* --------------------------------------------------------- */}
        {step === 1 && (
          <div className="space-y-5 relative z-10">
            {/* Amount Input & Slider */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-white/70">
                  Requested Loan Amount
                </label>
                <div className="flex items-center bg-white/5 border border-white/10 rounded-xl px-3 py-1">
                  <span className="text-emerald-400 text-sm font-bold mr-1">$</span>
                  <input
                    type="number"
                    min={product.minAmount}
                    max={product.maxAmount}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-28 bg-transparent text-sm font-mono font-bold text-white focus:outline-none"
                  />
                </div>
              </div>

              <input
                type="range"
                min={product.minAmount}
                max={product.maxAmount}
                step={product.maxAmount > 100000 ? 5000 : 500}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500 mt-2"
              />
              <div className="flex justify-between text-[10px] text-white/40 mt-1">
                <span>Min: ${product.minAmount.toLocaleString()}</span>
                <span>Max: ${product.maxAmount.toLocaleString()}</span>
              </div>
            </div>

            {/* Term Selector */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-white/70 block mb-2">
                Desired Term
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {product.termOptions.map((termOption) => (
                  <button
                    key={termOption}
                    type="button"
                    onClick={() => setTerm(termOption)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      term === termOption
                        ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                        : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/5'
                    }`}
                  >
                    {termOption} Months
                  </button>
                ))}
              </div>
            </div>

            {/* Purpose */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-white/70 block mb-2">
                Purpose of Loan
              </label>
              <select
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500/50 cursor-pointer"
              >
                {product.eligiblePurposes.map((p) => (
                  <option key={p} value={p} className="bg-[#0b0e14] text-white">
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {/* Estimate Summary Box */}
            <div className="p-4 bg-emerald-500/5 border border-emerald-500/15 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-white/40 block">
                  Est. Monthly Payment
                </span>
                <span className="text-xl font-black text-emerald-400">
                  ${monthlyPayment.toFixed(2)}
                  <span className="text-xs text-white/40 font-normal"> / mo</span>
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-medium text-white/40 block">Estimated APR</span>
                <span className="text-xs font-mono font-bold text-white">
                  {product.baseInterestRate}% (fixed)
                </span>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={resetAndClose}
                className="w-1/3 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                <span>Continue to Personal Info</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* --------------------------------------------------------- */}
        {/* STEP 2: PERSONAL INFORMATION */}
        {/* --------------------------------------------------------- */}
        {step === 2 && (
          <div className="space-y-4 relative z-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-white/70 block mb-1">
                  Full Legal Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-white/70 block mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-white/70 block mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-white/70 block mb-1">
                  Employment Status
                </label>
                <select
                  value={employmentStatus}
                  onChange={(e) => setEmploymentStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500/50 cursor-pointer"
                >
                  <option value="Employed" className="bg-[#0b0e14]">Employed (Full-time)</option>
                  <option value="Self-Employed" className="bg-[#0b0e14]">Self-Employed</option>
                  <option value="Business Owner" className="bg-[#0b0e14]">Business Owner</option>
                  <option value="Retired" className="bg-[#0b0e14]">Retired</option>
                  <option value="Other" className="bg-[#0b0e14]">Other</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-white/70 block mb-1">
                  Employer / Business Name
                </label>
                <input
                  type="text"
                  value={employer}
                  onChange={(e) => setEmployer(e.target.value)}
                  placeholder="Acme Corporation"
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-white/70 block mb-1">
                  Residential Status
                </label>
                <select
                  value={residentialStatus}
                  onChange={(e) => setResidentialStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500/50 cursor-pointer"
                >
                  <option value="Homeowner" className="bg-[#0b0e14]">Own Home (Mortgage or Free)</option>
                  <option value="Renting" className="bg-[#0b0e14]">Renting</option>
                  <option value="Other" className="bg-[#0b0e14]">Other</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-white/70 block mb-1">
                  Monthly Gross Income ($)
                </label>
                <input
                  type="number"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(e.target.value)}
                  placeholder="6500"
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-white/70 block mb-1">
                  Estimated Monthly Expenses ($)
                </label>
                <input
                  type="number"
                  value={monthlyExpenses}
                  onChange={(e) => setMonthlyExpenses(e.target.value)}
                  placeholder="2400"
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500/50"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-white/70 block mb-1">
                Residential Street Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Financial Way, Suite 400, City, State, ZIP"
                className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                <span>Continue to Financial Info</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* --------------------------------------------------------- */}
        {/* STEP 3: FINANCIAL INFORMATION */}
        {/* --------------------------------------------------------- */}
        {step === 3 && (
          <div className="space-y-4 relative z-10">
            <p className="text-xs text-white/60 leading-relaxed">
              Provide preferred disbursement settlement details. Funds can also be settled directly into your CGA Available Balance upon disbursement.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-white/70 block mb-1">
                  Settlement Bank Name (Optional)
                </label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="JPMorgan Chase / Bank of America"
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-white/70 block mb-1">
                  Routing / Wire Number
                </label>
                <input
                  type="text"
                  value={routingNumber}
                  onChange={(e) => setRoutingNumber(e.target.value)}
                  placeholder="021000021"
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] font-semibold text-white/70 block mb-1">
                  Account Number
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Account Number (or leave blank for CGA balance settlement)"
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500/50"
                />
              </div>
            </div>

            {/* Collateral Fields (if loan is secured or property based) */}
            {product.requiresCollateral && (
              <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                  <ShieldCheck size={16} />
                  <span>Collateral Declaration Required</span>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-white/70 block mb-1">
                    Collateral Asset Description
                  </label>
                  <input
                    type="text"
                    value={collateralDescription}
                    onChange={(e) => setCollateralDescription(e.target.value)}
                    placeholder="e.g. 2023 Tesla Model Y / Residential Title Deed / Commercial Equipment"
                    className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-white/70 block mb-1">
                    Estimated Collateral Valuation ($)
                  </label>
                  <input
                    type="number"
                    value={collateralEstimatedValue}
                    onChange={(e) => setCollateralEstimatedValue(e.target.value)}
                    placeholder="55000"
                    className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-1/3 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                <span>Review Application</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* --------------------------------------------------------- */}
        {/* STEP 4: REVIEW & SUBMIT */}
        {/* --------------------------------------------------------- */}
        {step === 4 && (
          <div className="space-y-4 relative z-10">
            <div className="p-4 bg-white/[0.02] border border-white/10 rounded-2xl space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 border-b border-white/5 pb-2">
                Application Summary
              </h3>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-white/40 block">Loan Product</span>
                  <span className="font-semibold text-white">{product.name}</span>
                </div>
                <div>
                  <span className="text-white/40 block">Requested Amount</span>
                  <span className="font-bold text-white font-mono">${amount.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-white/40 block">Term Length</span>
                  <span className="font-semibold text-white">{term} Months</span>
                </div>
                <div>
                  <span className="text-white/40 block">Est. Monthly Payment</span>
                  <span className="font-bold text-emerald-400 font-mono">${monthlyPayment.toFixed(2)} / mo</span>
                </div>
                <div>
                  <span className="text-white/40 block">Purpose</span>
                  <span className="font-semibold text-white truncate block">{purpose}</span>
                </div>
                <div>
                  <span className="text-white/40 block">Applicant</span>
                  <span className="font-semibold text-white truncate block">{fullName}</span>
                </div>
                <div>
                  <span className="text-white/40 block">Monthly Income</span>
                  <span className="font-mono text-white">${Number(monthlyIncome).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-white/40 block">Application Fee</span>
                  <span className="text-white font-medium">$0.00</span>
                </div>
              </div>
            </div>

            {/* Terms checkbox */}
            <div className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl flex items-start gap-3">
              <input
                id="terms"
                type="checkbox"
                checked={termsAgreed}
                onChange={(e) => setTermsAgreed(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-white/20 bg-white/5 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
              />
              <label htmlFor="terms" className="text-[11px] text-white/70 leading-relaxed cursor-pointer select-none">
                I certify that all information submitted is true and accurate. I authorize CGA Lending and Cipher Compliance to verify credit and financial details in accordance with lending policies.
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(3)}
                disabled={isSubmitting}
                className="w-1/3 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 disabled:opacity-50"
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || !termsAgreed}
                className="flex-1 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 disabled:opacity-40 text-black text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Submitting Application...</span>
                ) : (
                  <>
                    <FileCheck2 size={15} />
                    <span>Submit Application</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* --------------------------------------------------------- */}
        {/* STEP 5: SUBMITTED CONFIRMATION (Section 7 Specification) */}
        {/* --------------------------------------------------------- */}
        {step === 5 && (
          <div className="text-center py-6 space-y-4 relative z-10">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
              <CheckCircle2 size={36} className="animate-pulse" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-emerald-400">
                Application Received
              </span>
              <h2 className="text-2xl font-black text-white tracking-tight">
                Pending Review
              </h2>
            </div>

            <p className="text-xs text-white/70 max-w-md mx-auto leading-relaxed">
              Your loan application has been submitted and is being reviewed by the credit underwriting team.
            </p>

            <div className="p-3 bg-white/[0.03] border border-white/5 rounded-2xl max-w-sm mx-auto text-xs space-y-1">
              <div className="flex justify-between text-white/50">
                <span>Application Reference:</span>
                <span className="font-mono text-white font-bold">{submittedAppId}</span>
              </div>
              <div className="flex justify-between text-white/50">
                <span>Loan Type:</span>
                <span className="text-white font-semibold">{product.name}</span>
              </div>
              <div className="flex justify-between text-white/50">
                <span>Amount:</span>
                <span className="text-emerald-400 font-mono font-bold">${amount.toLocaleString()}</span>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="button"
                onClick={resetAndClose}
                className="w-full sm:w-auto px-8 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                Go to My Loans
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
