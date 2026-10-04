import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, X, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { cn } from '../lib/utils';

interface VerificationPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify?: () => void;
  message?: string;
  title?: string;
}

export default function VerificationPromptModal({
  isOpen,
  onClose,
  onVerify,
  message,
  title
}: VerificationPromptModalProps) {
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const handleVerify = () => {
    onClose();
    if (onVerify) {
      onVerify();
    } else {
      navigate('/profile');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1400] flex items-center justify-center p-4">
          {/* Subtle blur backdrop - does not cover completely, maintains theme */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 14 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className={cn(
              "relative z-10 w-full max-w-sm rounded-3xl border p-6 text-center shadow-2xl overflow-hidden",
              isDark 
                ? "bg-[#0f131c] border-white/10 text-white" 
                : "bg-white border-slate-200 text-slate-900 shadow-slate-200/50"
            )}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              aria-label="Close"
            >
              <X size={16} />
            </button>

            {/* Icon */}
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[#009e42]/10 border border-[#009e42]/20 text-[#009e42] flex items-center justify-center">
              <ShieldAlert size={28} />
            </div>

            {/* Title & Message */}
            <h3 className="text-base font-black uppercase tracking-tight text-slate-900 dark:text-white mb-2">
              {title || "Verification Required"}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed mb-6">
              {message || "Please complete your account verification to continue."}
            </p>

            {/* Actions */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleVerify}
                className="w-full py-3.5 bg-[#009e42] hover:bg-[#02d147] active:bg-[#008236] text-white font-black uppercase tracking-wider text-xs rounded-xl shadow-lg shadow-[#009e42]/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Verify Account</span>
                <ArrowRight size={14} />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 text-[11px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
              >
                Maybe Later
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
