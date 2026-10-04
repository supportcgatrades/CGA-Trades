import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { cn } from '../lib/utils';

interface VerificationSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  avatarUrl?: string;
}

export default function VerificationSuccessModal({
  isOpen,
  onClose,
  avatarUrl
}: VerificationSuccessModalProps) {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [animationFinished, setAnimationFinished] = useState(false);

  // Circumference for r=46 is 2 * PI * 46 ≈ 289
  const radius = 46;
  const circumference = 2 * Math.PI * radius;

  const prefersReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (isOpen) {
      if (prefersReduced) {
        setAnimationFinished(true);
        return;
      }
      setAnimationFinished(false);
      const timer = setTimeout(() => {
        setAnimationFinished(true);
      }, 1250);
      return () => clearTimeout(timer);
    }
  }, [isOpen, prefersReduced]);

  const defaultAvatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=nexus';
  const finalAvatar = avatarUrl || defaultAvatar;

  const handleConfirm = () => {
    onClose();
    navigate('/home');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1500] flex items-center justify-center p-4">
          {/* Subtle blur background: ~40% blur (backdrop-blur-[6px]), no solid black overlay, keeps Home readable behind */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/25 dark:bg-black/45 backdrop-blur-[6px]"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className={cn(
              "relative z-10 w-full max-w-xs rounded-3xl border p-7 text-center shadow-2xl overflow-hidden",
              isDark 
                ? "bg-[#0f131c]/95 border-white/10 text-white shadow-black/80" 
                : "bg-white/95 border-slate-200/90 text-slate-900 shadow-slate-200/60"
            )}
          >
          {/* Avatar with Circular Verification Ring */}
          <div className="relative w-28 h-28 mx-auto mb-5 flex items-center justify-center">
            {/* SVG Progress Ring */}
            <svg 
              className="absolute inset-0 w-full h-full -rotate-90 origin-center" 
              viewBox="0 0 104 104"
            >
              {/* Background ring track */}
              <circle
                cx="52"
                cy="52"
                r={radius}
                fill="transparent"
                stroke={isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}
                strokeWidth="3.5"
              />
              {/* Smooth animated progress ring starting from the top */}
              <motion.circle
                cx="52"
                cy="52"
                r={radius}
                fill="transparent"
                stroke="#009e42"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: prefersReduced ? 0 : circumference }}
                animate={{ strokeDashoffset: 0 }}
                transition={{ duration: prefersReduced ? 0 : 1.2, ease: "easeInOut" }}
              />
            </svg>

            {/* Circular Profile Avatar in the Center */}
            <div className="w-20 h-20 rounded-full overflow-hidden p-0.5 border border-slate-200/70 dark:border-white/10 shadow-md bg-slate-100 dark:bg-white/5">
              <img
                src={finalAvatar}
                alt="Profile Avatar"
                className="w-full h-full object-cover rounded-full select-none"
              />
            </div>

            {/* Success Checkmark Badge (Appears when ring animation finishes) */}
            <AnimatePresence>
              {animationFinished && (
                <motion.div
                  initial={{ scale: 0, rotate: -30 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0 }}
                  transition={{ type: "spring", stiffness: 450, damping: 20 }}
                  className="absolute bottom-0 right-1 w-7 h-7 rounded-full bg-[#009e42] text-white flex items-center justify-center shadow-lg border-2 border-white dark:border-[#0f131c]"
                >
                  <Check size={16} strokeWidth={3.5} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Verification Success Text */}
          <div className="min-h-[44px] flex items-center justify-center mb-5">
            <AnimatePresence>
              {animationFinished ? (
                <motion.h3
                  key="verified-text"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="text-base font-bold text-slate-900 dark:text-white text-center leading-snug"
                >
                  Profile verified successfully
                </motion.h3>
              ) : (
                <motion.p
                  key="verifying-text"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-xs text-slate-400 font-bold uppercase tracking-wider"
                >
                  Verifying account...
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Small, clean confirmation button: OK */}
          <div className="h-10 flex items-center justify-center">
            <AnimatePresence>
              {animationFinished && (
                <motion.button
                  type="button"
                  initial={{ opacity: 0, scale: 0.9, y: 4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: 0.05 }}
                  onClick={handleConfirm}
                  className="px-8 py-2.5 bg-[#009e42] hover:bg-[#02d147] active:bg-[#008236] text-white font-black uppercase tracking-wider text-xs rounded-xl shadow-md shadow-[#009e42]/20 transition-all cursor-pointer"
                >
                  OK
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
      )}
    </AnimatePresence>
  );
}
