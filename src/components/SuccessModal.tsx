import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  autoClose?: boolean;
  autoCloseDuration?: number;
}

export default function SuccessModal({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  autoClose = true, 
  autoCloseDuration = 3000 
}: SuccessModalProps) {
  useEffect(() => {
    if (isOpen && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDuration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoClose, autoCloseDuration, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-xl"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-md bg-white dark:bg-[#0a0d17]/95 border border-slate-200 dark:border-white/10 rounded-[28px] p-8 md:p-10 shadow-2xl overflow-hidden text-center backdrop-blur-xl"
          >
            {/* Background Glow */}
            <div className="absolute top-[-25%] left-[-25%] w-[60%] h-[60%] bg-[#009e42]/10 rounded-full blur-[90px] pointer-events-none" />
            <div className="absolute bottom-[-25%] right-[-25%] w-[60%] h-[60%] bg-[#009e42]/10 rounded-full blur-[90px] pointer-events-none" />

            <div className="relative space-y-6">
              {/* Animation Container */}
              <div className="relative w-20 h-20 mx-auto">
                {/* Spinning Loader */}
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-full border-t-2 border-r-2 border-[#009e42]/30"
                />
                
                {/* Check Circle */}
                <motion.div 
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.15, type: "spring", damping: 12 }}
                  className="absolute inset-0 bg-[#009e42] rounded-full flex items-center justify-center shadow-xl shadow-[#009e42]/25"
                >
                  <Check size={36} className="text-white" />
                </motion.div>

                {/* Pulse Effect */}
                <motion.div 
                  animate={{ scale: [1, 1.25, 1], opacity: [0.12, 0, 0.12] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                  className="absolute inset-0 bg-[#009e42] rounded-full"
                />
              </div>

              <div className="space-y-3">
                <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight italic font-serif text-slate-900 dark:text-white">
                  {title}
                </h3>
                <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-[#009e42] to-transparent mx-auto opacity-50" />
                <p className="text-slate-600 dark:text-gray-300 text-xs md:text-sm font-medium leading-relaxed text-center px-2">
                  {message}
                </p>
              </div>

              <button 
                onClick={onClose}
                className="w-full py-4 bg-[#009e42] hover:bg-[#02d147] text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-xl shadow-lg shadow-[#009e42]/20 active:scale-98 transition-all cursor-pointer"
              >
                Continue
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
