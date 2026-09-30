import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Cpu, 
  Zap, 
  Calendar, 
  Clock, 
  Flame, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  ChevronRight, 
  Terminal, 
  ShieldCheck, 
  ArrowLeft,
  DollarSign,
  TrendingUp,
  RotateCw,
  Coins,
  Download,
  Info,
  History
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  setDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  runTransaction,
  getDocs
} from 'firebase/firestore';
import { toast } from 'sonner';
import miningHeaderImage from '../assets/images/clean_mining_banner_1781423932393.jpg';
import CyberBackground from './CyberBackground';

const CRYPTO_ADDRESSES = {
  usdt: "TJTym5Qs77hBEr2kEiJPVEQwR4kM2AosSG",
  btc: "bc1p2mw24svf4yg5d6v4lxk5309jlcgcqjdagaefuc0adac9z4ys2p5qfq9t8t"
};

interface MiningMachine {
  id: string;
  name: string;
  price: number;
  hourlyRate: number;
  specs: string[];
  img: string;
  hashrate: string;
  efficiency: string;
}

const PREMIUM_MACHINES: MiningMachine[] = [
  {
    id: "antminer_s23_hyd",
    name: "Antminer S23 Hyd 3U",
    price: 7.02,
    hourlyRate: 45,
    hashrate: "320 TH/s",
    efficiency: "16 J/TH",
    specs: ["Hydro Cooling System", "High-Density Node Integration", "Optimized SHA-256 Engine"],
    img: "https://i.imgur.com/gorNOww.png"
  },
  {
    id: "antminer_s21_xp_hyd",
    name: "Antminer S21 XP Hydro",
    price: 10.34,
    hourlyRate: 70,
    hashrate: "473 TH/s",
    efficiency: "12.5 J/TH",
    specs: ["Extended Phase Cooling", "Pro-Grade Chipsets", "Thermal Dissipation Radiator"],
    img: "https://i.imgur.com/OsQZnYS.png"
  },
  {
    id: "whatsminer_m63s_hyd",
    name: "WhatsMiner M63S Hydro",
    price: 14.62,
    hourlyRate: 95,
    hashrate: "602 TH/s",
    efficiency: "18.5 J/TH",
    specs: ["Triple-Pipe Liquid Intake", "Ultra-Low Ripple Power Unit", "Adaptive Frequency Tuning"],
    img: "https://i.imgur.com/kj4WQjn.png"
  },
  {
    id: "antminer_s21_pro",
    name: "Antminer S21 Pro",
    price: 21.80,
    hourlyRate: 125,
    hashrate: "815 TH/s",
    efficiency: "14.2 J/TH",
    specs: ["High-Volume Dual Air fans", "Bipolar Voltage Control", "AI-Driven Fault Alerts"],
    img: "https://i.imgur.com/sqTEqrB.png"
  },
  {
    id: "whatsminer_m60s",
    name: "WhatsMiner M60S",
    price: 34.98,
    hourlyRate: 170,
    hashrate: "1.1 PH/s",
    efficiency: "13.8 J/TH",
    specs: ["Industrial Heavy Chassis", "Copper-Plated Bus Bars", "Continuous Output Node"],
    img: "https://i.imgur.com/1jeeXSe.png"
  },
  {
    id: "avalon_a1566",
    name: "Avalon A1566",
    price: 55.17,
    hourlyRate: 200,
    hashrate: "1.6 PH/s",
    efficiency: "11.2 J/TH",
    specs: ["Direct-to-Die LiquiFlux", "Platinum 6-Phase Input VRM", "Autonomous Energy-Saver Mode"],
    img: "https://i.imgur.com/OlQGeau.png"
  }
];

interface MachineTheme {
  accentHex: string;
  accentShadow: string;
  accentBg: string;
  buttonBgStart: string;
  buttonBgEnd: string;
  buttonText: string;
  bgStart: string;
  bgEnd: string;
  textAccent: string;
}

const MACHINE_THEMES: Record<string, MachineTheme> = {
  "antminer_s23_hyd": {
    accentHex: "#06b6d4",
    accentShadow: "rgba(6, 182, 212, 0.15)",
    accentBg: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    buttonBgStart: "#06b6d4",
    buttonBgEnd: "#0891b2",
    buttonText: "text-black",
    bgStart: "#091c25",
    bgEnd: "#040810",
    textAccent: "text-cyan-400"
  },
  "antminer_s21_xp_hyd": {
    accentHex: "#10b981",
    accentShadow: "rgba(16, 185, 129, 0.15)",
    accentBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    buttonBgStart: "#10b981",
    buttonBgEnd: "#059669",
    buttonText: "text-black",
    bgStart: "#092218",
    bgEnd: "#040c08",
    textAccent: "text-emerald-400"
  },
  "whatsminer_m63s_hyd": {
    accentHex: "#3b82f6",
    accentShadow: "rgba(59, 130, 246, 0.15)",
    accentBg: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    buttonBgStart: "#3b82f6",
    buttonBgEnd: "#2563eb",
    buttonText: "text-white",
    bgStart: "#09172e",
    bgEnd: "#040712",
    textAccent: "text-blue-400"
  },
  "antminer_s21_pro": {
    accentHex: "#a855f7",
    accentShadow: "rgba(168, 85, 247, 0.15)",
    accentBg: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    buttonBgStart: "#a855f7",
    buttonBgEnd: "#7e22ce",
    buttonText: "text-white",
    bgStart: "#150f24",
    bgEnd: "#07040d",
    textAccent: "text-purple-400"
  },
  "whatsminer_m60s": {
    accentHex: "#f59e0b",
    accentShadow: "rgba(245, 158, 11, 0.15)",
    accentBg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    buttonBgStart: "#f59e0b",
    buttonBgEnd: "#d97706",
    buttonText: "text-black",
    bgStart: "#20170a",
    bgEnd: "#0a0703",
    textAccent: "text-amber-400"
  },
  "avalon_a1566": {
    accentHex: "#f43f5e",
    accentShadow: "rgba(244, 63, 94, 0.15)",
    accentBg: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    buttonBgStart: "#f43f5e",
    buttonBgEnd: "#e11d48",
    buttonText: "text-white",
    bgStart: "#220e13",
    bgEnd: "#0d0507",
    textAccent: "text-rose-400"
  }
};

const speedMap: Record<string, string> = {
  free: '1.4s',
  antminer_s23_hyd: '0.9s',
  antminer_s21_xp_hyd: '0.65s',
  whatsminer_m63s_hyd: '0.45s',
  antminer_s21_pro: '0.3s',
  whatsminer_m60s: '0.18s',
  avalon_a1566: '0.08s',
};

const MiningEngine: React.FC<{
  active: boolean;
  machineId: string;
}> = ({ active, machineId }) => {
  const [imgFailed, setImgFailed] = useState(false);
  const speed = speedMap[machineId] || '1.2s';

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-slate-950/20 backdrop-blur-[0.5px] rounded-2xl z-30 pointer-events-none overflow-hidden">
      {!imgFailed ? (
        <img 
          src="https://i.imgur.com/58L66gB.png" 
          alt="Turbine Engine"
          onError={() => setImgFailed(true)}
          referrerPolicy="no-referrer"
          className="w-16 h-16 sm:w-24 sm:h-24 object-contain transition-all"
          style={{
            transform: 'translate3d(0, 0, 0) rotate(0deg)',
            willChange: 'transform',
            animation: active ? `infinite-spin ${speed} linear infinite` : 'none',
          }}
        />
      ) : (
        <svg 
          viewBox="0 0 100 100" 
          className="w-16 h-16 sm:w-24 sm:h-24 transition-all select-none pointer-events-none"
          style={{
            transform: 'translate3d(0, 0, 0)',
            willChange: 'transform',
            animation: active ? `infinite-spin ${speed} linear infinite` : 'none',
          }}
        >
          {/* Circular outer blade rim */}
          <circle cx="50" cy="50" r="44" stroke="currentColor" strokeWidth="2.5" className="text-slate-400 opacity-20" fill="none" />
          <circle cx="50" cy="50" r="44" stroke="currentColor" strokeWidth="2" strokeDasharray="6 4" className="text-slate-400 opacity-40" fill="none" />
          
          {/* 12 Blades */}
          {[...Array(12)].map((_, i) => (
            <path
              key={i}
              d="M 50 50 L 50 12 C 55 18, 56 34, 50 50"
              transform={`rotate(${i * 30} 50 50)`}
              fill="currentColor"
              className="text-slate-400 opacity-80"
            />
          ))}

          {/* Central hub decoration */}
          <circle cx="50" cy="50" r="14" fill="#0f172a" stroke="currentColor" strokeWidth="2" className="text-slate-400" />
          <circle cx="50" cy="50" r="6" fill="#10b981" />
          <circle cx="50" cy="50" r="2" fill="#fff" />
        </svg>
      )}
    </div>
  );
};

export default function MiningPortal() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  // Navigation handlers
  const handleClose = () => {
    navigate(-1);
  };

  // State lists
  const [freeMiningState, setFreeMiningState] = useState<{
    status: 'idle' | 'active' | 'claimable';
    activated_at: string | null;
    expires_at: string | null;
    claimed: boolean;
  }>({
    status: 'idle',
    activated_at: null,
    expires_at: null,
    claimed: true
  });

  const [premiumStates, setPremiumStates] = useState<Record<string, {
    status: 'active' | 'claimable' | 'idle';
    activated_at: string | null;
    expires_at: string | null;
    claimed: boolean;
  }>>({});

  const [userDeposits, setUserDeposits] = useState<any[]>([]);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
  const [miningTransactions, setMiningTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Active / Selection modals
  const [selectedMachine, setSelectedMachine] = useState<MiningMachine | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [detailMachine, setDetailMachine] = useState<MiningMachine | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  // Payment flow states
  const [payMethod, setPayMethod] = useState<'usdt'>('usdt');
  const [txHash, setTxHash] = useState('');
  const [isSubmittingPay, setIsSubmittingPay] = useState(false);
  const [copiedField, setCopiedField] = useState<'usdt' | 'btc' | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Admin approval popups
  const [showApprovalPopup, setShowApprovalPopup] = useState(false);
  const [approvedMachine, setApprovedMachine] = useState<MiningMachine | null>(null);
  const [seenApprovedDepositIds, setSeenApprovedDepositIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('seen_approved_mining_deps');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Automatically detect approved subscriptions
  useEffect(() => {
    if (userDeposits.length === 0) return;
    const unseenApproved = userDeposits.find(dep => 
      (dep.status === 'approved' || dep.status === 'inactive') && 
      !seenApprovedDepositIds.includes(dep.id)
    );

    if (unseenApproved) {
      const mach = PREMIUM_MACHINES.find(m => m.id === unseenApproved.machine_id);
      if (mach) {
        setApprovedMachine(mach);
        setShowApprovalPopup(true);
        const updated = [...seenApprovedDepositIds, unseenApproved.id];
        setSeenApprovedDepositIds(updated);
        try {
          localStorage.setItem('seen_approved_mining_deps', JSON.stringify(updated));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [userDeposits, seenApprovedDepositIds]);

  // Time tickers for counting
  const [nowTime, setNowTime] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNowTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync data from Firestore
  useEffect(() => {
    if (!user) return;

    setLoading(true);

    // 1. Listen to free mining state inside user devices
    const unsubFree = onSnapshot(doc(db, 'users', user.uid, 'devices', 'mining_free'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setFreeMiningState({
          status: data.status || 'idle',
          activated_at: data.activated_at || null,
          expires_at: data.expires_at || null,
          claimed: data.claimed !== undefined ? data.claimed : true
        });
      } else {
        setFreeMiningState({
          status: 'idle',
          activated_at: null,
          expires_at: null,
          claimed: true
        });
      }
    }, (err) => {
      console.warn("Free mining device listener blocked:", err);
    });

    // 2. Listen to user mining upgrades to determine premium mining subscriptions
    const unsubDep = onSnapshot(
      query(
        collection(db, 'mining_upgrades'),
        where('user_id', '==', user.uid)
      ), 
      (snap) => {
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Sort by created_at desc
        list.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setUserDeposits(list);
      },
      (err) => {
        console.warn("Mining upgrades listener blocked:", err);
      }
    );

    // 3. Listen to premium machine device documents to trace active/claimable clocks
    const unsubPremiumDevices = onSnapshot(
      collection(db, 'users', user.uid, 'devices'),
      (snap) => {
        const states: Record<string, any> = {};
        snap.docs.forEach(doc => {
          if (doc.id.startsWith('mining_active_')) {
            const mId = doc.id.replace('mining_active_', '');
            states[mId] = doc.data();
          }
        });
        setPremiumStates(states);
        setLoading(false);
      },
      (error) => {
        console.error("Failed to load premium device states:", error);
        setLoading(false);
      }
    );

    // 4. Listen to mining-related transactions for the history section
    const unsubMiningTx = onSnapshot(
      query(
        collection(db, 'transactions'),
        where('user_id', '==', user.uid),
        where('type', '==', 'twn_mining_claim')
      ),
      (snap) => {
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMiningTransactions(list);
      },
      (error) => {
        console.error("Failed to load mining transactions:", error);
      }
    );

    return () => {
      unsubFree();
      unsubDep();
      unsubPremiumDevices();
      unsubMiningTx();
    };
  }, [user]);

  // Copy helper
  const handleCopy = (field: 'usdt' | 'btc', val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedField(field);
    toast.success("Address Copied! Paste into your wallet transfer protocol.");
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Compute calculated values for Free Mining
  const isFreeActive = freeMiningState.status === 'active' && freeMiningState.expires_at && new Date(freeMiningState.expires_at).getTime() > nowTime;
  const isFreeClaimable = (freeMiningState.status === 'claimable' || (freeMiningState.status === 'active' && freeMiningState.expires_at && new Date(freeMiningState.expires_at).getTime() <= nowTime)) && !freeMiningState.claimed;

  const freeTimeLeft = isFreeActive && freeMiningState.expires_at ? Math.max(0, Math.floor((new Date(freeMiningState.expires_at).getTime() - nowTime) / 1000)) : 0;
  const freeProgress = isFreeActive && freeMiningState.activated_at && freeMiningState.expires_at
    ? ((nowTime - new Date(freeMiningState.activated_at).getTime()) / (new Date(freeMiningState.expires_at).getTime() - new Date(freeMiningState.activated_at).getTime())) * 100
    : isFreeClaimable ? 100 : 0;

  // Render Time Clean Helper
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Activate Free Mining Operation
  const handleActivateFree = async () => {
    if (!user) return;
    const toastId = toast.loading("Connecting to free mining nodes...");
    try {
      const parentRef = doc(db, 'users', user.uid, 'devices', 'mining_free');
      const now = new Date();
      const expires = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour duration

      await setDoc(parentRef, {
        status: 'active',
        activated_at: now.toISOString(),
        expires_at: expires.toISOString(),
        claimed: false
      });

      toast.success("Free Mining Engine activated successfully!", { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to boot node: " + err.message, { id: toastId });
    }
  };

  // Claim Free Mining Rewards
  const handleClaimFree = async () => {
    if (!user) return;
    const toastId = toast.loading("Processing atomic secure transfer to wallet...");
    try {
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', user.uid);
        const freeRef = doc(db, 'users', user.uid, 'devices', 'mining_free');

        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists()) throw new Error("Profile record not found");

        const freeSnap = await transaction.get(freeRef);
        const freeData = freeSnap.exists() ? freeSnap.data() : null;

        // Double check eligibility
        if (!freeData || freeData.claimed) {
          throw new Error("Already claimed or not active.");
        }

        const currentTwn = userSnap.data().twn_balance || 0;
        
        // Update user's twn balance
        transaction.update(userRef, {
          twn_balance: currentTwn + 20
        });

        // Set free mining state back to idle and claimed
        transaction.set(freeRef, {
          status: 'idle',
          activated_at: null,
          expires_at: null,
          claimed: true
        });

        // Log transaction history
        const txRef = doc(collection(db, 'transactions'));
        transaction.set(txRef, {
          user_id: user.uid,
          user_name: profile?.name || 'User',
          type: 'twn_mining_claim',
          type_detail: 'free_mining_cycle_completed',
          amount: 0,
          twn_amount: 20,
          status: 'approved',
          is_twn_activity: true,
          created_at: new Date().toISOString()
        });

        // Add Notification
        const notifRef = doc(collection(db, 'notifications'));
        transaction.set(notifRef, {
          user_id: user.uid,
          title: 'TWN Tokens Claimed 🪙',
          message: `20.00 TWN successfully harvested and credited to your CGA wallet from your completed Free Mining session.`,
          type: 'info',
          read: false,
          created_at: new Date().toISOString()
        });
      });

      toast.success("20 TWN claimed and deposited directly to your wallet!", { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error("Claim failed: " + err.message, { id: toastId });
    }
  };

  // Find most recent subscription record for a premium machine id
  const getSubRecord = (machId: string) => {
    const activeSub = userDeposits.find(dep => dep.machine_id === machId && (dep.status === 'mining' || dep.status === 'inactive'));
    if (activeSub) return activeSub;

    const pendingSub = userDeposits.find(dep => dep.machine_id === machId && (dep.status === 'pending' || dep.status === 'approved'));
    if (pendingSub) return pendingSub;

    return userDeposits.find(dep => dep.machine_id === machId);
  };

  // Standard interactive actions for each premium machine
  const getMachineState = (mach: MiningMachine) => {
    const sub = getSubRecord(mach.id);
    const devState = premiumStates[mach.id];

    // If no subscription records exist or it's declined/rejected, state is Locked
    if (!sub || sub.status === 'declined' || sub.status === 'rejected') {
      return { status: 'locked', sub, devState };
    }

    // If subscription payment is pending admin validation
    if (sub.status === 'pending') {
      return { status: 'verifying', sub, devState };
    }

    // Approved or active/mining subscriptions!
    if (sub.status === 'approved' || sub.status === 'inactive' || sub.status === 'mining') {
      // If no device state, or it is explicitly marked claimed/idle (meaning ready to run)
      if (!devState || devState.claimed === true || devState.status === 'idle') {
        return { status: 'idle', sub, devState };
      }

      // Checking active clock
      const remSeconds = devState.expires_at ? Math.max(0, Math.floor((new Date(devState.expires_at).getTime() - nowTime) / 1000)) : 0;
      if (remSeconds > 0 && devState.status === 'active') {
        return { status: 'active', sub, devState, remSeconds };
      } else {
        return { status: 'claimable', sub, devState };
      }
    }

    return { status: 'locked', sub, devState };
  };

  // Initiate machine subscription modal
  const handleOpenSubscribe = (mach: MiningMachine) => {
    setSelectedMachine(mach);
    setTxHash('');
    setIsConfirmed(false);
    setShowPayModal(true);
  };

  // Submit payment request
  const handlePaySubmit = async () => {
    if (!user || !selectedMachine) return;
    if (!txHash.trim()) {
      toast.error("Please enter your transaction reference or block hash.");
      return;
    }
    if (!isConfirmed) {
      toast.error("Please confirm your transfer submission using the toggle.");
      return;
    }

    setIsSubmittingPay(true);
    const toastId = toast.loading("Transmitting verification credentials to Mainnet ledger...");
    try {
      const payload = {
        user_id: user.uid,
        username: profile?.username || user.email?.split('@')[0] || 'user',
        user_name: profile?.name || 'User',
        amount: selectedMachine.price,
        machine_price: selectedMachine.price,
        method: payMethod,
        reference: txHash.trim(),
        status: 'pending',
        is_mining_subscription: true,
        machine_id: selectedMachine.id,
        machine_name: selectedMachine.name,
        hourly_rate: selectedMachine.hourlyRate,
        created_at: new Date().toISOString(),
        title: `${selectedMachine.name} ${premiumStates[selectedMachine.id] ? "Upgrade" : "Purchase"}`
      };

      await addDoc(collection(db, 'mining_upgrades'), payload);

      // Create transaction history record with status 'pending' and correct title
      await addDoc(collection(db, 'transactions'), {
        user_id: user.uid,
        user_name: profile?.name || 'User',
        username: profile?.username || user.email?.split('@')[0] || 'user',
        type: 'mining_upgrade',
        amount: selectedMachine.price,
        status: 'pending',
        is_mining_subscription: true,
        machine_id: selectedMachine.id,
        machine_name: selectedMachine.name,
        created_at: new Date().toISOString(),
        title: `${selectedMachine.name} ${premiumStates[selectedMachine.id] ? "Upgrade" : "Purchase"}`
      });

      // Create notification
      await addDoc(collection(db, 'notifications'), {
        user_id: user.uid,
        title: 'Mining Upgrade Requested 🔌',
        message: `Your payment of $${selectedMachine.price} for the ${selectedMachine.name} node has been recorded. Standby for Admin confirmation and slot unlocking.`,
        type: 'info',
        read: false,
        created_at: new Date().toISOString()
      });

      toast.success("Upgrade request logged! Waiting for Admin verification.", { id: toastId });
      setShowPayModal(false);
      setSelectedMachine(null);
      navigate('/fund/transactions');
    } catch (err: any) {
      console.error(err);
      toast.error("Process failed: " + err.message, { id: toastId });
    } finally {
      setIsSubmittingPay(false);
    }
  };

  // Direct layout scrolling & highlighting focus for newly approved machines
  const handleActivateMachineDirect = (machId: string) => {
    setShowApprovalPopup(false);
    setApprovedMachine(null);
    setTimeout(() => {
      const el = document.getElementById(`miner-card-${machId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ring-4', 'ring-[#009e42]', 'ring-offset-4', 'ring-offset-black', 'transition-all', 'duration-500');
        setTimeout(() => {
          el.classList.remove('ring-4', 'ring-[#009e42]', 'ring-offset-4', 'ring-offset-black');
        }, 5000);
      }
    }, 200);
  };

  // Activate High-End Premium Machine
  const handleActivatePremium = async (mach: MiningMachine) => {
    if (!user) return;
    const toastId = toast.loading(`Booting up dedicated ${mach.name} core...`);
    try {
      const devRef = doc(db, 'users', user.uid, 'devices', `mining_active_${mach.id}`);
      const now = new Date();
      const expires = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

      await runTransaction(db, async (transaction) => {
        // Try to update corresponding ticket status from 'inactive' to 'mining'
        const sub = getSubRecord(mach.id);
        if (sub) {
          const subRef = doc(db, 'mining_upgrades', sub.id);
          transaction.update(subRef, {
            status: 'mining',
            activated_at: now.toISOString(),
            updated_at: now.toISOString()
          });
        }

        transaction.set(devRef, {
          machine_id: mach.id,
          status: 'active',
          activated_at: now.toISOString(),
          expires_at: expires.toISOString(),
          claimed: false
        });

        // Post activity update
        const notifRef = doc(collection(db, 'notifications'));
        transaction.set(notifRef, {
          user_id: user.uid,
          title: 'Premium ASIC Miner Online ⚡',
          message: `Your ${mach.name} node is now fully energized and mining at high intensity! Secure claim window opens in exactly 24 hours.`,
          type: 'info',
          read: false,
          created_at: now.toISOString()
        });
      });

      toast.success(`${mach.name} Core is ONLINE! Live hashing stream initiated.`, { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to power on unit: " + err.message, { id: toastId });
    }
  };

  // Claim Premium completed miner rewards
  const handleClaimPremium = async (mach: MiningMachine) => {
    if (!user) return;
    const toastId = toast.loading(`Decrypting mining rewards from ${mach.name} buffer...`);
    try {
      const devState = premiumStates[mach.id];
      if (!devState || devState.claimed) return;

      const totalRewards = mach.hourlyRate * 24; // 24 hours total accumulation

      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', user.uid);
        const devRef = doc(db, 'users', user.uid, 'devices', `mining_active_${mach.id}`);

        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists()) throw new Error("Profile record not found");

        const currentTwn = userSnap.data().twn_balance || 0;

        // 1. Credit wallet TWN
        transaction.update(userRef, {
          twn_balance: currentTwn + totalRewards
        });

        // 2. Mark miner device as claimed & idle
        transaction.set(devRef, {
          machine_id: mach.id,
          status: 'idle',
          activated_at: null,
          expires_at: null,
          claimed: true
        });

        // 3. Find the associated APPROVED subscription record and update its is_mining_subscription to false (or delete/mark processed)
        // so that the user must purchase a NEW subscription rather than reusing the same approved slot.
        const prevSub = getSubRecord(mach.id);
        if (prevSub) {
          const subRef = doc(db, 'mining_upgrades', prevSub.id);
          transaction.update(subRef, {
            status: 'inactive',
            updated_at: new Date().toISOString()
          });
        }

        // 4. Log transaction entry
        const txRef = doc(collection(db, 'transactions'));
        transaction.set(txRef, {
          user_id: user.uid,
          user_name: profile?.name || 'User',
          type: 'twn_mining_claim',
          type_detail: `premium_mining_${mach.id}_completed`,
          amount: 0,
          twn_amount: totalRewards,
          status: 'approved',
          is_twn_activity: true,
          created_at: new Date().toISOString()
        });

        // 5. Add notification
        const notifRef = doc(collection(db, 'notifications'));
        transaction.set(notifRef, {
          user_id: user.uid,
          title: 'ASIC Rewards Disbursed 🔌',
          message: `${totalRewards.toLocaleString()} TWN harvested successfully from completed 24h ${mach.name} mining cycle. Machine status is now Inactive and ready for reactivation.`,
          type: 'info',
          read: false,
          created_at: new Date().toISOString()
        });
      });

      toast.success(`${totalRewards.toLocaleString()} TWN successfully credited into your CGA wallet!`, { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error("HARVEST FAIL: " + err.message, { id: toastId });
    }
  };

  // Summarize core statistics
  const getMiningStats = () => {
    let activeCores = 0;
    let totalPower = "0 TH/s";
    let estHourlyEarnings = 0;

    if (isFreeActive) {
      activeCores += 1;
      estHourlyEarnings += 20;
    }

    PREMIUM_MACHINES.forEach(mach => {
      const state = getMachineState(mach);
      if (state.status === 'active') {
        activeCores += 1;
        estHourlyEarnings += mach.hourlyRate;
      }
    });

    // Make beautiful overall hashrate string
    let th = 0;
    let ph = 0;
    if (isFreeActive) th += 5; // standard free speed
    PREMIUM_MACHINES.forEach(mach => {
      const state = getMachineState(mach);
      if (state.status === 'active') {
        if (mach.hashrate.includes('PH/s')) {
          ph += parseFloat(mach.hashrate);
        } else {
          th += parseFloat(mach.hashrate);
        }
      }
    });
    const finalPh = ph + Math.floor(th / 1000);
    const finalTh = th % 1000;
    if (finalPh > 0) {
      totalPower = `${finalPh}.${Math.round(finalTh / 100)} PH/s`;
    } else if (th > 0) {
      totalPower = `${th} TH/s`;
    } else {
      totalPower = "NODE OFFLINE";
    }

    return { activeCores, totalPower, estHourlyEarnings };
  };

  const stats = getMiningStats();

  const getMiningHistory = () => {
    const history: any[] = [];

    // 1. Purchase & Approval Events
    userDeposits.forEach((dep: any) => {
      // Add purchase event
      history.push({
        id: `upgrade_${dep.id}`,
        type: 'subscription',
        title: `${dep.machine_name || 'Premium ASIC Miner'} Purchase`,
        machineName: dep.machine_name || 'ASIC Miner',
        machineType: 'Premium Liquid-Cooled Node',
        amount: dep.amount || dep.machine_price || 0,
        status: dep.status, // 'pending', 'inactive', 'mining', 'declined'
        created_at: dep.created_at,
        reference: dep.reference || '',
        updated_at: dep.updated_at || dep.created_at
      });

      // Add ONE approval event when approved
      const isApproved = dep.status === 'approved' || dep.status === 'inactive' || dep.status === 'mining' || dep.status === 'completed';
      if (isApproved) {
        history.push({
          id: `approval_${dep.id}`,
          type: 'approval',
          title: `Verification Approved: ${dep.machine_name || 'Premium ASIC Miner'}`,
          machineName: dep.machine_name || 'ASIC Miner',
          machineType: 'Premium Liquid-Cooled Node',
          status: 'Inactive',
          created_at: dep.updated_at || dep.created_at,
          approvedTimestamp: dep.updated_at || dep.created_at,
          reference: dep.reference || '',
        });
      }
    });

    // 2. Harvest/Claim Claims
    miningTransactions.forEach((tx: any) => {
      const isFree = tx.type_detail === 'free_mining_cycle_completed';
      
      if (isFree) {
        // Free Machine History
        const parsedCreated = new Date(tx.created_at);
        const parsedStart = new Date(parsedCreated.getTime() - 2 * 60 * 60 * 1000); // approx 2h run time
        
        history.push({
          id: `claim_${tx.id}`,
          type: 'free_claim',
          title: 'Free Mining Harvest',
          machineName: 'Free Mining Machine',
          machineType: 'Standard Air-Cooled Miner',
          coinEarned: tx.twn_amount || 20,
          claimStatus: 'Claimed',
          claimTime: tx.created_at,
          startTime: parsedStart.toISOString(),
          endTime: tx.created_at,
          created_at: tx.created_at,
          timestamp: tx.created_at,
          session: 'Free 1.4s Duty Cycle'
        });
      } else {
        // Premium Machine History
        const mId = tx.type_detail?.replace('premium_mining_', '')?.replace('_completed', '') || '';
        const mach = PREMIUM_MACHINES.find(m => m.id === mId);
        
        history.push({
          id: `claim_${tx.id}`,
          type: 'premium_claim',
          title: `${mach?.name || 'ASIC'} Reward Harvest`,
          machineName: mach?.name || 'Premium ASIC Miner',
          machineType: 'Premium Liquid-Cooled Node',
          coinEarned: tx.twn_amount || 0,
          claimStatus: 'Claimed',
          timestamp: tx.created_at,
          created_at: tx.created_at,
          session: '24-Hour Duty Cycle'
        });
      }
    });

    // Sort by created_at descending
    return history.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  };

  const renderMiningHistory = () => {
    const historyItems = getMiningHistory();

    if (!isHistoryExpanded) {
      return (
        <div className="w-full max-w-7xl mx-auto px-4 md:px-8 mt-12 mb-4" id="twn-mining-history-section">
          <div className="bg-white border border-slate-200/85 hover:border-slate-300 rounded-[32px] p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 transition-all">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-2xl">
                <History size={18} />
              </div>
              <div className="text-left">
                <h3 className="text-xs font-black uppercase tracking-[0.25em] text-slate-500">
                  MINING INTERLOCK HISTORY
                </h3>
                <p className="text-[10px] text-slate-400 mt-1">
                  Explore and analyze older premium duty sessions, free claims, and machine orders ({historyItems.length} records).
                </p>
              </div>
            </div>
            <button 
              onClick={() => setIsHistoryExpanded(true)}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs uppercase font-black tracking-widest transition-all shadow-md hover:shadow-indigo-500/10 active:scale-95 cursor-pointer font-mono shrink-0"
            >
              Expand History
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 mt-12 mb-4" id="twn-mining-history-section-expanded">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-xs font-black uppercase tracking-[0.25em] text-slate-500 flex items-center gap-2">
              <History size={14} className="text-indigo-500" />
              MINING INTERLOCK HISTORY (EXPANDED)
            </h2>
            <span className="text-[10px] uppercase font-bold tracking-wider font-mono text-slate-500 bg-slate-100 border border-slate-200 px-3 py-0.5 rounded-full">
              {historyItems.length} Record{historyItems.length !== 1 ? 's' : ''}
            </span>
          </div>
          <button 
            onClick={() => setIsHistoryExpanded(false)}
            className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 hover:border-slate-300 rounded-xl text-[10px] uppercase font-black tracking-widest transition-all font-mono self-start sm:self-auto cursor-pointer"
          >
            Collapse History
          </button>
        </div>

        {historyItems.length === 0 ? (
          <div className="p-10 text-center bg-white border border-slate-200/60 rounded-[32px] shadow-sm">
            <p className="text-sm font-medium text-slate-400">No mining activity recorded yet.</p>
            <p className="text-xs text-slate-400/80 mt-1">Activate the free miner or purchase a premium node to begin.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-1">
            {historyItems.map((item) => {
              if (item.type === 'free_claim') {
                return (
                  <div 
                    key={item.id} 
                    className="bg-white border border-slate-200 rounded-[28px] p-5 shadow-sm hover:shadow transition-all relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-[4px] h-full bg-amber-500" />
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-amber-50 border border-amber-100 text-amber-600 rounded-2xl shrink-0">
                        <Cpu size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-sans font-bold text-slate-800 text-sm leading-tight truncate">
                            Machine: {item.machineName}
                          </h4>
                          <span className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0 bg-emerald-50 text-emerald-700 border-emerald-100 font-mono">
                            {item.claimStatus}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-1 font-mono">{item.machineType}</p>
                        
                        <div className="grid grid-cols-2 gap-1.5 mt-3 pt-3 border-t border-slate-100 text-[10px] text-slate-500 font-mono">
                          <div>
                            <span className="text-slate-400 block uppercase font-bold text-[8px]">Start Time</span>
                            {new Date(item.startTime).toLocaleString()}
                          </div>
                          <div>
                            <span className="text-slate-400 block uppercase font-bold text-[8px]">End Time</span>
                            {new Date(item.endTime).toLocaleString()}
                          </div>
                          <div className="mt-1">
                            <span className="text-slate-400 block uppercase font-bold text-[8px]">Claim Time</span>
                            {new Date(item.claimTime).toLocaleString()}
                          </div>
                          <div className="mt-1">
                            <span className="text-slate-400 block uppercase font-bold text-[8px]">Timestamp</span>
                            {new Date(item.timestamp).toLocaleString()}
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                            Yield Harvested
                          </p>
                          <p className="font-mono font-black text-sm text-emerald-600">
                            +{item.coinEarned} TWN
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              if (item.type === 'premium_claim') {
                return (
                  <div 
                    key={item.id} 
                    className="bg-white border border-slate-200 rounded-[28px] p-5 shadow-sm hover:shadow transition-all relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-[4px] h-full bg-emerald-500" />
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-2xl shrink-0">
                        <Coins size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-sans font-bold text-slate-800 text-sm leading-tight truncate">
                            Machine: {item.machineName}
                          </h4>
                          <span className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0 bg-emerald-50 text-emerald-700 border-emerald-100 font-mono">
                            {item.claimStatus}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-1 font-mono">{item.machineType}</p>
                        
                        <div className="grid grid-cols-2 gap-1.5 mt-3 pt-3 border-t border-slate-100 text-[10px] text-slate-500 font-mono">
                          <div>
                            <span className="text-slate-400 block uppercase font-bold text-[8px]">Mining Session</span>
                            {item.session}
                          </div>
                          <div>
                            <span className="text-slate-400 block uppercase font-bold text-[8px]">Yield Disbursed</span>
                            {item.coinEarned} TWN
                          </div>
                          <div className="mt-1 col-span-2">
                            <span className="text-slate-400 block uppercase font-bold text-[8px]">Claim Timestamp</span>
                            {new Date(item.timestamp).toLocaleString()}
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                            Yield Harvested
                          </p>
                          <p className="font-mono font-black text-sm text-emerald-600">
                            +{item.coinEarned} TWN
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              if (item.type === 'approval') {
                return (
                  <div 
                    key={item.id} 
                    className="bg-white border border-slate-200 rounded-[28px] p-5 shadow-sm hover:shadow transition-all relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-[4px] h-full bg-slate-400" />
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-slate-50 border border-slate-150 text-slate-600 rounded-2xl shrink-0">
                        <CheckCircle2 size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-sans font-bold text-slate-800 text-sm leading-tight truncate">
                            {item.machineName}
                          </h4>
                          <span className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0 bg-slate-100 text-slate-600 border-slate-200 font-mono">
                            {item.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-1 font-mono">{item.machineType}</p>
                        
                        <div className="mt-3 pt-3 border-t border-slate-100 text-[10px] text-slate-400 font-mono">
                          <span className="text-slate-500 block uppercase font-bold text-[8px]">Approved Timestamp</span>
                          {new Date(item.approvedTimestamp).toLocaleString()}
                        </div>

                        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                            Channel Protocol
                          </p>
                          <p className="font-mono font-black text-xs text-slate-700">
                            Core Slot Verified
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              // Purchase request ('subscription')
              const isPending = item.status === 'pending';
              const isDeclined = item.status === 'declined';
              
              let statusLabel = "SUCCEEDED";
              let statusBg = "bg-emerald-50 text-emerald-700 border-emerald-100";

              if (isPending) {
                statusLabel = "AWAITING APPROVAL";
                statusBg = "bg-amber-50 text-amber-700 border-amber-100";
              } else if (isDeclined) {
                statusLabel = "DECLINED";
                statusBg = "bg-rose-50 text-rose-700 border-rose-100";
              } else {
                statusLabel = "READY/ACTIVE";
                statusBg = "bg-indigo-50 text-indigo-700 border-indigo-100";
              }

              return (
                <div 
                  key={item.id} 
                  className="bg-white border border-slate-200 rounded-[28px] p-5 shadow-sm hover:shadow transition-all relative overflow-hidden"
                >
                  <div className={`absolute top-0 left-0 w-[4px] h-full ${isPending ? 'bg-amber-400' : isDeclined ? 'bg-rose-500' : 'bg-indigo-500'}`} />
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-2xl shrink-0">
                      <Cpu size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-sans font-bold text-slate-800 text-sm leading-tight truncate">
                          {item.title}
                        </h4>
                        <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0 font-mono ${statusBg}`}>
                          {statusLabel}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-1 font-mono">{item.machineType}</p>
                      
                      <div className="grid grid-cols-2 gap-1.5 mt-3 pt-3 border-t border-slate-100 text-[10px] text-slate-500 font-mono">
                        <div>
                          <span className="text-slate-400 block uppercase font-bold text-[8px]">Purchase Cost</span>
                          ${item.amount} USDT
                        </div>
                        <div>
                          <span className="text-slate-400 block uppercase font-bold text-[8px]">Ordered</span>
                          {new Date(item.created_at).toLocaleDateString()}
                        </div>
                        {item.reference && (
                          <div className="col-span-2 mt-1">
                            <span className="text-slate-400 block uppercase font-bold text-[8px]">Blockchain Reference Hash</span>
                            <span className="truncate max-w-full block text-slate-500 hover:text-slate-700" title={item.reference}>
                              {item.reference}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                          Order Core Payment
                        </p>
                        <p className="font-mono font-black text-sm text-slate-800">
                          ${item.amount} USDT
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-800 relative overflow-hidden pb-12" id="twn-mining-portal-main">
      {/* Immersive CSS Animation Rules Container */}
      <style>{`
        @keyframes laser-scan {
          0% { transform: translateX(-15%); }
          50% { transform: translateX(350%); }
          100% { transform: translateX(-15%); }
        }
        @keyframes infinite-spin {
          0% { transform: translate3d(0, 0, 0) rotate(0deg); }
          100% { transform: translate3d(0, 0, 0) rotate(360deg); }
        }
        .custom-loop-spin {
          animation: infinite-spin 1.5s linear infinite !important;
        }
        .miner-card-custom {
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.4s ease, box-shadow 0.4s ease, filter 0.4s ease !important;
          will-change: transform, border-color, box-shadow;
        }
        .miner-card-custom:hover {
          transform: translateY(-6px) scale(1.02) !important;
          border-color: var(--theme-accent) !important;
          box-shadow: 0 12px 32px var(--theme-accent-shadow) !important;
        }
        .cyber-corner-bracket {
          position: absolute;
          width: 8px;
          height: 8px;
          border-color: var(--theme-accent, #009e42);
          border-style: solid;
          pointer-events: none;
          z-index: 5;
        }
        .cyber-corner-tl { top: 12px; left: 12px; border-width: 1.5px 0 0 1.5px; }
        .cyber-corner-tr { top: 12px; right: 12px; border-width: 1.5px 1.5px 0 0; }
        .cyber-corner-bl { bottom: 12px; left: 12px; border-width: 0 0 1.5px 1.5px; }
        .cyber-corner-br { bottom: 12px; right: 12px; border-width: 0 1.5px 1.5px 0; }

        .glass-cyber-panel {
          background: #FFFFFF !important;
          border-color: rgba(0, 0, 0, 0.06) !important;
          box-shadow: 0 4px 18px rgba(0, 0, 0, 0.04) !important;
        }
        
        .glow-ambient-cyber {
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03) !important;
        }
      `}</style>

      {/* FULL WIDTH EDGE-TO-EDGE CINEMATIC HERO HEADER */}
      <div className="relative w-full h-[160px] sm:h-[180px] md:h-[220px] overflow-hidden border-b border-white/5 bg-gray-950">
        <img 
          src={miningHeaderImage} 
          alt="CGA Token Mining Banner" 
          className="w-full h-full object-cover brightness-[0.80] contrast-[1.05]"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/45" />
        
        {/* Absolute overlays for premium presentation & layout integration */}
        <div className="absolute inset-x-0 bottom-0 top-0 px-4 md:px-8 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 max-w-7xl mx-auto w-full z-10">
          <div className="flex items-center gap-3 mt-auto sm:mt-0">
            <button 
              onClick={handleClose} 
              className="p-3 bg-black/50 hover:bg-black/70 border border-white/10 rounded-2xl hover:text-[#009e42] transition-all backdrop-blur-md active:scale-95 duration-200"
              title="Go Back"
            >
              <ArrowLeft size={18} className="text-white" />
            </button>
          </div>

          {/* Live Profile Micro info */}
          <div className="flex items-center gap-5 p-3.5 bg-black/60 border border-white/10 rounded-3xl backdrop-blur-md mt-auto sm:mt-0 max-w-max self-end sm:self-auto">
            <div className="text-right">
              <p className="text-[9px] font-black uppercase text-amber-400 tracking-widest">Your Escrow Balance</p>
              <p className="text-base sm:text-lg font-black text-[#009e42] font-mono mt-0.5">
                {(profile?.twn_balance || 0).toLocaleString()} <span className="text-xs font-bold text-white">CGA</span>
              </p>
            </div>
            <div className="w-px h-8 bg-white/15" />
            <div className="text-right">
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Active ASIC Cores</p>
              <p className="text-base sm:text-lg font-black text-white font-mono mt-0.5">
                {stats.activeCores} <span className="text-xs font-normal text-emerald-400">Online</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Portal Statistics Row */}
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-3 gap-1.5 xs:gap-2.5 sm:gap-4 mt-8 mb-8">
        <div className="p-2 xs:p-3 sm:p-5 bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl shadow-sm flex items-center gap-1.5 xs:gap-3 sm:gap-5">
          <div className="p-1 xs:p-2 sm:p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl sm:rounded-2xl text-amber-600 shrink-0">
            <TrendingUp className="w-3.5 h-3.5 xs:w-4.5 xs:h-4.5 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[6.5px] xs:text-[8px] sm:text-[9px] font-black uppercase text-slate-500 tracking-wider leading-tight">Aggregate Hashing Power</p>
            <p className="text-[9px] xs:text-xs sm:text-lg font-black font-mono text-slate-900 mt-0.5 sm:mt-1 truncate">{stats.totalPower}</p>
          </div>
        </div>
        <div className="p-2 xs:p-3 sm:p-5 bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl shadow-sm flex items-center gap-1.5 xs:gap-3 sm:gap-5">
          <div className="p-1 xs:p-2 sm:p-3.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl sm:rounded-2xl text-indigo-600 shrink-0">
            <Cpu className="w-3.5 h-3.5 xs:w-4.5 xs:h-4.5 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[6.5px] xs:text-[8px] sm:text-[9px] font-black uppercase text-slate-500 tracking-wider leading-tight">Est. Hourly Harvester Yield</p>
            <p className="text-[9px] xs:text-xs sm:text-lg font-black font-mono text-slate-900 mt-0.5 sm:mt-1 truncate">+{stats.estHourlyEarnings} TWN/h</p>
          </div>
        </div>
        <div className="p-2 xs:p-3 sm:p-5 bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl shadow-sm flex items-center gap-1.5 xs:gap-3 sm:gap-5">
          <div className="p-1 xs:p-2 sm:p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl sm:rounded-2xl text-emerald-600 shrink-0">
            <ShieldCheck className="w-3.5 h-3.5 xs:w-4.5 xs:h-4.5 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[6.5px] xs:text-[8px] sm:text-[9px] font-black uppercase text-slate-500 tracking-wider leading-tight">Node Verification Layer</p>
            <p className="text-[7.5px] xs:text-[9px] sm:text-lg font-black font-mono text-slate-900 mt-0.5 sm:mt-1 leading-tight break-words">PRO-SECURITY ACTIVATED</p>
          </div>
        </div>
      </div>

      {/* Main Content Layout Block */}
      {(() => {
        const hasActiveMiners = (isFreeActive || isFreeClaimable) || PREMIUM_MACHINES.some(mach => {
          const state = getMachineState(mach);
          return state.status === 'active' || state.status === 'claimable';
        });

        let activeMinersCount = 0;
        if (isFreeActive || isFreeClaimable) activeMinersCount += 1;
        PREMIUM_MACHINES.forEach(mach => {
          const state = getMachineState(mach);
          if (state.status === 'active' || state.status === 'claimable') activeMinersCount += 1;
        });

        return (
          <div className="w-full space-y-12">
            {/* 1. ACTIVE MINING & HARVESTING SECTION */}
            {hasActiveMiners && (
              <div className="w-full max-w-7xl mx-auto px-4 md:px-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xs font-black uppercase tracking-[0.25em] text-slate-500 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    LIVE HARVESTING DECK
                  </h2>
                  <span className="text-[10px] uppercase font-bold tracking-wider font-mono text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-0.5 rounded-full">
                    {activeMinersCount} Node{activeMinersCount > 1 ? 's' : ''} Online
                  </span>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                  {/* Render Free Miner if Active or Claimable */}
                  {(isFreeActive || isFreeClaimable) && (
                    <div className="p-3 sm:p-5 rounded-[20px] sm:rounded-[32px] relative overflow-hidden bg-white border-2 border-emerald-500 shadow-md flex flex-col justify-between" style={{ '--theme-accent': '#10b981' } as React.CSSProperties}>
                      <span className="cyber-corner-bracket cyber-corner-tl" />
                      <span className="cyber-corner-bracket cyber-corner-tr" />
                      <span className="cyber-corner-bracket cyber-corner-bl" />
                      <span className="cyber-corner-bracket cyber-corner-br" />
                      
                      <div>
                        {/* Header Spec Tag */}
                        <div className="flex items-center justify-between gap-1.5 mb-2.5 z-10 relative font-mono">
                          <span className="text-[7.5px] sm:text-[9px] font-black tracking-wider text-slate-500 uppercase">Standard Core</span>
                          <span className="text-[7.5px] sm:text-[9px] font-black tracking-widest px-1.5 sm:px-2.5 py-0.5 rounded-md border text-xs truncate text-emerald-700 border-emerald-150 bg-emerald-50/50">Free Tier</span>
                        </div>

                        {/* Machine Image Frame with Spinning Engine Overlay */}
                        <div className="relative w-full h-24 sm:h-36 rounded-2xl overflow-hidden mb-3 bg-slate-50 border border-slate-100 flex items-center justify-center z-10">
                          {/* Underlying Free Miner Machine Picture */}
                          <img 
                            src="https://i.imgur.com/gorNOww.png" 
                            alt="Free Mining Machine" 
                            className="w-full h-full object-cover brightness-[0.70] contrast-[1.2] opacity-40 blur-[0.5px] relative z-10"
                            referrerPolicy="no-referrer"
                          />

                          {/* Mining Engine Turbine Layer */}
                          <MiningEngine active={isFreeActive} machineId="free" />

                          <span className={cn(
                            "absolute top-2 left-2 px-2 py-0.5 rounded-full text-[7.5px] font-black uppercase tracking-[0.1em] font-mono z-30 shadow-sm border",
                            isFreeActive ? "bg-emerald-550/15 text-emerald-700 border border-emerald-550/30" : "bg-amber-400 text-slate-950 border-amber-300"
                          )}>
                            {isFreeActive ? "ACTIVE" : "CLAIMABLE"}
                          </span>
                        </div>

                        <div className="mb-3.5 min-w-0">
                          <h4 className="text-xs sm:text-sm font-black uppercase tracking-[0.05em] text-slate-900 truncate font-sans">Free Mining Machine</h4>
                          <p className="text-[9.5px] sm:text-[10px] font-black font-mono mt-0.5 tracking-wider text-emerald-600">
                            +20 TWN / CYCLE
                          </p>
                        </div>
                      </div>

                      {/* Progress bar and time left */}
                      <div className="pt-3 border-t border-slate-100 mt-auto z-10 relative font-mono">
                        {isFreeActive && (
                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase">
                              <span>Progress</span>
                              <span className="text-slate-900 font-black">
                                {formatTime(freeTimeLeft)} left
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-[#009e42] to-emerald-600 transition-all font-sans"
                                style={{ width: `${freeProgress}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {isFreeClaimable && (
                          <button
                            onClick={handleClaimFree}
                            className="w-full py-2.5 sm:py-3.5 text-[8px] sm:text-[9.5px] font-black uppercase tracking-[0.2em] rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1.5 animate-bounce font-mono text-white shadow-md bg-gradient-to-r from-emerald-500 to-teal-550"
                          >
                            <Coins size={13} /> Claim 20.00 TWN
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Loop active and claimable premium miners */}
                  {[...PREMIUM_MACHINES].sort((a, b) => a.price - b.price).map((mach) => {
                    const state = getMachineState(mach);
                    if (state.status !== 'active' && state.status !== 'claimable') return null;
                    
                    const theme = MACHINE_THEMES[mach.id];
                    const elapsed = state.devState?.activated_at && state.devState?.expires_at
                      ? ((nowTime - new Date(state.devState.activated_at).getTime()) / (new Date(state.devState.expires_at).getTime() - new Date(state.devState.activated_at).getTime())) * 105
                      : 0;
                    const remSecs = state.remSeconds || 0;
                    const isActive = state.status === 'active';

                    return (
                      <div 
                        key={mach.id}
                        className="p-3 sm:p-5 rounded-[20px] sm:rounded-[32px] flex flex-col justify-between overflow-hidden border-2 bg-white relative z-10 animate-fade-in"
                        style={{
                          borderColor: theme.accentHex,
                          boxShadow: `0 10px 25px ${theme.accentHex}15, 0 4px 10px rgba(0,0,0,0.05)`,
                        }}
                      >
                        <span className="cyber-corner-bracket cyber-corner-tl" style={{ borderColor: theme.accentHex }} />
                        <span className="cyber-corner-bracket cyber-corner-tr" style={{ borderColor: theme.accentHex }} />
                        <span className="cyber-corner-bracket cyber-corner-bl" style={{ borderColor: theme.accentHex }} />
                        <span className="cyber-corner-bracket cyber-corner-br" style={{ borderColor: theme.accentHex }} />

                        <div>
                          {/* Header Spec Tag */}
                          <div className="flex items-center justify-between gap-1.5 mb-2.5 z-10 relative font-mono">
                            <span className="text-[7.5px] sm:text-[9px] font-black tracking-wider text-slate-500 uppercase">{mach.hashrate} Specs</span>
                            <span className="text-[7.5px] sm:text-[9px] font-black tracking-widest px-1.5 sm:px-2.5 py-0.5 rounded-md border text-xs truncate" style={{ color: theme.accentHex, borderColor: `${theme.accentHex}40`, background: `${theme.accentHex}10` }}>{mach.efficiency}</span>
                          </div>

                          {/* Image frame with spinning engine overlay */}
                          <div className="relative w-full h-24 sm:h-36 rounded-2xl overflow-hidden mb-3 bg-slate-50 border border-slate-100 flex items-center justify-center z-10">
                            <img 
                              src={mach.img} 
                              alt={mach.name} 
                              className="w-full h-full object-cover relative z-10"
                              referrerPolicy="no-referrer"
                            />
                            
                            {/* Mining Engine Turbine Layer positioned above miner machine */}
                            <MiningEngine active={isActive} machineId={mach.id} />

                            <span className={cn(
                              "absolute top-2 left-2 px-2 py-0.5 rounded-full text-[7.5px] font-black uppercase tracking-[0.1em] font-mono z-30 shadow-sm border",
                              isActive ? "bg-emerald-555/15 text-emerald-700 border border-emerald-555/30" : "bg-amber-400 text-slate-950 border-amber-300"
                            )}>
                              {isActive ? "ACTIVE" : "CLAIMABLE"}
                            </span>
                          </div>

                          <div className="mb-3.5 min-w-0">
                            <h4 className="text-xs sm:text-sm font-black uppercase tracking-[0.05em] text-slate-900 truncate font-sans">{mach.name}</h4>
                            <p className="text-[9.5px] sm:text-[10px] font-black font-mono mt-0.5 tracking-wider" style={{ color: theme.accentHex }}>
                              +{mach.hourlyRate.toFixed(1)} TWN / HR
                            </p>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100 mt-auto z-10 relative font-mono">
                          {/* Active remaining time and progress bar */}
                          {isActive && (
                            <div className="space-y-2">
                              <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase">
                                <span>Progress</span>
                                <span className="text-slate-900 font-black">
                                  {Math.floor(remSecs / 3600)}h {Math.floor((remSecs % 3605) / 60)}m left
                                </span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-50 border border-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full rounded-full"
                                  style={{ 
                                    width: `${Math.min(100, elapsed)}%`,
                                    background: `linear-gradient(90deg, ${theme.accentHex}cc, ${theme.accentHex})`,
                                  }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Claim Button */}
                          {state.status === 'claimable' && (
                            <button
                              type="button"
                              onClick={() => handleClaimPremium(mach)}
                              className="w-full py-2.5 sm:py-3.5 text-[8px] sm:text-[9.5px] font-black uppercase tracking-[0.2em] rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1.5 animate-bounce font-mono text-white shadow-md font-bold"
                              style={{
                                background: `linear-gradient(135deg, ${theme.buttonBgStart}, ${theme.buttonBgEnd})`,
                                color: theme.buttonText === 'text-black' ? '#0f172a' : '#ffffff',
                                boxShadow: `0 4px 12px ${theme.accentHex}30`
                              }}
                            >
                              <Download size={13} /> Claim {(mach.hourlyRate * 24).toLocaleString()} TWN
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. ASIC HARVESTER UPGRADE AREA */}
            <div className="w-full max-w-7xl mx-auto px-4 md:px-8">
              <h2 className="text-xs font-black uppercase tracking-[0.25em] text-slate-500 flex items-center justify-between mb-6">
                <span className="flex items-center gap-2"><Cpu size={14} className="text-indigo-600" /> ASIC HARVESTER UPGRADES</span>
                <span className="text-indigo-600 text-[9px] tracking-normal uppercase bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100 font-mono">Premium Cores</span>
              </h2>

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6" id="premium-asic-nodes-grid">
                {[...PREMIUM_MACHINES].sort((a, b) => a.price - b.price).map((mach) => {
                  const state = getMachineState(mach);
                  if (state.status === 'active' || state.status === 'claimable') return null;
                  
                  const theme = MACHINE_THEMES[mach.id];
                  
                  return (
                    <div 
                      key={mach.id}
                      id={`miner-card-${mach.id}`}
                      className="p-3 sm:p-5 rounded-[20px] sm:rounded-[32px] flex flex-col justify-between overflow-hidden border bg-white relative z-10 miner-card-custom cursor-pointer"
                      style={{
                        '--theme-accent': theme.accentHex,
                        '--theme-accent-shadow': `${theme.accentHex}15`,
                        '--theme-accent-hover': `${theme.accentHex}30`,
                        borderColor: theme.accentHex,
                        borderWidth: '2px',
                        boxShadow: `0 4px 12px rgba(0,0,0,0.03), 0 1px 3px rgba(0,0,0,0.01)`,
                      } as React.CSSProperties}
                    >
                      <span className="cyber-corner-bracket cyber-corner-tl" style={{ borderColor: theme.accentHex }} />
                      <span className="cyber-corner-bracket cyber-corner-tr" style={{ borderColor: theme.accentHex }} />
                      <span className="cyber-corner-bracket cyber-corner-bl" style={{ borderColor: theme.accentHex }} />
                      <span className="cyber-corner-bracket cyber-corner-br" style={{ borderColor: theme.accentHex }} />

                      <div>
                        {/* Header Spec Tag */}
                        <div className="flex items-center justify-between gap-1.5 mb-2.5 z-10 relative font-mono">
                          <span className="text-[7.5px] sm:text-[9px] font-black tracking-wider text-slate-500 uppercase font-mono">{mach.hashrate} Specs</span>
                          <span className="text-[7.5px] sm:text-[9px] font-black tracking-widest px-1.5 sm:px-2.5 py-0.5 rounded-md border font-mono truncate" style={{ color: theme.accentHex, borderColor: `${theme.accentHex}40`, background: `${theme.accentHex}10` }}>{mach.efficiency}</span>
                        </div>

                        {/* Image frame */}
                        <div className="relative w-full h-24 sm:h-36 rounded-2xl overflow-hidden mb-3 bg-slate-50 border border-slate-100 flex items-center justify-center z-10">
                          <img 
                            src={mach.img} 
                            alt={mach.name} 
                            className="w-full h-full object-cover relative z-10"
                            referrerPolicy="no-referrer"
                          />

                          {/* Mining Engine Turbine Layer - completely stopped since stopped/not-active */}
                          <MiningEngine active={false} machineId={mach.id} />

                          <span className={cn(
                            "absolute top-2 left-2 px-2 py-0.5 rounded-full text-[7.5px] font-black uppercase tracking-[0.1em] font-mono z-30 pointer-events-none border",
                            state.status === 'verifying' ? "bg-purple-650 text-white bg-purple-600 border-purple-400" :
                            state.status === 'idle' ? "bg-indigo-650 text-white bg-indigo-600 border-indigo-500 animate-pulse" : "bg-slate-100 text-slate-600 border-slate-200"
                          )}>
                            {state.status === 'verifying' ? "PENDING" :
                             state.status === 'idle' ? "READY" : "LOCKED"}
                          </span>
                        </div>

                        {/* Text summary info */}
                        <div className="mb-3.5 min-w-0">
                          <h4 className="text-xs sm:text-sm font-black uppercase tracking-[0.05em] text-slate-900 truncate font-sans">{mach.name}</h4>
                          <p className="text-[9.5px] sm:text-[10px] font-black font-mono mt-0.5 tracking-wider" style={{ color: theme.accentHex }}>
                            +{mach.hourlyRate.toFixed(1)} TWN / HR
                          </p>
                        </div>

                        <div className="space-y-1.5 mb-3.5 z-10 relative font-sans text-[9px] sm:text-[11px] text-slate-600">
                          {mach.specs.slice(0, 2).map((sp, sIdx) => (
                            <div key={sIdx} className="flex items-center gap-2 min-w-0 font-medium">
                              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: theme.accentHex }} />
                              <span className="truncate font-semibold tracking-wide">{sp}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Operations controls */}
                      <div className="pt-3 border-t border-slate-100 mt-auto z-10 relative font-mono">
                        {state.status === 'locked' && (
                          <button
                            type="button"
                            onClick={() => handleOpenSubscribe(mach)}
                            className="w-full py-2.5 sm:py-3.5 text-[8px] sm:text-[9.5px] font-black uppercase tracking-[0.2em] rounded-xl cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 duration-300 font-mono shadow-md font-bold"
                            style={{
                              background: `linear-gradient(135deg, ${theme.buttonBgStart}, ${theme.buttonBgEnd})`,
                              border: 'none',
                              color: theme.buttonText === 'text-black' ? '#0f172a' : '#ffffff',
                              boxShadow: `0 4px 12px ${theme.accentHex}30`
                            }}
                          >
                            Upgrade • ${mach.price}
                          </button>
                        )}

                        {state.status === 'verifying' && (
                          <div className="p-2.5 bg-purple-50 border border-purple-100 rounded-xl flex flex-col gap-0.5 text-center">
                            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-purple-700 flex items-center justify-center gap-1 font-bold">
                              <RotateCw size={11} className="animate-spin text-purple-600" /> Verification Pending
                            </span>
                            <span className="text-[7.5px] font-bold text-slate-400 font-mono truncate max-w-[120px] mx-auto">TXID: {state.sub?.reference}</span>
                          </div>
                        )}

                        {state.status === 'idle' && (
                          <button
                            type="button"
                            onClick={() => handleActivatePremium(mach)}
                            className="w-full py-2.5 sm:py-3.5 text-[8px] sm:text-[9.5px] font-black uppercase tracking-[0.2em] rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1.5 animate-pulse font-mono font-bold text-white shadow-md font-bold"
                            style={{
                              background: `linear-gradient(135deg, ${theme.buttonBgStart}, ${theme.buttonBgEnd})`,
                              color: theme.buttonText === 'text-black' ? '#0f172a' : '#ffffff',
                              boxShadow: `0 4px 12px ${theme.accentHex}30`
                            }}
                          >
                            <Zap size={13} /> Start Mining
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. STARTER MINER SECTION */}
            {!isFreeActive && !isFreeClaimable && (
              <div className="w-full max-w-7xl mx-auto px-4 md:px-8">
                <h2 className="text-xs font-black uppercase tracking-[0.25em] text-slate-500 flex items-center gap-2 mb-6">
                  <Zap size={14} className="text-amber-500 animate-pulse" /> STARTER MINER NODE
                </h2>

                <div className="p-6 rounded-[32px] relative overflow-hidden transition-all duration-300 bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6" style={{ '--theme-accent': '#009e42', '--theme-accent-shadow': 'rgba(0, 158, 66, 0.15)' } as React.CSSProperties}>
                  <span className="cyber-corner-bracket cyber-corner-tl" />
                  <span className="cyber-corner-bracket cyber-corner-tr" />
                  <span className="cyber-corner-bracket cyber-corner-bl" />
                  <span className="cyber-corner-bracket cyber-corner-br" />
                  
                  <div className="flex items-center gap-4.5">
                    <div className="w-16 h-16 rounded-2xl bg-slate-550/10 border border-slate-200/50 flex items-center justify-center text-amber-600 relative overflow-hidden shrink-0">
                      {/* Underlying machine illustration */}
                      <img 
                        src="https://i.imgur.com/gorNOww.png" 
                        alt="Free Miner Machine"
                        className="w-full h-full object-cover opacity-25 absolute"
                        referrerPolicy="no-referrer"
                      />
                      <MiningEngine active={false} machineId="free" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-amber-600 tracking-widest">Base Harvester</p>
                      <h3 className="text-lg font-black uppercase mt-0.5 text-slate-800 font-sans">Free Mining Machine</h3>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-6 text-[10px] sm:text-xs text-slate-500 font-mono">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-bold">Production:</span>
                      <span className="font-bold text-[#8ba313]">20 TWN / Cycle (1 hr)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-bold">Protocol:</span>
                      <span className="font-bold text-slate-700">MD-FREE-V4</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-bold">Requirements:</span>
                      <span className="font-bold text-slate-700">Account Active</span>
                    </div>
                  </div>

                  <div className="w-full md:w-auto">
                    <button
                      onClick={handleActivateFree}
                      className="w-full md:w-[220px] py-3 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl font-black uppercase tracking-widest text-white shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 text-xs font-bold font-mono"
                    >
                      <Cpu size={14} /> Start Mining
                    </button>
                  </div>
                </div>
              </div>
            )}
            {/* MINING HISTORY SECTION */}
            {renderMiningHistory()}
          </div>
        );
      })()}

      {/* DETAILED PREMIUM SECURITY NOTICE */}
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 mt-12 mb-8 animate-fade-in">
        <div className="bg-white border border-slate-200 rounded-[32px] p-6 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#009e42]/15 to-transparent" />
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-xl">
              <Terminal size={18} />
            </div>
            <div>
              <h4 className="text-sm font-black uppercase tracking-wide text-slate-800 flex items-center gap-1.5">Standard Harvester Safety Node <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /></h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-3xl">All premium machine subscription requests generate valid DWN settlement tickets. System node administrators verify each Tx Hash ledger in real-time. Unlocking occurs immediately upon blockchain block confirmation.</p>
            </div>
          </div>
        </div>
      </div>

      {/* MINING SYSTEM COMPLETE REFERENCE SPEC MANUAL (MODAL TRIGGER BUTTON) */}
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 mt-4 mb-16 text-center animate-fade-in">
        <button
          type="button"
          onClick={() => setShowGuide(true)}
          className="px-8 py-4 bg-slate-900 border-2 border-[#009e42] hover:border-black text-[#009e42] hover:text-white hover:bg-slate-950 rounded-2xl text-xs font-black uppercase tracking-[0.25em] transition-all cursor-pointer shadow-lg shadow-emerald-400/10 hover:scale-[1.02] active:scale-[0.98]"
        >
          📖 Open Mining System Guide
        </button>
      </div>

      {/* MODAL 3: COMPREHENSIVE COMPANION MINING GUIDE */}
      <AnimatePresence>
        {showGuide && (
          <div 
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[9999] overflow-y-auto flex items-center justify-center p-4"
            onClick={() => setShowGuide(false)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[32px] border border-slate-200 max-w-4xl w-full p-6 sm:p-8 relative max-h-[85vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-4 mb-6 sticky top-0 bg-white pb-4 border-b border-slate-100 z-10">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl">
                    <Cpu size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8ba313] font-mono">COMPLETE REFERENCE</span>
                    <h3 className="text-base font-black text-slate-900 uppercase italic">MINING HARVESTERS SYSTEM GUIDE</h3>
                  </div>
                </div>
                
                <button 
                  type="button"
                  onClick={() => setShowGuide(false)}
                  className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
                >
                  <X size={15} className="text-slate-600" />
                </button>
              </div>

              {/* Specification table details of ALL harvesters */}
              <div className="space-y-4">
                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                  Deploy secure hardware nodes below. Verify specs, cycle schedules, power constraints, and output potential for starter core and premium ASIC rigs.
                </p>

                {/* For Desktop/Tablet: High Contrast Specifications Table */}
                <div className="hidden md:block bg-slate-50/50 border border-slate-200/80 rounded-2xl overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100/80 border-b border-slate-200 font-mono text-[10px] font-black uppercase tracking-wider text-slate-600">
                        <th className="px-5 py-3.5">Miner Unit Model</th>
                        <th className="px-5 py-3.5">Hashing Power</th>
                        <th className="px-5 py-3.5">Yield / Hr</th>
                        <th className="px-5 py-3.5">Yield / Day</th>
                        <th className="px-5 py-3.5">Cycle Duration</th>
                        <th className="px-5 py-3.5">License Price</th>
                        <th className="px-5 py-3.5">Node Reqs</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {[
                        {
                          name: "Free Mining Machine",
                          power: "1.0 TH/s",
                          tph: "20.0 TWN",
                          tpd: "480.0 TWN",
                          duration: "1 Hour",
                          cost: "Free",
                          requirements: "Registered Account Completed"
                        },
                        {
                          name: "Antminer S23 Hyd 3U",
                          power: "320 TH/s",
                          tph: "45.0 TWN",
                          tpd: "1,080.0 TWN",
                          duration: "24 Hours",
                          cost: "$7.02",
                          requirements: "Deposit & Hash Verification"
                        },
                        {
                          name: "Antminer S21 XP Hydro",
                          power: "473 TH/s",
                          tph: "70.0 TWN",
                          tpd: "1,680.0 TWN",
                          duration: "24 Hours",
                          cost: "$10.34",
                          requirements: "Deposit & Hash Verification"
                        },
                        {
                          name: "WhatsMiner M63S Hydro",
                          power: "602 TH/s",
                          tph: "95.0 TWN",
                          tpd: "2,280.0 TWN",
                          duration: "24 Hours",
                          cost: "$14.62",
                          requirements: "Deposit & Hash Verification"
                        },
                        {
                          name: "Antminer S21 Pro",
                          power: "815 TH/s",
                          tph: "125.0 TWN",
                          tpd: "3,000.0 TWN",
                          duration: "24 Hours",
                          cost: "$21.80",
                          requirements: "Deposit & Hash Verification"
                        },
                        {
                          name: "WhatsMiner M60S",
                          power: "1.1 PH/s",
                          tph: "170.0 TWN",
                          tpd: "4,080.0 TWN",
                          duration: "24 Hours",
                          cost: "$34.98",
                          requirements: "Deposit & Hash Verification"
                        },
                        {
                          name: "Avalon A1566",
                          power: "1.6 PH/s",
                          tph: "200.0 TWN",
                          tpd: "4,800.0 TWN",
                          duration: "24 Hours",
                          cost: "$55.17",
                          requirements: "Deposit & Hash Verification"
                        }
                      ].map((m, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-3 text-slate-900 font-extrabold uppercase italic">{m.name}</td>
                          <td className="px-5 py-3 font-mono text-indigo-600 font-bold">{m.power}</td>
                          <td className="px-5 py-3 font-mono text-emerald-600 font-bold">+{m.tph}</td>
                          <td className="px-5 py-3 font-mono text-emerald-700 font-extrabold">+{m.tpd}</td>
                          <td className="px-5 py-3 font-mono text-slate-600">{m.duration}</td>
                          <td className="px-5 py-3 font-mono text-slate-900 font-bold">{m.cost}</td>
                          <td className="px-5 py-3 text-[10px] text-slate-500 max-w-[150px] truncate" title={m.requirements}>{m.requirements}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* For Mobile: Beautiful Card Stack */}
                <div className="block md:hidden space-y-4">
                  {[
                    {
                      name: "Free Mining Machine",
                      power: "1.0 TH/s",
                      tph: "20.0 TWN",
                      tpd: "480.0 TWN",
                      duration: "1 Hour",
                      cost: "Free",
                      requirements: "Registered Account Completed"
                    },
                    {
                      name: "Antminer S23 Hyd 3U",
                      power: "320 TH/s",
                      tph: "45.0 TWN",
                      tpd: "1,080.0 TWN",
                      duration: "24 Hours",
                      cost: "$7.02",
                      requirements: "Deposit & Hash Verification"
                    },
                    {
                      name: "Antminer S21 XP Hydro",
                      power: "473 TH/s",
                      tph: "70.0 TWN",
                      tpd: "1,680.0 TWN",
                      duration: "24 Hours",
                      cost: "$10.34",
                      requirements: "Deposit & Hash Verification"
                    },
                    {
                      name: "WhatsMiner M63S Hydro",
                      power: "602 TH/s",
                      tph: "95.0 TWN",
                      tpd: "2,280.0 TWN",
                      duration: "24 Hours",
                      cost: "$14.62",
                      requirements: "Deposit & Hash Verification"
                    },
                    {
                      name: "Antminer S21 Pro",
                      power: "815 TH/s",
                      tph: "125.0 TWN",
                      tpd: "3,000.0 TWN",
                      duration: "24 Hours",
                      cost: "$21.80",
                      requirements: "Deposit & Hash Verification"
                    },
                    {
                      name: "WhatsMiner M60S",
                      power: "1.1 PH/s",
                      tph: "170.0 TWN",
                      tpd: "4,080.0 TWN",
                      duration: "24 Hours",
                      cost: "$34.98",
                      requirements: "Deposit & Hash Verification"
                    },
                    {
                      name: "Avalon A1566",
                      power: "1.6 PH/s",
                      tph: "200.0 TWN",
                      tpd: "4,800.0 TWN",
                      duration: "24 Hours",
                      cost: "$55.17",
                      requirements: "Deposit & Hash Verification"
                    }
                  ].map((m, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-[11px] space-y-2">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                        <span className="font-sans font-black text-slate-900 uppercase italic text-xs">{m.name}</span>
                        <span className="font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">{m.cost}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">HASHING POWER:</span>
                        <span className="text-indigo-600 font-bold">{m.power}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">YIELD / HR:</span>
                        <span className="text-emerald-600 font-bold">+{m.tph}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">YIELD / DAY:</span>
                        <span className="text-emerald-700 font-bold font-black">+{m.tpd}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">CYCLE DURATION:</span>
                        <span className="text-slate-600">{m.duration}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-400 shrink-0">REQS:</span>
                        <span className="text-slate-500 font-sans truncate text-right">{m.requirements}</span>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 1: PREMIUM COMPREHENSIVE PAYMENT REQUEST FORM */}
      <AnimatePresence>
        {showPayModal && selectedMachine && (
          <div 
            className="fixed inset-0 bg-[#07090e] md:bg-black/85 md:backdrop-blur-md z-[9999] overflow-y-auto flex flex-col md:items-center md:justify-center p-0 md:p-4" 
            onClick={() => { setShowPayModal(false); setSelectedMachine(null); }}
          >
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="bg-white md:border md:border-slate-200 rounded-none md:rounded-[40px] max-w-md w-full p-6 md:p-8 relative min-h-screen md:min-h-0 md:max-h-[90vh] flex flex-col justify-between md:justify-start overflow-y-auto pb-20 md:pb-8 shadow-2xl shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Responsive Header for Mobile Full screen & Desktop Centered modal */}
              <div className="flex items-center justify-between gap-4 mb-6 pt-2 md:pt-0">
                <div className="flex items-center gap-3">
                  <button 
                    type="button"
                    onClick={() => { setShowPayModal(false); setSelectedMachine(null); }}
                    className="p-2 bg-slate-105 bg-slate-100 border border-slate-200 rounded-full hover:text-indigo-600 md:hidden transition-colors"
                  >
                    <ArrowLeft size={16} className="text-slate-600" />
                  </button>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 font-mono">SECURE HARVESTER</span>
                    <h3 className="text-sm font-black text-slate-800 uppercase italic">UPGRADE PROTOCOL</h3>
                  </div>
                </div>
                
                {/* Desktop close button only */}
                <button 
                  type="button"
                  onClick={() => { setShowPayModal(false); setSelectedMachine(null); }}
                  className="hidden md:flex p-2 bg-slate-100 border border-slate-200 rounded-full hover:text-red-500 transition-colors"
                >
                  <X size={15} className="text-slate-500" />
                </button>
              </div>

              {/* Selected miner info summary */}
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl mb-6">
                <p className="text-[10.5px] font-bold text-slate-500 uppercase font-mono tracking-wider">Target Miner Unit</p>
                <h4 className="text-sm font-black text-slate-800 mt-1 uppercase italic tracking-wide">{selectedMachine.name}</h4>
                <div className="flex items-center justify-between mt-3 text-xs border-t border-slate-100 pt-3">
                  <span className="text-slate-500 font-bold">Subscription Cost:</span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-indigo-600 font-black font-mono text-base">${selectedMachine.price.toFixed(2)} USD</span>
                </div>
              </div>

              {/* Payment Method - ONLY displays "USDT (TRC20)" */}
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl mb-6 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Payment Method</span>
                <span className="text-xs font-black text-emerald-600 font-mono bg-emerald-50 border border-emerald-100 px-3.5 py-1 rounded-full">USDT (TRC20)</span>
              </div>

              {/* Wallet specifics display and copy widgets */}
              <div className="space-y-4 mb-6">
                <div>
                  <div className="flex items-center gap-2 p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                    <span className="text-xs font-mono truncate text-slate-850 text-slate-800 flex-1">{CRYPTO_ADDRESSES['usdt']}</span>
                    <button 
                      type="button"
                      onClick={() => handleCopy('usdt', CRYPTO_ADDRESSES['usdt'])}
                      className="p-1.5 hover:text-indigo-600 text-slate-400 transition-colors"
                      title="Copy Address"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider font-mono">Required Amount in Crypto</p>
                  <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-mono text-slate-800 flex justify-between items-center">
                    <span>{selectedMachine.price.toFixed(2)} USDT</span>
                    <span className="text-[10px] text-slate-400 font-sans font-black uppercase">DO NOT ALTER UNIT AMOUNT</span>
                  </div>
                </div>
              </div>

              {/* TX Hash Input reference */}
              <div className="mb-6">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider font-mono block mb-2">Transaction TXID Hash</label>
                <input 
                  type="text"
                  placeholder="Transaction ID or Reference Hash"
                  value={txHash}
                  onChange={(e) => setTxHash(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs outline-none focus:border-amber-400 text-slate-800 font-mono"
                />
              </div>

              {/* Terms Warning */}
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex gap-2.5 items-start text-[10px] text-amber-700 leading-snug mb-6">
                <AlertTriangle size={15} className="shrink-0 mt-0.5 text-amber-500" />
                <span>Verification may take up to 2-15 minutes, conforming to blockchain confirmation layers. Please avoid multiple submissions for a single blockchain transfer.</span>
              </div>

              {/* Required confirmation toggle */}
              <div className="mb-6 p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-[9.5px] font-black uppercase tracking-wider text-slate-800 font-mono font-bold">I have completed the transfer</p>
                  <p className="text-[8.5px] text-slate-500 mt-1 leading-normal max-w-[240px]">I confirm that I transferred the correct amount and entered the correct Transaction TXID hash.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsConfirmed(!isConfirmed)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 ${
                    isConfirmed ? "bg-emerald-500" : "bg-slate-200"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      isConfirmed ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowPayModal(false); setSelectedMachine(null); }}
                  className="flex-1 py-3 bg-slate-100 rounded-xl text-xs font-black uppercase tracking-wider text-slate-700 hover:bg-slate-200 transition-colors font-mono font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handlePaySubmit}
                  disabled={isSubmittingPay || !txHash.trim() || !isConfirmed}
                  className={cn(
                    "flex-1 py-3 bg-gradient-to-r from-amber-500 to-[#009e42] rounded-xl text-xs font-black uppercase tracking-wider text-white shadow-lg transition-all flex items-center justify-center gap-2 font-mono font-bold",
                    (!txHash.trim() || !isConfirmed || isSubmittingPay) 
                      ? "opacity-30 cursor-not-allowed filter grayscale" 
                      : "hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                  )}
                >
                  {isSubmittingPay ? <RotateCw size={13} className="animate-spin" /> : "Commit Pay"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SUCCESS APPROVAL POPUP */}
      <AnimatePresence>
        {showApprovalPopup && approvedMachine && (
          <div className="fixed inset-0 bg-slate-900/40 md:backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ type: 'spring', damping: 25, stiffness: 180 }}
              className="bg-white border-2 border-emerald-500/10 rounded-[40px] max-w-md w-full p-8 text-center relative overflow-hidden shadow-2xl"
            >
              <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent animate-pulse" />
              
              {/* Pulsing Outer Glow */}
              <div className="absolute -inset-10 bg-emerald-500/5 rounded-full filter blur-3xl pointer-events-none" />

              {/* Icon / Animation Wrapper */}
              <div className="relative w-23 h-23 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <div className="absolute inset-0 bg-emerald-500/10 rounded-full animate-ping pointer-events-none" />
                <div className="absolute inset-2 bg-emerald-500/20 rounded-full animate-pulse pointer-events-none" />
                <div className="absolute inset-4 bg-emerald-500/10 rounded-full pointer-events-none" />
                <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-white z-10 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                  <ShieldCheck size={36} />
                </div>
              </div>

              <span className="text-[10px] font-black uppercase text-emerald-600 tracking-[0.3em] block mb-2 font-mono">PRO-VERIFICATION APPROVED</span>
              <h3 className="text-2xl font-black text-slate-800 uppercase italic tracking-wide leading-tight mb-3">MINER UNLOCKED</h3>
              
              <p className="text-xs text-slate-500 leading-relaxed mb-6 font-sans">
                Your subscription credentials for <strong className="text-slate-800 uppercase">{approvedMachine.name}</strong> have been validated by the Ledger Administrator. Your hardware slot is ready for immediate activation.
              </p>

              {/* Target machine micro badge */}
              <div className="p-4 bg-slate-50 border border-slate-150 border-slate-200/50 rounded-2xl mb-8 flex items-center gap-4 text-left">
                <img 
                  src={approvedMachine.img} 
                  alt={approvedMachine.name} 
                  className="w-12 h-12 object-contain rounded-lg bg-white p-1 border border-slate-200" 
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Subscribed Machine</p>
                  <p className="text-sm font-black text-slate-800 uppercase truncate">{approvedMachine.name}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleActivateMachineDirect(approvedMachine.id)}
                className="w-full py-4 bg-[#009e42] hover:bg-[#02d147] active:scale-[0.98] transition-all text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-md flex items-center justify-center gap-2 font-sans"
              >
                <Zap size={14} /> Activate Mining Machine
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
