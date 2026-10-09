import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Zap, 
  Clock, 
  ChevronRight,
  ShieldCheck,
  Activity,
  History,
  CreditCard,
  BarChart3,
  Users,
  Settings,
  ArrowRightLeft,
  Percent,
  CheckCircle2,
  X,
  RefreshCw,
  User,
  Bot,
  Gift
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { useAuth, getRoiByAmountDynamic, calculateExpectedDailyRoi, isCipherAdmin } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, query, where, orderBy, limit, onSnapshot, doc, updateDoc, getDocs, runTransaction, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner';
import { AnimatePresence } from 'motion/react';
import TransferModal from './TransferModal';
import { TransactionTicket } from './TransactionTicket';
import { useUI } from '../contexts/UIContext';
import { useTheme } from '../contexts/ThemeContext';
import { useMode } from '../contexts/ModeContext';
import { ROIEngineStats } from './ROIEngineDisplay';
import { DynamicBalance } from './DynamicBalance';

const ROBOT_IMAGES: Record<string, string> = {
  'AI 1.8': 'https://i.imgur.com/qkFHhDR.png',
  'AI 2.0': 'https://i.imgur.com/JGTKlCJ.png',
  'AI 2.5': 'https://i.imgur.com/3DpE79P.png',
  'AI 3.0': 'https://i.imgur.com/dZqi2MZ.png',
};

const DashboardCard = React.memo(({ icon: Icon, label, value, subtext, color, highlight, action, controls }: { icon: any, label: string, value: string, subtext?: string, color: string, highlight?: boolean, action?: React.ReactNode, controls?: React.ReactNode }) => {
  const [isLight, setIsLight] = useState(() => document.documentElement.classList.contains('light'));
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsLight(document.documentElement.classList.contains('light'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const isBalanceCard = ['Funding Balance', 'Available Balance', 'Total Assets'].includes(label);

  return (
    <div 
      style={{ willChange: 'transform' }}
      className={cn(
        isBalanceCard
          ? "px-4 py-3 lg:px-5 lg:py-3.5 rounded-2xl lg:rounded-[32px] border transition-all duration-500 relative overflow-hidden group flex flex-col justify-between h-full min-h-[96px] lg:min-h-0"
          : "p-4 lg:p-6 rounded-2xl lg:rounded-[32px] border transition-all duration-500 relative overflow-hidden group flex flex-col justify-between h-full min-h-[110px] lg:min-h-0",
        highlight 
          ? (isLight 
              ? "bg-white border-emerald-500/40 text-slate-900 shadow-sm" 
              : "bg-primary border-primary text-white") 
          : (isLight 
              ? "bg-white border-slate-200 text-slate-900 shadow-sm hover:border-slate-300" 
              : "bg-[#11141b] border-white/5 text-white hover:border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.3)]")
      )}
    >
      <div className="flex justify-between items-start gap-2">
        <div className={cn(
          "p-2 lg:p-2.5 rounded-lg lg:rounded-2xl shadow-inner shrink-0", 
          highlight 
            ? (isLight ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-white/20") 
            : (isLight ? "bg-slate-100/80 border border-slate-200/50 text-slate-700" : "bg-white/5 " + color)
        )}>
          <Icon size={16} className="lg:w-5 lg:h-5" />
        </div>
        <div className="flex items-center gap-1.5 ml-auto">
          {controls}
          {action}
        </div>
      </div>
      <div className="overflow-hidden">
        <p className={cn(
          "text-[7px] lg:text-[9px] font-black tracking-[0.2em] mb-1 uppercase", 
          isLight ? "text-slate-500" : (highlight ? "text-white/70" : "text-aura-muted")
        )}>
          {label}
        </p>
        <DynamicBalance 
          value={value} 
          containerClassName="justify-start" 
          className={cn(
            "text-left font-serif italic font-black",
            isLight ? "text-slate-800" : "text-white"
          )}
          baseSizeMobile="text-lg"
          baseSizeDesktop="lg:text-2xl"
        />
        {subtext && (
          <p className={cn(
            "text-[6px] lg:text-[8px] font-bold uppercase tracking-widest mt-1", 
            isLight ? "text-slate-400" : (highlight ? "text-white/50" : "text-aura-muted")
          )}>
            {subtext}
          </p>
        )}
      </div>
    </div>
  );
});

export default function Dashboard() {
  const { user, profile, plans, expectedDailyRoi, activeInvestments: authActiveInvestments, activeInvestmentsLoaded } = useAuth();
  const { isTransferModalOpen, openTransferModal, closeTransferModal, setMrBActivationPopup, setIsWelcomeBonusDeductedPopupOpen } = useUI();
  const { isLight } = useTheme();
  const { isBeta } = useMode();
  const navigate = useNavigate();
  const location = useLocation();
  const [recentTx, setRecentTx] = useState<any[]>([]);

  // Automatically open the inactive modal when navigated here via an activation trigger
  useEffect(() => {
    if (location.state?.showInactive || location.hash === '#inactive') {
      setShowInactiveModal(true);
      // Clear navigation state to prevent annoying re-triggers upon tab-refresh
      navigate(location.pathname + (location.hash === '#inactive' ? '' : location.hash), { replace: true, state: {} });
    }
  }, [location, navigate]);

  const [investmentsLoaded, setInvestmentsLoaded] = useState<boolean>(() => {
    try {
      if (typeof window !== 'undefined' && sessionStorage.getItem('cga_investments_cache')) {
        return true;
      }
    } catch {}
    return false;
  });

  const [investments, setInvestments] = useState<any[]>(() => {
    try {
      if (typeof window !== 'undefined') {
        const cached = sessionStorage.getItem('cga_investments_cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      }
    } catch {}
    return [];
  });

  const effectiveInvestments = useMemo(() => {
    if (investments && investments.length > 0) return investments;
    if (authActiveInvestments && authActiveInvestments.length > 0) return authActiveInvestments;
    return [];
  }, [investments, authActiveInvestments]);

  const isInvestmentsAuthoritativelyKnown = investmentsLoaded || activeInvestmentsLoaded || effectiveInvestments.some((i: any) => i.status === 'active');

  const [showActiveModal, setShowActiveModal] = useState(false);
  const [showInactiveModal, setShowInactiveModal] = useState(false);
  const [isActivating, setIsActivating] = useState<string | null>(null);

  const isAutoCompound = !!(
    profile?.auto_compound_enabled &&
    profile?.auto_compound_end_date &&
    new Date(profile.auto_compound_end_date).getTime() > new Date().getTime()
  );

  const [showDurationModal, setShowDurationModal] = useState(false);
  const [isCompounding, setIsCompounding] = useState(false);
  const isCompoundingRef = useRef(false);
  const isTogglingAutoCompoundRef = useRef(false);

  const handleToggleAutoCompound = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!user || isTogglingAutoCompoundRef.current) return;
    isTogglingAutoCompoundRef.current = true;
    const willEnable = !isAutoCompound;
    try {
      const userRef = doc(db, 'users', user.uid);
      if (willEnable) {
        const now = new Date();
        const duration = profile?.auto_compound_duration || 30;
        const endDate = new Date(now.getTime() + duration * 86400000);
        await updateDoc(userRef, {
          auto_compound_enabled: true,
          auto_compound_duration: duration,
          auto_compound_start_date: now.toISOString(),
          auto_compound_end_date: endDate.toISOString(),
          auto_compound_expired: false
        });
      } else {
        await updateDoc(userRef, {
          auto_compound_enabled: false,
          auto_compound_end_date: null
        });
      }
    } catch (err) {
      toast.error("Failed to update Auto-Compound setting.");
    } finally {
      isTogglingAutoCompoundRef.current = false;
    }
  };

  const selectDuration = async (days: number) => {
    if (!user || isCompoundingRef.current) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      toast.error("Network unavailable. Please reconnect and try again.");
      setShowDurationModal(false);
      return;
    }
    setShowDurationModal(false);
    isCompoundingRef.current = true;
    setIsCompounding(true);
    const toastId = toast.loading(`Activating ${days}-day automated compounding schedule...`);
    try {
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + days * 86400000);
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        auto_compound_enabled: true,
        auto_compound_duration: days,
        auto_compound_start_date: startDate.toISOString(),
        auto_compound_end_date: endDate.toISOString(),
        auto_compound_expired: false
      });
      toast.success(`Automated compounding protocol (${days} days) active!`, { id: toastId });
    } catch (err: any) {
      toast.error(err.message || "Failed to activate compounding schedule.", { id: toastId });
    } finally {
      isCompoundingRef.current = false;
      setIsCompounding(false);
    }
  };

  const renderCompoundControls = () => (
    <div className="flex items-center gap-1.5 shrink-0 select-none">
      <button
        type="button"
        role="switch"
        aria-checked={isAutoCompound}
        title={isAutoCompound ? "Auto-Compound enabled" : "Auto-Compound disabled"}
        onClick={handleToggleAutoCompound}
        className={cn(
          "relative inline-flex h-3.5 w-6 sm:h-4 sm:w-7 shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none select-none",
          isAutoCompound 
            ? "bg-[#009e42] shadow-[0_0_8px_rgba(0,158,66,0.4)]" 
            : (isLight ? "bg-slate-300 hover:bg-slate-400" : "bg-white/20 hover:bg-white/30")
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none inline-block h-2.5 w-2.5 sm:h-3 sm:w-3 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
            isAutoCompound ? "translate-x-2.5 sm:translate-x-3" : "translate-x-0.5"
          )}
        />
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setShowDurationModal(true);
        }}
        className={cn(
          "px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer active:scale-95 border select-none shrink-0",
          isLight 
            ? "bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-[#009e42] border-slate-200 hover:border-[#009e42]/40 shadow-sm" 
            : "bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border-white/10 hover:border-[#009e42]/40"
        )}
      >
        Compound
      </button>
    </div>
  );

  const [referralStats, setReferralStats] = useState({ total: 0, active: 0 });

  const dailyYield = expectedDailyRoi;

  useEffect(() => {
    if (!user) return;
    
    // Listen to all investments for counts and yield
    const qInv = query(collection(db, 'investments'), where('user_id', '==', user.uid));
    const unsubInvestmentsList = onSnapshot(qInv, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setInvestments(list);
      setInvestmentsLoaded(true);
      try {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('cga_investments_cache', JSON.stringify(list));
        }
      } catch {}
    }, (error) => {
      console.warn("Investments list listener blocked:", error.message);
      setInvestmentsLoaded(true);
    });

    // Listen to referrals
    const qRef = query(collection(db, 'users'), where('referred_by', '==', user.uid));
    const unsubReferrals = onSnapshot(qRef, async (snap) => {
      const total = snap.size;
      const promises = snap.docs.map(async (uDoc) => {
        try {
          const invQ = query(collection(db, 'investments'), where('user_id', '==', uDoc.id), where('status', '==', 'active'), limit(1));
          const invSnap = await getDocs(invQ);
          return !invSnap.empty;
        } catch {
          return false;
        }
      });
      
      const results = await Promise.all(promises);
      const active = results.filter(r => r).length;
      setReferralStats({ total, active });
    }, (error) => {
      console.warn("Referrals listener blocked:", error.message);
    });

    // Unified tracking for combined transactions
    let currentDeposits: any[] = [];
    let currentWithdrawals: any[] = [];
    let currentTransfers: any[] = [];
    let currentMiningUpgrades: any[] = [];
    let currentInvestments: any[] = [];

    const updateCombined = () => {
      const all = [...currentDeposits, ...currentWithdrawals, ...currentTransfers, ...currentMiningUpgrades, ...currentInvestments];
      // Deduplicate by ID to prevent key collisions if the same event exists in multiple collections
      const seen = new Set();
      const unique = all.filter(item => {
        if (item.amount === 0 || item.amount === undefined || item.amount === null || isNaN(item.amount)) {
          return false;
        }
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      });
      
      const combined = unique.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      // Display recent transactions directly as requested
      setRecentTx(combined.slice(0, 4));
    };

    const unsubDeposits = onSnapshot(
      query(collection(db, 'deposits'), where('user_id', '==', user.uid), orderBy('created_at', 'desc'), limit(5)),
      (snap) => {
        currentDeposits = snap.docs.map(doc => ({ id: doc.id, type: 'deposit', ...doc.data() }));
        updateCombined();
      },
      (error) => console.warn("Deposits listener blocked:", error.message)
    );

    const unsubMining = onSnapshot(
      query(collection(db, 'mining_upgrades'), where('user_id', '==', user.uid), orderBy('created_at', 'desc'), limit(5)),
      (snap) => {
        currentMiningUpgrades = snap.docs.map(doc => ({ id: doc.id, type: 'mining_upgrade', ...doc.data() }));
        updateCombined();
      },
      (error) => console.warn("Mining upgrades listener blocked:", error.message)
    );

    const unsubWithdrawals = onSnapshot(
      query(collection(db, 'withdrawals'), where('user_id', '==', user.uid), orderBy('created_at', 'desc'), limit(5)),
      (snap) => {
        currentWithdrawals = snap.docs.map(doc => ({ id: doc.id, type: 'withdrawal', ...doc.data() }));
        updateCombined();
      },
      (error) => console.warn("Withdrawals listener blocked:", error.message)
    );

    const unsubTransfers = onSnapshot(
      query(collection(db, 'transactions'), where('user_id', '==', user.uid), orderBy('created_at', 'desc'), limit(5)),
      (snap) => {
        currentTransfers = snap.docs
          .map(doc => ({ id: doc.id, type: doc.data().type || 'transfer', ...doc.data() }))
          .filter(t => t.type !== 'withdrawal' && t.type !== 'deposit' && t.type !== 'mining_upgrade');
        updateCombined();
      },
      (error) => console.warn("Transfers listener blocked:", error.message)
    );

    const unsubInvestmentsForTx = onSnapshot(
      query(collection(db, 'investments'), where('user_id', '==', user.uid)),
      (snap) => {
        currentInvestments = snap.docs.map(doc => ({ id: doc.id, type: 'investment', ...doc.data() }));
        updateCombined();
      },
      (error) => console.warn("Investments for history blocked:", error.message)
    );

    return () => {
      unsubInvestmentsList();
      unsubReferrals();
      unsubDeposits();
      unsubMining();
      unsubWithdrawals();
      unsubTransfers();
      unsubInvestmentsForTx();
    };
  }, [user, profile]);

  const activateInvestment = async (invId: string) => {
    if (!user || !profile) return;
    if (isActivating) return;
    
    if (profile.suspended || profile.banned) {
      toast.error("Account access restricted by System Protocol.");
      return;
    }

    setIsActivating(invId);
    const path = `investments/${invId}`;
    try {
      const now = new Date().toISOString();
      let activatedPlanName = '';
      let activatedAmount = 0;

      // Ensure stable and race-condition free checking of previous investments
      const q = query(collection(db, 'investments'), where('user_id', '==', user.uid));
      const invsSnap = await getDocs(q);
      
      const userInvs = invsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const isFirstActivation = !userInvs.some((i: any) => 
        i.id !== invId && (i.status === 'active' || i.status === 'completed' || i.referral_bonus_processed === true)
      );
      const dynamicActiveCount = userInvs.filter((i: any) => i.status === 'active').length;

      await runTransaction(db, async (transaction) => {
        // --- 1. ALL READS MUST OCCUR BEFORE ANY WRITES ---
        const invRef = doc(db, 'investments', invId);
        const invSnap = await transaction.get(invRef);
        
        if (!invSnap.exists()) throw new Error("Investment document not found in system databases.");
        const invData = invSnap.data();
        
        if (invData.status !== 'inactive') throw new Error("Investment has already been activated or is in an invalid state.");

        const userRef = doc(db, 'users', user.uid);
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists()) throw new Error("User profile not found.");
        const userData = userSnap.data();

        // Read referrer doc if referral bonus applies
        const needsReferralBonus = Boolean(profile.referred_by && isFirstActivation && !invData.referral_bonus_processed);
        let referrerRef = null;
        let referrerSnap = null;
        if (needsReferralBonus && profile.referred_by) {
          referrerRef = doc(db, 'users', profile.referred_by);
          referrerSnap = await transaction.get(referrerRef);
        }

        // --- 2. IN-MEMORY COMPUTATION & DERIVATION ---
        activatedPlanName = invData.plan_name;
        activatedAmount = invData.amount;

        let fee = 50;
        let robotName = 'AI 2.0';
        const planLower = (invData.plan_name || '').toLowerCase();
        if (planLower.includes('premium')) {
          fee = 200;
          robotName = 'AI 2.5';
        } else if (planLower.includes('elite')) {
          fee = 500;
          robotName = 'AI 3.0';
        }

        const currentAvail = userData.available_balance || 0;
        const currentFund = userData.funding_balance || 0;
        
        let newAvail = currentAvail;
        let newFund = currentFund;

        if (currentAvail >= fee) {
          newAvail -= fee;
        } else if (currentFund >= fee) {
          newFund -= fee;
        } else {
          newAvail -= fee;
        }

        const updatedUnlocked = Array.from(new Set([...(userData.unlocked_robots || []), robotName]));

        const userUpdates: any = {
          active_robot: robotName,
          unlocked_robots: updatedUnlocked,
          available_balance: newAvail,
          funding_balance: newFund
        };

        // If this is the first active investment, start the ROI cycle
        if (dynamicActiveCount === 0) {
          userUpdates.roi_cycle_start = now;
        }

        // --- 3. ALL WRITES AFTER ALL READS ---
        // Write 1: Update Investment document
        transaction.update(invRef, {
          status: 'active',
          activated_at: now,
          last_sync: now,
          total_earned: 0,
          referral_bonus_processed: true
        });

        // Write 1b: Ensure completed transaction record exists in transactions history
        const txRef = doc(collection(db, 'transactions'));
        transaction.set(txRef, {
          user_id: user.uid,
          type: 'investment',
          amount: invData.amount,
          plan_name: invData.plan_name || 'Node Plan',
          status: 'completed',
          created_at: now,
          description: `${invData.plan_name || 'Node'} Investment Activated`
        });

        // Write 2: Update User document
        transaction.update(userRef, userUpdates);

        // Write 3: Referral Bonus (if applicable)
        if (needsReferralBonus && referrerRef) {
          const bonusAmount = invData.amount * 0.05;

          // Increment referrer's active referral count
          if (!referrerSnap || referrerSnap.exists()) {
            transaction.update(referrerRef, {
              active_referrals: increment(1)
            });
          }

          // Create pending claim document for User A (referrer)
          const claimRef1 = doc(collection(db, 'referral_claims'));
          transaction.set(claimRef1, {
            user_id: profile.referred_by, // User A (referrer)
            type: 'referrer',
            amount: bonusAmount,
            partner_uid: user.uid, // User B
            partner_name: profile.username || 'Partner',
            status: 'pending',
            created_at: now
          });

          const notificationRef2 = doc(collection(db, 'notifications'));
          transaction.set(notificationRef2, {
            user_id: profile.referred_by,
            sender_id: user.uid,
            title: 'Referral Reward Pending',
            message: `Your referral ${profile.username} has activated an investment. Claim your referral reward now.`,
            type: 'success',
            read: false,
            created_at: now
          });
        }
      });

      // Trigger the $15 welcome bonus deduction popup if it was first activation
      if (isFirstActivation && !profile.welcome_bonus_deducted) {
        setIsWelcomeBonusDeductedPopupOpen({
          planName: activatedPlanName,
          amount: activatedAmount
        });
      } else {
        // Trigger Mr B's activation reward popup directly
        if (setMrBActivationPopup) {
          setMrBActivationPopup({
            planName: activatedPlanName,
            amount: activatedAmount
          });
        }
      }

      toast.success("Investment Activated Successfully! ROI Engine Started.");
    } catch (error: any) {
      console.error("Activation failed:", error);
      toast.error(`Activation failed: ${error.message || String(error)}`);
    } finally {
      setIsActivating(null);
    }
  };

  const activeCount = investments.filter(i => i.status === 'active').length;
  const inactiveCount = investments.filter(i => i.status === 'inactive').length;
  const activeList = investments.filter(i => i.status === 'active');
  const inactiveList = investments.filter(i => i.status === 'inactive');

  return (
    <div className="space-y-10 pb-20">
      <AnimatePresence>
        {/* Active Modal */}
        {showActiveModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-12">
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setShowActiveModal(false)}
               className="absolute inset-0 bg-aura-black/90 backdrop-blur-xl"
            />
            <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 20 }}
               className="relative w-full max-w-4xl bg-[#0b0e14] border border-white/10 rounded-[40px] overflow-hidden shadow-2xl"
            >
               <div className="p-8 lg:p-12 border-b border-white/5 flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-black text-white italic font-serif flex items-center gap-3">
                      <Activity className="text-primary" /> Active Nodes
                    </h2>
                    <p className="text-[10px] font-black text-aura-muted uppercase tracking-[0.3em] mt-2">Performing Core Operations</p>
                  </div>
                  <button onClick={() => setShowActiveModal(false)} className="p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all">
                    <X size={20} />
                  </button>
               </div>
               
               <div className="p-8 lg:p-12 max-h-[60vh] overflow-y-auto">
                  {activeList.length === 0 ? (
                    <div className="py-20 text-center">
                       <Zap className="mx-auto text-white/5 mb-6" size={64} />
                       <p className="text-sm font-black text-aura-muted uppercase tracking-widest">No active investment</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       {activeList.map(inv => {
                         const botName = profile?.active_robot || 'Free AI Bot';
                         const botImage = profile?.active_robot && ROBOT_IMAGES[profile.active_robot] 
                           ? ROBOT_IMAGES[profile.active_robot] 
                           : 'https://i.imgur.com/swuDIvl.png';
                         return (
                           <div key={inv.id} className="p-8 bg-white/5 border border-white/5 rounded-3xl relative overflow-hidden group flex flex-col md:flex-row md:items-center justify-between gap-6">
                             <div className="space-y-4 flex-1">
                               <p className="text-[9px] font-black text-aura-muted uppercase tracking-widest mb-2">{inv.plan_name} Node</p>
                               <div className="h-10 lg:h-12 w-full">
                                <DynamicBalance 
                                    value={formatCurrency(inv.amount)} 
                                    containerClassName="justify-start"
                                    className="text-left"
                                    baseSizeMobile="text-3xl"
                                    baseSizeDesktop="lg:text-4xl"
                                />
                               </div>
                               <div className="mt-4 flex items-center gap-2">
                                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                 <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Collecting Yield</span>
                               </div>
                             </div>
                             <div className="flex flex-col items-center gap-2 p-4 bg-white/[0.02] border border-white/5 rounded-2xl min-w-[120px] self-stretch md:self-auto justify-center">
                               <img 
                                 src={botImage} 
                                 alt={botName} 
                                 className="w-12 h-12 object-contain drop-shadow-[0_0_10px_rgba(59,130,246,0.15)]"
                                 referrerPolicy="no-referrer"
                                />
                               <span className="text-[8px] font-black text-white uppercase tracking-widest text-center">{botName}</span>
                               <span className="text-[7px] font-bold text-emerald-400 uppercase tracking-widest">Active</span>
                             </div>
                           </div>
                         );
                       })}
                    </div>
                  )}
               </div>
            </motion.div>
          </div>
        )}

        {/* Inactive Modal */}
        {showInactiveModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-12">
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setShowInactiveModal(false)}
               className="absolute inset-0 bg-aura-black/90 backdrop-blur-xl"
            />
            <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 20 }}
               className="relative w-full max-w-4xl bg-[#0b0e14] border border-white/10 rounded-[40px] overflow-hidden shadow-2xl"
            >
               <div className="p-8 lg:p-12 border-b border-white/5 flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-black text-white italic font-serif flex items-center gap-3">
                      <Clock className="text-yellow-500" /> Awaiting Pulse
                    </h2>
                    <p className="text-[10px] font-black text-aura-muted uppercase tracking-[0.3em] mt-2">Investments Ready for Activation</p>
                  </div>
                  <button onClick={() => setShowInactiveModal(false)} className="p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all">
                    <X size={20} />
                  </button>
               </div>
               
               <div className="p-8 lg:p-12 max-h-[60vh] overflow-y-auto">
                  {inactiveList.length === 0 ? (
                    <div className="py-20 text-center">
                       <Clock className="mx-auto text-white/5 mb-6" size={64} />
                       <p className="text-sm font-black text-aura-muted uppercase tracking-widest">No plans to activate yet</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       {inactiveList.map(inv => {
                         const botName = 'Free AI Bot';
                         const botImage = 'https://i.imgur.com/swuDIvl.png';
                         return (
                           <div key={inv.id} className="p-8 bg-white/5 border border-white/5 rounded-3xl relative overflow-hidden group flex flex-col md:flex-row md:items-center justify-between gap-6">
                             <div className="space-y-4 flex-1">
                               <p className="text-[9px] font-black text-aura-muted uppercase tracking-widest mb-2">{inv.plan_name} Node</p>
                               <div className="h-10 lg:h-12 w-full mb-4">
                                <DynamicBalance 
                                    value={formatCurrency(inv.amount)} 
                                    containerClassName="justify-start"
                                    className="text-left"
                                    baseSizeMobile="text-3xl"
                                    baseSizeDesktop="lg:text-4xl"
                                />
                               </div>
                               <button 
                                 onClick={() => activateInvestment(inv.id)}
                                 disabled={isActivating === inv.id}
                                 className="w-full py-4 bg-primary text-white text-[9px] font-black uppercase tracking-widest rounded-xl disabled:opacity-50 transition-all shadow-lg hover:shadow-primary/20 cursor-pointer"
                               >
                                 {isActivating === inv.id ? 'Syncing...' : 'Activate Investment'}
                               </button>
                             </div>
                             <div className="flex flex-col items-center gap-2 p-4 bg-white/[0.02] border border-white/5 rounded-2xl min-w-[120px] self-stretch md:self-auto justify-center">
                               <img 
                                 src={botImage} 
                                 alt={botName} 
                                 className="w-12 h-12 object-contain opacity-60 drop-shadow-[0_0_10px_rgba(255,255,255,0.05)] animate-pulse"
                                 referrerPolicy="no-referrer"
                                />
                               <span className="text-[8px] font-black text-aura-muted uppercase tracking-widest text-center">{botName}</span>
                               <span className="text-[7px] font-bold text-yellow-500 uppercase tracking-widest">Waiting for Activation</span>
                             </div>
                           </div>
                         );
                       })}
                    </div>
                  )}
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Top Section */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex flex-wrap items-center gap-4">
           <button 
             onClick={() => navigate('/profile')}
             className="px-6 py-4 bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest text-[9px] rounded-xl flex items-center gap-2 hover:bg-white/10 transition-all"
           >
             <User size={14} /> My Profile
           </button>
           {isBeta && (
             <button 
               onClick={openTransferModal}
               className="px-6 py-4 bg-[#009e42] hover:bg-[#02d147] active:bg-[#008236] text-white font-black uppercase tracking-widest text-[9px] rounded-xl flex items-center gap-2 shadow-[0_0_20px_rgba(0,158,66,0.3)] hover:scale-105 transition-all cursor-pointer"
             >
               <ArrowRightLeft size={14} /> Transfer
             </button>
           )}
        </div>
      </header>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-6">
        <DashboardCard 
          icon={Wallet} 
          label="Funding Balance" 
          value={formatCurrency(profile?.funding_balance || 0)} 
          color="text-blue-400" 
        />
        <DashboardCard 
          icon={Activity} 
          label="Available Balance" 
          value={formatCurrency(profile?.available_balance || 0)} 
          color="text-secondary" 
          highlight 
          controls={renderCompoundControls()}
        />
        <DashboardCard 
          icon={TrendingUp} 
          label="Earnings" 
          value={formatCurrency(profile?.total_earnings || 0)} 
          color="text-purple-400" 
        />
        <DashboardCard 
          icon={Zap} 
          label="Active Nodes" 
          value={activeCount.toString()} 
          color="text-green-400" 
          subtext={`${activeList.length} Connected`}
        />
        <DashboardCard 
          icon={ShieldCheck} 
          label="Total Assets" 
          value={formatCurrency(profile?.total_invested || 0)} 
          color="text-orange-400" 
          controls={renderCompoundControls()}
          action={
            profile && !['AI 1.8', 'AI 2.0', 'AI 2.5', 'AI 3.0'].includes(profile.active_robot || '') && investments.some(i => i.status === 'active') && (profile.total_invested || 0) > 0 ? (
              <>
                <style dangerouslySetInnerHTML={{__html: `
                  @keyframes premiumPulse {
                    0%, 100% {
                      transform: scale(1);
                      box-shadow: 0 0 8px rgba(124, 58, 237, 0.4);
                    }
                    50% {
                      transform: scale(1.05);
                      box-shadow: 0 0 18px rgba(124, 58, 237, 0.7);
                    }
                  }
                  .animate-premium-pulse {
                    animation: premiumPulse 2s infinite ease-in-out;
                  }
                `}} />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/ai-marketplace');
                  }}
                  className="animate-premium-pulse relative px-2.5 py-1 text-[8px] lg:text-[9px] font-black uppercase tracking-wider rounded-full bg-primary hover:bg-[#8b5cf6] text-white cursor-pointer select-none border border-white/10 flex items-center justify-center gap-1 transition-all"
                  style={{ willChange: 'transform' }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>Upgrade</span>
                </button>
              </>
            ) : undefined
          }
        />
        <DashboardCard 
          icon={Percent} 
          label="Daily Yield" 
          value={formatCurrency(dailyYield)} 
          color="text-cyan-400" 
          subtext="Estimated 24h"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: Performance & History */}
        <div className="lg:col-span-8 space-y-10">
          
          {/* Investment Status Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button 
              onClick={() => setShowActiveModal(true)}
              className={cn(
                "p-8 border rounded-[40px] flex items-center justify-between group transition-all duration-300 text-left cursor-pointer relative overflow-hidden",
                isLight 
                  ? "bg-white border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md hover:scale-[1.01] active:scale-[0.98]" 
                  : "bg-[#12151c] border-white/5 hover:border-emerald-500/30 hover:bg-[#161a24] hover:shadow-[0_0_40px_rgba(16,185,129,0.1)] hover:scale-[1.02] active:scale-[0.98] shadow-[0_10px_40px_rgba(0,0,0,0.4)]"
              )}
            >
               <div className={cn("absolute top-0 right-0 p-1 rounded-bl-2xl", isLight ? "bg-emerald-50 text-emerald-600" : "bg-emerald-500/20 text-emerald-500")}>
                 <ArrowUpRight size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
               </div>
               <div className="relative z-10">
                  <p className={cn("text-[10px] font-black uppercase tracking-[0.2em] mb-2 flex items-center gap-2", isLight ? "text-slate-500" : "text-aura-muted")}>
                    Active Investments
                    <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                  </p>
                  <h4 className={cn("text-5xl font-black italic font-serif transition-colors", isLight ? "text-slate-900 group-hover:text-emerald-600" : "text-white group-hover:text-emerald-400")}>{activeCount}</h4>
                  <div className="mt-3 flex items-center gap-2">
                    <p className={cn("text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full", isLight ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60" : "bg-emerald-500/10 text-emerald-500")}>
                      Performing Node
                    </p>
                    <span className={cn("text-[7px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity", isLight ? "text-slate-400" : "text-white/20")}>Tap to View →</span>
                  </div>
               </div>
               <div className={cn(
                 "w-20 h-20 rounded-[32px] flex items-center justify-center transition-all duration-500 shadow-inner",
                 isLight 
                  ? "bg-emerald-50/60 text-emerald-600 border border-emerald-100 group-hover:bg-emerald-100/60" 
                  : "bg-emerald-500/5 text-emerald-500/30 group-hover:text-emerald-500 group-hover:bg-emerald-500/10"
               )}>
                  <Activity size={44} />
               </div>
            </button>
            <button 
              onClick={() => setShowInactiveModal(true)}
              className={cn(
                "p-8 border rounded-[40px] flex items-center justify-between group transition-all duration-300 text-left cursor-pointer relative overflow-hidden",
                isLight 
                  ? "bg-white border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md hover:scale-[1.01] active:scale-[0.98]" 
                  : "bg-[#12151c] border-white/5 hover:border-yellow-500/30 hover:bg-[#161a24] hover:shadow-[0_0_40px_rgba(234,179,8,0.1)] hover:scale-[1.02] active:scale-[0.98] shadow-[0_10px_40px_rgba(0,0,0,0.4)]"
              )}
            >
               <div className={cn("absolute top-0 right-0 p-1 rounded-bl-2xl", isLight ? "bg-amber-50 text-amber-600" : "bg-yellow-500/20 text-yellow-500")}>
                 <ArrowUpRight size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
               </div>
               <div className="relative z-10">
                  <p className={cn("text-[10px] font-black uppercase tracking-[0.2em] mb-2", isLight ? "text-slate-500" : "text-aura-muted")}>Inactive Investments</p>
                  <h4 className={cn("text-5xl font-black italic font-serif transition-colors", isLight ? "text-slate-900 group-hover:text-amber-600" : "text-white group-hover:text-yellow-400")}>{inactiveCount}</h4>
                  <div className="mt-3 flex items-center gap-2">
                    <p className={cn("text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full", isLight ? "bg-amber-50 text-amber-700 border border-amber-200/60" : "bg-yellow-500/10 text-yellow-500")}>
                      Ready for Pulse
                    </p>
                    <span className={cn("text-[7px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity", isLight ? "text-slate-400" : "text-white/20")}>Tap to View →</span>
                  </div>
               </div>
               <div className={cn(
                 "w-20 h-20 rounded-[32px] flex items-center justify-center transition-all duration-500 shadow-inner",
                 isLight 
                  ? "bg-amber-50/60 text-amber-600 border border-amber-100 group-hover:bg-amber-100/60" 
                  : "bg-yellow-500/5 text-yellow-500/30 group-hover:text-yellow-500 group-hover:bg-yellow-500/10"
               )}>
                  <Clock size={44} />
               </div>
            </button>
          </div>

          {/* ROI Performance Section */}
          <ROIEngineStats 
            investments={effectiveInvestments}
            profile={profile}
            user={user}
            variant="dashboard"
            isLoaded={isInvestmentsAuthoritativelyKnown}
          />

          {/* History */}
          <div id="transactions" className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h3 className={cn("text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2", isLight ? "text-slate-900" : "text-white")}>
                <History size={16} className="text-primary" /> History
              </h3>
              <button 
                onClick={() => navigate('/fund/transactions')}
                className={cn("text-[10px] font-bold uppercase tracking-widest transition-all", isLight ? "text-slate-500 hover:text-slate-900" : "text-aura-muted hover:text-aura-lime")}
              >
                View All <ChevronRight size={12} className="inline" />
              </button>
            </div>
            
            <div className={cn(
              "border rounded-[40px] overflow-hidden",
              isLight ? "bg-white border-slate-200 shadow-sm" : "bg-[#11141b] border-white/5"
            )}>
              {recentTx.length === 0 ? (
                <div className={cn("p-12 text-center text-[10px] font-bold uppercase tracking-[0.2em]", isLight ? "text-slate-400" : "text-aura-muted")}>
                  No transactions yet.
                </div>
              ) : (
                <div className="grid gap-2 p-2" id="dashboard-recent-tx-grid">
                  {recentTx.map((tx, idx) => (
                    <TransactionTicket 
                      key={`${tx.type}-${tx.id}-${idx}`}
                      tx={tx}
                      currentUserId={user?.uid ?? undefined}
                      variant="dashboard"
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right: Referrals & Extra */}
        <div className="lg:col-span-4 space-y-8">
           <button 
             onClick={() => navigate('/rewards#referral-rewards')}
             className={cn(
               "w-full relative group overflow-hidden rounded-[32px] border p-0.5 backdrop-blur-md transition-all duration-300 hover:scale-[1.01] active:scale-95",
               isLight
                ? "border-purple-200 bg-purple-50/30 hover:border-purple-300 hover:shadow-md"
                : "border-purple-500/20 bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-transparent hover:border-purple-500/40 hover:shadow-[0_20px_45px_rgba(168,85,247,0.12)]"
             )}
           >
             <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
             <div className={cn(
               "relative p-6 px-8 flex items-center justify-between rounded-[30px] border",
               isLight ? "bg-white border-slate-200/90" : "bg-[#0b0e14]/75 border border-white/5"
             )}>
                <div className="flex items-center gap-4 text-left">
                   <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
                      <Gift size={22} className="animate-pulse" />
                   </div>
                   <div>
                      <span className="text-[10px] font-bold uppercase text-purple-600 dark:text-purple-400 tracking-[0.2em] block leading-none mb-1">Earn 5% Bonus</span>
                      <h4 className={cn("text-sm font-black uppercase tracking-wider", isLight ? "text-slate-900" : "text-white")}>Referral Program</h4>
                   </div>
                </div>
                <div className={cn(
                  "w-8 h-8 rounded-full border flex items-center justify-center transition-transform group-hover:translate-x-1",
                  isLight ? "bg-slate-100 border-slate-200 text-slate-700" : "bg-white/5 border-white/10 text-white"
                )}>
                   <ChevronRight size={16} />
                </div>
             </div>
           </button>
        </div>
      </div>

      <AnimatePresence>
        {showDurationModal && (
          <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDurationModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-[2px] cursor-pointer"
            />
            <div className="flex flex-col items-center gap-5 max-w-[340px] w-full relative z-10 select-none">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ type: 'spring', duration: 0.4 }}
                className={cn(
                  "w-full rounded-2xl px-6 py-10 text-center relative overflow-hidden transition-all duration-300",
                  isLight 
                    ? "bg-white border border-slate-200 shadow-[0_15px_35px_rgba(0,0,0,0.08)]"
                    : "bg-[#050608]/80 border border-white/10 hover:border-white/20 backdrop-blur-md shadow-[0_15px_35px_rgba(0,0,0,0.5)]"
                )}
              >
                <button
                  type="button"
                  onClick={() => setShowDurationModal(false)}
                  className={cn(
                    "absolute top-3 right-3 p-1.5 rounded-full transition-colors cursor-pointer z-20",
                    isLight ? "text-slate-400 hover:text-slate-700 hover:bg-slate-100" : "text-white/40 hover:text-white hover:bg-white/10"
                  )}
                  aria-label="Close"
                >
                  <X size={14} />
                </button>

                <div className={cn(
                  "mb-4 inline-flex w-12 h-12 rounded-xl items-center justify-center text-purple-500 dark:text-purple-400 shadow-inner",
                  isLight ? "bg-purple-50 border border-purple-200" : "bg-purple-500/10 border border-purple-500/20"
                )}>
                  <Clock size={22} className="animate-pulse" />
                </div>
                
                <h3 className={cn("text-sm font-black italic uppercase tracking-wider mb-2 font-sans", isLight ? "text-slate-900" : "text-white")}>
                  Select Duration
                </h3>
                
                <p className={cn("text-[10px] leading-relaxed max-w-[240px] mx-auto mb-5 font-sans", isLight ? "text-slate-600" : "text-[#8E8A9E]")}>
                  Choose a duration for automatic daily reinvesting of your ROI earnings.
                </p>

                <div className="space-y-2 w-full">
                  {[15, 30, 90, 180, 365].map((days) => (
                    <button
                      key={days}
                      onClick={() => selectDuration(days)}
                      disabled={isCompounding}
                      className={cn(
                        "w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 group text-left cursor-pointer active:scale-[0.99] select-none touch-manipulation",
                        isLight 
                          ? "bg-slate-50 hover:bg-slate-100/80 border border-slate-200 hover:border-emerald-500/40"
                          : "bg-white/[0.015] hover:bg-white/[0.04] border border-white/5 hover:border-[#10B981]/30"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] opacity-60 group-hover:opacity-100 transition-opacity" />
                        <div>
                          <span className={cn("text-xs font-black", isLight ? "text-slate-900" : "text-white")}>{days} Days</span>
                          <p className={cn("text-[8px] mt-0.5 font-sans", isLight ? "text-slate-400" : "text-white/35")}>Continuous reinvesting protocol</p>
                        </div>
                      </div>
                      <span className="text-[9px] font-black text-emerald-500 dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform">
                        SET &rarr;
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>

              <button
                onClick={() => setShowDurationModal(false)}
                className={cn(
                  "w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.25em] transition-all duration-200 cursor-pointer italic text-center touch-manipulation",
                  isLight ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200" : "bg-white/5 hover:bg-white/10 border border-white/10 text-white"
                )}
              >
                Exit
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
