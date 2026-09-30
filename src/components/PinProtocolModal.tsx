import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Lock, 
  ShieldCheck,
  AlertCircle,
  Unlock,
  RefreshCw,
  CheckCircle2,
  Eye,
  EyeOff
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { 
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth';
import { 
  doc, 
  updateDoc
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { toast } from 'sonner';

interface PinProtocolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (pin: string) => void;
  isSubmitting?: boolean;
}

export default function PinProtocolModal({ isOpen, onClose, onSuccess, isSubmitting: parentSubmitting }: PinProtocolModalProps) {
  const { user, profile } = useAuth();
  const [step, setStep] = useState<'entry' | 'setup-init' | 'setup-confirm' | 'forgot-pin'>('entry');
  
  // States
  const [pinEntry, setPinEntry] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  
  // Feedback
  const [isShake, setIsShake] = useState(false);
  const [isPinValid, setIsPinValid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localSubmitting, setLocalSubmitting] = useState(false);

  const isSubmitting = parentSubmitting || localSubmitting;

  // Determination logic
  useEffect(() => {
    if (isOpen) {
      if (!profile?.transfer_pin) {
        setStep('setup-init');
      } else {
        setStep('entry');
      }
      // Reset states
      setPinEntry('');
      setPassword('');
      setNewPin('');
      setConfirmPin('');
      setError(null);
      setIsShake(false);
      setIsPinValid(false);
    }
  }, [isOpen, profile]);

  const handleEntryTrigger = (pin: string) => {
    if (pin.length === (profile?.transfer_pin?.length || 4)) {
      if (pin === profile?.transfer_pin) {
        setIsPinValid(true);
        setTimeout(() => {
          onSuccess(pin);
        }, 500);
      } else {
        setIsShake(true);
        toast.error("Invalid Security PIN");
        setTimeout(() => {
          setIsShake(false);
          setPinEntry('');
        }, 500);
      }
    }
  };

  const handleSetup = async () => {
    setError(null);
    if (newPin !== confirmPin) {
      setError("PINs do not match");
      return;
    }
    if (newPin.length < 4) {
      setError("PIN must be at least 4 digits");
      return;
    }

    setLocalSubmitting(true);
    try {
      // Re-authenticate
      if (user?.email) {
        const credential = EmailAuthProvider.credential(user.email, password);
        await reauthenticateWithCredential(auth.currentUser!, credential);
      } else {
        throw new Error("Session Invalid");
      }

      await updateDoc(doc(db, 'users', user!.uid), {
        transfer_pin: newPin
      });

      toast.success("Security PIN synchronized");
      // After setup, proceed to use the PIN
      setTimeout(() => {
        onSuccess(newPin);
      }, 500);
    } catch (e: any) {
      console.error(e);
      if (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') {
        setError("Invalid Account Password");
      } else {
        toast.error("Protocol Sync Failed");
      }
    } finally {
      setLocalSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[2000] flex items-end justify-center">
          {/* Transparent Backdrop that fades to exactly 18% opacity */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.18 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80" 
            onClick={onClose} 
          />
          
          {/* Bottom-to-center modal sheet spanning height dynamically */}
          <motion.div 
            initial={{ y: "110%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "110%", opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 220 }}
            className={cn(
              "relative w-full shadow-2xl overflow-hidden bg-white dark:bg-[#09090e]/95 backdrop-blur-3xl border-t border-x border-slate-200 dark:border-white/10 rounded-t-[32px] sm:rounded-[36px] sm:border-b flex flex-col transition-all duration-300",
              "w-full max-w-[420px] pb-[calc(1.5rem+env(safe-area-inset-bottom))] mb-0 sm:mb-6 px-4 sm:px-6 z-10"
            )}
          >
            {/* iOS style sheet drag handle */}
            <div 
              className="w-12 h-1 rounded-full bg-slate-300 dark:bg-white/15 mx-auto mt-4 shrink-0 cursor-pointer hover:bg-slate-400 dark:hover:bg-white/25 transition-colors" 
              onClick={onClose} 
            />

            {/* Header for non-entry screens */}
            {step !== 'entry' && (
              <div className="p-4 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50/50 dark:bg-white/[0.01]">
                <div className="flex items-center gap-2">
                   <ShieldCheck className="text-[#009e42]" size={16} />
                   <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Security Protocol</h3>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg text-slate-400 hover:text-slate-900 dark:text-white/40 dark:hover:text-white transition-colors">
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Interior content block without scrollbars */}
            <div className="flex-1 p-2 sm:p-4 text-slate-900 dark:text-white select-none">
              {step === 'entry' ? (
                <div className="space-y-4 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <div className="w-8" /> {/* Spacer to align title beautifully */}
                      <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                        <motion.span animate={isPinValid ? { rotateY: 360, scale: [1, 1.2, 1] } : {}} transition={{ duration: 0.5 }}>
                          {isPinValid ? <CheckCircle2 size={16} className="text-[#009e42]" /> : <Lock size={16} className="text-[#009e42] animate-pulse" />}
                        </motion.span>
                        Enter Payment Pin
                      </h3>
                      <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full text-slate-400 hover:text-slate-900 dark:text-white/40 dark:hover:text-white transition-colors">
                        <X size={16} />
                      </button>
                    </div>

                    {/* PIN Entries / Bubbles Indicator */}
                    <motion.div 
                      className="flex justify-center gap-3 mb-5"
                      animate={isShake ? { x: [-8, 8, -6, 6, -3, 3, 0] } : {}}
                      transition={{ duration: 0.4 }}
                    >
                      {[...Array(profile?.transfer_pin?.length || 4)].map((_, i) => (
                        <div 
                          key={i} 
                          className={cn(
                            "w-12 h-12 rounded-xl border flex items-center justify-center transition-all duration-300 shadow-sm",
                            pinEntry.length > i 
                              ? (isShake 
                                  ? "border-red-500 bg-red-500/10 shadow-[0_0_12px_rgba(239,68,68,0.25)]" 
                                  : "border-[#009e42] bg-[#009e42]/10 shadow-[0_0_12px_rgba(0,158,66,0.3)]") 
                              : "border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/[0.01]"
                          )}
                        >
                          <motion.div 
                            animate={{ scale: pinEntry.length > i ? 1.2 : 0 }}
                            className={cn("w-3 h-3 rounded-full shadow-inner", isShake ? "bg-red-500" : "bg-[#009e42]")} 
                          />
                        </div>
                      ))}
                    </motion.div>
                  </div>

                  {/* Keypad Buttons - Compact, centered, extremely premium, rounded */}
                  <div className="grid grid-cols-3 gap-3.5 max-w-[280px] sm:max-w-[300px] mx-auto mb-3">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, 'del'].map((num, i) => (
                      <button
                        key={i}
                        disabled={num === ''}
                        onClick={() => {
                          if (num === 'del') {
                            setPinEntry(prev => prev.slice(0, -1));
                          } else if (typeof num === 'number' && pinEntry.length < (profile?.transfer_pin?.length || 4)) {
                            const newVal = pinEntry + num;
                            setPinEntry(newVal);
                            if (newVal.length === (profile?.transfer_pin?.length || 4)) {
                              handleEntryTrigger(newVal);
                            }
                          }
                        }}
                        className={cn(
                          "w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-xl sm:text-2xl font-black transition-all active:scale-90 duration-75 mx-auto",
                          num === '' ? "invisible animate-none pointer-events-none" : "bg-slate-100 text-slate-900 hover:bg-slate-200 active:bg-slate-300 border border-slate-200 dark:bg-white/[0.03] dark:text-white dark:hover:bg-white/[0.08] dark:active:bg-white/15 dark:border-white/5 shadow-sm"
                        )}
                      >
                        {num === 'del' ? <X size={20} className="text-slate-600 dark:text-white/80 stroke-[3px]" /> : num}
                      </button>
                    ))}
                  </div>

                  {/* Pin Recovery & Sync Footer */}
                  <div className="flex flex-col items-center gap-2 pt-1 pb-2 text-center">
                    <button 
                      onClick={() => setStep('forgot-pin')}
                      className="text-[10px] font-black text-slate-500 hover:text-purple-600 dark:text-white/40 dark:hover:text-purple-400 uppercase tracking-widest transition-colors cursor-pointer"
                    >
                      Forgot Security PIN?
                    </button>
                    {isSubmitting && (
                       <div className="flex items-center gap-1.5 opacity-65">
                        <RefreshCw size={11} className="animate-spin text-purple-600 dark:text-purple-400" />
                        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-purple-600 dark:text-purple-400">Authenticating</span>
                       </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4 py-2">
                  <div className="text-center space-y-1.5 mb-2">
                    <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      {step === 'setup-init' ? 'Initialize PIN' : step === 'forgot-pin' ? 'Override Security' : 'Confirm Protocol'}
                    </h4>
                    <p className="text-[9px] font-bold text-slate-500 dark:text-aura-muted uppercase tracking-widest leading-relaxed">
                      Verify account password to {step === 'forgot-pin' ? 'reset' : 'secure'} your node.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-slate-500 dark:text-aura-muted uppercase tracking-widest ml-1">Account Password</label>
                      <div className="relative">
                        <input 
                          type={showPassword ? "text" : "password"}
                          placeholder="Verification Required"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-xl py-2.5 px-3.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-[#009e42] transition-all placeholder:text-slate-400 dark:placeholder:text-white/15"
                        />
                        <button 
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-white/30 dark:hover:text-white/70"
                        >
                          {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-slate-500 dark:text-aura-muted uppercase tracking-widest ml-1">Institutional PIN (4 digits)</label>
                      <input 
                        type="password"
                        inputMode="numeric"
                        placeholder="••••"
                        value={newPin}
                        onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        className="w-full bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-xl py-2.5 px-3.5 text-center text-lg font-black tracking-[0.5em] focus:border-[#009e42] outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-white/15 text-[#009e42]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-slate-500 dark:text-aura-muted uppercase tracking-widest ml-1">Confirm Identity PIN</label>
                      <input 
                        type="password"
                        inputMode="numeric"
                        placeholder="••••"
                        value={confirmPin}
                        onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        className="w-full bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-xl py-2.5 px-3.5 text-center text-lg font-black tracking-[0.5em] focus:border-[#009e42] outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-white/15 text-[#009e42]"
                      />
                    </div>

                    {error && (
                      <div className="flex items-center justify-center gap-1.5 text-red-500 dark:text-red-400 text-[9px] font-bold uppercase tracking-widest py-0.5">
                        <AlertCircle size={10} className="shrink-0 animate-bounce" />
                        {error}
                      </div>
                    )}
                  </div>

                  <div className="pt-1">
                    <button 
                      disabled={!password || newPin.length < 4 || newPin !== confirmPin || isSubmitting}
                      onClick={handleSetup}
                      className="w-full py-3 bg-[#009e42] hover:bg-[#02d147] active:bg-[#008236] text-white rounded-xl font-black uppercase tracking-[0.2em] text-[10px] shadow-lg shadow-[#009e42]/20 transition-all active:scale-[0.98] disabled:opacity-20 cursor-pointer"
                    >
                      {isSubmitting ? 'Verifying Neural Link...' : 'Apply Security Link'}
                    </button>
                    <button onClick={onClose} className="w-full mt-2 text-[8px] font-black text-slate-500 hover:text-slate-700 dark:text-white/40 uppercase tracking-widest dark:hover:text-white/70 transition-colors cursor-pointer">Cancel Override</button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
