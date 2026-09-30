import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Lock, 
  Unlock, 
  Play, 
  Cpu, 
  Zap, 
  Sparkles, 
  Check,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Clock,
  Info,
  TrendingUp,
  Activity,
  Award,
  Copy,
  ExternalLink,
  Globe,
  Coins,
  MessageSquare,
  CheckCircle,
  QrCode
} from 'lucide-react';
import { cn, formatCurrency, formatNumberWithCommas, parseFormattedNumber } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot,
  doc,
  updateDoc,
  addDoc
} from 'firebase/firestore';
import { toast } from 'sonner';
import { QRCodeCanvas } from 'qrcode.react';
import { detectUserLocation } from '../utils/geo';

interface ColorTheme {
  primary: string;
  bg: string;
  border: string;
  borderHover: string;
  glow: string;
  badge: string;
  btnGrad: string;
  activeBorder: string;
  activeShadow: string;
  textGlow: string;
}

interface Robot {
  id: string;
  name: string;
  version: string;
  roi: string;
  roiRate: number;
  upgradePrice: number;
  image: string;
  description: string;
  speed: string;
  accuracy: string;
  strategy: string;
  riskProfile: string;
  executionDetails: string;
  colorTheme: ColorTheme;
}

const ROBOTS: Robot[] = [
  {
    id: 'ai-2.0',
    name: 'AI 2.0',
    version: 'v2.0.1-stable',
    roi: '2.0%',
    roiRate: 0.02,
    upgradePrice: 50,
    image: 'https://i.imgur.com/JGTKlCJ.png',
    description: 'Neural-network based trading engine optimized for G10 currency liquidity and spread arbitrage.',
    speed: '0.2ms latency',
    accuracy: '97.2% success rate',
    strategy: 'Deep Neural Network Trend Prediction',
    riskProfile: 'Low - Conservative Balanced',
    executionDetails: 'Deploys a feed-forward recursive neural network tracking order book pressure from institutional liquidity partners for short-term trend execution.',
    colorTheme: {
      primary: 'text-emerald-400',
      bg: 'from-emerald-950/20 via-stone-900/40 to-stone-950/60',
      border: 'border-emerald-500/10',
      borderHover: 'hover:border-emerald-500/20',
      glow: 'bg-emerald-500',
      badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      btnGrad: 'from-emerald-600 to-emerald-500 hover:shadow-emerald-500/20',
      activeBorder: 'border-emerald-500/40',
      activeShadow: 'shadow-[0_0_30px_rgba(16,185,129,0.15)]',
      textGlow: 'shadow-[0_0_12px_rgba(16,185,129,0.3)]'
    }
  },
  {
    id: 'ai-2.5',
    name: 'AI 2.5',
    version: 'v2.5.0-beta',
    roi: '2.5%',
    roiRate: 0.025,
    upgradePrice: 200,
    image: 'https://i.imgur.com/3DpE79P.png',
    description: 'Advanced multi-agent deep learning model optimized for cross-border treasury swaps and volatility tracking.',
    speed: '0.1ms latency',
    accuracy: '98.9% success rate',
    strategy: 'Multi-Agent Reinforcement Learning',
    riskProfile: 'Moderate - Dynamic Rebalancing',
    executionDetails: 'Employs automated reinforcement learning agents acting in cooperative micro-pools to optimize synthetic swap spreads and volatility hedge offsets.',
    colorTheme: {
      primary: 'text-cyan-400',
      bg: 'from-cyan-950/20 via-stone-900/40 to-stone-950/60',
      border: 'border-cyan-500/10',
      borderHover: 'hover:border-cyan-500/20',
      glow: 'bg-cyan-500',
      badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      btnGrad: 'from-cyan-600 to-cyan-500 hover:shadow-cyan-500/20',
      activeBorder: 'border-cyan-500/40',
      activeShadow: 'shadow-[0_0_30px_rgba(6,182,212,0.15)]',
      textGlow: 'shadow-[0_0_12px_rgba(6,182,212,0.3)]'
    }
  },
  {
    id: 'ai-3.0',
    name: 'AI 3.0',
    version: 'v3.0.0-enterprise',
    roi: '3.0%',
    roiRate: 0.03,
    upgradePrice: 500,
    image: 'https://i.imgur.com/dZqi2MZ.png',
    description: 'The pinnacle of automated trading technology. Employs quantum-resistant predictive analysis and sovereign hedging pools.',
    speed: '0.05ms latency',
    accuracy: '99.7% success rate',
    strategy: 'Quantum-Inspired Predictive Sovereignty Pool',
    riskProfile: 'Institutional Safe Sovereign',
    executionDetails: 'Our flagship algorithmic solution. Integrates high-dimensional quantum-inspired neural predictors with multi-tiered sovereign pool insurance backups.',
    colorTheme: {
      primary: 'text-purple-400',
      bg: 'from-purple-950/20 via-stone-900/40 to-stone-950/60',
      border: 'border-purple-500/10',
      borderHover: 'hover:border-purple-500/20',
      glow: 'bg-purple-500',
      badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      btnGrad: 'from-purple-600 to-purple-500 hover:shadow-purple-500/20',
      activeBorder: 'border-purple-500/40',
      activeShadow: 'shadow-[0_0_30px_rgba(168,85,247,0.15)]',
      textGlow: 'shadow-[0_0_12px_rgba(168,85,247,0.3)]'
    }
  }
];

const CRYPTO_ADDRESSES = {
  usdt: "TJTym5Qs77hBEr2kEiJPVEQwR4kM2AosSG",
  btc: "bc1p2mw24svf4yg5d6v4lxk5309jlcgcqjdagaefuc0adac9z4ys2p5qfq9t8t"
};

export default function AIMarketplace() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [pendingUpgrades, setPendingUpgrades] = useState<string[]>([]);
  const [isActivating, setIsActivating] = useState<string | null>(null);
  const [selectedRobot, setSelectedRobot] = useState<Robot | null>(null);
  
  // Custom Flow States
  const [currentView, setCurrentView] = useState<'marketplace' | 'pay' | 'success'>('marketplace');
  const [upgradeInvestmentAmount, setUpgradeInvestmentAmount] = useState<string>('');
  const [transactionId, setTransactionId] = useState<string>('');
  const [selectedCrypto, setSelectedCrypto] = useState<'usdt' | 'btc'>('usdt');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [exchangeRate, setExchangeRate] = useState<number>(1400);
  const [paymentMode, setPaymentMode] = useState<'transfer' | 'wallet'>('transfer');
  const [selectedWalletSource, setSelectedWalletSource] = useState<'available_balance' | 'funding_balance' | null>(null);
  const [enableWalletUpgradePayment, setEnableWalletUpgradePayment] = useState<boolean>(false);
  const [detectedCountry, setDetectedCountry] = useState<string | null>(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone.toLowerCase();
      if (tz.includes('lagos')) return 'Nigeria';
    } catch (e) {}
    return 'Nigeria';
  });

  // Load system exchange rate and wallet payment settings
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'system'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setExchangeRate(data.usd_to_ngn_rate || 1400);
        setEnableWalletUpgradePayment(data.enable_wallet_upgrade_payment !== undefined ? !!data.enable_wallet_upgrade_payment : true);
      }
    }, (err) => {
      console.error("Failed to load settings snapshot:", err);
    });
    return () => unsubscribe();
  }, []);

  // Geolocation detection
  useEffect(() => {
    async function loadDetectedLocation() {
      try {
        const result = await detectUserLocation();
        setDetectedCountry(result.country);
      } catch (err) {
        console.error("Failed to run geolocation protocol:", err);
      }
    }
    loadDetectedLocation();
  }, []);

  const selectedCountry = profile?.country || profile?.countryName || detectedCountry || 'Nigeria';
  const isNigeria = selectedCountry === 'Nigeria';

  // Subscribe to pending upgrade transaction requests for the current user
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'transactions'),
      where('user_id', '==', user.uid),
      where('type', '==', 'ai_upgrade'),
      where('status', '==', 'Pending')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const pendingNames = snapshot.docs.map(doc => doc.data().robot_name || doc.data().selected_bot);
      setPendingUpgrades(pendingNames);
    }, (error) => {
      console.error("Error subscribing to pending robot upgrades:", error);
    });

    return () => unsubscribe();
  }, [user]);

  const getPlanInfoForRobot = (robotId: string) => {
    if (robotId === 'ai-2.5') {
      return {
        planId: 'premium',
        planName: 'Premium Plan',
        minAmount: 200
      };
    } else if (robotId === 'ai-3.0') {
      return {
        planId: 'elite',
        planName: 'Elite Plan',
        minAmount: 500
      };
    } else {
      return {
        planId: 'regular',
        planName: 'Regular Plan',
        minAmount: 50
      };
    }
  };

  const handleUpgrade = (robot: Robot) => {
    setSelectedRobot(robot);
    setTransactionId('');
    const planInfo = getPlanInfoForRobot(robot.id);
    setUpgradeInvestmentAmount(planInfo.minAmount.toString());
    setCurrentView('pay');
  };

  const handleActivate = async (robot: Robot) => {
    if (!user) return;
    setIsActivating(robot.id);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        active_robot: robot.name
      });
      toast.success(`${robot.name} engine activated successfully!`);
    } catch (error) {
      console.error("Activation failed:", error);
      toast.error("Failed to activate trading robot.");
    } finally {
      setIsActivating(null);
    }
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleContactSupport = () => {
    if (!selectedRobot) return;
    const number = "+2347052532095";
    const text = `Hello Support Team,

I have completed payment for an AI Trading Bot upgrade.

Bot Version: ${selectedRobot.name}

Kindly review and approve my upgrade request so I can activate the trading bot within my account.

Thank you.`;
    const encodedText = encodeURIComponent(text);
    const telegramUrl = `https://t.me/cga_help?text=${encodedText}`;
    window.open(telegramUrl, '_blank', 'noopener,noreferrer');
  };

  const handleOkClick = () => {
    setCurrentView('marketplace');
    setSelectedRobot(null);
    setTransactionId('');
  };

  const handleSubmitPayment = async () => {
    if (!user || !selectedRobot || !transactionId) return;
    setIsSubmitting(true);
    try {
      const txData = {
        user_id: user.uid,
        user_name: profile?.username || profile?.name || user.email || 'Anonymous',
        type: 'ai_upgrade',
        robot_name: selectedRobot.name,
        selected_bot: selectedRobot.name,
        amount: selectedRobot.upgradePrice,
        transaction_id: transactionId,
        tx_id: transactionId,
        status: 'Pending',
        created_at: new Date().toISOString()
      };

      await addDoc(collection(db, 'transactions'), txData);
      toast.success("AI Bot Upgrade payment submitted!");
      setCurrentView('success');
    } catch (err) {
      console.error("Payment submission failed:", err);
      toast.error("Failed to submit payment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWalletPayment = async () => {
    if (!user || !profile || !selectedRobot || !selectedWalletSource) return;

    if (!enableWalletUpgradePayment) {
      toast.error("Wallet payment for AI Bot upgrades is currently disabled.");
      return;
    }

    const price = selectedRobot.upgradePrice;
    const sourceWallet = selectedWalletSource;
    const currentBalance = profile[sourceWallet] || 0;

    if (currentBalance < price) {
      toast.error(`Insufficient ${sourceWallet === 'available_balance' ? 'Available Balance' : 'Deposit Balance'} for this upgrade.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const { runTransaction, doc, collection } = await import('firebase/firestore');
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists()) throw new Error("User document not found.");

        const userData = userSnap.data();
        const freshBalance = userData[sourceWallet] || 0;
        if (freshBalance < price) {
          throw new Error(`Insufficient ${sourceWallet === 'available_balance' ? 'Available Balance' : 'Deposit Balance'} for this upgrade.`);
        }

        // 1. Deduct funds from the selected wallet
        const userUpdates: any = {
          [sourceWallet]: freshBalance - price
        };

        // 2. Unlock the robot immediately (since wallet payment is auto-approved)
        const unlocked = userData.unlocked_robots || [];
        const robotName = selectedRobot.name;
        const updatedUnlocked = unlocked.includes(robotName) ? unlocked : [...unlocked, robotName];
        userUpdates.unlocked_robots = updatedUnlocked;

        transaction.update(userRef, userUpdates);

        // 3. Create normal transaction history entry marked as 'Approved' / 'Active'
        const txRef = doc(collection(db, 'transactions'));
        transaction.set(txRef, {
          user_id: user.uid,
          user_name: userData.username || userData.name || user.email || 'Anonymous',
          type: 'ai_upgrade',
          robot_name: selectedRobot.name,
          selected_bot: selectedRobot.name,
          amount: price,
          transaction_id: `wallet_${sourceWallet}_${Date.now()}`,
          tx_id: `wallet_${sourceWallet}_${Date.now()}`,
          status: 'Active',
          created_at: new Date().toISOString()
        });

        // 4. Create a notification
        const notifRef = doc(collection(db, 'notifications'));
        transaction.set(notifRef, {
          user_id: user.uid,
          title: 'AI Trading Robot Unlocked! 🤖',
          message: `Your payment of $${price} from your ${sourceWallet === 'available_balance' ? 'Available Balance' : 'Deposit Balance'} has been processed. ${robotName} has been unlocked immediately.`,
          type: 'success',
          read: false,
          created_at: new Date().toISOString()
        });
      });

      toast.success(`${selectedRobot.name} unlocked successfully using wallet funds!`);
      setCurrentView('success');
    } catch (error: any) {
      console.error("Wallet upgrade failed:", error);
      toast.error(error.message || "Failed to complete wallet payment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const unlockedRobots = profile?.unlocked_robots || [];
  const activeRobotName = profile?.active_robot;
  const avail = profile?.available_balance || 0;
  const fund = profile?.funding_balance || 0;
  const showWalletOption = selectedRobot ? (enableWalletUpgradePayment && (avail >= selectedRobot.upgradePrice || fund >= selectedRobot.upgradePrice)) : false;

  return (
    <div className="min-h-screen text-white relative overflow-hidden bg-[#06080c]">
      {/* BACKGROUND IMAGE REFINEMENT: Reduce background image opacity/visibility by 70% to 0.15 for pristine visual contrast */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-fixed pointer-events-none z-0" 
        style={{ 
          backgroundImage: "url('https://i.imgur.com/4PGuFdH.png')",
          opacity: 0.15
        }} 
      />
      {/* Subtle white overlay above background image to create a lighter appearance behind content and elevate contrast */}
      <div className="absolute inset-0 bg-white/[0.04] pointer-events-none z-0" />

      {/* CSS style injection for continuous, hardware-accelerated marquee */}
      <style>{`
        @keyframes marquee {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        .animate-marquee {
          display: inline-block;
          white-space: nowrap;
          animation: marquee 35s linear infinite;
        }
      `}</style>

      {/* Decorative Cybernetic Background elements */}
      <div className="absolute top-[500px] left-0 w-full h-[600px] bg-gradient-to-b from-purple-950/5 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-1/2 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* HERO BACKGROUND REPLACEMENT - Edge-to-edge rendering */}
      <div className="w-full relative h-[260px] sm:h-[340px] lg:h-[420px] overflow-hidden border-b border-white/5">
        <img 
          src="https://i.imgur.com/st3mBBm.png" 
          alt="AI Portal Banner" 
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center filter brightness-[0.7] contrast-[1.05]"
        />
        {/* Cinema shadow gradients to isolate content */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#06080c]/80 via-transparent to-black/50" />

        {/* Subtle full-width glassmorphism strip spanning horizontally floating over the bottom area of the Hero Section */}
        <div className="absolute bottom-4 left-0 right-0 w-full bg-black/45 backdrop-blur-[8px] border-y border-white/10 py-2.5 px-4 sm:px-8 z-20 flex items-center shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
          {/* Pulsing indicator */}
          <div className="flex items-center gap-1.5 mr-3 sm:mr-4 border-r border-white/10 pr-3 shrink-0">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-500"></span>
            </span>
            <span className="text-[7.5px] sm:text-[8.5px] font-black tracking-widest text-cyan-400 uppercase font-mono">SYSTEM LOG</span>
          </div>

          {/* Marquee Text */}
          <div className="flex-1 overflow-hidden relative w-full h-4 sm:h-5">
            <div className="animate-marquee whitespace-nowrap text-[9px] sm:text-xs font-semibold text-white/90 tracking-wider inline-block">
              Deploy ultra-high-frequency algorithmic trading robots powered by recurrent neural networks. Upgrade to unlock faster, higher-yield execution layers. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Deploy ultra-high-frequency algorithmic trading robots powered by recurrent neural networks. Upgrade to unlock faster, higher-yield execution layers.
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-6 sm:mt-12 pb-24 relative z-10">
        <AnimatePresence mode="wait">
          {/* VIEW 1: MARKETPLACE */}
          {(currentView === 'marketplace' || currentView === 'pay' || currentView === 'success') && (
            <motion.div
              key="marketplace"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              {/* Compact 2x2 on Mobile / 4-column on Desktop Grid Layout */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 lg:gap-8">
                {ROBOTS.map((robot) => {
                  const isUnlocked = unlockedRobots.includes(robot.name);
                  const isActive = activeRobotName === robot.name;
                  const isPending = pendingUpgrades.includes(robot.name);
                  const isLocked = !isUnlocked;
                  const theme = robot.colorTheme;

                  return (
                    <div key={robot.id} className="flex flex-col gap-3.5 sm:gap-4 h-full">
                      {/* Square Card */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                        className={cn(
                          "relative group rounded-[20px] sm:rounded-[36px] border transition-all duration-500 flex flex-col justify-between overflow-hidden backdrop-blur-2xl p-3 sm:p-5 aspect-square select-none hover:-translate-y-1.5 shadow-[0_20px_45px_rgba(0,0,0,0.85)] hover:shadow-[0_30px_60px_rgba(0,0,0,0.95)] bg-gradient-to-b from-[#0c0e14]/98 to-[#06080c]/98 w-full",
                          theme.border,
                          theme.borderHover,
                          isActive ? cn(theme.activeBorder, theme.activeShadow, "shadow-[0_0_35px_rgba(255,255,255,0.08)]") : ""
                        )}
                      >
                        {/* Visual Status Indicator / Pulse effect */}
                        {isActive && (
                          <div className={cn("absolute inset-0 border rounded-[20px] sm:rounded-[36px] pointer-events-none animate-[pulse_2s_infinite]", theme.activeBorder)} />
                        )}

                        {/* Top Bar with Name & Learn More */}
                        <div className="flex justify-between items-center z-10 w-full mb-1 sm:mb-1.5">
                          <span className={cn("text-[9px] sm:text-xs font-black tracking-wider uppercase", theme.primary)}>
                            {robot.name}
                          </span>
                          
                          <button
                            onClick={() => setSelectedRobot(robot)}
                            className="px-1.5 py-0.5 sm:px-2.5 sm:py-1 bg-white/5 hover:bg-white/10 text-[6px] sm:text-[8px] font-black uppercase tracking-widest text-gray-300 hover:text-white border border-white/10 rounded-full transition-all duration-300 cursor-pointer"
                          >
                            Learn More
                          </button>
                        </div>

                        {/* Centered Robot Image Area */}
                        <div className="relative flex-1 flex flex-col items-center justify-center my-1 sm:my-2 w-full min-h-0">
                          {/* Glowing Aura Behind Robot */}
                          <div className={cn(
                            "absolute w-16 h-16 sm:w-28 sm:h-28 rounded-full blur-2xl opacity-40 transition-all duration-500",
                            isActive ? theme.glow : "bg-gray-800/20"
                          )} />
                          
                          {/* Robot Image Wrapper perfectly centered and scaled */}
                          <div className="relative z-10 w-[82%] h-[82%] flex items-center justify-center">
                            <img 
                              src={robot.image} 
                              alt={robot.name} 
                              className={cn(
                                "w-full h-full object-contain transition-transform duration-500 group-hover:scale-105 filter drop-shadow-[0_16px_24px_rgba(0,0,0,0.7)]",
                                isLocked && "grayscale opacity-40"
                              )}
                              referrerPolicy="no-referrer"
                            />

                            {/* Lock Overlay */}
                            {isLocked && !isPending && (
                              <div className="absolute top-0.5 left-0.5 bg-black/75 backdrop-blur-md rounded-lg border border-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.5)] text-gray-300 w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center z-20">
                                <Lock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Bottom Stats - Only ROI percentage inside the card */}
                        <div className="flex flex-col items-center z-10 w-full mt-auto">
                          <span className="text-[9px] sm:text-xs font-black tracking-wide text-white/95">
                            {robot.roi} Daily ROI
                          </span>
                        </div>
                      </motion.div>

                      {/* Unlock / Upgrade / Activate button placed outside and centered horizontally below each card */}
                      <div className="w-full flex justify-center">
                        {isActive ? (
                          <span 
                            className="w-full py-3 sm:py-4 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-2xl text-[9px] sm:text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(16,185,129,0.1)]"
                          >
                            <Check size={14} className="sm:w-4 sm:h-4" />
                            Active
                          </span>
                        ) : isPending ? (
                          <span 
                            className="w-full py-3 sm:py-4 bg-yellow-400/15 text-yellow-500 border border-yellow-400/30 rounded-2xl text-[9px] sm:text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(234,179,8,0.1)]"
                          >
                            <Clock size={14} className="animate-spin sm:w-4 sm:h-4" />
                            Pending
                          </span>
                        ) : isUnlocked ? (
                          <button 
                            onClick={() => handleActivate(robot)}
                            disabled={isActivating !== null}
                            className="w-full py-3 sm:py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl text-[9px] sm:text-[11px] uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.03] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isActivating === robot.id ? (
                              <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Play size={14} fill="currentColor" className="sm:w-4 sm:h-4" />
                            )}
                            Activate
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleUpgrade(robot)}
                            className={cn(
                              "w-full py-3 sm:py-4 bg-gradient-to-r text-white font-black rounded-2xl text-[9px] sm:text-[11px] uppercase tracking-widest transition-all shadow-xl cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.03] active:scale-95",
                              theme.btnGrad
                            )}
                          >
                            <Zap size={14} className="sm:w-4 sm:h-4" />
                            Unlock {formatCurrency(robot.upgradePrice)}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* STYLE INJECTION TO HIDE NAVBARS AND PREVENT BACKGROUND SCROLLING */}
      {(currentView === 'pay' || currentView === 'success') && (
        <style>{`
          /* Hide Top Navbar */
          nav.sticky.top-4, .sticky.top-4 {
            display: none !important;
          }
          /* Hide Mobile Bottom Nav */
          nav.lg\\:hidden.fixed.bottom-5, nav.bottom-5 {
            display: none !important;
          }
          /* Prevent background page scrolling */
          body {
            overflow: hidden !important;
          }
        `}</style>
      )}

      {/* PREMIUM RESPONSIVE DIALOG (MODAL OVERLAY) */}
      <AnimatePresence>
        {(currentView === 'pay' || currentView === 'success') && selectedRobot && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 md:p-8 overflow-y-auto">
            {/* Elegant backdrop with dark overlay and blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (currentView === 'pay') {
                  setCurrentView('marketplace');
                  setSelectedRobot(null);
                }
              }}
              className="fixed inset-0 bg-[#020305]/92 backdrop-blur-md cursor-pointer z-[1000]"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-lg sm:max-w-xl md:max-w-2xl bg-gradient-to-b from-[#0e111a]/98 via-[#090b11]/98 to-[#040507]/98 border border-white/10 rounded-[32px] p-5 sm:p-8 md:p-10 shadow-[0_30px_70px_rgba(0,0,0,0.95),inset_0_1px_1px_rgba(255,255,255,0.05)] z-[1001] max-h-[85vh] overflow-y-auto custom-scrollbar flex flex-col gap-6"
            >
              {/* Close Button */}
              <button
                onClick={() => {
                  setCurrentView('marketplace');
                  setSelectedRobot(null);
                }}
                className="absolute top-5 right-5 sm:top-6 sm:right-6 p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-all cursor-pointer z-20"
              >
                <X size={18} />
              </button>

              {currentView === 'pay' ? (
                <>
                  <div className="border-b border-white/5 pb-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#009e42] mb-1 block">
                      AI Robot Unlock Portal
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white">
                      Upgrade Required
                    </h2>
                  </div>

                  {/* Robot details */}
                  <div className="space-y-6">
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-[#009e42]/5 rounded-full blur-2xl pointer-events-none" />
                      <div className="w-16 h-16 bg-white/5 rounded-2xl border border-white/10 p-2 shrink-0 flex items-center justify-center">
                        <img 
                          src={selectedRobot.image} 
                          alt={selectedRobot.name} 
                          className="w-full h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[8px] font-black uppercase tracking-wider text-[#009e42] bg-[#009e42]/10 border border-[#009e42]/20 px-2 py-0.5 rounded-md">
                          Selected Bot
                        </span>
                        <p className="text-lg font-black text-white">{selectedRobot.name}</p>
                        <p className="text-[10px] text-aura-muted font-mono">{selectedRobot.version} • {selectedRobot.roi} Daily ROI</p>
                      </div>
                    </div>

                    {/* Notice Block */}
                    <div className="p-5 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex gap-3.5 items-start">
                      <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-xs font-black text-amber-400 uppercase tracking-wider">Plan Eligibility Notice</p>
                        <p className="text-xs text-amber-200/80 leading-relaxed font-semibold uppercase tracking-wide">
                          To unlock this bot, you must upgrade to {getPlanInfoForRobot(selectedRobot.id).planName} and the minimum investment amount is {formatCurrency(getPlanInfoForRobot(selectedRobot.id).minAmount)}.
                        </p>
                      </div>
                    </div>

                    {/* Capital input adjustment block */}
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center px-1">
                        <label className="text-[10px] text-aura-muted uppercase tracking-widest font-black block">
                          Investment Capital ($)
                        </label>
                        <span className="text-[9px] font-mono text-aura-muted uppercase">
                          Min Limit: {formatCurrency(getPlanInfoForRobot(selectedRobot.id).minAmount)}
                        </span>
                      </div>
                      
                      <div className="relative">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-lg font-black text-[#009e42] font-mono">$</span>
                        <input 
                          type="text" 
                          inputMode="decimal"
                          value={upgradeInvestmentAmount}
                          onChange={(e) => setUpgradeInvestmentAmount(formatNumberWithCommas(e.target.value, true))}
                          className="w-full bg-[#030406]/90 border border-white/10 rounded-2xl py-4.5 pl-10 pr-24 text-base sm:text-lg font-black text-white outline-none focus:border-[#009e42]/50 transition-colors"
                          placeholder={formatNumberWithCommas(getPlanInfoForRobot(selectedRobot.id).minAmount)}
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              const min = getPlanInfoForRobot(selectedRobot.id).minAmount;
                              const currentVal = parseFormattedNumber(upgradeInvestmentAmount) || min;
                              setUpgradeInvestmentAmount(formatNumberWithCommas((currentVal + min).toString()));
                            }}
                            className="bg-white/5 hover:bg-white/10 border border-white/10 px-2 py-1 rounded text-[10px] font-black uppercase text-white transition-all cursor-pointer"
                          >
                            +Min
                          </button>
                        </div>
                      </div>

                      {/* Display validation warning if any */}
                      {upgradeInvestmentAmount && parseFormattedNumber(upgradeInvestmentAmount) < getPlanInfoForRobot(selectedRobot.id).minAmount && (
                        <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider ml-1 mt-1">
                          Amount must be at least {formatCurrency(getPlanInfoForRobot(selectedRobot.id).minAmount)}
                        </p>
                      )}
                    </div>

                    {/* Button actions */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentView('marketplace');
                          setSelectedRobot(null);
                        }}
                        className="py-4 px-6 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl border border-white/10 transition-all cursor-pointer active:scale-95"
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        disabled={!upgradeInvestmentAmount || parseFormattedNumber(upgradeInvestmentAmount) < getPlanInfoForRobot(selectedRobot.id).minAmount}
                        onClick={() => {
                          const info = getPlanInfoForRobot(selectedRobot.id);
                          const amt = parseFormattedNumber(upgradeInvestmentAmount) || info.minAmount;
                          
                          // Save preselection to sessionStorage
                          sessionStorage.setItem('preselectPlanId', info.planId);
                          sessionStorage.setItem('preselectAmount', amt.toString());

                          // Close modal and navigate
                          setCurrentView('marketplace');
                          setSelectedRobot(null);
                          navigate('/invest');
                        }}
                        className={cn(
                          "flex-1 py-4 rounded-2xl text-white font-extrabold text-[10px] tracking-widest uppercase transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer",
                          (!upgradeInvestmentAmount || parseFormattedNumber(upgradeInvestmentAmount) < getPlanInfoForRobot(selectedRobot.id).minAmount)
                            ? "bg-[#009e42]/20 text-white/40 cursor-not-allowed"
                            : "bg-[#009e42] hover:bg-[#02d147] active:scale-[0.98] shadow-[0_4px_20px_rgba(0,158,66,0.3)]"
                        )}
                      >
                        Proceed to Invest
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                /* VIEW 3: SUCCESS SCREEN */
                <div className="space-y-6 text-center py-4">
                  <div className="flex justify-center">
                    <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.2)] animate-pulse">
                      <CheckCircle size={36} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-xl sm:text-2xl font-black uppercase tracking-widest text-emerald-400">
                      {paymentMode === 'wallet' ? 'Upgrade Successful' : 'Payment Submitted'}
                    </h2>
                    <p className="text-xs text-aura-muted leading-relaxed max-w-sm mx-auto uppercase font-bold tracking-wider">
                      {paymentMode === 'wallet' 
                        ? 'Your AI Bot Upgrade has been processed and activated. Your new robot is unlocked and ready for activation.'
                        : 'Your AI Bot Upgrade request has been received and is currently under review. Activation will become available immediately after approval.'}
                    </p>
                  </div>

                  {/* Info Block */}
                  <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 space-y-3.5 text-left max-w-sm mx-auto font-mono text-[11px]">
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-aura-muted uppercase font-bold">AI VERSION:</span>
                      <span className="text-white font-black">{selectedRobot.name} ({selectedRobot.version})</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-aura-muted uppercase font-bold">AMOUNT:</span>
                      <span className="text-white font-black">{formatCurrency(selectedRobot.upgradePrice)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-aura-muted uppercase font-bold">STATUS:</span>
                      <span className={cn(
                        "font-black uppercase tracking-widest",
                        paymentMode === 'wallet' ? "text-emerald-400" : "text-amber-500 font-black uppercase tracking-widest animate-pulse"
                      )}>
                        {paymentMode === 'wallet' ? 'COMPLETED / ACTIVE' : 'PENDING REVIEW'}
                      </span>
                    </div>
                  </div>

                  {/* Two buttons */}
                  <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto pt-2">
                    <button
                      onClick={handleContactSupport}
                      className="py-4 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest text-[9px] rounded-xl border border-white/10 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                      <MessageSquare size={13} />
                      Contact Support
                    </button>

                    <button
                      onClick={handleOkClick}
                      className="py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black uppercase tracking-widest text-[9px] rounded-xl transition-all shadow-lg shadow-emerald-500/10 cursor-pointer active:scale-95"
                    >
                      OK
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modern Premium Modal Popup for Learn More */}
      <AnimatePresence>
        {selectedRobot && currentView === 'marketplace' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop Blur overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedRobot(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 15 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="bg-[#0f111a]/95 border border-white/10 backdrop-blur-xl max-w-lg w-full p-6 sm:p-8 rounded-[32px] shadow-2xl relative z-10 text-white overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedRobot(null)}
                className="absolute top-6 right-6 p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-all cursor-pointer"
              >
                <X size={16} />
              </button>

              {/* Header with Title & Accent */}
              <div className="mb-6">
                <div className="flex items-center gap-3">
                  <h3 className={cn("text-2xl font-black tracking-tight uppercase font-serif italic", selectedRobot.colorTheme.primary)}>
                    {selectedRobot.name}
                  </h3>
                  <span className="text-[10px] font-mono bg-white/5 border border-white/10 px-2.5 py-0.5 rounded text-gray-400">
                    {selectedRobot.version}
                  </span>
                </div>
                <p className="text-[10px] text-aura-muted uppercase tracking-widest mt-1 font-bold">
                  High-Frequency Algorithmic System
                </p>
              </div>

              {/* Center Colored Robot Image Area - Refined Hero Presentation */}
              <div className="flex flex-col justify-center items-center py-8 bg-gradient-to-b from-white/[0.03] to-transparent rounded-[24px] border border-white/10 mb-6 relative overflow-hidden group">
                <div className={cn("absolute w-44 h-44 rounded-full blur-3xl opacity-35 transition-transform duration-1000 group-hover:scale-125", selectedRobot.colorTheme.glow)} />
                
                {/* Tech blueprint lines back-pattern */}
                <div className="absolute inset-0 bg-[radial-gradient(#ffffff05_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

                <img 
                  src={selectedRobot.image} 
                  alt={selectedRobot.name} 
                  className="w-40 h-40 sm:w-48 sm:h-48 object-contain relative z-10 filter drop-shadow-[0_15px_30px_rgba(0,0,0,0.8)] transition-transform duration-500 hover:scale-105"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Grid Specifications */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3">
                  <span className="text-[9px] uppercase tracking-wider text-aura-muted flex items-center gap-1">
                    <TrendingUp size={10} />
                    Expected Yield
                  </span>
                  <span className={cn("text-lg font-black block mt-1", selectedRobot.colorTheme.primary)}>
                    {selectedRobot.roi} Daily
                  </span>
                </div>

                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3">
                  <span className="text-[9px] uppercase tracking-wider text-aura-muted flex items-center gap-1">
                    <Activity size={10} />
                    Accuracy Rating
                  </span>
                  <span className="text-lg font-black block text-emerald-400 mt-1">
                    {selectedRobot.accuracy}
                  </span>
                </div>

                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3">
                  <span className="text-[9px] uppercase tracking-wider text-aura-muted flex items-center gap-1">
                    <Cpu size={10} />
                    latency delay
                  </span>
                  <span className="text-lg font-black block text-cyan-400 mt-1">
                    {selectedRobot.speed}
                  </span>
                </div>

                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3">
                  <span className="text-[9px] uppercase tracking-wider text-aura-muted flex items-center gap-1">
                    <Award size={10} />
                    Risk Matrix
                  </span>
                  <span className="text-sm font-black block text-purple-400 mt-1 truncate">
                    {selectedRobot.riskProfile}
                  </span>
                </div>
              </div>

              {/* Detailed Descriptions */}
              <div className="space-y-4 text-xs sm:text-sm text-aura-muted leading-relaxed">
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-white mb-1.5">Description</h4>
                  <p className="bg-white/[0.01] p-3 rounded-xl border border-white/[0.02] text-gray-300">
                    {selectedRobot.description}
                  </p>
                </div>

                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-white mb-1.5">Algorithmic Strategy</h4>
                  <p className="bg-white/[0.01] p-3 rounded-xl border border-white/[0.02] text-gray-300">
                    {selectedRobot.strategy}
                  </p>
                </div>

                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-white mb-1.5">Execution Methodology</h4>
                  <p className="bg-white/[0.01] p-3 rounded-xl border border-white/[0.02] text-gray-300">
                    {selectedRobot.executionDetails}
                  </p>
                </div>
              </div>

              {/* Action/Dismiss Button */}
              <div className="mt-8 flex justify-end">
                <button
                  onClick={() => setSelectedRobot(null)}
                  className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white border border-white/10 rounded-xl transition-all cursor-pointer"
                >
                  Close Details
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
