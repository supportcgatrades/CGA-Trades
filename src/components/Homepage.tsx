import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  Wallet, 
  Coins, 
  Bot, 
  Zap,
  Activity,
  Clock,
  X,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  BookOpen,
  Cpu,
  History,
  User,
  Layout,
  Gift,
  Bell,
  Star,
  Users,
  Info,
  HelpCircle,
  Handshake,
  Compass,
  ArrowRightLeft,
  Settings,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import Footer from './Footer';
import { useAuth, isLegacyUser } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useUI } from '../contexts/UIContext';
import { DynamicBalance } from './DynamicBalance';
import { RotatingButtonText } from './RotatingButtonText';
import { collection, query, where, onSnapshot, doc, updateDoc, runTransaction, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner';
import { broadcastActivity } from '../lib/activity_logger';

import TopInvestorsSection from './TopInvestorsSection';
import WhyChooseSection from './WhyChooseSection';
import { ROIEngineStats } from './ROIEngineDisplay';
import LiveActivityNotification from './LiveActivityNotification';
import { useMode } from '../contexts/ModeContext';
import MobilePullDownGesture from './MobilePullDownGesture';
import BetaHomeCustomizer from './BetaHomeCustomizer';

const MemoizedTopInvestorsSection = React.memo(TopInvestorsSection);
const MemoizedWhyChooseSection = React.memo(WhyChooseSection);

export default function Homepage() {
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const { mode, isLite, isBeta } = useMode();
  const { requestPopup, closePopup, activePopupId, openTransferModal } = useUI();
  const navigate = useNavigate();
  const [showBalance, setShowBalance] = useState(() => localStorage.getItem('show_homepage_balance') !== 'false');
  
  const [isLight, setIsLight] = useState(() => document.documentElement.classList.contains('light'));
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsLight(document.documentElement.classList.contains('light'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [investments, setInvestments] = useState<any[]>([]);

  useEffect(() => {
    if (!user || !profile) return;
    
    const isCipher = profile.role === 'cipher';
    const isVerified = user.emailVerified || isCipher;

    if (!isVerified) return;

    // Listen to investments to determine state
    const qInv = query(collection(db, 'investments'), where('user_id', '==', user.uid));
    const unsubInvestments = onSnapshot(qInv, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setInvestments(list);
      setInvestmentsLoaded(true);
    }, (error) => {
        console.error("Error fetching investments:", error);
        setInvestmentsLoaded(true);
    });

    return () => unsubInvestments();
  }, [user]);

  const [showCheckInPopup, setShowCheckInPopup] = useState(false);
  const [claimStatus, setClaimStatus] = useState<'idle' | 'claiming' | 'claimed'>('idle');
  const [activeSlide, setActiveSlide] = useState(0);

  const [showGreeting, setShowGreeting] = useState(false);
  const [showExploreModal, setShowExploreModal] = useState(false);

  // CGA Beta Mobile Home Screen Edit Mode Long-Press Controller
  const [isBetaHomeEditing, setIsBetaHomeEditing] = useState(false);
  const homeLongPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const homeTouchStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const homeDidTriggerLongPressRef = useRef(false);

  const cancelHomeLongPress = useCallback(() => {
    if (homeLongPressTimerRef.current) {
      clearTimeout(homeLongPressTimerRef.current);
      homeLongPressTimerRef.current = null;
    }
    homeTouchStartPosRef.current = null;
  }, []);

  const handleHomeTouchStart = useCallback((clientX: number, clientY: number, target: EventTarget | null) => {
    if (isBetaHomeEditing) return;
    if (target instanceof HTMLElement && target.closest('[data-no-longpress="true"]')) {
      return;
    }

    homeTouchStartPosRef.current = { x: clientX, y: clientY };
    homeDidTriggerLongPressRef.current = false;

    if (homeLongPressTimerRef.current) {
      clearTimeout(homeLongPressTimerRef.current);
    }

    homeLongPressTimerRef.current = setTimeout(() => {
      homeDidTriggerLongPressRef.current = true;
      setIsBetaHomeEditing(true);

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate([40, 40]);
        } catch (_) {}
      }
    }, 600);
  }, [isBetaHomeEditing]);

  const handleHomeTouchMove = useCallback((clientX: number, clientY: number) => {
    if (!homeTouchStartPosRef.current || !homeLongPressTimerRef.current) return;
    const dx = Math.abs(clientX - homeTouchStartPosRef.current.x);
    const dy = Math.abs(clientY - homeTouchStartPosRef.current.y);
    if (dx > 8 || dy > 8) {
      cancelHomeLongPress();
    }
  }, [cancelHomeLongPress]);

  const handleHomeTouchEnd = useCallback(() => {
    cancelHomeLongPress();
    if (homeDidTriggerLongPressRef.current) {
      setTimeout(() => {
        homeDidTriggerLongPressRef.current = false;
      }, 300);
    }
  }, [cancelHomeLongPress]);

  useEffect(() => {
    return () => {
      if (homeLongPressTimerRef.current) {
        clearTimeout(homeLongPressTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowGreeting(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const toTitleCase = (str: string) => {
    return str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good morning';
    if (hr < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Compound popup states
  const [investmentsLoaded, setInvestmentsLoaded] = useState(false);
  const [showCompoundPopup, setShowCompoundPopup] = useState(false);
  const [showCompoundSuccess, setShowCompoundSuccess] = useState(false);
  const [isConfirmingSkip, setIsConfirmingSkip] = useState(false);
  const [isCompounding, setIsCompounding] = useState(false);
  const [showDurationSelector, setShowDurationSelector] = useState(false);

  const localNow = new Date();
  const todayDateStr = [localNow.getFullYear(), String(localNow.getMonth() + 1).padStart(2, '0'), String(localNow.getDate()).padStart(2, '0')].join('-');

  const lastCompoundDate = profile?.withdraw_methods?.last_compound_popup_date || 
                           (user ? localStorage.getItem(`last_compound_popup_date_${user.uid}`) : '') || '';
  
  const hasActiveInvestment = investments.some(i => i.status === 'active');
  const availableBalance = profile?.available_balance || 0;
  const rewardBalance = profile?.withdraw_methods?.reward_dollar_balance ?? profile?.reward_dollar_balance ?? 0;
  const hasEligibleBalance = availableBalance >= 5 || rewardBalance >= 5;

  const shouldShowCompoundToday = !lastCompoundDate || lastCompoundDate !== todayDateStr;
  const isAutoCompoundActive = !!(
    profile?.auto_compound_enabled &&
    profile?.auto_compound_end_date &&
    new Date(profile.auto_compound_end_date).getTime() > new Date().getTime()
  );
  const isCompoundPopupEligible = user && profile && investmentsLoaded && hasActiveInvestment && shouldShowCompoundToday && hasEligibleBalance && !isAutoCompoundActive;

  // Trigger Compound Popup
  useEffect(() => {
    if (!user || !profile || !investmentsLoaded) return;

    if (isCompoundPopupEligible && !showCompoundPopup && activePopupId !== 'compound-profits') {
      const timer = setTimeout(() => {
        requestPopup(
          'compound-profits', 
          () => {
            setShowCompoundPopup(true);
            setIsConfirmingSkip(false);
          }, 
          () => {
            setShowCompoundPopup(false);
          }
        );
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [user, profile, investmentsLoaded, isCompoundPopupEligible, showCompoundPopup, activePopupId, requestPopup]);

  // Handle other popups conditional suspension
  useEffect(() => {
    if (!user || !profile || !investmentsLoaded) return;
    
    // SUSPEND daily check-in popup if compound popup is eligible, showing, or compound success popup is showing !
    if (isCompoundPopupEligible || showCompoundPopup || showCompoundSuccess) {
      return;
    }

    // Check if yesterday or today claimed in profile record
    const claimedDates = profile?.withdraw_methods?.claimed_dates || profile?.claimed_dates || [];
    const localNow = new Date();
    const todayDateStr = [localNow.getFullYear(), String(localNow.getMonth() + 1).padStart(2, '0'), String(localNow.getDate()).padStart(2, '0')].join('-');
    const alreadyClaimed = claimedDates.includes(todayDateStr);

    if (!alreadyClaimed) {
      // Show Check-In popup first (slightly delayed for a premium entry flow)
      const timer = setTimeout(() => {
        requestPopup('daily-check-in', () => setShowCheckInPopup(true), () => setShowCheckInPopup(false));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user, profile, investmentsLoaded, isCompoundPopupEligible, showCompoundPopup, requestPopup]);

  const handleDailyClaim = async () => {
    if (!user || claimStatus !== 'idle') return;
    
    setClaimStatus('claiming');
    const toastId = toast.loading("Processing atomic ledger attestation...");
    
    try {
      const nowIso = new Date().toISOString();
      const userRef = doc(db, 'users', user.uid);
      
      const localNow = new Date();
      const todayDateStr = [localNow.getFullYear(), String(localNow.getMonth() + 1).padStart(2, '0'), String(localNow.getDate()).padStart(2, '0')].join('-');
      
      const yesterdayDate = new Date(localNow);
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      const yStr = [yesterdayDate.getFullYear(), String(yesterdayDate.getMonth() + 1).padStart(2, '0'), String(yesterdayDate.getDate()).padStart(2, '0')].join('-');

      await runTransaction(db, async (transaction) => {
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists()) {
          throw new Error("Core profile record does not exist on CGA Trades protocol.");
        }

        const userData = userSnap.data();
        const existingWithdrawMethods = userData.withdraw_methods || {};
        
        // Retrieve current reward tracking state nested under withdraw_methods
        const currentStreak = existingWithdrawMethods.current_streak || 0;
        const lastCheckIn = existingWithdrawMethods.last_check_in || '';
        const claimedDatesList = existingWithdrawMethods.claimed_dates || [];
        const claimedDatesSet = new Set(claimedDatesList);

        // Check if already claimed today
        if (claimedDatesSet.has(todayDateStr)) {
          throw new Error("Safety protocol triggered: Attestation already signed for this cycle.");
        }

        const lastCheckInDateOnly = lastCheckIn ? lastCheckIn.split('T')[0] : '';

        // Calculate new streak
        let newStreak = 1;
        if (lastCheckIn) {
          if (lastCheckInDateOnly === yStr) {
            newStreak = currentStreak + 1;
          } else if (lastCheckInDateOnly === todayDateStr) {
            newStreak = currentStreak;
          } else {
            newStreak = 1;
          }
        }

        const newClaimedDates = [...claimedDatesList, todayDateStr];
        const newPointsBalance = (existingWithdrawMethods.points_balance || 0) + 1;
        const newTotalClaimedDays = (existingWithdrawMethods.total_claimed_days || 0) + 1;

        // Perform transaction write update
        transaction.update(userRef, {
          withdraw_methods: {
            ...existingWithdrawMethods,
            points_balance: newPointsBalance,
            total_claimed_days: newTotalClaimedDays,
            current_streak: newStreak,
            last_check_in: nowIso,
            claimed_dates: newClaimedDates
          }
        });

        // Write Transaction Log
        const txRef = doc(collection(db, 'transactions'));
        transaction.set(txRef, {
          user_id: user.uid,
          type: 'points_gain',
          amount: 1,
          status: 'approved',
          created_at: nowIso,
          description: 'Daily Check-In Incentive'
        });

        // Write Notification Log
        const notifRef = doc(collection(db, 'notifications'));
        transaction.set(notifRef, {
          user_id: user.uid,
          type: 'success',
          title: 'Daily Check-In Successful',
          message: 'Successfully checked in today! 1 Point has been credited to your balance.',
          read: false,
          created_at: nowIso
        });
      });

      toast.success("Successfully checked-in today! +1 TWN Point credited.", { id: toastId });
      setClaimStatus('claimed');
      
      // Automatically redirect to the consolidated token portal after a brief premium confirmation pause
      setTimeout(() => {
        closePopup('daily-check-in');
        navigate('/daily-points');
      }, 1500);

    } catch (err: any) {
      setClaimStatus('idle');
      toast.error(err.message || "Something went wrong.", { id: toastId });
    }
  };

  const handleCompoundClick = async () => {
    if (!user || isCompounding) return;

    const isAutoCompoundActive = !!(
      profile?.auto_compound_enabled &&
      profile?.auto_compound_end_date &&
      new Date(profile.auto_compound_end_date).getTime() > new Date().getTime()
    );

    if (isAutoCompoundActive) {
      setShowDurationSelector(false);
      return;
    }

    setIsCompounding(true);
    const toastId = toast.loading("Processing compounding transfer to Assets...");

    try {
      const userRef = doc(db, 'users', user.uid);
      const nowIso = new Date().toISOString();
      let transferredAmount = 0;

      await runTransaction(db, async (transaction) => {
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists()) {
          throw new Error("User profile not found.");
        }

        const userData = userSnap.data();
        const curAvailable = userData.available_balance || 0;
        const curReward = userData.withdraw_methods?.reward_dollar_balance ?? userData.reward_dollar_balance ?? 0;

        const walletsToCompound: ('available' | 'reward')[] = [];
        if (curAvailable >= 5) {
          walletsToCompound.push('available');
        }
        if (curReward >= 5) {
          walletsToCompound.push('reward');
        }

        let availableDeduction = 0;
        let rewardDeduction = 0;

        if (walletsToCompound.includes('available')) {
          availableDeduction = curAvailable;
        }
        if (walletsToCompound.includes('reward')) {
          rewardDeduction = curReward;
        }

        const totalToCompound = availableDeduction + rewardDeduction;
        if (totalToCompound <= 0) {
          throw new Error("Deduction threshold not met. Minimum amount is $5.");
        }

        transferredAmount = totalToCompound;

        const updates: any = {};
        if (availableDeduction > 0) {
          updates.available_balance = increment(-availableDeduction);
        }

        if (rewardDeduction > 0) {
          const existingWithdrawMethods = userData.withdraw_methods || {};
          const oldReward = existingWithdrawMethods.reward_dollar_balance ?? userData.reward_dollar_balance ?? 0;
          updates.withdraw_methods = {
            ...existingWithdrawMethods,
            reward_dollar_balance: oldReward - rewardDeduction
          };
        }

        updates.total_invested = increment(totalToCompound);

        const existingCompounds = userData.withdraw_methods?.compounded_amounts || userData.compounded_amounts || [];
        const newCompounds = [...existingCompounds, totalToCompound];

        const existingWithdrawMethodsUpdate = updates.withdraw_methods || userData.withdraw_methods || {};
        updates.withdraw_methods = {
          ...existingWithdrawMethodsUpdate,
          compounded_amounts: newCompounds,
          last_compound_popup_date: todayDateStr
        };

        if (userData.compounded_amounts) {
          const existingCompoundsStd = userData.compounded_amounts || [];
          updates.compounded_amounts = [...existingCompoundsStd, totalToCompound];
        }

        transaction.update(userRef, updates);

        if (availableDeduction > 0) {
          const txRef1 = doc(collection(db, 'transactions'));
          transaction.set(txRef1, {
            user_id: user.uid,
            type: 'compound',
            type_detail: 'compound_available_balance',
            amount: availableDeduction,
            status: 'approved',
            created_at: nowIso,
            description: 'Compounded Available Balance to active investment asset'
          });
        }
        if (rewardDeduction > 0) {
          const txRef2 = doc(collection(db, 'transactions'));
          transaction.set(txRef2, {
            user_id: user.uid,
            type: 'compound',
            type_detail: 'compound_reward_balance',
            amount: rewardDeduction,
            status: 'approved',
            created_at: nowIso,
            description: 'Compounded Reward Balance to active investment asset'
          });
        }

        const notifRef = doc(collection(db, 'notifications'));
        transaction.set(notifRef, {
          user_id: user.uid,
          type: 'success',
          title: 'Balance Compounded to Assets',
          message: `Your balance of ${formatCurrency(totalToCompound)} has been successfully transferred to your Asset Portfolio. Reinvestment complete.`,
          read: false,
          created_at: nowIso
        });
      });

      localStorage.setItem(`last_compound_popup_date_${user.uid}`, todayDateStr);
      toast.success(`Transferred ${formatCurrency(transferredAmount)} to Assets!`, { id: toastId });

      broadcastActivity(
        profile?.name || "Client",
        "Compounded Balance to Assets",
        `$${transferredAmount.toFixed(2)}`,
        true,
        "🔁"
      );

      setShowDurationSelector(true);
    } catch (err: any) {
      console.error("Compounding transfer failed:", err);
      toast.error(err.message || "Failed to process compounding transfer.", { id: toastId });
    } finally {
      setIsCompounding(false);
    }
  };

  const selectCompoundingDuration = async (days: number) => {
    if (!user || isCompounding) return;
    setIsCompounding(true);
    const toastId = toast.loading("Activating automated daily compounding schedule...");

    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + days);

      const userRef = doc(db, 'users', user.uid);

      await runTransaction(db, async (transaction) => {
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists()) {
          throw new Error("User profile not found.");
        }

        const updates: any = {
          auto_compound_enabled: true,
          auto_compound_duration: days,
          auto_compound_start_date: startDate.toISOString(),
          auto_compound_end_date: endDate.toISOString(),
          auto_compound_expired: false
        };

        const nowIso = new Date().toISOString();
        const notifRef = doc(collection(db, 'notifications'));
        transaction.set(notifRef, {
          user_id: user.uid,
          type: 'success',
          title: 'Automated Compounding Active',
          message: `Successfully set up ${days}-day automated compounding protocol. Daily ROI will be reinvested automatically.`,
          read: false,
          created_at: nowIso
        });

        transaction.update(userRef, updates);
      });

      toast.success(`Automated compounding protocol (${days} days) active!`, { id: toastId });
      
      closePopup('compound-profits');
      setShowDurationSelector(false);
      setShowCompoundSuccess(true);
    } catch (err: any) {
      console.error("Compounding schedule setup failed:", err);
      toast.error(err.message || "Failed to activate compounding schedule.", { id: toastId });
    } finally {
      setIsCompounding(false);
    }
  };

  const handleCancelClick = () => {
    setIsConfirmingSkip(true);
  };

  const handleSkipConfirmYes = async () => {
    try {
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const existingWithdrawMethods = profile?.withdraw_methods || {};
        await updateDoc(userRef, {
          withdraw_methods: {
            ...existingWithdrawMethods,
            last_compound_popup_date: todayDateStr
          }
        });
        localStorage.setItem(`last_compound_popup_date_${user.uid}`, todayDateStr);
      }
    } catch (e) {
      console.error("Failed to update skip tracker in DB:", e);
      if (user) localStorage.setItem(`last_compound_popup_date_${user.uid}`, todayDateStr);
    } finally {
      setIsConfirmingSkip(false);
      closePopup('compound-profits');
    }
  };

  const handleSkipConfirmNo = () => {
    setIsConfirmingSkip(false);
  };

  const activeCount = investments.filter(i => i.status === 'active').length;

  const balanceSlides = [
    {
      id: 'assets',
      name: 'Total Assets',
      value: profile?.total_invested || 0,
    },
    {
      id: 'funding',
      name: 'Funding Balance', // This is the "deposit" balance
      value: profile?.funding_balance || 0,
    },
    {
      id: 'available',
      name: 'Available Balance', // This is the "withdrawal" balance
      value: profile?.available_balance || 0,
    }
  ];

  const renderBalanceBoard = () => {
    return (
      <div className={cn(
        "relative w-full h-[155px] border rounded-[24px] overflow-hidden group select-none transition-all duration-300",
        isLight 
          ? "bg-white border-slate-200/80 shadow-[0_10px_30px_rgba(0,0,0,0.03),0_0_25px_rgba(255,255,255,0.95)]" 
          : "bg-[#0B0D13]/90 border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.9)] hover:border-[#009e42]/40 hover:shadow-[0_0_35px_rgba(0,158,66,0.06)] backdrop-blur-md"
      )}>
        {/* Background Tech Accent */}
        <div className={cn(
          "absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none",
          isLight && "bg-[linear-gradient(to_right,#00000003_1px,transparent_1px),linear-gradient(to_bottom,#00000003_1px,transparent_1px)]"
        )} />
        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#009e42]/25 to-transparent pointer-events-none" />
        
        {/* Swipeable Area */}
        <div className="w-full h-full relative p-6 flex flex-col justify-between">
          <motion.div
            key={activeSlide}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="flex-1 flex flex-col justify-between cursor-grab active:cursor-grabbing"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(e, info) => {
              const swipeThreshold = 55;
              if (info.offset.x < -swipeThreshold) {
                // Swipe Left: Next card
                setActiveSlide((prev) => Math.min(prev + 1, balanceSlides.length - 1));
              } else if (info.offset.x > swipeThreshold) {
                // Swipe Right: Previous card
                setActiveSlide((prev) => Math.max(prev - 1, 0));
              }
            }}
          >
            {/* Name of the card: very slightly smaller at the top left */}
            <div className="flex justify-between items-start">
              <div className="text-left flex items-center gap-2">
                <span className={cn(
                  "text-[10px] sm:text-xs font-black tracking-[0.2em] transition-colors uppercase",
                  isLight ? "text-slate-500" : "text-zinc-400"
                )}>
                  {balanceSlides[activeSlide].name}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const nextVal = !showBalance;
                    setShowBalance(nextVal);
                    localStorage.setItem('show_homepage_balance', String(nextVal));
                  }}
                  className="p-1 text-zinc-500 hover:text-white transition-colors"
                  title={showBalance ? "Hide balance" : "Show balance"}
                >
                  {showBalance ? <Eye size={12} /> : <EyeOff size={12} />}
                </button>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/fund/transactions');
                }}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 border rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer z-30 flex-shrink-0",
                  isLight 
                    ? "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600 hover:text-[#009e42] shadow-sm" 
                    : "bg-white/5 hover:bg-white/10 border-white/5 hover:border-[#009e42]/25 text-zinc-400 hover:text-[#009e42]"
                )}
              >
                <History size={11} />
                <span>History</span>
              </button>
            </div>

            {/* Figure: large and clear */}
            <div className="text-left mt-3">
              {showBalance ? (
                <DynamicBalance 
                  value={formatCurrency(balanceSlides[activeSlide].value)} 
                  baseSizeMobile="text-3xl"
                  baseSizeDesktop="lg:text-4xl"
                  className={cn(
                    "font-sans font-black transition-colors tracking-tight",
                    isLight ? "text-[#009e42]" : "text-white"
                  )}
                  containerClassName="justify-start"
                />
              ) : (
                <div className="w-full flex items-center justify-start min-h-[1.5em] py-1 select-none">
                  <span className={cn(
                    "text-lg lg:text-xl font-bold tracking-tight leading-none",
                    isLight ? "text-slate-400" : "text-zinc-500"
                  )}>
                    *****
                  </span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Clean Page Indicators */}
          <div className="absolute bottom-5 right-6 flex items-center gap-1.5 z-20">
            {balanceSlides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveSlide(idx)}
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-all duration-300 cursor-pointer",
                  activeSlide === idx 
                    ? "bg-[#009e42] w-4.5" 
                    : (isLight ? "bg-slate-200 hover:bg-slate-300" : "bg-white/10 hover:bg-white/25")
                )}
                aria-label={`Go to card ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    );
  };

  const exploreItems = [
    { label: 'Dashboard', path: '/dashboard', icon: Layout, betaOnly: false },
    { label: 'Invest', path: '/invest', icon: TrendingUp, betaOnly: false },
    { label: 'Fund', path: '/fund/deposit', icon: Wallet, betaOnly: false },
    { label: 'Withdraw', path: '/fund/withdraw', icon: ArrowUpRight, betaOnly: false },
    { label: 'History', path: '/fund/transactions', icon: History, betaOnly: false },
    { label: 'Reward', path: '/rewards', icon: Gift, betaOnly: false },
    { label: 'Token', path: '/token', icon: Coins, betaOnly: true },
    { label: 'Mining', path: '/mining', icon: Cpu, betaOnly: true },
    { label: 'AI', path: '/ai-marketplace', icon: Bot, betaOnly: true },
    { label: 'Referrals', path: '/referrals', icon: Users, betaOnly: false },
    { label: 'Settings', path: '/settings', icon: Settings, betaOnly: false },
    { label: 'Daily Points', path: '/daily-points', icon: Zap, betaOnly: true }
  ].filter(item => !item.betaOnly || isBeta);

  return (
    <div className="w-full flex flex-col items-center pt-0 md:pt-4 px-3 lg:px-0">
      {/* Mobile Two-Stage Pull-Down Gesture (Refresh & Mode Switch) */}
      <MobilePullDownGesture />

      {/* Live Social Proof Activity Feed - Hidden per user request */}
      {/*
      <div className="py-1 md:py-5 lg:py-7 w-full flex justify-center">
        <LiveActivityNotification />
      </div>
      */}

      {/* Main Content Sections wrapped to maintain spacing */}
      <div className="w-full flex flex-col items-center space-y-1 md:space-y-6 lg:space-y-10">
        
        {/* --- DYNAMIC GREETING: Desktop only --- */}
        {isBeta && (
          <div className="hidden md:block w-full max-w-5xl mx-auto px-1 select-none">
            <AnimatePresence>
              {showGreeting && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="text-left py-1"
                >
                  <h2 className="text-xl md:text-2xl font-bold tracking-tight">
                    <span className="text-[#009e42]">{getGreeting()}</span>, <span className={cn(isLight ? "text-[#111827]" : "text-white")}>{toTitleCase((profile?.name ? profile.name.trim().split(/\s+/)[0] : '') || 'User')}</span>
                  </h2>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* --- MOBILE LAYOUT (Stacked) --- */}
        {isBeta ? (
          <div 
            id="beta-mobile-home-container"
            className="w-full flex flex-col items-center md:hidden select-none"
            onTouchStartCapture={(e) => {
              if (e.touches.length === 1) {
                handleHomeTouchStart(e.touches[0].clientX, e.touches[0].clientY, e.target);
              } else {
                cancelHomeLongPress();
              }
            }}
            onTouchMoveCapture={(e) => {
              if (e.touches.length === 1) {
                handleHomeTouchMove(e.touches[0].clientX, e.touches[0].clientY);
              } else {
                cancelHomeLongPress();
              }
            }}
            onTouchEndCapture={handleHomeTouchEnd}
            onTouchCancelCapture={cancelHomeLongPress}
            onMouseDownCapture={(e) => {
              if (e.button === 0) {
                handleHomeTouchStart(e.clientX, e.clientY, e.target);
              }
            }}
            onMouseMoveCapture={(e) => {
              handleHomeTouchMove(e.clientX, e.clientY);
            }}
            onMouseUpCapture={handleHomeTouchEnd}
            onClickCapture={(e) => {
              if (homeDidTriggerLongPressRef.current) {
                e.preventDefault();
                e.stopPropagation();
                homeDidTriggerLongPressRef.current = false;
              }
            }}
          >
            {/* Dynamic Greeting on Mobile */}
            <div className="w-full max-w-xl mx-auto px-1 select-none">
              <AnimatePresence>
                {showGreeting && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="text-center md:text-left py-1"
                  >
                    <h2 className="text-xl md:text-2xl font-bold tracking-tight">
                      <span className="text-[#009e42]">{getGreeting()}</span>, <span className={cn(isLight ? "text-[#111827]" : "text-white")}>{toTitleCase((profile?.name ? profile.name.trim().split(/\s+/)[0] : '') || 'User')}</span>
                    </h2>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <BetaHomeCustomizer
              user={user}
              profile={profile}
              investments={investments}
              isLight={isLight}
              renderBalanceBoard={renderBalanceBoard}
              openTransferModal={openTransferModal}
              navigate={navigate}
              isEditing={isBetaHomeEditing}
              setIsEditing={setIsBetaHomeEditing}
            />
          </div>
        ) : (
          <div className="w-full flex flex-col items-center space-y-6 md:hidden">
            {/* Swipeable Balance Board */}
            <div className="w-full max-w-xl mx-auto px-1">
              {renderBalanceBoard()}
            </div>

            {/* Horizontal Button Group */}
            <div className="grid grid-cols-3 gap-3 w-full max-w-xl mx-auto px-1">
              <button
                onClick={() => navigate('/invest')}
                className={cn(
                  "flex flex-col items-center justify-center gap-1.5 py-4 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all duration-200 active:scale-95 cursor-pointer shadow-sm",
                  (isLite || isLight)
                    ? "text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 shadow-[0_4px_12px_rgba(0,0,0,0.04)]"
                    : "text-zinc-300 bg-zinc-900/80 border border-white/10 hover:border-blue-500/30 hover:text-white shadow-[0_4px_12px_rgba(0,0,0,0.3)]"
                )}
              >
                <TrendingUp size={16} className="text-blue-500" />
                <span>Invest</span>
              </button>
              <button
                onClick={() => navigate('/fund/deposit')}
                className="flex flex-col items-center justify-center gap-1.5 py-4 rounded-[20px] text-[10px] font-black uppercase tracking-widest text-white bg-[#009e42] hover:bg-[#02d147] border border-[#009e42]/20 shadow-[0_4px_15px_rgba(0,158,66,0.25)] hover:shadow-[0_4px_22px_rgba(0,158,66,0.35)] active:scale-95 transition-all duration-200 cursor-pointer"
              >
                <Wallet size={16} className="text-white" />
                <span>Fund</span>
              </button>
              <button
                onClick={() => navigate('/fund/withdraw')}
                className={cn(
                  "flex flex-col items-center justify-center gap-1.5 py-4 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all duration-200 active:scale-95 cursor-pointer shadow-sm",
                  (isLite || isLight)
                    ? "text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 shadow-[0_4px_12px_rgba(0,0,0,0.04)]"
                    : "text-zinc-300 bg-zinc-900/80 border border-white/10 hover:border-red-500/30 hover:text-white shadow-[0_4px_12px_rgba(0,0,0,0.3)]"
                )}
              >
                <ArrowUpRight size={16} className="text-red-500" />
                <span>Withdraw</span>
              </button>
            </div>

            {/* ROI Engine Stats */}
            <div className="w-full max-w-xl mx-auto px-1">
              <ROIEngineStats 
                investments={investments}
                profile={profile}
                user={user}
                variant="home"
              />
            </div>
          </div>
        )}

        {/* --- DESKTOP LAYOUT (Side-by-Side Grid & Expanded Buttons) --- */}
        <div className="hidden md:flex flex-col w-full max-w-5xl mx-auto space-y-6 lg:space-y-10">
          {/* Side-by-Side Cards */}
          <div className="grid grid-cols-2 gap-6 w-full items-stretch">
            {/* Portfolio Card */}
            <div className="w-full">
              {renderBalanceBoard()}
            </div>
            
            {/* ROI Engine Card */}
            <div className="w-full">
              <ROIEngineStats 
                investments={investments}
                profile={profile}
                user={user}
                variant="home"
              />
            </div>
          </div>

          {/* Row of Action Buttons (Desktop Only) */}
          <div className={cn("grid gap-3 w-full", isBeta ? "grid-cols-7" : "grid-cols-6")}>
            {/* INVEST */}
            <button
              onClick={() => navigate('/invest')}
              className="flex flex-col items-center justify-center gap-2 py-4 rounded-[20px] text-[9px] font-bold uppercase tracking-widest text-zinc-300 bg-zinc-900/80 border border-white/5 hover:border-blue-500/40 hover:text-white hover:bg-zinc-800/80 active:scale-95 transition-all duration-200 cursor-pointer text-center shadow-[0_4px_12px_rgba(0,0,0,0.2)]"
            >
              <TrendingUp size={14} className="text-blue-400" />
              <span>Invest</span>
            </button>

            {/* FUND */}
            <button
              onClick={() => navigate('/fund/deposit')}
              className="flex flex-col items-center justify-center gap-2 py-4 rounded-[20px] text-[9px] font-black uppercase tracking-widest text-white bg-[#009e42] hover:bg-[#02d147] border border-[#009e42]/20 hover:brightness-110 hover:shadow-[0_0_25px_rgba(0,158,66,0.3)] active:scale-95 transition-all duration-200 cursor-pointer text-center"
            >
              <Wallet size={14} className="text-white" />
              <span>Fund</span>
            </button>

            {/* WITHDRAW */}
            <button
              onClick={() => navigate('/fund/withdraw')}
              className={cn(
                "flex flex-col items-center justify-center gap-2 py-4 rounded-[20px] text-[9px] font-bold uppercase tracking-widest active:scale-95 transition-all duration-200 cursor-pointer text-center shadow-sm",
                isLight
                  ? "text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                  : "text-zinc-300 bg-zinc-900/80 border border-white/5 hover:border-red-500/40 hover:text-white hover:bg-zinc-800/80 shadow-[0_4px_12px_rgba(0,0,0,0.2)]"
              )}
            >
              <ArrowUpRight size={14} className={isLight ? "text-slate-600" : "text-red-400"} />
              <span>Withdraw</span>
            </button>

            {/* HISTORY */}
            <button
              onClick={() => navigate('/fund/transactions')}
              className={cn(
                "flex flex-col items-center justify-center gap-2 py-4 rounded-[20px] text-[9px] font-bold uppercase tracking-widest active:scale-95 transition-all duration-200 cursor-pointer text-center shadow-sm",
                isLight
                  ? "text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                  : "text-zinc-400 bg-zinc-900/40 border border-white/5 hover:bg-zinc-900/80 hover:text-white"
              )}
            >
              <History size={14} className={isLight ? "text-slate-600" : "text-zinc-500"} />
              <span>History</span>
            </button>

            {/* AI MARKETPLACE (Beta Only) */}
            {isBeta && (
              <button
                onClick={() => navigate('/ai-marketplace')}
                className={cn(
                  "flex flex-col items-center justify-center gap-2 py-4 rounded-[20px] text-[9px] font-bold uppercase tracking-widest active:scale-95 transition-all duration-200 cursor-pointer text-center shadow-sm",
                  isLight
                    ? "text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                    : "text-zinc-400 bg-zinc-900/40 border border-white/5 hover:bg-zinc-900/80 hover:text-white"
                )}
              >
                <Bot size={14} className={isLight ? "text-slate-600" : "text-purple-400"} />
                <span>AI Market</span>
              </button>
            )}

            {/* REWARD */}
            <button
              onClick={() => navigate('/rewards')}
              className={cn(
                "flex flex-col items-center justify-center gap-2 py-4 rounded-[20px] text-[9px] font-bold uppercase tracking-widest active:scale-95 transition-all duration-200 cursor-pointer text-center shadow-sm",
                isLight
                  ? "text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                  : "text-zinc-400 bg-zinc-900/40 border border-white/5 hover:bg-zinc-900/80 hover:text-white"
                )}
            >
              <Gift size={14} className={isLight ? "text-slate-600" : "text-pink-400"} />
              <span>Reward</span>
            </button>

            {/* EXPLORE */}
            <button
              onClick={() => setShowExploreModal(true)}
              className={cn(
                "flex flex-col items-center justify-center gap-2 py-4 rounded-[20px] text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all duration-200 cursor-pointer text-center",
                isLight
                  ? "text-[#009e42] bg-[#009e42]/5 border border-[#009e42]/20 hover:bg-[#009e42]/10 shadow-sm"
                  : "text-[#009e42] bg-[#009e42]/5 border border-[#009e42]/20 hover:bg-[#009e42]/10 shadow-[0_0_15px_rgba(0,158,66,0.1)]"
              )}
            >
              <Compass size={14} className={cn("animate-spin-slow", isLight ? "text-[#009e42]" : "text-[#009e42]")} />
              <span>Explore</span>
            </button>
          </div>
        </div>
      
      {/* Footer Status hidden per user request */}

      <div style={{ marginTop: '7cm' }} className="w-full">
        <MemoizedTopInvestorsSection />
      </div>
      <MemoizedWhyChooseSection />
      </div>

      {/* Daily Check-In/Claim Popup */}
      <AnimatePresence>
        {showCheckInPopup && (
          <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center p-4">
            {/* Reduced background blur - backdrop-blur-[2px] instead of heavy blur */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
              // Persist popup: backdrop clicks are ignored so it only dismisses on claim completion
            />
            
            {/* Flex column container keeping Card at top and CLAIM button below */}
            <div className="flex flex-col items-center gap-5 max-w-[260px] w-full relative z-10 select-none">
              
              {/* Premium Light, Transparent/Glassmorphic Card */}
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
                {/* Decorative Accent Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-28 bg-[#10B981]/5 rounded-full blur-xl pointer-events-none" />
                
                {/* Visual Icon Badge */}
                <div className={cn(
                  "mb-5 inline-flex w-12 h-12 rounded-xl items-center justify-center shadow-inner",
                  isLight ? "bg-emerald-50 border border-emerald-200 text-emerald-600" : "bg-white/5 border border-white/10 text-[#10B981]"
                )}>
                  <Coins size={22} className="animate-bounce" />
                </div>
                
                <h3 className={cn("text-sm font-black italic uppercase tracking-wider mb-3 font-sans", isLight ? "text-slate-900" : "text-white")}>
                  Daily Check-In
                </h3>
                
                <p className={cn("text-[10px] leading-relaxed max-w-[200px] mx-auto", isLight ? "text-slate-600" : "text-[#8E8A9E]")}>
                  Acknowledge your daily attendance to receive <span className="text-[#10B981] font-black tracking-wide">+1 TWN Point</span> instantly credited to your active wallet node.
                </p>
              </motion.div>
              
              {/* Standalone centered CLAIM button separated below */}
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ delay: 0.1 }}
                onClick={handleDailyClaim}
                disabled={claimStatus !== 'idle'}
                className={cn(
                  "px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.25em] text-white shadow-lg transition-all italic duration-200 cursor-pointer w-auto min-w-[150px] text-center",
                  claimStatus === 'idle' && "bg-gradient-to-r from-[#10B981] to-[#059669] hover:brightness-110 active:scale-95 shadow-[0_8px_20px_rgba(16,185,129,0.2)]",
                  claimStatus === 'claiming' && (isLight ? "bg-slate-200 text-slate-500 cursor-wait" : "bg-[#1F1D2B]/50 border border-white/5 opacity-80 cursor-wait"),
                  claimStatus === 'claimed' && "bg-emerald-500/25 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 shadow-[0_4px_15px_rgba(16,185,129,0.15)] italic font-black uppercase"
                )}
              >
                {claimStatus === 'idle' && "Claim"}
                {claimStatus === 'claiming' && "Signing..."}
                {claimStatus === 'claimed' && "Claimed"}
              </motion.button>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Explore Menu Popup */}
      <AnimatePresence>
        {showExploreModal && (
          <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowExploreModal(false)}
              className={cn("absolute inset-0 backdrop-blur-md", isLight ? "bg-slate-900/40" : "bg-black/80")}
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className={cn(
                "relative max-w-3xl w-full max-h-[85vh] overflow-y-auto rounded-3xl p-6 sm:p-8 transition-all duration-300 flex flex-col z-10",
                isLight 
                  ? "bg-white border border-slate-200 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.12)]" 
                  : "bg-[#070b13] border border-white/10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)]"
              )}
            >
              {/* Header */}
              <div className={cn("flex items-center justify-between border-b pb-4 mb-6", isLight ? "border-slate-100" : "border-white/5")}>
                <div className="flex items-center gap-2.5">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center transition-colors", isLight ? "bg-emerald-50 text-emerald-600 border border-emerald-200/80" : "bg-[#009e42]/10 border border-[#009e42]/20 text-[#009e42]")}>
                    <Compass size={16} className="animate-spin-slow" />
                  </div>
                  <h3 className={cn("text-xs font-black uppercase tracking-[0.2em] font-sans transition-colors", isLight ? "text-slate-900" : "text-white")}>
                    Explore
                  </h3>
                </div>
                <button 
                  onClick={() => setShowExploreModal(false)}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer",
                    isLight 
                      ? "bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-500 hover:text-slate-800" 
                      : "bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-white/60 hover:text-white"
                  )}
                >
                  <X size={14} />
                </button>
              </div>

              {/* Grid of Links */}
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3.5">
                {exploreItems.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => {
                      setShowExploreModal(false);
                      navigate(item.path);
                    }}
                    className={cn(
                      "group flex flex-col items-center justify-between p-3.5 border rounded-2xl aspect-square w-full transition-all duration-300 active:scale-95 cursor-pointer shadow-sm relative overflow-hidden",
                      isLight 
                        ? "bg-white hover:bg-slate-50/80 border-slate-200 hover:border-slate-300 hover:shadow-md" 
                        : "bg-[#101726]/40 hover:bg-[#18233c] border-white/5 hover:border-[#009e42]/30 hover:shadow-[0_10px_20px_rgba(0,158,66,0.15)]"
                    )}
                  >
                    {/* Hover Glow Accent Background */}
                    <div className={cn(
                      "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-br",
                      isLight 
                        ? "from-slate-100/50 to-transparent" 
                        : "from-[#009e42]/10 to-transparent"
                    )} />

                    {/* Premium Hovering Page Icon wrapper */}
                    <div className={cn(
                      "flex-1 flex items-center justify-center transition-all duration-300 transform group-hover:scale-105",
                      isLight 
                        ? "text-slate-700 group-hover:text-slate-900" 
                        : "text-slate-400 group-hover:text-[#009e42]"
                    )}>
                      <item.icon size={26} className="transition-all duration-300" />
                    </div>

                    <div className={cn(
                      "w-full border py-1.5 px-1.5 text-center transition-all duration-300 relative z-10 rounded-xl",
                      isLight 
                        ? "bg-white border-slate-200/90 group-hover:border-slate-300" 
                        : "bg-white/5 group-hover:bg-[#009e42]/10 border-white/5 group-hover:border-[#009e42]/25"
                    )}>
                      <span className={cn(
                        "block text-[10px] font-bold tracking-wider truncate transition-colors duration-300",
                        isLight 
                          ? "text-slate-700 group-hover:text-slate-900" 
                          : "text-white group-hover:text-[#009e42]"
                      )}>
                        {item.label}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Compound Your Profits Popup */}
      <AnimatePresence>
        {showCompoundPopup && (() => {
          const isAutoCompoundActive = !!(
            profile?.auto_compound_enabled &&
            profile?.auto_compound_end_date &&
            new Date(profile.auto_compound_end_date).getTime() > new Date().getTime()
          );

          return (
            <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
                // Backdrop clicks don't close so they must proceed or skip explicitly
              />
              
              {/* Flex column container keeping Card at top and buttons below, matching Daily Reward layout */}
              <div className={cn(
                "flex flex-col items-center gap-5 w-full relative z-10 select-none transition-all duration-300",
                showDurationSelector && !isAutoCompoundActive ? "max-w-[340px]" : "max-w-[260px]"
              )}>
                
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
                  {/* Decorative Glow */}
                  <div className={cn(
                    "absolute top-0 left-1/2 -translate-x-1/2 w-28 h-28 rounded-full blur-xl pointer-events-none",
                    isConfirmingSkip ? "bg-red-500/5" : "bg-[#10B981]/5"
                  )} />
                  
                  {/* Confirmation Dialogue, Active plan view, selection grid or Intro view */}
                  {isConfirmingSkip ? (
                    <div>
                      <div className={cn(
                        "mb-5 inline-flex w-12 h-12 rounded-xl items-center justify-center text-red-500 shadow-inner",
                        isLight ? "bg-red-50 border border-red-200" : "bg-white/5 border border-white/10"
                      )}>
                        <Clock size={22} className="animate-pulse" />
                      </div>
                      
                      <h3 className={cn("text-sm font-black italic uppercase tracking-wider mb-3 font-sans", isLight ? "text-slate-900" : "text-white")}>
                        Skip Compounding?
                      </h3>
                      
                      <p className={cn("text-[10px] leading-relaxed max-w-[200px] mx-auto", isLight ? "text-slate-600" : "text-[#8E8A9E]")}>
                        Are you sure you don't want to compound your profits? Reinvesting maximizes your daily ROI potentials.
                      </p>
                    </div>
                  ) : isAutoCompoundActive ? (
                    <div>
                      <div className={cn(
                        "mb-5 inline-flex w-12 h-12 rounded-xl items-center justify-center text-[#10B981] shadow-inner",
                        isLight ? "bg-emerald-50 border border-emerald-200" : "bg-[#10B981]/15 border border-[#10B981]/30"
                      )}>
                        <Bot size={22} className="animate-pulse" />
                      </div>
                      
                      <h3 className={cn("text-sm font-black italic uppercase tracking-wider mb-2 font-sans", isLight ? "text-slate-900" : "text-white")}>
                        Auto-Compound Active
                      </h3>
                      
                      <p className={cn("text-[10px] leading-relaxed max-w-[200px] mx-auto mb-4 font-sans", isLight ? "text-slate-600" : "text-[#8E8A9E]")}>
                        Your high-yield quant node is configured for <span className="text-[#10B981] font-black">{profile?.auto_compound_duration} Days</span> automated reinvestment.
                      </p>

                      <div className={cn("rounded-xl p-3 text-left space-y-2 mb-1", isLight ? "bg-slate-50 border border-slate-200" : "bg-white/[0.02] border border-white/5")}>
                        <div className="flex justify-between text-[9px] font-sans">
                          <span className={isLight ? "text-slate-500" : "text-white/40"}>Duration:</span>
                          <span className={cn("font-bold", isLight ? "text-slate-800" : "text-white/80")}>{profile?.auto_compound_duration} Days</span>
                        </div>
                        <div className="flex justify-between text-[9px] font-sans">
                          <span className={isLight ? "text-slate-500" : "text-white/40"}>Start Date:</span>
                          <span className={cn("font-mono text-[8px]", isLight ? "text-slate-700 font-semibold" : "text-white/80")}>
                            {profile?.auto_compound_start_date ? new Date(profile.auto_compound_start_date).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between text-[9px] font-sans">
                          <span className={isLight ? "text-slate-500" : "text-white/40"}>End Date:</span>
                          <span className="font-mono text-emerald-500 dark:text-emerald-400 font-bold text-[8px]">
                            {profile?.auto_compound_end_date ? new Date(profile.auto_compound_end_date).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : showDurationSelector ? (
                    <div className="w-full">
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

                      {/* Elegant premium cards list for duration options */}
                      <div className="space-y-2 w-full">
                        {[15, 30, 90, 180, 365].map((days) => (
                          <button
                            key={days}
                            onClick={() => selectCompoundingDuration(days)}
                            disabled={isCompounding}
                            className={cn(
                              "w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 group text-left cursor-pointer active:scale-[0.99] select-none",
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
                    </div>
                  ) : (
                    <div>
                      {/* Visual Icon Badge */}
                      <div className={cn(
                        "mb-5 inline-flex w-12 h-12 rounded-xl items-center justify-center text-[#10B981] shadow-inner",
                        isLight ? "bg-emerald-50 border border-emerald-200" : "bg-white/5 border border-white/10"
                      )}>
                        <TrendingUp size={22} className="animate-bounce" />
                      </div>
                      
                      <h3 className={cn("text-sm font-black italic uppercase tracking-wider mb-3 font-sans", isLight ? "text-slate-900" : "text-white")}>
                        ROI/Profit Compounding
                      </h3>
                      
                      <p className={cn("text-[10px] leading-relaxed max-w-[200px] mx-auto", isLight ? "text-slate-600" : "text-[#8E8A9E]")}>
                        Increase your earning potential by reinvesting your accumulated earnings into your active investment.
                      </p>
                    </div>
                  )}
                </motion.div>

                {/* Standalone action buttons below the Card, matching Daily Reward layout pattern */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ delay: 0.1 }}
                  className="flex gap-3 w-full justify-center"
                >
                  {isConfirmingSkip ? (
                    <>
                      <button
                        onClick={handleSkipConfirmYes}
                        className={cn(
                          "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.25em] text-red-500 transition-all duration-200 cursor-pointer italic text-center",
                          isLight ? "bg-red-50 hover:bg-red-100 border border-red-200" : "bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 text-red-400"
                        )}
                      >
                        Yes
                      </button>
                      <button
                        onClick={handleSkipConfirmNo}
                        className="flex-1 py-3 bg-gradient-to-r from-[#10B981] to-[#059669] hover:brightness-110 active:scale-95 shadow-[0_8px_20px_rgba(16,185,129,0.2)] text-white rounded-xl text-[10px] font-black uppercase tracking-[0.25em] transition-all duration-200 cursor-pointer italic text-center shadow-lg"
                      >
                        No
                      </button>
                    </>
                  ) : isAutoCompoundActive ? (
                    <button
                      onClick={() => closePopup('compound-profits')}
                      className="w-full py-3 bg-gradient-to-r from-[#10B981] to-[#059669] hover:brightness-110 active:scale-95 shadow-[0_8px_20px_rgba(16,185,129,0.2)] text-white rounded-xl text-[10px] font-black uppercase tracking-[0.25em] transition-all duration-200 cursor-pointer italic text-center shadow-lg"
                    >
                      Got It
                    </button>
                  ) : showDurationSelector ? (
                    <button
                      onClick={() => {
                        closePopup('compound-profits');
                        setShowDurationSelector(false);
                      }}
                      className={cn(
                        "w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.25em] transition-all duration-200 cursor-pointer italic text-center",
                        isLight ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200" : "bg-white/5 hover:bg-white/10 border border-white/10 text-white"
                      )}
                    >
                      Exit
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleCancelClick}
                        className={cn(
                          "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.25em] transition-all duration-200 cursor-pointer italic text-center",
                          isLight ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200" : "bg-white/5 hover:bg-white/10 border border-white/10 text-white"
                        )}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleCompoundClick}
                        disabled={isCompounding}
                        className={cn(
                          "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.25em] transition-all duration-200 cursor-pointer italic text-center shadow-lg",
                          isCompounding
                            ? (isLight ? "bg-slate-200 border border-slate-300 text-slate-500 cursor-wait" : "bg-[#1F1D2B]/50 border border-white/5 opacity-80 cursor-wait text-gray-400")
                            : "bg-gradient-to-r from-[#10B981] to-[#059669] hover:brightness-110 active:scale-95 shadow-[0_8px_20px_rgba(16,185,129,0.2)] text-white"
                        )}
                      >
                        {isCompounding ? "Signing..." : "Accept"}
                      </button>
                    </>
                  )}
                </motion.div>
              </div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* Success Popup */}
      <AnimatePresence>
        {showCompoundSuccess && (
          <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
            />
            
            {/* Flex column container keeping Card at top and OK button below, matching Daily Reward layout exactly */}
            <div className="flex flex-col items-center gap-5 max-w-[260px] w-full relative z-10 select-none">
              
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
                {/* Decorative Accent Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-28 bg-[#10B981]/5 rounded-full blur-xl pointer-events-none" />
                
                {/* Visual Icon Badge */}
                <div className={cn(
                  "mb-5 inline-flex w-12 h-12 rounded-xl items-center justify-center text-[#10B981] shadow-inner",
                  isLight ? "bg-emerald-50 border border-emerald-200" : "bg-white/5 border border-white/10"
                )}>
                  <TrendingUp size={22} className="animate-bounce" />
                </div>
                
                <h3 className={cn("text-sm font-black italic uppercase tracking-wider mb-3 font-sans", isLight ? "text-slate-900" : "text-white")}>
                  Successfully Compounded!
                </h3>
                
                <div className={cn("text-[10px] leading-relaxed max-w-[200px] mx-auto font-sans font-medium space-y-1 text-center", isLight ? "text-slate-600" : "text-[#8E8A9E]")}>
                  <p>Keep Compounding.</p>
                  <p>Keep Earning.</p>
                  <p>Keep Referring.</p>
                  <p>Keep Growing with CGA Trades.</p>
                </div>
              </motion.div>
              
              {/* Standalone centered OK button separated below */}
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ delay: 0.1 }}
                onClick={() => setShowCompoundSuccess(false)}
                className="px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.25em] text-white shadow-lg transition-all italic duration-200 cursor-pointer w-auto min-w-[150px] text-center bg-gradient-to-r from-[#10B981] to-[#059669] hover:brightness-110 active:scale-95 shadow-[0_8px_20px_rgba(16,185,129,0.2)]"
              >
                OK
              </motion.button>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
