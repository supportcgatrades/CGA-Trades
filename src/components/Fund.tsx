import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PlusCircle, 
  MinusCircle, 
  History, 
  ArrowLeft, 
  Building2, 
  Bitcoin, 
  CheckCircle2, 
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  Copy,
  Check,
  Zap,
  Filter,
  RefreshCw,
  X,
  Lock,
  Unlock,
  ChevronLeft,
  ChevronDown,
  Search,
  Globe,
  Send,
  LayoutDashboard,
  Coins
} from 'lucide-react';
import { cn, formatCurrency, isWithdrawalAllowed, formatNumberWithCommas, parseFormattedNumber } from '../lib/utils';
import { QRCodeCanvas } from 'qrcode.react';
import { useAuth } from '../contexts/AuthContext';
import { useMode } from '../contexts/ModeContext';
import { getRegionalLimits } from '../utils/regionalLimits';
import { DynamicBalance } from './DynamicBalance';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  doc, 
  updateDoc,
  getDocs
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner';
import { COUNTRIES } from '../constants/countries';
import { detectUserLocation } from '../utils/geo';
import { broadcastActivity } from '../lib/activity_logger';

import SuccessModal from './SuccessModal';
import PinProtocolModal from './PinProtocolModal';
import { TransactionTicket } from './TransactionTicket';
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

const PRE_FIXED_AMOUNTS = [100, 1000, 5000, 10000, 50000, 100000];

export default function Fund() {
  const { user, profile } = useAuth();
  const { isLite, isBeta } = useMode();
  const { minDeposit } = getRegionalLimits(profile, isLite);
  const { tab } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [isRobotUpgrade, setIsRobotUpgrade] = useState<boolean>(false);
  const [robotName, setRobotName] = useState<string>('');

  // Shared UI States
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const available_balance = profile?.available_balance || 0;
  const [transactions, setTransactions] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'deposit' | 'withdrawal' | 'investment' | 'transfer'>('all');

  // Authoritative check based strictly on the user's stored/verified account country:
  const isUserInNigeria = isAccountCountryNigeria(profile);

  useEffect(() => {
    if (location.state && location.state.prefillAmount) {
      setDepositAmount(formatNumberWithCommas(String(location.state.prefillAmount)));
      setIsRobotUpgrade(location.state.isRobotUpgrade || false);
      setRobotName(location.state.robotName || '');
    }
  }, [location.state]);

  // --- DEPOSIT STATES ---
  const [depositAmount, setDepositAmount] = useState('');
  const [depositMethod, setDepositMethod] = useState<'bank' | 'crypto' | null>(null);
  const [depositCryptoType, setDepositCryptoType] = useState<'usdt' | 'btc'>('usdt');
  const [depositStep, setDepositStep] = useState<'input' | 'method' | 'payment'>('input');
  const [depositTxId, setDepositTxId] = useState('');
  const [nigeriaBankIndex, setNigeriaBankIndex] = useState<number | null>(null);
  const [exchangeRate, setExchangeRate] = useState<number>(1400);
  const [withdrawExchangeRate, setWithdrawExchangeRate] = useState<number>(1400);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDepositSuccess, setShowDepositSuccess] = useState(false);
  const [showWithdrawSuccess, setShowWithdrawSuccess] = useState(false);
  const [showPendingDepositAlert, setShowPendingDepositAlert] = useState(false);
  const [pendingDepositAmountAlert, setPendingDepositAmountAlert] = useState<number>(0);

  // --- WITHDRAW STATES ---
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawStep, setWithdrawStep] = useState<'input' | 'method'>('input');
  const [withdrawMethod, setWithdrawMethod] = useState<'bank' | 'crypto'>('crypto');
  const [bankDetails, setBankDetails] = useState({ bankName: '', accNum: '', accName: '' });
  const [cryptoDetails, setCryptoDetails] = useState({ type: 'usdt', address: '' });
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [withdrawalSystemBusy, setWithdrawalSystemBusy] = useState<boolean>(false);
  const [showSystemBusyModal, setShowSystemBusyModal] = useState<boolean>(false);

  // Updated minimum withdrawal limit to $200 per user instructions
  const withdrawalThreshold = 200;
  const withdrawalFeePercent = 20;

  useEffect(() => {
    if (!isUserInNigeria) {
      if (depositMethod === 'bank') setDepositMethod('crypto');
      if (withdrawMethod === 'bank') setWithdrawMethod('crypto');
    }
  }, [isUserInNigeria, depositMethod, withdrawMethod]);

  useEffect(() => {
    if (!user || !profile) return;
    
    const isCipher = profile.role === 'cipher';
    const isVerified = user.emailVerified || isCipher;

    if (!isVerified) return;

    let currentDeposits: any[] = [];
    let currentWithdrawals: any[] = [];
    let currentInvestments: any[] = [];
    let currentTransfers: any[] = [];
    let currentMiningUpgrades: any[] = [];

    const updateCombined = () => {
      const all = [...currentDeposits, ...currentWithdrawals, ...currentInvestments, ...currentTransfers, ...currentMiningUpgrades];
      const seen = new Set();
      const unique = all.filter(item => {
        if (item.amount === 0 || item.amount === undefined || item.amount === null || isNaN(item.amount)) {
          return false;
        }
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      });

      const combined = unique.sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setTransactions(combined);
    };

    const unsubscribeRate = onSnapshot(doc(db, 'settings', 'system'), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setExchangeRate(data.usd_to_ngn_rate || 1400);
        setWithdrawExchangeRate(data.usd_to_ngn_withdrawal_rate || data.usd_to_ngn_rate || 1400);
        setWithdrawalSystemBusy(!!data.withdrawal_system_busy);
      }
    }, (err) => console.warn("Exchange rate sync blocked:", err));

    const unsubscribeDep = onSnapshot(
      query(collection(db, 'deposits'), where('user_id', '==', user.uid), orderBy('created_at', 'desc')),
      (snap) => {
        currentDeposits = snap.docs.map(doc => ({ id: doc.id, type: 'deposit', ...doc.data() }));
        updateCombined();
      },
      (err) => console.warn("Deposits sync blocked:", err)
    );

    const unsubscribeMining = onSnapshot(
      query(collection(db, 'mining_upgrades'), where('user_id', '==', user.uid), orderBy('created_at', 'desc')),
      (snap) => {
        currentMiningUpgrades = snap.docs.map(doc => ({ id: doc.id, type: 'mining_upgrade', ...doc.data() }));
        updateCombined();
      },
      (error) => console.warn("Mining upgrades list listener blocked:", error.message)
    );

    const unsubscribeWit = onSnapshot(
      query(collection(db, 'withdrawals'), where('user_id', '==', user.uid), orderBy('created_at', 'desc')),
      (snap) => {
        currentWithdrawals = snap.docs.map(doc => ({ id: doc.id, type: 'withdrawal', ...doc.data() }));
        updateCombined();
      },
      (err) => console.warn("Withdrawals sync blocked:", err)
    );

    const unsubscribeInv = onSnapshot(
      query(collection(db, 'investments'), where('user_id', '==', user.uid), orderBy('created_at', 'desc')),
      (snap) => {
        currentInvestments = snap.docs.map(doc => ({ id: doc.id, type: 'investment', ...doc.data() }));
        updateCombined();
      },
      (err) => console.warn("Investments sync blocked:", err)
    );

    const unsubscribeTx = onSnapshot(
      query(collection(db, 'transactions'), where('user_id', '==', user.uid), orderBy('created_at', 'desc')),
      (snap) => {
        currentTransfers = snap.docs
          .map(doc => ({ id: doc.id, type: 'transfer', ...doc.data() }))
          .filter(t => t.type !== 'withdrawal' && t.type !== 'deposit' && t.type !== 'investment' && t.type !== 'mining_upgrade');
        updateCombined();
      },
      (err) => console.warn("Transfers sync blocked:", err)
    );

    return () => {
      unsubscribeRate();
      unsubscribeDep();
      unsubscribeMining();
      unsubscribeWit();
      unsubscribeInv();
      unsubscribeTx();
    };
  }, [user, profile]);

  useEffect(() => {
    if (tab === 'deposit' || !tab) {
      if (!isUserInNigeria) {
        setDepositMethod('crypto');
      }
    }
  }, [tab, isUserInNigeria]);

  const filteredTransactions = transactions.filter(tx => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'pending') return tx.status?.toLowerCase() === 'pending';
    if (activeFilter === 'deposit') return tx.type?.toLowerCase() === 'deposit';
    if (activeFilter === 'withdrawal') return tx.type?.toLowerCase() === 'withdrawal';
    if (activeFilter === 'investment') return tx.type?.toLowerCase() === 'investment' || tx.type?.toLowerCase() === 'mining_upgrade';
    if (activeFilter === 'transfer') return tx.type?.toLowerCase() === 'transfer' || tx.type?.toLowerCase() === 'ai_upgrade';
    return true;
  });

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDepositReset = () => {
    setDepositAmount('');
    setDepositMethod(null);
    setDepositTxId('');
    setDepositStep('input');
    setIsRobotUpgrade(false);
    setRobotName('');
    const backRoute = sessionStorage.getItem('lastMainRoute') || '/dashboard';
    navigate(backRoute);
  };

  const submitDeposit = async () => {
    if (!user || !profile) return;
    setIsSubmitting(true);
    try {
      const amount = parseFormattedNumber(depositAmount);
      const depositMethodValue = depositMethod || 'crypto';

      if (isNaN(amount) || amount < minDeposit) {
        toast.error(`Minimum deposit is $${minDeposit}`);
        setIsSubmitting(false);
        return;
      }

      if (depositMethodValue === 'bank' && !isUserInNigeria) {
        toast.error("Bank transfer is restricted to accounts registered in Nigeria.");
        setIsSubmitting(false);
        return;
      }
      
      if (!isRobotUpgrade) {
        // Query if there is a pending deposit of the exact same amount
        const qPending = query(
          collection(db, 'deposits'),
          where('user_id', '==', user.uid),
          where('amount', '==', amount),
          where('status', '==', 'pending')
        );
        const pendingSnap = await getDocs(qPending);
        if (!pendingSnap.empty) {
          setPendingDepositAmountAlert(amount);
          setShowPendingDepositAlert(true);
          setIsSubmitting(false);
          return;
        }
      }

      if (isRobotUpgrade) {
        const newTransaction = {
          user_id: user.uid,
          user_name: profile.name || user.email,
          type: 'ai_upgrade',
          amount,
          method: depositMethodValue,
          reference: depositTxId,
          status: 'Pending',
          created_at: new Date().toISOString(),
          robot_name: robotName,
          selected_bot: robotName,
          selectedBot: robotName,
          description: `AI Bot Upgrade — ${robotName}`
        };
        await addDoc(collection(db, 'transactions'), newTransaction);
        setShowDepositSuccess(true);
        toast.success("AI Bot Upgrade request submitted");
        
        broadcastActivity(
          profile.name || "Client",
          `Upgraded to ${robotName}`,
          `$${amount.toLocaleString()}`,
          true,
          "🤖"
        );
      } else {
        const newDeposit = {
          user_id: user.uid,
          user_name: profile.name,
          amount,
          method: depositMethodValue,
          crypto_type: depositMethodValue === 'crypto' ? depositCryptoType : null,
          bank_name: depositMethodValue === 'bank' ? (NIGERIA_BANK_ACCOUNTS[0]?.bankName + ' / ' + NIGERIA_BANK_ACCOUNTS[1]?.bankName) : null,
          reference: depositTxId,
          status: 'pending',
          created_at: new Date().toISOString()
        };
        await addDoc(collection(db, 'deposits'), newDeposit);
        
        // Save the premium countdown details in localStorage
        const startTimeValue = Date.now();
        localStorage.setItem('premium_pending_countdown', JSON.stringify({
          startTime: startTimeValue,
          amount,
          type: 'deposit',
          dismissed: false
        }));
        // Trigger layout notification
        window.dispatchEvent(new Event('premium_success_trigger'));

        setShowDepositSuccess(true);
        toast.success("Deposit request logged");
        
        broadcastActivity(
          profile.name || "Client",
          "Initiated Deposit",
          `$${amount.toLocaleString()}`,
          true,
          depositMethodValue === 'bank' ? "🏦" : "💳"
        );
      }
    } catch (error) {
       toast.error("Failed to submit request");
    } finally {
       setIsSubmitting(false);
    }
  };

  const handleWithdrawalRequest = () => {
    if (withdrawalSystemBusy) {
      setShowSystemBusyModal(true);
      return;
    }
    if (profile?.withdrawals_frozen) {
      toast.error("Withdrawal services are currently restricted for this account.");
      return;
    }
    if (withdrawMethod === 'bank') {
      if (!isUserInNigeria) {
        toast.error("Bank transfer is restricted to accounts registered in Nigeria. Please use Crypto.");
        setWithdrawMethod('crypto');
        return;
      }
      const profileName = profile?.name || '';
      if (bankDetails.accName.trim().toLowerCase() !== profileName.toLowerCase()) {
        setWithdrawError(`Account name must match profile: ${profileName}`);
        return;
      }
    }
    setShowPinModal(true);
  };

  const handleWithdrawSubmit = async (pin: string) => {
    if (!user || !profile) return;

    if (pin !== profile.transfer_pin) {
      toast.error("Invalid Transfer PIN");
      return;
    }

    setIsSubmitting(true);
    try {
      const amountRaw = parseFormattedNumber(withdrawAmount);
      const amount = Math.floor(amountRaw * 100) / 100;
      const fee = Math.floor(((amount * withdrawalFeePercent) / 100) * 100) / 100;
      const finalAmount = Math.floor((amount - fee) * 100) / 100;

      const available_balance = profile.available_balance || 0;
      if (amount > available_balance) {
         toast.error("Insufficient balance for this settlement.");
         return;
      }

      const isFullWithdrawal = Math.abs(available_balance - amount) < 0.0001;
      const deductionAmount = isFullWithdrawal ? available_balance : amount;

      const newWithdrawal = {
        user_id: user.uid,
        user_name: profile.name,
        amount: deductionAmount,
        fee,
        final_amount: finalAmount,
        method: withdrawMethod,
        details: withdrawMethod === 'bank' ? bankDetails : cryptoDetails,
        status: 'pending',
        created_at: new Date().toISOString(),
      };

      const newNotification = {
        user_id: user.uid,
        type: 'info',
        title: 'Withdrawal Pending',
        message: `Your withdrawal request for ${formatCurrency(deductionAmount)} has been logged and is undergoing review.`,
        read: false,
        created_at: new Date().toISOString(),
      };

      const { writeBatch } = await import('firebase/firestore');
      const batch = writeBatch(db);
      
      const userRef = doc(db, 'users', user.uid);
      const witRef = doc(collection(db, 'withdrawals'));
      const notifRef = doc(collection(db, 'notifications'));

      const updatedMethods = { ... (profile.withdraw_methods || {}) };
      if (withdrawMethod === 'bank') {
        updatedMethods.bank = bankDetails;
      } else {
        updatedMethods.crypto = cryptoDetails;
      }

      const { increment } = await import('firebase/firestore');
      batch.update(userRef, { 
        withdraw_methods: updatedMethods,
        available_balance: increment(-deductionAmount)
      });

      batch.set(witRef, newWithdrawal);
      batch.set(notifRef, newNotification);

      await batch.commit();
      
      setShowPinModal(false);
      setShowWithdrawSuccess(true);
      toast.success("Withdrawal request logged successfully");
      
      broadcastActivity(
        profile.name || "Client",
        "Initiated Withdrawal",
        `$${deductionAmount.toLocaleString()}`,
        false,
        "📤"
      );
    } catch (error: any) {
       console.error("WITHDRAWAL BATCH ERROR:", error);
       toast.error(`Failed to submit withdrawal: ${error?.message || 'Operation Denied'}`);
    } finally {
       setIsSubmitting(false);
    }
  };

  const handleUseSavedMethod = (type: 'bank' | 'crypto') => {
    const saved = profile?.withdraw_methods?.[type];
    if (saved) {
      if (type === 'bank') setBankDetails(saved);
      else setCryptoDetails(saved);
      toast.info(`Using saved ${type} details`);
    }
  };

  const handleWithdrawReset = () => {
    setWithdrawAmount('');
    setWithdrawStep('input');
    setWithdrawError(null);
    const backRoute = sessionStorage.getItem('lastMainRoute') || '/dashboard';
    navigate(backRoute);
  };

  const renderDepositSection = () => {
    const amountNum = parseFormattedNumber(depositAmount);
    const isBelowDepositMin = depositAmount && (amountNum < minDeposit);
    const isDepositAmountValid = depositAmount && !isNaN(amountNum) && amountNum >= minDeposit;

    if (depositStep === 'input') {
      return (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          className="max-w-lg mx-auto bg-[#11141b]/95 border border-white/10 rounded-[32px] p-6 md:p-10 shadow-[0_30px_60px_rgba(0,0,0,0.85)] backdrop-blur-md space-y-8 text-white relative overflow-hidden"
        >
          {/* Tech lines background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff01_1px,transparent_1px),linear-gradient(to_bottom,#ffffff01_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#009e42]/20 to-transparent pointer-events-none" />

          <div className="flex items-center gap-4 pb-5 border-b border-white/5 relative z-10">
            <button 
              onClick={() => {
                const backRoute = sessionStorage.getItem('lastMainRoute') || '/dashboard';
                navigate(backRoute);
              }} 
              className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 rounded-xl transition-all cursor-pointer"
            >
              <ArrowLeft size={16} className="text-white/80" />
            </button>
            <div>
              <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight font-serif italic">Fund Wallet</h2>
              <p className="text-[10px] font-black uppercase tracking-widest text-aura-muted">Enter deposit value</p>
            </div>
          </div>

          {isRobotUpgrade && (
            <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-2xl text-[10px] text-purple-400 font-bold uppercase tracking-widest text-center relative z-10">
              🤖 AI Robot Upgrade Protocol: {robotName}
            </div>
          )}

          <div className="space-y-6 relative z-10">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-aura-muted ml-2">Amount to Fund ($)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-6 flex items-center text-[#009e42] font-black text-xl">$</div>
                <input 
                  type="text" 
                  inputMode="decimal"
                  value={depositAmount}
                  onChange={(e) => {
                    const formatted = formatNumberWithCommas(e.target.value, false);
                    setDepositAmount(formatted);
                  }}
                  placeholder={minDeposit.toString()}
                  className={cn(
                    "w-full bg-black/40 border rounded-2xl py-5 pl-12 pr-6 text-xl md:text-2xl font-bold outline-none transition-all text-white font-mono",
                    isBelowDepositMin ? "border-red-500 text-red-500 focus:bg-red-500/5 shadow-[0_0_20px_rgba(239,68,68,0.1)]" : "border-white/10 focus:border-[#009e42]/50"
                  )}
                />
              </div>
              <div className="flex justify-between items-center px-2">
                <p className="text-[9px] font-bold text-aura-muted uppercase tracking-widest">
                  Minimum funding: ${minDeposit}
                </p>
                {amountNum >= minDeposit && (
                  <p className="text-[9px] font-bold text-[#009e42] uppercase tracking-widest font-mono">
                    ${amountNum.toLocaleString()}
                  </p>
                )}
              </div>
              {isBelowDepositMin && (
                <p className="text-red-500 text-[10px] font-bold uppercase text-center animate-pulse">
                  Minimum deposit is ${minDeposit}
                </p>
              )}
            </div>

            {/* Quick Prefixed Figures */}
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2.5">
                {(minDeposit === 10 ? [10, 50, 100, 1000, 5000, 10000] : PRE_FIXED_AMOUNTS).map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setDepositAmount(formatNumberWithCommas(amt))}
                    className={cn(
                      "py-3.5 rounded-xl border text-[10px] font-mono font-bold uppercase transition-all duration-300 cursor-pointer",
                      parseFormattedNumber(depositAmount) === amt
                        ? "bg-[#009e42]/20 border-[#009e42] text-[#009e42] shadow-[0_0_15px_rgba(0,158,66,0.15)]"
                        : "bg-white/5 border-white/5 text-white/60 hover:bg-white/10 hover:border-white/10"
                    )}
                  >
                    ${amt.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            disabled={!isDepositAmountValid}
            onClick={() => {
              setDepositStep('method');
            }}
            className="w-full py-5 bg-[#009e42] hover:bg-[#02d147] disabled:opacity-20 disabled:hover:bg-[#009e42] text-white font-bold text-sm rounded-2xl shadow-xl transition-all duration-300 relative z-10 cursor-pointer"
          >
            Proceed to fund
          </button>
        </motion.div>
      );
    }

    if (depositStep === 'method') {
      return (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          className="max-w-lg mx-auto bg-[#11141b]/95 border border-white/10 rounded-[32px] p-6 md:p-10 shadow-[0_30px_60px_rgba(0,0,0,0.85)] backdrop-blur-md space-y-6 text-white relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff01_1px,transparent_1px),linear-gradient(to_bottom,#ffffff01_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#009e42]/20 to-transparent pointer-events-none" />

          <div className="flex items-center gap-4 pb-5 border-b border-white/5 relative z-10">
            <button 
              onClick={() => setDepositStep('input')} 
              className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 rounded-xl transition-all cursor-pointer"
            >
              <ChevronLeft size={16} className="text-white/80" />
            </button>
            <div>
              <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight font-serif italic">Payment Method</h2>
              <p className="text-[10px] font-black uppercase tracking-widest text-aura-muted">Deposit Amount: ${parseFormattedNumber(depositAmount).toLocaleString()}</p>
            </div>
          </div>

          <div className="space-y-3 relative z-10">
            {isUserInNigeria ? (
              <>
                {/* Nigeria Option 1: Bank Transfer */}
                <button
                  type="button"
                  onClick={() => {
                    setDepositMethod('bank');
                    setNigeriaBankIndex(null);
                    setDepositStep('payment');
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
                    setDepositMethod('crypto');
                    setDepositStep('payment');
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
                {/* Non-Nigeria: Crypto Payments ONLY */}
                <button
                  type="button"
                  onClick={() => {
                    setDepositMethod('crypto');
                    setDepositStep('payment');
                  }}
                  className="w-full p-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-[#009e42]/50 transition-all flex items-center justify-between cursor-pointer group text-left"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-[#009e42]/10 border border-[#009e42]/20 flex items-center justify-center text-[#009e42] group-hover:scale-105 transition-transform">
                      <Coins size={22} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-black uppercase tracking-wide text-white">Crypto Payments</p>
                        <span className="px-2 py-0.5 rounded-full text-[8px] font-black bg-[#009e42]/20 text-[#009e42] border border-[#009e42]/30">INSTANT</span>
                      </div>
                      <p className="text-[10px] text-aura-muted font-mono mt-0.5">Bitcoin (BTC) & USDT (TRC20)</p>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-aura-muted group-hover:text-white group-hover:translate-x-1 transition-all" />
                </button>
              </>
            )}
          </div>
        </motion.div>
      );
    }

    if (depositStep === 'payment') {
      const depositAmtNum = parseFormattedNumber(depositAmount);
      const ngnEquivalent = Math.round(depositAmtNum * exchangeRate);

      if (depositMethod === 'bank' && isUserInNigeria) {
        return (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="max-w-lg mx-auto bg-[#11141b]/95 border border-white/10 rounded-[32px] p-6 md:p-8 shadow-[0_30px_60px_rgba(0,0,0,0.85)] backdrop-blur-md space-y-6 text-white relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff01_1px,transparent_1px),linear-gradient(to_bottom,#ffffff01_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
            <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#009e42]/20 to-transparent pointer-events-none" />

            <NigeriaBankTransferFlow
              amountUsd={depositAmtNum}
              exchangeRate={exchangeRate}
              nigeriaBankIndex={nigeriaBankIndex}
              onSelectBankIndex={setNigeriaBankIndex}
              onBackToMethodSelect={() => setDepositStep('method')}
              transactionReference={depositTxId}
              onTransactionReferenceChange={setDepositTxId}
              copiedField={copiedField}
              onCopy={handleCopy}
              amountLabel="Amount to Fund:"
              submitButton={
                nigeriaBankIndex !== null ? (
                  <button 
                    disabled={!depositTxId || isSubmitting}
                    onClick={submitDeposit}
                    className="w-full py-5 bg-[#009e42] hover:bg-[#02d147] disabled:opacity-20 text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl shadow-xl transition-all duration-300 relative z-10 cursor-pointer"
                  >
                    {isSubmitting ? 'Verifying Transfer...' : "I've paid"}
                  </button>
                ) : null
              }
            />
          </motion.div>
        );
      }

      // Default to Crypto Transfer
      return (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          className="max-w-lg mx-auto bg-white dark:bg-[#11141b]/95 border border-slate-200 dark:border-white/10 rounded-[32px] p-6 md:p-10 shadow-xl dark:shadow-[0_30px_60px_rgba(0,0,0,0.85)] backdrop-blur-md space-y-8 text-slate-900 dark:text-white relative overflow-hidden"
        >
          {/* Tech lines background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000005_1px,transparent_1px),linear-gradient(to_bottom,#00000005_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff01_1px,transparent_1px),linear-gradient(to_bottom,#ffffff01_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#009e42]/20 to-transparent pointer-events-none" />

          <div className="flex items-center gap-4 pb-5 border-b border-slate-100 dark:border-white/5 relative z-10">
            <button 
              onClick={() => setDepositStep('method')} 
              className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/15 rounded-xl transition-all cursor-pointer text-slate-700 dark:text-white/80"
            >
              <ChevronLeft size={16} />
            </button>
            <div>
              <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight font-serif italic text-slate-900 dark:text-white">Crypto Transfer</h2>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-aura-muted">Total amount: ${parseFormattedNumber(depositAmount).toLocaleString()}</p>
            </div>
          </div>

          <div className="space-y-6 relative z-10">
            {/* Coins filter selection - strictly USDT TRC20 and BTC Native */}
            <div className="flex gap-2">
              {(['usdt', 'btc'] as const).map(t => (
                <button 
                  key={t} 
                  onClick={() => setDepositCryptoType(t)}
                  className={cn(
                    "flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase border transition-all cursor-pointer",
                    depositCryptoType === t 
                      ? "bg-[#009e42]/10 dark:bg-[#009e42]/20 border-[#009e42] text-[#009e42] shadow-[0_0_12px_rgba(0,158,66,0.12)]" 
                      : "bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-600 dark:text-white/50 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/10"
                  )}
                >
                  {t === 'usdt' ? 'USDT (TRC20)' : 'BTC (Native)'}
                </button>
              ))}
            </div>

            <div className="p-6 bg-white dark:bg-gradient-to-b dark:from-[#009e42]/10 dark:to-[#0c0d12]/95 border border-slate-200 dark:border-[#009e42]/20 rounded-3xl flex flex-col items-center gap-5 shadow-sm dark:shadow-[0_15px_30px_rgba(0,0,0,0.5)] relative overflow-hidden backdrop-blur-md">
              <div className="hidden dark:block absolute top-0 right-0 w-24 h-24 bg-[#009e42]/5 rounded-full blur-2xl -z-10" />
              <div className="p-3.5 bg-white rounded-2xl shadow-sm border border-slate-200/90 dark:border-white/20">
                <QRCodeCanvas value={CRYPTO_ADDRESSES[depositCryptoType]} size={120} />
              </div>
              <div className="w-full space-y-2.5">
                <p className="text-[10px] text-center text-slate-700 dark:text-aura-muted uppercase tracking-widest font-black">Scan QR or Copy Address</p>
                <div className="bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3.5 flex items-center justify-between gap-3 overflow-hidden shadow-sm dark:shadow-inner">
                  <code className="text-xs font-mono text-slate-900 dark:text-[#009e42] font-bold truncate tracking-wide">{CRYPTO_ADDRESSES[depositCryptoType]}</code>
                  <button 
                    onClick={() => handleCopy(CRYPTO_ADDRESSES[depositCryptoType], 'wallet')} 
                    className="flex-shrink-0 p-2 bg-white hover:bg-slate-100 dark:bg-transparent dark:hover:bg-white/5 border border-slate-200/80 dark:border-transparent rounded-xl text-slate-700 hover:text-slate-900 dark:text-aura-muted dark:hover:text-white transition-all active:scale-95 cursor-pointer shadow-xs dark:shadow-none"
                    aria-label="Copy wallet address"
                  >
                    {copiedField === 'wallet' ? <Check size={14} className="text-[#009e42]" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-aura-muted ml-2">Transaction Hash / Sender ID</label>
              <input 
                type="text"
                value={depositTxId}
                onChange={(e) => setDepositTxId(e.target.value)}
                placeholder="Input transaction details or sending wallet"
                className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-5 py-4 text-sm font-mono focus:border-[#009e42] outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30"
              />
            </div>
          </div>

          <button 
            disabled={!depositTxId || isSubmitting}
            onClick={submitDeposit}
            className="w-full py-5 bg-[#009e42] hover:bg-[#02d147] disabled:opacity-20 text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl shadow-xl transition-all duration-300 relative z-10 cursor-pointer"
          >
            {isSubmitting ? 'Syncing Network...' : "I've paid"}
          </button>
        </motion.div>
      );
    }

    return null;
  };

  const renderWithdrawSection = () => {
    if (!isWithdrawalAllowed()) {
      return (
        <div className="w-full min-h-[calc(100dvh-9rem)] lg:min-h-[calc(100vh-14rem)] flex items-center justify-center py-2 px-4 my-auto">
          <div className="w-full max-w-[360px] mx-auto p-6 rounded-2xl bg-[#0c0d12]/50 border border-rose-500/10 text-center space-y-4 shadow-[0_15px_30px_rgba(0,0,0,0.6)] backdrop-blur-md relative overflow-hidden transition-all duration-300">
            <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-rose-500/15 to-transparent" />
            <div className="w-12 h-12 mx-auto bg-rose-500/5 border border-rose-500/15 rounded-full flex items-center justify-center text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.08)] relative">
              <Lock size={20} className="animate-pulse" />
              <div className="absolute inset-0 rounded-full bg-rose-500/5 animate-ping opacity-10" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white tracking-wide font-sans">Portal Closed</h3>
              <p className="text-[9px] font-black text-rose-400 py-0.5 px-2 bg-rose-500/5 rounded-full border border-rose-500/10 inline-block">
                Service temporarily closed
              </p>
            </div>
            <p className="text-[11px] text-white/50 leading-relaxed font-medium">
              Withdrawals are currently unavailable. Withdrawal window reopens Monday 9:00 AM GMT+1.
            </p>
            <div className="pt-2 border-t border-white/[0.04] space-y-3">
              <div className="text-[9px] font-semibold text-white/30 tracking-wide">
                Operational window: Mon 9:00 AM – Fri 4:00 PM (GMT+1)
              </div>
              <button
                onClick={() => {
                  const backRoute = sessionStorage.getItem('lastMainRoute') || '/dashboard';
                  navigate(backRoute);
                }}
                className="w-full mt-2 py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/80 hover:text-white transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <ArrowLeft size={12} /> Go back
              </button>
            </div>
          </div>
        </div>
      );
    }

    const amountNum = parseFormattedNumber(withdrawAmount);
    const isFrozen = profile?.withdrawals_frozen || profile?.suspended || profile?.banned;
    const isInsufficient = withdrawAmount && (amountNum > available_balance);
    const isBelowMin = withdrawAmount && (amountNum < withdrawalThreshold);
    
    const fee = (amountNum * withdrawalFeePercent) / 100;
    const receiveAmount = amountNum - fee;

    if (withdrawStep === 'input') {
      return (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          className="max-w-lg mx-auto bg-[#11141b]/95 border border-white/10 rounded-[32px] p-6 md:p-10 shadow-[0_30px_60px_rgba(0,0,0,0.85)] backdrop-blur-md space-y-8 text-white relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff01_1px,transparent_1px),linear-gradient(to_bottom,#ffffff01_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-rose-500/20 to-transparent pointer-events-none" />

          <div className="flex items-center gap-4 pb-5 border-b border-white/5 relative z-10">
            <button 
              onClick={() => {
                const backRoute = sessionStorage.getItem('lastMainRoute') || '/dashboard';
                navigate(backRoute);
              }} 
              className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 rounded-xl transition-all cursor-pointer"
            >
              <ArrowLeft size={16} className="text-white/80" />
            </button>
            <div>
              <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight font-serif italic">Withdraw</h2>
            </div>
          </div>

          <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl text-center space-y-1 relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-aura-muted">Balance</p>
            <div className="h-10">
              <DynamicBalance 
                value={formatCurrency(available_balance)} 
                className="text-[#009e42] text-center font-serif italic font-black" 
                containerClassName="justify-center"
                baseSizeMobile="text-2xl"
                baseSizeDesktop="lg:text-3xl"
              />
            </div>
          </div>

          <div className="space-y-4 relative z-10">
            <div className="relative">
              <div className={cn(
                "absolute inset-y-0 left-6 flex items-center font-bold text-xl transition-colors",
                (isInsufficient || isBelowMin || isFrozen) ? "text-red-500" : "text-[#009e42]"
              )}>$</div>
              <input 
                type="text" 
                inputMode="decimal"
                disabled={isFrozen}
                value={withdrawAmount}
                onChange={(e) => {
                  const formatted = formatNumberWithCommas(e.target.value, true);
                  setWithdrawAmount(formatted);
                }}
                placeholder="0.00"
                className={cn(
                  "w-full bg-black/40 border rounded-2xl py-5 pl-12 pr-20 text-xl md:text-2xl font-bold outline-none transition-all text-white font-mono",
                  (isInsufficient || isBelowMin || isFrozen) ? "border-red-500 text-red-500 focus:bg-red-500/5 shadow-[0_0_20px_rgba(239,68,68,0.1)]" : "border-white/10 focus:border-[#009e42]"
                )}
              />
              <button 
                type="button"
                onClick={() => setWithdrawAmount(formatNumberWithCommas(available_balance.toFixed(2), true))}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black uppercase text-emerald-400 bg-[#009e42]/10 border border-[#009e42]/20 px-3 py-1.5 rounded-xl hover:bg-[#009e42]/25 transition-all font-mono"
              >
                Max
              </button>
            </div>

            <div className="flex justify-between items-center px-2">
               <p className="text-[9px] font-bold text-aura-muted uppercase tracking-widest italic">Fee: {withdrawalFeePercent}%</p>
               {amountNum > 0 && (
                 <p className="text-[9px] font-bold text-aura-muted uppercase tracking-widest">
                   Net payout: <span className="text-[#009e42] font-black">${(receiveAmount > 0 ? receiveAmount : 0).toLocaleString()}</span>
                 </p>
               )}
            </div>

            {amountNum > 0 && (
              <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl space-y-2 mt-2 animate-fade-in text-left">
                 <div className="flex justify-between items-center text-[10px] uppercase font-bold text-aura-muted tracking-wider">
                    <span>Exchange Rate:</span>
                    <span className="text-white font-mono">₦{withdrawExchangeRate.toLocaleString()}/$</span>
                 </div>
                 <div className="flex justify-between items-center text-[10px] uppercase font-bold text-aura-muted tracking-wider">
                    <span>Equivalent Value:</span>
                    <span className="text-white font-mono">₦{(amountNum * withdrawExchangeRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                 </div>
              </div>
            )}
            
            {isInsufficient && <p className="text-red-500 text-[10px] font-bold uppercase text-center">Insufficient funds available</p>}
            {isBelowMin && <p className="text-red-500 text-[10px] font-bold uppercase text-center animate-pulse">Minimum withdrawal is ${withdrawalThreshold}</p>}
          </div>

          <button 
            disabled={!withdrawAmount || isInsufficient || isBelowMin || amountNum <= 0 || isFrozen}
            onClick={() => setWithdrawStep('method')}
            className={cn(
              "w-full py-5 text-white font-bold uppercase tracking-widest text-[10px] rounded-2xl shadow-xl transition-all cursor-pointer relative z-10",
              (isInsufficient || isBelowMin || !withdrawAmount || isFrozen) ? "bg-white/5 text-white/20 cursor-not-allowed border border-white/5" : "bg-[#009e42] hover:bg-[#02d147] active:bg-[#008236] shadow-[#009e42]/20"
            )}
          >
            {isFrozen ? 'Access Restricted' : 'Select Settlement Method'}
          </button>
        </motion.div>
      );
    }

    if (withdrawStep === 'method') {
      return (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          className="max-w-lg mx-auto bg-[#11141b]/95 border border-white/10 rounded-[32px] p-6 md:p-10 shadow-[0_30px_60px_rgba(0,0,0,0.85)] backdrop-blur-md space-y-8 text-white relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff01_1px,transparent_1px),linear-gradient(to_bottom,#ffffff01_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-rose-500/20 to-transparent pointer-events-none" />

          <div className="flex items-center gap-4 pb-5 border-b border-white/5 relative z-10">
            <button 
              onClick={() => setWithdrawStep('input')} 
              className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 rounded-xl transition-all cursor-pointer"
            >
              <ChevronLeft size={16} className="text-white/80" />
            </button>
            <div>
              <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight font-serif italic">Settlement Destination</h2>
              <p className="text-[10px] font-black uppercase tracking-widest text-aura-muted">Destination parameters for ${amountNum.toLocaleString()}</p>
            </div>
          </div>

          <div className="bg-red-500/5 border border-red-500/10 p-5 rounded-[24px] space-y-3 relative z-10 text-[10px] font-bold uppercase tracking-wider text-aura-muted">
             <div className="flex justify-between items-center">
                <span>Requested Amount</span>
                <span className="text-sm font-bold text-white">${amountNum.toLocaleString()}</span>
             </div>
             <div className="flex justify-between items-center">
                <span>Withdrawal Fee (20%)</span>
                <span className="text-sm font-bold text-red-500">-${fee.toLocaleString()}</span>
             </div>
             <div className="pt-3 border-t border-white/5 flex justify-between items-center">
                <span className="text-white">Net Receive</span>
                <span className="text-xl font-black text-emerald-500 italic font-serif">${receiveAmount.toLocaleString()}</span>
             </div>
          </div>

          <div className="space-y-4 relative z-10">
            {profile?.withdraw_methods?.crypto && (
               <button 
                  onClick={() => handleUseSavedMethod('crypto')}
                  className="w-full flex items-center justify-between p-4 bg-[#009e42]/5 border border-[#009e42]/20 rounded-xl group hover:bg-[#009e42]/10 transition-all cursor-pointer"
               >
                  <div className="flex items-center gap-3">
                     <div className="p-2 rounded-lg bg-[#009e42]/20 text-[#009e42]"><Check size={14} /></div>
                     <div className="text-left">
                        <p className="text-[9px] font-black uppercase text-white">Use Saved Crypto Wallet</p>
                        <p className="text-[8px] font-bold text-aura-muted uppercase font-mono">{profile.withdraw_methods.crypto.type.toUpperCase()} • {profile.withdraw_methods.crypto.address.substring(0, 10)}...</p>
                     </div>
                  </div>
                  <ChevronRight size={14} className="text-aura-muted group-hover:text-[#009e42] transition-transform group-hover:translate-x-1" />
               </button>
            )}

            <div className="space-y-1">
              <label className="text-[10px] text-aura-muted uppercase tracking-widest ml-2">Asset Type</label>
              <select 
                value={cryptoDetails.type} 
                onChange={e => setCryptoDetails({...cryptoDetails, type: e.target.value})} 
                className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-sm outline-none focus:border-[#009e42] text-white"
              >
                <option value="usdt">USDT (TRC20)</option>
                <option value="btc">Bitcoin (Native)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-aura-muted uppercase tracking-widest ml-2">Receiving Wallet Address</label>
              <input 
                type="text" 
                value={cryptoDetails.address} 
                onChange={e => setCryptoDetails({...cryptoDetails, address: e.target.value})} 
                placeholder="Paste wallet address"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-sm outline-none focus:border-[#009e42] text-white font-mono" 
              />
            </div>
          </div>

          {withdrawError && <p className="text-red-500 text-[10px] font-bold uppercase text-center">{withdrawError}</p>}

          <button 
            disabled={!cryptoDetails.address || isSubmitting}
            onClick={handleWithdrawalRequest}
            className="w-full py-5 bg-[#009e42] hover:bg-[#02d147] active:bg-[#008236] disabled:opacity-20 text-white font-bold uppercase tracking-widest text-[10px] rounded-2xl shadow-xl transition-all duration-300 relative z-10 cursor-pointer shadow-[#009e42]/20"
          >
            {isSubmitting ? 'Authorizing...' : 'Authorize Withdrawal'}
          </button>
        </motion.div>
      );
    }

    return null;
  };

  const renderHistorySection = () => {
    return (
      <div className="max-w-4xl mx-auto space-y-6 text-white animate-fade-in">
        <div className="flex items-center gap-4 pb-6 border-b border-white/5 relative z-10">
          <button 
            onClick={() => {
              const backRoute = sessionStorage.getItem('lastMainRoute') || '/dashboard';
              navigate(backRoute);
            }} 
            className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 rounded-xl transition-all cursor-pointer"
          >
            <ArrowLeft size={16} className="text-white/80" />
          </button>
          <div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight font-serif italic">History</h2>
            <p className="text-[10px] font-black tracking-widest text-aura-muted">Track all your transactions here</p>
          </div>
        </div>

        {/* Unified premium filter row */}
        <div className="flex flex-wrap gap-1.5 bg-white/5 p-1.5 rounded-2xl border border-white/5 relative z-10">
          {[
            { id: 'all', label: 'All' },
            { id: 'pending', label: 'Pending' },
            { id: 'deposit', label: 'Deposits' },
            { id: 'withdrawal', label: 'Withdrawals' },
            { id: 'investment', label: 'Investments' },
            ...(isBeta ? [{ id: 'transfer', label: 'Transfers' }] : [])
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id as any)}
              className={cn(
                "flex-1 min-w-[75px] py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 cursor-pointer text-center",
                activeFilter === f.id
                  ? "bg-[#009e42] text-white shadow-lg shadow-[#009e42]/20"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* List of transactions */}
        <div className="relative z-10">
          {filteredTransactions.length === 0 ? (
            <div className="p-20 text-center border-2 border-dashed border-white/5 rounded-[40px] bg-[#11141b]/30">
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <History size={32} className="text-white/10" />
              </div>
              <p className="text-aura-muted text-[10px] font-black uppercase tracking-[0.2em]">No matching transactions found</p>
            </div>
          ) : (
            <div className="grid gap-3" id="fund-tx-grid">
              {filteredTransactions.map((tx, idx) => (
                <TransactionTicket 
                  key={`${tx.type}-${tx.id}-${idx}`}
                  tx={tx}
                  currentUserId={user?.uid ?? undefined}
                  variant="fund"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const isClosedWithdrawal = tab === 'withdraw' && !isWithdrawalAllowed();

  return (
    <div className={cn(
      isClosedWithdrawal 
        ? "flex flex-col justify-center items-center py-2 lg:py-8 min-h-[calc(100dvh-8rem)] lg:min-h-[calc(100vh-12rem)]" 
        : "space-y-8 pb-20 pt-4 lg:py-8 min-h-screen"
    )}>
      <SuccessModal 
        isOpen={showDepositSuccess}
        onClose={handleDepositReset}
        title="Deposit Submitted"
        message={`Your deposit of ${formatCurrency(parseFormattedNumber(depositAmount) || 0)} has been logged. Verification sequence initiated.`}
      />
      <SuccessModal 
        isOpen={showWithdrawSuccess}
        onClose={handleWithdrawReset}
        title="Withdrawal Submitted"
        message="Your withdrawal request has been submitted successfully. Withdrawals are typically completed within 15 to 45 minutes. If processing takes longer, please contact support."
        autoClose={false}
      />

      <PinProtocolModal 
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSuccess={(pin) => {
          handleWithdrawSubmit(pin);
        }}
        isSubmitting={isSubmitting}
      />

      {/* SYSTEM BUSY MODAL */}
      <AnimatePresence>
        {showSystemBusyModal && (
          <div className="fixed inset-0 z-[1200] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSystemBusyModal(false)}
              className="absolute inset-0 bg-black/60 md:bg-black/80 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-white dark:bg-[#0a0d17]/95 border border-slate-200 dark:border-white/10 rounded-[28px] p-8 md:p-10 shadow-2xl overflow-hidden text-center backdrop-blur-xl"
            >
              <div className="absolute top-[-25%] left-[-25%] w-[60%] h-[60%] bg-red-400/10 rounded-full blur-[90px] pointer-events-none" />
              <div className="absolute bottom-[-25%] right-[-25%] w-[60%] h-[60%] bg-red-400/10 rounded-full blur-[90px] pointer-events-none" />

              <div className="relative space-y-6">
                <div className="space-y-3">
                  <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight italic font-serif text-slate-900 dark:text-white">
                    System Busy
                  </h3>
                  <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent mx-auto opacity-50" />
                  <p className="text-slate-600 dark:text-gray-300 text-xs md:text-sm font-medium leading-relaxed text-center px-2">
                    There are too many traffic in the system at the moment.<br/><br/>Please try again later.
                  </p>
                </div>

                <button 
                  onClick={() => setShowSystemBusyModal(false)}
                  className="w-full py-4 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-800 dark:text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-xl active:scale-98 transition-all cursor-pointer"
                >
                  OK
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* INITIAL DEPOSIT PENDING MODAL */}
      <AnimatePresence>
        {showPendingDepositAlert && (
          <div className="fixed inset-0 z-[1200] flex items-center justify-center p-6 bg-black/60 md:bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white dark:bg-[#0c0f14] border border-amber-500/20 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden text-center"
            >
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 to-yellow-500" />
              
              {/* Circular warning icon containing Amber exclamation icon */}
              <div className="relative mx-auto w-20 h-20 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(245,158,11,0.05)]">
                <span className="text-3xl text-amber-500 font-black">!</span>
              </div>

              <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
                Deposit <span className="text-amber-500">Pending</span>
              </h3>

              {/* Thin divider */}
              <div className="relative flex items-center justify-center my-4 px-12">
                <div className="w-full h-[1px] bg-slate-200 dark:bg-white/10" />
                <div className="absolute w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b]" />
              </div>

              <p className="text-sm text-slate-600 dark:text-gray-300 mb-6 font-medium leading-relaxed">
                Your initial deposit of <span className="text-slate-900 dark:text-white font-mono font-bold">{formatCurrency(pendingDepositAmountAlert)}</span> is currently under administrative review.
              </p>

              <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-left mb-6 space-y-2">
                <p className="text-xs text-slate-600 dark:text-gray-400 leading-relaxed font-sans">
                  • You cannot submit duplicate deposits of the same amount while the initial ticket is pending.
                </p>
                <p className="text-xs text-slate-600 dark:text-gray-400 leading-relaxed font-sans">
                  • To proceed, please <span className="text-amber-500 font-semibold">use a different deposit amount</span> or create an investment immediately.
                </p>
              </div>

              {/* Buttons */}
              <div className="space-y-3">
                <button 
                  onClick={() => {
                    setShowPendingDepositAlert(false);
                    setDepositStep('input');
                  }}
                  className="w-full py-4 bg-[#009e42] hover:bg-[#02d147] text-white font-extrabold uppercase tracking-wider text-xs rounded-xl transition-all shadow-[0_4px_20px_rgba(0,158,66,0.25)] active:scale-98 cursor-pointer"
                >
                  Create Different Ticket
                </button>
                <button 
                  onClick={() => setShowPendingDepositAlert(false)}
                  className="w-full py-4 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-800 dark:text-white border border-slate-200 dark:border-white/10 font-bold uppercase tracking-wider text-xs rounded-xl active:scale-98 transition-all cursor-pointer"
                >
                  Go Back
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="w-full">
        {(tab === 'deposit' || !tab) && renderDepositSection()}
        {tab === 'withdraw' && renderWithdrawSection()}
        {tab === 'transactions' && renderHistorySection()}
      </div>
    </div>
  );
}
