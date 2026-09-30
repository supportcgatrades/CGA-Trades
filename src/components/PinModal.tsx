import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Lock, 
  ShieldCheck,
  AlertCircle,
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

interface PinModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'set' | 'change';
}

export default function PinModal({ isOpen, onClose, mode }: PinModalProps) {
  const { user, profile } = useAuth();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setPassword('');
      setNewPin('');
      setConfirmPin('');
      setPasswordError(null);
      setPinError(null);
    }
  }, [isOpen]);

  const handleUpdatePin = async () => {
    setPasswordError(null);
    setPinError(null);

    if (newPin !== confirmPin) {
      setPinError("PINs do not match");
      return;
    }
    if (newPin.length < 4) {
      setPinError("PIN must be at least 4 digits");
      return;
    }

    setIsSubmitting(true);
    try {
      // Re-authenticate user
      if (user?.email) {
        const credential = EmailAuthProvider.credential(user.email, password);
        await reauthenticateWithCredential(auth.currentUser!, credential);
      } else {
        throw new Error("User session invalid");
      }

      await updateDoc(doc(db, 'users', user!.uid), {
        transfer_pin: newPin
      });

      toast.success(mode === 'set' ? "Transaction PIN set successfully" : "Transaction PIN updated successfully");
      onClose();
    } catch (e: any) {
      console.error(e);
      if (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') {
        setPasswordError("Incorrect account password");
      } else {
        toast.error("Process failed. Please verify your connection.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-md"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-[340px] bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/10 rounded-[32px] shadow-2xl overflow-hidden"
          >
            <div className="bg-gradient-to-br from-slate-800 to-slate-950 p-6 text-white relative overflow-hidden">
               <div className="relative z-10 flex justify-between items-start">
                  <div className="space-y-0.5">
                    <h2 className="text-xl font-black italic font-serif flex items-center gap-2.5 lowercase">
                      <ShieldCheck className="text-[#009e42]" size={18} /> {mode === 'set' ? 'secue_pin' : 'update_pin'}
                    </h2>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.3em]">Institutional Grade</p>
                  </div>
                  <button 
                    onClick={onClose}
                    className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
                  >
                    <X size={16} />
                  </button>
               </div>
            </div>

            <div className="p-6 space-y-5 bg-white dark:bg-[#0c1017]">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest ml-1">Current Password</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"}
                      placeholder="Account Password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setPasswordError(null);
                      }}
                      className={cn(
                        "w-full bg-slate-50 dark:bg-white/5 border rounded-xl py-3 px-4 text-sm font-bold text-slate-800 dark:text-white outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-gray-500",
                        passwordError ? "border-red-500 bg-red-50/30 text-red-600" : "border-slate-200 dark:border-white/10 focus:border-slate-900 dark:focus:border-white/30"
                      )}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {passwordError && (
                    <div className="flex items-center gap-1 text-red-500 ml-1">
                      <AlertCircle size={8} />
                      <span className="text-[9px] font-bold uppercase tracking-widest">{passwordError}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 text-center pt-1">
                  <label className="text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest ml-1">{mode === 'set' ? 'Initialize' : 'New'} PIN</label>
                  <input 
                    type="password"
                    inputMode="numeric"
                    placeholder="••••"
                    value={newPin}
                    onChange={(e) => {
                      setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6));
                      setPinError(null);
                    }}
                    className={cn(
                      "w-full bg-slate-50 dark:bg-white/5 border rounded-xl py-3 px-4 text-center text-2xl font-bold tracking-[0.4em] text-slate-800 dark:text-white outline-none transition-all",
                      pinError ? "border-red-500 bg-red-50/30 text-red-600" : "border-slate-200 dark:border-white/10 focus:border-slate-900 dark:focus:border-white/30"
                    )}
                  />
                </div>

                <div className="space-y-1.5 text-center">
                  <label className="text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest ml-1">Confirm PIN</label>
                  <input 
                    type="password"
                    inputMode="numeric"
                    placeholder="••••"
                    value={confirmPin}
                    onChange={(e) => {
                      setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6));
                      setPinError(null);
                    }}
                    className={cn(
                      "w-full bg-slate-50 dark:bg-white/5 border rounded-xl py-3 px-4 text-center text-2xl font-bold tracking-[0.4em] text-slate-800 dark:text-white outline-none transition-all",
                      pinError ? "border-red-500 bg-red-50/30 text-red-600" : "border-slate-200 dark:border-white/10 focus:border-slate-900 dark:focus:border-white/30"
                    )}
                  />
                  {pinError && (
                    <p className="text-[9px] font-bold text-red-500 uppercase tracking-widest">{pinError}</p>
                  )}
                </div>
              </div>

              <button 
                disabled={!password || newPin.length < 4 || newPin !== confirmPin || isSubmitting}
                onClick={handleUpdatePin}
                className="w-full py-4 bg-[#009e42] hover:bg-[#02d147] active:bg-[#008236] text-white rounded-xl font-bold uppercase tracking-[0.2em] text-[10px] shadow-lg shadow-[#009e42]/20 transition-all active:scale-[0.98] disabled:opacity-30 cursor-pointer"
              >
                {isSubmitting ? 'Verifying...' : mode === 'set' ? 'Set PIN' : 'Change PIN'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
