import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Gift, 
  Trophy, 
  Lock, 
  Coins, 
  Timer, 
  CheckCircle2, 
  Info,
  TrendingUp,
  X,
  Bell,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  History,
  Sparkles,
  ArrowRightLeft,
  Wallet,
  Check,
  Calendar,
  AlertCircle,
  PiggyBank,
  Search,
  ArrowLeft,
  Users,
  Copy,
  HelpCircle,
  Cpu,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, isWithdrawalAllowed, formatCurrency, formatNumberWithCommas, parseFormattedNumber } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { useUIConfig } from '../contexts/UIConfigContext';
import { useUI } from '../contexts/UIContext';
import { useMode } from '../contexts/ModeContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { db, auth } from '../lib/firebase';
import { broadcastActivity } from '../lib/activity_logger';
import { 
  collection, 
  doc, 
  query, 
  where, 
  orderBy, 
  updateDoc, 
  increment, 
  arrayUnion, 
  addDoc, 
  onSnapshot,
  runTransaction,
  getDocs
} from 'firebase/firestore';
import { toast } from 'sonner';
import PinProtocolModal from './PinProtocolModal';
import { TransactionTicket } from './TransactionTicket';

// Nigerian banks list for the withdrawal selector
const NIGERIAN_BANKS = [
  "Opay", "Kuda Bank", "Moniepoint MFB", "PalmPay", "Carbon", "FairMoney Microfinance Bank", 
  "VFD Microfinance Bank (VBank)", "Sparkle Microfinance Bank", "Eyowo", "Access Bank", 
  "Zenith Bank", "Guaranty Trust Bank (GTBank)", "First Bank of Nigeria", 
  "United Bank for Africa (UBA)", "Fidelity Bank", "Wema Bank", "Ecobank Nigeria", 
  "First City Monument Bank (FCMB)", "Sterling Bank", "Polaris Bank", "Union Bank of Nigeria", 
  "Keystone Bank", "Unity Bank", "Stanbic IBTC Bank", "Standard Chartered Bank Nigeria"
];

interface Investment {
  id: string;
  amount: number;
  plan_name: string;
  status: string;
  reward_claimed?: boolean;
  created_at?: string;
}

interface ReferralPartner {
  id: string;
  name: string;
  username: string;
  email: string;
  created_at: string;
  country?: string;
  status: 'active' | 'inactive';
  last_rebook?: string;
  active_investment_amount?: number;
  planName?: string;
}

// Compact Guide Cards
const GUIDE_CARDS = [
  {
    id: 'daily',
    title: 'Daily Check-in Reward',
    shortDesc: 'Earn 1 PTS daily by checking in on your reward calendar.',
    fullDesc: 'Logging in every 24 hours logs your attendance, feeding into your activity ledger and incrementing streaks.'
  },
  {
    id: 'investment',
    title: 'Investment Bonus',
    shortDesc: 'Instantly claim 2.00% cashback bonus upon node activation.',
    fullDesc: 'Get an instant 2.00% cashback multiplier of your node principal credited directly to your reward wallet.'
  },
  {
    id: 'exchange',
    title: 'Exchange Mechanism',
    shortDesc: 'Convert earned PTS directly into USD cash balance at $0.10/point.',
    fullDesc: 'Use our real-time conversion converter to swap PTS into USD reward balance with 0 protocol swap fees.'
  },
  {
    id: 'protocols',
    title: 'Settlement Guides',
    shortDesc: 'Withdraw rewards starting at $10.00 USD with security transfer PIN.',
    fullDesc: 'Withdrawal protocol settlements feature secure processing to TRC-20 USDT wallets or direct local bank accounts.'
  }
];

// Bank Selector Modal component
function BankSelectorModal({ 
  isOpen, 
  onClose, 
  onSelect, 
  selectedBank 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onSelect: (bank: string) => void,
  selectedBank: string 
}) {
  const [search, setSearch] = useState('');
  const filteredBanks = NIGERIAN_BANKS.filter(bank => 
    bank.toLowerCase().includes(search.toLowerCase())
  );
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-[400px] bg-white dark:bg-[#0d1016] border border-slate-200 dark:border-white/10 rounded-[28px] overflow-hidden flex flex-col max-h-[80vh] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-100 dark:border-white/5 space-y-4 shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest italic">Select Institution</h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full text-slate-400 hover:text-slate-700 dark:text-white/40 dark:hover:text-white cursor-pointer">
              <X size={20} />
            </button>
          </div>
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/20" />
            <input 
              type="text"
              autoFocus
              placeholder="Search banks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm text-slate-800 dark:text-white outline-none focus:border-emerald-500/50 font-medium placeholder:text-slate-400"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 scrollbar-none">
          {filteredBanks.map((bank, idx) => (
            <button
              key={`${bank}-${idx}`}
              onClick={() => {
                onSelect(bank);
                onClose();
              }}
              className={cn(
                "w-full px-6 py-4 text-left rounded-2xl transition-all flex items-center justify-between cursor-pointer",
                selectedBank === bank 
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold" 
                  : "hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-white/70 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <span className="text-xs font-bold uppercase tracking-wide">{bank}</span>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// PREMIUM 3D VECTOR SVG ICONS UNDER LIGHTWEIGHT PROTOCOL
const Icon3DDailyPoints = () => (
  <motion.div 
    className="relative w-20 h-20 flex items-center justify-center filter drop-shadow-[0_8px_20px_rgba(16,185,129,0.35)]"
    whileHover={{ scale: 1.1, rotateY: 10, rotateX: -5 }}
    transition={{ type: "spring", stiffness: 300, damping: 15 }}
  >
    <svg className="w-16 h-16" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gradCoin_dp" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="50%" stopColor="#EAB308" />
          <stop offset="100%" stopColor="#854D0E" />
        </linearGradient>
        <linearGradient id="gradCheck_dp" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <linearGradient id="gradCal_dp" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#374151" />
          <stop offset="100%" stopColor="#111827" />
        </linearGradient>
        <radialGradient id="glow_dp" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#10B981" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Ambient background glow */}
      <circle cx="32" cy="32" r="28" fill="url(#glow_dp)" />

      {/* 3D Calendar Sheet in Background */}
      <rect x="14" y="10" width="36" height="38" rx="6" fill="url(#gradCal_dp)" stroke="#4B5563" strokeWidth="1.5" />
      <path d="M14 18H50" stroke="#4B5563" strokeWidth="1.5" />
      <circle cx="22" cy="14" r="2" fill="#EF4444" />
      <circle cx="42" cy="14" r="2" fill="#EF4444" />

      {/* 3D Stack of Glowing Coins on the bottom right */}
      {/* Coin 3 (Bottom) */}
      <ellipse cx="28" cy="46" rx="14" ry="5" fill="#713F12" />
      <ellipse cx="28" cy="44" rx="14" ry="5" fill="url(#gradCoin_dp)" stroke="#A16207" strokeWidth="1" />
      
      {/* Coin 2 (Middle) */}
      <ellipse cx="26" cy="41" rx="14" ry="5" fill="#713F12" />
      <ellipse cx="26" cy="39" rx="14" ry="5" fill="url(#gradCoin_dp)" stroke="#A16207" strokeWidth="1" />

      {/* Coin 1 (Top) */}
      <ellipse cx="25" cy="35" rx="14" ry="5" fill="#713F12" />
      <ellipse cx="25" cy="33" rx="14" ry="5" fill="url(#gradCoin_dp)" stroke="#CA8A04" strokeWidth="1" />
      <circle cx="25" cy="33" r="5" fill="#FEF08A" opacity="0.6" />

      {/* Floating Sparkles & Small Coins */}
      <ellipse cx="46" cy="24" rx="6" ry="2.5" fill="url(#gradCoin_dp)" stroke="#CA8A04" strokeWidth="0.75" />
      <circle cx="48" cy="14" r="1.5" fill="#FDE047" />
      <circle cx="12" cy="36" r="2.5" fill="#FDE047" />

      {/* Giant 3D glowing checkmark overlay */}
      <path d="M30 32L38 40L54 20" stroke="#064E3B" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M30 32L38 40L54 20" stroke="url(#gradCheck_dp)" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M32 32L38 38L52 21" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
    </svg>
  </motion.div>
);

const Icon3DReferFriends = () => (
  <motion.div 
    className="relative w-20 h-20 flex items-center justify-center filter drop-shadow-[0_8px_20px_rgba(168,85,247,0.35)]"
    whileHover={{ scale: 1.1, rotateY: -10, rotateX: 5 }}
    transition={{ type: "spring", stiffness: 300, damping: 15 }}
  >
    <svg className="w-16 h-16" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="metalSilver_rf" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#9CA3AF" />
          <stop offset="100%" stopColor="#374151" />
        </linearGradient>
        <linearGradient id="neonPurple_rf" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C084FC" />
          <stop offset="50%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#5B21B6" />
        </linearGradient>
        <linearGradient id="glowPurple_rf" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A855F7" />
          <stop offset="100%" stopColor="#D946EF" />
        </linearGradient>
      </defs>

      {/* Subtle background network connection lines */}
      <path d="M16 38L32 24M32 24L48 38M16 38H48" stroke="url(#glowPurple_rf)" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
      <circle cx="16" cy="38" r="3" fill="#A855F7" className="animate-pulse" />
      <circle cx="48" cy="38" r="3" fill="#D946EF" className="animate-pulse" />
      <circle cx="32" cy="24" r="3" fill="#22D3EE" />

      {/* Avatar Left (Smaller, Partner 1) */}
      <g transform="translate(4, 18)">
        <circle cx="12" cy="20" r="8" fill="url(#metalSilver_rf)" stroke="#111827" strokeWidth="1.5" />
        <path d="M4 34C4 28 8 26 12 26C16 26 20 28 20 34V36H4V34Z" fill="url(#metalSilver_rf)" stroke="#111827" strokeWidth="1.5" />
      </g>

      {/* Avatar Right (Smaller, Partner 2) */}
      <g transform="translate(36, 18)">
        <circle cx="12" cy="20" r="8" fill="url(#metalSilver_rf)" stroke="#111827" strokeWidth="1.5" />
        <path d="M4 34C4 28 8 26 12 26C16 26 20 28 20 34V36H4V34Z" fill="url(#metalSilver_rf)" stroke="#111827" strokeWidth="1.5" />
      </g>

      {/* Avatar Center (Larger, Primary Referrer) */}
      <g transform="translate(18, 6)">
        <circle cx="14" cy="20" r="11" fill="url(#neonPurple_rf)" stroke="#111827" strokeWidth="2" />
        <circle cx="14" cy="20" r="9" fill="white" opacity="0.08" />
        <path d="M3 38C3 30 8 27 14 27C20 27 25 30 25 38V41H3V38Z" fill="url(#neonPurple_rf)" stroke="#111827" strokeWidth="2" />
      </g>

      {/* Floating Invite Plus Badge on top */}
      <circle cx="44" cy="46" r="8" fill="#22D3EE" stroke="#111827" strokeWidth="1.5" />
      <path d="M44 42V50M40 46H48" stroke="#111827" strokeWidth="2" strokeLinecap="round" />
    </svg>
  </motion.div>
);

const Icon3DNodeRewards = () => (
  <motion.div 
    className="relative w-20 h-20 flex items-center justify-center filter drop-shadow-[0_8px_20px_rgba(249,115,22,0.35)]"
    whileHover={{ scale: 1.1, rotate: 5 }}
    transition={{ type: "spring", stiffness: 300, damping: 15 }}
  >
    <svg className="w-16 h-16" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="vaultPlate" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4B5563" />
          <stop offset="50%" stopColor="#1F2937" />
          <stop offset="100%" stopColor="#111827" />
        </linearGradient>
        <linearGradient id="neonAmber" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
        <radialGradient id="portalGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Tech background glow ring */}
      <circle cx="32" cy="32" r="28" fill="url(#portalGlow)" />
      <circle cx="32" cy="32" r="27" stroke="#EA580C" strokeWidth="1" strokeDasharray="4 2" opacity="0.6" />

      {/* Armored Hexagonal / Rectangular Vault Body */}
      <rect x="12" y="12" width="40" height="40" rx="8" fill="url(#vaultPlate)" stroke="#374151" strokeWidth="2" />
      
      {/* Corner Bolts */}
      <circle cx="17" cy="17" r="1.5" fill="#9CA3AF" />
      <circle cx="47" cy="17" r="1.5" fill="#9CA3AF" />
      <circle cx="17" cy="47" r="1.5" fill="#9CA3AF" />
      <circle cx="47" cy="47" r="1.5" fill="#9CA3AF" />

      {/* Main Inner Glowing Chamber */}
      <circle cx="32" cy="32" r="14" fill="#0F172A" stroke="url(#neonAmber)" strokeWidth="2.5" />
      
      {/* 3D Shiny Gold Coin emerging from Vault Chamber */}
      <ellipse cx="32" cy="31" rx="9" ry="5.5" fill="#78350F" />
      <ellipse cx="32" cy="29" rx="9" ry="5.5" fill="url(#neonAmber)" stroke="#FEF08A" strokeWidth="1" />
      
      {/* Tech grid lines overlaying vault core */}
      <path d="M22 32H12M42 32H52M32 22V12M32 42V52" stroke="#EA580C" strokeWidth="1" opacity="0.4" />
      <circle cx="32" cy="29" r="2.5" fill="#FFFBEB" opacity="0.8" />

      {/* Floating Sparkles & Digital Claim Particles */}
      <path d="M19 24L21 26M45 24L43 26" stroke="#FDE047" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="28" cy="19" r="1" fill="#FBBF24" />
      <circle cx="38" cy="43" r="1" fill="#FEF08A" />
    </svg>
  </motion.div>
);

const Icon3DRanking = () => (
  <motion.div 
    className="relative w-20 h-20 flex items-center justify-center filter drop-shadow-[0_8px_20px_rgba(6,182,212,0.35)]"
    whileHover={{ scale: 1.1, rotate: -5 }}
    transition={{ type: "spring", stiffness: 300, damping: 15 }}
  >
    <svg className="w-16 h-16" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="goldTrophy" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
        <linearGradient id="podiumGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1E293B" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>
        <linearGradient id="neonCyan_rn" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22D3EE" />
          <stop offset="100%" stopColor="#0891B2" />
        </linearGradient>
      </defs>

      {/* 3D Podium Pedestal Blocks (1-2-3 Layout) */}
      {/* 2nd Place (Left) */}
      <rect x="12" y="38" width="12" height="16" rx="3" fill="url(#podiumGrad)" stroke="#334155" strokeWidth="1" />
      <rect x="12" y="38" width="12" height="3" fill="#3B82F6" />
      <text x="18" y="49" fill="#94A3B8" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">2</text>

      {/* 3rd Place (Right) */}
      <rect x="40" y="42" width="12" height="12" rx="3" fill="url(#podiumGrad)" stroke="#334155" strokeWidth="1" />
      <rect x="40" y="42" width="12" height="3" fill="#64748B" />
      <text x="46" y="51" fill="#94A3B8" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">3</text>

      {/* 1st Place (Center - Higher Block) */}
      <rect x="24" y="30" width="16" height="24" rx="4" fill="url(#podiumGrad)" stroke="#475569" strokeWidth="1.5" />
      <rect x="24" y="30" width="16" height="3" fill="url(#neonCyan_rn)" />
      <text x="32" y="45" fill="#F8FAFC" fontSize="11" fontWeight="extrabold" textAnchor="middle" fontFamily="sans-serif">1</text>

      {/* Outstanding 3D Golden Crown / Trophy symbolism floating on center block */}
      <g transform="translate(16, 6)">
        {/* Crown Body with 3 points */}
        <path d="M22 10L25 15L32 8L39 15L42 10L40 20H24L22 10Z" fill="url(#goldTrophy)" stroke="#78350F" strokeWidth="1.2" />
        {/* Glowing crown headband line & jewel */}
        <rect x="25" y="18" width="14" height="2" fill="#EF4444" rx="0.5" />
        <circle cx="32" cy="8" r="1.5" fill="white" />
        <circle cx="22" cy="10" r="1.2" fill="#22D3EE" />
        <circle cx="42" cy="10" r="1.2" fill="#22D3EE" />
      </g>
    </svg>
  </motion.div>
);

const Icon3DRankingMini = () => (
  <div className="w-5 h-5 inline-flex items-center justify-center relative flex-shrink-0 bg-cyan-400/15 rounded-md p-0.5 border border-cyan-400/25 shadow-md shadow-cyan-500/5 hover:scale-105 transition-all">
    <svg className="w-full h-full" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="goldTrophy_mini" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
        <linearGradient id="podiumGrad_mini" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1E293B" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>
        <linearGradient id="neonCyan_rn_mini" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22D3EE" />
          <stop offset="100%" stopColor="#0891B2" />
        </linearGradient>
      </defs>
      {/* 2nd Place (Left) */}
      <rect x="12" y="38" width="12" height="16" rx="3" fill="url(#podiumGrad_mini)" stroke="#334155" strokeWidth="1" />
      <rect x="12" y="38" width="12" height="3" fill="#3B82F6" />
      <text x="18" y="49" fill="#94A3B8" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">2</text>
      {/* 3rd Place (Right) */}
      <rect x="40" y="42" width="12" height="12" rx="3" fill="url(#podiumGrad_mini)" stroke="#334155" strokeWidth="1" />
      <rect x="40" y="42" width="12" height="3" fill="#64748B" />
      <text x="46" y="51" fill="#94A3B8" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">3</text>
      {/* 1st Place (Center) */}
      <rect x="24" y="30" width="16" height="24" rx="4" fill="url(#podiumGrad_mini)" stroke="#475569" strokeWidth="1.5" />
      <rect x="24" y="30" width="16" height="3" fill="url(#neonCyan_rn_mini)" />
      <text x="32" y="45" fill="#F8FAFC" fontSize="11" fontWeight="extrabold" textAnchor="middle" fontFamily="sans-serif">1</text>
      <g transform="translate(16, 6)">
        <path d="M22 10L25 15L32 8L39 15L42 10L40 20H24L22 10Z" fill="url(#goldTrophy_mini)" stroke="#78350F" strokeWidth="1.2" />
        <rect x="25" y="18" width="14" height="2" fill="#EF4444" rx="0.5" />
        <circle cx="32" cy="8" r="1.5" fill="white" />
        <circle cx="22" cy="10" r="1.2" fill="#22D3EE" />
        <circle cx="42" cy="10" r="1.2" fill="#22D3EE" />
      </g>
    </svg>
  </div>
);

const Icon3DEliteCard = () => (
  <motion.div 
    className="absolute -top-12 left-1/2 -translate-x-1/2 z-10 w-24 h-24 flex items-center justify-center filter drop-shadow-[0_12px_24px_rgba(245,158,11,0.4)]"
    animate={{ y: [0, -6, 0] }}
    transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
  >
    {/* Soft inner radial glow underneath */}
    <div className="absolute inset-4 bg-amber-500/20 rounded-full blur-xl animate-pulse" />
    <svg className="w-20 h-20" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="diamondGrad_ec" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFE082" />
          <stop offset="30%" stopColor="#F59E0B" />
          <stop offset="70%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#78350F" />
        </linearGradient>
        <radialGradient id="glosss_ec" cx="30%" cy="30%" r="40%">
          <stop offset="0%" stopColor="white" stopOpacity="0.5" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Glowing luxury 3D diamond/crown mesh */}
      <path d="M40 10L62 26L52 65L28 65L18 26L40 10Z" fill="url(#diamondGrad_ec)" stroke="#92400E" strokeWidth="2.5" />
      
      {/* Inner facet lines for realistic gem feel */}
      <path d="M40 10L35 34L18 26" stroke="#FEF3C7" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M40 10L45 34L62 26" stroke="#FEF3C7" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M35 34L45 34L40 65L35 34Z" fill="#FBBF24" stroke="#92400E" strokeWidth="1.5" />
      <path d="M18 26L35 34L28 65" stroke="#92400E" strokeWidth="1.5" />
      <path d="M62 26L45 34L52 65" stroke="#92400E" strokeWidth="1.5" />
      
      {/* Golden crown teeth overlay on top of gem */}
      <path d="M30 42L35 48L40 38L45 48L50 42L47 52H33L30 42Z" fill="#511c00" stroke="#FEE2E2" strokeWidth="1" />
      <circle cx="40" cy="38" r="1.5" fill="white" />
      <circle cx="30" cy="42" r="1" fill="#38BDF8" />
      <circle cx="50" cy="42" r="1" fill="#38BDF8" />
      
      {/* Specular gloss highlight */}
      <path d="M40 10L62 26L52 65L28 65L18 26L40 10Z" fill="url(#glosss_ec)" pointerEvents="none" />
    </svg>
  </motion.div>
);

const Icon3DPremiumCard = () => (
  <motion.div 
    className="absolute -top-12 left-1/2 -translate-x-1/2 z-10 w-24 h-24 flex items-center justify-center filter drop-shadow-[0_12px_24px_rgba(168,85,247,0.4)]"
    animate={{ y: [0, -6, 0] }}
    transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut', delay: 0.5 }}
  >
    <div className="absolute inset-4 bg-purple-500/20 rounded-full blur-xl animate-pulse" />
    <svg className="w-20 h-20" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="shieldGrad_pc" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C084FC" />
          <stop offset="50%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#4C1D95" />
        </linearGradient>
        <linearGradient id="goldRim_pc" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
      </defs>
      {/* Beautiful 3D Shield */}
      <path d="M40 12C40 12 58 16 58 32C58 48 40 68 40 68C40 68 22 48 22 32C22 16 40 12 40 12Z" fill="url(#shieldGrad_pc)" stroke="url(#goldRim_pc)" strokeWidth="3" />
      
      {/* Inner glowing core details */}
      <path d="M40 18C40 18 52 21 52 33C52 45 40 59 40 59C40 59 28 45 28 33C28 21 40 18 40 18Z" fill="#120624" opacity="0.4" />
      
      {/* Giant high-gloss letter or medal star in center */}
      <path d="M40 24L43 31L50 32L45 37L46 44L40 40L34 44L35 37L30 32L37 31L40 24Z" fill="url(#goldRim_pc)" stroke="white" strokeWidth="0.5" />
      
      {/* Gloss reflection overlay */}
      <path d="M40 12C40 12 55 15 57 28C40 20 28 36 22 32C22 16 40 12 40 12Z" fill="white" fillOpacity="0.15" />
    </svg>
  </motion.div>
);

const Icon3DRegularCard = () => (
  <motion.div 
    className="absolute -top-12 left-1/2 -translate-x-1/2 z-10 w-24 h-24 flex items-center justify-center filter drop-shadow-[0_12px_24px_rgba(16,185,129,0.4)]"
    animate={{ y: [0, -6, 0] }}
    transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut', delay: 1 }}
  >
    <div className="absolute inset-4 bg-emerald-500/20 rounded-full blur-xl animate-pulse" />
    <svg className="w-20 h-20" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="verifiedGrad_rc" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="50%" stopColor="#059669" />
          <stop offset="100%" stopColor="#064E3B" />
        </linearGradient>
      </defs>
      {/* Futuristic verified user rank badge: 12-point glossy star */}
      <path d="M40 10L48 16L58 14L60 24L69 28L65 38L70 48L60 52L58 62L48 60L40 66L32 60L22 62L20 52L10 48L15 38L11 28L20 24L22 14L32 16L40 10Z" fill="url(#verifiedGrad_rc)" stroke="#047857" strokeWidth="2.5" />
      
      {/* Inner checkmark with glassmorphism glow */}
      <circle cx="40" cy="38" r="18" fill="#022c22" fillOpacity="0.5" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
      <path d="M30 38L37 45L51 29" stroke="#10B981" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M30 38L37 45L51 29" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.6" />
      
      {/* Gloss sheen */}
      <path d="M40 10L48 16L58 14L60 24L40 28L22 14L32 16L40 10Z" stroke="white" strokeWidth="1" strokeOpacity="0.3" fill="none" />
    </svg>
  </motion.div>
);

export default function Rewards() {
  const { user, profile } = useAuth();
  const { config: uiConfig } = useUIConfig();
  const { openTransferModal } = useUI();
  const { isBeta } = useMode();
  const navigate = useNavigate();
  const location = useLocation();

  const [rewardView, setRewardView] = useState<'dashboard' | 'daily' | 'refer' | 'nodes' | 'ranking' | 'conversion' | 'about'>('dashboard');

  // Deep-linking / Hash Routing
  useEffect(() => {
    if (location.hash === '#referral-rewards') {
      setRewardView('refer');
    } else if (location.hash === '#active-node-multipliers') {
      setRewardView('nodes');
    }
  }, [location.hash]);

  // Component States
  const [activeInvestments, setActiveInvestments] = useState<Investment[]>([]);
  const [rewardHistory, setRewardHistory] = useState<any[]>([]);
  const [selectedGuide, setSelectedGuide] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdownStr, setCountdownStr] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  // Referral System States
  const [partners, setPartners] = useState<ReferralPartner[]>([]);
  const [partnersLoading, setPartnersLoading] = useState(true);
  const [referralClaims, setReferralClaims] = useState<any[]>([]);
  const [isClaimingId, setIsClaimingId] = useState<string | null>(null);
  const [pokedUsers, setPokedUsers] = useState<Record<string, boolean>>({});

  // Points Conversion State
  const [pointsInput, setPointsInput] = useState('');

  // Withdrawal States
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [withdrawMethod, setWithdrawMethod] = useState<'crypto' | 'bank'>('crypto');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [cryptoAddress, setCryptoAddress] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccNumber, setBankAccNumber] = useState('');
  const [bankAccName, setBankAccName] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);
  const [showMethodSelector, setShowMethodSelector] = useState(false);
  const [selectedMobileMethod, setSelectedMobileMethod] = useState<'crypto' | 'bank' | null>(null);
  const [showBankSelector, setShowBankSelector] = useState(false);
  const [hasConfirmedTrc20, setHasConfirmedTrc20] = useState(false);

  // Time & streak setup
  const now = new Date();
  const currentMonthNum = now.getMonth();
  const monthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const todayStr = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');

  // Premium Universal Calendar States
  const [calTab, setCalTab] = useState<'daily' | 'monthly' | 'yearly'>('daily');
  const [calYear, setCalYear] = useState<number>(now.getFullYear());
  const [calMonth, setCalMonth] = useState<number>(now.getMonth()); // 0-indexed (0 is Jan)

  const points_balance = profile?.withdraw_methods?.points_balance ?? profile?.points_balance ?? 0;
  const reward_dollar_balance = profile?.withdraw_methods?.reward_dollar_balance ?? profile?.reward_dollar_balance ?? 0;
  const total_claimed_days = profile?.withdraw_methods?.total_claimed_days ?? profile?.total_claimed_days ?? 0;
  const current_streak = profile?.withdraw_methods?.current_streak ?? profile?.current_streak ?? 0;
  const last_check_in = profile?.withdraw_methods?.last_check_in ?? profile?.last_check_in ?? '';
  const claimed_dates = profile?.withdraw_methods?.claimed_dates ?? profile?.claimed_dates ?? [];
  const claimedDatesSet = new Set(claimed_dates);
  const claimed_investment_ids = profile?.withdraw_methods?.claimed_investment_ids || [];
  const claimed_milestones = profile?.withdraw_methods?.claimed_milestones || [];
  const activeRefs = partners.filter(p => p.status === 'active').length;

  // 1. Fetch user's active node investments
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'investments'),
      where('user_id', '==', user.uid),
      where('status', '==', 'active')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Investment));
      setActiveInvestments(list);
    }, (err) => {
      console.error("Failed to load active investments:", err);
    });
    return () => unsubscribe();
  }, [user]);

  // 2. Fetch referral claims
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'referral_claims'),
      where('user_id', '==', user.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const claims: any[] = [];
      snapshot.forEach(docSnap => {
        claims.push({ id: docSnap.id, ...docSnap.data() });
      });
      claims.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      setReferralClaims(claims);
    }, (err) => {
      console.error("Error fetching claims:", err);
    });
    return () => unsubscribe();
  }, [user]);

  // 3. Fetch partners (live referral network list)
  useEffect(() => {
    if (!user || rewardView !== 'refer') return;
    setPartnersLoading(true);
    const q = query(collection(db, 'users'), where('referred_by', '==', user.uid));
    const unsubscribe = onSnapshot(q, async (snap) => {
      const partnerData: ReferralPartner[] = [];
      snap.forEach(docSnap => {
        const u = docSnap.data();
        partnerData.push({
          id: docSnap.id,
          name: u.name || 'Anonymous User',
          username: u.username || 'user',
          email: u.email || '',
          created_at: u.created_at || '',
          country: u.country || 'Global',
          status: 'inactive',
          last_rebook: u.last_rebook || ''
        });
      });

      try {
        const results = await Promise.all(partnerData.map(async (p) => {
          const invQ = query(
            collection(db, 'investments'),
            where('user_id', '==', p.id),
            where('status', '==', 'active')
          );
          const invSnap = await getDocs(invQ);
          const isActive = !invSnap.empty;
          let activeAmt = 0;
          let plans: string[] = [];
          invSnap.forEach(d => {
            const data = d.data();
            activeAmt += data.amount || 0;
            if (data.plan_name && !plans.includes(data.plan_name)) {
              plans.push(data.plan_name);
            }
          });
          return {
            ...p,
            status: isActive ? 'active' : ('inactive' as const),
            active_investment_amount: activeAmt,
            planName: plans.join(', ') || 'No Active Nodes'
          };
        }));
        setPartners(results);
      } catch (err) {
        setPartners(partnerData);
      }
      setPartnersLoading(false);
    }, (err) => {
      console.error("Failed listing partners:", err);
      setPartnersLoading(false);
    });
    return () => unsubscribe();
  }, [user, rewardView]);

  // 4. Fetch reward transaction history
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'transactions'),
      where('user_id', '==', user.uid),
      orderBy('created_at', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allTx = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }) as any);

      const filtered = allTx.filter((tx: any) => {
        const typeLower = (tx.type || '').toLowerCase();
        const descLower = (tx.description || '').toLowerCase();
        
        const isDailyCheckIn = typeLower === 'points_gain';
        const isInvestmentReward = typeLower === 'investment_reward';
        const isRewardsConversion = typeLower === 'rewards_conversion';
        const isRewardWithdrawal = typeLower === 'withdrawal' && (tx.is_reward_withdrawal === true || descLower.includes('reward'));
        
        return isDailyCheckIn || isInvestmentReward || isRewardsConversion || isRewardWithdrawal;
      });

      setRewardHistory(filtered);
    }, (err) => {
      console.error("Failed logging history:", err);
    });
    return () => unsubscribe();
  }, [user]);

  // 5. Daily Countdown
  useEffect(() => {
    const timer = setInterval(() => {
      const nowTime = new Date();
      const nextMidnight = new Date();
      nextMidnight.setHours(24, 0, 0, 0);
      const remains = nextMidnight.getTime() - nowTime.getTime();

      if (remains <= 0) {
        setCountdownStr('');
      } else {
        const hrs = Math.floor(remains / (60 * 60 * 1000));
        const mins = Math.floor((remains % (60 * 60 * 1000)) / (60 * 1000));
        const secs = Math.floor((remains % (60 * 1000)) / 1000);
        setCountdownStr(`${hrs}h ${mins}m ${secs}s`);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Check handles
  const hasClaimedToday = claimedDatesSet.has(todayStr);
  const isDailyClaimable = !hasClaimedToday;

  // Calendar horizontal sliding visible items calculation
  const calendarContainerRef = useRef<HTMLDivElement>(null);
  const daysList = useMemo(() => {
    const list = [];
    const signupDateStr = profile?.created_at || profile?.createdAt;
    let startDate = signupDateStr ? new Date(signupDateStr) : new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
    if (isNaN(startDate.getTime())) {
      startDate = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
    }
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    endDate.setHours(23, 59, 59, 999);

    const currentIter = new Date(startDate);
    while (currentIter <= endDate) {
      const iterStr = currentIter.toISOString().split('T')[0];
      list.push({
        dateStr: iterStr,
        dayNum: currentIter.getDate(),
        dayName: currentIter.toLocaleDateString('en-US', { weekday: 'short' }),
        isToday: iterStr === todayStr,
        isPast: iterStr < todayStr,
        isFuture: iterStr > todayStr,
        isClaimed: claimedDatesSet.has(iterStr),
      });
      currentIter.setDate(currentIter.getDate() + 1);
    }
    return list;
  }, [profile?.created_at, profile?.createdAt, claimed_dates, todayStr]);

  const visibleDays = useMemo(() => {
    const K = window.innerWidth < 1024 ? 3 : 5;
    const firstUnclaimedIdx = daysList.findIndex(d => !d.isClaimed);
    const startIdx = firstUnclaimedIdx === -1 
      ? Math.max(0, daysList.length - K - 1) 
      : (firstUnclaimedIdx >= K ? firstUnclaimedIdx - K : 0);
    return daysList.slice(startIdx, startIdx + K + 1);
  }, [daysList]);

  // Dynamic ranking updates
  const getDynamicUserCount = (baseCount: number, dailyGrowthRate: number) => {
    const baseTime = new Date('2026-05-20T00:00:00Z').getTime();
    const elapsedDays = Math.max(0, (Date.now() - baseTime) / (1000 * 60 * 60 * 24));
    return Math.floor(baseCount * (1 + elapsedDays * dailyGrowthRate));
  };

  const eliteCount = getDynamicUserCount(20803, 0.0000375);
  const premiumCount = getDynamicUserCount(32144, 0.00005);
  const regularCount = getDynamicUserCount(107200, 0.000928);

  // User rank matching
  const userHighestPlan = useMemo(() => {
    if (activeInvestments.length === 0) return null;
    const plans = activeInvestments.map(inv => inv.plan_name?.toLowerCase());
    if (plans.includes('elite')) return 'elite';
    if (plans.includes('premium')) return 'premium';
    if (plans.includes('regular')) return 'regular';
    return null;
  }, [activeInvestments]);

  // DAILY CHECK IN TRIGGER
  const handleDailyCheckIn = async () => {
    const authUser = auth.currentUser;
    if (!authUser || isSubmitting) return;
    if (!isDailyClaimable) {
      toast.error("You are currently on a 24-hour claim cycle lock.");
      return;
    }

    setIsSubmitting(true);
    try {
      const nowIso = new Date().toISOString();
      const userRef = doc(db, 'users', authUser.uid);
      
      await runTransaction(db, async (transaction) => {
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists()) {
          throw new Error("Core profile record does not exist on Capital Growth Alliance protocol.");
        }

        const userData = userSnap.data();
        const existingWithdrawMethods = userData.withdraw_methods || {};
        const currentStreak = existingWithdrawMethods.current_streak || 0;
        const lastCheckIn = existingWithdrawMethods.last_check_in || '';
        const claimedDatesList = existingWithdrawMethods.claimed_dates || [];
        const claimedDatesSet = new Set(claimedDatesList);

        if (claimedDatesSet.has(todayStr)) {
          throw new Error("Safety protocol triggered: Attestation already signed for today.");
        }

        const yesterdayDate = new Date();
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yStr = [yesterdayDate.getFullYear(), String(yesterdayDate.getMonth() + 1).padStart(2, '0'), String(yesterdayDate.getDate()).padStart(2, '0')].join('-');
        const lastCheckInDateOnly = lastCheckIn ? lastCheckIn.split('T')[0] : '';

        let newStreak = 1;
        if (lastCheckIn) {
          if (lastCheckInDateOnly === yStr) {
            newStreak = currentStreak + 1;
          } else if (lastCheckInDateOnly === todayStr) {
            newStreak = currentStreak;
          } else {
            newStreak = 1;
          }
        }

        const newClaimedDates = [...claimedDatesList, todayStr];
        const newPointsBalance = (existingWithdrawMethods.points_balance || 0) + 1;
        const newTotalClaimedDays = (existingWithdrawMethods.total_claimed_days || 0) + 1;

        transaction.update(userRef, {
          withdraw_methods: {
            ...existingWithdrawMethods,
            points_balance: newPointsBalance,
            total_claimed_days: newTotalClaimedDays,
            current_streak: newStreak,
            last_check_in: nowIso,
            claimed_dates: newClaimedDates
          }
        });

        const txRef = doc(collection(db, 'transactions'));
        transaction.set(txRef, {
          user_id: authUser.uid,
          type: 'points_gain',
          amount: 1,
          status: 'approved',
          created_at: nowIso,
          description: 'Daily Check-In Incentive'
        });

        const notifRef = doc(collection(db, 'notifications'));
        transaction.set(notifRef, {
          user_id: authUser.uid,
          type: 'success',
          title: 'Daily Check-In Successful',
          message: 'Successfully checked in! +1 Point (PTS) has been credited.',
          read: false,
          created_at: nowIso
        });
      });

      toast.success("Successfully checked-in today! +1 Point credited.");
      
      broadcastActivity(
        profile?.name || "Client",
        "Checked In",
        "+1 Point",
        true,
        "✔️"
      );
    } catch (err: any) {
      toast.error(err.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // POINTS CONVERSION TRIGGER
  const handlePointsConversion = async () => {
    const authUser = auth.currentUser;
    if (!authUser || isSubmitting) return;
    const ptsToConvert = Math.floor(parseFormattedNumber(pointsInput));

    if (!pointsInput || isNaN(ptsToConvert) || ptsToConvert <= 0) {
      toast.error("Please enter a valid amount of points to convert.");
      return;
    }

    if (ptsToConvert > points_balance) {
      toast.error("Your balance contains insufficient points.");
      return;
    }

    setIsSubmitting(true);
    try {
      const nowIso = new Date().toISOString();
      const dollarReward = ptsToConvert * 0.10; // 1 point = $0.10
      const userRef = doc(db, 'users', authUser.uid);

      await runTransaction(db, async (transaction) => {
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists()) {
          throw new Error("User record not found.");
        }

        const userData = userSnap.data();
        const existingWithdrawMethods = userData.withdraw_methods || {};
        const newPointsBalance = (existingWithdrawMethods.points_balance || 0) - ptsToConvert;
        const newRewardDollarBalance = (existingWithdrawMethods.reward_dollar_balance || 0) + dollarReward;

        transaction.update(userRef, {
          withdraw_methods: {
            ...existingWithdrawMethods,
            points_balance: newPointsBalance,
            reward_dollar_balance: newRewardDollarBalance
          }
        });

        const txRef = doc(collection(db, 'transactions'));
        transaction.set(txRef, {
          user_id: authUser.uid,
          type: 'rewards_conversion',
          amount: dollarReward,
          status: 'approved',
          created_at: nowIso,
          description: `Exchanged ${ptsToConvert} Points for Reward Dollars`
        });

        const notifRef = doc(collection(db, 'notifications'));
        transaction.set(notifRef, {
          user_id: authUser.uid,
          type: 'success',
          title: 'Points Swapped',
          message: `Exchanged ${ptsToConvert} PTS into $${dollarReward.toFixed(2)} USD.`,
          read: false,
          created_at: nowIso
        });
      });

      toast.success(`Exchanged ${ptsToConvert} PTS into $${dollarReward.toFixed(2)} reward balance!`);
      setPointsInput('');
      setRewardView('dashboard');
    } catch (err: any) {
      toast.error(err.message || "Failed to convert points.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // POKE USER FOR INACTIVE REFERRALS
  const handlePokeUser = async (partner: ReferralPartner) => {
    if (!user || !profile) return;
    try {
      const nowIso = new Date().toISOString();
      await updateDoc(doc(db, 'users', partner.id), {
        last_rebook: nowIso
      });

      await addDoc(collection(db, 'notifications'), {
        user_id: partner.id,
        title: 'Partner Incentive Poke',
        message: `Your partner ${profile.username || 'Capital Growth Alliance member'} poked you! Activate a validator node to unlock rewards and start earning.`,
        type: 'info',
        read: false,
        created_at: nowIso
      });

      setPokedUsers(prev => ({ ...prev, [partner.id]: true }));
      toast.success(`System notification poke sent to ${partner.username}`);
    } catch (err) {
      toast.error("Failed to transmit poke action.");
    }
  };

  // REFERRAL BONUS CLAIM
  const handleClaimReferralReward = async (claim: any) => {
    if (!user || !profile) return;
    if (profile.suspended || profile.banned) {
      toast.error("Access restricted by System Protocol.");
      return;
    }

    setIsClaimingId(claim.id);
    try {
      await runTransaction(db, async (transaction) => {
        const claimRef = doc(db, 'referral_claims', claim.id);
        const claimSnap = await transaction.get(claimRef);
        if (!claimSnap.exists()) throw new Error("Reward verification error.");

        const claimData = claimSnap.data();
        if (claimData.status !== 'pending') throw new Error("Already claimed.");

        const userRef = doc(db, 'users', user.uid);
        const userSnap = await transaction.get(userRef);
        const existingWithdrawMethods = userSnap.data()?.withdraw_methods || {};
        const oldRewardDollar = existingWithdrawMethods.reward_dollar_balance || 0;

        transaction.update(userRef, {
          referral_earnings: increment(claim.amount),
          withdraw_methods: {
            ...existingWithdrawMethods,
            reward_dollar_balance: oldRewardDollar + claim.amount
          }
        });

        transaction.update(claimRef, {
          status: 'claimed',
          claimed_at: new Date().toISOString()
        });

        const txRef = doc(collection(db, 'transactions'));
        transaction.set(txRef, {
          user_id: user.uid,
          type: 'referral_reward',
          amount: claim.amount,
          status: 'approved',
          created_at: new Date().toISOString(),
          description: claim.type === 'referrer'
            ? `Referral commission - partner ${claim.partner_name}`
            : `Welcome referral bonus unlocked`
        });
      });

      toast.success("Bonus successfully claimed to your balance!");
      
      broadcastActivity(
        profile?.name || "Client",
        "Claimed Referral Reward",
        `$${claim.amount.toFixed(2)}`,
        true,
        "🎁"
      );
    } catch (err: any) {
      toast.error(err.message || "Claim failed.");
    } finally {
      setIsClaimingId(null);
    }
  };

  // CLAIM 2% NODE REWARD
  const handleClaimInvestmentReward = async (inv: Investment) => {
    const authUser = auth.currentUser;
    if (!authUser || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const rewardAmt = inv.amount * 0.02;
      const nowIso = new Date().toISOString();
      const userRef = doc(db, 'users', authUser.uid);

      await runTransaction(db, async (transaction) => {
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists()) throw new Error("Core profile record does not exist.");

        const userData = userSnap.data();
        const existingWithdrawMethods = userData.withdraw_methods || {};
        const claimedInvestmentIds = existingWithdrawMethods.claimed_investment_ids || [];

        if (claimedInvestmentIds.includes(inv.id)) {
          throw new Error("Reward already claimed for this active node.");
        }

        const newRewardDollarBalance = (existingWithdrawMethods.reward_dollar_balance || 0) + rewardAmt;
        const newClaimedInvestmentIds = [...claimedInvestmentIds, inv.id];

        transaction.update(userRef, {
          withdraw_methods: {
            ...existingWithdrawMethods,
            reward_dollar_balance: newRewardDollarBalance,
            claimed_investment_ids: newClaimedInvestmentIds
          }
        });

        const txRef = doc(collection(db, 'transactions'));
        transaction.set(txRef, {
          user_id: authUser.uid,
          type: 'investment_reward',
          amount: rewardAmt,
          status: 'approved',
          created_at: nowIso,
          description: `2% Cashback reward on active ${inv.plan_name} node`
        });
      });

      toast.success(`Claimed $${rewardAmt.toFixed(2)} Cashback Reward successfully!`);
      
      broadcastActivity(
        profile?.name || "Client",
        "Claimed Cash Reward",
        `$${rewardAmt.toFixed(2)}`,
        true,
        "💎"
      );
    } catch (err: any) {
      toast.error(err.message || "Claim failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // REFERRAL MILESTONES REAL INTEGRATION
  const handleClaimMilestone = async (milestoneId: string, amount: number, requiredRefs: number) => {
    const authUser = auth.currentUser;
    if (!authUser || isSubmitting) return;

    if (activeRefs < requiredRefs) {
      toast.error(`You need at least ${requiredRefs} active referrals to claim this milestone.`);
      return;
    }

    if (claimed_milestones.includes(milestoneId)) {
      toast.error("This milestone reward has already been claimed.");
      return;
    }

    setIsSubmitting(true);
    try {
      const nowIso = new Date().toISOString();
      const userRef = doc(db, 'users', authUser.uid);

      await runTransaction(db, async (transaction) => {
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists()) {
          throw new Error("Core profile record does not exist on Capital Growth Alliance protocol.");
        }

        const userData = userSnap.data();
        const existingWithdrawMethods = userData.withdraw_methods || {};
        const oldRewardDollarBalance = existingWithdrawMethods.reward_dollar_balance || 0;
        const currentClaimed = existingWithdrawMethods.claimed_milestones || [];

        if (currentClaimed.includes(milestoneId)) {
          throw new Error("Security check fail: Milestone already claimed.");
        }

        // Update user state
        transaction.update(userRef, {
          withdraw_methods: {
            ...existingWithdrawMethods,
            reward_dollar_balance: oldRewardDollarBalance + amount,
            claimed_milestones: [...currentClaimed, milestoneId]
          }
        });

        // Add transaction ledger entry
        const txRef = doc(collection(db, 'transactions'));
        transaction.set(txRef, {
          user_id: authUser.uid,
          type: 'milestone_reward',
          amount: amount,
          status: 'approved',
          created_at: nowIso,
          description: `Referral Milestone reward claimed - ${requiredRefs} active users`
        });

        // Add notify alert
        const notifRef = doc(collection(db, 'notifications'));
        transaction.set(notifRef, {
          user_id: authUser.uid,
          type: 'success',
          title: 'Milestone Reward Claimed',
          message: `Successfully claimed $${amount.toFixed(2)} USD for reaching ${requiredRefs} active referrals!`,
          read: false,
          created_at: nowIso
        });
      });

      toast.success(`Successfully claimed $${amount.toFixed(2)} USD milestone reward!`);
      
      broadcastActivity(
        profile?.name || "Client",
        "Claimed Milestone Reward",
        `$${amount.toFixed(2)}`,
        true,
        "🎖️"
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to claim milestone.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // SUBMIT WITHDRAW REQUEST
  const handleWithdrawalRequest = () => {
    if (profile?.withdrawals_frozen) {
      toast.error("Withdrawal services are currently restricted.");
      return;
    }

    const amt = parseFormattedNumber(withdrawAmount);
    if (!withdrawAmount || isNaN(amt) || amt < 10) {
      toast.error("Minimum reward withdrawal threshold is $10.00.");
      return;
    }

    if (amt > reward_dollar_balance) {
      toast.error("Insufficient Reward Dollar Balance.");
      return;
    }

    if (withdrawMethod === 'bank') {
      if (!bankName.trim() || !bankAccNumber.trim() || !bankAccName.trim()) {
        toast.error("Please fill in all banking account details.");
        return;
      }
      const profileName = profile?.name || '';
      if (bankAccName.trim().toLowerCase() !== profileName.toLowerCase()) {
        toast.error(`Registered account name must match Profile Holder: ${profileName}`);
        return;
      }
    } else {
      if (!cryptoAddress.trim()) {
        toast.error("Please provide a valid wallet address.");
        return;
      }
    }

    setShowPinModal(true);
  };

  const handleWithdrawSubmit = async (pin: string) => {
    const authUser = auth.currentUser;
    if (!authUser || !profile) return;

    if (pin !== profile.transfer_pin) {
      toast.error("Invalid Security Transfer PIN.");
      return;
    }

    setShowPinModal(false);
    setIsSubmitting(true);
    
    try {
      const amount = parseFormattedNumber(withdrawAmount);
      const fee = Math.floor((amount * 0.20) * 100) / 100;
      const finalAmount = amount - fee;
      const nowIso = new Date().toISOString();
      const userRef = doc(db, 'users', authUser.uid);

      await runTransaction(db, async (transaction) => {
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists()) throw new Error("User record not found.");

        const existingWithdrawMethods = userSnap.data()?.withdraw_methods || {};
        const oldRewardDollarBalance = existingWithdrawMethods.reward_dollar_balance || 0;

        if (amount > oldRewardDollarBalance) {
          throw new Error("Insufficient rewards balance.");
        }

        transaction.update(userRef, {
          withdraw_methods: {
            ...existingWithdrawMethods,
            reward_dollar_balance: oldRewardDollarBalance - amount
          }
        });

        const witRef = doc(collection(db, 'withdrawals'));
        transaction.set(witRef, {
          user_id: authUser.uid,
          user_name: profile.name,
          amount: amount,
          fee: fee,
          final_amount: finalAmount,
          method: withdrawMethod,
          details: withdrawMethod === 'bank' ? {
            bank_name: bankName,
            account_number: bankAccNumber,
            account_name: bankAccName
          } : {
            address: cryptoAddress
          },
          status: 'pending',
          is_reward_withdrawal: true,
          created_at: nowIso
        });

        const txRef = doc(collection(db, 'transactions'));
        transaction.set(txRef, {
          user_id: authUser.uid,
          type: 'withdrawal',
          amount: amount,
          fee: fee,
          final_amount: finalAmount,
          status: 'pending',
          is_reward_withdrawal: true,
          created_at: nowIso,
          description: `Reward balance settlement request (${withdrawMethod.toUpperCase()})`
        });
      });

      toast.success(`Success! Withdrawal request of $${amount.toFixed(2)} logged for review.`);
      setWithdrawAmount('');
      setCryptoAddress('');
      setBankName('');
      setBankAccNumber('');
      setBankAccName('');
      setShowWithdrawForm(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to process withdrawal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const unclaimedInvestmentRewards = activeInvestments.filter(inv => !inv.reward_claimed && !claimed_investment_ids.includes(inv.id));
  const regularUnclaimed = unclaimedInvestmentRewards.find(inv => inv.plan_name?.toLowerCase() === 'regular');
  const premiumUnclaimed = unclaimedInvestmentRewards.find(inv => inv.plan_name?.toLowerCase() === 'premium');
  const eliteUnclaimed = unclaimedInvestmentRewards.find(inv => inv.plan_name?.toLowerCase() === 'elite');

  return (
    <div className="w-full text-[#9CA3AF] relative font-sans p-4">
      {/* Edge-to-Edge Premium Header Banner with CSS/SVG Background (No external image) */}
      <div className="w-full mb-4 sm:mb-6 relative overflow-hidden bg-gradient-to-br from-[#0a0f18] via-[#050608] to-[#121926] rounded-2xl sm:rounded-[2rem] border border-white/5 py-4 sm:py-10 md:py-14 px-4 sm:px-10">
        {/* Soft grid lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        
        {/* Neon glowing halos */}
        <div className="absolute -top-12 -left-12 w-64 h-64 bg-[#009e42]/10 rounded-full blur-[80px]" />
        <div className="absolute -bottom-12 -right-12 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px]" />

        <div className="relative z-10 flex flex-row items-center justify-between gap-4 max-w-5xl mx-auto w-full">
          <div className="text-left space-y-1 sm:space-y-3 flex-1 min-w-0">
            <h1 className="text-sm sm:text-2xl md:text-4xl font-extrabold text-white tracking-tight uppercase italic font-serif">
              Ecosystem Rewards
            </h1>
          </div>

          {/* Stylized Trophy / Gift Representation SVG */}
          <div className="relative w-16 h-16 sm:w-36 sm:h-36 flex items-center justify-center shrink-0 pointer-events-none">
            {/* Rotating backing ray */}
            <div className="absolute inset-1 sm:inset-2 border border-dashed border-[#009e42]/30 rounded-full animate-[spin_30s_linear_infinite]" />
            
            {/* Glowing orb */}
            <div className="absolute w-10 h-10 sm:w-20 sm:h-20 rounded-full bg-[#009e42]/5 blur-md" />
            
            {/* Custom Trophy SVG */}
            <svg viewBox="0 0 24 24" fill="none" stroke="#009e42" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 sm:w-16 sm:h-16 drop-shadow-[0_0_15px_rgba(0,158,66,0.5)]">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
              <path d="M4 22h16" />
              <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34" />
              <path d="M12 2a4 4 0 0 0-4 4v5a4 4 0 0 0 8 0V6a4 4 0 0 0-4-4Z" />
            </svg>

            {/* Mini floaters */}
            <div className="absolute -top-1 sm:top-4 -right-1 sm:right-4 text-amber-400 font-bold text-[7px] sm:text-xs animate-bounce">+🎁</div>
            <div className="absolute -bottom-1 sm:bottom-4 -left-1 sm:left-4 text-[#009e42] font-mono text-[6px] sm:text-[9px] font-bold animate-pulse">$CGA</div>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {rewardView === 'dashboard' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="max-w-5xl mx-auto space-y-6"
          >
            {/* Premium Dual Balance & Points Section */}
            <div className="p-4 sm:p-6 rounded-[24px] sm:rounded-[32px] bg-gradient-to-br from-[#121c22]/90 to-[#070a0e]/95 border border-white/5 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-[120px] rounded-full" />
              <div className="grid grid-cols-2 gap-4 md:gap-8 divide-x divide-white/10">
                {/* Balance Area (Left) */}
                <div className="space-y-2.5 sm:space-y-3 pr-2 sm:pr-4 flex flex-col justify-between">
                  <div 
                    onClick={() => {
                      setShowMethodSelector(true);
                      setSelectedMobileMethod('crypto');
                      setWithdrawMethod('crypto');
                    }}
                    className="space-y-2 cursor-pointer select-none group"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-gray-400">Balance</span>
                      <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-white/5 flex items-center justify-center text-[8px] sm:text-[10px] text-gray-500 hover:text-white transition-colors">?</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-lg xs:text-xl sm:text-3xl md:text-4xl font-black text-white italic leading-none tracking-tight">
                        ${reward_dollar_balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <ChevronRight size={16} className="text-gray-500 group-hover:text-white transition-colors group-hover:translate-x-1 sm:hidden md:block" />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <button
                      onClick={() => {
                        setShowMethodSelector(true);
                        setSelectedMobileMethod('crypto');
                        setWithdrawMethod('crypto');
                      }}
                      className="px-2 py-1 sm:px-3.5 sm:py-2 rounded-lg sm:rounded-xl bg-[#00E5FF]/10 hover:bg-[#00E5FF]/20 border border-[#00E5FF]/20 text-[#00E5FF] text-[8px] xs:text-[99px] sm:text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer"
                    >
                      Withdraw
                    </button>
                    {isBeta && (
                      <button
                        onClick={openTransferModal}
                        className="px-2 py-1 sm:px-3.5 sm:py-2 rounded-lg sm:rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-400 text-[8px] xs:text-[99px] sm:text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer"
                      >
                        Transfer
                      </button>
                    )}
                  </div>
                  <p className="text-[8px] sm:text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1 sm:mt-2">Supported Instantly</p>
                </div>

                {/* Points Area (Right) */}
                <div className="space-y-2.5 sm:space-y-3 pl-2 sm:pl-8 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-gray-400">Points</span>
                    <div className="px-1.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[8px] sm:text-[10px] font-black tracking-widest animate-none">
                      {(points_balance * 10).toLocaleString()} TWN
                    </div>
                  </div>
                  <div 
                    onClick={() => navigate('/daily-points')}
                    className="flex items-center gap-1.5 sm:gap-3 cursor-pointer group select-none self-start"
                  >
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
                      <span className="text-black text-xs sm:text-base font-bold">★</span>
                    </div>
                    <span className="text-lg xs:text-xl sm:text-3xl md:text-4xl font-black text-white italic leading-none tracking-tight">
                      {points_balance.toLocaleString()}
                    </span>
                    <ChevronRight size={16} className="text-gray-500 group-hover:text-white transition-colors group-hover:translate-x-1 sm:hidden md:block" />
                  </div>
                  <p className="text-[8px] sm:text-[10px] text-gray-500 font-bold uppercase tracking-wider">Tap to convert</p>
                </div>
              </div>
            </div>

            {/* Grid of 4 Premium Navigation Cards */}
            <div className="hidden lg:grid grid-cols-4 gap-1.5 xs:gap-2 sm:gap-4 md:gap-6">
              {/* Card 1: Daily Point */}
              <div 
                onClick={() => navigate('/daily-points')}
                className="relative p-2.5 xs:p-4 sm:p-6 rounded-[16px] xs:rounded-[20px] sm:rounded-[28px] bg-gradient-to-b from-[#16222a]/80 to-[#0c1217]/90 hover:from-[#1d2d37]/90 hover:to-[#111920] border border-white/10 hover:border-emerald-500/40 hover:-translate-y-1.5 hover:scale-[1.03] active:scale-[0.96] transition-all duration-300 flex flex-col items-center justify-center gap-1 sm:gap-2 cursor-pointer text-center group shadow-xl hover:shadow-[0_12px_24px_rgba(16,185,129,0.15),_inset_0_1px_0_rgba(255,255,255,0.05)] active:duration-75 select-none overflow-hidden"
              >
                <div className="absolute top-2 right-2 sm:top-3.5 sm:right-3.5 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center opacity-40 group-hover:opacity-100 group-hover:bg-emerald-500/20 group-hover:border-emerald-500/30 group-hover:scale-110 group-hover:translate-x-0.5 transition-all duration-300 text-gray-400 group-hover:text-emerald-400 shadow-sm">
                  <ChevronRight size={10} className="sm:size-12" />
                </div>
                <div className="scale-75 sm:scale-100 flex items-center justify-center h-14 sm:h-20 w-14 sm:w-20 shrink-0 group-hover:scale-110 group-hover:rotate-1 transition-all duration-300">
                  <Icon3DDailyPoints />
                </div>
                <span className="text-[8px] xs:text-[9px] sm:text-xs font-black text-white uppercase tracking-wider group-hover:text-emerald-400 transition-colors mt-1 sm:mt-2 block truncate w-full">Daily Point</span>
              </div>

              {/* Card 2: Refer Friends */}
              <div 
                onClick={() => setRewardView('refer')}
                className="relative p-2.5 xs:p-4 sm:p-6 rounded-[16px] xs:rounded-[20px] sm:rounded-[28px] bg-gradient-to-b from-[#16222a]/80 to-[#0c1217]/90 hover:from-[#1d2d37]/90 hover:to-[#111920] border border-white/10 hover:border-purple-500/40 hover:-translate-y-1.5 hover:scale-[1.03] active:scale-[0.96] transition-all duration-300 flex flex-col items-center justify-center gap-1 sm:gap-2 cursor-pointer text-center group shadow-xl hover:shadow-[0_12px_24px_rgba(168,85,247,0.15),_inset_0_1px_0_rgba(255,255,255,0.05)] active:duration-75 select-none overflow-hidden"
              >
                <div className="absolute top-2 right-2 sm:top-3.5 sm:right-3.5 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center opacity-40 group-hover:opacity-100 group-hover:bg-purple-500/20 group-hover:border-purple-500/30 group-hover:scale-110 group-hover:translate-x-0.5 transition-all duration-300 text-gray-400 group-hover:text-purple-400 shadow-sm">
                  <ChevronRight size={10} className="sm:size-12" />
                </div>
                <div className="scale-75 sm:scale-100 flex items-center justify-center h-14 sm:h-20 w-14 sm:w-20 shrink-0 group-hover:scale-110 group-hover:rotate-1 transition-all duration-300">
                  <Icon3DReferFriends />
                </div>
                <span className="text-[8px] xs:text-[9px] sm:text-xs font-black text-white uppercase tracking-wider group-hover:text-purple-400 transition-colors mt-1 sm:mt-2 block truncate w-full">Refer Friends</span>
              </div>

              {/* Card 3: Node Rewards */}
              <div 
                onClick={() => setRewardView('nodes')}
                className="relative p-2.5 xs:p-4 sm:p-6 rounded-[16px] xs:rounded-[20px] sm:rounded-[28px] bg-gradient-to-b from-[#16222a]/80 to-[#0c1217]/90 hover:from-[#1d2d37]/90 hover:to-[#111920] border border-white/10 hover:border-yellow-500/40 hover:-translate-y-1.5 hover:scale-[1.03] active:scale-[0.96] transition-all duration-300 flex flex-col items-center justify-center gap-1 sm:gap-2 cursor-pointer text-center group shadow-xl hover:shadow-[0_12px_24px_rgba(234,179,8,0.15),_inset_0_1px_0_rgba(255,255,255,0.05)] active:duration-75 select-none overflow-hidden"
              >
                <div className="absolute top-2 right-2 sm:top-3.5 sm:right-3.5 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center opacity-40 group-hover:opacity-100 group-hover:bg-yellow-500/20 group-hover:border-yellow-500/30 group-hover:scale-110 group-hover:translate-x-0.5 transition-all duration-300 text-gray-400 group-hover:text-yellow-400 shadow-sm">
                  <ChevronRight size={10} className="sm:size-12" />
                </div>
                <div className="scale-75 sm:scale-100 flex items-center justify-center h-14 sm:h-20 w-14 sm:w-20 shrink-0 group-hover:scale-110 group-hover:rotate-1 transition-all duration-300">
                  <Icon3DNodeRewards />
                </div>
                <span className="text-[8px] xs:text-[9px] sm:text-xs font-black text-white uppercase tracking-wider group-hover:text-yellow-400 transition-colors mt-1 sm:mt-2 block truncate w-full">Node Rewards</span>
              </div>

              {/* Card 4: Ranking */}
              <div 
                onClick={() => setRewardView('ranking')}
                className="relative p-2.5 xs:p-4 sm:p-6 rounded-[16px] xs:rounded-[20px] sm:rounded-[28px] bg-gradient-to-b from-[#16222a]/80 to-[#0c1217]/90 hover:from-[#1d2d37]/90 hover:to-[#111920] border border-white/10 hover:border-cyan-500/40 hover:-translate-y-1.5 hover:scale-[1.03] active:scale-[0.96] transition-all duration-300 flex flex-col items-center justify-center gap-1 sm:gap-2 cursor-pointer text-center group shadow-xl hover:shadow-[0_12px_24px_rgba(6,182,212,0.15),_inset_0_1px_0_rgba(255,255,255,0.05)] active:duration-75 select-none overflow-hidden"
              >
                <div className="absolute top-2 right-2 sm:top-3.5 sm:right-3.5 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center opacity-40 group-hover:opacity-100 group-hover:bg-cyan-500/20 group-hover:border-cyan-500/30 group-hover:scale-110 group-hover:translate-x-0.5 transition-all duration-300 text-gray-400 group-hover:text-cyan-400 shadow-sm">
                  <ChevronRight size={10} className="sm:size-12" />
                </div>
                <div className="scale-75 sm:scale-100 flex items-center justify-center h-14 sm:h-20 w-14 sm:w-20 shrink-0 group-hover:scale-110 group-hover:rotate-1 transition-all duration-300">
                  <Icon3DRanking />
                </div>
                <span className="text-[8px] xs:text-[9px] sm:text-xs font-black text-white uppercase tracking-wider group-hover:text-cyan-400 transition-colors mt-1 sm:mt-2 block truncate w-full">Ranking</span>
              </div>
            </div>

            {/* Core Ledger Logs Section */}
            <div className="p-6 md:p-8 bg-[#11131f] border border-white/5 rounded-[32px] relative overflow-hidden">
              <div className="flex items-center justify-between items-start mb-6 gap-4">
                <div className="flex items-center gap-2.5">
                  <History className="text-purple-400" size={18} />
                  <div>
                    <h3 className="text-base font-black italic text-white uppercase">Reward Activity Ledger</h3>
                    <p className="text-[10px] text-gray-500 uppercase font-black">Timestamped ledger of claim audits</p>
                  </div>
                </div>
              </div>
              {rewardHistory.length === 0 ? (
                <div className="bg-black/20 border border-white/5 rounded-2xl p-8 text-center text-xs text-gray-500 font-bold uppercase tracking-widest">
                  No payout entries detected.
                </div>
              ) : (
                <div className="grid gap-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
                  {rewardHistory.map((tx, idx) => (
                    <TransactionTicket 
                      key={`${tx.id}-${idx}`}
                      tx={tx}
                      currentUserId={user?.uid ?? undefined}
                      variant="fund"
                    />
                  ))}
                </div>
              )}
              <div className="mt-6 pt-6 border-t border-white/5 flex justify-center">
                <button
                  onClick={() => setRewardView('about')}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black uppercase tracking-wider transition-all duration-300 shadow-lg shadow-purple-500/10 cursor-pointer hover:brightness-110 active:scale-95 border border-purple-500/20"
                >
                  <Info size={14} className="animate-pulse" />
                  About Rewards
                </button>
              </div>
            </div>

            {/* Bottom guide cards explanation */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
              {GUIDE_CARDS.map(card => (
                <div 
                  key={card.id}
                  onClick={() => setSelectedGuide(card)}
                  className="p-5 bg-[#0a0c10] border border-white/5 rounded-2xl cursor-pointer hover:border-[#00E5FF]/30 transition-all select-none group"
                >
                  <h4 className="text-xs font-black text-white group-hover:text-[#00E5FF] transition-colors uppercase tracking-wider mb-2">{card.title}</h4>
                  <p className="text-[11px] text-gray-500 leading-relaxed">{card.shortDesc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* --- DEDICATED PAGE: DAILY POINT --- */}
        {rewardView === 'daily' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.99 }}
            className="max-w-xl mx-auto space-y-5"
          >
            {/* Header bar designed to match reference image header */}
            <div className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-[24px] px-4 py-5 flex items-center relative shadow-sm">
              <button 
                onClick={() => setRewardView('dashboard')}
                className="absolute left-4 p-1 rounded-full hover:bg-white/10 text-white transition-all cursor-pointer flex items-center justify-center animate-none"
                id="back_to_rewards_db_details"
              >
                <ChevronLeft size={24} strokeWidth={2.5} />
              </button>
              <h1 className="w-full text-center text-sm sm:text-base font-bold tracking-tight uppercase">
                Daily Check-In Details
              </h1>
            </div>

            {/* OVERVIEW CARD SECTION */}
            <div className="bg-[#11131f] border border-white/5 rounded-[24px] p-5 shadow-2xl space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider">Points Overview</h3>
              </div>
              <div className="grid grid-cols-3 gap-1 xs:gap-2 sm:gap-4 items-center">
                <div className="text-left">
                  <span className="text-[8px] xs:text-[9px] sm:text-[10px] font-black text-gray-500 block uppercase mb-1 leading-tight truncate">Points Credited Today</span>
                  <span className="text-emerald-400 text-xs xs:text-sm sm:text-2xl font-black tracking-tight block font-mono">
                    +{hasClaimedToday ? 1 : 0} Point{hasClaimedToday ? '' : 's'}
                  </span>
                </div>
                <div className="text-center border-x border-white/5 px-1 sm:px-2">
                  <span className="text-[8px] xs:text-[9px] sm:text-[10px] font-black text-gray-500 block uppercase mb-1 leading-tight truncate">Total Points</span>
                  <span className="text-white text-xs xs:text-sm sm:text-2xl font-black tracking-tight block font-mono truncate">
                    {points_balance.toLocaleString()} PTS
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[8px] xs:text-[9px] sm:text-[10px] font-black text-gray-500 block uppercase mb-1 leading-tight truncate">Total Balance</span>
                  <span className="text-white text-xs xs:text-sm sm:text-2xl font-black tracking-tight block font-mono truncate">
                    ${(points_balance * 0.10).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* DAILY CHECK-IN CALENDAR SECTION */}
            <div className="bg-[#11131f] border border-white/5 rounded-[28px] p-6 shadow-2xl space-y-6">
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <h3 className="text-xs font-black text-white uppercase tracking-wider">Daily Check-In Calendar</h3>
                <div className="flex gap-1.5 bg-emerald-500/10 border border-emerald-500/20 p-1.5 rounded-full text-center">
                  <span className="text-[9px] uppercase font-black text-emerald-400 px-2.5 py-0.5 rounded-md">Streak: {current_streak} days</span>
                </div>
              </div>

              {/* Day, Month, Year Tabs selector */}
              <div className="bg-black/40 border border-white/5 p-1 rounded-full flex gap-1 w-full max-w-[280px] mx-auto shadow-inner">
                <button
                  onClick={() => setCalTab('daily')}
                  className={cn(
                    "flex-1 text-[11px] font-black py-1.5 rounded-full transition-all cursor-pointer",
                    calTab === 'daily' 
                      ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-sm" 
                      : "text-gray-400 hover:text-white bg-transparent"
                  )}
                >
                  Daily
                </button>
                <button
                  onClick={() => setCalTab('monthly')}
                  className={cn(
                    "flex-1 text-[11px] font-black py-1.5 rounded-full transition-all cursor-pointer",
                    calTab === 'monthly' 
                      ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-sm" 
                      : "text-gray-400 hover:text-white bg-transparent"
                  )}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setCalTab('yearly')}
                  className={cn(
                    "flex-1 text-[11px] font-black py-1.5 rounded-full transition-all cursor-pointer",
                    calTab === 'yearly' 
                      ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-sm" 
                      : "text-gray-400 hover:text-white bg-transparent"
                  )}
                >
                  Yearly
                </button>
              </div>

              {/* Sub-Header: Year selector & Sum Points */}
              <div className="flex items-center justify-between text-xs px-1">
                {/* Left side: Points sum */}
                <div>
                  {calTab === 'daily' && (
                    <span className="text-emerald-400 font-bold block text-sm">
                      Sum +{(() => {
                        const monthPrefix = `${calYear}-${String(calMonth + 1).padStart(2, '0')}`;
                        return claimed_dates.filter((dStr: string) => dStr.startsWith(monthPrefix)).length;
                      })()} Points
                    </span>
                  )}
                  {calTab === 'monthly' && (
                    <span className="text-emerald-400 font-bold block text-sm">
                      Sum +{(() => {
                        const yearPrefix = `${calYear}-`;
                        return claimed_dates.filter((dStr: string) => dStr.startsWith(yearPrefix)).length;
                      })()} Points
                    </span>
                  )}
                  {calTab === 'yearly' && (
                    <span className="text-emerald-400 font-bold block text-sm">
                      Sum +{claimed_dates.length} Points
                    </span>
                  )}
                </div>

                {/* Right side: Navigating chevrons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (calTab === 'daily') {
                        if (calMonth === 0) {
                          if (calYear > 1980) {
                            setCalYear(prev => prev - 1);
                            setCalMonth(11);
                          }
                        } else {
                          setCalMonth(prev => prev - 1);
                        }
                      } else {
                        if (calYear > 1980) {
                          setCalYear(prev => prev - 1);
                        }
                      }
                    }}
                    disabled={calYear <= 1980}
                    className="p-1 rounded-full hover:bg-white/5 text-gray-400 hover:text-white active:scale-90 transition-all cursor-pointer disabled:opacity-20"
                  >
                    <ChevronLeft size={16} strokeWidth={2.5} />
                  </button>

                  <span className="font-bold text-white tracking-wide font-mono text-xs sm:text-sm">
                    {calTab === 'daily' 
                      ? `${calYear}.${String(calMonth + 1).padStart(2, '0')}`
                      : `${calYear}`
                    }
                  </span>

                  <button
                    onClick={() => {
                      if (calTab === 'daily') {
                        if (calMonth === 11) {
                          if (calYear < 2099) {
                            setCalYear(prev => prev + 1);
                            setCalMonth(0);
                          }
                        } else {
                          setCalMonth(prev => prev + 1);
                        }
                      } else {
                        if (calYear < 2099) {
                          setCalYear(prev => prev + 1);
                        }
                      }
                    }}
                    disabled={calYear >= 2099}
                    className="p-1 rounded-full hover:bg-white/5 text-gray-400 hover:text-white active:scale-90 transition-all cursor-pointer disabled:opacity-20"
                  >
                    <ChevronRight size={16} strokeWidth={2.5} />
                  </button>
                </div>
              </div>

              {/* Calendar Days / Months / Years Grid Content */}
              <AnimatePresence mode="wait">
                {calTab === 'daily' && (
                  <motion.div
                    key="daily-calendar"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-4"
                  >
                    {/* Weekday headers list */}
                    <div className="grid grid-cols-7 gap-1 text-center font-bold text-[10px] text-gray-500 tracking-wider">
                      {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(lbl => (
                        <div key={lbl} className="py-1">{lbl}</div>
                      ))}
                    </div>

                    {/* Numeric Days grid */}
                    <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                      {(() => {
                        const list = [];
                        const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
                        let firstDayIdx = new Date(calYear, calMonth, 1).getDay();
                        // Adjust default Sun=0 to Mon-start Mon=0, Sun=6
                        firstDayIdx = (firstDayIdx + 6) % 7;

                        // Blank items at month prefix
                        for (let k = 0; k < firstDayIdx; k++) {
                          list.push(
                            <div key={`blank-${k}`} className="w-full aspect-square bg-transparent" />
                          );
                        }

                        // Day entries
                        for (let d = 1; d <= daysInMonth; d++) {
                          const iterDateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                          const isClaimed = claimedDatesSet.has(iterDateStr);
                          const isToday = iterDateStr === todayStr;

                          if (isClaimed) {
                            if (isToday) {
                              // TODAY successfully checked in is shown with bright solid green base matching 27 in image!
                              list.push(
                                <div 
                                  key={`day-${d}`}
                                  className="w-full aspect-square rounded-[14px] bg-emerald-500 shadow-[0_4px_12px_rgba(16,185,129,0.3)] border border-emerald-600 flex flex-col items-center justify-center cursor-default select-none relative"
                                >
                                  <span className="text-white text-xs sm:text-sm font-black">{d}</span>
                                  <span className="text-[7px] sm:text-[9px] font-black text-emerald-100 mt-0.5 block">+1</span>
                                </div>
                              );
                            } else {
                              // Other claimed past or future dates show soft green background and light border
                              list.push(
                                <div 
                                  key={`day-${d}`}
                                  className="w-full aspect-square rounded-[14px] bg-emerald-950/20 border border-emerald-500/15 flex flex-col items-center justify-center cursor-default select-none group"
                                >
                                  <span className="text-emerald-400 text-xs sm:text-sm font-bold">{d}</span>
                                  <span className="text-[7px] sm:text-[9px] font-black text-emerald-500/60 mt-0.5 block">+1</span>
                                </div>
                              );
                            }
                          } else if (isToday) {
                            // TODAY: Not yet claimed, glows with light-pulsing active check-in prompt!
                            list.push(
                              <button 
                                key={`day-${d}`}
                                onClick={handleDailyCheckIn}
                                className="w-full aspect-square rounded-[14px] border border-emerald-500/50 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold flex flex-col items-center justify-center hover:scale-[1.03] transition-all cursor-pointer animate-pulse"
                                title="Click to check-in now"
                              >
                                <span className="text-xs sm:text-sm font-black">{d}</span>
                                <span className="text-[7px] sm:text-[9px] font-bold text-emerald-400 mt-0.5 block">CLAIM</span>
                              </button>
                            );
                          } else {
                            // Unclaimed normal date shown neutrally with clean spacing and absolutely no sub-labels
                            list.push(
                              <div 
                                key={`day-${d}`}
                                className="w-full aspect-square rounded-[14px] bg-white/[0.02] border border-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 font-semibold text-xs sm:text-sm select-none transition-colors"
                              >
                                {d}
                              </div>
                            );
                          }
                        }
                        return list;
                      })()}
                    </div>
                  </motion.div>
                )}

                {calTab === 'monthly' && (
                  <motion.div
                    key="monthly-calendar"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    transition={{ duration: 0.15 }}
                    className="grid grid-cols-3 gap-3"
                  >
                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((name, mIdx) => {
                      const prefixStr = `${calYear}-${String(mIdx + 1).padStart(2, '0')}`;
                      const claimCount = claimed_dates.filter((dStr: string) => dStr.startsWith(prefixStr)).length;
                      const hasClaims = claimCount > 0;

                      return (
                        <button
                          key={name}
                          onClick={() => {
                            setCalMonth(mIdx);
                            setCalTab('daily');
                          }}
                          className={cn(
                            "py-4 px-2 rounded-2xl flex flex-col items-center justify-center transition-all border cursor-pointer active:scale-95",
                            hasClaims 
                              ? "bg-emerald-950/20 border-emerald-500/20 text-emerald-400 hover:bg-emerald-950/30"
                              : "bg-white/[0.02] border-white/5 text-gray-400 hover:bg-white/5 hover:text-white"
                          )}
                        >
                          <span className="text-xs sm:text-sm font-black block uppercase">{name}</span>
                          <span className="text-[9px] font-black text-gray-500 mt-1 block">
                            {hasClaims ? `+${claimCount} Points` : '0 points'}
                          </span>
                        </button>
                      );
                    })}
                  </motion.div>
                )}

                {calTab === 'yearly' && (
                  <motion.div
                    key="yearly-calendar"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    transition={{ duration: 0.15 }}
                    className="grid grid-cols-3 gap-3"
                  >
                    {(() => {
                      const list = [];
                      const startY = calYear - 3; // Center range
                      for (let y = startY; y < startY + 9; y++) {
                        const prefixStr = `${y}-`;
                        const claimCount = claimed_dates.filter((dStr: string) => dStr.startsWith(prefixStr)).length;
                        const hasClaims = claimCount > 0;

                        list.push(
                          <button
                            key={y}
                            onClick={() => {
                              setCalYear(y);
                              setCalTab('monthly');
                            }}
                            className={cn(
                              "py-4 px-2 rounded-2xl flex flex-col items-center justify-center transition-all border cursor-pointer active:scale-95",
                              hasClaims 
                                ? "bg-emerald-950/20 border-emerald-500/20 text-emerald-400 hover:bg-emerald-950/30"
                                : "bg-white/[0.02] border-white/5 text-gray-400 hover:bg-white/5 hover:text-white"
                            )}
                          >
                            <span className="text-xs sm:text-sm font-black block">{y}</span>
                            <span className="text-[9px] font-black text-gray-500 mt-1 block">
                              {hasClaims ? `+${claimCount} Points` : '0 points'}
                            </span>
                          </button>
                        );
                      }
                      return list;
                    })()}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ATTEST / CLAIM ACTION BUTTON COMPONENT */}
            <div className="bg-[#11131f] border border-white/5 rounded-[24px] p-5 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <p className="text-xs font-black text-white uppercase tracking-wider">Claim attendance credit</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Must attest once every global 24-hour cycle.</p>
              </div>

              <button
                onClick={handleDailyCheckIn}
                disabled={isSubmitting || !isDailyClaimable}
                className={cn(
                  "w-full sm:w-auto px-8 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer",
                  isDailyClaimable 
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-105 text-white shadow-md shadow-emerald-500/10" 
                    : "bg-white/5 text-gray-500 border border-white/5 cursor-not-allowed"
                )}
              >
                {hasClaimedToday ? "Already Checked In Today" : countdownStr ? `Cycle rest in ${countdownStr}` : "Claim +1 Daily PTS"}
              </button>
            </div>
          </motion.div>
        )}

        {/* --- DEDICATED PAGE: REFER FRIENDS --- */}
        {rewardView === 'refer' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="max-w-4xl mx-auto space-y-6"
          >
            <button 
              onClick={() => setRewardView('dashboard')}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-gray-400 hover:text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all"
            >
              <ArrowLeft size={14} /> Back to Dashboard
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Matrix general panel */}
              <div className="lg:col-span-8 p-6 bg-[#11131f] border border-white/5 rounded-[32px] space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-[60px] rounded-full" />
                <div className="flex items-center gap-3">
                  <Users className="text-purple-400" size={24} />
                  <div>
                    <h2 className="text-lg font-black text-white italic uppercase">Referral Matrix Control</h2>
                    <p className="text-xs text-gray-500">Track invited partners, commissions, and codes.</p>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-1.5 xs:gap-2 sm:gap-3">
                  <div className="p-2 sm:p-4 bg-black/30 border border-white/5 rounded-xl text-center">
                    <span className="text-[7px] xs:text-[8px] sm:text-[9px] uppercase tracking-wider text-gray-400 block mb-0.5 leading-tight truncate">Invited Users</span>
                    <span className="text-xs xs:text-sm sm:text-lg font-black text-white italic">{partners.length}</span>
                  </div>
                  <div className="p-2 sm:p-4 bg-black/30 border border-white/5 rounded-xl text-center">
                    <span className="text-[7px] xs:text-[8px] sm:text-[9px] uppercase tracking-wider text-gray-400 block mb-0.5 leading-tight truncate">Active Tiers</span>
                    <span className="text-xs xs:text-sm sm:text-lg font-black text-emerald-400 italic">
                      {partners.filter(p => p.status === 'active').length}
                    </span>
                  </div>
                  <div className="p-2 sm:p-4 bg-black/30 border border-white/5 rounded-xl text-center">
                    <span className="text-[7px] xs:text-[8px] sm:text-[9px] uppercase tracking-wider text-gray-400 block mb-0.5 leading-tight truncate">Inactive Tiers</span>
                    <span className="text-xs xs:text-sm sm:text-lg font-black text-red-400 italic">
                      {partners.filter(p => p.status === 'inactive').length}
                    </span>
                  </div>
                  <div className="p-2 sm:p-4 bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/25 rounded-xl text-center">
                    <span className="text-[7px] xs:text-[8px] sm:text-[9px] uppercase tracking-wider text-gray-300 block mb-0.5 leading-tight truncate">Commission Wallet</span>
                    <span className="text-xs xs:text-sm sm:text-lg font-black text-white italic">${(profile?.referral_earnings || 0).toFixed(2)}</span>
                  </div>
                </div>

                {/* Copies code & link area */}
                <div className="p-3 sm:p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                  <div className="flex flex-row items-center justify-between gap-2 sm:gap-4 text-left">
                    <div className="shrink-0">
                      <span className="text-[7px] sm:text-[9px] text-gray-500 uppercase font-bold tracking-wider block">Invite Code</span>
                      <span className="font-black text-white font-mono tracking-widest text-[10px] sm:text-sm uppercase leading-none">{profile?.referral_code || '---'}</span>
                    </div>
                    <div className="flex-1 min-w-0 px-1 sm:px-2">
                       <span className="text-[7px] sm:text-[9px] text-gray-500 uppercase font-bold tracking-wider block leading-tight">Ref Link URL</span>
                       <span className="text-gray-400 truncate block font-mono text-[8px] sm:text-[9px] md:text-[10px] leading-tight">{profile?.referral_code ? `${window.location.origin}/signup?ref=${profile.referral_code}` : `${window.location.origin}/signup`}</span>
                    </div>
                    <button
                      onClick={() => {
                        const link = profile?.referral_code ? `${window.location.origin}/signup?ref=${profile.referral_code}` : `${window.location.origin}/signup`;
                        navigator.clipboard.writeText(link);
                        toast.success("Referral invitation link copied!");
                      }}
                      className="px-2.5 py-1.5 sm:px-4 sm:py-2 bg-[#009e42] hover:bg-[#02d147] active:bg-[#008236] text-white text-[8px] sm:text-[9px] font-black uppercase tracking-widest rounded-lg flex items-center gap-1 cursor-pointer shadow-md shadow-[#009e42]/20 transition-all shrink-0 font-sans leading-none"
                    >
                      <Copy size={10} /> Copy Link
                    </button>
                  </div>
                </div>

                {/* Partners List */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase text-white tracking-wider">Network Connections</h3>
                  <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                    {partnersLoading ? (
                      <div className="text-center py-6 text-xs text-gray-500 uppercase tracking-widest font-black animate-pulse">Loading directory entries...</div>
                    ) : partners.length === 0 ? (
                      <div className="text-center py-8 bg-black/10 rounded-xl text-[10px] text-gray-600 uppercase font-black">No partners invited. Share code to start.</div>
                    ) : (
                      partners.map(partner => (
                        <div key={partner.id} className="p-3 bg-black/40 border border-white/5 rounded-xl flex items-center justify-between text-xs">
                          <div>
                            <p className="font-bold text-white uppercase tracking-wide">@{partner.username}</p>
                            <p className="text-[10px] text-gray-500 block leading-normal">Plan: <span className="text-[#00E5FF] font-bold">{partner.planName}</span></p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={cn("px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest", partner.status === 'active' ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400")}>
                              {partner.status}
                            </span>
                            {partner.status === 'inactive' && (
                              <button
                                onClick={() => handlePokeUser(partner)}
                                disabled={pokedUsers[partner.id]}
                                className={cn(
                                  "px-2.5 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all",
                                  pokedUsers[partner.id] 
                                    ? "bg-white/5 text-gray-600 cursor-not-allowed" 
                                    : "bg-purple-600/20 text-purple-300 hover:bg-purple-600 hover:text-white"
                                )}
                              >
                                {pokedUsers[partner.id] ? "Poked" : "Poke User"}
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Claims ledger panel */}
              <div className="lg:col-span-4 p-6 bg-[#11131f] border border-white/5 rounded-[32px] space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Trophy className="text-purple-400" size={18} />
                    <span className="text-xs font-black uppercase tracking-wider text-white italic">Unclaimed Bonuses</span>
                  </div>

                  <div className="space-y-3.5 max-h-[290px] overflow-y-auto pr-1 scrollbar-thin flex-1">
                    {referralClaims.length === 0 ? (
                      <div className="text-center py-8 bg-black/20 rounded-2xl flex flex-col items-center justify-center p-4">
                        <Gift size={20} className="text-gray-600 mb-2" />
                        <span className="text-[9px] font-black uppercase text-gray-500 leading-normal block">Ledger Pristine</span>
                      </div>
                    ) : (
                      referralClaims.map((claim) => (
                        <div key={claim.id} className="p-3 bg-black/40 border border-white/5 rounded-xl flex items-center justify-between gap-3 text-xs">
                          <div className="min-w-0 flex-1">
                            <span className="text-[8px] font-black text-indigo-400 bg-indigo-500/10 px-1 py-0.5 rounded uppercase block w-max mb-1">
                              {claim.type === 'referrer' ? 'Commission' : 'Welcome'}
                            </span>
                            <p className="font-bold text-white truncate max-w-[120px]">Partner: @{claim.partner_name}</p>
                            <p className="text-[10px] text-emerald-400 font-bold mt-1">${claim.amount.toFixed(2)}</p>
                          </div>
                          {claim.status === 'pending' ? (
                            <button
                              onClick={() => handleClaimReferralReward(claim)}
                              disabled={isClaimingId === claim.id}
                              className="px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:brightness-110 active:scale-95 text-white text-[9px] font-black uppercase tracking-widest rounded-lg transition-all"
                            >
                              Claim
                            </button>
                          ) : (
                            <span className="text-[8px] font-black text-gray-600 uppercase">Claimed</span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* --- DEDICATED PAGE: NODE REWARDS --- */}
        {rewardView === 'nodes' && (() => {
          const activeUnclaimedNodeRewards = unclaimedInvestmentRewards.reduce((sum, inv) => sum + (inv.amount * 0.02), 0);
          const totalNodeRewardsClaimed = rewardHistory.filter(tx => tx.type === 'investment_reward').reduce((sum, tx) => sum + (tx.amount || 0), 0);
          const activeInvestmentPlans = Array.from(new Set(activeInvestments.map(inv => inv.plan_name).filter(Boolean)));

          return (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="max-w-2xl mx-auto space-y-6"
            >
              <button 
                onClick={() => setRewardView('dashboard')}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-gray-400 hover:text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all"
              >
                <ArrowLeft size={14} /> Back to Dashboard
              </button>

              {/* PREMIUM DEDICATED OVERVIEW CARD */}
              <div className="p-4 sm:p-6 rounded-[24px] bg-gradient-to-br from-[#121922]/95 to-[#070a10]/98 border border-white/5 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-yellow-500/5 blur-[80px] rounded-full" />
                <div className="grid grid-cols-4 gap-1 sm:gap-4 divide-x divide-white/5 md:divide-white/10">
                  <div className="space-y-0.5 sm:space-y-1 text-center sm:text-left">
                    <span className="text-[7px] xs:text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-gray-400 block leading-tight truncate">Node Reward Balance</span>
                    <span className="text-xs xs:text-sm sm:text-xl font-black text-yellow-400 font-mono italic block">${activeUnclaimedNodeRewards.toFixed(2)}</span>
                  </div>
                  <div className="space-y-0.5 sm:space-y-1 pl-1 sm:pl-5 text-center sm:text-left">
                    <span className="text-[7px] xs:text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-gray-400 block leading-tight truncate">Total Accumulated</span>
                    <span className="text-xs xs:text-sm sm:text-xl font-black text-white font-mono italic block">${totalNodeRewardsClaimed.toFixed(2)}</span>
                  </div>
                  <div className="space-y-0.5 sm:space-y-1 pl-1 sm:pl-5 text-center sm:text-left">
                    <span className="text-[7px] xs:text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-gray-400 block leading-tight truncate">Active Nodes</span>
                    <span className="text-xs xs:text-sm sm:text-xl font-black text-white font-mono block">{activeInvestments.length}</span>
                  </div>
                  <div className="space-y-0.5 sm:space-y-1 pl-1 sm:pl-5 text-center sm:text-left flex flex-col justify-center">
                    <span className="text-[7px] xs:text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-gray-400 block leading-tight mb-1 truncate">Active Plans</span>
                    <div className="flex flex-wrap justify-center sm:justify-start gap-0.5 sm:gap-1">
                      {activeInvestmentPlans.length === 0 ? (
                        <span className="text-[7px] xs:text-[8px] text-gray-500 font-bold uppercase truncate">None</span>
                      ) : (
                        activeInvestmentPlans.slice(0, 2).map((nm) => (
                          <span key={nm} className="px-1 py-0.2 sm:px-1.5 sm:py-0.5 rounded bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-[6px] sm:text-[8px] font-black uppercase tracking-wider">{nm}</span>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-[#11131f] border border-white/5 rounded-[32px] space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 blur-[80px] rounded-full animate-pulse" />
                <div className="flex items-center gap-3 mb-2">
                  <PiggyBank className="text-yellow-400" size={24} />
                  <div>
                    <h2 className="text-xl font-black text-white italic uppercase tracking-tight">Active Node Rewards</h2>
                    <p className="text-xs text-gray-500">Claim instant 2.00% cashback multipliers on node containers.</p>
                  </div>
                </div>

              {/* Tiers display */}
              <div className="space-y-4">
                {/* Regular */}
                <div className={cn("p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden", regularUnclaimed ? "bg-purple-500/5 border-purple-500 shadow-md" : "bg-black/30 border-white/5 opacity-60")}>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[8px] font-black uppercase text-purple-300 bg-purple-500/10 px-1.5 py-0.5 rounded tracking-widest">Regular Node Tier</span>
                      <p className="text-xs text-gray-500 mt-1">{regularUnclaimed ? 'Active nodes hosting rewards' : 'No unclaimed regular rewards'}</p>
                    </div>
                    {regularUnclaimed && (
                      <div className="text-right">
                        <p className="text-[9px] text-gray-400 uppercase">Available:</p>
                        <p className="text-sm font-black text-white italic">${(regularUnclaimed.amount * 0.02).toFixed(2)}</p>
                      </div>
                    )}
                  </div>
                  {regularUnclaimed && (
                    <button onClick={() => handleClaimInvestmentReward(regularUnclaimed)} disabled={isSubmitting} className="w-full mt-3 py-2 bg-[#009e42] hover:bg-[#02d147] active:bg-[#008236] active:scale-[0.98] text-white text-[9px] font-black uppercase tracking-widest rounded-lg shadow-md shadow-[#009e42]/20 transition-all cursor-pointer">
                      Claim 2% Incentive
                    </button>
                  )}
                </div>

                {/* Premium */}
                <div className={cn("p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden", premiumUnclaimed ? "bg-emerald-500/5 border-emerald-500 shadow-md" : "bg-black/30 border-white/5 opacity-60")}>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[8px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded tracking-widest">Premium Node Tier</span>
                      <p className="text-xs text-gray-500 mt-1">{premiumUnclaimed ? 'Active nodes hosting rewards' : 'No unclaimed premium rewards'}</p>
                    </div>
                    {premiumUnclaimed && (
                      <div className="text-right">
                        <p className="text-[9px] text-gray-400 uppercase">Available:</p>
                        <p className="text-sm font-black text-white italic">${(premiumUnclaimed.amount * 0.02).toFixed(2)}</p>
                      </div>
                    )}
                  </div>
                  {premiumUnclaimed && (
                    <button onClick={() => handleClaimInvestmentReward(premiumUnclaimed)} disabled={isSubmitting} className="w-full mt-3 py-2 bg-[#009e42] hover:bg-[#02d147] active:bg-[#008236] active:scale-[0.98] text-white text-[9px] font-black uppercase tracking-widest rounded-lg shadow-md shadow-[#009e42]/20 transition-all cursor-pointer">
                      Claim 2% Incentive
                    </button>
                  )}
                </div>

                {/* Elite */}
                <div className={cn("p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden", eliteUnclaimed ? "bg-amber-500/5 border-amber-500 shadow-md" : "bg-black/30 border-white/5 opacity-60")}>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[8px] font-black uppercase text-amber-500 bg-amber-505/10 px-1.5 py-0.5 rounded tracking-widest">Elite Node Tier</span>
                      <p className="text-xs text-gray-500 mt-1">{eliteUnclaimed ? 'Active nodes hosting rewards' : 'No unclaimed elite rewards'}</p>
                    </div>
                    {eliteUnclaimed && (
                      <div className="text-right">
                        <p className="text-[9px] text-gray-400 uppercase">Available:</p>
                        <p className="text-sm font-black text-white italic">${(eliteUnclaimed.amount * 0.02).toFixed(2)}</p>
                      </div>
                    )}
                  </div>
                  {eliteUnclaimed && (
                    <button onClick={() => handleClaimInvestmentReward(eliteUnclaimed)} disabled={isSubmitting} className="w-full mt-3 py-2 bg-[#009e42] hover:bg-[#02d147] active:bg-[#008236] active:scale-[0.98] text-white text-[9px] font-black uppercase tracking-widest rounded-lg shadow-md shadow-[#009e42]/20 transition-all cursor-pointer">
                      Claim 2% Incentive
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ); })()}

        {/* --- DEDICATED PAGE: RANKING --- */}
        {rewardView === 'ranking' && (() => {
          const totalRankingRewardsClaimed = claimed_milestones.reduce((sum, milestoneId) => {
            const MILESTONES_LOCAL = [
              { id: 'ref_milestone_5', amount: 20 },
              { id: 'ref_milestone_10', amount: 45 },
              { id: 'ref_milestone_20', amount: 90 },
              { id: 'ref_milestone_50', amount: 240 },
              { id: 'ref_milestone_100', amount: 500 },
              { id: 'ref_milestone_200', amount: 1500 }
            ];
            const item = MILESTONES_LOCAL.find(m => m.id === milestoneId);
            return sum + (item ? item.amount : 0);
          }, 0);

          return (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="max-w-4xl mx-auto space-y-6"
            >
              <button 
                onClick={() => setRewardView('dashboard')}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-gray-400 hover:text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all"
              >
                <ArrowLeft size={14} /> Back to Dashboard
              </button>

              {/* PREMIUM RANKING OVERVIEW CARD */}
              <div className="p-4 sm:p-6 rounded-[24px] bg-gradient-to-br from-[#101b22] to-[#05080c] border border-white/5 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/5 blur-[80px] rounded-full animate-pulse" />
                <div className="grid grid-cols-4 gap-1 sm:gap-4 divide-x divide-white/5 md:divide-white/10">
                  <div className="space-y-0.5 sm:space-y-1 text-center sm:text-left">
                    <span className="text-[7px] xs:text-[8px] sm:text-[90px] font-black uppercase tracking-wider text-gray-400 block leading-tight truncate">Ranking Balance</span>
                    <span className="text-xs xs:text-sm sm:text-xl font-black text-cyan-400 font-mono italic block">${totalRankingRewardsClaimed.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="space-y-0.5 sm:space-y-1 pl-1 sm:pl-5 text-center sm:text-left">
                    <span className="text-[7px] xs:text-[8px] sm:text-[90px] font-black uppercase tracking-wider text-gray-400 block leading-tight truncate">Total Referrals</span>
                    <span className="text-xs xs:text-sm sm:text-xl font-black text-white font-mono block">{partners.length}</span>
                  </div>
                  <div className="space-y-0.5 sm:space-y-1 pl-1 sm:pl-5 text-center sm:text-left">
                    <span className="text-[7px] xs:text-[8px] sm:text-[90px] font-black uppercase tracking-wider text-gray-400 block leading-tight truncate">Active Refs</span>
                    <span className="text-xs xs:text-sm sm:text-xl font-black text-emerald-400 font-mono block">{activeRefs}</span>
                  </div>
                  <div className="space-y-0.5 sm:space-y-1 pl-1 sm:pl-5 text-center sm:text-left flex flex-col justify-center">
                    <span className="text-[7px] xs:text-[8px] sm:text-[90px] font-black uppercase tracking-wider text-gray-400 block leading-tight truncate">Current Rank</span>
                    <span className="text-[9px] xs:text-[10px] sm:text-sm font-black text-emerald-400 uppercase tracking-widest mt-1 inline-flex items-center justify-center sm:justify-start gap-1 leading-none shrink-0 truncate">
                      <Icon3DRankingMini />
                      {userHighestPlan ? userHighestPlan.replace(/node/i, '').trim() : 'Starter'}
                    </span>
                  </div>
                </div>
              </div>

              {/* TRACK REFERRED USERS grid */}
              <div className="p-6 bg-[#0a0d14] border border-white/5 rounded-[28px] space-y-4">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-[#00E5FF]" />
                  <span className="text-xs font-black uppercase tracking-wider text-white">My Commission Network</span>
                </div>
                {partnersLoading ? (
                  <div className="py-6 text-center text-xs text-gray-500 uppercase font-black tracking-widest animate-pulse">
                    Querying network directory...
                  </div>
                ) : partners.length === 0 ? (
                  <div className="p-6 text-center text-xs text-gray-500 bg-black/20 border border-white/5 rounded-2xl">
                    No referred users detected yet. Join the program today!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                    {partners.map((partner) => (
                      <div key={partner.id} className="p-3 bg-black/40 border border-white/5 rounded-2xl flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {/* Profile Vector Avatar */}
                          <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center">
                            <img
                              src={`https://api.dicebear.com/7.x/notionists/svg?seed=${partner.username || 'user'}`}
                              alt={partner.username}
                              className="w-full h-full object-cover animate-none"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="font-black text-sm text-white uppercase tracking-wider truncate">@{partner.username}</p>
                            <span className="text-[10px] text-gray-500 font-bold block truncate">{partner.name}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className={cn(
                            "px-2.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest",
                            partner.status === 'active' 
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                              : "bg-red-500/10 text-red-400 border border-red-500/20"
                          )}>
                            {partner.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-8 bg-[#11131f] border border-white/5 rounded-[32px] space-y-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-[80px] rounded-full" />
                <div className="text-center space-y-3">
                  <Trophy className="text-yellow-400 mx-auto" size={28} />
                  <h2 className="text-xl font-black text-white italic uppercase tracking-tight">Ecosystem Rankings</h2>
                  
                  {/* Dynamic User Ranking Display */}
                  {(() => {
                    let userRankName = "Starter";
                    let baseRankNum = 250050;
                    if (userHighestPlan === 'elite') {
                      userRankName = "Elite";
                      baseRankNum = 1240;
                    } else if (userHighestPlan === 'premium') {
                      userRankName = "Premium";
                      baseRankNum = 24103;
                    } else if (userHighestPlan === 'regular' || activeInvestments.length > 0) {
                      userRankName = "Regular";
                      baseRankNum = 107980;
                    }
                    
                    const deduction = (activeRefs * 123) + (activeInvestments.length * 456) + (rewardHistory.length * 89);
                    const userRankNumber = Math.max(1, baseRankNum - deduction);
                    
                    return (
                      <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] sm:text-xs font-black tracking-widest uppercase shadow-inner animate-pulse">
                        <Icon3DRankingMini />
                        <span>{userRankName} #{userRankNumber.toLocaleString()}</span>
                      </div>
                    );
                  })()}

                  <p className="text-xs text-gray-500">Nodes sorted dynamically by operational active capacity plan.</p>
                </div>

                {/* 3 Premium Ranking Cards: Premium Left, Elite Centers, Regular Right */}
                <div className="grid grid-cols-3 gap-1.5 xs:gap-2 sm:gap-4 md:gap-6 items-stretch pt-4">
                  {/* Premium Card (Left) */}
                  <div className={cn(
                    "p-2 xs:p-4 sm:p-6 pt-10 xs:pt-12 sm:pt-16 rounded-xl sm:rounded-[24px] border transition-all duration-300 flex flex-col justify-between space-y-2 text-center select-none relative",
                    userHighestPlan === 'premium'
                      ? "bg-purple-500/5 border-purple-500 shadow-[0_4px_30px_rgba(124,58,237,0.15)]"
                      : "bg-black/40 border-white/5 hover:border-white/10"
                  )}>
                    <div className="scale-50 xs:scale-75 sm:scale-100 origin-center">
                      <Icon3DPremiumCard />
                    </div>
                    {userHighestPlan === 'premium' && (
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full bg-purple-500 text-white text-[6px] sm:text-[8px] font-black uppercase tracking-wider whitespace-nowrap">Active Rank</span>
                    )}
                    <div className="space-y-1 block w-full min-w-0">
                      <span className="text-[6.5px] xs:text-[8px] sm:text-[9px] uppercase font-black text-emerald-400 tracking-wider inline-flex items-center justify-center gap-0.5 mb-1 leading-none w-full truncate">
                        <Icon3DRankingMini />
                        <span>Premium</span>
                      </span>
                      <span className="text-xs xs:text-sm sm:text-2xl md:text-3xl font-black text-white italic tracking-tight block truncate">{premiumCount.toLocaleString()}</span>
                      <span className="text-[6px] xs:text-[7px] sm:text-[9px] text-gray-500 uppercase font-bold tracking-wider block truncate">Active Members</span>
                    </div>
                  </div>

                  {/* Elite Card (Center - Highlighted) */}
                  <div className={cn(
                    "p-2 xs:p-4 sm:p-6 pt-10 xs:pt-12 sm:pt-16 rounded-xl sm:rounded-[24px] border-2 transition-all duration-300 flex flex-col justify-between space-y-2 text-center select-none relative sm:scale-[1.03] md:scale-[1.05]",
                    userHighestPlan === 'elite'
                      ? "bg-amber-500/10 border-amber-500 shadow-[0_4px_45px_rgba(245,158,11,0.25)]"
                      : "bg-gradient-to-b from-[#1c1811] to-[#0d0905] border-amber-500/30 hover:border-amber-500/60 shadow-lg shadow-amber-500/5"
                  )}>
                    <div className="scale-50 xs:scale-75 sm:scale-100 origin-center">
                      <Icon3DEliteCard />
                    </div>
                    {userHighestPlan === 'elite' ? (
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full bg-amber-550 text-black text-[6px] sm:text-[8px] font-black uppercase tracking-wider whitespace-nowrap">Active Rank</span>
                    ) : (
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[#FEF7E0] text-[6px] sm:text-[8px] font-black uppercase tracking-wider whitespace-nowrap">Aesthetic</span>
                    )}
                    <div className="space-y-1 pt-1 block w-full min-w-0">
                      <span className="text-[6.5px] xs:text-[8px] sm:text-[9px] uppercase font-black text-emerald-400 tracking-wider inline-flex items-center justify-center gap-0.5 mb-1 leading-none w-full truncate">
                        <Icon3DRankingMini />
                        <span>Elite</span>
                      </span>
                      <span className="text-xs xs:text-sm sm:text-2xl md:text-3xl font-black text-white italic tracking-tight block truncate">{eliteCount.toLocaleString()}</span>
                      <span className="text-[6px] xs:text-[7px] sm:text-[9px] text-gray-500 uppercase font-bold tracking-wider block truncate">Active Members</span>
                    </div>
                  </div>

                  {/* Regular Card (Right) */}
                  <div className={cn(
                    "p-2 xs:p-4 sm:p-6 pt-10 xs:pt-12 sm:pt-16 rounded-xl sm:rounded-[24px] border transition-all duration-300 flex flex-col justify-between space-y-2 text-center select-none relative",
                    userHighestPlan === 'regular' || (!userHighestPlan && activeInvestments.length > 0)
                      ? "bg-emerald-500/5 border-emerald-500 shadow-[0_4px_30px_rgba(16,185,129,0.15)]"
                      : "bg-black/40 border-white/5 hover:border-white/10"
                  )}>
                    <div className="scale-50 xs:scale-75 sm:scale-100 origin-center">
                      <Icon3DRegularCard />
                    </div>
                    {(userHighestPlan === 'regular' || (!userHighestPlan && activeInvestments.length > 0)) && (
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full bg-emerald-500 text-white text-[6px] sm:text-[8px] font-black uppercase tracking-wider whitespace-nowrap">Active Rank</span>
                    )}
                    <div className="space-y-1 block w-full min-w-0">
                      <span className="text-[6.5px] xs:text-[8px] sm:text-[9px] uppercase font-black text-emerald-400 tracking-wider inline-flex items-center justify-center gap-0.5 mb-1 leading-none w-full truncate">
                        <Icon3DRankingMini />
                        <span>Regular</span>
                      </span>
                      <span className="text-xs xs:text-sm sm:text-2xl md:text-3xl font-black text-white italic tracking-tight block truncate">{regularCount.toLocaleString()}</span>
                      <span className="text-[6px] xs:text-[7px] sm:text-[9px] text-gray-500 uppercase font-bold tracking-wider block truncate">Active Members</span>
                    </div>
                  </div>
                </div>

                {/* STAR REWARD SYSTEM */}
                <div className="pt-6 border-t border-white/5 space-y-6">
                  <div className="text-center space-y-1">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider italic">Ecosystem Stargate Milestones</h3>
                    <div className="flex justify-center items-center gap-1.5 pt-2">
                      {[
                        { idx: 1, limit: 3 },
                        { idx: 2, limit: 5 },
                        { idx: 3, limit: 10 },
                        { idx: 4, limit: 20 },
                        { idx: 5, limit: 50 },
                        { idx: 6, limit: 200 },
                      ].map((star) => {
                        const isUnlocked = activeRefs >= star.limit;
                        return (
                          <motion.svg
                            key={star.idx}
                            className={cn("w-7 h-7 filter", isUnlocked ? "text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]" : "text-gray-700")}
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            animate={isUnlocked ? { scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] } : {}}
                            transition={{ repeat: isUnlocked ? Infinity : 0, duration: 4, ease: "easeInOut", delay: star.idx * 0.3 }}
                          >
                            <path d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27Z" />
                          </motion.svg>
                        );
                      })}
                    </div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest pt-1">
                      Streak capacity: <span className="text-[#00E5FF]">{activeRefs}</span> / 200 active referrals reached
                    </p>
                  </div>
                </div>

                {/* REFERRAL REWARD MILESTONES */}
                <div className="space-y-4 pt-4">
                  <div className="flex items-center gap-2 px-2">
                    <Gift size={16} className="text-[#00E5FF]" />
                    <span className="text-xs font-black uppercase tracking-wider text-white">Active Milestone Allocations</span>
                  </div>                  <div className="grid grid-cols-2 gap-2 sm:gap-4">
                    {[
                      { id: 'ref_milestone_5', amount: 20, req: 5, title: 'Squad Recruit Booster' },
                      { id: 'ref_milestone_10', amount: 45, req: 10, title: 'Elite Network Commander' },
                      { id: 'ref_milestone_20', amount: 90, req: 20, title: 'Wavelength Node Overlord' },
                      { id: 'ref_milestone_50', amount: 240, req: 50, title: 'CGA High Council Vanguard' },
                      { id: 'ref_milestone_100', amount: 500, req: 100, title: 'Stargate Genesis Catalyst' },
                      { id: 'ref_milestone_200', amount: 1500, req: 200, title: 'Stargate Eternal Sovereign' }
                    ].map((milestone) => {
                      const isClaimed = claimed_milestones.includes(milestone.id);
                      const isEligible = activeRefs >= milestone.req;
                      const percent = Math.min(100, (activeRefs / milestone.req) * 100);
                      const isSpecial = milestone.id === 'ref_milestone_200';

                      return (
                        <div 
                          key={milestone.id}
                          className={cn(
                            "p-3 sm:p-5 rounded-2xl border flex flex-col justify-between space-y-3 sm:space-y-4 relative overflow-hidden transition-all duration-300",
                            isClaimed 
                              ? "bg-black/20 border-white/5 opacity-70"
                              : isSpecial
                                ? "bg-gradient-to-br from-[#2d1f08]/90 via-[#181308]/95 to-[#05080c]/98 border-amber-400 shadow-[0_0_20px_rgba(217,119,6,0.25)] hover:shadow-[0_0_30px_rgba(217,119,6,0.35)]"
                                : isEligible
                                  ? "bg-gradient-to-r from-cyan-950/20 to-blue-950/20 border-cyan-500/40 shadow-md shadow-cyan-500/5 hover:border-cyan-500/60"
                                  : "bg-black/40 border-white/5"
                          )}
                        >
                          <div className="flex gap-2 sm:gap-4 items-start">
                            {/* 3D-styled mini vector reward visual */}
                            <div className={cn(
                              "w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center border relative shrink-0",
                              isClaimed 
                                ? "bg-white/5 border-white/5" 
                                : isSpecial
                                  ? "bg-amber-500/10 border-amber-400/40 text-amber-400"
                                  : isEligible 
                                    ? "bg-cyan-500/10 border-cyan-500/30 text-[#00E5FF]" 
                                    : "bg-black/60 border-white/5 text-gray-500"
                            )}>
                              <svg className="w-5 h-5 sm:w-8 sm:h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                              </svg>
                              {isEligible && !isClaimed && (
                                <span className="absolute -top-0.5 -right-0.5 w-1.5 sm:w-2.5 h-1.5 sm:h-2.5 rounded-full bg-red-500 animate-ping" />
                              )}
                            </div>

                            <div className="space-y-0.5 min-w-0 flex-1 w-full text-left">
                              <div className="flex items-center gap-1">
                                <span className={cn(
                                  "text-[6px] sm:text-[7px] font-black uppercase bg-white/5 px-1 py-0.5 rounded tracking-widest",
                                  isSpecial ? "text-amber-400 bg-amber-405/10 border border-amber-405/20 animate-pulse" : "text-gray-500"
                                )}>
                                  {isSpecial ? "ELITE IMMORTAL" : "Reward Tier"}
                                </span>
                              </div>
                              <h4 className="text-[10px] sm:text-xs font-black text-white truncate uppercase">{milestone.title}</h4>
                              <p className={cn(
                                "text-[9px] sm:text-[10px] font-black font-mono",
                                isSpecial ? "text-amber-400" : "text-[#00E5FF]"
                              )}>+${milestone.amount.toFixed(2)} USD</p>
                            </div>
                          </div>

                          {/* Progress Status Bar */}
                          <div className="space-y-1 pt-1">
                            <div className="flex justify-between text-[7px] sm:text-[9px] font-mono leading-none">
                              <span className="text-gray-500 font-bold uppercase">PROG STATUS</span>
                              <span className={isEligible ? (isSpecial ? "text-amber-400 font-black animate-pulse" : "text-[#00E5FF] font-black") : "text-gray-400 font-bold"}>
                                {activeRefs}/{milestone.req} ({percent.toFixed(0)}%)
                              </span>
                            </div>
                            <div className="w-full h-1 sm:h-1.5 rounded-full bg-black/40 overflow-hidden border border-white/5">
                              <div 
                                className={cn(
                                  "h-full rounded-full transition-all duration-500",
                                  isClaimed 
                                    ? "bg-gray-650"
                                    : isSpecial
                                      ? "bg-gradient-to-r from-amber-550 to-amber-300 animate-pulse"
                                      : isEligible 
                                        ? "bg-gradient-to-r from-cyan-400 to-blue-500 animate-pulse" 
                                        : "bg-gray-650"
                                ) } 
                                style={{ width: `${percent}%` }} 
                              />
                            </div>
                          </div>

                          {/* Action buttons with Transaction support */}
                          <button
                            onClick={() => handleClaimMilestone(milestone.id, milestone.amount, milestone.req)}
                            disabled={isSubmitting || !isEligible || isClaimed}
                            className={cn(
                              "w-full py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl text-[7px] sm:text-[9px] font-black uppercase tracking-wider transition-all duration-300",
                              isClaimed
                                ? "bg-white/5 text-gray-400 border border-white/5 cursor-not-allowed select-none"
                                : isSpecial
                                  ? "bg-gradient-to-r from-amber-500 to-yellow-400 hover:brightness-110 active:scale-[0.98] text-black shadow-lg shadow-amber-505/20 font-black cursor-pointer border border-amber-300/30"
                                  : isEligible
                                    ? "bg-gradient-to-r from-[#00E5FF] to-[#3B82F6] hover:brightness-110 active:scale-[0.98] text-black shadow-lg shadow-cyan-500/20 font-black cursor-pointer"
                                    : "bg-black/50 text-gray-600 border border-white/5 cursor-not-allowed select-none"
                            )}
                          >
                            {isClaimed ? "✓ CLAIMED" : isEligible ? "CLAIM" : `LOCKED (${milestone.req} REFS)`}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* HOW RANKING WORKS SECTION (PREMIUM DARK GLASSMORPHISM) */}
                <div className="p-6 bg-black/50 border border-white/5 rounded-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-[80px] rounded-full" />
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-[#00E5FF]" />
                    <span className="text-xs font-black uppercase text-white tracking-wider">Protocol: How Rankings Work</span>
                  </div>
                  <div className="space-y-3.5 text-xs text-gray-450 leading-relaxed font-bold">
                    <p>
                      Your <span className="text-[#00E5FF]">Ecosystem Ranking Position</span> is dynamic and updates automatically based on operations. The core protocol evaluates your active staking containers (Regular, Premium, or Elite), active referrals count, and history of claims.
                    </p>
                    <ul className="list-disc pl-5 space-y-1.5 text-gray-550">
                      <li>
                        <span className="text-white">Active Referrals:</span> Users who signup under your link and successfully activate any node investment plan.
                      </li>
                      <li>
                        <span className="text-white">Stargate Stars:</span> Progresses up through 6 levels (at 3, 5, 10, 20, 50, 200 partners) with glowing milestones.
                      </li>
                      <li>
                        <span className="text-white">Escrow Milestones:</span> Instantly claimable to your cash payouts wallet once the designated threshold is passed.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })()}

        {/* --- DEDICATED PAGE: POINT CONVERSION --- */}
        {rewardView === 'conversion' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="max-w-md mx-auto space-y-6"
          >
            <button 
              onClick={() => setRewardView('dashboard')}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-gray-400 hover:text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all"
            >
              <ArrowLeft size={14} /> Back to Dashboard
            </button>

            <div className="p-8 bg-[#11131f] border border-white/5 rounded-[32px] space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-[80px] rounded-full" />
              <div className="flex items-center gap-3">
                <ArrowRightLeft className="text-cyan-400" size={24} />
                <div>
                  <h2 className="text-xl font-black text-white italic uppercase tracking-tight">Point Conversion</h2>
                  <p className="text-xs text-gray-500 font-bold">Swap loyalty points to liquid rewards instantly.</p>
                </div>
              </div>

              <div className="p-4 bg-black/40 border border-white/5 rounded-2xl space-y-3.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400 uppercase font-black text-[9px]">Rate Protocol:</span>
                  <span className="text-[#00E5FF] font-bold font-mono">1 Point = $0.10 USD</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 uppercase font-black text-[9px]">Points Balance:</span>
                  <div className="flex items-center gap-1">
                    <span className="text-white font-black">{points_balance}</span>
                    <span className="text-yellow-400 mt-[-2px]">★</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 uppercase font-black text-[9px]">USD Value Equivalent:</span>
                  <span className="text-emerald-400 font-bold font-mono">${(points_balance * 0.10).toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">Convert Points Amount</label>
                <div className="relative">
                  <input 
                    type="text"
                    inputMode="numeric"
                    placeholder="Points to swap..."
                    value={pointsInput}
                    onChange={(e) => setPointsInput(formatNumberWithCommas(e.target.value, false))}
                    className="w-full bg-[#0a0c10] border border-white/10 rounded-xl py-3.5 px-4 text-sm font-bold text-white outline-none focus:border-cyan-500/40 pr-16"
                  />
                  <button
                    onClick={() => setPointsInput(formatNumberWithCommas(points_balance.toString()))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 px-3 py-1.5 rounded-lg hover:bg-cyan-400/20 transition-all cursor-pointer"
                  >
                    Max
                  </button>
                </div>

                {parseFormattedNumber(pointsInput) > 0 && (
                  <div className="flex justify-between text-[11px] px-1 font-bold">
                    <span>You will claim:</span>
                    <span className="text-emerald-400 font-mono">+${(parseFormattedNumber(pointsInput) * 0.10).toFixed(2)} USD</span>
                  </div>
                )}
              </div>

              <button
                onClick={handlePointsConversion}
                disabled={isSubmitting || !pointsInput || parseFormattedNumber(pointsInput) <= 0}
                className="w-full py-3.5 bg-[#009e42] hover:bg-[#02d147] active:bg-[#008236] active:scale-[0.98] text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-[#009e42]/20 transition-all disabled:opacity-30 cursor-pointer"
              >
                Execute Point Swap
              </button>
            </div>
          </motion.div>
        )}

        {/* --- DEDICATED PAGE: ABOUT REWARDS --- */}
        {rewardView === 'about' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="max-w-4xl mx-auto space-y-6 text-left"
          >
            <button 
              onClick={() => setRewardView('dashboard')}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-gray-400 hover:text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all"
            >
              <ArrowLeft size={14} /> Back to Dashboard
            </button>

            {/* HEADER HERO AREA */}
            <div className="p-8 rounded-[32px] bg-gradient-to-br from-[#121922]/95 to-[#070a10]/98 border border-white/5 shadow-2 w-full relative overflow-hidden flex flex-col items-center text-center space-y-4">
              <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-[100px] rounded-full" />
              <div className="absolute -bottom-8 -left-8 w-48 h-48 bg-purple-500/5 blur-[80px] rounded-full" />
              
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500/10 to-indigo-500/10 border border-cyan-500/20 flex items-center justify-center animate-pulse">
                <Trophy className="text-cyan-400" size={32} />
              </div>
              
              <div className="space-y-1.5 max-w-lg">
                <h1 className="text-2xl sm:text-3xl font-black text-white italic tracking-tight uppercase">Rewards Protocol Blueprint</h1>
                <p className="text-xs text-gray-400 font-bold leading-relaxed">
                  Welcome to the multi-tier Capital Growth Alliance Ecosystem dynamic incentive structure. Learn how to optimize, claim, and accelerate your rewards pipeline safely.
                </p>
              </div>
            </div>

            {/* SECTIONS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8">
              {/* SECTION 1: REWARD PROGRAM OVERVIEW */}
              <div className="p-6 bg-[#11131f]/80 backdrop-blur-md border border-white/5 rounded-2xl space-y-3 relative overflow-hidden transition-all duration-300 hover:border-cyan-500/20">
                <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 blur-[45px] rounded-full" />
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                    <Award size={18} />
                  </div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Reward Program</h3>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed font-bold">
                  The standard Reward Program forms the baseline ecosystem buffer, providing real USD equivalents for loyalty actions. It pools points generated through daily tasks and user activations, distributing them securely back to your verified wallet.
                </p>
              </div>

              {/* SECTION 2: REFERRAL PROGRAM */}
              <div className="p-6 bg-[#11131f]/80 backdrop-blur-md border border-white/5 rounded-2xl space-y-3 relative overflow-hidden transition-all duration-300 hover:border-indigo-500/20">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 blur-[45px] rounded-full" />
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <Users size={18} />
                  </div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Referral Program</h3>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed font-bold">
                  Expand your professional Node matrix today. Get dynamic welcome credits of $15.00 for every client you introduce, and secure persistent matrix commissions based on referrals' container operations as they level up.
                </p>
              </div>

              {/* SECTION 3: DAILY CHECK-IN */}
              <div className="p-6 bg-[#11131f]/80 backdrop-blur-md border border-white/5 rounded-2xl space-y-3 relative overflow-hidden transition-all duration-300 hover:border-yellow-500/20">
                <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/5 blur-[45px] rounded-full" />
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400">
                    <Calendar size={18} />
                  </div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Daily Check-In</h3>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed font-bold">
                  Consistency establishes momentum. Claim point multipliers every 24 hours by validating container nodes. Missed days interrupt streak growth, so remember to log in daily and collect your points without interruption.
                </p>
              </div>

              {/* SECTION 4: POINT CONVERSION */}
              <div className="p-6 bg-[#11131f]/80 backdrop-blur-md border border-white/5 rounded-2xl space-y-3 relative overflow-hidden transition-all duration-300 hover:border-emerald-500/20">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-[45px] rounded-full" />
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <Coins size={18} />
                  </div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Point Conversion</h3>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed font-bold">
                  Convert accumulated loyalty stars directly into highly liquid USD available balances. The rate is set statically at <span className="text-emerald-400">1 Point = $0.10 USD</span>, and can be swapped securely inside the system at any time.
                </p>
              </div>

              {/* SECTION 5: NODE ACTIVATION REWARDS */}
              <div className="p-6 bg-[#11131f]/80 backdrop-blur-md border border-white/5 rounded-2xl space-y-3 relative overflow-hidden transition-all duration-300 hover:border-purple-500/20">
                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 blur-[45px] rounded-full" />
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
                    <Cpu size={18} />
                  </div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Node Activation Rewards</h3>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed font-bold">
                  Scale container rewards dynamically. Operating active node systems un-locks cashbacks up to <span className="text-purple-400">2.00% multiplier</span> corresponding to Regular, Premium, or Elite allocations. Cashout instantly.
                </p>
              </div>

              {/* SECTION 6: ECOSYSTEM RANKING */}
              <div className="p-6 bg-[#11131f]/80 backdrop-blur-md border border-white/5 rounded-2xl space-y-3 relative overflow-hidden transition-all duration-300 hover:border-blue-500/20">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-[45px] rounded-full" />
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
                    <Icon3DRankingMini />
                  </div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Ecosystem Ranking</h3>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed font-bold">
                  Earn points and rank up. Our dynamic star engine computes active node capacity plans, referrals, and claims to place you on the secure Stargate ladder. Unlock exclusive rewards at each tier milestone.
                </p>
              </div>

              {/* SECTION 7: REWARD GROWTH STRATEGY (FULLSPAN) */}
              <div className="p-6 bg-gradient-to-r from-cyan-950/20 to-indigo-950/20 border border-cyan-500/20 rounded-2xl space-y-3 relative overflow-hidden col-span-1 md:col-span-2">
                <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/5 blur-[65px] rounded-full" />
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-[#00E5FF]">
                    <TrendingUp size={18} />
                  </div>
                  <h3 className="text-sm font-black text-[#00E5FF] uppercase tracking-wider italic">Program Growth & Optimization Strategy</h3>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed font-bold">
                  Maximize your capital velocity! For peak efficiency, align Daily Check-ins with custom Elite node distributions. Introduce active partners to build structured network trees, allowing your accumulated points to generate massive residual conversions continuously over time.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- POPUPS & MODALS --- */}
      <AnimatePresence>
        {selectedGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#0f111a] border border-slate-200 dark:border-white/10 rounded-[32px] max-w-lg w-full p-6 relative overflow-hidden shadow-2xl"
            >
              <button 
                onClick={() => setSelectedGuide(null)}
                className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-gray-400 hover:text-slate-700 dark:hover:text-white transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
              <h3 className="text-lg font-black text-slate-900 dark:text-white italic tracking-tight uppercase mb-4">{selectedGuide.title}</h3>
              <p className="text-xs text-slate-600 dark:text-gray-400 leading-relaxed whitespace-pre-line bg-slate-50 dark:bg-black/30 p-4 rounded-xl border border-slate-200 dark:border-white/5">{selectedGuide.fullDesc || selectedGuide.shortDesc}</p>
            </motion.div>
          </div>
        )}

        {showMethodSelector && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md" onClick={() => setShowMethodSelector(false)}>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="bg-white dark:bg-[#0f111a] border border-slate-200 dark:border-white/10 rounded-[28px] max-w-lg w-full p-6 relative shadow-2xl overflow-y-auto max-h-[85vh] flex flex-col text-left"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Coins size={18} className="text-emerald-500 dark:text-emerald-400" />
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase italic tracking-wider">
                    {selectedMobileMethod ? 'USDT TRC-20 Withdrawal' : 'Choose Settlement Network'}
                  </h3>
                </div>
                <button 
                  onClick={() => {
                    setShowMethodSelector(false);
                    setSelectedMobileMethod(null);
                  }}
                  className="p-2 rounded-full bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-gray-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {!isWithdrawalAllowed() ? (
                <div className="py-8 px-4 flex flex-col items-center justify-center text-center space-y-4">
                  <Lock size={32} className="text-rose-500 dark:text-rose-400 animate-pulse" />
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">System Protocol Closed</h3>
                    <p className="text-[10px] text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-550/20 px-3 py-1 rounded-full inline-block font-mono">Operations Restricted Today</p>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-gray-500 leading-relaxed">Reward withdrawals are open Monday 9:00 AM – Friday 4:00 PM GMT+1. Please schedule during open hours.</p>
                </div>
              ) : !selectedMobileMethod ? (
                <div className="space-y-4">
                  <button
                    onClick={() => {
                      setWithdrawMethod('crypto');
                      setSelectedMobileMethod('crypto');
                    }}
                    className="w-full text-left p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] hover:bg-slate-100/80 dark:hover:bg-white/5 border border-slate-200 dark:border-white/5 hover:border-emerald-500/30 transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 dark:text-emerald-400">
                        <Wallet size={20} />
                      </div>
                      <div>
                        <span className="block text-xs font-black uppercase text-slate-900 dark:text-white tracking-wider">USDT Wallet</span>
                        <span className="text-[10px] text-slate-500 dark:text-gray-500">Disbursed instantly on TRC-20 protocol layer.</span>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-slate-400 dark:text-gray-500" />
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <button onClick={() => setSelectedMobileMethod(null)} className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-2 cursor-pointer">← BACK TO SELECTION</button>

                  <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest block mb-1.5">Withdraw Amount (USD)</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        inputMode="decimal"
                        placeholder="$0.00" 
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(formatNumberWithCommas(e.target.value, true))}
                        className="w-full bg-slate-50 dark:bg-[#0a0c10] border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-500/50 placeholder:text-slate-400"
                      />
                      <button 
                        onClick={() => setWithdrawAmount(formatNumberWithCommas(reward_dollar_balance.toString()))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg cursor-pointer"
                      >
                        All
                      </button>
                    </div>
                  </div>

                  {selectedMobileMethod === 'crypto' ? (
                    <div>
                      <label className="text-xs font-bold text-slate-500 dark:text-gray-400 block mb-1">USDT TRC-20</label>
                      <input 
                        type="text" 
                        placeholder="TR7NHq..." 
                        value={cryptoAddress}
                        onChange={(e) => setCryptoAddress(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-[#0a0c10] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-xs text-slate-900 dark:text-white outline-none placeholder:text-slate-400"
                      />

                      {/* Warning note pop-up reminder with "I have" toggle button */}
                      <div className="mt-3 p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-2 text-left">
                        <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold leading-relaxed">
                          ⚠️ WARNING: This is only for USDT! Please ensure your address is a **USDT TRC-20** (or CRC-20) wallet address. Sending other tokens will result in permanent loss of funds.
                        </p>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[10px] font-black uppercase text-slate-600 dark:text-gray-450">I have double checked</span>
                          <button
                            type="button"
                            onClick={() => setHasConfirmedTrc20(!hasConfirmedTrc20)}
                            className={cn(
                              "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer",
                              hasConfirmedTrc20 
                                ? "bg-[#009e42] text-white shadow-lg shadow-[#009e42]/20"
                                : "bg-slate-200 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white"
                            )}
                          >
                            {hasConfirmedTrc20 ? "✓ I have" : "I have"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-gray-400 block mb-1">Bank Name</label>
                        <button type="button" onClick={() => setShowBankSelector(true)} className="w-full bg-slate-50 dark:bg-[#0a0c10] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white flex items-center justify-between cursor-pointer">
                          <span>{bankName || "Select bank institution"}</span>
                          <ChevronDown size={14} className="text-slate-400 dark:text-gray-400" />
                        </button>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-gray-400 block mb-1">Account Number</label>
                        <input type="text" placeholder="10-digit numeric code" value={bankAccNumber} onChange={(e) => setBankAccNumber(e.target.value.replace(/[^0-9]/g, ''))} className="w-full bg-slate-50 dark:bg-[#0a0c10] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white outline-none placeholder:text-slate-400" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-gray-400 block mb-1">Holder Name</label>
                        <input type="text" placeholder={profile?.name || "Perfect match required"} value={bankAccName} onChange={(e) => setBankAccName(e.target.value)} className="w-full bg-slate-50 dark:bg-[#0a0c10] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white outline-none placeholder:text-slate-400" />
                      </div>
                    </div>
                  )}

                  <div className="bg-slate-50 dark:bg-[#0a0c10] border border-slate-200 dark:border-transparent p-4 rounded-xl space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600 dark:text-gray-400">
                      <span>Protocol Processing Fee (20%):</span>
                      <span className="text-rose-500 dark:text-rose-400 font-mono">-${((parseFormattedNumber(withdrawAmount) || 0) * 0.20).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold pt-2 border-t border-slate-200 dark:border-white/5 text-slate-900 dark:text-white">
                      <span>Net Payout:</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-mono">${((parseFormattedNumber(withdrawAmount) || 0) * 0.80).toFixed(2)}</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      if (!withdrawAmount || parseFormattedNumber(withdrawAmount) < 10) {
                        toast.error("Minimum settlement is $10.00");
                        return;
                      }
                      if (parseFormattedNumber(withdrawAmount) > reward_dollar_balance) {
                        toast.error("Amount exceeds balance.");
                        return;
                      }
                      if (!hasConfirmedTrc20) {
                        toast.error("Please toggle 'I have' to confirm your USDT TRC-20 address.");
                        return;
                      }
                      setShowMethodSelector(false);
                      setShowPinModal(true);
                    }}
                    className={cn(
                      "w-full py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all",
                      hasConfirmedTrc20
                        ? "bg-[#009e42] hover:bg-[#02d147] active:bg-[#008236] text-white shadow-lg shadow-[#009e42]/20 cursor-pointer"
                        : "bg-slate-200 dark:bg-white/5 text-slate-400 dark:text-gray-500 border border-slate-300 dark:border-white/5 cursor-not-allowed"
                    )}
                  >
                    Confirm
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <PinProtocolModal 
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSuccess={handleWithdrawSubmit}
      />

      <BankSelectorModal 
        isOpen={showBankSelector}
        onClose={() => setShowBankSelector(false)}
        onSelect={(bank) => setBankName(bank)}
        selectedBank={bankName}
      />

      {/* PREMIUM FLOATING BOTTOM NAVIGATION FOR MOBILE ONLY */}
      <div className="lg:hidden fixed bottom-5 left-1/2 -translate-x-1/2 w-[94%] max-w-md z-[110] bg-[#07090e]/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-1.5 xs:p-2 shadow-[0_20px_50px_rgba(0,0,0,0.85),_inset_0_1px_0_rgba(255,255,255,0.05)] flex items-center justify-between gap-0.5 select-none pointer-events-auto">
        {/* 1. Daily Points */}
        <button 
          onClick={() => navigate('/daily-points')}
          className="flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all relative overflow-hidden active:scale-95 group"
        >
          <div className="h-9 w-9 flex items-center justify-center scale-50 group-hover:scale-55 transition-transform duration-300 select-none pointer-events-none">
            <Icon3DDailyPoints />
          </div>
          <span className="text-[7.5px] xs:text-[9.5px] md:text-sm font-black text-white/50 group-hover:text-amber-400 mt-0.5 tracking-tight truncate w-full px-0.5 text-center">Daily Points</span>
        </button>

        {/* 2. Refer Friends */}
        <button 
          onClick={() => {
            setRewardView('refer');
          }}
          className={cn(
            "flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all relative overflow-hidden active:scale-95 group",
            rewardView === 'refer' ? "bg-white/5" : ""
          )}
        >
          <div className={cn(
            "h-9 w-9 flex items-center justify-center scale-50 transition-transform duration-300 select-none pointer-events-none",
            rewardView === 'refer' ? "scale-55" : "group-hover:scale-55"
          )}>
            <Icon3DReferFriends />
          </div>
          <span className={cn(
            "text-[7.5px] xs:text-[9.5px] md:text-sm font-black mt-0.5 tracking-tight truncate w-full px-0.5 text-center",
            rewardView === 'refer' ? "text-purple-400" : "text-white/50 group-hover:text-purple-400"
          )}>Refer Friends</span>
        </button>

        {/* 3. Node Rewards */}
        <button 
          onClick={() => {
            setRewardView('nodes');
          }}
          className={cn(
            "flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all relative overflow-hidden active:scale-95 group",
            rewardView === 'nodes' ? "bg-white/5" : ""
          )}
        >
          <div className={cn(
            "h-9 w-9 flex items-center justify-center scale-50 transition-transform duration-300 select-none pointer-events-none",
            rewardView === 'nodes' ? "scale-55" : "group-hover:scale-55"
          )}>
            <Icon3DNodeRewards />
          </div>
          <span className={cn(
            "text-[7.5px] xs:text-[9.5px] md:text-sm font-black mt-0.5 tracking-tight truncate w-full px-0.5 text-center",
            rewardView === 'nodes' ? "text-yellow-400" : "text-white/50 group-hover:text-yellow-400"
          )}>Node Rewards</span>
        </button>

        {/* 4. Ranking */}
        <button 
          onClick={() => {
            setRewardView('ranking');
          }}
          className={cn(
            "flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all relative overflow-hidden active:scale-95 group",
            rewardView === 'ranking' ? "bg-white/5" : ""
          )}
        >
          <div className={cn(
            "h-9 w-9 flex items-center justify-center scale-50 transition-transform duration-300 select-none pointer-events-none",
            rewardView === 'ranking' ? "scale-55" : "group-hover:scale-55"
          )}>
            <Icon3DRanking />
          </div>
          <span className={cn(
            "text-[7.5px] xs:text-[9.5px] md:text-sm font-black mt-0.5 tracking-tight truncate w-full px-0.5 text-center",
            rewardView === 'ranking' ? "text-cyan-400" : "text-white/50 group-hover:text-cyan-400"
          )}>Ranking</span>
        </button>

        {/* 5. Independent Exit (X) */}
        <button 
          onClick={() => {
            if (window.history.state && window.history.state.idx > 0) {
              navigate(-1);
            } else {
              navigate('/home');
            }
          }}
          className="w-8 h-8 xs:w-9 xs:h-9 flex items-center justify-center rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 active:scale-90 transition-all text-gray-400 hover:text-white shrink-0 ml-1 xs:ml-2"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
