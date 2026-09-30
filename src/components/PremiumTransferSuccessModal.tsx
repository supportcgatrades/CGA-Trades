import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Mail, Check, X } from 'lucide-react';
import { formatCurrency } from '../lib/utils';

interface PremiumTransferSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  type: 'deposit' | 'investment';
  planName?: string;
  startTime?: number;
}

export default function PremiumTransferSuccessModal({
  isOpen,
  onClose,
  amount,
  type,
  planName,
  startTime: initialStartTime
}: PremiumTransferSuccessModalProps) {
  const [timeLeft, setTimeLeft] = useState<number>(2700); // 45 minutes = 2700 seconds
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    if (!isOpen) return;

    // Use or establish the start time of the countdown
    const storageKey = 'premium_pending_countdown';
    let stored = localStorage.getItem(storageKey);
    let startTimeValue = initialStartTime || Date.now();

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.startTime && !parsed.dismissed) {
          startTimeValue = parsed.startTime;
        } else {
          // If already dismissed or invalid, save the new state
          localStorage.setItem(storageKey, JSON.stringify({
            startTime: startTimeValue,
            amount,
            type,
            planName,
            dismissed: false
          }));
        }
      } catch (e) {
        console.error('Error parsing premium_pending_countdown', e);
      }
    } else {
      localStorage.setItem(storageKey, JSON.stringify({
        startTime: startTimeValue,
        amount,
        type,
        planName,
        dismissed: false
      }));
    }

    const durationMs = 45 * 60 * 1000; // 45 minutes in ms

    const updateTimer = () => {
      const elapsedMs = Date.now() - startTimeValue;
      const remainingSec = Math.max(0, Math.floor((durationMs - elapsedMs) / 1000));
      setTimeLeft(remainingSec);

      // Visual progress bar (goes from 100% down to 0% as timer counts down)
      const pct = Math.min(100, Math.max(0, (remainingSec / 2700) * 100));
      setProgress(pct);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [isOpen, initialStartTime, amount, type, planName]);

  const handleDismiss = () => {
    const storageKey = 'premium_pending_countdown';
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed) {
          parsed.dismissed = true;
          localStorage.setItem(storageKey, JSON.stringify(parsed));
        }
      } catch (e) {
        console.error(e);
      }
    }
    onClose();
  };

  // Format countdown into MM:SS or HH:MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        id="premium-transfer-success-modal"
        className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none"
      >
        <style>{`
          @keyframes orbitDot {
            0% {
              transform: rotate(0deg) translateY(-54px) scale(1);
              opacity: 1;
            }
            40% {
              transform: rotate(144deg) translateY(-54px) scale(0.95);
              opacity: 0.9;
            }
            50% {
              transform: rotate(180deg) translateY(-54px) scale(0);
              opacity: 0;
            }
            75% {
              transform: rotate(270deg) translateY(-54px) scale(0);
              opacity: 0;
            }
            90% {
              transform: rotate(324deg) translateY(-54px) scale(0.85);
              opacity: 0.6;
            }
            100% {
              transform: rotate(360deg) translateY(-54px) scale(1);
              opacity: 1;
            }
          }
          .orbit-dot-1 {
            animation: orbitDot 4s linear infinite;
            animation-delay: 0s;
          }
          .orbit-dot-2 {
            animation: orbitDot 4s linear infinite;
            animation-delay: -1.33s;
          }
          .orbit-dot-3 {
            animation: orbitDot 4s linear infinite;
            animation-delay: -2.66s;
          }
        `}</style>

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 180 }}
          className="relative w-full max-w-md bg-white dark:bg-[#0c0f14] border border-slate-200 dark:border-[#009e42]/20 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden text-center"
        >
          {/* Subtle background overlay glows */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-[#009e42]/5 rounded-full blur-[40px] pointer-events-none" />

          {/* Close X Button in Top Right */}
          <button 
            type="button"
            onClick={handleDismiss}
            className="absolute top-6 right-6 text-slate-400 hover:text-slate-700 dark:text-white/30 dark:hover:text-white/80 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>

          {/* Circular check tick with three rolling dots orbit */}
          <div className="relative mx-auto w-28 h-28 flex items-center justify-center mb-6">
            {/* The dotted circle with 3 rolling dots */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="orbit-dot-1 absolute w-2 h-2 rounded-full bg-[#009e42] shadow-[0_0_10px_#009e42]" />
              <div className="orbit-dot-2 absolute w-2 h-2 rounded-full bg-[#009e42] shadow-[0_0_10px_#009e42]" />
              <div className="orbit-dot-3 absolute w-2 h-2 rounded-full bg-[#009e42] shadow-[0_0_10px_#009e42]" />
            </div>

            {/* Subtle inner static thin border dashed circle */}
            <div className="absolute inset-2 rounded-full border border-dashed border-[#009e42]/20" />

            {/* Glowing success circle containing the checkmark */}
            <div className="w-20 h-20 bg-[#009e42]/10 border border-[#009e42]/30 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(0,158,66,0.1)]">
              <Check size={36} className="text-[#009e42]" strokeWidth={3} />
            </div>
          </div>

          {/* Title Area */}
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
            Transfer <span className="text-[#009e42]">Successful</span>
          </h2>

          {/* Thin horizontal glowing divider with center green dot */}
          <div className="relative flex items-center justify-center my-5 px-12">
            <div className="w-full h-[1px] bg-slate-200 dark:bg-white/10" />
            <div className="absolute w-2 h-2 rounded-full bg-[#009e42] shadow-[0_0_8px_#009e42]" />
          </div>

          {/* Message text */}
          <p className="text-sm text-slate-600 dark:text-gray-300 mb-6 font-medium">
            Your transfer is being processed.
          </p>

          {/* Processing box/bar */}
          <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 flex items-center justify-between mb-4 text-left">
            <div className="flex items-center gap-3">
              <Clock size={18} className="text-[#009e42] shrink-0" />
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">Processing...</p>
                <p className="text-[10px] text-slate-500 dark:text-gray-400 mt-0.5 leading-none">This may take 15 to 45 minutes.</p>
              </div>
            </div>
            {/* The persistent countdown */}
            <span className="text-base font-black font-mono text-[#009e42] tracking-wider shrink-0">
              {formatTime(timeLeft)}
            </span>
          </div>

          {/* Email notify tag */}
          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 dark:text-gray-500 mb-8 font-medium">
            <Mail size={12} className="text-slate-400 dark:text-gray-500" />
            <span>You'll be notified via email once completed.</span>
          </div>

          {/* Progress bar visual aid */}
          <div className="w-full bg-slate-100 dark:bg-white/5 h-1 rounded-full overflow-hidden mb-6">
            <div 
              className="h-full bg-[#009e42] shadow-[0_0_4px_#009e42] transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* OK button */}
          <button
            type="button"
            onClick={handleDismiss}
            className="w-full py-4 bg-[#009e42] hover:bg-[#02d147] text-white font-extrabold uppercase tracking-wider text-xs rounded-2xl transition-all shadow-[0_4px_20px_rgba(0,158,66,0.25)] hover:shadow-[0_4px_25px_rgba(0,158,66,0.4)] active:scale-[0.98] cursor-pointer"
          >
            OK
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
