import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Loader2, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  X, 
  TrendingUp, 
  Sparkle,
  Activity,
  ChevronRight
} from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import BetaInvestmentStepIndicator from './BetaInvestmentStepIndicator';

interface InvestProcessingViewProps {
  investmentId: string | null;
  planName: string;
  amount: number;
  onClose: () => void;
  isBeta?: boolean;
}

export default function InvestProcessingView({ 
  investmentId, 
  planName, 
  amount, 
  onClose,
  isBeta = false 
}: InvestProcessingViewProps) {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'pending' | 'inactive' | 'rejected' | 'active'>('pending');
  const [timeLeft, setTimeLeft] = useState<number>(2700); // 45 * 60 = 2700 sec
  const [progress, setProgress] = useState<number>(0);

  // 1. Snapshot Listener for Live Admin Approval
  useEffect(() => {
    if (!investmentId) return;

    const unsubscribe = onSnapshot(doc(db, 'investments', investmentId), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const currentStatus = data.status || 'pending';
        setStatus(currentStatus);
      }
    }, (error) => {
      console.warn("Real-time investment monitor blocked:", error.message);
    });

    return () => unsubscribe();
  }, [investmentId]);

  // 2. Persistent 45-Minute Countdown
  useEffect(() => {
    if (!investmentId) return;

    const startKey = `pending_investment_timer_${investmentId}`;
    let startTimeStr = localStorage.getItem(startKey);
    if (!startTimeStr) {
      startTimeStr = Date.now().toString();
      localStorage.setItem(startKey, startTimeStr);
    }

    const startTime = parseInt(startTimeStr, 10);
    const durationMs = 45 * 60 * 1000; // 45 minutes

    const updateTimer = () => {
      const elapsedMs = Date.now() - startTime;
      const remainingSec = Math.max(0, Math.floor((durationMs - elapsedMs) / 1000));
      setTimeLeft(remainingSec);

      // Simple visual progress bar (starts at 0%, goes to 100% as time counts down)
      const calculatedProgress = Math.min(100, Math.max(0, (elapsedMs / durationMs) * 100));
      setProgress(calculatedProgress);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [investmentId]);

  // Format countdown into MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleActivateClick = () => {
    // Navigate directly to the dashboard, and auto-open the inactive (awaiting pulse) modal
    navigate('/dashboard', { state: { showInactive: true } });
    onClose();
  };

  const isApproved = status === 'inactive' || status === 'active';

  // Automatically mark this approved investment as dismissed in sessionStorage so Layout.tsx does not display a duplicate popup after leaving this screen
  useEffect(() => {
    if (isApproved && investmentId) {
      try {
        const saved = sessionStorage.getItem('dismissed_approved_notifications');
        const set = saved ? new Set<string>(JSON.parse(saved)) : new Set<string>();
        set.add(investmentId);
        sessionStorage.setItem('dismissed_approved_notifications', JSON.stringify(Array.from(set)));
      } catch (e) {
        console.warn("Saving dismissed notifications to session failed:", e);
      }
    }
  }, [isApproved, investmentId]);

  return (
    <div id="invest-processing-view" className="relative w-full max-w-2xl mx-auto p-1 text-slate-900 dark:text-white">
      {/* Visual background accents */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

      <BetaInvestmentStepIndicator 
        currentView="processing" 
        isConfirmed={true} 
        isPaymentSuccessful={isApproved} 
      />

      <AnimatePresence mode="wait">
        {!isApproved ? (
          // --- PROCESSING VIEW ---
          <motion.div
            key="processing-panel"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
            className="p-8 md:p-12 rounded-[40px] bg-white dark:bg-[#0b0e14]/90 border border-slate-200 dark:border-white/5 backdrop-blur-xl shadow-2xl overflow-hidden relative"
          >
            {/* Elegant Header with Back/Close button */}
            <div className="flex justify-between items-center mb-10 w-full relative z-10">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[9px] uppercase font-black text-slate-500 dark:text-aura-muted tracking-[0.2em] font-mono">
                  CGA Trades Ledger Sync
                </span>
              </div>
              <button 
                onClick={onClose}
                className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 dark:bg-white/5 dark:hover:bg-white/10 dark:text-gray-400 dark:hover:text-white rounded-xl transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Main Spinner & Visual Graphic */}
            <div className="flex flex-col items-center justify-center text-center relative z-10">
              <div className="relative mb-8">
                {/* Glowing Background Radial */}
                <div className="absolute inset-0 bg-[#009e42]/20 rounded-full blur-[30px] opacity-30 animate-pulse" />
                
                {/* Outer Spinning Ring */}
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                  className="w-32 h-32 rounded-full border border-dashed border-[#009e42]/25 flex items-center justify-center"
                />

                {/* Inner Spinning Ring */}
                <div className="absolute inset-2 flex items-center justify-center">
                  <motion.div 
                    animate={{ rotate: -360 }}
                    transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                    className="w-28 h-28 rounded-full border-t border-b border-[#009e42]/60 flex items-center justify-center"
                  />
                </div>

                {/* Center Loading Indicator */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <Loader2 className="animate-spin text-[#009e42]" size={32} />
                </div>
              </div>

              {/* Title & Info */}
              <h2 className="text-2xl font-black italic font-serif leading-tight text-slate-900 dark:text-white">
                Processing your investment...
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-aura-muted uppercase tracking-[0.25em] mt-3 font-mono">
                {planName} Node | {formatCurrency(amount)}
              </p>

              <div className="w-full max-w-sm mt-8 p-6 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-200 dark:border-white/5 shadow-inner">
                {/* Elegant Countdown Display */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] text-slate-500 dark:text-gray-400 font-bold uppercase tracking-wider flex items-center gap-2">
                    <Clock size={14} className="text-[#009e42]" /> Review Window
                  </span>
                  <span className="text-lg font-black font-mono text-[#009e42] tracking-wider">
                    {formatTime(timeLeft)}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-200 dark:bg-white/5 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#009e42] transition-all duration-1000"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <p className="text-[11px] text-slate-500 dark:text-gray-400 mt-4 leading-relaxed font-sans">
                  The confirmation queue window is currently verifying the transaction hash relative to your designated node pool. Securing block space...
                </p>
              </div>

              {/* Advisory Message */}
              <div className="mt-8 flex flex-col items-center gap-1.5">
                <p className="text-[10px] uppercase font-bold text-amber-600 dark:text-yellow-500/80 tracking-widest bg-amber-50 dark:bg-yellow-500/5 border border-amber-200 dark:border-yellow-500/10 px-4 py-1.5 rounded-full">
                  ⚠️ Ledger Protection Active
                </p>
                <p className="text-[11px] text-slate-500 dark:text-gray-400 max-w-sm mt-1.5">
                  You may navigate away or close this viewport safely. Doing so will not interrupt or invalidate your pending node deposit.
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          // --- SUCCESS CARD ---
          <motion.div
            key="success-panel"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="p-8 md:p-12 rounded-[40px] bg-white dark:bg-[#0b0e14]/90 border border-[#009e42]/30 dark:border-[#009e42]/20 shadow-[0_0_50px_rgba(0,158,66,0.15)] overflow-hidden relative text-center"
          >
            {/* Elegant Background Glow */}
            <div className="absolute top-0 inset-x-0 h-1 bg-[#009e42]" />
            
            {/* Glowing success circle */}
            <div className="relative mx-auto w-24 h-24 bg-[#009e42]/10 border border-[#009e42]/30 rounded-full flex items-center justify-center mb-8">
              <CheckCircle2 size={40} className="text-[#009e42] animate-pulse" />
              <div className="absolute inset-0 bg-[#009e42]/10 rounded-full blur-xl pointer-events-none" />
            </div>

            <span className="text-[9px] uppercase font-black text-[#009e42] tracking-[0.25em] font-mono">
              Network Authorized
            </span>

            <h2 className="text-3xl font-black italic font-serif leading-tight mt-3 text-slate-900 dark:text-white">
              Investment Approved!
            </h2>

            <p className="text-sm text-slate-600 dark:text-gray-400 max-w-sm mx-auto mt-4 leading-relaxed">
              Congratulations! Your node deployment of <span className="text-[#009e42] font-mono font-bold">{formatCurrency(amount)}</span> on the <span className="text-slate-900 dark:text-white font-semibold uppercase">{planName}</span> pool has been authenticated.
            </p>

            <div className="mt-8 p-6 bg-slate-50 dark:bg-[#009e42]/5 border border-slate-200 dark:border-[#009e42]/10 rounded-3xl max-w-md mx-auto flex flex-col gap-2">
              <div className="flex justify-between items-center py-1">
                <span className="text-xs text-slate-500 dark:text-gray-400 font-bold uppercase tracking-wider">Node Plan</span>
                <span className="text-xs text-slate-900 dark:text-white font-black uppercase font-mono">{planName}</span>
              </div>
              <div className="h-[1px] w-full bg-slate-200 dark:bg-[#009e42]/10" />
              <div className="flex justify-between items-center py-1">
                <span className="text-xs text-slate-500 dark:text-gray-400 font-bold uppercase tracking-wider">Deposited Principal</span>
                <span className="text-xs text-[#009e42] font-black font-mono">{formatCurrency(amount)}</span>
              </div>
            </div>

            <div className="mt-10 max-w-md mx-auto">
              <button
                onClick={handleActivateClick}
                className="w-full py-4 bg-[#009e42] hover:bg-[#02d147] text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-[#009e42]/20 border border-[#009e42]/10 hover:scale-[1.01] active:scale-95 cursor-pointer flex items-center justify-center gap-3"
              >
                Activate Investment <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
