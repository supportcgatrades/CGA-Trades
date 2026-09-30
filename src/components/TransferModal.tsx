import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ArrowRightLeft, 
  Wallet, 
  Users, 
  ArrowRight, 
  CheckCircle2, 
  Search, 
  Lock, 
  ShieldCheck,
  AlertCircle,
  CreditCard,
  RefreshCw,
  Unlock,
  LucideIcon
} from 'lucide-react';
import { cn, formatCurrency, formatNumberWithCommas, parseFormattedNumber } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { DynamicBalance } from './DynamicBalance';
import PinProtocolModal from './PinProtocolModal';
import { 
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth';
import { 
  doc, 
  updateDoc, 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  increment,
  runTransaction,
  orderBy,
  limit
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { toast } from 'sonner';
import { logAudit } from '../lib/auth_security';
import { broadcastActivity } from '../lib/activity_logger';

type TransferType = 'internal' | 'user';
type WalletType = 'funding_balance' | 'available_balance' | 'referral_earnings' | 'reward_dollar_balance';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WALLET_NAMES: Record<WalletType, string> = {
  funding_balance: 'Funding Wallet',
  available_balance: 'Available Balance',
  referral_earnings: 'Referral Earnings',
  reward_dollar_balance: 'Reward Wallet'
};

const RECEIVER_WALLET_NAMES: Record<string, string> = {
  funding_balance: 'Funding Wallet',
  available_balance: 'Available Balance',
  total_invested: 'Assets'
};

export default function TransferModal({ isOpen, onClose }: TransferModalProps) {
  const { user, profile } = useAuth();
  const getProfileWalletBalance = (key: WalletType) => {
    if (!profile) return 0;
    if (key === 'reward_dollar_balance') {
      return profile.withdraw_methods?.reward_dollar_balance ?? profile.reward_dollar_balance ?? 0;
    }
    return profile[key] || 0;
  };
  const [step, setStep] = useState<'selection' | 'form' | 'pin-setup' | 'forgot-pin' | 'pin-confirm' | 'success'>('selection');
  const [type, setType] = useState<TransferType>('internal');
  
  // Form States
  const [fromWallet, setFromWallet] = useState<WalletType>('funding_balance');
  const [toWallet, setToWallet] = useState<WalletType>('available_balance');
  const [targetUserId, setTargetUserId] = useState('');
  const [targetUser, setTargetUser] = useState<any>(null);
  const [toReceiverWallet, setToReceiverWallet] = useState<'funding_balance' | 'available_balance' | 'total_invested' | ''>('');
  const [searchError, setSearchError] = useState(false);
  const [amount, setAmount] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
  const [showPinModal, setShowPinModal] = useState(false);

  // Fetch beneficiaries
  useEffect(() => {
    if (user?.uid && profile && isOpen) {
      const fetchBeneficiaries = async () => {
        const path = `users/${user.uid}/beneficiaries`;
        try {
          const q = query(
            collection(db, 'users', user.uid, 'beneficiaries'),
            orderBy('last_transfer', 'desc'),
            limit(5)
          );
          const snap = await getDocs(q);
          setBeneficiaries(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
          console.error("Error fetching beneficiaries:", error);
          const errInfo = {
            error: error instanceof Error ? error.message : String(error),
            operationType: 'list',
            path,
            authInfo: {
              userId: user.uid,
              email: user.email,
              emailVerified: auth.currentUser?.emailVerified,
            }
          };
          console.error('Firestore Error: ', JSON.stringify(errInfo));
        }
      };
      fetchBeneficiaries();
    }
  }, [user?.uid, isOpen]);

  // Real-time user verification
  useEffect(() => {
    const searchUser = async () => {
      if (targetUserId.length === 8) {
        setIsSearching(true);
        setSearchError(false);
        try {
          // Robust lookup: try both string and numeric public_id as requested
          let q = query(collection(db, 'users'), where('public_id', '==', targetUserId));
          let snap = await getDocs(q);
          
          // If not found, try numeric lookup in case of numeric field mismatch
          if (snap.empty) {
            const numericId = parseInt(targetUserId, 10);
            if (!isNaN(numericId)) {
              q = query(collection(db, 'users'), where('public_id', '==', numericId));
              snap = await getDocs(q);
            }
          }

          if (!snap.empty) {
            const foundUser = { id: snap.docs[0].id, ...snap.docs[0].data() } as any;
            
            // Check if user is banned or suspended
            if (foundUser.banned || foundUser.suspended) {
              toast.error("Recipient account is restricted by System Protocol");
              setTargetUser(null);
              setSearchError(true);
              setIsSearching(false);
              return;
            }

            if (foundUser.id === user?.uid) {
              toast.error("You cannot transfer to yourself");
              setTargetUser(null);
              setSearchError(true);
            } else {
              setTargetUser(foundUser);
              setSearchError(false);
              setToReceiverWallet('');
            }
          } else {
            setTargetUser(null);
            setSearchError(true);
          }
        } catch (e) {
          console.error(e);
          setSearchError(true);
        } finally {
          setIsSearching(false);
        }
      } else {
        setTargetUser(null);
        setSearchError(false);
      }
    };

    searchUser();
  }, [targetUserId, user?.uid]);
  
  // UI Feedback
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setStep('selection');
      setAmount('');
      setTargetUserId('');
      setTargetUser(null);
      setToReceiverWallet('');
      setSearchError(false);
    }
  }, [isOpen]);

  const executeTransfer = async (pin: string) => {
    if (pin !== profile?.transfer_pin) {
      toast.error("Invalid Transfer PIN");
      return;
    }

    const amountNum = parseFormattedNumber(amount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    if (type === 'internal' && fromWallet === toWallet) {
      toast.error("Select different wallets");
      return;
    }

    if (type === 'user' && !toReceiverWallet) {
      toast.error("Please select a destination wallet");
      return;
    }

    const currentBalance = getProfileWalletBalance(fromWallet);
    if (amountNum > currentBalance) {
      toast.error("Insufficient balance");
      return;
    }

    setIsSubmitting(true);
    try {
      if (profile?.suspended || profile?.banned) {
        throw new Error("Account restricted by System Protocol.");
      }
      if (profile?.transfers_frozen) {
        throw new Error("Asset transfer protocol is currently frozen for this account.");
      }

      await runTransaction(db, async (transaction) => {
        const senderRef = doc(db, 'users', user!.uid);
        const senderSnap = await transaction.get(senderRef);
        
        if (!senderSnap.exists()) {
          throw new Error("Sender profile not found");
        }

        const senderData = senderSnap.data();
        const senderBalance = fromWallet === 'reward_dollar_balance'
          ? (senderData.withdraw_methods?.reward_dollar_balance ?? senderData.reward_dollar_balance ?? 0)
          : (senderData[fromWallet] || 0);

        if (senderBalance < amountNum) {
          throw new Error("Insufficient balance");
        }
        
        // Ensure precise balance deduction especially for full transfers
        // If the user is transferring their total balance, we set it to 0 explicitly to avoid floating point issues
        const isFullTransfer = Math.abs(senderBalance - amountNum) < 0.0000001;
        const actualDeduction = isFullTransfer ? -senderBalance : -amountNum;

        if (type === 'internal') {
          const updates: any = {};
          if (fromWallet === 'reward_dollar_balance') {
            const existingWithdrawMethods = senderData.withdraw_methods || {};
            const oldRewardDollarBalance = existingWithdrawMethods.reward_dollar_balance ?? senderData.reward_dollar_balance ?? 0;
            updates.withdraw_methods = {
              ...existingWithdrawMethods,
              reward_dollar_balance: oldRewardDollarBalance + actualDeduction
            };
          } else {
            updates[fromWallet] = increment(actualDeduction);
          }

          if (toWallet === 'reward_dollar_balance') {
            const existingWithdrawMethods = updates.withdraw_methods || senderData.withdraw_methods || {};
            const oldRewardDollarBalance = existingWithdrawMethods.reward_dollar_balance ?? senderData.reward_dollar_balance ?? 0;
            updates.withdraw_methods = {
              ...existingWithdrawMethods,
              reward_dollar_balance: oldRewardDollarBalance + amountNum
            };
          } else {
            updates[toWallet] = increment(amountNum);
          }

          transaction.update(senderRef, updates);

          const txRef = doc(collection(db, 'transactions'));
          transaction.set(txRef, {
            user_id: user!.uid,
            type: 'transfer',
            type_detail: 'internal_transfer',
            amount: amountNum,
            from_wallet: fromWallet,
            to_wallet: toWallet,
            status: 'completed',
            created_at: new Date().toISOString()
          });
        } else {
          const receiverRef = doc(db, 'users', targetUser.id);
          const receiverSnap = await transaction.get(receiverRef);

          if (!receiverSnap.exists()) {
            throw new Error("Recipient no longer exists");
          }
          
          if (fromWallet === 'reward_dollar_balance') {
            const existingWithdrawMethods = senderData.withdraw_methods || {};
            const oldRewardDollarBalance = existingWithdrawMethods.reward_dollar_balance ?? senderData.reward_dollar_balance ?? 0;
            transaction.update(senderRef, {
              withdraw_methods: {
                ...existingWithdrawMethods,
                reward_dollar_balance: oldRewardDollarBalance + actualDeduction
              }
            });
          } else {
            transaction.update(senderRef, {
              [fromWallet]: increment(actualDeduction)
            });
          }

          if (!toReceiverWallet) {
            throw new Error("Receiver destination wallet must be selected");
          }

          transaction.update(receiverRef, {
            [toReceiverWallet]: increment(amountNum)
          });

          // Save to beneficiaries subcollection
          const beneficiaryRef = doc(db, 'users', user!.uid, 'beneficiaries', targetUser.id);
          transaction.set(beneficiaryRef, {
            name: targetUser.name,
            username: targetUser.username,
            photoURL: targetUser.photoURL || null,
            public_id: targetUser.public_id,
            last_transfer: new Date().toISOString()
          }, { merge: true });

          const txSenderRef = doc(collection(db, 'transactions'));
          transaction.set(txSenderRef, {
            user_id: user!.uid,
            type: 'transfer',
            type_detail: 'internal_transfer',
            amount: amountNum,
            sender_id: user!.uid,
            sender_wallet: fromWallet,
            from_wallet: fromWallet,
            receiver_id: targetUser.id,
            receiver_public_id: targetUser.public_id,
            receiver_name: targetUser.name,
            receiver_destination_wallet: toReceiverWallet,
            to_wallet: toReceiverWallet,
            status: 'completed',
            created_at: new Date().toISOString()
          });

          const txReceiverRef = doc(collection(db, 'transactions'));
          transaction.set(txReceiverRef, {
            user_id: targetUser.id,
            type: 'transfer',
            type_detail: 'internal_transfer',
            amount: amountNum,
            sender_id: user!.uid,
            sender_public_id: profile?.public_id,
            sender_name: profile?.name,
            destination_wallet: toReceiverWallet,
            to_wallet: toReceiverWallet,
            status: 'completed',
            created_at: new Date().toISOString()
          });

          const targetWalletName = RECEIVER_WALLET_NAMES[toReceiverWallet] || 'your wallet';
          const senderWalletName = WALLET_NAMES[fromWallet] || 'your wallet';

          const notifRef = doc(collection(db, 'notifications'));
          transaction.set(notifRef, {
            user_id: targetUser.id,
            sender_id: user!.uid,
            title: 'Transfer Received',
            message: `You received ${formatCurrency(amountNum)} from ${profile?.name} into your ${targetWalletName}`,
            type: 'success',
            read: false,
            created_at: new Date().toISOString()
          });

          const senderNotifRef = doc(collection(db, 'notifications'));
          transaction.set(senderNotifRef, {
            user_id: user!.uid,
            title: 'Transfer Sent',
            message: `Successfully sent ${formatCurrency(amountNum)} from your ${senderWalletName} to ${targetUser.name}'s ${targetWalletName}`,
            type: 'success',
            read: false,
            created_at: new Date().toISOString()
          });
        }
      });

      // Security Audit Log for Large Transfers or Monitoring
      await logAudit(user!.uid, 'asset_transfer_executed', {
        amount: amountNum,
        type: type,
        recipient: type === 'user' ? targetUser?.public_id : 'self',
        wallet: fromWallet
      });

      setStep('success');
      if (type === 'user') {
        broadcastActivity(
          profile?.name || "Client",
          "Transferred Assets",
          `$${amountNum.toLocaleString()}`,
          true,
          "💸"
        );
      }
    } catch (e: any) {
      console.error("Critical Transfer Error:", e);
      // Detailed logging for diagnosis as per instructions
      const errInfo = {
        error: e.message || String(e),
        code: e.code,
        sender_uid: user?.uid,
        receiver_uid: type === 'user' ? (targetUser?.id || 'unknown') : user?.uid,
        transfer_type: type,
        from_wallet: fromWallet,
        to_wallet: toWallet,
        receiver_destination_wallet: toReceiverWallet,
        amount: amount,
        timestamp: new Date().toISOString()
      };
      console.error("DIAGNOSTIC LOG (EXACT PATH DIAGNOSIS):", JSON.stringify(errInfo));
      
      const msg = e.message === "Insufficient balance" ? "Insufficient balance" : "Transfer failed: " + (e.message?.includes('permission') ? "Authorization Protocol Reject" : "Security Protocol Active");
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderContent = () => {
    switch (step) {
      case 'selection':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <SelectionCard 
                icon={RefreshCw}
                title="Internal Transfer"
                description="Move Funds between Your Own Wallet"
                onClick={() => {
                  setType('internal');
                  setStep('form');
                }}
                color="bg-blue-500"
              />
              <SelectionCard 
                icon={Users}
                title="User Transfer"
                description="Send Funds between InvestPro Users"
                onClick={() => {
                  setType('user');
                  setStep('form');
                }}
                color="bg-purple-500"
              />
            </div>
          </div>
        );

      case 'form':
        return (
          <div className="space-y-6 pt-4">
            <button 
              onClick={() => setStep('selection')}
              className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2 hover:text-[#009e42] transition-colors cursor-pointer"
            >
              <RefreshCw size={12} /> Change Method
            </button>

            <div className="space-y-4">
              {type === 'internal' ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">From Wallet</label>
                      <select 
                        value={fromWallet}
                        onChange={(e) => setFromWallet(e.target.value as WalletType)}
                        className="w-full bg-slate-50 dark:bg-[#131720] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-white outline-none focus:border-[#009e42]"
                      >
                        {Object.entries(WALLET_NAMES).map(([key, name]) => (
                          <option key={key} value={key} className="bg-white dark:bg-[#131720] text-slate-800 dark:text-white">{name} ({formatCurrency(getProfileWalletBalance(key as WalletType))})</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">To Wallet</label>
                      <select 
                        value={toWallet}
                        onChange={(e) => setToWallet(e.target.value as WalletType)}
                        className="w-full bg-slate-50 dark:bg-[#131720] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-white outline-none focus:border-blue-500"
                      >
                        {Object.entries(WALLET_NAMES).map(([key, name]) => (
                          <option key={key} value={key} className="bg-white dark:bg-[#131720] text-slate-800 dark:text-white">{name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Amount to Transfer</label>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Balance:</span>
                        <div className="w-24 h-4">
                            <DynamicBalance 
                                value={fromWallet ? formatCurrency(getProfileWalletBalance(fromWallet)) : "$0"} 
                                containerClassName="justify-start"
                                className="text-left"
                                baseSizeMobile="text-[9px]"
                                baseSizeDesktop="lg:text-[10px]"
                            />
                        </div>
                      </div>
                    </div>
                    <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                      <input 
                        type="text"
                        inputMode="decimal"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(formatNumberWithCommas(e.target.value, true))}
                        className="w-full bg-slate-50 dark:bg-[#131720] border border-slate-200 dark:border-white/10 rounded-2xl py-4 pl-10 pr-16 text-xl font-bold text-slate-800 dark:text-white outline-none focus:border-blue-500 transition-all placeholder:text-slate-400"
                      />
                      <button 
                        type="button"
                        onClick={() => {
                          const balance = getProfileWalletBalance(fromWallet);
                          setAmount(formatNumberWithCommas(balance.toFixed(2)));
                        }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-blue-600 dark:text-blue-400 hover:text-blue-700 bg-blue-50 dark:bg-blue-500/10 px-2.5 py-1.5 rounded-lg transition-all active:scale-95 cursor-pointer"
                      >
                        MAX
                      </button>
                      {amount && parseFormattedNumber(amount) > getProfileWalletBalance(fromWallet) && (
                        <div className="absolute -bottom-6 left-0 flex items-center gap-1.5 text-red-500">
                          <AlertCircle size={10} />
                          <span className="text-[9px] font-bold uppercase tracking-widest">Insufficient funds</span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Recipient User ID</label>
                      {searchError && (
                         <span className="text-[10px] font-bold text-red-500 uppercase tracking-[0.1em] animate-pulse">User not found</span>
                      )}
                    </div>
                    <div className="relative">
                      <Search className={cn(
                        "absolute left-4 top-1/2 -translate-y-1/2 transition-colors",
                        targetUser ? "text-green-500" : searchError ? "text-red-500" : "text-slate-400"
                      )} size={16} />
                      <input 
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={8}
                        placeholder="Enter 8-digit ID"
                        value={targetUserId}
                        onChange={(e) => setTargetUserId(e.target.value.replace(/\D/g, '').slice(0, 8))}
                        className={cn(
                          "w-full bg-slate-50 dark:bg-[#131720] border rounded-xl py-3.5 pl-12 pr-4 text-sm font-bold text-slate-800 dark:text-white outline-none transition-all placeholder:text-slate-400",
                          targetUser ? "border-[#009e42] bg-[#009e42]/5" : 
                          (targetUserId.length === 8 && searchError) ? "border-red-500 bg-red-50/30 dark:bg-red-950/20" : 
                          "border-slate-200 dark:border-white/10 focus:border-[#009e42]"
                        )}
                      />
                      {isSearching && <div className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-[#009e42]"><RefreshCw size={14} /></div>}
                    </div>

                    {/* Beneficiaries / Recent Suggestions */}
                    {beneficiaries.length > 0 && !targetUser && !searchError && targetUserId.length < 8 && (
                      <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                        <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1 mb-2">Recent Recipients</p>
                        <div className="flex flex-wrap gap-2">
                          {beneficiaries.map((ben) => (
                            <button
                              key={ben.id}
                              onClick={() => setTargetUserId(ben.public_id)}
                              className="px-3 py-1.5 bg-slate-50 dark:bg-[#131720] hover:bg-[#009e42]/5 border border-slate-200 dark:border-white/10 hover:border-[#009e42]/30 rounded-lg transition-all flex items-center gap-2 group cursor-pointer"
                            >
                              <div className="w-5 h-5 rounded-full bg-[#009e42]/10 flex items-center justify-center text-[10px] font-black text-[#009e42]">
                                {ben.name.charAt(0)}
                              </div>
                              <div className="text-left">
                                <p className="text-[10px] font-bold text-slate-800 dark:text-white leading-none">{ben.name}</p>
                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">ID: {ben.public_id}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {targetUserId.length > 0 && targetUserId.length < 8 && (
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Waiting for 8 digits...</p>
                    )}
                  </div>
                  
                  {targetUser && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="space-y-4 pt-2"
                    >
                      <div className="bg-green-50/50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/30 rounded-2xl p-4 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full border-2 border-white dark:border-slate-800 shadow-sm overflow-hidden bg-white">
                          <img 
                            src={targetUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${targetUser.username}`} 
                            alt="Recipient" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-1">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">{targetUser.name}</h4>
                            <ShieldCheck size={14} className="text-green-500" />
                          </div>
                          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">@{targetUser.username} • {targetUser.public_id}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Send From</label>
                        <select 
                          value={fromWallet}
                          onChange={(e) => setFromWallet(e.target.value as WalletType)}
                          className="w-full bg-slate-50 dark:bg-[#131720] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-white outline-none focus:border-[#009e42]"
                        >
                          {Object.entries(WALLET_NAMES).map(([key, name]) => (
                            <option key={key} value={key} className="bg-white dark:bg-[#131720] text-slate-800 dark:text-white">{name} ({formatCurrency(getProfileWalletBalance(key as WalletType))})</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Destination Wallet</label>
                        <select 
                          value={toReceiverWallet}
                          onChange={(e) => setToReceiverWallet(e.target.value as any)}
                          className="w-full bg-slate-50 dark:bg-[#131720] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-white outline-none focus:border-[#009e42]"
                        >
                          <option value="" className="bg-white dark:bg-[#131720] text-slate-800 dark:text-white">-- Select Destination Wallet --</option>
                          <option value="funding_balance" className="bg-white dark:bg-[#131720] text-slate-800 dark:text-white">Funding Wallet</option>
                          <option value="available_balance" className="bg-white dark:bg-[#131720] text-slate-800 dark:text-white">Available Balance</option>
                          <option value="total_invested" className="bg-white dark:bg-[#131720] text-slate-800 dark:text-white">Assets</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center px-1">
                          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Amount to Transfer</label>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-bold text-[#009e42] uppercase tracking-widest">Balance:</span>
                            <div className="w-24 h-4">
                                <DynamicBalance 
                                    value={fromWallet ? formatCurrency(getProfileWalletBalance(fromWallet)) : "$0"} 
                                    containerClassName="justify-start"
                                    className="text-left"
                                    baseSizeMobile="text-[9px]"
                                    baseSizeDesktop="lg:text-[10px]"
                                />
                            </div>
                          </div>
                        </div>
                        <div className="relative">
                          <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                          <input 
                            type="text"
                            inputMode="decimal"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(formatNumberWithCommas(e.target.value, true))}
                            className="w-full bg-slate-50 dark:bg-[#131720] border border-slate-200 dark:border-white/10 rounded-2xl py-4 pl-10 pr-16 text-xl font-bold text-slate-800 dark:text-white outline-none focus:border-blue-500 transition-all placeholder:text-slate-400"
                          />
                          <button 
                            type="button"
                            onClick={() => {
                              const balance = getProfileWalletBalance(fromWallet);
                              setAmount(formatNumberWithCommas(balance.toFixed(2)));
                            }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-blue-600 dark:text-blue-400 hover:text-blue-700 bg-blue-50 dark:bg-blue-500/10 px-2.5 py-1.5 rounded-lg transition-all active:scale-95 cursor-pointer"
                          >
                            MAX
                          </button>
                          {amount && parseFormattedNumber(amount) > getProfileWalletBalance(fromWallet) && (
                            <div className="absolute -bottom-6 left-0 flex items-center gap-1.5 text-red-500">
                              <AlertCircle size={10} />
                              <span className="text-[9px] font-bold uppercase tracking-widest">Insufficient funds</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
            </div>

            <button 
              disabled={!amount || parseFormattedNumber(amount) <= 0 || parseFormattedNumber(amount) > getProfileWalletBalance(fromWallet) || (type === 'user' && (!targetUser || !toReceiverWallet))}
              onClick={() => setShowPinModal(true)}
              className="w-full py-4.5 bg-[#009e42] hover:bg-[#02d147] active:bg-[#008236] text-white rounded-2xl font-bold uppercase tracking-[0.2em] text-xs shadow-xl shadow-[#009e42]/20 disabled:grayscale disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-[0.98] mt-4 cursor-pointer"
            >
              Continue to PIN
            </button>
          </div>
        );

      case 'success':
        return (
          <div className="text-center py-2 space-y-6">
            <div className="relative">
              <motion.div 
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", damping: 12, stiffness: 200 }}
                className="w-16 h-16 bg-[#009e42] rounded-2xl flex items-center justify-center text-white mx-auto shadow-xl shadow-[#009e42]/20"
              >
                <CheckCircle2 size={32} />
              </motion.div>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-24 bg-[#009e42]/10 rounded-full blur-2xl -z-10" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Success</h3>
              <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">Transaction Verified</p>
            </div>

            <div className="bg-slate-50 dark:bg-[#131720] border border-slate-200 dark:border-white/10 rounded-2xl p-4 space-y-2 text-left">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-white/10 pb-2">
                <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase">Amount</span>
                <span className="text-xs font-black text-slate-900 dark:text-white tracking-tight">{formatCurrency(parseFormattedNumber(amount) || 0)}</span>
              </div>
              {type === 'internal' ? (
                <>
                  <div className="flex justify-between items-center border-b border-slate-200 dark:border-white/10 pb-2 pt-1">
                    <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase">From</span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{WALLET_NAMES[fromWallet]}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-200 dark:border-white/10 pb-2 pt-1">
                    <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase">To</span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{WALLET_NAMES[toWallet]}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between items-center border-b border-slate-200 dark:border-white/10 pb-2 pt-1">
                    <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase">From</span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{WALLET_NAMES[fromWallet]}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-200 dark:border-white/10 pb-2 pt-1">
                    <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase">Recipient</span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{targetUser?.name} ({targetUser?.public_id})</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-200 dark:border-white/10 pb-2 pt-1">
                    <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase">Destination Wallet</span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{RECEIVER_WALLET_NAMES[toReceiverWallet] || toReceiverWallet}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between items-center pt-1">
                <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">Status</span>
                <span className="text-[9px] font-black text-[#009e42] uppercase tracking-widest">Completed</span>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="w-full py-3.5 bg-[#009e42] hover:bg-[#02d147] active:bg-[#008236] text-white rounded-xl font-bold uppercase tracking-[0.2em] text-[10px] shadow-lg shadow-[#009e42]/20 transition-all active:scale-[0.98] cursor-pointer"
            >
              Done
            </button>
          </div>
        );
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 lg:p-0 overflow-y-auto transition-all duration-500">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-md"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={cn(
              "relative bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden transition-all duration-500",
              step === 'success' ? "w-full max-w-[280px] rounded-3xl" : 
              "w-full max-w-[380px] rounded-2xl"
            )}
          >
            {/* Header */}
            {step !== 'success' && (
              <div className={cn(
                "bg-gradient-to-r from-blue-600 to-indigo-600 relative overflow-hidden",
                "p-5"
              )}>
                <div className="relative z-10 flex justify-between items-center">
                  <div className="space-y-0.5">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <ArrowRightLeft className="text-blue-200" size={16} /> Transfer
                    </h2>
                    <p className="text-[10px] font-medium text-blue-100/80 leading-none">
                      Choose how you want to move your funds
                    </p>
                  </div>
                  <button 
                    onClick={onClose}
                    className="p-1.5 bg-white/10 hover:bg-white/20 rounded-xl transition-all text-white cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />
              </div>
            )}

            {/* Body */}
            <div className={cn(
              "bg-white dark:bg-[#0c1017] transition-all duration-500",
              step === 'success' ? "p-6" : 
              "p-5"
            )}>
              {renderContent()}
            </div>
          </motion.div>
        </div>
      )}
      
      {showPinModal && (
        <PinProtocolModal 
          isOpen={showPinModal}
          onClose={() => setShowPinModal(false)}
          onSuccess={(pin) => {
            setShowPinModal(false);
            executeTransfer(pin);
          }}
          isSubmitting={isSubmitting}
        />
      )}
    </AnimatePresence>
  );
}

function SelectionCard({ icon: Icon, title, description, onClick, color }: { icon: LucideIcon, title: string, description: string, onClick: () => void, color: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "p-4 border border-slate-200 dark:border-white/10 rounded-2xl text-left group hover:border-blue-500/30 hover:bg-slate-50 dark:hover:bg-white/5 transition-all active:scale-[0.98] cursor-pointer",
        "flex flex-row items-center gap-4 w-full"
      )}
    >
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md", color)}>
        <Icon size={18} />
      </div>
      <div className="space-y-0.5 flex-1 min-w-0">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          {title} <ArrowRight size={12} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-blue-500" />
        </h4>
        <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 leading-normal">
          {description}
        </p>
      </div>
    </button>
  );
}
