import React, { useState } from 'react';
import { Shield, Lock, Bell, Eye, LogOut, CheckCircle2, ChevronRight, ArrowLeft } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { useParams, useNavigate } from 'react-router-dom';
import PinModal from './PinModal';

export default function Settings() {
  const { user, profile, logout } = useAuth();
  const { tab } = useParams();
  const navigate = useNavigate();
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isResetSent, setIsResetSent] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    setIsUpdating(true);
    try {
      await sendPasswordResetEmail(auth, user.email);
      setIsResetSent(true);
      setTimeout(() => setIsResetSent(false), 5000);
    } catch (e) {
      console.error(e);
      toast.error("Failed to send reset email");
    } finally {
      setIsUpdating(false);
    }
  };

  const togglePushNotifications = async () => {
    if (!user) return;
    const currentStatus = profile?.push_notifications || false;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        push_notifications: !currentStatus
      });
      toast.success(`Push notifications ${!currentStatus ? 'enabled' : 'disabled'}`);
    } catch (e) {
      console.error(e);
      toast.error("Failed to update notification settings");
    }
  };

  const securityItems = [
    { 
      label: "Two-Factor Authentication", 
      icon: Shield, 
      status: "Active", 
      enabled: true 
    },
    { 
      label: "Change Password", 
      icon: Lock, 
      status: "Secured via Hash",
      onClick: handlePasswordReset,
      isLoading: isUpdating
    },
    { 
      label: profile?.transfer_pin ? "Change Transaction PIN" : "Set Transaction PIN", 
      icon: Eye, 
      status: profile?.transfer_pin ? "Configured" : "Not Set",
      onClick: () => setIsPinModalOpen(true)
    },
  ];

  const notificationItems = [
    { 
      label: "Email Alerts", 
      icon: Bell, 
      status: "Active", 
      enabled: true 
    },
    { 
      label: "Push Notifications", 
      icon: Bell, 
      status: profile?.push_notifications ? "Active" : "Inactive",
      enabled: profile?.push_notifications || false,
      onClick: togglePushNotifications
    },
  ];

  if (tab === 'security') {
    return (
      <div className="space-y-8 lg:space-y-12">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigate('/settings')}
            className="flex items-center gap-2 text-aura-muted hover:text-white transition-colors text-xs font-bold uppercase tracking-widest"
          >
            <ArrowLeft size={16} /> Back to Settings
          </button>
        </div>

        <div>
          <h1 className="text-3xl lg:text-5xl font-bold tracking-tight text-white mb-2 italic font-serif uppercase">Security</h1>
          <p className="text-aura-muted text-sm lg:text-base">Manage your institutional node access and identity parameters.</p>
        </div>

        <AnimatePresence>
          {isResetSent && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-4 bg-aura-lime/10 border border-aura-lime/20 rounded-2xl flex items-center gap-3 text-aura-lime"
            >
              <CheckCircle2 size={18} />
              <p className="text-[10px] font-bold uppercase tracking-widest italic font-serif">Check your email to reset password</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {securityItems.map((item, j) => (
              <div 
                key={j} 
                onClick={item.onClick}
                className={cn(
                  "bg-[#11141b] border border-white/5 p-6 rounded-[24px] flex items-center justify-between group hover:border-aura-lime/20 transition-all cursor-pointer",
                  item.isLoading && "opacity-50 pointer-events-none"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-aura-muted group-hover:text-aura-lime transition-colors">
                    <item.icon size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white uppercase tracking-tight">{item.label}</p>
                    <p className="text-[10px] text-aura-muted font-medium uppercase tracking-wider">{item.status}</p>
                  </div>
                </div>
                <div className={cn(
                  "w-10 h-5 rounded-full relative transition-colors",
                  item.enabled === undefined ? "hidden" : (item.enabled ? "bg-aura-lime" : "bg-white/10")
                )}>
                  <div className={cn(
                    "absolute top-1 w-3 h-3 rounded-full transition-all",
                    item.enabled ? "right-1 bg-aura-black" : "left-1 bg-aura-muted"
                  )} />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-8 border-t border-white/5">
            <div className="bg-red-500/5 border border-red-500/10 p-8 rounded-[32px] flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-1 text-center md:text-left">
                <h3 className="text-lg font-black text-white uppercase tracking-tight italic font-serif">Terminate Current Session</h3>
                <p className="text-[10px] font-bold text-red-500/60 uppercase tracking-widest">Instant Security Lockdown</p>
              </div>
              <button 
                onClick={logout}
                className="flex items-center gap-3 px-10 py-5 bg-red-500 hover:bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-red-500/20 transition-all active:scale-[0.98]"
              >
                <LogOut size={16} />
                Logout Now
              </button>
            </div>
          </div>
        </div>

        {/* Verification Banner */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 flex items-center gap-4 transition-colors">
          <div className="p-2.5 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-500">
            <Shield size={20} strokeWidth={3} />
          </div>
          <p className="text-slate-400 text-sm">
            Your <span className="text-blue-500 font-bold">account is verified.</span> You have full access to all platform features.
          </p>
        </div>

        <PinModal 
          isOpen={isPinModalOpen} 
          onClose={() => setIsPinModalOpen(false)}
          mode={profile?.transfer_pin ? 'change' : 'set'}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 lg:space-y-12">
      <div>
        <h1 className="text-3xl lg:text-5xl font-bold tracking-tight text-white mb-2">Settings</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Security Card */}
        <div 
          onClick={() => navigate('/settings/security')}
          className="bg-gradient-to-br from-slate-800 to-slate-950 border border-white/5 p-8 rounded-[40px] flex items-center justify-between group hover:border-aura-lime/50 transition-all cursor-pointer relative overflow-hidden"
        >
          <div className="relative z-10 flex items-center gap-6">
            <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-aura-muted group-hover:text-aura-lime group-hover:bg-aura-lime/10 transition-all">
              <Shield size={28} />
            </div>
            <div>
              <h3 className="text-xl font-black text-white tracking-tight italic font-serif mb-1">Security</h3>
            </div>
          </div>
          <ChevronRight size={20} className="relative z-10 text-aura-muted group-hover:text-aura-lime group-hover:translate-x-2 transition-all" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-aura-lime/5 rounded-full blur-3xl group-hover:bg-aura-lime/10 transition-all" />
        </div>
      </div>

      <div className="space-y-12">
        <div className="space-y-6">
          <h2 className="text-[10px] font-medium uppercase tracking-[0.3em] text-aura-muted border-b border-white/5 pb-4">Notifications</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {notificationItems.map((item, j) => (
              <div 
                key={j} 
                onClick={item.onClick}
                className={cn(
                  "bg-[#11141b] border border-white/5 p-6 rounded-[24px] flex items-center justify-between group hover:border-aura-lime/20 transition-all cursor-pointer",
                )}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-aura-muted group-hover:text-aura-lime transition-colors">
                    <item.icon size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white uppercase tracking-tight">{item.label}</p>
                    <p className="text-[10px] text-aura-muted font-medium uppercase tracking-wider">{item.status}</p>
                  </div>
                </div>
                <div className={cn(
                  "w-10 h-5 rounded-full relative transition-colors",
                  item.enabled === undefined ? "hidden" : (item.enabled ? "bg-aura-lime" : "bg-white/10")
                )}>
                  <div className={cn(
                    "absolute top-1 w-3 h-3 rounded-full transition-all",
                    item.enabled ? "right-1 bg-aura-black" : "left-1 bg-aura-muted"
                  )} />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

