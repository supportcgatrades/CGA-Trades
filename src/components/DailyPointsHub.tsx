import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft,
  Calendar,
  Award,
  Coins,
  Shield,
  Search,
  CheckCircle2,
  AlertCircle,
  Zap,
  ChevronRight,
  Flame,
  ArrowRightLeft,
  Clock,
  Sparkles
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../lib/firebase';
import { 
  doc, 
  runTransaction, 
  collection, 
  query, 
  where, 
  getDocs, 
  onSnapshot
} from 'firebase/firestore';
import { toast } from 'sonner';

const REFERENCE_PRICE = 0.00446;

export default function DailyPointsHub() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  // Daily check-in & calendar states
  const [calYear, setCalYear] = useState<number>(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState<number>(new Date().getMonth());
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [countdownStr, setCountdownStr] = useState('');

  const points_balance = profile?.withdraw_methods?.points_balance ?? profile?.points_balance ?? 0;
  const current_streak = profile?.withdraw_methods?.current_streak ?? profile?.current_streak ?? 0;
  const last_check_in = profile?.withdraw_methods?.last_check_in ?? profile?.last_check_in ?? '';
  const claimed_dates = profile?.withdraw_methods?.claimed_dates ?? profile?.claimed_dates ?? [];
  const claimedDatesSet = new Set(claimed_dates);

  const todayStr = [
    new Date().getFullYear(), 
    String(new Date().getMonth() + 1).padStart(2, '0'), 
    String(new Date().getDate()).padStart(2, '0')
  ].join('-');

  // Price Natural Fluctuation for real estimated valuation
  const [currentPrice, setCurrentPrice] = useState(0.00446);
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPrice(prev => {
        const noise = (Math.random() * 0.000022) - 0.000011;
        let next = prev + noise;
        if (next < 0.00350) next = 0.00350 + Math.random() * 0.00003;
        if (next > 0.00749) next = 0.00749 - Math.random() * 0.00003;
        return next;
      });
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  // Countdown to next check-in (midnight)
  useEffect(() => {
    const timer = setInterval(() => {
      const nowTime = new Date();
      const nextMidnight = new Date();
      nextMidnight.setHours(24, 0, 0, 0);
      const remains = nextMidnight.getTime() - nowTime.getTime();

      if (remains <= 0) {
        setCountdownStr('');
      } else {
        const hrs = Math.floor(remains / (60 * 60 * 1000));
        const mins = Math.floor((remains % (60 * 60 * 1000)) / (60 * 1000));
        const secs = Math.floor((remains % (60 * 1000)) / 1000);
        setCountdownStr(`${hrs}h ${mins}m ${secs}s`);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Point conversion history transactions state
  const [conversionTransactions, setConversionTransactions] = useState<any[]>([]);
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'transactions'),
      where('user_id', '==', user.uid),
      where('is_twn_activity', '==', true)
    );
    
    const unsubscribe = onSnapshot(q, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as any);
      const filtered = list.filter(tx => tx.type === 'points_conversion');
      const sorted = filtered.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      setConversionTransactions(sorted);
    }, (err) => {
      console.warn("Points conversion transactions listener blocked:", err);
    });
    return () => unsubscribe();
  }, [user]);

  // Handle Close & Back Navigation
  const handleClose = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/rewards');
    }
  };

  // Check In Handler matching the exact prior layout & atomic database protection rules
  const handleDailyCheckIn = async () => {
    const authUser = auth.currentUser;
    if (!authUser || isCheckingIn) return;
    
    const hasClaimedToday = claimedDatesSet.has(todayStr);
    if (hasClaimedToday) {
      toast.error("You have already checked in today.");
      return;
    }

    setIsCheckingIn(true);
    const toastId = toast.loading("Processing atomic ledger attestation...");
    try {
      const nowIso = new Date().toISOString();
      const userRef = doc(db, 'users', authUser.uid);
      
      await runTransaction(db, async (transaction) => {
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists()) {
          throw new Error("Core profile record does not exist on Capital Growth Alliance protocol.");
        }

        const userData = userSnap.data();
        const existingWithdrawMethods = userData.withdraw_methods || {};
        const currentStreak = existingWithdrawMethods.current_streak || 0;
        const lastCheckIn = existingWithdrawMethods.last_check_in || '';
        const claimedDatesList = existingWithdrawMethods.claimed_dates || [];
        const claimedDatesSetLocal = new Set(claimedDatesList);

        if (claimedDatesSetLocal.has(todayStr)) {
          throw new Error("Safety protocol triggered: Attestation already signed for this cycle.");
        }

        const yesterdayDate = new Date();
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yStr = [yesterdayDate.getFullYear(), String(yesterdayDate.getMonth() + 1).padStart(2, '0'), String(yesterdayDate.getDate()).padStart(2, '0')].join('-');
        const lastCheckInDateOnly = lastCheckIn ? lastCheckIn.split('T')[0] : '';

        let newStreak = 1;
        if (lastCheckIn) {
          if (lastCheckInDateOnly === yStr) {
            newStreak = currentStreak + 1;
          } else if (lastCheckInDateOnly === todayStr) {
            newStreak = currentStreak;
          } else {
            newStreak = 1;
          }
        }

        const newClaimedDates = [...claimedDatesList, todayStr];
        const newPointsBalance = (existingWithdrawMethods.points_balance || 0) + 1;
        const newTotalClaimedDays = (existingWithdrawMethods.total_claimed_days || 0) + 1;

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

        const txRef = doc(collection(db, 'transactions'));
        transaction.set(txRef, {
          user_id: authUser.uid,
          type: 'points_gain',
          amount: 1,
          status: 'approved',
          created_at: nowIso,
          description: 'Daily Check-In Incentive'
        });

        const notifRef = doc(collection(db, 'notifications'));
        transaction.set(notifRef, {
          user_id: authUser.uid,
          type: 'success',
          title: 'Daily Check-In Successful',
          message: 'Successfully checked in! +1 Daily Point has been credited.',
          read: false,
          created_at: nowIso
        });
      });

      toast.success("Successfully checked-in today! +1 CGA Point credited.", { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Daily check-in failed.", { id: toastId });
    } finally {
      setIsCheckingIn(false);
    }
  };

  // Convert points logic matching exact existing business rule: 1 PTS = 10 TWN
  const handleConvertPoints = async () => {
    const authUser = auth.currentUser;
    if (!authUser || isConverting) return;

    if (points_balance < 10) {
      toast.error("You need at least 10 Daily Points to convert to CGA Token.");
      return;
    }

    setIsConverting(true);
    const toastId = toast.loading("Executing point conversion protocol...");
    try {
      const nowIso = new Date().toISOString();
      const userRef = doc(db, 'users', authUser.uid);

      await runTransaction(db, async (transaction) => {
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists()) {
          throw new Error("Core profile record does not exist.");
        }

        const userData = userSnap.data();
        const existingWithdrawMethods = userData.withdraw_methods || {};
        const ptsBalance = existingWithdrawMethods.points_balance ?? userData.points_balance ?? 0;

        if (ptsBalance < 10) {
          throw new Error("Insufficient Daily Points for conversion.");
        }

        const pointsToConvert = ptsBalance;
        const twnCredited = pointsToConvert * 10; // 1 Daily Point = 10 TWN Tokens
        const currentTwn = userData.twn_balance || 0;
        const newTwnBalance = currentTwn + twnCredited;

        transaction.update(userRef, {
          twn_balance: newTwnBalance,
          withdraw_methods: {
            ...existingWithdrawMethods,
            points_balance: 0 // Converted all points to liquid TWN
          }
        });

        // Write Conversion record
        const txRef = doc(collection(db, 'transactions'));
        transaction.set(txRef, {
          user_id: authUser.uid,
          type: 'points_conversion',
          is_twn_activity: true,
          points_converted: pointsToConvert,
          twn_amount: twnCredited,
          amount: twnCredited * currentPrice,
          twn_price: currentPrice,
          status: 'completed',
          created_at: nowIso,
          description: `Daily Points to TWN Conversion (${pointsToConvert} PTS → ${twnCredited} TWN)`
        });

        // Write Notification log
        const notifRef = doc(collection(db, 'notifications'));
        transaction.set(notifRef, {
          user_id: authUser.uid,
          type: 'success',
          title: 'Points Converted Successfully',
          message: `Successfully converted ${pointsToConvert} Daily Points to ${twnCredited} CGA Tokens!`,
          read: false,
          created_at: nowIso
        });
      });

      toast.success(`Successfully converted ${points_balance} points to ${points_balance * 10} CGA Tokens!`, { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Point conversion failed.", { id: toastId });
    } finally {
      setIsConverting(false);
    }
  };

  // Pre-calculate calendar entries
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const monthName = new Date(calYear, calMonth).toLocaleString('default', { month: 'long' });

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8 space-y-8 select-none text-white relative min-h-screen">
      {/* Background Ambience elements */}
      <div className="fixed inset-0 bg-[#020308] -z-20 overflow-hidden">
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-purple-900/[0.04] rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-emerald-900/[0.03] rounded-full blur-[100px] pointer-events-none" />
      </div>

      {/* HEADER SECTION */}
      <header className="flex items-center justify-between border-b border-white/5 pb-5">
        <div className="flex items-center gap-3">
          <button 
            onClick={handleClose}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 flex items-center justify-center text-gray-400 hover:text-white transition-all cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>
        </div>
        
        {/* Status indicator on the right */}
        <div className="flex items-center gap-2 bg-[#090b14] border border-emerald-500/15 px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest text-[#10B981]">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          <span>Active Streak: {current_streak} days</span>
        </div>
      </header>

      {/* --- EXCHANGE RULE CARD ONLY --- */}
      <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-white/5 rounded-2xl px-6 py-4 flex justify-between items-center relative overflow-hidden">
        <span className="text-xs font-black uppercase tracking-widest text-emerald-400">Exchange Rule</span>
        <span className="text-xs font-black uppercase tracking-widest text-white font-mono bg-emerald-500/20 px-3 py-1 rounded-lg">
          1 PTS = 10 CGA TOKEN
        </span>
      </div>

      {/* PRIMARY GRID OF TWO SECTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Check-in calendar (7 columns) */}
        <div className="lg:col-span-7 bg-[#0b0c16]/75 border border-white/5 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-[0_12px_45px_rgba(0,0,0,0.6)] space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-[50px] pointer-events-none" />
          
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <div className="space-y-1 text-left">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                {monthName.split(' ')[0]}
              </h3>
            </div>
            
            {/* Nav Arrows for months if desired, keeping it clean */}
            <div className="flex gap-1 bg-white/5 border border-white/10 p-0.5 rounded-lg text-[9px] font-black uppercase">
              <span className="px-2 py-1 text-[#8E8A9E]">{monthName.split(' ')[0]}</span>
            </div>
          </div>

          {/* CHECK-IN CALENDAR MAIN GRID */}
          <div className="space-y-4">
            <div className="grid grid-cols-7 gap-2 text-center text-[9px] font-black uppercase text-slate-500 tracking-widest pb-1 border-b border-white/[0.03]">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => <span key={d}>{d}</span>)}
            </div>

            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {(() => {
                const list = [];
                let firstDayIdx = new Date(calYear, calMonth, 1).getDay();
                // Adjust Sun=0 to Mon-start Mon=0, Sun=6
                firstDayIdx = (firstDayIdx + 6) % 7;

                // Blank cells
                for (let k = 0; k < firstDayIdx; k++) {
                  list.push(<div key={`blank-${k}`} className="w-full aspect-square bg-transparent" />);
                }

                // Day cells
                for (let d = 1; d <= daysInMonth; d++) {
                  const iterDateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                  const isClaimed = claimedDatesSet.has(iterDateStr);
                  const isToday = iterDateStr === todayStr;

                  if (isClaimed) {
                    if (isToday) {
                      list.push(
                        <div 
                          key={`day-${d}`}
                          className="w-full aspect-square rounded-[14px] bg-emerald-500 shadow-[0_4px_12px_rgba(16,185,129,0.3)] border border-emerald-600 flex flex-col items-center justify-center cursor-default select-none relative"
                        >
                          <span className="text-white text-xs sm:text-sm font-black">{d}</span>
                          <span className="text-[7px] sm:text-[8px] font-black text-emerald-100 mt-0.5 block leading-none">+1 PTS</span>
                        </div>
                      );
                    } else {
                      list.push(
                        <div 
                          key={`day-${d}`}
                          className="w-full aspect-square rounded-[14px] bg-emerald-955/20 border border-emerald-500/15 flex flex-col items-center justify-center cursor-default select-none"
                        >
                          <span className="text-emerald-400 text-xs sm:text-sm font-bold">{d}</span>
                          <span className="text-[7px] sm:text-[8px] font-black text-emerald-500/60 mt-0.5 block leading-none">+1 PTS</span>
                        </div>
                      );
                    }
                  } else if (isToday) {
                    list.push(
                      <button 
                        key={`day-${d}`}
                        onClick={handleDailyCheckIn}
                        disabled={isCheckingIn}
                        className="w-full aspect-square rounded-[14px] border border-emerald-500/50 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold flex flex-col items-center justify-center hover:scale-[1.03] transition-all cursor-pointer animate-pulse"
                        title="Click to check-in now"
                      >
                        <span className="text-xs sm:text-sm font-black">{d}</span>
                        <span className="text-[7px] sm:text-[8px] font-bold text-emerald-400 mt-0.5 block leading-none">CLAIM</span>
                      </button>
                    );
                  } else {
                    list.push(
                      <div 
                        key={`day-${d}`}
                        className="w-full aspect-square rounded-[14px] bg-white/[0.02] border border-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 font-semibold text-xs sm:text-sm select-none transition-colors"
                      >
                        {d}
                      </div>
                    );
                  }
                }
                return list;
              })()}
            </div>
          </div>

          {/* ATTENDANCE STATUS BLOCK */}
          <div className="bg-[#05060f]/60 border border-white/5 rounded-[20px] p-4 flex justify-center">
            <button
              onClick={handleDailyCheckIn}
              disabled={isCheckingIn || claimedDatesSet.has(todayStr)}
              className={cn(
                "w-full sm:w-auto px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer",
                !claimedDatesSet.has(todayStr)
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-105 text-white shadow-md shadow-emerald-500/10" 
                  : "bg-white/5 text-gray-500 border border-white/5 cursor-not-allowed"
              )}
            >
              {claimedDatesSet.has(todayStr) ? "Checked In Today" : countdownStr ? `Reset in ${countdownStr}` : "Claim +1 Daily PTS"}
            </button>
          </div>
        </div>

        {/* Right Side: Points Balance & Converters (5 columns) */}
        <div className="lg:col-span-5 bg-[#0b0c16]/75 border border-white/5 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-[0_12px_45px_rgba(0,0,0,0.6)] flex flex-col justify-between space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-[50px] pointer-events-none" />
          
          <div className="space-y-4">
            <div className="border-b border-white/5 pb-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <span className="text-purple-400">★</span> Point Exchange Portal
              </h3>
              <p className="text-[9px] text-[#8E8A9E] font-bold uppercase tracking-wider">Claim accrued points and swap to liquid CGA Token balances</p>
            </div>

            {/* Daily Point Balance Card */}
            <div className="bg-black/40 border border-white/5 px-5 py-6 rounded-2xl text-center space-y-1 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
              <span className="text-[8px] font-black uppercase tracking-[0.2em] text-[#8E8A9E] block">Daily Point Balance</span>
              <span className="text-4xl font-black text-purple-400 tracking-tight block font-sans select-all">
                {points_balance} <span className="text-xs uppercase font-bold text-gray-400">PTS</span>
              </span>
              
              <div className="pt-2 flex justify-center items-center gap-3 text-[9px] font-black uppercase tracking-wider">
                <span className="text-gray-400">Exchange Eligibility:</span>
                {points_balance >= 10 ? (
                  <span className="text-emerald-400 font-extrabold flex items-center gap-1">● READY</span>
                ) : (
                  <span className="text-amber-500 font-extrabold flex items-center gap-1">● MIN 10 REQUIRED</span>
                )}
              </div>
            </div>

            {/* Specs & Informative lines */}
            <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl space-y-2.5 text-[9px] uppercase font-black tracking-wider leading-relaxed">
              <div className="flex justify-between border-b border-white/[0.03] pb-1.5">
                <span className="text-slate-400 font-semibold">Crediting To</span>
                <span className="text-[#a855f7] font-bold">Standard CGA Balance</span>
              </div>
              <div className="flex justify-between border-b border-white/[0.03] pb-1.5">
                <span className="text-slate-400 font-semibold">Min Threshold</span>
                <span className="text-amber-400">10 Daily Points</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">Yield Ratio</span>
                <span className="text-emerald-400">1 PTS = 10 Liquid CGA</span>
              </div>
            </div>
          </div>

          {/* Exchange button */}
          <div className="space-y-4 pt-4">
            <button
              onClick={handleConvertPoints}
              disabled={isConverting || points_balance < 10}
              className={cn(
                "w-full py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all cursor-pointer italic text-center block",
                points_balance >= 10 
                  ? "bg-gradient-to-r from-purple-600 to-[#F59E0B] hover:brightness-110 active:scale-95 text-white shadow-lg shadow-purple-500/20" 
                  : "bg-white/5 text-slate-500 cursor-not-allowed border border-white/5"
              )}
            >
              {isConverting ? "Converting Points..." : points_balance >= 10 ? `Convert ${points_balance} Points to ${points_balance * 10} CGA` : "Convert Points to CGA"}
            </button>
            
            {points_balance < 10 && (
              <p className="text-[8px] text-center text-amber-500/70 font-black uppercase tracking-wider">
                ⚠️ Operational protocol: minimum 10 points required to activate swap.
              </p>
            )}
          </div>
        </div>

      </div>

      {/* LOWER SECTION: POINT CONVERSION LEDGER HISTORY */}
      <div className="bg-[#0b0c16]/75 border border-white/5 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-[0_12px_45px_rgba(0,0,0,0.6)] space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="border-b border-white/5 pb-4">
          <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <span className="text-purple-400">★</span> Point conversion Ledger Log
          </h3>
          <p className="text-[9px] text-[#8E8A9E] font-bold uppercase tracking-wider">Your personal conversion settlements history</p>
        </div>

        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
          {conversionTransactions.length === 0 ? (
            <div className="py-12 border-2 border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center text-center space-y-2">
              <span className="text-slate-600 text-lg">★</span>
              <div>
                <p className="text-xs font-black uppercase text-slate-400 tracking-widest">No Settlements Logged</p>
                <p className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold">Perform daily check-ins and convert points of 10+ to begin</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {conversionTransactions.map((tx) => (
                <div 
                  key={tx.id}
                  className="p-4 bg-white/[0.01] hover:bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col gap-2 transition-all"
                >
                  <div className="flex justify-between items-center pb-2 border-b border-white/[0.03]">
                    <span className="text-[10px] font-black text-purple-400 tracking-wider">
                      {tx.points_converted || tx.twn_amount / 10 || 0} PTS → {tx.twn_amount || 0} CGA
                    </span>
                    <span className="text-[7px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">
                      Secured Settlement
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[8px] font-bold uppercase text-slate-400 tracking-wider">
                    <div>
                      <span className="block text-[7px] text-slate-500">Date & Time</span>
                      <span className="text-white font-mono">{tx.created_at ? new Date(tx.created_at).toLocaleString() : 'Just now'}</span>
                    </div>
                    <div>
                      <span className="block text-[7px] text-slate-500">Transaction ID</span>
                      <span className="text-white font-mono truncate block max-w-[120px]">{tx.id || 'Secure Log'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
