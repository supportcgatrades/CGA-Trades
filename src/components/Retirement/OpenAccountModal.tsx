import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ShieldCheck, 
  User, 
  Lock, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Calendar,
  Building2,
  Phone,
  Mail,
  MapPin,
  IdCard,
  Target
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { createRetirementAccount, RetirementAccount, maskSsn } from '../../services/retirementService';
import { toast } from 'sonner';

interface OpenAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccountCreated: (account: RetirementAccount) => void;
}

export default function OpenAccountModal({ isOpen, onClose, onAccountCreated }: OpenAccountModalProps) {
  const { user, profile } = useAuth();
  const { isDark } = useTheme();

  // Multi-step: 1: Personal Details -> 2: Verification -> 3: Account Setup -> 4: Review -> 5: Complete
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    fullName: profile?.name || user?.displayName || '',
    dob: '1988-06-12',
    email: user?.email || profile?.email || '',
    phone: profile?.phone || '',
    country: profile?.country || 'United States',
    address: '450 Lexington Avenue, Suite 2200',
    employmentStatus: 'Employed Full-Time',
    employer: 'Enterprise Technology Group',
    rawSsn: '',
    targetAge: 65,
    targetBalance: 500000,
    acceptedTerms: true
  });

  const [ssnInput, setSsnInput] = useState('');
  const [isSsnFocused, setIsSsnFocused] = useState(false);

  if (!isOpen) return null;

  const handleSsnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawDigits = e.target.value.replace(/\D/g, '').slice(0, 9);
    setFormData(prev => ({ ...prev, rawSsn: rawDigits }));
    // format as standard XXX-XX-XXXX
    let formatted = rawDigits;
    if (rawDigits.length > 5) {
      formatted = `${rawDigits.slice(0, 3)}-${rawDigits.slice(3, 5)}-${rawDigits.slice(5)}`;
    } else if (rawDigits.length > 3) {
      formatted = `${rawDigits.slice(0, 3)}-${rawDigits.slice(3)}`;
    }
    setSsnInput(formatted);
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.fullName.trim()) {
        toast.error('Please enter your full legal name.');
        return;
      }
      if (!formData.email.trim()) {
        toast.error('Please enter your email.');
        return;
      }
      if (!formData.phone.trim()) {
        toast.error('Please enter your phone number.');
        return;
      }
      if (!formData.address.trim()) {
        toast.error('Please enter your residential address.');
        return;
      }
    } else if (step === 2) {
      const cleanSsn = formData.rawSsn.replace(/\D/g, '');
      if (cleanSsn.length < 4) {
        toast.error('Please enter a valid Social Security Number (SSN).');
        return;
      }
    }
    setStep((prev) => (prev + 1) as any);
  };

  const handleBack = () => {
    setStep((prev) => (prev - 1) as any);
  };

  const handleSubmitApplication = async () => {
    if (!user) {
      toast.error('Please sign in to proceed.');
      return;
    }

    try {
      setSubmitting(true);
      const newAcc = await createRetirementAccount(user.uid, {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        dob: formData.dob,
        country: formData.country,
        address: formData.address,
        employmentStatus: formData.employmentStatus,
        employer: formData.employer,
        ssn: formData.rawSsn,
        targetAge: formData.targetAge,
        targetBalance: formData.targetBalance
      });
      // Clear sensitive ssn string from local component memory immediately
      setFormData(prev => ({ ...prev, rawSsn: '' }));
      setSsnInput('');
      toast.success('401(k) Account successfully created!');
      setStep(5);
      onAccountCreated(newAcc);
    } catch (err: any) {
      console.error('Retirement onboarding error:', err);
      toast.error(err.message || 'Unable to open 401(k) account right now.');
    } finally {
      setSubmitting(false);
    }
  };

  const maskedPreview = maskSsn(formData.rawSsn);

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className={`relative w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden my-auto transition-colors ${
          isDark 
            ? 'bg-[#0b1021] border-white/10 text-white' 
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${
          isDark ? 'border-white/5 bg-white/[0.02]' : 'border-slate-100 bg-slate-50/50'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">401(k) Account</h2>
              <p className="text-[11px] text-muted-foreground">Account Opening Flow</p>
            </div>
          </div>
          {step !== 5 && (
            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg transition-colors ${
                isDark ? 'hover:bg-white/10 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'
              }`}
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Small Progress Indicator */}
        {step < 5 && (
          <div className="px-6 pt-4">
            <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground mb-2">
              <span className="uppercase tracking-wider">Step {step} of 4</span>
              <span>
                {step === 1 && 'Personal Details'}
                {step === 2 && 'Verification'}
                {step === 3 && 'Account Setup'}
                {step === 4 && 'Review Your Information'}
              </span>
            </div>
            <div className={`h-1.5 w-full rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-slate-100'}`}>
              <motion.div
                className="h-full bg-emerald-500 rounded-full"
                initial={false}
                animate={{ width: `${(step / 4) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}

        <div className="p-6">
          <AnimatePresence mode="wait">
            {/* STEP 1: PERSONAL DETAILS */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4"
              >
                <div>
                  <h3 className="text-lg font-bold">Personal Details</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Enter your personal information to establish your 401(k) account.
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">Legal Full Name</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                        placeholder="Johnathan Doe"
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                          isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1">Email Address</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="john@example.com"
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                          isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1">Phone Number</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="+1 (555) 019-2834"
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                          isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1">Date of Birth</label>
                      <input
                        type="date"
                        value={formData.dob}
                        onChange={(e) => setFormData(prev => ({ ...prev, dob: e.target.value }))}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                          isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1">Country</label>
                      <input
                        type="text"
                        value={formData.country}
                        onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                        placeholder="United States"
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                          isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">Residential Address</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="Street address, City, State, ZIP"
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                        isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1">Employment Status</label>
                      <select
                        value={formData.employmentStatus}
                        onChange={(e) => setFormData(prev => ({ ...prev, employmentStatus: e.target.value }))}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                          isDark ? 'bg-[#0f1422] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      >
                        <option value="Employed Full-Time">Employed Full-Time</option>
                        <option value="Self-Employed">Self-Employed</option>
                        <option value="Contractor / Consultant">Contractor / Consultant</option>
                        <option value="Retired">Retired</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1">Employer / Company</label>
                      <input
                        type="text"
                        value={formData.employer}
                        onChange={(e) => setFormData(prev => ({ ...prev, employer: e.target.value }))}
                        placeholder="Company name"
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                          isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    type="button"
                    onClick={handleNext}
                    className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-emerald-500 hover:bg-emerald-400 text-black shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Continue</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: VERIFICATION (SSN) */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-5"
              >
                <div>
                  <h3 className="text-lg font-bold">Identity Verification</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Federal and institutional compliance requires verification of your identity.
                  </p>
                </div>

                <div className={`p-4 rounded-2xl border ${
                  isDark ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-emerald-50/60 border-emerald-200'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
                      <Lock size={16} />
                    </div>
                    <div className="text-xs space-y-1">
                      <p className="font-semibold text-foreground">Encrypted & Masked Security</p>
                      <p className="text-muted-foreground leading-relaxed">
                        Your Social Security Number is encrypted in transit and at rest. Full SSNs are never exposed on client storage or standard logs.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-muted-foreground">
                    Social Security Number (SSN)
                  </label>
                  <div className="relative">
                    <input
                      type={isSsnFocused ? "text" : "password"}
                      value={ssnInput}
                      onChange={handleSsnChange}
                      onFocus={() => setIsSsnFocused(true)}
                      onBlur={() => setIsSsnFocused(false)}
                      placeholder="XXX-XX-XXXX"
                      maxLength={11}
                      autoComplete="off"
                      className={`w-full px-3.5 py-3 rounded-xl border text-sm font-mono tracking-widest focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                        isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>
                  {formData.rawSsn.length >= 4 && (
                    <p className="text-xs font-mono text-emerald-400">
                      Masked preview: {maskedPreview}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleBack}
                    className={`py-3 px-5 rounded-xl font-semibold text-xs border transition-colors ${
                      isDark ? 'border-white/10 hover:bg-white/5 text-white' : 'border-slate-200 hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-emerald-500 hover:bg-emerald-400 text-black shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Continue to Setup</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: ACCOUNT SETUP */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4"
              >
                <div>
                  <h3 className="text-lg font-bold">Account Setup</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Set your personalized retirement targets.
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">Target Retirement Age</label>
                    <input
                      type="number"
                      min={50}
                      max={85}
                      value={formData.targetAge}
                      onChange={(e) => setFormData(prev => ({ ...prev, targetAge: Number(e.target.value) }))}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                        isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">Target Wealth Goal ($)</label>
                    <input
                      type="number"
                      step="50000"
                      min={10000}
                      value={formData.targetBalance}
                      onChange={(e) => setFormData(prev => ({ ...prev, targetBalance: Number(e.target.value) }))}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                        isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>

                  <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-white/[0.02] border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                    <span className="text-xs font-bold block mb-1 text-emerald-400">Included Benefit: 20% CGA Bonus</span>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      All funds deployed into your 401(k) retirement allocation qualify for a guaranteed 20% annual platform bonus calculated upon eligible holding periods.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-3">
                  <button
                    type="button"
                    onClick={handleBack}
                    className={`py-3 px-5 rounded-xl font-semibold text-xs border transition-colors ${
                      isDark ? 'border-white/10 hover:bg-white/5 text-white' : 'border-slate-200 hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-emerald-500 hover:bg-emerald-400 text-black shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Review Application</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 4: REVIEW YOUR INFORMATION */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-5"
              >
                <div>
                  <h3 className="text-lg font-bold">Review Your Information</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Please confirm your details before opening your 401(k) account.
                  </p>
                </div>

                <div className={`rounded-2xl border divide-y overflow-hidden text-xs ${
                  isDark ? 'bg-white/[0.02] border-white/10 divide-white/5' : 'bg-slate-50 border-slate-200 divide-slate-200'
                }`}>
                  <div className="p-3 flex justify-between items-center">
                    <span className="text-muted-foreground">Full Name</span>
                    <span className="font-semibold text-foreground">{formData.fullName}</span>
                  </div>
                  <div className="p-3 flex justify-between items-center">
                    <span className="text-muted-foreground">Email</span>
                    <span className="font-semibold text-foreground">{formData.email}</span>
                  </div>
                  <div className="p-3 flex justify-between items-center">
                    <span className="text-muted-foreground">Phone</span>
                    <span className="font-semibold text-foreground">{formData.phone}</span>
                  </div>
                  <div className="p-3 flex justify-between items-center">
                    <span className="text-muted-foreground">Date of Birth</span>
                    <span className="font-semibold text-foreground">{formData.dob}</span>
                  </div>
                  <div className="p-3 flex justify-between items-center">
                    <span className="text-muted-foreground">SSN</span>
                    <span className="font-mono font-semibold text-emerald-400">{maskedPreview}</span>
                  </div>
                  <div className="p-3 flex justify-between items-center">
                    <span className="text-muted-foreground">Address</span>
                    <span className="font-semibold text-foreground truncate max-w-[200px] text-right">{formData.address}</span>
                  </div>
                  <div className="p-3 flex justify-between items-center">
                    <span className="text-muted-foreground">Account Status</span>
                    <span className="font-semibold text-emerald-400">Active</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleBack}
                    className={`py-3 px-5 rounded-xl font-semibold text-xs border transition-colors ${
                      isDark ? 'border-white/10 hover:bg-white/5 text-white' : 'border-slate-200 hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitApplication}
                    disabled={submitting}
                    className="flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {submitting ? (
                      <span>Opening Account...</span>
                    ) : (
                      <>
                        <span>Submit Application</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 5: COMPLETE */}
            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-6 text-center space-y-4"
              >
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
                  <CheckCircle2 size={30} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">401(k) Account Active</h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                    Your dedicated retirement account has been created. You can now fund your balance and start your 401(k) investment.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="py-3 px-8 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-black shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                  >
                    Go to 401(k) Dashboard
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
