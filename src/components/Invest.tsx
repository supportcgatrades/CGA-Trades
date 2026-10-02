import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import { 
  PlusCircle, 
  MinusCircle, 
  ArrowLeft, 
  Building2, 
  Bitcoin, 
  CheckCircle2, 
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  ShieldCheck,
  Zap,
  Clock,
  Cpu,
  Wallet,
  Coins,
  CreditCard,
  BarChart3,
  Check,
  Globe,
  X,
  Send,
  Search,
  Copy,
  RefreshCw
} from 'lucide-react';
import { cn, formatCurrency, formatNumberWithCommas, parseFormattedNumber } from '../lib/utils';
import { QRCodeCanvas } from 'qrcode.react';
import { useAuth, isLegacyUser } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useUI } from '../contexts/UIContext';
import { useUIConfig } from '../contexts/UIConfigContext';
import { useNavigate, Link } from 'react-router-dom';
import { COUNTRIES } from '../constants/countries';
import { detectUserLocation } from '../utils/geo';
import { DynamicBalance } from './DynamicBalance';
import SuccessModal from './SuccessModal';
import investHeaderBg from '../assets/images/invest_header_bg.webp';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  doc, 
  onSnapshot,
  updateDoc, 
  increment, 
  runTransaction,
  getDocs
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner';
import { broadcastActivity } from '../lib/activity_logger';
import InvestProcessingView from './InvestProcessingView';
import BetaInvestmentStepIndicator from './BetaInvestmentStepIndicator';
import { useMode } from '../contexts/ModeContext';
import { getRegionalLimits, applyRegionalPlanLimits } from '../utils/regionalLimits';
import { 
  isNigeriaRegion, 
  isAccountCountryNigeria,
  NIGERIA_BANK_ACCOUNTS, 
  fetchPaymentEligibility,
  getWhatsAppBankTransferUrl 
} from '../services/paymentRouting';
import { NigeriaBankTransferFlow } from './NigeriaBankTransferFlow';

// --- CONSTANTS ---
const CRYPTO_ADDRESSES = {
  usdt: "TJTym5Qs77hBEr2kEiJPVEQwR4kM2AosSG",
  btc: "bc1p2mw24svf4yg5d6v4lxk5309jlcgcqjdagaefuc0adac9z4ys2p5qfq9t8t"
};

const PLAN_IMAGES: Record<string, string> = {
  regular: "https://i.imgur.com/rXzjSWv.png",
  premium: "https://i.imgur.com/BqbyCqy.png",
  elite: "https://i.imgur.com/ik9pTGI.png",
};

const PLAN_PRESETS: Record<string, number[]> = {
  regular: [100, 10000, 40000],
  premium: [100000, 500000, 900000],
  elite: [1000000, 10000000, 50000000]
};

const getRobotForPlan = (planId: string) => {
  if (planId === 'premium') {
    return { name: 'AI 2.5', image: 'https://i.imgur.com/3DpE79P.png' };
  } else if (planId === 'elite') {
    return { name: 'AI 3.0', image: 'https://i.imgur.com/dZqi2MZ.png' };
  } else {
    return { name: 'AI 2.0', image: 'https://i.imgur.com/JGTKlCJ.png' };
  }
};

const getPlanIcon = (id: string) => {
  const imgSrc = PLAN_IMAGES[id];
  if (!imgSrc) return <Coins className="w-5 h-5 text-white" />;
  
  const glowStyle = id === 'regular' 
    ? 'shadow-[0_4px_20px_rgba(16,185,129,0.3)] shadow-[#10b981]'
    : id === 'premium'
    ? 'shadow-[0_4px_20px_rgba(139,92,246,0.35)] shadow-[#8b5cf6]'
    : 'shadow-[0_4px_22px_rgba(245,158,11,0.4)] shadow-[#f59e0b]';

  return (
    <div className={`w-8 h-8 lg:w-11 lg:h-11 flex items-center justify-center relative overflow-visible ${glowStyle} select-none`}>
      {/* Soft atmospheric gradient radial reflex glow */}
      <div className={`absolute inset-0 rounded-full bg-gradient-to-tr opacity-20 blur-md pointer-events-none -z-10 ${
        id === 'regular' ? 'from-emerald-500/30 to-transparent' : id === 'premium' ? 'from-purple-500/30 to-transparent' : 'from-amber-500/30 to-transparent'
      }`} />
      <img 
        src={imgSrc} 
        alt={`${id} tier`} 
        className="w-full h-full object-contain filter brightness-[1.12] contrast-[1.08] drop-shadow-[0_6px_10px_rgba(0,0,0,0.6)] transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500"
        referrerPolicy="no-referrer"
      />
    </div>
  );
};

// --- HIGH-QUALITY REALISTIC FINTECH SVG ICONS ---
const RealisticBankIcon = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
    <defs>
      <linearGradient id="bankGold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FBBF24" />
        <stop offset="50%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>
      <linearGradient id="bankBlue" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#3B82F6" />
        <stop offset="100%" stopColor="#1E3A8A" />
      </linearGradient>
      <linearGradient id="bankRoof" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#1E40AF" />
        <stop offset="100%" stopColor="#60A5FA" />
      </linearGradient>
    </defs>
    <rect x="4" y="32" width="32" height="4" rx="1.5" fill="url(#bankGold)" />
    <rect x="6" y="29" width="28" height="3" rx="1" fill="#4B5563" />
    <rect x="9" y="16" width="3" height="13" rx="0.5" fill="url(#bankBlue)" />
    <rect x="15" y="16" width="3" height="13" rx="0.5" fill="url(#bankBlue)" />
    <rect x="22" y="16" width="3" height="13" rx="0.5" fill="url(#bankBlue)" />
    <rect x="28" y="16" width="3" height="13" rx="0.5" fill="url(#bankBlue)" />
    <path d="M4 16H36L20 4L4 16Z" fill="url(#bankRoof)" />
    <circle cx="20" cy="11" r="2.5" fill="url(#bankGold)" />
    <path d="M19 11H21" stroke="#FFF" strokeWidth="0.5" />
    <path d="M20 10V12" stroke="#FFF" strokeWidth="0.5" />
  </svg>
);

const RealisticBitcoinIcon = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
    <defs>
      <linearGradient id="btcGold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F59E0B" />
        <stop offset="50%" stopColor="#D97706" />
        <stop offset="100%" stopColor="#92400E" />
      </linearGradient>
      <linearGradient id="btcFace" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FBBF24" />
        <stop offset="100%" stopColor="#F59E0B" />
      </linearGradient>
    </defs>
    <circle cx="20" cy="20" r="16" fill="url(#btcGold)" />
    <circle cx="20" cy="19" r="13.5" fill="url(#btcFace)" />
    <circle cx="20" cy="19" r="11" stroke="#FBBF24" strokeWidth="0.5" opacity="0.5" />
    <circle cx="20" cy="19" r="10" stroke="#92400E" strokeWidth="0.5" opacity="0.3" />
    <path 
      d="M17 11V27M20.5 11V13M20.5 25V27M17 14.5H22C24.5 14.5 25.5 15.75 25.5 17.25C25.5 18.5 24.5 19.5 22.5 19.5C25 19.5 26 20.75 26 22.5C26 24.25 24.5 25.5 22 25.5H17M17 19.5H21.5" 
      stroke="#FFF" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
  </svg>
);

const RealisticWalletIcon = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
    <defs>
      <linearGradient id="walletBody" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#8B5CF6" />
        <stop offset="100%" stopColor="#4C1D95" />
      </linearGradient>
      <linearGradient id="walletFlap" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#EC4899" />
        <stop offset="100%" stopColor="#BE185D" />
      </linearGradient>
      <linearGradient id="greenBill" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#10B981" />
        <stop offset="100%" stopColor="#047857" />
      </linearGradient>
    </defs>
    <rect x="10" y="7" width="16" height="8" rx="1.5" transform="rotate(-15 10 7)" fill="url(#greenBill)" />
    <rect x="15" y="6" width="15" height="8" rx="1.5" transform="rotate(-5 15 6)" fill="#6EE7B7" />
    <rect x="5" y="11" width="30" height="23" rx="4" fill="#312E81" />
    <rect x="5" y="13" width="30" height="21" rx="3.5" fill="url(#walletBody)" />
    <line x1="5" y1="18" x2="35" y2="18" stroke="#7C3AED" strokeWidth="1" opacity="0.3" />
    <path d="M22 17H32C33.6569 17 35 18.3431 35 20V26C35 27.6569 33.6569 29 32 29H22C20.3431 29 19 27.6569 19 26V20C19 18.3431 20.3431 17 22 17Z" fill="url(#walletFlap)" />
    <circle cx="24" cy="23" r="2.5" fill="#FBBF24" />
    <circle cx="24" cy="23" r="1" fill="#D97706" />
  </svg>
);

const RealisticCardIcon = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
    <defs>
      <linearGradient id="cardBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1E293B" />
        <stop offset="50%" stopColor="#0F172A" />
        <stop offset="100%" stopColor="#020617" />
      </linearGradient>
      <linearGradient id="silverGloss" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#E2E8F0" />
        <stop offset="100%" stopColor="#475569" />
      </linearGradient>
      <linearGradient id="chipGold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FDE047" />
        <stop offset="100%" stopColor="#CA8A04" />
      </linearGradient>
    </defs>
    <rect x="4" y="9" width="32" height="22" rx="3.5" fill="url(#cardBg)" stroke="#334155" strokeWidth="0.75" />
    <path d="M4 14L28 31H36V28L12 9H4V14Z" fill="url(#silverGloss)" opacity="0.15" />
    <rect x="8" y="14" width="6" height="5" rx="1" fill="url(#chipGold)" />
    <line x1="8" y1="16.5" x2="14" y2="16.5" stroke="#451A03" strokeWidth="0.5" opacity="0.3" />
    <line x1="11" y1="14" x2="11" y2="19" stroke="#451A03" strokeWidth="0.5" opacity="0.3" />
    <circle cx="28" cy="25" r="3.5" fill="#EF4444" opacity="0.85" />
    <circle cx="31.5" cy="25" r="3.5" fill="#F59E0B" opacity="0.85" />
  </svg>
);

export default function Invest() {
  const { user, profile, plans } = useAuth();
  const { scrollY } = useScroll();
  const headerScale = useTransform(scrollY, [0, 400], [1, 1.15]);
  const headerY = useTransform(scrollY, [0, 400], [0, 40]);
  const headerOpacity = useTransform(scrollY, [0, 400], [1, 0.6]);

  const { 
    setDistractionFree, 
    setMrBActivationPopup,
    isViewingProcessingScreen,
    setIsViewingProcessingScreen,
    processingInvestmentId,
    setProcessingInvestmentId,
    setIsWelcomeBonusDeductedPopupOpen
  } = useUI();
  const { config: uiConfig } = useUIConfig();
  const { t } = useLanguage();
  const { isLite, isBeta } = useMode();
  const { isRegisteredNigeria, regularPlanMin } = getRegionalLimits(profile, isLite);
  const effectivePlans = useMemo(() => {
    return applyRegionalPlanLimits(plans, profile, isLite);
  }, [plans, profile, isLite]);
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<'funding_balance' | 'available_balance' | 'referral_earnings' | 'reward_dollar_balance'>('funding_balance');
  const walletBalanceToShow = selectedWallet === 'reward_dollar_balance'
    ? (profile?.withdraw_methods?.reward_dollar_balance ?? profile?.reward_dollar_balance ?? 0)
    : (profile?.[selectedWallet] || 0);
  const [view, setView] = useState<'plans' | 'summary' | 'method_select' | 'payment' | 'processing'>('plans');
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [collapsedPlanId, setCollapsedPlanId] = useState<string | null>(null);
  const [modalPlan, setModalPlan] = useState<any | null>(null);
  const [modalAmount, setModalAmount] = useState<string>('');
  const [confirmedAmount, setConfirmedAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'crypto' | 'bank' | 'card' | null>('crypto');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [exchangeRate, setExchangeRate] = useState<number>(1400);
  const [nigeriaBankIndex, setNigeriaBankIndex] = useState<number | null>(null);

  // Country Selection & Card Payment Unavailability States
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [notSupportedCountry, setNotSupportedCountry] = useState<string | null>(null);
  const [showCardUnavailable, setShowCardUnavailable] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [detectedCountry, setDetectedCountry] = useState<string | null>(null);
  const [detectedCode, setDetectedCode] = useState<string | null>(null);
  // Authoritative check based strictly on the user's stored/verified account country:
  const isUserInNigeria = isAccountCountryNigeria(profile);

  useEffect(() => {
    if (!isUserInNigeria && paymentMethod === 'bank') {
      setPaymentMethod('crypto');
    }
  }, [isUserInNigeria, paymentMethod]);

  useEffect(() => {
    if (!user || !profile) return;
    
    const isCipher = profile.role === 'cipher';
    const isVerified = user.emailVerified || isCipher;

    if (!isVerified) return;

    const unsubscribeRate = onSnapshot(doc(db, 'settings', 'system'), (doc) => {
      if (doc.exists()) {
        setExchangeRate(doc.data().usd_to_ngn_rate || 1400);
      }
    }, (error) => {
      console.warn("Settings listener blocked:", error.message);
    });
    return () => unsubscribeRate();
  }, [user, profile]);
  
  const [cryptoType, setCryptoType] = useState<'usdt' | 'btc'>('usdt');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (view !== 'plans') {
      setDistractionFree(true);
    } else {
      setDistractionFree(false);
    }

    if (view !== 'processing') {
      setIsViewingProcessingScreen(false);
    }

    return () => {
      setDistractionFree(false);
      setIsViewingProcessingScreen(false);
    };
  }, [view, setDistractionFree, setIsViewingProcessingScreen]);

  // Preselection from AI Bot Marketplace
  useEffect(() => {
    if (!effectivePlans || effectivePlans.length === 0) return;
    
    const preselectPlanId = sessionStorage.getItem('preselectPlanId');
    const preselectAmount = sessionStorage.getItem('preselectAmount');
    
    if (preselectPlanId && preselectAmount) {
      const matchedPlan = effectivePlans.find((p: any) => p.id === preselectPlanId);
      const amtVal = parseFloat(preselectAmount);
      
      if (matchedPlan && !isNaN(amtVal)) {
        setSelectedPlan(matchedPlan);
        setConfirmedAmount(amtVal);
        setView('summary');
        
        // Also populate the input box for consistency
        setAmounts(prev => ({
          ...prev,
          [preselectPlanId]: formatNumberWithCommas(preselectAmount)
        }));
      }
      
      // Clean up preselection
      sessionStorage.removeItem('preselectPlanId');
      sessionStorage.removeItem('preselectAmount');
    }
  }, [effectivePlans]);

  // Automatically switch plans when the amount falls into a different plan's range
  useEffect(() => {
    if (!modalPlan || !modalAmount) return;
    const amountVal = parseFormattedNumber(modalAmount);
    if (isNaN(amountVal) || amountVal <= 0) return;

    // Check if the current amount fits in a different plan
    const fittingPlan = effectivePlans.find((p: any) => p.active_status !== false && amountVal >= p.min && amountVal <= p.max);
    if (fittingPlan && fittingPlan.id !== modalPlan.id) {
      setModalPlan(fittingPlan);
    }
  }, [modalAmount, effectivePlans, modalPlan]);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleStartInvestment = (plan: any) => {
    const amountStr = amounts[plan.id] || '';
    const invAmount = parseFormattedNumber(amountStr);
    
    if (!amountStr || isNaN(invAmount)) {
      toast.error("Please enter a valid amount.");
      return;
    }

    if (invAmount < plan.min || invAmount > plan.max) {
      toast.error(`Amount must be between ${formatCurrency(plan.min)} and ${formatCurrency(plan.max)}`);
      return;
    }

    setSelectedPlan(plan);
    setConfirmedAmount(invAmount);
    setView('summary');
  };

  const submitInvestment = async () => {
    if (!user || !profile || !selectedPlan || !paymentMethod) return;

    if (confirmedAmount < selectedPlan.min || confirmedAmount > selectedPlan.max) {
      toast.error(`Please enter a valid amount between ${formatCurrency(selectedPlan.min)} and ${formatCurrency(selectedPlan.max)}.`);
      return;
    }

    if (paymentMethod === "bank" && !isUserInNigeria) {
      toast.error("Bank transfer is restricted to accounts registered in Nigeria.");
      return;
    }
    
    if (profile.suspended || profile.banned) {
      toast.error("Account access restricted by System Protocol.");
      return;
    }

    if (!navigator.onLine) {
      toast.error("Connection unstable. Please retry when online.");
      return;
    }

    setIsSubmitting(true);

    try {
      const qDup = query(
        collection(db, 'investments'),
        where('user_id', '==', user.uid),
        where('plan_name', '==', selectedPlan.name),
        where('amount', '==', confirmedAmount)
      );
      const dupSnap = await getDocs(qDup);
      const hasPendingMatch = dupSnap.docs.some(docRecord => {
        const d = docRecord.data();
        const s = (d.status || '').toLowerCase();
        return s === 'pending' || s === 'awaiting_payment' || s === 'under_review' || s === 'awaiting_approval' || s === 'awaiting-payment' || s === 'under-review' || s === 'awaiting_payment_verification';
      });

      if (hasPendingMatch) {
        toast.error(`A duplicate request for ${formatCurrency(confirmedAmount)} on the ${selectedPlan.name} Plan is already pending review.`);
        setIsSubmitting(false);
        return;
      }

      const invRef = doc(collection(db, 'investments'));
      const newInvestmentId = invRef.id;

      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await transaction.get(userRef);
        
        if (!userSnap.exists()) {
          throw new Error("User profile not found.");
        }

        const userData = userSnap.data();
        
        const currentWalletBalance = selectedWallet === 'reward_dollar_balance'
          ? (userData.withdraw_methods?.reward_dollar_balance ?? userData.reward_dollar_balance ?? 0)
          : (userData[selectedWallet] || 0);

        if (paymentMethod === 'wallet' && confirmedAmount > currentWalletBalance) {
          throw new Error(`Insufficient ${selectedWallet.replace(/_/g, ' ')}. Please fund your wallet.`);
        }

        const isEnrolled = userData.migration_status === 'accepted' || !isLegacyUser(userData);
        const finalInvAmount = paymentMethod === 'wallet' 
          ? confirmedAmount * 3 
          : confirmedAmount;

        transaction.set(invRef, {
          user_id: user.uid,
          user_name: userData.name,
          plan_name: selectedPlan.name,
          amount: finalInvAmount,
          dailyRoi: selectedPlan.roi,
          duration: selectedPlan.duration,
          payment_method: paymentMethod,
          wallet_source: paymentMethod === 'wallet' ? selectedWallet : null,
          reference: transactionId || 'internal_wallet',
          status: paymentMethod === 'wallet' ? 'inactive' : 'pending',
          referral_bonus_processed: false,
          created_at: new Date().toISOString(),
        });

        if (paymentMethod === 'wallet') {
          const userUpdates: any = {
            total_invested: increment(finalInvAmount)
          };
          if (isEnrolled) {
            userUpdates.remaining_upgraded_assets = increment(finalInvAmount);
          }

          if (selectedWallet === 'reward_dollar_balance') {
            const existingWithdrawMethods = userData.withdraw_methods || {};
            const oldRewardDollarBalance = existingWithdrawMethods.reward_dollar_balance ?? userData.reward_dollar_balance ?? 0;
            userUpdates.withdraw_methods = {
              ...existingWithdrawMethods,
              reward_dollar_balance: oldRewardDollarBalance - confirmedAmount
            };
          } else {
            userUpdates[selectedWallet] = increment(-confirmedAmount);
          }
          
          transaction.update(userRef, userUpdates);
        }

        const txRef = doc(collection(db, 'transactions'));
        transaction.set(txRef, {
          user_id: user.uid,
          type: 'investment',
          amount: finalInvAmount,
          plan_name: selectedPlan.name,
          method: paymentMethod,
          wallet_source: paymentMethod === 'wallet' ? selectedWallet : null,
          status: paymentMethod === 'wallet' ? 'completed' : 'pending',
          created_at: new Date().toISOString()
        });
      });

      setAmounts({});
      setTransactionId('');
      toast.success(paymentMethod === 'wallet' ? "Investment initialized successfully." : "Investment request submitted. Awaiting network confirmation.");
      
      broadcastActivity(
        profile.name || "Client",
        "Activated Node",
        `$${confirmedAmount.toLocaleString()}`,
        true,
        "⚙️"
      );

      // Save the premium countdown details in localStorage
      const startTimeValue = Date.now();
      localStorage.setItem('premium_pending_countdown', JSON.stringify({
        startTime: startTimeValue,
        amount: confirmedAmount,
        type: 'investment',
        planName: selectedPlan.name,
        dismissed: false
      }));
      // Trigger layout notification
      window.dispatchEvent(new Event('premium_success_trigger'));

      // Trigger the premium processing screen layout transition
      setProcessingInvestmentId(newInvestmentId);
      setIsViewingProcessingScreen(true);
      setView('processing');
    } catch (error: any) {
      console.error("Investment Error:", error);
      toast.error(error.message || "Process failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmModal = () => {
    if (!modalPlan) return;
    const amt = parseFormattedNumber(modalAmount);
    if (isNaN(amt) || amt < modalPlan.min || amt > modalPlan.max) {
      toast.error(`Please enter a valid amount between ${formatCurrency(modalPlan.min)} and ${formatCurrency(modalPlan.max)}.`);
      return;
    }
    setAmounts(prev => ({ ...prev, [modalPlan.id]: modalAmount }));
    setConfirmedAmount(amt);
    setSelectedPlan(modalPlan);
    setModalPlan(null);
    setView('summary');
  };

  return (
    <div className="pb-24 lg:pb-8 bg-transparent -mx-6 -mt-8 px-6 pt-8 min-h-screen relative overflow-hidden transition-all duration-500">
      <AnimatePresence mode="wait">
        {view === 'processing' && isViewingProcessingScreen && selectedPlan && (
          <InvestProcessingView 
            onClose={() => {
              setIsViewingProcessingScreen(false);
              setView('plans');
              setMrBActivationPopup(true);
            }} 
            investmentId={processingInvestmentId}
            planName={selectedPlan.name}
            amount={confirmedAmount}
            isBeta={isBeta}
          />
        )}

        {view === 'plans' && (
          <motion.div 
            key="plans"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="space-y-10 w-full"
          >
            {/* Slim Header Banner with Parallax Zoom and Overlay Content */}
            <div className="relative -mx-6 -mt-8 mb-8 h-[140px] sm:h-[180px] md:h-[220px] overflow-hidden bg-white dark:bg-[#050608] border-b border-slate-200/80 dark:border-white/5 select-none group/header">
              {/* Light Mode subtle emerald & green ambient accents */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.08] via-white/80 to-emerald-500/[0.03] dark:hidden" />
              <div className="absolute top-0 right-1/4 w-80 h-80 bg-[#009e42]/10 rounded-full blur-3xl pointer-events-none dark:hidden" />

              <motion.div 
                style={{ scale: headerScale, y: headerY, opacity: headerOpacity }}
                className="absolute inset-0 w-full h-full"
              >
                <img 
                  src={investHeaderBg} 
                  alt="Investment Plans Header" 
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  className="w-full h-full object-cover select-none transition-all duration-300 opacity-30 dark:opacity-100 brightness-[1.05] contrast-[1.05] dark:brightness-[0.6] dark:contrast-[1.1]"
                  referrerPolicy="no-referrer"
                />
                {/* Light Mode: White/light fade; Dark Mode: Existing deep dark gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/60 to-transparent dark:from-[#050608] dark:via-[#050608]/40 dark:to-black/30 transition-colors duration-300" />
              </motion.div>
              
              {/* Floating Back Button */}
              <div className="absolute top-4 left-6 z-30">
                <button 
                  onClick={() => {
                    const backRoute = sessionStorage.getItem('lastMainRoute') || '/dashboard';
                    navigate(backRoute);
                  }} 
                  className="p-2 bg-white/85 hover:bg-white hover:scale-105 border border-slate-200/90 hover:border-slate-300 text-slate-700 shadow-sm dark:bg-black/60 dark:hover:bg-black/85 dark:border-white/10 dark:hover:border-white/20 dark:text-white/80 rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0"
                >
                  <ArrowLeft size={14} />
                </button>
              </div>

              {/* Title & Subtitle Overlay */}
              <div className="absolute inset-0 flex flex-col justify-center items-center z-20 px-6 text-center">
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="space-y-1.5"
                >
                  <h1 className="text-xl sm:text-2xl md:text-4xl font-black uppercase tracking-[0.15em] text-slate-900 dark:text-white font-sans drop-shadow-sm dark:drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]">
                    Investment <span className="text-[#009e42]">Plans</span>
                  </h1>
                  <p className="text-[10px] sm:text-xs md:text-sm text-slate-600 dark:text-white/60 font-medium tracking-wide max-w-xl mx-auto drop-shadow-none dark:drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                    Choose an investment plan that best suits you.
                  </p>
                </motion.div>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {collapsedPlanId ? (
                <motion.div
                  key="collapsed-plan"
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -15 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="max-w-md mx-auto px-4 py-8"
                >
                  {effectivePlans.filter((p: any) => p.active_status !== false && p.id === collapsedPlanId).map((plan: any) => {
                    const customCardStyle: React.CSSProperties = {};
                    if (plan.card_background) {
                      customCardStyle.backgroundColor = plan.card_background;
                    }
                    if (plan.card_border) {
                      customCardStyle.borderColor = plan.card_border;
                    }
                    if (plan.accent_color) {
                      customCardStyle.boxShadow = `0 10px 40px -10px ${plan.accent_color}66`;
                    }

                    return (
                      <div 
                        key={plan.id}
                        className="flex flex-col gap-4 w-full"
                      >
                        {/* Subtle Reset / Go Back Button */}
                        <button 
                          type="button"
                          onClick={() => {
                            setAmounts({});
                            setCollapsedPlanId(null);
                          }}
                          className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-aura-muted hover:text-white transition-colors self-start mb-2 cursor-pointer"
                        >
                          <ArrowLeft size={12} /> Show All Plans
                        </button>

                        <div 
                          className={cn(
                            "border rounded-[2rem] flex flex-col p-6 shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-all duration-500 relative overflow-hidden group w-full",
                            !plan.card_border && plan.borderColor,
                            !plan.card_background && plan.bgColor
                          )}
                          style={customCardStyle}
                        >
                          <div className={cn("absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-10 blur-xl -z-0", plan.gradient)} />
                          
                          <div className="relative z-10 flex-1 flex flex-col">
                            <div className="flex items-center justify-between mb-6">
                              <div>
                                <span className="text-[8px] font-black uppercase tracking-widest text-aura-muted leading-none">Active Allocation</span>
                                <h3 
                                  className={cn("text-xl font-black italic font-serif mt-0.5", !plan.accent_color && plan.color)}
                                  style={plan.accent_color ? { color: plan.accent_color } : {}}
                                >
                                  {plan.name}
                                </h3>
                              </div>
                              <div 
                                  className={cn("inline-flex items-center justify-center p-2 rounded-xl shadow-inner", !plan.accent_color && plan.buttonColor)}
                                  style={plan.accent_color ? { backgroundColor: `${plan.accent_color}22`, border: `1px solid ${plan.accent_color}33` } : {}}
                                >
                                  {getPlanIcon(plan.id)}
                                </div>
                              </div>

                              <div className="space-y-1.5 mb-6">
                                <span className="text-[7px] lg:text-[8px] font-bold text-aura-muted uppercase tracking-widest block ml-1 leading-none">Investment Amount ($)</span>
                                <div className="relative">
                                  <span className={cn(
                                    "absolute left-3 top-1/2 -translate-y-1/2 font-bold text-[10px] uppercase",
                                    amounts[plan.id] && (parseFormattedNumber(amounts[plan.id]) < plan.min || parseFormattedNumber(amounts[plan.id]) > plan.max) ? "text-red-500" : "text-white/40"
                                  )}>$</span>
                                  <input 
                                    type="text"
                                    inputMode="decimal"
                                    placeholder="0.00"
                                    value={amounts[plan.id] || ''}
                                    onChange={(e) => {
                                      const val = formatNumberWithCommas(e.target.value, true);
                                      setAmounts({ [plan.id]: val }); 
                                      if (!val) {
                                        setCollapsedPlanId(null);
                                      }
                                    }}
                                    className={cn(
                                      "w-full bg-white/5 border rounded-xl py-3.5 pl-7 pr-3 text-[10px] font-black transition-all outline-none",
                                      amounts[plan.id] && (parseFormattedNumber(amounts[plan.id]) < plan.min || parseFormattedNumber(amounts[plan.id]) > plan.max) 
                                        ? "border-red-500 text-red-500 focus:bg-red-500/10" 
                                        : "border-white/5 text-white focus:bg-white/10"
                                    )}
                                    style={(!amounts[plan.id] || parseFormattedNumber(amounts[plan.id]) >= plan.min && parseFormattedNumber(amounts[plan.id]) <= plan.max) && plan.card_border ? { borderColor: `${plan.card_border}40` } : {}}
                                  />
                                </div>
                              </div>
                            </div>
            
                            <button 
                              disabled={!amounts[plan.id] || parseFormattedNumber(amounts[plan.id]) < plan.min || parseFormattedNumber(amounts[plan.id]) > plan.max}
                              onClick={() => handleStartInvestment(plan)}
                              className={cn(
                                "w-full py-4 rounded-xl text-white font-black text-[9px] uppercase tracking-[0.2em] transition-all shadow-lg active:scale-[0.98]",
                                !plan.accent_color && plan.buttonColor,
                                (!amounts[plan.id] || parseFormattedNumber(amounts[plan.id]) < plan.min || parseFormattedNumber(amounts[plan.id]) > plan.max) && "opacity-20 cursor-not-allowed grayscale"
                              )}
                              style={(!amounts[plan.id] || parseFormattedNumber(amounts[plan.id]) >= plan.min && parseFormattedNumber(amounts[plan.id]) <= plan.max) && plan.accent_color ? { backgroundColor: plan.accent_color, shadowColor: plan.accent_color } : {}}
                            >
                              Invest Now
                            </button>
                          </div>
                        </div>
                    );
                  })}
                </motion.div>
              ) : (
                <motion.div
                  key="all-plans-container"
                  initial={{ opacity: 0, scale: 0.98, y: -15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, y: 15 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full relative"
                >
                  <div className="hidden lg:grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-6 max-w-6xl mx-auto py-8 px-4 items-stretch">
                    {effectivePlans.filter((p: any) => p.active_status !== false).map((plan: any) => {
                      const isPremium = plan.id === 'premium';
                      
                      let minMaxText = "";
                      let planIcon = null;
                      let descriptionText = plan.description;

                      if (plan.id === 'regular') {
                        minMaxText = `${plan.min === 10 ? '$10' : '$100'} - $90k`;
                        descriptionText = "Steady growth for smart investors";
                        planIcon = (
                          <svg width="64" height="72" viewBox="0 0 64 72" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-4 drop-shadow-[0_0_15px_rgba(164,209,0,0.35)]">
                            <path d="M32 2L59.7 18V50L32 66L4.3 50V18L32 2Z" fill="url(#hexGlowReg)" stroke="#009e42" strokeWidth="1.5" />
                            <path d="M32 16L35.5 23.5H43L37 28L39.5 35.5L32 30.5L24.5 35.5L27 28L21 23.5H28.5L32 16Z" fill="#009e42" />
                            <path d="M26 31L23 45L32 40L41 45L38 31" stroke="#009e42" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            <defs>
                              <radialGradient id="hexGlowReg" cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stopColor="#009e42" stopOpacity="0.25" />
                                <stop offset="100%" stopColor="#009e42" stopOpacity="0" />
                              </radialGradient>
                            </defs>
                          </svg>
                        );
                      } else if (plan.id === 'premium') {
                        minMaxText = "$100k - $900k";
                        descriptionText = "Higher returns with optimal balance";
                        planIcon = (
                          <svg width="64" height="72" viewBox="0 0 64 72" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-4 drop-shadow-[0_0_20px_rgba(164,209,0,0.5)]">
                            <path d="M32 2L59.7 18V50L32 66L4.3 50V18L32 2Z" fill="url(#hexGlowPrem)" stroke="#009e42" strokeWidth="2.5" />
                            <path d="M20 42V28L26 33L32 23L38 33L44 28V42H20Z" fill="#009e42" />
                            <circle cx="20" cy="25" r="2.5" fill="#009e42" />
                            <circle cx="32" cy="19" r="2.5" fill="#009e42" />
                            <circle cx="44" cy="25" r="2.5" fill="#009e42" />
                            <defs>
                              <radialGradient id="hexGlowPrem" cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stopColor="#009e42" stopOpacity="0.35" />
                                <stop offset="100%" stopColor="#009e42" stopOpacity="0" />
                              </radialGradient>
                            </defs>
                          </svg>
                        );
                      } else {
                        minMaxText = "$1M - $50M";
                        descriptionText = "Maximum returns for elite investors";
                        planIcon = (
                          <svg width="64" height="72" viewBox="0 0 64 72" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-4 drop-shadow-[0_0_15px_rgba(164,209,0,0.35)]">
                            <path d="M32 2L59.7 18V50L32 66L4.3 50V18L32 2Z" fill="url(#hexGlowElite)" stroke="#009e42" strokeWidth="2" />
                            <path d="M32 18L45 28L32 48L19 28L32 18Z" stroke="#009e42" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                            <path d="M19 28H45" stroke="#009e42" strokeWidth="1.5" />
                            <path d="M25 23H39" stroke="#009e42" strokeWidth="1.5" />
                            <defs>
                              <radialGradient id="hexGlowElite" cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stopColor="#009e42" stopOpacity="0.25" />
                                <stop offset="100%" stopColor="#009e42" stopOpacity="0" />
                              </radialGradient>
                            </defs>
                          </svg>
                        );
                      }

                      return (
                        <div 
                          key={plan.id}
                          onClick={() => {
                            setModalPlan(plan);
                            setModalAmount(formatNumberWithCommas(plan.min));
                          }}
                          className={cn(
                            "flex flex-col relative rounded-[2rem] p-8 transition-all duration-300 w-full overflow-hidden cursor-pointer group select-none hover:translate-y-[-4px]",
                            isPremium 
                              ? "bg-[#090d15] border-2 border-[#009e42] shadow-[0_0_35px_rgba(164,209,0,0.25)] lg:scale-[1.04] z-10 hover:shadow-[0_0_50px_rgba(164,209,0,0.4)]" 
                              : "bg-[#090d15] border border-white/5 hover:border-[#009e42]/40 hover:shadow-[0_0_25px_rgba(164,209,0,0.12)] z-0"
                          )}
                        >
                          {isPremium && (
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-[#009e42] text-black text-[9px] font-black uppercase tracking-widest px-6 py-1.5 rounded-b-xl shadow-[0_4px_12px_rgba(164,209,0,0.3)] z-20">
                              MOST POPULAR
                            </div>
                          )}

                          {plan.id === 'regular' && (
                            <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-0 flex items-end justify-end p-4">
                              <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M20 180 L50 140 L50 160 L80 110 L80 130 L110 80 L110 100 L140 40 L140 60 L180 20" stroke="#009e42" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </div>
                          )}
                          {plan.id === 'premium' && (
                            <div className="absolute inset-0 pointer-events-none opacity-[0.04] z-0 flex items-center justify-center">
                              <svg width="300" height="300" viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="150" cy="150" r="90" stroke="#009e42" strokeWidth="1" strokeDasharray="3 3" />
                                <circle cx="150" cy="150" r="60" stroke="#009e42" strokeWidth="1" />
                              </svg>
                            </div>
                          )}
                          {plan.id === 'elite' && (
                            <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-0 flex items-end justify-end p-4">
                              <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M10 170 L40 150 L70 120 L100 130 L130 90 L160 50 L190 20" stroke="#009e42" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </div>
                          )}

                          <div className="relative z-10 flex-1 flex flex-col justify-between h-full">
                            <div className="flex flex-col items-center text-center">
                              <div className="transform transition-transform duration-300 group-hover:scale-105">
                                {planIcon}
                              </div>

                              <h3 className="text-2xl font-black text-white tracking-tight mb-1.5 uppercase">
                                {plan.id === 'regular' ? 'Regular Plan' : plan.id === 'premium' ? 'Premium Plan' : 'Elite Plan'}
                              </h3>
                              <p className="text-xs text-white/50 mb-6 font-medium max-w-[240px]">
                                {descriptionText}
                              </p>

                              {/* ROI Box */}
                              <div className="bg-[#05080f]/60 border border-white/5 rounded-2xl p-4 flex items-center gap-4 mb-4 w-full transition-all duration-300 hover:border-[#009e42]/25 hover:bg-black/40">
                                <div className="w-10 h-10 rounded-full border border-[#009e42]/30 bg-[#009e42]/5 flex items-center justify-center text-[#009e42] shrink-0">
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                                    <polyline points="16 7 22 7 22 13" />
                                  </svg>
                                </div>
                                <div className="flex items-baseline gap-1.5 text-left">
                                  <span className="text-2xl font-black text-[#009e42] tracking-tight">
                                    {((plan.weekday_roi || plan.roi) * 100).toFixed(1)}%
                                  </span>
                                  <span className="text-xs text-white/40 font-semibold uppercase tracking-wider">
                                    Daily ROI
                                  </span>
                                </div>
                              </div>

                              {/* Limits Box */}
                              <div className="bg-[#05080f]/60 border border-white/5 rounded-2xl p-4 flex items-center gap-4 w-full text-left transition-all duration-300 hover:border-[#009e42]/25 hover:bg-black/40">
                                <div className="w-10 h-10 rounded-full border border-[#009e42]/30 bg-[#009e42]/5 flex items-center justify-center text-[#009e42] shrink-0 font-extrabold text-sm">
                                  $
                                </div>
                                <div>
                                  <p className="text-lg font-black text-white leading-none tracking-tight">{minMaxText}</p>
                                  <p className="text-[10px] text-white/40 tracking-wider font-semibold uppercase mt-1.5 leading-none">Min - Max Investment</p>
                                </div>
                              </div>
                            </div>

                            {/* Elegant Invest Now button */}
                            <div className="mt-6">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setModalPlan(plan);
                                  setModalAmount(formatNumberWithCommas(plan.min));
                                }}
                                className={cn(
                                  "w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer",
                                  isPremium 
                                    ? "bg-[#009e42] hover:bg-[#02d147] text-black shadow-[0_4px_15px_rgba(164,209,0,0.3)] hover:shadow-[0_4px_20px_rgba(164,209,0,0.5)]" 
                                    : "border border-[#009e42]/30 hover:border-[#009e42]/60 bg-[#009e42]/5 hover:bg-[#009e42]/15 text-[#009e42] hover:shadow-[0_0_15px_rgba(164,209,0,0.15)]"
                                )}
                              >
                                Invest Now <ArrowRight size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Mobile-Only Horizontal Cards (lg:hidden) */}
                  <div className="flex flex-col lg:hidden gap-4 max-w-md mx-auto py-4 px-4 items-stretch w-full">
                    {effectivePlans.filter((p: any) => p.active_status !== false).map((plan: any) => {
                      const isPremium = plan.id === 'premium';
                      
                      let minMaxText = "";
                      let planIcon = null;
                      let descriptionText = plan.description;

                      if (plan.id === 'regular') {
                        minMaxText = `${plan.min === 10 ? '$10' : '$100'} - $90k`;
                        descriptionText = "Steady growth for smart investors";
                        planIcon = (
                          <svg width="44" height="50" viewBox="0 0 64 72" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[0_0_8px_rgba(164,209,0,0.35)]">
                            <path d="M32 2L59.7 18V50L32 66L4.3 50V18L32 2Z" fill="url(#hexGlowRegMob)" stroke="#009e42" strokeWidth="1.5" />
                            <path d="M32 16L35.5 23.5H43L37 28L39.5 35.5L32 30.5L24.5 35.5L27 28L21 23.5H28.5L32 16Z" fill="#009e42" />
                            <path d="M26 31L23 45L32 40L41 45L38 31" stroke="#009e42" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            <defs>
                              <radialGradient id="hexGlowRegMob" cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stopColor="#009e42" stopOpacity="0.25" />
                                <stop offset="100%" stopColor="#009e42" stopOpacity="0" />
                              </radialGradient>
                            </defs>
                          </svg>
                        );
                      } else if (plan.id === 'premium') {
                        minMaxText = "$100k - $900k";
                        descriptionText = "Higher returns with optimal balance";
                        planIcon = (
                          <svg width="44" height="50" viewBox="0 0 64 72" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[0_0_12px_rgba(164,209,0,0.5)]">
                            <path d="M32 2L59.7 18V50L32 66L4.3 50V18L32 2Z" fill="url(#hexGlowPremMob)" stroke="#009e42" strokeWidth="2.5" />
                            <path d="M32 18L38 28H26L32 18Z" fill="#009e42" />
                            <circle cx="32" cy="38" r="5" fill="#009e42" />
                            <circle cx="23" cy="28" r="3" fill="#009e42" />
                            <circle cx="41" cy="28" r="3" fill="#009e42" />
                            <defs>
                              <radialGradient id="hexGlowPremMob" cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stopColor="#009e42" stopOpacity="0.35" />
                                <stop offset="100%" stopColor="#009e42" stopOpacity="0" />
                              </radialGradient>
                            </defs>
                          </svg>
                        );
                      } else {
                        minMaxText = "$1M - $50M";
                        descriptionText = "Maximum returns for elite investors";
                        planIcon = (
                          <svg width="44" height="50" viewBox="0 0 64 72" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[0_0_8px_rgba(164,209,0,0.35)]">
                            <path d="M32 2L59.7 18V50L32 66L4.3 50V18L32 2Z" fill="url(#hexGlowEliteMob)" stroke="#009e42" strokeWidth="2" />
                            <path d="M22 22 L32 14 L42 22 L32 44 Z" fill="none" stroke="#009e42" strokeWidth="1.5" />
                            <path d="M22 22 L42 22 M32 14 L32 44" fill="none" stroke="#009e42" strokeWidth="1.5" />
                            <defs>
                              <radialGradient id="hexGlowEliteMob" cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stopColor="#009e42" stopOpacity="0.25" />
                                <stop offset="100%" stopColor="#009e42" stopOpacity="0" />
                              </radialGradient>
                            </defs>
                          </svg>
                        );
                      }

                      return (
                        <motion.div 
                          key={plan.id}
                          initial={{ opacity: 0, y: 40 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true, margin: "-50px" }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                          onClick={() => {
                            setModalPlan(plan);
                            setModalAmount(formatNumberWithCommas(plan.min));
                          }}
                          className={cn(
                            "relative rounded-[1.5rem] p-5 transition-all duration-300 w-full overflow-hidden cursor-pointer flex flex-row items-center gap-4 select-none",
                            isPremium 
                              ? "bg-[#090d15] border-2 border-[#009e42] shadow-[0_0_20px_rgba(164,209,0,0.2)] pt-8" 
                              : "bg-[#090d15] border border-white/5"
                          )}
                        >
                          {isPremium && (
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-[#009e42] text-black text-[8px] font-black uppercase tracking-widest px-4 py-1.5 rounded-b-xl shadow-[0_4px_10px_rgba(164,209,0,0.3)] z-20 whitespace-nowrap">
                              MOST POPULAR
                            </div>
                          )}

                          {plan.id === 'regular' && (
                            <div className="absolute inset-0 pointer-events-none opacity-[0.02] z-0 flex items-end justify-end p-2">
                              <svg width="100" height="100" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M20 180 L50 140 L50 160 L80 110 L80 130 L110 80 L110 100 L140 40 L140 60 L180 20" stroke="#009e42" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </div>
                          )}

                          {/* Extreme left icon */}
                          <div className="relative z-10 flex-shrink-0 flex items-center justify-center w-12 transform transition-transform duration-300">
                            {planIcon}
                          </div>

                          {/* Info Area */}
                          <div className="relative z-10 flex-1 flex flex-col justify-between min-w-0">
                            <div>
                              <h3 className="text-base font-black text-white tracking-tight uppercase">
                                {plan.id === 'regular' ? 'Regular Plan' : plan.id === 'premium' ? 'Premium Plan' : 'Elite Plan'}
                              </h3>
                              <p className="text-[10px] text-white/50 font-medium mb-2 truncate">
                                {descriptionText}
                              </p>

                              {/* Percentage and daily ROI on the same horizontal line */}
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-base font-black text-[#009e42] tracking-tight">
                                  {((plan.weekday_roi || plan.roi) * 100).toFixed(1)}%
                                </span>
                                <span className="text-[9px] text-white/40 font-semibold uppercase tracking-wider">
                                  Daily ROI
                                </span>
                              </div>

                              {/* Minimum to maximum investment figures and Min - Max label side by side */}
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-white">
                                  {minMaxText}
                                </span>
                                <span className="text-[8px] text-white/40 font-semibold uppercase tracking-wider">
                                  Min-Max Investment
                                </span>
                              </div>
                            </div>

                            {/* Invest Now button */}
                            <div className="mt-3">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setModalPlan(plan);
                                  setModalAmount(formatNumberWithCommas(plan.min));
                                }}
                                className={cn(
                                  "w-full py-2.5 rounded-lg font-black text-[10px] uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer",
                                  isPremium 
                                    ? "bg-[#009e42] text-white shadow-[0_2px_8px_rgba(0,158,66,0.3)]" 
                                    : "border border-[#009e42]/30 bg-[#009e42]/5 text-[#009e42]"
                                )}
                              >
                                Invest Now <ArrowRight size={10} />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {modalPlan && (
                    <div className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 15 }}
                        className="bg-[#0b0c10] border border-[#009e42]/30 rounded-2xl max-w-sm w-full p-5 sm:p-6 shadow-[0_0_50px_rgba(0,158,66,0.15)] flex flex-col relative overflow-hidden"
                      >
                        <button 
                          type="button"
                          onClick={() => setModalPlan(null)}
                          className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors cursor-pointer z-30"
                        >
                          <X size={16} />
                        </button>

                        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#009e42] to-transparent opacity-50" />

                        <div className="flex flex-col items-center text-center mb-4">
                          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#009e42] mb-1">Configure Allocation</span>
                          <h3 className="text-xl font-black text-white uppercase tracking-tight">{modalPlan.name}</h3>
                          <p className="text-[10px] text-white/50 mt-0.5">{modalPlan.id === 'regular' ? 'Steady growth for smart investors' : modalPlan.id === 'premium' ? 'Higher returns with optimal balance' : 'Maximum returns for elite investors'}</p>
                        </div>

                        <div className="space-y-4">
                          <div className="bg-white/[0.02] border border-white/5 rounded-xl px-3 py-2 flex items-center justify-between">
                            <span className="text-[10px] text-white/40 font-semibold uppercase tracking-wider">Expected Yield</span>
                            <span className="text-sm font-black text-[#009e42] italic font-serif">
                              {((modalPlan.weekday_roi || modalPlan.roi) * 100).toFixed(1)}% Daily ROI
                            </span>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-white/40 uppercase tracking-widest block ml-1">Investment Amount ($)</label>
                            <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-bold text-lg">$</span>
                              <input 
                                type="text"
                                inputMode="decimal"
                                placeholder="0.00"
                                value={modalAmount}
                                onChange={(e) => {
                                  const val = formatNumberWithCommas(e.target.value, true);
                                  setModalAmount(val);
                                }}
                                className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 pl-8 pr-4 text-lg font-black text-white transition-all outline-none focus:border-[#009e42] focus:bg-[#009e42]/5 text-center"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-1.5">
                            {(modalPlan.id === 'regular' ? [modalPlan.min, 10000, 40000] : (PLAN_PRESETS[modalPlan.id] || [])).map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => setModalAmount(formatNumberWithCommas(preset))}
                                className={cn(
                                  "py-2 rounded-lg text-center border text-[10px] font-black transition-all cursor-pointer select-none",
                                  parseFormattedNumber(modalAmount) === preset 
                                    ? "bg-[#009e42] border-[#009e42] text-white shadow-[0_2px_8px_rgba(0,158,66,0.2)]"
                                    : "bg-white/[0.02] border-white/5 text-white/60 hover:bg-white/[0.04] hover:text-white"
                                )}
                              >
                                ${preset >= 1000000 ? `${preset / 1000000}M` : preset >= 1000 ? `${preset / 1000}k` : preset}
                              </button>
                            ))}
                          </div>

                          <div className="text-center">
                            <p className="text-[9px] text-white/40 tracking-wider">
                              Range Limits: <span className="text-[#009e42] font-bold">{formatCurrency(modalPlan.min)}</span> - <span className="text-[#009e42] font-bold">{formatCurrency(modalPlan.max)}</span>
                            </p>
                          </div>

                          <button 
                            type="button"
                            disabled={!modalAmount || parseFormattedNumber(modalAmount) < modalPlan.min || parseFormattedNumber(modalAmount) > modalPlan.max}
                            onClick={handleConfirmModal}
                            className={cn(
                              "w-full py-3 rounded-xl text-white font-extrabold text-xs tracking-widest uppercase transition-all shadow-lg flex items-center justify-center gap-1.5 cursor-pointer",
                              (!modalAmount || parseFormattedNumber(modalAmount) < modalPlan.min || parseFormattedNumber(modalAmount) > modalPlan.max)
                                ? "bg-[#009e42]/20 text-white/40 cursor-not-allowed"
                                : "bg-[#009e42] hover:bg-[#02d147] active:scale-[0.98] shadow-[0_2px_15px_rgba(0,158,66,0.25)]"
                            )}
                          >
                            Confirm <ArrowRight size={14} />
                          </button>
                        </div>
                      </motion.div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {view === 'summary' && selectedPlan && (
          <motion.div
            key="summary"
            initial={{ opacity: 0, x: 10, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -10, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="w-full min-h-[70vh] flex flex-col items-center justify-center py-6 lg:py-12"
          >
            <div className="max-w-md w-full">
              <BetaInvestmentStepIndicator 
                currentView={view} 
                isConfirmed={agreedToTerms} 
              />
             <div className="p-5 sm:p-6 bg-[#0c0e14] border border-white/10 rounded-2xl space-y-4 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                <button 
                  onClick={() => setView('plans')}
                  className="flex items-center gap-1.5 text-[8px] font-medium text-slate-400 hover:text-white transition-colors"
                >
                  <ArrowLeft size={10} /> Back to plans
                </button>
 
                <div className="space-y-4">
                  {/* Elegant Robot Display - Smaller & Sleeker */}
                  <div className="flex flex-col items-center justify-center p-4 bg-gradient-to-b from-white/[0.015] to-transparent border border-white/5 rounded-2xl relative overflow-hidden text-center">
                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                    
                    {/* Investment Plan Badge in top-right corner */}
                    <div className="absolute top-3 right-3 z-20">
                      <span className="text-[8px] font-black uppercase tracking-wider text-[#009e42] bg-[#009e42]/10 border border-[#009e42]/20 px-2 py-0.5 rounded">
                        {selectedPlan.name}
                      </span>
                    </div>

                    {/* Robot Image */}
                    <div className="relative mb-2 mt-4">
                      <div className="absolute inset-0 bg-[#009e42]/5 rounded-full blur-xl pointer-events-none" />
                      <img 
                        src={getRobotForPlan(selectedPlan.id).image} 
                        alt={getRobotForPlan(selectedPlan.id).name} 
                        className="w-14 h-14 sm:w-16 sm:h-16 object-contain drop-shadow-[0_0_15px_rgba(0,158,66,0.15)] relative z-10"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {/* Robot and Plan Details */}
                    <div className="space-y-0.5 relative z-10">
                      <h3 className="text-xs sm:text-sm font-extrabold text-white tracking-tight uppercase">
                        {getRobotForPlan(selectedPlan.id).name} Trading Engine
                      </h3>
                    </div>
                  </div>
                </div>
 
                {/* Horizontal Slim Cards spanning full width */}
                <div className="flex flex-col gap-2.5">
                  <SummaryItem label="Daily Yield Rate" value={`${((selectedPlan.weekday_roi || selectedPlan.roi) * 100).toFixed(1)}%`} />
                  <SummaryItem label="Invested Amount" value={formatCurrency(confirmedAmount)} highlight />
                </div>
 
                {/* Checkbox Naked directly above button */}
                <div className="flex items-center gap-2.5 px-1 py-1">
                  <input 
                    type="checkbox" 
                    id="terms"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="accent-primary h-3.5 w-3.5 rounded border-white/10 bg-white/5 cursor-pointer shrink-0"
                  />
                  <label htmlFor="terms" className="text-[9px] sm:text-[10px] font-medium text-slate-400 leading-normal cursor-pointer select-none">
                    I Understand and Agree to the{' '}
                    <Link 
                      to="/investment-terms" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-[#009e42] underline hover:text-[#02d147] transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      CGA Trades Investment Terms
                    </Link>
                    .
                  </label>
                </div>
 
                <button 
                  disabled={!agreedToTerms}
                  onClick={() => {
                    setView('method_select');
                  }}
                  className="w-full py-4 bg-[#009e42] hover:bg-[#02d147] active:bg-[#008236] text-white font-bold uppercase tracking-[0.2em] text-[10px] rounded-xl shadow-lg shadow-[#009e42]/20 disabled:opacity-20 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
                >
                  Proceed to Payment
                </button>
             </div>
            </div>
          </motion.div>
        )}

        {view === 'method_select' && selectedPlan && (
          <motion.div
            key="method_select"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="w-full min-h-[85vh] lg:min-h-[80vh] flex flex-col items-center justify-center py-4 px-4 bg-[#07090e]"
          >
            <div className="max-w-md w-full">
              <BetaInvestmentStepIndicator 
                currentView={view} 
                isConfirmed={true} 
              />
              <div className="space-y-4">
                <button 
                  onClick={() => setView('summary')}
                  className="flex items-center gap-1.5 text-[8px] font-medium text-aura-muted hover:text-white transition-colors cursor-pointer"
                >
                  <ArrowLeft size={10} /> Back to summary
                </button>

                <div className="bg-[#11141b]/95 border border-white/10 rounded-[28px] sm:rounded-[32px] p-4 sm:p-6 md:p-8 shadow-[0_30px_60px_rgba(0,0,0,0.85)] backdrop-blur-md space-y-5 sm:space-y-6 text-white relative overflow-hidden">
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff01_1px,transparent_1px),linear-gradient(to_bottom,#ffffff01_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
                  <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#009e42]/20 to-transparent pointer-events-none" />

                  <div className="pb-2 border-b border-white/5 relative z-10">
                    <h2 className="text-xl font-black uppercase tracking-tight font-serif italic text-white">Payment Method</h2>
                    <p className="text-[10px] font-black uppercase tracking-widest text-aura-muted mt-0.5">
                      Investment Amount: <span className="text-[#009e42] font-mono">{formatCurrency(confirmedAmount)}</span>
                    </p>
                  </div>

                  <div className="space-y-3 relative z-10">
                    {isUserInNigeria ? (
                      <>
                        {/* Nigeria Option 1: Bank Transfer */}
                        <button
                          type="button"
                          onClick={() => {
                            setPaymentMethod('bank');
                            setNigeriaBankIndex(null);
                            setView('payment');
                          }}
                          className="w-full p-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-[#009e42]/50 transition-all flex items-center justify-between cursor-pointer group text-left"
                        >
                          <div className="flex items-center gap-3.5">
                            <div className="w-11 h-11 rounded-2xl bg-[#009e42]/10 border border-[#009e42]/20 flex items-center justify-center text-[#009e42] group-hover:scale-105 transition-transform">
                              <Building2 size={22} />
                            </div>
                            <div>
                              <p className="text-sm font-black uppercase tracking-wide text-white">Bank Transfer</p>
                            </div>
                          </div>
                          <ArrowRight size={16} className="text-aura-muted group-hover:text-white group-hover:translate-x-1 transition-all" />
                        </button>

                        {/* Nigeria Option 2: Crypto Payments */}
                        <button
                          type="button"
                          onClick={() => {
                            setPaymentMethod('crypto');
                            setView('payment');
                          }}
                          className="w-full p-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-[#009e42]/50 transition-all flex items-center justify-between cursor-pointer group text-left"
                        >
                          <div className="flex items-center gap-3.5">
                            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                              <Coins size={22} />
                            </div>
                            <div>
                              <p className="text-sm font-black uppercase tracking-wide text-white">Crypto Payments</p>
                            </div>
                          </div>
                          <ArrowRight size={16} className="text-aura-muted group-hover:text-white group-hover:translate-x-1 transition-all" />
                        </button>
                      </>
                    ) : (
                      <>
                        {/* Non-Nigeria Option 1: Crypto Payment */}
                        <button
                          type="button"
                          onClick={() => {
                            setPaymentMethod('crypto');
                            setView('payment');
                          }}
                          className="w-full px-3.5 py-3 sm:p-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-[#009e42]/50 transition-all flex items-center justify-between gap-2 cursor-pointer group text-left"
                        >
                          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[#009e42]/10 border border-[#009e42]/20 flex items-center justify-center text-[#009e42] group-hover:scale-105 transition-transform shrink-0">
                              <Coins className="w-4 h-4 sm:w-5 sm:h-5" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 sm:gap-2">
                                <p className="font-sans text-[11px] sm:text-xs font-bold tracking-tight text-white whitespace-nowrap leading-tight">Pay with Crypto</p>
                                <span className="px-1.5 py-0.5 rounded-full text-[7px] sm:text-[8px] font-black uppercase tracking-wider bg-[#009e42]/20 text-[#009e42] border border-[#009e42]/30 shrink-0 leading-none">INSTANT</span>
                              </div>
                              <p className="text-[9px] sm:text-[10px] text-aura-muted font-mono mt-0.5 whitespace-nowrap truncate">Bitcoin (BTC Native) & USDT (TRC20)</p>
                            </div>
                          </div>
                          <ArrowRight size={14} className="text-aura-muted group-hover:text-white group-hover:translate-x-1 transition-all shrink-0" />
                        </button>

                        {/* Non-Nigeria Option 2: Request Bank Transfer Details */}
                        <a
                          href={getWhatsAppBankTransferUrl(confirmedAmount, {
                            profile,
                            user,
                            plan: selectedPlan
                          })}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full px-3.5 py-3 sm:p-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-[#009e42]/50 transition-all flex items-center justify-between gap-2 cursor-pointer group text-left"
                        >
                          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[#009e42]/10 border border-[#009e42]/20 flex items-center justify-center text-[#009e42] group-hover:scale-105 transition-transform shrink-0">
                              <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-sans text-[11px] sm:text-xs font-bold tracking-tight text-white whitespace-nowrap leading-tight">Request Bank Transfer Details</p>
                            </div>
                          </div>
                          <ArrowRight size={14} className="text-aura-muted group-hover:text-white group-hover:translate-x-1 transition-all shrink-0" />
                        </a>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {view === 'payment' && selectedPlan && (
          <motion.div
            key="payment"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="w-full min-h-[85vh] lg:min-h-[80vh] flex flex-col items-center justify-center py-4 px-4 bg-[#07090e]"
          >
            <div className="max-w-md w-full">
              <BetaInvestmentStepIndicator 
                currentView={view} 
                isConfirmed={true} 
              />
              <div className="space-y-4">
                 {!(paymentMethod === 'bank' && isUserInNigeria) && (
                   <button 
                     type="button"
                     onClick={() => setView('method_select')}
                     className="flex items-center gap-1.5 text-xs font-bold text-aura-muted hover:text-white transition-colors cursor-pointer py-1.5 px-3 rounded-xl hover:bg-white/5"
                   >
                     <ChevronLeft size={16} />
                     <span>Back</span>
                   </button>
                 )}
  
                 <div className="flex flex-col gap-4">
                    {/* Active payment method content area */}
                    {paymentMethod === 'bank' && isUserInNigeria ? (
                      <NigeriaBankTransferFlow
                        amountUsd={confirmedAmount}
                        exchangeRate={exchangeRate}
                        nigeriaBankIndex={nigeriaBankIndex}
                        onSelectBankIndex={setNigeriaBankIndex}
                        onBackToMethodSelect={() => setView('method_select')}
                        transactionReference={transactionId}
                        onTransactionReferenceChange={setTransactionId}
                        copiedField={copiedField}
                        onCopy={handleCopy}
                        amountLabel="Amount to invest:"
                      />
                    ) : (
                    <AnimatePresence mode="wait">

                      {paymentMethod === 'crypto' && (
                        <motion.div 
                          key="crypto-payment"
                          initial={{ opacity: 0, y: 10 }} 
                          animate={{ opacity: 1, y: 0 }} 
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.15 }}
                          className="space-y-4 pt-1"
                        >
                          <div className="flex gap-2">
                            {(["usdt", "btc"] as const).map(t => (
                              <button 
                                type="button"
                                key={t} 
                                onClick={() => setCryptoType(t)}
                                className={cn(
                                  "flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all cursor-pointer",
                                  cryptoType === t ? "bg-[#009e42] border-[#009e42] text-white" : "bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-600 dark:text-aura-muted hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/10"
                                )}
                              >
                                {t === 'usdt' ? 'USDT (TRC20)' : 'BTC (Native)'}
                              </button>
                            ))}
                          </div>
                          <div className="p-5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-2xl flex flex-col items-center gap-4 shadow-sm">
                            <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-200/80 dark:border-transparent">
                              <QRCodeCanvas value={CRYPTO_ADDRESSES[cryptoType]} size={110} />
                            </div>
                            <div className="w-full space-y-2.5">
                              <p className="text-[10px] text-center text-slate-700 dark:text-aura-muted uppercase tracking-widest font-black">Scan QR or Copy Address</p>
                              <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3 flex items-center justify-between gap-4 shadow-sm dark:shadow-inner">
                                <code className="text-xs font-mono text-slate-900 dark:text-white font-bold truncate">{CRYPTO_ADDRESSES[cryptoType]}</code>
                                <button 
                                  type="button"
                                  onClick={() => handleCopy(CRYPTO_ADDRESSES[cryptoType], 'wallet')} 
                                  className="text-[9px] font-black text-white bg-[#009e42] hover:bg-[#02d147] px-3 py-1.5 rounded-lg uppercase tracking-widest cursor-pointer whitespace-nowrap active:scale-95 transition-all shadow-xs"
                                >
                                  {copiedField === 'wallet' ? 'Copied' : 'Copy'}
                                </button>
                              </div>

                              {/* Warning network notifications */}
                              <div className="p-2.5 bg-amber-500/10 border border-amber-500/25 rounded-xl text-center">
                                {cryptoType === 'usdt' && (
                                  <p className="text-[9px] font-medium text-amber-600 dark:text-amber-400 leading-normal">
                                    Please send only USDT TRC-20 to this address. Transferring to any other network will result in permanent loss of your funds.
                                  </p>
                                )}
                                {cryptoType === 'btc' && (
                                  <p className="text-[9px] font-medium text-amber-600 dark:text-amber-400 leading-normal">
                                    Please send only Bitcoin (BTC) to this address. Transferring to any other network will result in permanent loss of your funds.
                                  </p>
                                )}
                              </div>

                              <div className="text-center pt-1">
                                <span className="text-[9px] text-slate-500 dark:text-aura-muted uppercase tracking-widest font-black block mb-1">Amount to invest</span>
                                <span className="text-sm font-black text-[#009e42] font-mono">{formatCurrency(confirmedAmount)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <input 
                              type="text"
                              value={transactionId}
                              onChange={(e) => setTransactionId(e.target.value)}
                              placeholder="Input Transaction ID / Sender Address"
                              className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3 text-xs font-mono focus:bg-white dark:focus:bg-white/10 focus:border-[#009e42] outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30"
                            />
                          </div>
                        </motion.div>
                      )}
 
                     {paymentMethod === 'wallet' && (
                       <motion.div 
                         key="wallet-payment"
                         initial={{ opacity: 0, y: 10 }} 
                         animate={{ opacity: 1, y: 0 }} 
                         exit={{ opacity: 0, y: -10 }}
                         transition={{ duration: 0.15 }}
                         className="space-y-3 pt-1"
                       >
                         <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 flex-wrap gap-1">
                           {(['funding_balance', 'available_balance', 'referral_earnings', 'reward_dollar_balance'] as const).map(w => (
                             <button 
                               type="button"
                               key={w}
                               onClick={() => setSelectedWallet(w)}
                               className={cn(
                                 "flex-1 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1 cursor-pointer",
                                 selectedWallet === w ? "bg-[#009e42] text-black font-extrabold shadow-sm" : "text-aura-muted hover:text-white"
                               )}
                             >
                               {w === 'reward_dollar_balance' ? 'Reward' : w.split('_')[0]}
                             </button>
                           ))}
                         </div>
 
                         <div className="flex items-center justify-between p-3.5 bg-white/5 border border-white/5 rounded-2xl">
                           <div>
                             <p className="text-[8px] font-black text-aura-muted uppercase tracking-widest mb-1">New Allocation</p>
                             <p className="text-xs font-black text-white italic font-serif">{formatCurrency(confirmedAmount)}</p>
                           </div>
                           {confirmedAmount <= walletBalanceToShow && (
                             <button 
                               type="button"
                               onClick={() => {
                                 const balance = walletBalanceToShow;
                                 const cleanBalance = parseFloat(balance.toFixed(2));
                                 
                                 const appropriatePlan = (effectivePlans || []).filter((p: any) => p.active_status !== false).find((p: any) => cleanBalance >= p.min && cleanBalance <= p.max);
                                 
                                 if (appropriatePlan) {
                                   if (appropriatePlan.id !== selectedPlan?.id) {
                                     setSelectedPlan(appropriatePlan);
                                     toast.success(`Plan updated to ${appropriatePlan.name} for ${formatCurrency(cleanBalance)} allocation.`);
                                   }
                                   setConfirmedAmount(cleanBalance);
                                 } else {
                                   setConfirmedAmount(cleanBalance);
                                   const activePlans = (effectivePlans || []).filter((p: any) => p.active_status !== false);
                                   if (activePlans.length > 0) {
                                     if (cleanBalance < activePlans[0].min) {
                                       toast.error(`Minimum investment is ${formatCurrency(activePlans[0].min)}`);
                                     } else if (cleanBalance > activePlans[activePlans.length - 1].max) {
                                       toast.error(`Maximum investment is ${formatCurrency(activePlans[activePlans.length - 1].max)}`);
                                     }
                                   }
                                 }
                               }}
                               className="px-3 py-1.5 bg-[#009e42]/10 hover:bg-[#009e42]/20 text-[#009e42] rounded-lg text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 border border-[#009e42]/20 cursor-pointer"
                             >
                               max
                             </button>
                           )}
                         </div>
 
                         {confirmedAmount > walletBalanceToShow && (
                           <p className="text-[9px] font-black text-red-500 uppercase tracking-widest text-center animate-pulse">insufficient</p>
                         )}
                         
                         {selectedPlan && (confirmedAmount < selectedPlan.min || confirmedAmount > selectedPlan.max) && (
                           <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                             <p className="text-[9px] font-black text-red-500 uppercase tracking-widest text-center">
                               Allocation outside {selectedPlan.name} limits ({formatCurrency(selectedPlan.min)} - {formatCurrency(selectedPlan.max)})
                             </p>
                             <div className="mt-2 grid grid-cols-1 gap-1.5">
                               {(effectivePlans || []).filter((p: any) => p.active_status !== false).map((p: any) => (
                                 confirmedAmount >= p.min && confirmedAmount <= p.max && (
                                   <button 
                                     type="button"
                                     key={p.id}
                                     onClick={() => setSelectedPlan(p)}
                                     className="w-full py-1.5 bg-red-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest cursor-pointer"
                                   >
                                     Switch to {p.name} Plan
                                   </button>
                                 )
                               ))}
                             </div>
                           </div>
                         )}
                       </motion.div>
                     )}
 
                     {paymentMethod === 'card' && (
                       <motion.div 
                         key="card-payment"
                         initial={{ opacity: 0, y: 10 }} 
                         animate={{ opacity: 1, y: 0 }} 
                         exit={{ opacity: 0, y: -10 }}
                         transition={{ duration: 0.15 }}
                         className="p-4 bg-white/5 border border-white/5 rounded-2xl text-center space-y-3"
                       >
                         <div className="mx-auto w-10 h-10 rounded-full bg-[#009e42]/10 border border-[#009e42]/20 flex items-center justify-center text-[#009e42]">
                           <CreditCard size={20} />
                         </div>
                         <div className="space-y-1">
                           <h3 className="text-sm font-black text-white uppercase tracking-wider">Card Payment</h3>
                           <p className="text-[9px] font-bold text-aura-muted uppercase tracking-widest leading-relaxed">
                             Instant settlement via card integration is currently coming soon.
                           </p>
                         </div>
                       </motion.div>
                     )}
                   </AnimatePresence>
                  )}
                 </div>
   
                 {!(paymentMethod === 'bank' && isUserInNigeria && nigeriaBankIndex === null) && (
                   <button 
                     disabled={!paymentMethod || isSubmitting || ((paymentMethod === 'bank' || paymentMethod === 'crypto') ? !transactionId : confirmedAmount > walletBalanceToShow)}
                     onClick={submitInvestment}
                     className="w-full py-3.5 bg-[#009e42] hover:bg-[#02d147] active:bg-[#008236] text-white font-black uppercase tracking-[0.25em] text-[9px] rounded-xl shadow-lg shadow-[#009e42]/20 disabled:opacity-20 transition-all cursor-pointer"
                   >
                     {(paymentMethod === 'bank' || paymentMethod === 'crypto') ? "I've paid" : 'Initialize Cycle'}
                   </button>
                 )}
   
               </div>
             </div>
          </motion.div>
        )}

        {/* PREMIUM COUNTRY SELECTION MODAL */}
        {showCountryModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 md:bg-black/80 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white dark:bg-[#11141b] border border-slate-200 dark:border-white/10 rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-6 md:p-8 border-b border-slate-100 dark:border-white/5 flex items-start justify-between">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-[9px] font-black text-primary uppercase tracking-widest leading-none">
                    Security Protocol
                  </div>
                  <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white italic font-serif leading-tight">
                    Kindly choose your country/region to help us assign an account for you.
                  </h3>
                </div>
                <button 
                  onClick={() => {
                    setSearchQuery('');
                    setShowCountryModal(false);
                  }}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 hover:text-slate-900 dark:text-aura-muted dark:hover:text-white transition-all flex-shrink-0 ml-4"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Search Bar */}
              <div className="px-6 md:px-8 pt-4 pb-2 flex-shrink-0">
                <div className="relative">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-aura-muted" />
                  <input 
                    type="text" 
                    placeholder="Search countries..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-3.5 pl-11 pr-5 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-primary/50 transition-colors font-sans placeholder:text-slate-400 dark:placeholder:text-gray-500"
                  />
                </div>
              </div>

              {/* Grid Content */}
              <div className="flex-1 p-6 md:p-8 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[45vh]">
                {COUNTRIES.filter(c => 
                  c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                  c.code.toLowerCase().includes(searchQuery.toLowerCase())
                ).map((c) => {
                  const isDetected = detectedCountry && (
                    c.name.toLowerCase() === detectedCountry.toLowerCase() || 
                    c.code.toLowerCase() === detectedCountry.toLowerCase()
                  );
                  return (
                    <button
                      key={c.code}
                      onClick={() => {
                        const matches = detectedCountry ? (
                          c.name.toLowerCase() === detectedCountry.toLowerCase() || 
                          c.code.toLowerCase() === detectedCountry.toLowerCase()
                        ) : true;
                        
                        setSearchQuery('');
                        if (!matches) {
                          setShowCountryModal(false);
                          setNotSupportedCountry(c.name);
                        } else {
                          setSelectedCountry(c.name);
                          setShowCountryModal(false);
                          setView('payment');
                          if (c.name !== 'Nigeria' && paymentMethod === 'bank') {
                            setPaymentMethod(null);
                          }
                          toast.success(`Assigned instant local institutional settlement route for ${c.name}.`);
                        }
                      }}
                      className={cn(
                        "p-4 rounded-2xl border flex flex-row items-center justify-start text-left gap-3.5 transition-all duration-300 group relative overflow-hidden w-full",
                        isDetected 
                          ? "bg-primary/[0.03] border-primary/40 hover:border-primary hover:bg-primary/[0.06] shadow-[0_0_15px_rgba(234,179,8,0.05)]"
                          : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/15 hover:bg-slate-100 dark:hover:bg-white/[0.08]"
                      )}
                    >
                      {isDetected && (
                        <div className="absolute top-1.5 right-1.5 flex h-1.5 w-1.5 items-center justify-center">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#009e42]"></span>
                        </div>
                      )}
                      
                      <span className="text-2xl md:text-3xl filter drop-shadow-md select-none transform group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                        {c.flag}
                      </span>
                      
                      <div className="space-y-0.5 min-w-0 pr-1 flex-1">
                        <p className={cn(
                          "text-[10px] md:text-[11px] font-black uppercase tracking-widest truncate",
                          isDetected ? "text-primary" : "text-slate-900 dark:text-white/95"
                        )}>
                          {c.name}
                        </p>
                        <p className="text-[7px] md:text-[8px] font-black text-slate-500 dark:text-aura-muted uppercase tracking-[0.12em] truncate">
                          {isDetected ? 'Highly matching node' : 'Alternate region'}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Footer Statement */}
              <div className="p-6 bg-slate-50/50 dark:bg-white/[0.02] border-t border-slate-100 dark:border-white/5 text-center">
                <p className="text-[8px] font-bold text-slate-500 dark:text-aura-muted uppercase tracking-[.15em] max-w-md mx-auto leading-relaxed">
                  In compliance with FinCEN regulations, routing assignments are refreshed every 24 hours.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* REGION NOT SUPPORTED MODAL */}
        {notSupportedCountry && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 md:bg-black/85 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white dark:bg-[#11141b] border border-red-500/20 rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl text-center p-8 space-y-6 relative"
            >
              <div className="mx-auto w-16 h-16 rounded-full bg-red-500/10 border border-red-500/25 flex items-center justify-center text-red-500 dark:text-red-400">
                <Globe size={28} className="animate-pulse" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white italic font-serif leading-none">Region Not Supported</h3>
                <p className="text-[10px] font-bold text-red-500 dark:text-red-400 uppercase tracking-widest animate-pulse">Selected Region: {notSupportedCountry}</p>
              </div>

              <div className="space-y-4 text-xs font-semibold text-slate-600 dark:text-aura-muted leading-relaxed text-center px-4">
                <p>
                  The region you selected does not support your location.
                </p>
                <p className="text-slate-900 dark:text-white/90">
                  Kindly contact Capital Growth Alliance administration for assistance.
                </p>
              </div>

              <div className="flex flex-col gap-2.5 pt-2">
                <a 
                  href="https://t.me/cga_help" 
                  target="_blank" 
                  rel="noreferrer"
                  className="w-full py-4 bg-primary text-white font-black uppercase tracking-[0.25em] text-[10px] rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/45 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                >
                  <Send size={12} /> Contact Support
                </a>
                <button 
                  onClick={() => setNotSupportedCountry(null)}
                  className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 hover:text-slate-900 dark:text-aura-muted dark:hover:text-white font-black uppercase tracking-[0.2em] text-[9px] rounded-xl transition-all border border-slate-200 dark:border-white/5"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* CARD UNPROCESSIBLE / COMING SOON MODAL */}
        {showCardUnavailable && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 md:bg-black/80 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white dark:bg-[#11141b] border border-slate-200 dark:border-white/10 rounded-[2.5rem] w-full max-w-sm p-8 text-center space-y-6 shadow-2xl"
            >
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <CreditCard size={28} />
              </div>

              <div className="space-y-1">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white italic font-serif leading-none">Coming Soon...</h3>
              </div>

              <button 
                onClick={() => setShowCardUnavailable(false)}
                className="w-full py-4 bg-primary text-white font-black uppercase tracking-[0.25em] text-[10px] rounded-xl shadow-lg transition-all"
              >
                Okay, Proceed
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SummaryItem({ label, value, highlight }: { label: string, value: string, highlight?: boolean }) {
  return (
    <div className="py-2.5 px-4 bg-white/[0.03] border border-white/5 rounded-xl flex items-center justify-between w-full">
      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      <DynamicBalance 
        value={value} 
        containerClassName="justify-end" 
        className={cn("text-right font-bold", highlight ? "text-[#009e42]" : "text-white")}
        baseSizeMobile="text-xs"
        baseSizeDesktop="lg:text-sm"
      />
    </div>
  );
}

function PaymentOption({ 
  icon, 
  label, 
  description, 
  selected, 
  onClick,
  badge,
  badgeColor,
  isRecommended
}: { 
  icon: React.ReactNode, 
  label: string, 
  description: string, 
  selected: boolean, 
  onClick: () => void,
  badge?: string,
  badgeColor?: string,
  isRecommended?: boolean
}) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full p-4 rounded-2xl border transition-all flex items-center gap-4 text-left group relative",
        selected 
          ? "bg-primary border-primary shadow-lg shadow-primary/20" 
          : isRecommended 
            ? "bg-white/[0.04] border-emerald-500/25 hover:border-emerald-500/40 hover:bg-white/[0.06]"
            : "bg-white/5 border-white/5 hover:border-white/10"
      )}
    >
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center transition-colors shadow-inner",
        selected ? "bg-white/20 text-white" : "bg-white/5 text-aura-muted group-hover:text-white"
      )}>
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className={cn("text-[11px] font-bold uppercase tracking-widest", selected ? "text-white" : "text-white/80")}>{label}</p>
          {badge && (
            <span className={cn(
              "text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border-sm font-sans",
              selected ? "bg-white/10 text-white border-white/20" : badgeColor || "bg-white/5 text-white/50 border-white/5"
            )}>
              {badge}
            </span>
          )}
        </div>
        <p className={cn("text-[8px] font-bold uppercase tracking-tight mt-0.5", selected ? "text-white/60" : "text-aura-muted")}>{description}</p>
      </div>
      <div className={cn(
        "w-5 h-5 rounded-full border flex items-center justify-center transition-all",
        selected ? "bg-white border-white text-primary" : "border-white/10 bg-white/5"
      )}>
        {selected && <Check size={12} strokeWidth={4} />}
      </div>
    </button>
  );
}
