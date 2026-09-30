import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  CreditCard, 
  Zap, 
  History, 
  BarChart3, 
  Search, 
  Filter, 
  ArrowUpRight, 
  ShieldCheck, 
  CheckCircle, 
  XCircle,
  Activity,
  LogOut,
  ChevronRight,
  TrendingUp,
  Wallet,
  Coins,
  Building2,
  ArrowDownLeft,
  Settings,
  Sliders,
  Lock,
  Shield,
  Ban,
  MessageSquare,
  UserPlus,
  UserMinus,
  RefreshCw,
  Play,
  Pause,
  DollarSign,
  AlertTriangle,
  Mail,
  MapPin,
  Clock,
  IdCard,
  UserCircle,
  ArrowLeft,
  Copy,
  X,
  Menu,
  Bell,
  Megaphone,
  Image as ImageIcon,
  Eye,
  Trash2,
  Plus,
  Cpu,
  Bot,
  Landmark
} from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';
import { toast } from 'sonner';
import { 
  collection, 
  query, 
  getDocs, 
  doc, 
  updateDoc, 
  setDoc,
  addDoc,
  increment,
  getDoc,
  runTransaction,
  where,
  orderBy,
  onSnapshot,
  limit
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth, getRoiByAmountDynamic, calculateExpectedDailyRoi, isLegacyUser, getEffectiveRoiRate } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { logAudit } from '../../lib/auth_security';
import CipherRetirementAdmin from './CipherRetirementAdmin';
import CipherLoansAdmin from './CipherLoansAdmin';
import CipherSecuritiesReports from './CipherSecuritiesReports';

// --- COMPONENTS ---

const AdminNotificationItem = ({ email, username, date, type }: { email: string, username?: string, date: string, type: 'user' | 'newsletter', key?: any }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] rounded-2xl transition-all">
      <div className="flex items-start sm:items-center gap-3">
        <div className={`p-2.5 rounded-xl ${type === 'user' ? 'bg-[#9333ea]/20 text-[#a855f7]' : 'bg-[#10b981]/20 text-[#34d399]'} shrink-0`}>
          {type === 'user' ? <Users size={16} /> : <Mail size={16} />}
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#ffffff60]">
              {type === 'user' ? 'New User Registered' : 'New Newsletter Subscription'}
            </span>
            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${type === 'user' ? 'bg-[#9333ea]/20 text-[#a855f7]' : 'bg-[#10b981]/20 text-[#34d399]'}`}>
              Alert
            </span>
          </div>
          <p className="text-sm font-bold text-white tracking-tight mt-1">
            {email} {username ? <span className="text-[#ffffff40] text-xs font-normal">(@{username})</span> : ''}
          </p>
        </div>
      </div>
      <div className="text-left sm:text-right">
        <p className="text-[9px] font-black text-aura-muted uppercase tracking-widest">Received</p>
        <p className="text-xs text-[#ffffff70] font-mono mt-0.5">{date}</p>
      </div>
    </div>
  );
};

interface GlobalRoiControlsProps {
  roiConfig: any;
  onSave: (botKey: string, percentage: number) => Promise<void>;
}

function GlobalRoiControls({ roiConfig, onSave }: GlobalRoiControlsProps) {
  const bots = [
    { name: 'Free AI Bot', key: 'free_bot', defaultVal: 0.005 },
    { name: 'AI Bot 1.8', key: 'ai_1_8', defaultVal: 0.005 },
    { name: 'AI Bot 2.0', key: 'ai_2_0', defaultVal: 0.01 },
    { name: 'AI Bot 2.5', key: 'ai_2_5', defaultVal: 0.015 },
    { name: 'AI Bot 3.0', key: 'ai_3_0', defaultVal: 0.025 }
  ];

  return (
    <div className="p-6 bg-white/5 border border-white/5 rounded-[40px] space-y-6 relative overflow-hidden backdrop-blur-xl">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full pointer-events-none" />
      <div>
        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white flex items-center gap-2">
          <Cpu size={16} className="text-aura-lime animate-pulse" /> Global AI ROI Controls
        </h3>
        <p className="text-[10px] text-aura-muted uppercase tracking-widest mt-1">
          Adjust the daily ROI rates for all active users running each specific bot
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        {bots.map((bot) => {
          const currentValDecimal = roiConfig?.[bot.key] !== undefined ? roiConfig[bot.key] : bot.defaultVal;
          // Percentage is decimal * 100
          const currentPercentage = currentValDecimal * 100;

          return (
            <SingleBotControl 
              key={bot.key}
              name={bot.name}
              botKey={bot.key}
              currentPercentage={currentPercentage}
              onSave={onSave}
            />
          );
        })}
      </div>
    </div>
  );
}

function SingleBotControl({ name, botKey, currentPercentage, onSave }: { name: string, botKey: string, currentPercentage: number, onSave: (botKey: string, percentage: number) => Promise<void>, key?: any }) {
  const [val, setVal] = useState<string>(currentPercentage.toFixed(2));
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setVal(currentPercentage.toFixed(2));
  }, [currentPercentage]);

  const numericVal = parseFloat(val) || 0;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sliderVal = parseFloat(e.target.value);
    setVal(sliderVal.toFixed(2));
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value;
    raw = raw.replace(/[^0-9.]/g, '');
    setVal(raw);
  };

  const handleBlur = () => {
    let parsed = parseFloat(val);
    if (isNaN(parsed)) parsed = 0;
    parsed = Math.max(0, Math.min(2.5, parsed));
    setVal(parsed.toFixed(2));
  };

  const handleSaveClick = async () => {
    let parsed = parseFloat(val);
    if (isNaN(parsed)) parsed = 0;
    parsed = Math.max(0, Math.min(2.5, parsed));
    setIsSaving(true);
    try {
      await onSave(botKey, parsed);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-5 bg-white/[0.02] border border-white/5 rounded-3xl flex flex-col justify-between space-y-4 relative overflow-hidden group">
      <div className="space-y-1">
        <h4 className="text-xs font-black uppercase text-white tracking-wider">{name}</h4>
        <div className="flex justify-between items-center text-[10px] text-aura-muted">
          <span>Current ROI</span>
          <span className="font-mono text-white font-black bg-white/5 px-2 py-0.5 rounded text-xs">{currentPercentage.toFixed(2)}%</span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <input 
            type="range"
            min="0.00"
            max="2.50"
            step="0.01"
            value={numericVal}
            onChange={handleSliderChange}
            className="w-full accent-aura-lime bg-white/10 h-1 rounded-lg cursor-pointer"
          />
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <input 
              type="text"
              value={val}
              onChange={handleTextChange}
              onBlur={handleBlur}
              className="w-full bg-white/[0.02] border border-white/10 rounded-xl py-2 px-3 text-xs font-black transition-all outline-none text-white focus:border-aura-lime/50 text-right pr-6"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-aura-muted">%</span>
          </div>
          <button
            onClick={handleSaveClick}
            disabled={isSaving}
            className="px-3 py-2 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-wider text-[9px] rounded-xl disabled:opacity-30 transition-all flex items-center justify-center min-w-[50px] cursor-pointer"
          >
            {isSaving ? (
              <RefreshCw size={12} className="animate-spin" />
            ) : (
              'Save'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

interface IndividualRoiOverrideProps {
  userValue: any;
  onSaveOverride: (userId: string, enabled: boolean, percentage: number) => Promise<void>;
}

function IndividualRoiOverride({ userValue, onSaveOverride }: IndividualRoiOverrideProps) {
  const isEnabled = userValue.roi_override_enabled === true;
  const currentOverrideDecimal = typeof userValue.roi_override === 'number' ? userValue.roi_override : 0.005;
  const currentPercentage = currentOverrideDecimal * 100;

  const [enabled, setEnabled] = useState(isEnabled);
  const [val, setVal] = useState<string>(currentPercentage.toFixed(2));
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setEnabled(userValue.roi_override_enabled === true);
    const ovDecimal = typeof userValue.roi_override === 'number' ? userValue.roi_override : 0.005;
    setVal((ovDecimal * 100).toFixed(2));
  }, [userValue.roi_override_enabled, userValue.roi_override]);

  const numericVal = parseFloat(val) || 0;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sliderVal = parseFloat(e.target.value);
    setVal(sliderVal.toFixed(2));
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value;
    raw = raw.replace(/[^0-9.]/g, '');
    setVal(raw);
  };

  const handleBlur = () => {
    let parsed = parseFloat(val);
    if (isNaN(parsed)) parsed = 0;
    parsed = Math.max(0, Math.min(2.5, parsed));
    setVal(parsed.toFixed(2));
  };

  const handleSaveClick = async () => {
    let parsed = parseFloat(val);
    if (isNaN(parsed)) parsed = 0;
    parsed = Math.max(0, Math.min(2.5, parsed));
    setIsSaving(true);
    try {
      await onSaveOverride(userValue.id, enabled, parsed);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 bg-white/5 border border-white/5 rounded-3xl space-y-4 relative overflow-hidden backdrop-blur-xl">
      <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-2xl rounded-full pointer-events-none" />
      <div>
        <h4 className="text-[10px] font-black uppercase tracking-widest text-white flex items-center gap-2">
          <Zap size={12} className="text-blue-400" /> Individual ROI Override
        </h4>
        <p className="text-[8px] text-aura-muted uppercase tracking-widest mt-1">
          Override the global bot ROI for this specific user only
        </p>
      </div>

      <div className="space-y-4 pt-2">
        <div className="flex justify-between items-center bg-white/[0.01] border border-white/5 p-3 rounded-xl">
          <span className="text-[10px] font-bold text-white/80 uppercase">Enable Override</span>
          <button
            type="button"
            onClick={() => setEnabled(!enabled)}
            className={cn(
              "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
              enabled ? "bg-blue-500" : "bg-white/10"
            )}
          >
            <span
              className={cn(
                "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                enabled ? "translate-x-5" : "translate-x-0"
              )}
            />
          </button>
        </div>

        {enabled && (
          <div className="space-y-3">
            <div className="flex justify-between items-center text-[10px] text-aura-muted">
              <span>Override ROI Value</span>
              <span className="font-mono text-white font-black bg-white/5 px-2 py-0.5 rounded text-xs">
                {numericVal.toFixed(2)}%
              </span>
            </div>

            <input 
              type="range"
              min="0.00"
              max="2.50"
              step="0.01"
              value={numericVal}
              onChange={handleSliderChange}
              className="w-full accent-blue-500 bg-white/10 h-1 rounded-lg cursor-pointer"
            />

            <div className="relative">
              <input 
                type="text"
                value={val}
                onChange={handleTextChange}
                onBlur={handleBlur}
                className="w-full bg-white/[0.02] border border-white/10 rounded-xl py-3 px-3 text-xs font-black transition-all outline-none text-white focus:border-blue-500/50 text-right pr-8"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-aura-muted">%</span>
            </div>
          </div>
        )}

        <button
          onClick={handleSaveClick}
          disabled={isSaving}
          className="w-full py-3 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-[9px] rounded-xl disabled:opacity-30 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-primary/10"
        >
          {isSaving ? (
            <>
              <RefreshCw size={12} className="animate-spin" />
              <span>Saving Override...</span>
            </>
          ) : (
            <span>Save Override</span>
          )}
        </button>
      </div>
    </div>
  );
}

interface AdminROIEngineCardProps {
  userValue: any;
  userInvestments: any[];
  plans: any[];
  onSaveOverride: (userId: string, enabled: boolean, percentage: number) => Promise<void>;
  globalRoiConfig?: any;
  key?: any;
}

function AdminROIEngineCard({ userValue, userInvestments, plans, onSaveOverride, globalRoiConfig }: AdminROIEngineCardProps) {
  const activeCount = userInvestments.length;
  const lastValidRoiRef = React.useRef<number>(0);

  const yieldSum = useMemo(() => {
    const rawRoi = calculateExpectedDailyRoi(
      userInvestments,
      userValue?.withdraw_methods?.compounded_amounts || userValue?.compounded_amounts,
      plans || [],
      userValue,
      globalRoiConfig
    );
    if (rawRoi > 0) {
      lastValidRoiRef.current = rawRoi;
      return rawRoi;
    }
    if (activeCount === 0) {
      return 0;
    }
    return lastValidRoiRef.current || 0;
  }, [userInvestments, userValue?.withdraw_methods?.compounded_amounts, userValue?.compounded_amounts, plans, activeCount, userValue, globalRoiConfig]);

  const [progress, setProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState("24:00:00");
  const [liveEarnings, setLiveEarnings] = useState(0);

  // Individual override state
  const isOverrideEnabled = userValue?.roi_override_enabled === true;
  const [useGlobal, setUseGlobal] = useState(!isOverrideEnabled);
  const initialOverrideVal = typeof userValue?.roi_override === 'number' ? userValue.roi_override * 100 : 0.50;
  const [overridePct, setOverridePct] = useState<string>(initialOverrideVal.toFixed(2));
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const isOverride = userValue?.roi_override_enabled === true;
    setUseGlobal(!isOverride);
    const valDecimal = typeof userValue?.roi_override === 'number' ? userValue.roi_override : 0.005;
    setOverridePct((valDecimal * 100).toFixed(2));
  }, [userValue?.roi_override_enabled, userValue?.roi_override]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sliderVal = parseFloat(e.target.value);
    setOverridePct(sliderVal.toFixed(2));
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value;
    raw = raw.replace(/[^0-9.]/g, '');
    setOverridePct(raw);
  };

  const handleBlur = () => {
    let parsed = parseFloat(overridePct);
    if (isNaN(parsed)) parsed = 0;
    parsed = Math.max(0, Math.min(2.5, parsed));
    setOverridePct(parsed.toFixed(2));
  };

  const handleSaveClick = async () => {
    let parsed = parseFloat(overridePct);
    if (isNaN(parsed)) parsed = 0;
    parsed = Math.max(0, Math.min(2.5, parsed));
    setIsSaving(true);
    try {
      await onSaveOverride(userValue.id, !useGlobal, parsed);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (activeCount === 0) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      let hours = 24;
      if (userInvestments && userInvestments.length > 0) {
        const firstActive = userInvestments[0];
        const matchingPlan = (plans || []).find((p: any) => 
          p.id === firstActive.plan_id ||
          (p.id || '').toLowerCase() === (firstActive.plan_name || '').toLowerCase() ||
          (p.name || '').toLowerCase() === (firstActive.plan_name || '').toLowerCase() ||
          (firstActive.amount >= p.min && firstActive.amount <= p.max)
        );
        if (matchingPlan && matchingPlan.cycle_duration_hours !== undefined) {
          hours = matchingPlan.cycle_duration_hours;
        }
      }
      const totalDuration = hours * 60 * 60 * 1000;
      const cycleStart = new Date(userValue.roi_cycle_start || userValue.created_at || now).getTime();
      const elapsed = now - cycleStart;
      
      const currentCycleElapsed = elapsed % totalDuration;
      const currentProgress = (currentCycleElapsed / totalDuration) * 100;
      
      setProgress(currentProgress);
      setLiveEarnings(yieldSum * (currentProgress / 100));

      const diff = Math.max(0, totalDuration - currentCycleElapsed);
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [userValue.roi_cycle_start, userValue.created_at, activeCount, yieldSum, plans, userInvestments]);

  // Modal control state
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (activeCount === 0) return null;

  return (
    <>
      {/* Compact Collapsible Card */}
      <div className="p-5 bg-white/[0.02] border border-white/5 rounded-3xl space-y-4 hover:border-aura-lime/20 hover:bg-white/[0.03] transition-all relative overflow-hidden flex flex-col justify-between">
        <div className="absolute top-0 right-0 w-24 h-24 bg-aura-lime/5 blur-2xl rounded-full pointer-events-none" />

        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-aura-lime flex items-center justify-center text-black shrink-0 shadow-[0_0_15px_rgba(168,251,60,0.2)]">
                <Zap size={14} className="animate-pulse" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-black uppercase text-white truncate max-w-[150px]">{userValue.name}</h4>
                <span className="text-[8px] text-aura-lime font-black uppercase tracking-wider block">
                  {activeCount} active node{activeCount > 1 ? 's' : ''} • {userValue.email}
                </span>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-[8px] text-aura-muted font-bold uppercase tracking-widest">Time Remaining</p>
              <p className="text-xs font-black font-mono text-white mt-0.5">{timeLeft}</p>
            </div>
          </div>

          <div className="flex items-center justify-between text-[9px] font-bold text-white bg-white/[0.01] px-3 py-1.5 rounded-xl border border-white/5">
            <div className="flex items-center gap-1">
              <span className="text-aura-muted uppercase text-[8px] font-black">Bot:</span>
              <span className="text-white uppercase font-black">
                {(() => {
                  const activeBot = userValue?.active_robot || "Free AI Bot";
                  return activeBot.startsWith('AI ') ? `AI Bot ${activeBot.slice(3)}` : activeBot;
                })()}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-aura-muted uppercase text-[8px] font-black">Est:</span>
              <span className="text-emerald-400 font-black">{formatCurrency(yieldSum)} / Day</span>
            </div>
          </div>

          <div className="space-y-1.5 bg-white/[0.01] p-3 rounded-xl border border-white/5">
            <div className="flex justify-between items-center text-[9px] font-bold text-white">
              <span className="text-emerald-400 font-black">{formatCurrency(liveEarnings)} / {formatCurrency(yieldSum)} Day</span>
              <span className="font-mono text-aura-muted">({progress.toFixed(1)}%)</span>
            </div>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
              <div 
                style={{ width: `${progress}%` }}
                className="h-full bg-gradient-to-r from-emerald-400 to-green-500 rounded-full"
              />
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(true)}
          className="w-full py-2 bg-white/5 hover:bg-aura-lime hover:text-aura-black border border-white/10 hover:border-aura-lime text-[9px] font-black uppercase tracking-widest text-white transition-all duration-300 rounded-2xl shadow-lg flex items-center justify-center gap-1.5"
        >
          <Sliders size={12} />
          <span>View Details & Override</span>
        </button>
      </div>

      {/* Premium Modal Popup */}
      <AnimatePresence>
        {isOpen && (
          <div 
            className="fixed inset-0 bg-[#020202]/90 backdrop-blur-md z-[9999] flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setIsOpen(false)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-[#0c0c0e] border border-white/10 rounded-[40px] w-full max-w-2xl p-6 sm:p-8 space-y-6 relative my-8 overflow-hidden text-left shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button 
                onClick={() => setIsOpen(false)}
                className="absolute top-6 right-6 p-2 text-aura-muted hover:text-white hover:bg-white/5 rounded-full transition-all border border-white/5"
              >
                <X size={20} />
              </button>

              {/* Header */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-aura-lime/10 text-aura-lime rounded-full border border-aura-lime/20">
                    Individual ROI Override Protocol
                  </span>
                  <span className="text-[10px] font-mono text-aura-muted">
                    ID: {userValue.id?.substring(0, 16)}...
                  </span>
                </div>
                <h3 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                  <Sliders className="text-aura-lime" size={20} />
                  <span>{userValue.name}</span>
                </h3>
                <p className="text-xs text-aura-muted uppercase tracking-wider font-bold">
                  Active node management for {userValue.email}
                </p>
              </div>

              {/* Node Status Summary */}
              <div className="p-5 bg-white/[0.02] border border-white/5 rounded-3xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[8px] text-aura-lime font-black uppercase tracking-wider block">
                      Node Network Lifecycle
                    </span>
                    <span className="text-xs font-black text-white uppercase mt-1 block">
                      {activeCount} active node{activeCount > 1 ? 's' : ''} configured
                    </span>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-[8px] text-aura-muted font-bold uppercase tracking-widest">Time Remaining</p>
                    <p className="text-xs font-black font-mono text-white mt-0.5">{timeLeft}</p>
                  </div>
                </div>

                <div className="space-y-2 bg-white/[0.01] p-3 rounded-xl border border-white/5">
                  <div className="flex justify-between items-center text-[9px] font-bold text-white">
                    <span className="text-emerald-400 font-black">{formatCurrency(liveEarnings)} / {formatCurrency(yieldSum)} Day</span>
                    <span className="font-mono text-aura-muted">({progress.toFixed(1)}%)</span>
                  </div>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      style={{ width: `${progress}%` }}
                      className="h-full bg-gradient-to-r from-emerald-400 to-green-500 rounded-full"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {userInvestments.map(inv => (
                    <div key={inv.id} className="text-[8px] font-bold uppercase px-2.5 py-1 bg-white/5 text-gray-300 border border-white/5 rounded-lg">
                      {inv.plan_name}: <span className="text-white font-black">{formatCurrency(inv.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Individual ROI Override Panel */}
              <div className="pt-4 border-t border-white/5 space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-aura-muted">
                  <Sliders size={12} className="text-aura-lime" />
                  <span>Individual ROI Settings</span>
                </div>

                <div className="grid grid-cols-2 gap-3 bg-white/[0.01] p-3 rounded-2xl border border-white/5">
                  <div>
                    <span className="text-[8px] text-aura-muted font-bold uppercase tracking-wider block">Current Effective ROI</span>
                    <span className="text-sm font-black text-aura-lime mt-1 block">
                      {(getEffectiveRoiRate(userValue, userInvestments[0]?.amount || 0, plans, globalRoiConfig) * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-[8px] text-aura-muted font-bold uppercase tracking-wider block">Active AI Bot</span>
                    <span className="text-sm font-black text-white mt-1 block">
                      {(() => {
                        const activeBot = userValue?.active_robot || "Free AI Bot";
                        return activeBot.startsWith('AI ') ? `AI Bot ${activeBot.slice(3)}` : activeBot;
                      })()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-white/[0.01] p-4 rounded-2xl border border-white/5">
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-white font-black uppercase tracking-wider block">Use Global ROI</span>
                    <span className="text-[8px] text-aura-muted font-semibold block">
                      {useGlobal ? "Using Global AI Bot ROI" : "Using Custom Individual ROI"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUseGlobal(!useGlobal)}
                    className={cn(
                      "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                      useGlobal ? "bg-aura-lime" : "bg-white/10"
                    )}
                  >
                    <span
                      className={cn(
                        "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                        useGlobal ? "translate-x-5" : "translate-x-0"
                      )}
                    />
                  </button>
                </div>

                {/* Override controls */}
                <div className={cn("space-y-3 transition-all duration-300", useGlobal ? "opacity-40 pointer-events-none" : "opacity-100")}>
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] text-white font-black uppercase tracking-wider">Override ROI (%)</span>
                    <div className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-lg border border-white/5 w-20">
                      <input
                        type="text"
                        disabled={useGlobal}
                        value={overridePct}
                        onChange={handleTextChange}
                        onBlur={handleBlur}
                        className="w-full bg-transparent text-right font-mono text-xs font-black text-white focus:outline-none"
                      />
                      <span className="text-[10px] text-aura-muted font-bold">%</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <input
                      type="range"
                      min="0.00"
                      max="2.50"
                      step="0.01"
                      disabled={useGlobal}
                      value={useGlobal ? "0.00" : overridePct}
                      onChange={handleSliderChange}
                      className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-aura-lime focus:outline-none"
                    />
                    <div className="flex justify-between text-[8px] font-bold text-aura-muted uppercase tracking-wider">
                      <span>0.00%</span>
                      <span>1.25%</span>
                      <span>2.50%</span>
                    </div>
                  </div>
                </div>

                {/* Save changes button */}
                <button
                  onClick={handleSaveClick}
                  disabled={isSaving}
                  className={cn(
                    "w-full py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 border",
                    isSaving
                      ? "bg-white/5 border-white/5 text-aura-muted cursor-not-allowed"
                      : "bg-white/5 hover:bg-aura-lime hover:text-aura-black hover:border-aura-lime border-white/10 text-white shadow-lg"
                  )}
                >
                  {isSaving ? (
                    <>
                      <div className="w-3 h-3 border-2 border-aura-lime border-t-transparent rounded-full animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

function SidebarItem({ icon, label, active, onClick, badge }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void, badge?: number }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center justify-between w-full p-4 rounded-xl transition-all duration-300",
        active 
          ? "bg-aura-lime text-aura-black brutalist-shadow font-black" 
          : "text-aura-muted hover:text-white hover:bg-white/5 font-bold"
      )}
    >
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-[10px] uppercase tracking-widest">{label}</span>
      </div>
      {badge && badge > 0 ? (
        <span className={cn(
          "w-5 h-5 flex items-center justify-center text-[9px] font-black rounded-full shadow-inner",
          active ? "bg-black text-aura-lime font-black" : "bg-red-500 text-white animate-pulse"
        )}>
          {badge}
        </span>
      ) : null}
    </button>
  );
}

function StatCard({ label, value, icon: Icon, color, onClick }: { label: string, value: string, icon: any, color: string, onClick?: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "p-5 sm:p-6 bg-white/[0.02] border border-white/5 rounded-[24px] hover:border-white/10 transition-all flex flex-col justify-between min-w-0 w-full",
        onClick ? "cursor-pointer hover:bg-white/[0.04] hover:scale-[1.01]" : ""
      )}
    >
      <div>
        <div className="flex justify-between items-center mb-4">
          <Icon size={20} className={color} />
          <p className="text-[8px] font-black uppercase tracking-widest text-aura-muted bg-white/5 px-2 py-1 rounded-md">Live Sync</p>
        </div>
        <p className="text-lg sm:text-xl lg:text-2xl font-black font-serif italic tracking-tight text-white truncate" title={value}>
          {value}
        </p>
      </div>
      <p className="text-[9px] sm:text-[10px] font-bold text-aura-muted uppercase tracking-wider mt-2 truncate">{label}</p>
    </div>
  );
}

export default function CipherAdmin() {
  const { user, profile, logout, plans } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'canalytics' | 'cdeposits' | 'cwithdrawals' | 'cinvestments' | 'cuser' | 'cinactiveusers' | 'ckycs' | 'csecurity' | 'cplans' | 'cui_editor' | 'cnewsletter' | 'cnotifications' | 'ctransactions' | 'csettings' | 'cadverts' | 'ctwn_token' | 'csupport_tickets' | 'cmining' | 'caimarketplace'>('canalytics');
  const [isMobileAdminMenuOpen, setIsMobileAdminMenuOpen] = useState(false);
  const [initialUsersCount, setInitialUsersCount] = useState<number | null>(null);
  const [initialSubscribersCount, setInitialSubscribersCount] = useState<number | null>(null);
  const [investFilter, setInvestFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [depositFilter, setDepositFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [miningFilter, setMiningFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [aiMarketplaceFilter, setAiMarketplaceFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [withdrawalFilter, setWithdrawalFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [selectedSupportTicket, setSelectedSupportTicket] = useState<any>(null);
  const [ticketType, setTicketType] = useState<'deposit' | 'withdrawal' | 'investment' | 'mining_upgrade' | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userDevices, setUserDevices] = useState<any[]>([]);
  const [securityLogs, setSecurityLogs] = useState<any[]>([]);

  const [isDetailView, setIsDetailView] = useState(false);
  const [expandedActivityUserId, setExpandedActivityUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [userFilter, setUserFilter] = useState<'all' | 'active' | 'suspended' | 'banned' | 'inactive'>('all');
  
  const [usersSubTab, setUsersSubTab] = useState<'new_registrations' | 'users_dashboard' | 'activities_engine' | 'roi_engine'>('new_registrations');
  const [selectedRegUser, setSelectedRegUser] = useState<any>(null);
  const [focusedActivityUserId, setFocusedActivityUserId] = useState<string | null>(null);

  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(false);
  const [maintenanceTitle, setMaintenanceTitle] = useState<string>("System Upgrading");
  const [maintenanceMessage, setMaintenanceMessage] = useState<string>("We are updating our nodes. Normal services will resume shortly.");
  const [maintenanceEta, setMaintenanceEta] = useState<string>("");
  const [withdrawalSystemBusy, setWithdrawalSystemBusy] = useState<boolean>(false);
  const [enableWalletUpgradePayment, setEnableWalletUpgradePayment] = useState<boolean>(true);
  
  // UI History System
  const [uiVersions, setUiVersions] = useState<any[]>([]);
  const [uiConfig, setUiConfig] = useState<any>({});
  const [roiConfig, setRoiConfig] = useState<any>(null);
  const [selectedVersion, setSelectedVersion] = useState<any>(null);

  // Adverts System State
  const [adverts, setAdverts] = useState<any[]>([]);
  const [isAdvertsLoading, setIsAdvertsLoading] = useState(true);

  // Advert Creation / Editing Form States
  const [editingAdvertId, setEditingAdvertId] = useState<string | null>(null);
  const [advImageUrl, setAdvImageUrl] = useState("");
  const [advTitle, setAdvTitle] = useState("");
  const [advMessage, setAdvMessage] = useState("");
  const [advCtaText, setAdvCtaText] = useState("");
  const [advRedirectLink, setAdvRedirectLink] = useState("");
  const [advStyleTemplate, setAdvStyleTemplate] = useState("glass");
  const [advPopupType, setAdvPopupType] = useState("center");
  const [advSize, setAdvSize] = useState("medium");
  const [advWidth, setAdvWidth] = useState("");
  const [advHeight, setAdvHeight] = useState("");
  const [advPosition, setAdvPosition] = useState("center");
  const [advSchedulingType, setAdvSchedulingType] = useState("every-refresh");
  const [advIntervalMinutes, setAdvIntervalMinutes] = useState(30);
  const [advStartDate, setAdvStartDate] = useState("");
  const [advEndDate, setAdvEndDate] = useState("");
  const [advPageTargetingType, setAdvPageTargetingType] = useState("all");
  const [advCustomPath, setAdvCustomPath] = useState("");
  const [advIsActive, setAdvIsActive] = useState(true);

  // Admin Security Logic
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const resetTimeout = () => {
      clearTimeout(timeout);
      // Admin session expires after 24 hours of inactivity
      timeout = setTimeout(() => {
        toast.error("Admin Security Session Expired. Re-authentication Required.");
        logout().then(() => navigate('/welcome'));
      }, 24 * 60 * 60 * 1000); 
    };

    window.addEventListener('mousemove', resetTimeout);
    window.addEventListener('keydown', resetTimeout);
    
    resetTimeout();
    
    return () => {
      window.removeEventListener('mousemove', resetTimeout);
      window.removeEventListener('keydown', resetTimeout);
      clearTimeout(timeout);
    };
  }, [logout, navigate]);

  const [users, setUsers] = useState<any[]>([]);
  const liveUser = useMemo(() => {
    if (!selectedUser) return null;
    return users.find((u: any) => u.id === selectedUser.id) || selectedUser;
  }, [selectedUser, users]);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [miningUpgrades, setMiningUpgrades] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [investments, setInvestments] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [aiUpgrades, setAiUpgrades] = useState<any[]>([]);
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [exchangeRate, setExchangeRate] = useState<number>(1400);
  const [withdrawExchangeRate, setWithdrawExchangeRate] = useState<number>(1400);

  const [seenSupportTicketIds, setSeenSupportTicketIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('seen_support_ticket_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const pendingSupportTicketsCount = useMemo(() => {
    return supportTickets.filter((st: any) => 
      st.status === 'open' && 
      !seenSupportTicketIds.includes(st.id)
    ).length;
  }, [supportTickets, seenSupportTicketIds]);

  // Broadcaster and monitor session states
  const [seenDepositIds, setSeenDepositIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('seen_deposit_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [seenWithdrawalIds, setSeenWithdrawalIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('seen_withdrawal_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [seenInvestmentIds, setSeenInvestmentIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('seen_investment_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [seenTwnIds, setSeenTwnIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('seen_twn_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [twnFilter, setTwnFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [twnSubTab, setTwnSubTab] = useState<'all' | 'pending' | 'completed' | 'rejected'>('all');

  const [investmentPreviewType, setInvestmentPreviewType] = useState<'active' | 'inactive' | null>(null);

  // Broadcast Notification Form and Targeting Panel States
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifTarget, setNotifTarget] = useState<'all' | 'selected' | 'active_users' | 'inactive_users'>('all');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [notifSearchTerm, setNotifSearchTerm] = useState('');
  const [notifUserFilter, setNotifUserFilter] = useState<'all' | 'active_users' | 'inactive_users'>('all');
  const [isSendingNotif, setIsSendingNotif] = useState(false);

  const recentUserNotifications = useMemo(() => {
    return [...users]
      .filter(u => u.created_at || u.joined_at)
      .sort((a, b) => {
        const dateA = new Date(a.created_at || a.joined_at || 0).getTime();
        const dateB = new Date(b.created_at || b.joined_at || 0).getTime();
        return dateB - dateA;
      })
      .slice(0, 5)
      .map(u => ({
        id: u.id || u.uid,
        email: u.email || 'no-email@tavari.network',
        username: u.username || u.name?.toLowerCase().replace(/\s+/g, '_') || 'user',
        date: u.created_at ? new Date(u.created_at).toLocaleString() : 'Recent',
        type: 'user' as const
      }));
  }, [users]);

  const recentNewsletterNotifications = useMemo(() => {
    return [...subscribers]
      .filter(s => s.created_at)
      .sort((a, b) => {
        const dateA = new Date(a.created_at.seconds ? a.created_at.seconds * 1000 : a.created_at).getTime();
        const dateB = new Date(b.created_at.seconds ? b.created_at.seconds * 1000 : b.created_at).getTime();
        return dateB - dateA;
      })
      .slice(0, 5)
      .map(s => {
        const dateObj = s.created_at ? new Date(s.created_at.seconds ? s.created_at.seconds * 1000 : s.created_at) : new Date();
        return {
          id: s.id,
          email: s.email,
          date: dateObj.toLocaleString(),
          type: 'newsletter' as const
        };
      });
  }, [subscribers]);

  const effectiveFilter = activeTab === 'cinactiveusers' ? 'inactive' : userFilter;

  // 1. Newly Registered Users
  const newlyRegisteredUsers = useMemo(() => {
    return [...users]
      .filter(u => u.created_at || u.joined_at)
      .sort((a, b) => {
        const dateA = new Date(a.created_at || a.joined_at || 0).getTime();
        const dateB = new Date(b.created_at || b.joined_at || 0).getTime();
        return dateB - dateA;
      });
  }, [users]);

  // 2. Filtered Users for Dashboard
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = 
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.username && u.username.toLowerCase().includes(searchTerm.toLowerCase()));

      const hasActiveNode = investments.some(i => i.user_id === u.id && i.status === 'active');

      if (effectiveFilter === 'all') return matchesSearch;
      if (effectiveFilter === 'active') return matchesSearch && hasActiveNode;
      if (effectiveFilter === 'inactive') return matchesSearch && !hasActiveNode;
      if (effectiveFilter === 'suspended') return matchesSearch && u.suspended && !u.banned;
      if (effectiveFilter === 'banned') return matchesSearch && u.banned && !u.suspended;
      return matchesSearch;
    });
  }, [users, investments, effectiveFilter, searchTerm]);

  // 3. Active Users with Combined Activities
  const activeUsersWithActivities = useMemo(() => {
    return users.map(user => {
      const userTx = transactions
        .filter((tx: any) => tx.user_id === user.id || tx.sender_id === user.id || tx.receiver_id === user.id)
        .map((tx: any) => ({
          id: tx.id,
          action: tx.type || 'Transaction',
          description: tx.description || `${tx.type?.replace(/_/g, ' ')} completed`,
          amount: tx.amount || 0,
          timestamp: tx.created_at ? new Date(tx.created_at).getTime() : 0,
        }));

      const userLogs = securityLogs
        .filter((log: any) => log.user_id === user.id)
        .map((log: any) => ({
          id: log.id,
          action: log.action || 'System Action',
          description: log.details || log.action?.replace(/_/g, ' ') || 'Action recorded',
          amount: 0,
          timestamp: log.timestamp?.seconds ? log.timestamp.seconds * 1000 : log.timestamp ? new Date(log.timestamp).getTime() : 0,
        }));

      const combined = [...userTx, ...userLogs].sort((a, b) => b.timestamp - a.timestamp);
      const latestTime = combined.length > 0 ? combined[0].timestamp : 0;

      return {
        user,
        activities: combined,
        latestTime
      };
    })
    .filter(item => item.activities.length > 0)
    .sort((a, b) => b.latestTime - a.latestTime);
  }, [users, transactions, securityLogs]);

  useEffect(() => {
    if (users.length > 0) {
      if (initialUsersCount === null) {
        setInitialUsersCount(users.length);
      } else if (users.length > initialUsersCount) {
        const sorted = [...users].sort((a, b) => {
          const dateA = new Date(a.created_at || a.joined_at || 0).getTime();
          const dateB = new Date(b.created_at || b.joined_at || 0).getTime();
          return dateB - dateA;
        });
        const newest = sorted[0];
        if (newest) {
          toast.success(`System Alert: New User Registered - ${newest.email || newest.name}`, { duration: 8000 });
        }
        setInitialUsersCount(users.length);
      }
    }
  }, [users, initialUsersCount]);

  useEffect(() => {
    if (subscribers.length > 0) {
      if (initialSubscribersCount === null) {
        setInitialSubscribersCount(subscribers.length);
      } else if (subscribers.length > initialSubscribersCount) {
        const newest = subscribers[0];
        if (newest) {
          toast.message(`Marketing Alert: New Newsletter Subscription`, {
            description: newest.email,
            duration: 8000
          });
        }
        setInitialSubscribersCount(subscribers.length);
      }
    }
  }, [subscribers, initialSubscribersCount]);

  const pendingDepositsUnseenCount = useMemo(() => {
    return deposits.filter((dep: any) => !dep.is_mining_subscription && !dep.is_robot_upgrade && dep.status === 'pending' && !seenDepositIds.includes(dep.id)).length;
  }, [deposits, seenDepositIds]);

  const pendingRobotUpgradesCount = useMemo(() => {
    return aiUpgrades.filter((tx: any) => (tx.status || '').toLowerCase() === 'pending').length;
  }, [aiUpgrades]);

  const pendingMiningCount = useMemo(() => {
    return miningUpgrades.filter((upgrade: any) => upgrade.status === 'pending').length;
  }, [miningUpgrades]);

  const pendingWithdrawalsUnseenCount = useMemo(() => {
    return withdrawals.filter((wit: any) => wit.status === 'pending' && !seenWithdrawalIds.includes(wit.id)).length;
  }, [withdrawals, seenWithdrawalIds]);

  const pendingInvestmentsUnseenCount = useMemo(() => {
    return investments.filter((inv: any) => inv.status === 'pending' && !seenInvestmentIds.includes(inv.id)).length;
  }, [investments, seenInvestmentIds]);

  useEffect(() => {
    if (activeTab === 'cdeposits') {
      const pendingIds = deposits.filter((dep: any) => dep.status === 'pending').map((dep: any) => dep.id);
      if (pendingIds.some(id => !seenDepositIds.includes(id))) {
        const updated = Array.from(new Set([...seenDepositIds, ...pendingIds]));
        setSeenDepositIds(updated);
        localStorage.setItem('seen_deposit_ids', JSON.stringify(updated));
      }
    }
  }, [activeTab, deposits, seenDepositIds]);

  useEffect(() => {
    if (activeTab === 'cwithdrawals') {
      const pendingIds = withdrawals.filter((wit: any) => wit.status === 'pending').map((wit: any) => wit.id);
      if (pendingIds.some(id => !seenWithdrawalIds.includes(id))) {
        const updated = Array.from(new Set([...seenWithdrawalIds, ...pendingIds]));
        setSeenWithdrawalIds(updated);
        localStorage.setItem('seen_withdrawal_ids', JSON.stringify(updated));
      }
    }
  }, [activeTab, withdrawals, seenWithdrawalIds]);

  useEffect(() => {
    if (activeTab === 'cinvestments') {
      const pendingIds = investments.filter((inv: any) => inv.status === 'pending').map((inv: any) => inv.id);
      if (pendingIds.some(id => !seenInvestmentIds.includes(id))) {
        const updated = Array.from(new Set([...seenInvestmentIds, ...pendingIds]));
        setSeenInvestmentIds(updated);
        localStorage.setItem('seen_investment_ids', JSON.stringify(updated));
      }
    }
  }, [activeTab, investments, seenInvestmentIds]);

  const pendingTwnCount = useMemo(() => {
    return transactions.filter((tx: any) => 
      tx.is_twn_activity === true && 
      tx.status === 'pending' && 
      !seenTwnIds.includes(tx.id)
    ).length;
  }, [transactions, seenTwnIds]);

  useEffect(() => {
    if (activeTab === 'ctwn_token') {
      const pendingIds = transactions.filter((tx: any) => 
        tx.is_twn_activity === true && 
        tx.status === 'pending'
      ).map((tx: any) => tx.id);
      if (pendingIds.some(id => !seenTwnIds.includes(id))) {
        const updated = Array.from(new Set([...seenTwnIds, ...pendingIds]));
        setSeenTwnIds(updated);
        localStorage.setItem('seen_twn_ids', JSON.stringify(updated));
      }
    }
  }, [activeTab, transactions, seenTwnIds]);

  const getUserDetails = (userId: string, defaultName?: string) => {
    const matchedUser = users.find(u => u?.id === userId);
    return {
      id: userId || 'N/A',
      name: matchedUser?.name || defaultName || 'Anonymous',
      email: matchedUser?.email || 'N/A',
    };
  };

  const stats = useMemo(() => {
    const totalUsers = users.length;
    
    // Total Deposit represents only unused deposited funds (funding_balance) across all users
    const totalDeposits = users.reduce((acc, curr) => acc + (curr.funding_balance || 0), 0);
      
    // Approved withdrawals sum
    const totalWithdrawals = withdrawals
      .filter((w: any) => w.status === 'approved')
      .reduce((acc, curr) => acc + (curr.amount || 0), 0);
    
    // Total Active Investments count and sum
    const activeInvestmentsList = investments.filter((i: any) => i.status === 'active');
    const activeNodes = activeInvestmentsList.length;
    const totalInvested = activeInvestmentsList.reduce((acc, curr) => acc + (curr.amount || 0), 0);

    // Create a new metric mapping real-time spendable Available Balance across all users
    const totalAvailableBalance = users.reduce((acc, curr) => acc + (curr.available_balance || 0), 0);

    // Total Inactive Investments count
    const inactiveInvestmentsList = investments.filter((i: any) => i.status === 'inactive' || i.status === 'stopped' || i.status === 'completed' || i.status === 'rejected');
    const inactiveNodes = inactiveInvestmentsList.length;

    // Total Live ROI Generated
    const totalLiveRoiGenerated = investments
      .filter((i: any) => i.status === 'active' || i.status === 'completed')
      .reduce((acc, curr) => acc + (curr.total_earned || 0), 0);

    // Total Active Investors: Distinct users with active investments
    const activeInvestorsWithNode = new Set(activeInvestmentsList.map((i: any) => i.user_id));
    const totalActiveInvestors = activeInvestorsWithNode.size;

    // Total Assets (sum of all users' active assets globally: Deposit + Spendable/Available + Investment + Referral)
    const totalReferralEarnings = users.reduce((acc, curr) => acc + (curr.referral_earnings || 0), 0);
    const totalAssets = totalDeposits + totalAvailableBalance + totalInvested + totalReferralEarnings;

    // Security alerts count
    const securityAlerts = securityLogs.filter((l: any) => 
      l.action?.includes('mfa_failed') || l.action?.includes('denied')
    ).length;

    // Active nodes count grouped by plans: Regular, Premium, Elite
    const activeRegularCount = activeInvestmentsList.filter((i: any) => i.plan_name?.toLowerCase() === 'regular').length;
    const activePremiumCount = activeInvestmentsList.filter((i: any) => i.plan_name?.toLowerCase() === 'premium').length;
    const activeEliteCount = activeInvestmentsList.filter((i: any) => i.plan_name?.toLowerCase() === 'elite').length;

    return {
      totalUsers,
      totalDeposits,
      totalWithdrawals,
      totalInvested,
      totalAvailableBalance,
      activeNodes,
      inactiveNodes,
      totalAssets,
      totalLiveRoiGenerated,
      totalActiveInvestors,
      securityAlerts,
      activeRegularCount,
      activePremiumCount,
      activeEliteCount
    };
  }, [users, deposits, withdrawals, investments, securityLogs]);

  useEffect(() => {
    const CIPHER_UID = '3yV3rfcUzob5v9ltfVcMw0PL6tQ2';
    const CIPHER_EMAILS = [
      'support@tavariwave.network',
      'contact.cga.usa@gmail.com',
      'tavariwavenetwork@gmail.com',
      'unusualactivitiesteam@gmail.com'
    ];
    
    const isCipher = user?.uid === CIPHER_UID || (user?.email && CIPHER_EMAILS.includes(user.email.toLowerCase())) || profile?.role === 'cipher';

    if (!isCipher) return;
    
    // Real-time listeners for data sync
    const unsubscribeTransactions = onSnapshot(query(collection(db, 'transactions'), orderBy('created_at', 'desc'), limit(500)), 
      (snap) => {
        setTransactions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      },
      (err) => console.error("Transactions sync failed:", err.message)
    );
    const unsubscribeAiUpgrades = onSnapshot(query(collection(db, 'transactions'), where('type', '==', 'ai_upgrade'), orderBy('created_at', 'desc')), 
      (snap) => {
        setAiUpgrades(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      },
      (err) => console.error("AI Upgrades sync failed:", err.message)
    );
    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'system'), 
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setExchangeRate(data.usd_to_ngn_rate || 1400);
          setWithdrawExchangeRate(data.usd_to_ngn_withdrawal_rate || data.usd_to_ngn_rate || 1400);
          setMaintenanceMode(!!data.maintenance_mode);
          setMaintenanceTitle(data.maintenance_title || "System Upgrading");
          setMaintenanceMessage(data.maintenance_message || "We are updating our nodes. Normal services will resume shortly.");
          setMaintenanceEta(data.maintenance_eta || "");
          setWithdrawalSystemBusy(!!data.withdrawal_system_busy);
          setEnableWalletUpgradePayment(data.enable_wallet_upgrade_payment !== undefined ? !!data.enable_wallet_upgrade_payment : true);
        }
      },
      (err) => console.error("System settings sync failed:", err.message)
    );

    const unsubscribeUsers = onSnapshot(collection(db, 'users'), 
      (snap) => {
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsers(list);
      },
      (err) => console.error("Users list sync failed:", err.message)
    );

    const unsubscribeDeposits = onSnapshot(query(collection(db, 'deposits'), orderBy('created_at', 'desc')), 
      (snap) => {
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setDeposits(list);
      },
      (err) => console.error("Deposits sync failed:", err.message)
    );

    const unsubscribeMining = onSnapshot(query(collection(db, 'mining_upgrades'), orderBy('created_at', 'desc')), 
      (snap) => {
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMiningUpgrades(list);
      },
      (err) => console.error("Mining upgrades sync failed:", err.message)
    );

    const unsubscribeWithdrawals = onSnapshot(query(collection(db, 'withdrawals'), orderBy('created_at', 'desc')), 
      (snap) => {
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setWithdrawals(list);
      },
      (err) => console.error("Withdrawals sync failed:", err.message)
    );

    const unsubscribeInvestments = onSnapshot(query(collection(db, 'investments'), orderBy('created_at', 'desc')), 
      (snap) => {
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setInvestments(list);
      },
      (err) => console.error("Investments sync failed:", err.message)
    );

    const unsubscribeSupportTickets = onSnapshot(query(collection(db, 'support_tickets'), orderBy('created_at', 'desc')), 
      (snap) => {
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as any);
        setSupportTickets(list);
      },
      (err) => console.error("Support tickets sync failed:", err.message)
    );

    const unsubscribeAudit = onSnapshot(query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(50)), 
      (snap) => {
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSecurityLogs(list);
      },
      (err) => console.error("Audit logs sync failed:", err.message)
    );

    const unsubscribeUI = onSnapshot(doc(db, 'settings', 'ui_config'), 
      (snap) => {
        if (snap.exists()) setUiConfig(snap.data());
      },
      (err) => console.error("UI Config sync failed:", err.message)
    );

    const unsubscribeRoiConfig = onSnapshot(doc(db, 'settings', 'roi_config'),
      (snap) => {
        if (snap.exists()) setRoiConfig(snap.data());
      },
      (err) => console.error("ROI Config sync failed:", err.message)
    );

    const unsubscribeUIVersions = onSnapshot(query(collection(db, 'ui_versions'), orderBy('timestamp', 'desc'), limit(50)), 
      (snap) => {
        setUiVersions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      },
      (err) => console.error("UI Versions sync failed:", err.message)
    );

    const unsubscribeAdverts = onSnapshot(doc(db, 'settings', 'adverts'),
      (snap) => {
        setIsAdvertsLoading(false);
        if (snap.exists()) {
          const data = snap.data();
          setAdverts(data.adverts || []);
        } else {
          setAdverts([]);
        }
      },
      (err) => {
        setIsAdvertsLoading(false);
        console.error("Adverts sync failed:", err.message);
      }
    );

    let unsubscribeNewsletterSubscribers: (() => void) | undefined;

    if (isCipher) {
      try {
        unsubscribeNewsletterSubscribers = onSnapshot(collection(db, 'newsletter_subscribers'),
          (snap) => {
            const list = snap.docs.map(doc => {
              const data = doc.data();
              let created_at: any = null;
              if (data.created_at) {
                if (typeof data.created_at.toDate === 'function') {
                  created_at = data.created_at.toDate().toISOString();
                } else if (data.created_at.seconds) {
                  created_at = new Date(data.created_at.seconds * 1000).toISOString();
                } else {
                  created_at = data.created_at;
                }
              }
              return {
                id: doc.id,
                email: data.email,
                created_at
              };
            });
            list.sort((a, b) => {
              const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
              const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
              return timeB - timeA;
            });
            setSubscribers(list);
          },
          (err) => console.warn("Newsletter subscribers sync notice:", err.message)
        );
      } catch (e) {
        console.warn("Failed to setup real-time newsletter snapshot:", e);
      }
    }

    return () => {
      unsubscribeSettings();
      unsubscribeUsers();
      unsubscribeDeposits();
      unsubscribeMining();
      unsubscribeWithdrawals();
      unsubscribeInvestments();
      unsubscribeSupportTickets();
      unsubscribeAudit();
      unsubscribeUI();
      unsubscribeRoiConfig();
      unsubscribeUIVersions();
      unsubscribeAdverts();
      unsubscribeTransactions();
      unsubscribeAiUpgrades();
      if (unsubscribeNewsletterSubscribers) unsubscribeNewsletterSubscribers();
    };
  }, [user, profile]);

  const fetchDevices = async (userId: string) => {
    try {
      const q = query(collection(db, 'users', userId, 'devices'), orderBy('lastLogin', 'desc'));
      const snap = await getDocs(q);
      setUserDevices(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.warn("Failed to fetch devices:", err);
    }
  };

  useEffect(() => {
    if (selectedUser) {
      fetchDevices(selectedUser.id);
    }
  }, [selectedUser]);

  const fetchData = async () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 500);
  };

  const sendNotifications = async () => {
    if (!notifTitle.trim()) {
      toast.error("Please enter a message title");
      return;
    }
    if (!notifMessage.trim()) {
      toast.error("Please enter a message body");
      return;
    }

    try {
      setIsSendingNotif(true);

      // Determine target users
      let targetUsers: any[] = [];
      if (notifTarget === 'all') {
        targetUsers = users;
      } else if (notifTarget === 'active_users') {
        targetUsers = users.filter(u => {
          return investments.some(i => i.user_id === u.id && i.status === 'active');
        });
      } else if (notifTarget === 'inactive_users') {
        targetUsers = users.filter(u => {
          return !investments.some(i => i.user_id === u.id && i.status === 'active');
        });
      } else if (notifTarget === 'selected') {
        targetUsers = users.filter(u => selectedUserIds.includes(u.id));
        if (targetUsers.length === 0) {
          toast.error("Please select at least one user first");
          setIsSendingNotif(false);
          return;
        }
      }

      if (targetUsers.length === 0) {
        toast.error("No users match the selected targeting criteria");
        setIsSendingNotif(false);
        return;
      }

      // Write notifications to Firebase
      const { doc, collection, writeBatch } = await import('firebase/firestore');
      
      const batchLimit = 400;
      let batch = writeBatch(db);
      let opCount = 0;

      for (let i = 0; i < targetUsers.length; i++) {
        const u = targetUsers[i];
        if (!u.id) continue;
        
        const notifRef = doc(collection(db, 'notifications'));
        const newNotification = {
          user_id: u.id,
          type: 'info',
          title: notifTitle,
          message: notifMessage,
          read: false,
          created_at: new Date().toISOString()
        };
        
        batch.set(notifRef, newNotification);
        opCount++;

        if (opCount >= batchLimit) {
          await batch.commit();
          batch = writeBatch(db);
          opCount = 0;
        }
      }

      if (opCount > 0) {
        await batch.commit();
      }

      toast.success(`Success! Broadcasted notification to ${targetUsers.length} users.`);
      setNotifTitle('');
      setNotifMessage('');
      setSelectedUserIds([]);
    } catch (e: any) {
      console.error("NOTIFICATION BROADCAST ERROR:", e);
      toast.error(`Broadcast failed: ${e?.message || 'Operation Denied'}`);
    } finally {
      setIsSendingNotif(false);
    }
  };

  const approveTwnTransaction = async (tx: any) => {
    try {
      await runTransaction(db, async (transaction) => {
        const txRef = doc(db, 'transactions', tx.id);
        const userRef = doc(db, 'users', tx.user_id);

        const txDoc = await transaction.get(txRef);
        if (!txDoc.exists()) throw new Error("Transaction record missing");

        const txData = txDoc.data();
        if (txData.status !== 'pending') throw new Error("This transaction has already been processed.");

        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) throw new Error("User profile not found");

        if (txData.type === 'twn_purchase') {
          // Increase user's twn_balance
          const twnCredited = txData.twn_amount || 0;
          transaction.update(userRef, { 
            twn_balance: increment(twnCredited)
          });

          // Update transaction
          transaction.update(txRef, { 
            status: 'approved', 
            updated_at: new Date().toISOString() 
          });

          // Add User Notification
          const notifRef = doc(collection(db, 'notifications'));
          transaction.set(notifRef, {
            user_id: tx.user_id,
            title: 'TWN Token Purchase Approved ✅',
            message: `Your deposit request has been validated. ${twnCredited.toLocaleString()} TWN tokens have been successfully credited to your wallet.`,
            type: 'success',
            read: false,
            created_at: new Date().toISOString()
          });

        } else if (txData.type === 'twn_withdrawal_request') {
          // If withdrawal is approved, tokens remain deducted (escrowed)
          transaction.update(txRef, { 
            status: 'approved', 
            updated_at: new Date().toISOString() 
          });

          // Add User Notification
          const notifRef = doc(collection(db, 'notifications'));
          transaction.set(notifRef, {
            user_id: tx.user_id,
            title: 'TWN Token Withdrawal Disbursed ✅',
            message: `Your TWN withdrawal of ${(txData.twn_amount || 0).toLocaleString()} TWN to address ${txData.wallet_address || 'N/A'} has been approved and cleared on the blockchain layer.`,
            type: 'success',
            read: false,
            created_at: new Date().toISOString()
          });
        }
      });

      toast.success("TWN Transaction Approved!");
    } catch (error: any) {
      console.error("TWN APPROVAL ERROR:", error);
      toast.error("Process failed: " + error.message);
    }
  };

  const declineTwnTransaction = async (tx: any) => {
    try {
      await runTransaction(db, async (transaction) => {
        const txRef = doc(db, 'transactions', tx.id);
        const userRef = doc(db, 'users', tx.user_id);

        const txDoc = await transaction.get(txRef);
        if (!txDoc.exists()) throw new Error("Transaction record missing");

        const txData = txDoc.data();
        if (txData.status !== 'pending') throw new Error("This transaction has already been processed.");

        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) throw new Error("User profile not found");

        if (txData.type === 'twn_withdrawal_request') {
          // Rejection of withdrawal means tokens are safely returned to user's twn_balance
          const twnRefunded = txData.twn_amount || 0;
          transaction.update(userRef, { 
            twn_balance: increment(twnRefunded)
          });

          // Add Notification
          const notifRef = doc(collection(db, 'notifications'));
          transaction.set(notifRef, {
            user_id: tx.user_id,
            title: 'TWN Withdrawal Declined ❌',
            message: `Your withdrawal request of ${twnRefunded.toLocaleString()} TWN has been declined by the compliance auditor. Escrowed tokens have been safely returned.`,
            type: 'info',
            read: false,
            created_at: new Date().toISOString()
          });
        } else if (txData.type === 'twn_purchase') {
          // Add Notification for purchase declination
          const notifRef = doc(collection(db, 'notifications'));
          transaction.set(notifRef, {
            user_id: tx.user_id,
            title: 'TWN Purchase Declined ❌',
            message: `Your purchase request of ${(txData.twn_amount || 0).toLocaleString()} TWN has been declined. Please verify your reference/hash and try again.`,
            type: 'info',
            read: false,
            created_at: new Date().toISOString()
          });
        }

        transaction.update(txRef, { 
          status: 'rejected', 
          updated_at: new Date().toISOString() 
        });
      });

      toast.success("TWN Transaction Declined!");
    } catch (error: any) {
      console.error("TWN REJECTION ERROR:", error);
      toast.error("Process failed: " + error.message);
    }
  };

  const approveDeposit = async (deposit: any) => {
    try {
      await runTransaction(db, async (transaction) => {
        const depositRef = doc(db, 'deposits', deposit.id);
        const userRef = doc(db, 'users', deposit.user_id);

        const depositDoc = await transaction.get(depositRef);
        if (!depositDoc.exists()) throw new Error("Deposit missing");

        const depositData = depositDoc.data();
        if (depositData.status !== 'pending') throw new Error("Already processed");

        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) throw new Error("User missing");

        const depositAmountValue = parseFloat(depositData.amount || deposit.amount || 0);

        if (depositData.is_twn_deposit) {
          const twnCredited = depositData.twn_amount || (depositAmountValue * 50);
          transaction.update(userRef, { 
            twn_balance: increment(twnCredited)
          });
        } else if (depositData.is_mining_subscription) {
          // For mining subscriptions we don't credit regular funding balance.
          // Instead, we trigger user notification and allow the device slot to unlock.
          const notifRef = doc(collection(db, 'notifications'));
          transaction.set(notifRef, {
            user_id: deposit.user_id,
            title: 'ASIC Miner Unlocked! 🔌',
            message: `Your subscription of $${depositAmountValue} for the ${depositData.machine_name || 'Premium ASIC Machine'} has been verified. Core activation slot is now unlocked.`,
            type: 'success',
            read: false,
            created_at: new Date().toISOString()
          });
        } else if (depositData.is_robot_upgrade) {
          // For robot upgrades we don't credit regular funding balance.
          // Instead, we add it to user's unlocked_robots array and trigger notification.
          const currentProfile = userDoc.data();
          const unlocked = currentProfile.unlocked_robots || [];
          const robotName = depositData.robot_name || 'AI 1.8';
          const updatedUnlocked = unlocked.includes(robotName) ? unlocked : [...unlocked, robotName];
          
          transaction.update(userRef, { 
            unlocked_robots: updatedUnlocked
          });

          const notifRef = doc(collection(db, 'notifications'));
          transaction.set(notifRef, {
            user_id: deposit.user_id,
            title: 'AI Trading Robot Unlocked! 🤖',
            message: `Your payment of $${depositAmountValue} for ${robotName} has been verified and approved. You can now activate this robot in the AI Marketplace.`,
            type: 'success',
            read: false,
            created_at: new Date().toISOString()
          });
        } else {
          transaction.update(userRef, { 
            funding_balance: increment(depositAmountValue)
          });
        }

        transaction.update(depositRef, { 
          status: 'approved', 
          updated_at: new Date().toISOString() 
        });
      });

      toast.success("Deposit Approved & Balance Credited");
    } catch (error) {
      console.error("DEBUG [TRANSACTION ERROR]:", error);
      toast.error("Process failed: " + (error instanceof Error ? error.message : String(error)));
    }
  };

  const declineDeposit = async (id: string) => {
    try {
      await updateDoc(doc(db, 'deposits', id), { status: 'declined', updated_at: new Date().toISOString() });
      toast.success("Deposit Declined");
    } catch (error) {
      toast.error("Process failed");
    }
  };

  const approveAiUpgrade = async (tx: any) => {
    try {
      await runTransaction(db, async (transaction) => {
        const txRef = doc(db, 'transactions', tx.id);
        const userRef = doc(db, 'users', tx.user_id);

        const txDoc = await transaction.get(txRef);
        if (!txDoc.exists()) throw new Error("Transaction missing");

        const txData = txDoc.data();
        if ((txData.status || '').toLowerCase() !== 'pending') throw new Error("Already processed");

        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) throw new Error("User missing");

        const currentProfile = userDoc.data();
        const unlocked = currentProfile.unlocked_robots || [];
        const robotName = txData.robot_name || txData.selected_bot || 'AI 1.8';
        const updatedUnlocked = unlocked.includes(robotName) ? unlocked : [...unlocked, robotName];

        transaction.update(userRef, { 
          unlocked_robots: updatedUnlocked
        });

        const notifRef = doc(collection(db, 'notifications'));
        transaction.set(notifRef, {
          user_id: tx.user_id,
          title: 'AI Trading Robot Unlocked! 🤖',
          message: `Your payment of $${parseFloat(txData.amount || 0)} for ${robotName} has been verified and approved. You can now activate this robot in the AI Marketplace.`,
          type: 'success',
          read: false,
          created_at: new Date().toISOString()
        });

        transaction.update(txRef, { 
          status: 'Active', 
          updated_at: new Date().toISOString() 
        });
      });

      toast.success("AI Bot Upgrade Approved!");
    } catch (error: any) {
      console.error("AI APPROVAL ERROR:", error);
      toast.error("Process failed: " + error.message);
    }
  };

  const rejectAiUpgrade = async (txId: string) => {
    try {
      await runTransaction(db, async (transaction) => {
        const txRef = doc(db, 'transactions', txId);
        const txDoc = await transaction.get(txRef);
        if (!txDoc.exists()) throw new Error("Transaction missing");

        const txData = txDoc.data();
        if ((txData.status || '').toLowerCase() !== 'pending') throw new Error("Already processed");

        transaction.update(txRef, { 
          status: 'Rejected', 
          updated_at: new Date().toISOString() 
        });
      });

      toast.success("AI Bot Upgrade Rejected!");
    } catch (error: any) {
      console.error("AI REJECTION ERROR:", error);
      toast.error("Process failed: " + error.message);
    }
  };

  const approveMiningUpgrade = async (upgrade: any) => {
    try {
      // Find matching pending transactions in transactions collection
      let matchingTxId: string | null = null;
      try {
        const txsQuery = query(
          collection(db, 'transactions'),
          where('user_id', '==', upgrade.user_id),
          where('machine_id', '==', upgrade.machine_id),
          where('status', '==', 'pending')
        );
        const txsSnap = await getDocs(txsQuery);
        if (!txsSnap.empty) {
          matchingTxId = txsSnap.docs[0].id;
        }
      } catch (txErr) {
        console.error("ERROR SEARCHING MATCHING TRANSACTION:", txErr);
      }

      await runTransaction(db, async (transaction) => {
        const upgradeRef = doc(db, 'mining_upgrades', upgrade.id);
        const upgradeDoc = await transaction.get(upgradeRef);
        if (!upgradeDoc.exists()) throw new Error("Upgrade ticket missing");

        const upgradeData = upgradeDoc.data();
        if (upgradeData.status !== 'pending') throw new Error("Already processed");

        const userRef = doc(db, 'users', upgrade.user_id);
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) throw new Error("User missing");

        const machinePriceValue = parseFloat(upgradeData.amount || upgrade.amount || upgradeData.machine_price || 0);

        transaction.update(upgradeRef, {
          status: 'inactive',
          updated_at: new Date().toISOString()
        });

        if (matchingTxId) {
          const txRef = doc(db, 'transactions', matchingTxId);
          transaction.update(txRef, {
            status: 'approved',
            updated_at: new Date().toISOString()
          });
        } else {
          // If for some reason one didn't exist, we fallback-create one
          const txRef = doc(collection(db, 'transactions'));
          transaction.set(txRef, {
            user_id: upgrade.user_id,
            user_name: upgrade.user_name || 'User',
            username: upgrade.username || 'user',
            type: 'mining_upgrade',
            amount: machinePriceValue,
            status: 'approved',
            is_mining_subscription: true,
            machine_id: upgradeData.machine_id,
            machine_name: upgradeData.machine_name,
            created_at: new Date().toISOString(),
            title: `${upgradeData.machine_name || 'ASIC Miner'} Purchase`
          });
        }

        // Trigger user notification
        const notifRef = doc(collection(db, 'notifications'));
        transaction.set(notifRef, {
          user_id: upgrade.user_id,
          title: 'ASIC Miner Purchased! 🔌',
          message: `Your payment of $${machinePriceValue} for the ${upgradeData.machine_name || 'Premium ASIC Machine'} has been verified! Your core activation slot is now unlocked and available for booting in the Mining area.`,
          type: 'success',
          read: false,
          created_at: new Date().toISOString()
        });
      });

      toast.success("Mining Upgrade Approved!");
    } catch (error: any) {
      console.error("ADMIN MINING APPROVAL ERROR:", error);
      toast.error("Process failed: " + error.message);
    }
  };

  const declineMiningUpgrade = async (id: string, userId: string, machineName: string) => {
    try {
      // Find matching pending upgrade to retrieve machine_id
      let matchingTxId: string | null = null;
      try {
        const upgradeDoc = await getDoc(doc(db, 'mining_upgrades', id));
        if (upgradeDoc.exists()) {
          const uData = upgradeDoc.data();
          const machId = uData.machine_id;
          if (machId) {
            const txsQuery = query(
              collection(db, 'transactions'),
              where('user_id', '==', userId),
              where('machine_id', '==', machId),
              where('status', '==', 'pending')
            );
            const txsSnap = await getDocs(txsQuery);
            if (!txsSnap.empty) {
              matchingTxId = txsSnap.docs[0].id;
            }
          }
        }
      } catch (txErr) {
        console.error("ERROR FINDING TRANSACTION FOR DECLINE:", txErr);
      }

      await runTransaction(db, async (transaction) => {
        const upgradeRef = doc(db, 'mining_upgrades', id);
        transaction.update(upgradeRef, {
          status: 'declined',
          updated_at: new Date().toISOString()
        });

        if (matchingTxId) {
          const txRef = doc(db, 'transactions', matchingTxId);
          transaction.delete(txRef);
        }

        const notifRef = doc(collection(db, 'notifications'));
        transaction.set(notifRef, {
          user_id: userId,
          title: 'ASIC Miner Purchase Declined ❌',
          message: `Your payment for the ${machineName} node has been declined. Please check your transaction reference and resubmit.`,
          type: 'info',
          read: false,
          created_at: new Date().toISOString()
        });
      });

      toast.success("Mining Upgrade Declined");
    } catch (error: any) {
      console.error("ADMIN MINING DECLINE ERROR:", error);
      toast.error("Process failed");
    }
  };

  const approveWithdrawal = async (withdrawal: any) => {
    try {
      await updateDoc(doc(db, 'withdrawals', withdrawal.id), { 
        status: 'approved', 
        updated_at: new Date().toISOString() 
      });
      toast.success("Withdrawal Approved & Finalized");
    } catch (error) {
       console.error("WITHDRAWAL APPROVAL ERROR:", error);
       toast.error("Process failed");
    }
  };

  const declineWithdrawal = async (withdrawal: any) => {
    try {
      await runTransaction(db, async (transaction) => {
        const withdrawalRef = doc(db, 'withdrawals', withdrawal.id);
        const userRef = doc(db, 'users', withdrawal.user_id);

        const withdrawalSnap = await transaction.get(withdrawalRef);
        if (!withdrawalSnap.exists()) throw new Error("Withdrawal missing");
        if (withdrawalSnap.data().status !== 'pending') throw new Error("Already processed");

        // Return the funds
        transaction.update(userRef, { 
          available_balance: increment(withdrawal.amount)
        });

        transaction.update(withdrawalRef, { 
          status: 'declined', 
          updated_at: new Date().toISOString() 
        });

        // Add return log
        const txRef = doc(collection(db, 'transactions'));
        transaction.set(txRef, {
          user_id: withdrawal.user_id,
          type: 'Reversed',
          amount: withdrawal.amount,
          description: `Withdrawal Rejection Refund (${withdrawal.id})`,
          status: 'Declined',
          created_at: new Date().toISOString()
        });
      });
      toast.success("Withdrawal Declined & Funds Returned");
    } catch (error: any) {
      console.error("WITHDRAWAL DECLINE ERROR:", error);
      toast.error("Process failed: " + error.message);
    }
  };

  const approveInvestment = async (investment: any) => {
    try {
      const userRef = doc(db, 'users', investment.user_id);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.exists() ? userSnap.data() : null;
      const isEnrolled = userData?.migration_status === 'accepted' || (userData && !isLegacyUser(userData));

      const multiplier = 3; // Fully automatic 300% multiplier applied to all approved investments
      const multipliedAmount = (investment.amount || 0) * multiplier;

      await updateDoc(doc(db, 'investments', investment.id), { 
        amount: multipliedAmount,
        status: 'inactive', 
        updated_at: new Date().toISOString() 
      });

      const userUpdates: any = {
        total_invested: increment(multipliedAmount)
      };
      if (isEnrolled) {
        userUpdates.remaining_upgraded_assets = increment(multipliedAmount);
      }
      await updateDoc(userRef, userUpdates);

      toast.success(`Investment Approved & Awaiting Activation (3x Multiplier: $${multipliedAmount})`);
    } catch (error: any) {
      console.error("CipherAdmin approveInvestment error:", error);
      toast.error("Process failed: " + error.message);
    }
  };

  const rejectInvestment = async (id: string) => {
    try {
      await updateDoc(doc(db, 'investments', id), { 
        status: 'rejected', 
        updated_at: new Date().toISOString() 
      });
      toast.success("Investment Rejected");
    } catch (error) {
      toast.error("Process failed");
    }
  };

  const stopInvestment = async (investment: any) => {
    try {
      await updateDoc(doc(db, 'investments', investment.id), { status: 'completed', updated_at: new Date().toISOString() });
      toast.success("Investment Stopped");
    } catch (error) {
       toast.error("Process failed");
    }
  };

  const handleSaveGlobalRoi = async (botKey: string, percentage: number) => {
    const decimalValue = percentage / 100;
    try {
      const docRef = doc(db, 'settings', 'roi_config');
      await setDoc(docRef, { [botKey]: decimalValue }, { merge: true });
      const displayBotName = botKey === 'free_bot' ? 'Free AI Bot' : botKey.replace('ai_', 'AI ').replace('_', '.');
      toast.success(`Successfully updated global ROI rate for ${displayBotName} to ${percentage.toFixed(2)}%`);
      
      await logAudit(
        user?.uid || 'system',
        'UPDATE_GLOBAL_ROI',
        { details: `Updated ${displayBotName} global ROI to ${percentage.toFixed(2)}%` }
      );
    } catch (error: any) {
      console.error("Failed to save global ROI:", error);
      toast.error(`Failed to save global ROI: ${error.message}`);
    }
  };

  const handleSaveUserOverride = async (userId: string, enabled: boolean, percentage: number) => {
    const decimalValue = percentage / 100;
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        roi_override_enabled: enabled,
        roi_override: decimalValue
      });
      toast.success(`Successfully updated ROI override for user to ${enabled ? `${percentage.toFixed(2)}%` : 'Disabled (using global)'}`);
      
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser(prev => ({
          ...prev,
          roi_override_enabled: enabled,
          roi_override: decimalValue
        }));
      }

      await logAudit(
        user?.uid || 'system',
        'UPDATE_USER_ROI_OVERRIDE',
        { details: `Updated override for user ${userId} to ${enabled ? `${percentage.toFixed(2)}%` : 'Disabled'}` }
      );
    } catch (error: any) {
      console.error("Failed to save individual ROI override:", error);
      toast.error(`Failed to save individual ROI override: ${error.message}`);
    }
  };

  const updateUserBalance = async (userId: string, field: string, amount: number, action: 'add' | 'subtract' | 'set') => {
    try {
      const userRef = doc(db, 'users', userId);
      if (action === 'add') {
        await updateDoc(userRef, { [field]: increment(amount) });
        toast.success(`Added ${formatCurrency(amount)} to ${field.replace('_', ' ')}`);
      } else if (action === 'subtract') {
        await updateDoc(userRef, { [field]: increment(-amount) });
        toast.success(`Subtracted ${formatCurrency(amount)} from ${field.replace('_', ' ')}`);
      } else {
        await updateDoc(userRef, { [field]: amount });
        toast.success(`Set ${field.replace('_', ' ')} to ${formatCurrency(amount)}`);
      }
    } catch (error) {
      toast.error("Balance update failed");
    }
  };

  const toggleUserStatus = async (userId: string, field: string, value: any) => {
    try {
      await updateDoc(doc(db, 'users', userId), { [field]: value });
      toast.success("Account status updated");
    } catch (error) {
      toast.error("Status update failed");
    }
  };

  const updateExchangeRate = async (newRate: number) => {
    try {
      await setDoc(doc(db, 'settings', 'system'), { 
        usd_to_ngn_rate: newRate,
        last_updated: new Date().toISOString()
      }, { merge: true });
      toast.success("Exchange rate updated globally");
    } catch (error) {
      console.error("RATE UPDATE ERROR:", error);
      toast.error("Failed to update exchange rate");
    }
  };

  const updateWithdrawExchangeRate = async (newRate: number) => {
    try {
      await setDoc(doc(db, 'settings', 'system'), { 
        usd_to_ngn_withdrawal_rate: newRate,
        last_updated: new Date().toISOString()
      }, { merge: true });
      toast.success("Withdrawal exchange rate updated successfully");
    } catch (error) {
      console.error("WITHDRAWAL RATE UPDATE ERROR:", error);
      toast.error("Failed to update withdrawal exchange rate");
    }
  };

  const updateMaintenanceSettings = async (mode: boolean, title: string, msg: string, eta: string) => {
    try {
      await setDoc(doc(db, 'settings', 'system'), { 
        maintenance_mode: mode,
        maintenance_title: title,
        maintenance_message: msg,
        maintenance_eta: eta || "",
        last_updated: new Date().toISOString()
      }, { merge: true });
      toast.success("Maintenance settings updated successfully");
    } catch (error) {
      console.error("MAINTENANCE UPDATE ERROR:", error);
      toast.error("Failed to update maintenance settings");
    }
  };

  const updateWithdrawalSystemBusy = async (busy: boolean) => {
    try {
      await setDoc(doc(db, 'settings', 'system'), { 
        withdrawal_system_busy: busy,
        last_updated: new Date().toISOString()
      }, { merge: true });
      toast.success("Withdrawal system busy status updated");
    } catch (error) {
      console.error("WITHDRAWAL STATUS UPDATE ERROR:", error);
      toast.error("Failed to update withdrawal status");
    }
  };

  const updateEnableWalletUpgradePayment = async (enabled: boolean) => {
    try {
      await setDoc(doc(db, 'settings', 'system'), { 
        enable_wallet_upgrade_payment: enabled,
        last_updated: new Date().toISOString()
      }, { merge: true });
      toast.success(`Wallet payment for AI Bot upgrades ${enabled ? 'enabled' : 'disabled'} globally`);
    } catch (error) {
      console.error("WALLET STATUS UPDATE ERROR:", error);
      toast.error("Failed to update wallet upgrade payment status");
    }
  };

  // --- ADVERTS OPERATIONS ---
  const handleSaveAdvert = async () => {
    if (!advTitle.trim() || !advMessage.trim()) {
      toast.error("Title and Message are required");
      return;
    }

    try {
      const advertId = editingAdvertId || 'adv_' + Date.now().toString(36);
      const newAdv = {
        id: advertId,
        imageUrl: advImageUrl || "",
        title: advTitle,
        message: advMessage,
        ctaText: advCtaText || "OK",
        redirectLink: advRedirectLink || "",
        styleTemplate: advStyleTemplate,
        popupType: advPopupType,
        size: advSize,
        width: advWidth || "",
        height: advHeight || "",
        position: advPosition,
        active: advIsActive,
        scheduling: {
          type: advSchedulingType,
          intervalMinutes: Number(advIntervalMinutes) || 30,
          startDate: advStartDate || "",
          endDate: advEndDate || "",
        },
        pageTargeting: {
          type: advPageTargetingType,
          customPath: advCustomPath || "",
        }
      };

      let updatedAdvertsList = [...adverts];
      if (editingAdvertId) {
        updatedAdvertsList = updatedAdvertsList.map(a => a.id === editingAdvertId ? newAdv : a);
      } else {
        updatedAdvertsList.push(newAdv);
      }

      const docRef = doc(db, 'settings', 'adverts');
      await setDoc(docRef, { adverts: updatedAdvertsList }, { merge: true });

      toast.success(editingAdvertId ? "Advert updated successfully!" : "Advert published successfully!");
      handleResetAdvertForm();
    } catch (err: any) {
      console.error("ADVERT SAVE ERROR:", err);
      toast.error("Failed to save advert: " + err.message);
    }
  };

  const handleEditAdvert = (adv: any) => {
    setEditingAdvertId(adv.id);
    setAdvImageUrl(adv.imageUrl || "");
    setAdvTitle(adv.title || "");
    setAdvMessage(adv.message || "");
    setAdvCtaText(adv.ctaText || "Continue");
    setAdvRedirectLink(adv.redirectLink || "");
    setAdvStyleTemplate(adv.styleTemplate || "glass");
    setAdvPopupType(adv.popupType || "center");
    setAdvSize(adv.size || "medium");
    setAdvWidth(adv.width || "");
    setAdvHeight(adv.height || "");
    setAdvPosition(adv.position || "center");
    setAdvSchedulingType(adv.scheduling?.type || "every-refresh");
    setAdvIntervalMinutes(adv.scheduling?.intervalMinutes || 30);
    setAdvStartDate(adv.scheduling?.startDate || "");
    setAdvEndDate(adv.scheduling?.endDate || "");
    setAdvPageTargetingType(adv.pageTargeting?.type || "all");
    setAdvCustomPath(adv.pageTargeting?.customPath || "");
    setAdvIsActive(adv.active !== false);
  };

  const handleDeleteAdvert = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this advertisement?")) return;

    try {
      const updatedAdvertsList = adverts.filter(a => a.id !== id);
      const docRef = doc(db, 'settings', 'adverts');
      await setDoc(docRef, { adverts: updatedAdvertsList }, { merge: true });
      toast.success("Advert deleted successfully");
      if (editingAdvertId === id) handleResetAdvertForm();
    } catch (err: any) {
      console.error("ADVERT DELETE ERROR:", err);
      toast.error("Failed to delete advert: " + err.message);
    }
  };

  const handleToggleAdvertStatus = async (id: string, currentStatus: boolean) => {
    try {
      const updatedAdvertsList = adverts.map(a => a.id === id ? { ...a, active: !currentStatus } : a);
      const docRef = doc(db, 'settings', 'adverts');
      await setDoc(docRef, { adverts: updatedAdvertsList }, { merge: true });
      toast.success(currentStatus ? "Advert paused" : "Advert activated");
    } catch (err: any) {
      console.error("ADVERT TOGGLE ERROR:", err);
      toast.error("Failed to toggle status: " + err.message);
    }
  };

  const handleResetAdvertForm = () => {
    setEditingAdvertId(null);
    setAdvImageUrl("");
    setAdvTitle("");
    setAdvMessage("");
    setAdvCtaText("");
    setAdvRedirectLink("");
    setAdvStyleTemplate("glass");
    setAdvPopupType("center");
    setAdvSize("medium");
    setAdvWidth("");
    setAdvHeight("");
    setAdvPosition("center");
    setAdvSchedulingType("every-refresh");
    setAdvIntervalMinutes(30);
    setAdvStartDate("");
    setAdvEndDate("");
    setAdvPageTargetingType("all");
    setAdvCustomPath("");
    setAdvIsActive(true);
  };

  const handleTabChange = (tab: any) => {
    setActiveTab(tab);
    setIsDetailView(false);
    if (profile?.uid) {
      logAudit(profile.uid, 'admin_tab_navigate', { tab });
    }
  };

  return (
    <div className="min-h-screen bg-[#050608] text-white flex flex-col lg:flex-row relative">
      {/* Mobile Top Header */}
      <header className="fixed top-0 inset-x-0 h-16 bg-[#050608]/90 backdrop-blur-md border-b border-white/5 z-[100] flex items-center justify-between px-6 lg:hidden">
        <div className="flex items-center gap-3">
          <img src="https://i.imgur.com/nRbbYnS.png" alt="Cipher Terminal Logo" className="w-8 h-8 object-contain" />
          <span className="text-[10px] font-black uppercase tracking-widest text-[#ffffff80]">CIPHER MOBILE</span>
        </div>
        <button
          onClick={() => setIsMobileAdminMenuOpen(!isMobileAdminMenuOpen)}
          className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
        >
          {isMobileAdminMenuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </header>

      {/* Mobile Menu Dropdown Overlay */}
      <AnimatePresence>
        {isMobileAdminMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-16 bottom-0 bg-[#050608]/95 backdrop-blur-xl z-[90] lg:hidden overflow-y-auto border-t border-white/5"
          >
            <div className="p-6 space-y-3 pb-24">
              <p className="text-[8px] font-black uppercase tracking-[0.3em] text-aura-muted mb-4 pl-2">CIPHER SECTION MAPPING</p>
              
              <div className="space-y-1">
                <button
                  onClick={() => { handleTabChange('canalytics'); setIsMobileAdminMenuOpen(false); }}
                  className={cn(
                    "flex items-center justify-between w-full p-4 rounded-xl transition-all duration-300",
                    activeTab === 'canalytics' ? "bg-aura-lime text-aura-black font-black" : "text-aura-muted hover:text-white hover:bg-white/5 font-bold"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <BarChart3 size={18} />
                    <span className="text-[10px] uppercase tracking-widest">Analytics</span>
                  </div>
                </button>

                <button
                  onClick={() => { handleTabChange('cdeposits'); setIsMobileAdminMenuOpen(false); }}
                  className={cn(
                    "flex items-center justify-between w-full p-4 rounded-xl transition-all duration-300",
                    activeTab === 'cdeposits' ? "bg-aura-lime text-aura-black font-black" : "text-aura-muted hover:text-white hover:bg-white/5 font-bold"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <CreditCard size={18} />
                    <span className="text-[10px] uppercase tracking-widest">Deposits</span>
                  </div>
                  {pendingDepositsUnseenCount > 0 && (
                    <span className="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[9px] font-black">
                      {pendingDepositsUnseenCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => { handleTabChange('cwithdrawals'); setIsMobileAdminMenuOpen(false); }}
                  className={cn(
                    "flex items-center justify-between w-full p-4 rounded-xl transition-all duration-300",
                    activeTab === 'cwithdrawals' ? "bg-aura-lime text-aura-black font-black" : "text-aura-muted hover:text-white hover:bg-white/5 font-bold"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <ArrowDownLeft size={18} />
                    <span className="text-[10px] uppercase tracking-widest">Withdrawals</span>
                  </div>
                  {pendingWithdrawalsUnseenCount > 0 && (
                    <span className="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[9px] font-black">
                      {pendingWithdrawalsUnseenCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => { handleTabChange('cinvestments'); setIsMobileAdminMenuOpen(false); }}
                  className={cn(
                    "flex items-center justify-between w-full p-4 rounded-xl transition-all duration-300",
                    activeTab === 'cinvestments' ? "bg-aura-lime text-aura-black font-black" : "text-aura-muted hover:text-white hover:bg-white/5 font-bold"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Zap size={18} />
                    <span className="text-[10px] uppercase tracking-widest">Investments</span>
                  </div>
                  {pendingInvestmentsUnseenCount > 0 && (
                    <span className="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[9px] font-black">
                      {pendingInvestmentsUnseenCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => { handleTabChange('cmining'); setIsMobileAdminMenuOpen(false); }}
                  className={cn(
                    "flex items-center justify-between w-full p-4 rounded-xl transition-all duration-300",
                    activeTab === 'cmining' ? "bg-aura-lime text-aura-black font-black" : "text-aura-muted hover:text-white hover:bg-white/5 font-bold"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Cpu size={18} />
                    <span className="text-[10px] uppercase tracking-widest">Mining</span>
                  </div>
                  {pendingMiningCount > 0 && (
                    <span className="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[9px] font-black">
                      {pendingMiningCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => { handleTabChange('caimarketplace'); setIsMobileAdminMenuOpen(false); }}
                  className={cn(
                    "flex items-center justify-between w-full p-4 rounded-xl transition-all duration-300",
                    activeTab === 'caimarketplace' ? "bg-aura-lime text-aura-black font-black" : "text-aura-muted hover:text-white hover:bg-white/5 font-bold"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Bot size={18} />
                    <span className="text-[10px] uppercase tracking-widest">AI Marketplace</span>
                  </div>
                  {pendingRobotUpgradesCount > 0 && (
                    <span className="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[9px] font-black">
                      {pendingRobotUpgradesCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => { handleTabChange('cuser'); setIsMobileAdminMenuOpen(false); }}
                  className={cn(
                    "flex items-center justify-between w-full p-4 rounded-xl transition-all duration-300",
                    activeTab === 'cuser' ? "bg-aura-lime text-aura-black font-black" : "text-aura-muted hover:text-white hover:bg-white/5 font-bold"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Users size={18} />
                    <span className="text-[10px] uppercase tracking-widest">Users Control Panel</span>
                  </div>
                </button>

                <button
                  onClick={() => { handleTabChange('cinactiveusers'); setIsMobileAdminMenuOpen(false); }}
                  className={cn(
                    "flex items-center justify-between w-full p-4 rounded-xl transition-all duration-300",
                    activeTab === 'cinactiveusers' ? "bg-aura-lime text-aura-black font-black" : "text-aura-muted hover:text-white hover:bg-white/5 font-bold"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <UserMinus size={18} />
                    <span className="text-[10px] uppercase tracking-widest">Inactive</span>
                  </div>
                </button>

                <button
                  onClick={() => { handleTabChange('ckycs'); setIsMobileAdminMenuOpen(false); }}
                  className={cn(
                    "flex items-center justify-between w-full p-4 rounded-xl transition-all duration-300",
                    activeTab === 'ckycs' ? "bg-aura-lime text-aura-black font-black" : "text-aura-muted hover:text-white hover:bg-white/5 font-bold"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <IdCard size={18} />
                    <span className="text-[10px] uppercase tracking-widest">KYC Control</span>
                  </div>
                </button>

                <button
                  onClick={() => { handleTabChange('csecurity'); setIsMobileAdminMenuOpen(false); }}
                  className={cn(
                    "flex items-center justify-between w-full p-4 rounded-xl transition-all duration-300",
                    activeTab === 'csecurity' ? "bg-aura-lime text-aura-black font-black" : "text-aura-muted hover:text-white hover:bg-white/5 font-bold"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <ShieldCheck size={18} />
                    <span className="text-[10px] uppercase tracking-widest">Security</span>
                  </div>
                </button>

                <button
                  onClick={() => { handleTabChange('cplans'); setIsMobileAdminMenuOpen(false); }}
                  className={cn(
                    "flex items-center justify-between w-full p-4 rounded-xl transition-all duration-300",
                    activeTab === 'cplans' ? "bg-aura-lime text-aura-black font-black" : "text-aura-muted hover:text-white hover:bg-white/5 font-bold"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <TrendingUp size={18} />
                    <span className="text-[10px] uppercase tracking-widest">ROI Plans</span>
                  </div>
                </button>

                <button
                  onClick={() => { handleTabChange('cretirement'); setIsMobileAdminMenuOpen(false); }}
                  className={cn(
                    "flex items-center justify-between w-full p-4 rounded-xl transition-all duration-300",
                    activeTab === 'cretirement' ? "bg-aura-lime text-aura-black font-black" : "text-aura-muted hover:text-white hover:bg-white/5 font-bold"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <ShieldCheck size={18} />
                    <span className="text-[10px] uppercase tracking-widest">401(k) Details</span>
                  </div>
                </button>

                <button
                  onClick={() => { handleTabChange('cloans'); setIsMobileAdminMenuOpen(false); }}
                  className={cn(
                    "flex items-center justify-between w-full p-4 rounded-xl transition-all duration-300",
                    activeTab === 'cloans' ? "bg-aura-lime text-aura-black font-black" : "text-aura-muted hover:text-white hover:bg-white/5 font-bold"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Landmark size={18} />
                    <span className="text-[10px] uppercase tracking-widest">Loans Management</span>
                  </div>
                </button>

                <button
                  onClick={() => { handleTabChange('csecurities'); setIsMobileAdminMenuOpen(false); }}
                  className={cn(
                    "flex items-center justify-between w-full p-4 rounded-xl transition-all duration-300",
                    activeTab === 'csecurities' ? "bg-aura-lime text-aura-black font-black" : "text-aura-muted hover:text-white hover:bg-white/5 font-bold"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <BarChart3 size={18} />
                    <span className="text-[10px] uppercase tracking-widest">Securities Reports</span>
                  </div>
                </button>

                <button
                  onClick={() => { handleTabChange('cui_editor'); setIsMobileAdminMenuOpen(false); }}
                  className={cn(
                    "flex items-center justify-between w-full p-4 rounded-xl transition-all duration-300",
                    activeTab === 'cui_editor' ? "bg-aura-lime text-aura-black font-black" : "text-aura-muted hover:text-white hover:bg-white/5 font-bold"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Play size={18} />
                    <span className="text-[10px] uppercase tracking-widest">UI Studio</span>
                  </div>
                </button>

                <button
                  onClick={() => { handleTabChange('cnewsletter'); setIsMobileAdminMenuOpen(false); }}
                  className={cn(
                    "flex items-center justify-between w-full p-4 rounded-xl transition-all duration-300",
                    activeTab === 'cnewsletter' ? "bg-aura-lime text-aura-black font-black" : "text-aura-muted hover:text-white hover:bg-white/5 font-bold"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Mail size={18} />
                    <span className="text-[10px] uppercase tracking-widest">Newsletter</span>
                  </div>
                </button>

                <button
                  onClick={() => { handleTabChange('cnotifications'); setIsMobileAdminMenuOpen(false); }}
                  className={cn(
                    "flex items-center justify-between w-full p-4 rounded-xl transition-all duration-300",
                    activeTab === 'cnotifications' ? "bg-aura-lime text-aura-black font-black" : "text-aura-muted hover:text-white hover:bg-white/5 font-bold"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Mail size={18} />
                    <span className="text-[10px] uppercase tracking-widest">Notifications</span>
                  </div>
                </button>

                <button
                  onClick={() => { handleTabChange('ctransactions'); setIsMobileAdminMenuOpen(false); }}
                  className={cn(
                    "flex items-center justify-between w-full p-4 rounded-xl transition-all duration-300",
                    activeTab === 'ctransactions' ? "bg-aura-lime text-aura-black font-black" : "text-aura-muted hover:text-white hover:bg-white/5 font-bold"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <History size={18} />
                    <span className="text-[10px] uppercase tracking-widest">Transactions</span>
                  </div>
                </button>

                <button
                  onClick={() => { handleTabChange('cadverts'); setIsMobileAdminMenuOpen(false); }}
                  className={cn(
                    "flex items-center justify-between w-full p-4 rounded-xl transition-all duration-300",
                    activeTab === 'cadverts' ? "bg-aura-lime text-aura-black font-black" : "text-aura-muted hover:text-white hover:bg-white/5 font-bold"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Megaphone size={18} />
                    <span className="text-[10px] uppercase tracking-widest">Adverts</span>
                  </div>
                </button>

                <button
                  onClick={() => { handleTabChange('csupport_tickets'); setIsMobileAdminMenuOpen(false); }}
                  className={cn(
                    "flex items-center justify-between w-full p-4 rounded-xl transition-all duration-300",
                    activeTab === 'csupport_tickets' ? "bg-aura-lime text-aura-black font-black" : "text-aura-muted hover:text-white hover:bg-white/5 font-bold"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <MessageSquare size={18} />
                    <span className="text-[10px] uppercase tracking-widest">User Support</span>
                  </div>
                  {pendingSupportTicketsCount > 0 && (
                    <span className="px-2 py-0.5 bg-red-500 text-white font-mono font-black text-[9px] rounded-full">
                      {pendingSupportTicketsCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => { handleTabChange('csettings'); setIsMobileAdminMenuOpen(false); }}
                  className={cn(
                    "flex items-center justify-between w-full p-4 rounded-xl transition-all duration-300",
                    activeTab === 'csettings' ? "bg-aura-lime text-aura-black font-black" : "text-aura-muted hover:text-white hover:bg-white/5 font-bold"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Settings size={18} />
                    <span className="text-[10px] uppercase tracking-widest">Settings</span>
                  </div>
                </button>
              </div>

              <div className="pt-6 border-t border-white/5">
                <button
                  onClick={async () => {
                    setIsMobileAdminMenuOpen(false);
                    await logout();
                    navigate('/welcome');
                  }}
                  className="flex items-center gap-3 w-full p-4 rounded-xl text-red-400 hover:bg-red-400/10 transition-all font-bold"
                >
                  <LogOut size={18} />
                  <span className="text-[10px] uppercase tracking-widest">Logout</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 flex flex-col p-6 hidden lg:flex">
        <div className="flex items-center gap-3 mb-12">
          <img src="https://i.imgur.com/nRbbYnS.png" alt="Cipher Terminal Logo" className="w-10 h-10 lg:w-12 lg:h-12 object-contain" />
          <span className="text-sm font-black uppercase tracking-tighter">CIPHER TERMINAL</span>
        </div>

        <nav className="flex-1 space-y-2">
          <SidebarItem icon={<BarChart3 size={18} />} label="Analytics" active={activeTab === 'canalytics'} onClick={() => handleTabChange('canalytics')} />
          <SidebarItem icon={<CreditCard size={18} />} label="Deposits" active={activeTab === 'cdeposits'} onClick={() => handleTabChange('cdeposits')} badge={pendingDepositsUnseenCount} />
          <SidebarItem icon={<ArrowDownLeft size={18} />} label="Withdrawals" active={activeTab === 'cwithdrawals'} onClick={() => handleTabChange('cwithdrawals')} badge={pendingWithdrawalsUnseenCount} />
          <SidebarItem icon={<Zap size={18} />} label="Investments" active={activeTab === 'cinvestments'} onClick={() => handleTabChange('cinvestments')} badge={pendingInvestmentsUnseenCount} />
          <SidebarItem icon={<Cpu size={18} />} label="Mining" active={activeTab === 'cmining'} onClick={() => handleTabChange('cmining')} badge={pendingMiningCount} />
          <SidebarItem icon={<Bot size={18} />} label="AI Marketplace" active={activeTab === 'caimarketplace'} onClick={() => handleTabChange('caimarketplace')} badge={pendingRobotUpgradesCount} />
          <SidebarItem icon={<Users size={18} />} label="Users Control Panel" active={activeTab === 'cuser'} onClick={() => handleTabChange('cuser')} />
          <SidebarItem icon={<UserMinus size={18} />} label="Inactive" active={activeTab === 'cinactiveusers'} onClick={() => handleTabChange('cinactiveusers')} />
          <SidebarItem icon={<IdCard size={18} />} label="KYC Control" active={activeTab === 'ckycs'} onClick={() => handleTabChange('ckycs')} />
          <SidebarItem icon={<ShieldCheck size={18} />} label="Security" active={activeTab === 'csecurity'} onClick={() => handleTabChange('csecurity')} />
          <SidebarItem icon={<TrendingUp size={18} />} label="ROI Plans" active={activeTab === 'cplans'} onClick={() => handleTabChange('cplans')} />
          <SidebarItem icon={<ShieldCheck size={18} />} label="401(k) Details" active={activeTab === 'cretirement'} onClick={() => handleTabChange('cretirement')} />
          <SidebarItem icon={<Landmark size={18} />} label="Loans Management" active={activeTab === 'cloans'} onClick={() => handleTabChange('cloans')} />
          <SidebarItem icon={<BarChart3 size={18} />} label="Securities & Markets" active={activeTab === 'csecurities'} onClick={() => handleTabChange('csecurities')} />
          <SidebarItem icon={<Play size={18} />} label="UI Studio" active={activeTab === 'cui_editor'} onClick={() => handleTabChange('cui_editor')} />
          <SidebarItem icon={<Mail size={18} />} label="Newsletter" active={activeTab === 'cnewsletter'} onClick={() => handleTabChange('cnewsletter')} />
          <SidebarItem icon={<Mail size={18} />} label="Notifications" active={activeTab === 'cnotifications'} onClick={() => handleTabChange('cnotifications')} />
          <SidebarItem icon={<History size={18} />} label="Transactions" active={activeTab === 'ctransactions'} onClick={() => handleTabChange('ctransactions')} />
          <SidebarItem icon={<Coins size={18} />} label="TWN Token" active={activeTab === 'ctwn_token'} onClick={() => handleTabChange('ctwn_token')} badge={pendingTwnCount} />
          <SidebarItem icon={<Megaphone size={18} />} label="Adverts" active={activeTab === 'cadverts'} onClick={() => handleTabChange('cadverts')} />
          <SidebarItem icon={<MessageSquare size={18} />} label="User Support" active={activeTab === 'csupport_tickets'} onClick={() => handleTabChange('csupport_tickets')} badge={pendingSupportTicketsCount} />
          <SidebarItem icon={<Settings size={18} />} label="Settings" active={activeTab === 'csettings'} onClick={() => handleTabChange('csettings')} />
        </nav>

        <div className="pt-6 border-t border-white/5 space-y-2">
          <button 
            onClick={async () => { await logout(); navigate('/welcome'); }}
            className="flex items-center gap-3 w-full p-4 rounded-xl text-red-400 hover:bg-red-400/10 transition-all font-bold"
          >
            <LogOut size={18} />
            <span className="text-[10px] uppercase tracking-widest">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-12 pt-24 lg:pt-12 overflow-y-auto max-h-screen">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl lg:text-3xl font-black tracking-[-0.05em] leading-[0.85] text-white font-serif italic mb-2 capitalize">
              {activeTab === 'cretirement' ? '401(k) Details' : activeTab === 'cloans' ? 'Loans Management' : activeTab === 'csecurities' ? 'Securities & Markets' : activeTab === 'cadverts' ? 'Global Advertising' : (activeTab === 'cuser' || activeTab === 'cinactiveusers') ? 'Users Control Panel' : activeTab.substring(1)}
            </h1>
            <p className="text-aura-muted text-[10px] font-bold uppercase tracking-[0.3em]">System Level Access: root_alpha</p>
          </div>
          <div className="flex items-center gap-4">
             <button onClick={fetchData} className="p-3 bg-white/5 rounded-xl text-aura-muted hover:text-aura-lime transition-all">
                <History size={18} className={loading ? "animate-spin" : ""} />
             </button>
          </div>
        </header>

        {activeTab === 'canalytics' && (
          <div className="space-y-12">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              <StatCard label="Total Users" value={stats.totalUsers.toString()} icon={Users} color="text-blue-400" />
              <StatCard label="Active Investors" value={stats.totalActiveInvestors.toString()} icon={Users} color="text-cyan-400" />
              <StatCard label="Total Assets" value={formatCurrency(stats.totalAssets)} icon={Building2} color="text-teal-400" />
              <StatCard label="Total Deposits" value={formatCurrency(stats.totalDeposits)} icon={CreditCard} color="text-green-400" />
              <StatCard label="Total Withdrawals" value={formatCurrency(stats.totalWithdrawals)} icon={ArrowDownLeft} color="text-red-400" />
              <StatCard label="Available Balance" value={formatCurrency(stats.totalAvailableBalance)} icon={Coins} color="text-indigo-400" />
              <StatCard label="Investment Balance" value={formatCurrency(stats.totalInvested)} icon={Coins} color="text-purple-400" />
              <StatCard label="Active Investments" value={stats.activeNodes.toString()} icon={Zap} color="text-aura-lime" onClick={() => setInvestmentPreviewType('active')} />
              <StatCard label="Inactive Investments" value={stats.inactiveNodes.toString()} icon={Zap} color="text-gray-500" onClick={() => setInvestmentPreviewType('inactive')} />
              <StatCard label="ROI Generated" value={formatCurrency(stats.totalLiveRoiGenerated)} icon={TrendingUp} color="text-amber-400" />
              <StatCard label="Vault Security Alerts" value={stats.securityAlerts.toString()} icon={AlertTriangle} color={stats.securityAlerts > 0 ? "text-red-500" : "text-emerald-500"} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
               {/* LIVE PENDING FEED */}
               <div className="space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-white/5">
                     <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white flex items-center gap-2">
                        <Activity size={18} className="text-aura-lime" /> Pending Protocols
                     </h3>
                     <span className="text-[10px] font-bold text-aura-muted uppercase tracking-widest">{deposits.filter(d => d.status === 'pending').length + withdrawals.filter(w => w.status === 'pending').length} Actions Required</span>
                  </div>
                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-none">
                     {[...deposits, ...withdrawals]
                        .filter(x => x.status === 'pending')
                        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                        .map((item: any) => (
                           <div key={item.id} className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between hover:border-aura-lime/20 transition-all">
                              <div className="flex items-center gap-4">
                                 <div className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center",
                                    item.method ? "bg-green-400/10 text-green-400" : "bg-red-400/10 text-red-400"
                                 )}>
                                    {item.method ? <CreditCard size={18} /> : <ArrowDownLeft size={18} />}
                                 </div>
                                 <div>
                                    <p className="text-xs font-bold text-white uppercase">{item.user_name || 'Anonymous'}</p>
                                    <p className="text-[9px] text-aura-muted uppercase tracking-widest font-bold">
                                       {item.method ? 'Incoming Dep.' : 'Outgoing Wit.'} • {item.method || item.details?.method || 'Direct'}
                                    </p>
                                 </div>
                              </div>
                              <div className="text-right">
                                 <p className="text-lg font-black font-serif italic text-white">{formatCurrency(item.amount)}</p>
                                 <button 
                                    onClick={() => handleTabChange(item.method ? 'cdeposits' : 'cwithdrawals')}
                                    className="text-[8px] font-black uppercase tracking-widest text-aura-lime hover:underline"
                                 >Review Audit</button>
                              </div>
                           </div>
                        ))}
                     {deposits.filter(d => d.status === 'pending').length === 0 && withdrawals.filter(w => w.status === 'pending').length === 0 && (
                        <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[32px]">
                           <ShieldCheck size={32} className="mx-auto text-white/10 mb-2" />
                           <p className="text-[10px] font-black uppercase text-aura-muted tracking-widest">No pending settlements detected.</p>
                        </div>
                     )}
                  </div>
               </div>

               {/* MASTER TRANSACTION FEED */}
               <div className="space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-white/5">
                     <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white flex items-center gap-2">
                        <History size={18} className="text-aura-lime" /> Real-time Feed
                     </h3>
                     <span className="text-[10px] font-bold text-aura-muted uppercase tracking-widest">Global Sequence Alpha</span>
                  </div>
                  <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 scrollbar-none">
                     {transactions.map((tx, idx) => (
                        <div key={`${tx.id}-${idx}`} className="p-4 bg-white/[0.01] border border-white/[0.03] rounded-xl flex items-center justify-between group hover:bg-white/5 transition-all">
                           <div className="flex items-center gap-4">
                              <div className="text-[8px] font-mono text-aura-muted">#{tx.id?.substring(0, 6)}</div>
                              <div>
                                 <p className="text-[10px] font-bold text-white uppercase">{tx.type?.replace(/_/g, ' ')}</p>
                                 <p className="text-[8px] text-aura-muted font-bold uppercase tracking-widest truncate max-w-[150px]">{tx.description || '-'}</p>
                              </div>
                           </div>
                           <div className="text-right">
                              <p className="text-xs font-black text-white">{formatCurrency(tx.amount)}</p>
                              <p className="text-[7px] text-aura-muted uppercase font-black">{new Date(tx.created_at).toLocaleTimeString()}</p>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
               {/* NETWORK PORTFOLIOS (USER QUICK LIST) */}
               <div className="xl:col-span-2 space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-white/5">
                     <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white flex items-center gap-2">
                        <Users size={18} className="text-aura-lime" /> Network Identities
                     </h3>
                     <button onClick={() => handleTabChange('cuser')} className="text-[9px] font-black uppercase tracking-widest text-aura-lime hover:underline">View Mapping</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {users.slice(0, 6).map(u => (
                        <div key={u.id} className="p-5 bg-white/5 border border-white/5 rounded-3xl flex items-center justify-between group cursor-pointer hover:border-aura-lime/30 transition-all" onClick={() => { setSelectedUser(u); setActiveTab('cuser'); setIsDetailView(true); }}>
                           <div className="flex items-center gap-4">
                              {u.photoURL ? (
                                 <img src={u.photoURL} alt="" className="w-10 h-10 rounded-xl object-cover" />
                              ) : (
                                 <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-aura-lime font-black text-xs">{u.name?.[0]}</div>
                              )}
                              <div>
                                 <p className="text-xs font-black uppercase truncate max-w-[120px]">{u.name}</p>
                                 <p className="text-[8px] text-aura-muted font-bold uppercase tracking-widest">{formatCurrency(u.available_balance || 0)} Liquid</p>
                              </div>
                           </div>
                           <ChevronRight size={14} className="text-aura-muted group-hover:text-aura-lime transition-all" />
                        </div>
                     ))}
                  </div>
               </div>

               {/* RECENT NODE INVESTMENTS */}
               <div className="space-y-6">
                  {/* INVESTMENT PLAN ACTIVITY TRACKING */}
                  <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl space-y-4">
                     <div className="flex items-center justify-between pb-2 border-b border-white/5">
                        <h3 className="text-xs font-black uppercase tracking-[0.15em] text-white flex items-center gap-2">
                           <Activity size={16} className="text-aura-lime" /> Plan Activity Allocation
                        </h3>
                        <span className="text-[8px] font-bold text-aura-muted uppercase tracking-widest">Real-time</span>
                     </div>
                     <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-white/[0.01] border border-white/[0.03] rounded-2xl hover:bg-white/5 transition-all">
                           <span className="text-xs font-bold text-white uppercase tracking-wider">Regular Plan</span>
                           <span className="text-[11px] font-mono font-black text-aura-lime bg-aura-lime/5 px-2.5 py-1 rounded-lg border border-aura-lime/10">{stats.activeRegularCount} Active</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-white/[0.01] border border-white/[0.03] rounded-2xl hover:bg-white/5 transition-all">
                           <span className="text-xs font-bold text-white uppercase tracking-wider">Premium Plan</span>
                           <span className="text-[11px] font-mono font-black text-aura-lime bg-aura-lime/5 px-2.5 py-1 rounded-lg border border-aura-lime/10">{stats.activePremiumCount} Active</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-white/[0.01] border border-white/[0.03] rounded-2xl hover:bg-white/5 transition-all">
                           <span className="text-xs font-bold text-white uppercase tracking-wider">Elite Plan</span>
                           <span className="text-[11px] font-mono font-black text-aura-lime bg-aura-lime/5 px-2.5 py-1 rounded-lg border border-aura-lime/10">{stats.activeEliteCount} Active</span>
                        </div>
                     </div>
                  </div>

                  <div className="flex items-center justify-between pb-4 border-b border-white/5">
                     <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white flex items-center gap-2">
                        <Zap size={18} className="text-aura-lime" /> Active Nodes
                     </h3>
                     <button onClick={() => handleTabChange('cinvestments')} className="text-[9px] font-black uppercase tracking-widest text-aura-lime hover:underline">Sync All</button>
                  </div>
                  <div className="space-y-3">
                     {investments
                        .filter(i => i.status === 'active')
                        .slice(0, 5)
                        .map(inv => (
                        <div key={inv.id} className="p-4 bg-aura-lime/5 border border-aura-lime/10 rounded-2xl flex items-center justify-between">
                           <div className="flex items-center gap-3">
                              <bot className="w-8 h-8 rounded-lg bg-aura-lime flex items-center justify-center text-aura-black"><Zap size={14} /></bot>
                              <div>
                                 <p className="text-[10px] font-black uppercase text-white truncate max-w-[100px]">{inv.user_name || 'Anon'}</p>
                                 <p className="text-[8px] text-aura-lime font-black uppercase tracking-widest">{inv.plan_name}</p>
                              </div>
                           </div>
                           <p className="text-xs font-black text-white italic font-serif">{formatCurrency(inv.amount)}</p>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'cdeposits' && (
          <div className="space-y-8">
            <div className="flex bg-white/5 p-1 rounded-2xl w-fit border border-white/5">
               {['all', 'pending', 'approved', 'rejected'].map((f) => (
                 <button 
                   key={f}
                   onClick={() => setDepositFilter(f as any)}
                   className={cn(
                     "px-6 py-2 rounded-xl text-[10px] uppercase font-black tracking-widest transition-all",
                     depositFilter === f ? "bg-white/10 text-white" : "text-aura-muted hover:text-white"
                   )}
                 >
                   {f}
                 </button>
               ))}
            </div>

            <div className="bg-white/5 border border-white/5 rounded-[40px] overflow-hidden overflow-x-auto">
              <table className="w-full text-left min-w-[1000px] border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.01]">
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-aura-muted">User ID</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-aura-muted">Full Name</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-aura-muted">Email</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-aura-muted">Amount</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-aura-muted">Type</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-aura-muted">Status</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-aura-muted">Date/Time</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-aura-muted">Method / Plan</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-aura-muted text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.02]">
                  {deposits
                    .filter((dep: any) => !dep.is_mining_subscription && !dep.is_robot_upgrade)
                    .filter((dep: any) => {
                      if (depositFilter === 'all') return true;
                      if (depositFilter === 'pending') return dep.status === 'pending';
                      if (depositFilter === 'approved') return dep.status === 'approved';
                      if (depositFilter === 'rejected') return dep.status === 'declined' || dep.status === 'rejected';
                      return true;
                    })
                    .map((dep: any) => {
                      const u = getUserDetails(dep.user_id, dep.user_name);
                      return (
                        <tr 
                          key={dep.id} 
                          className="group hover:bg-white/[0.02] transition-colors cursor-pointer text-white"
                          onClick={() => { setSelectedTicket(dep); setTicketType('deposit'); }}
                        >
                          <td className="px-6 py-4 font-mono text-[10px] text-gray-400">
                            <span className="truncate max-w-[80px] block" title={u.id}>{u.id}</span>
                          </td>
                          <td className="px-6 py-4 text-xs font-bold uppercase truncate max-w-[120px]">{u.name}</td>
                          <td className="px-6 py-4 text-xs text-aura-muted truncate max-w-[150px]">{u.email}</td>
                          <td className="px-6 py-4 text-sm font-black font-serif italic">{formatCurrency(dep.amount || 0)}</td>
                          <td className="px-6 py-4">
                            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Deposit</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={cn("text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded", 
                              dep.status === 'pending' ? "bg-yellow-400/10 text-yellow-500" :
                              dep.status === 'approved' ? "bg-aura-lime/10 text-aura-lime" : "bg-red-400/10 text-red-100"
                            )}>{dep.status}</span>
                          </td>
                          <td className="px-6 py-4 text-[10px] text-gray-400">
                            {dep.created_at ? new Date(dep.created_at).toLocaleString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-xs uppercase font-black tracking-wider text-aura-muted">{dep.method || 'Standard'}</td>
                          <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                            {dep.status === 'pending' ? (
                              <div className="flex gap-2 justify-end">
                                <button onClick={() => declineDeposit(dep.id)} className="p-2 bg-red-400/10 text-red-400 hover:bg-red-400 hover:text-white rounded-lg transition-all" title="Decline"><XCircle size={16} /></button>
                                <button onClick={() => approveDeposit(dep)} className="p-2 bg-aura-lime/10 text-aura-lime hover:bg-aura-lime hover:text-aura-black rounded-lg transition-all" title="Approve"><CheckCircle size={16} /></button>
                              </div>
                            ) : (
                              <span className="text-[10px] font-bold text-gray-500 uppercase">Processed</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'cmining' && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex bg-white/5 p-1 rounded-2xl w-fit border border-white/5">
               {['all', 'pending', 'approved', 'rejected'].map((f) => (
                 <button 
                   key={f}
                   onClick={() => setMiningFilter(f as any)}
                   className={cn(
                     "px-6 py-2 rounded-xl text-[10px] uppercase font-black tracking-widest transition-all",
                     miningFilter === f ? "bg-white/10 text-white" : "text-aura-muted hover:text-white"
                   )}
                 >
                   {f}
                 </button>
               ))}
            </div>

            <div className="bg-white/5 border border-white/5 rounded-[40px] overflow-hidden overflow-x-auto">
              <table className="w-full text-left min-w-[1000px] border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.01]">
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-aura-muted">User ID</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-aura-muted">Full Name</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-aura-muted">Username</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-aura-muted">Email</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-aura-muted">Requested Miner</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-aura-muted">Upgrade Amount</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-aura-muted">Date/Time</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-aura-muted">Status</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-aura-muted text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.02]">
                  {miningUpgrades
                    .filter((dep: any) => {
                      if (miningFilter === 'all') return true;
                      if (miningFilter === 'pending') return dep.status === 'pending';
                      if (miningFilter === 'approved') return dep.status === 'approved' || dep.status === 'inactive' || dep.status === 'mining' || dep.status === 'completed';
                      if (miningFilter === 'rejected') return dep.status === 'declined' || dep.status === 'rejected';
                      return true;
                    })
                    .map((dep: any) => {
                      const u = getUserDetails(dep.user_id, dep.user_name);
                      const matchedUser = users.find((usr: any) => usr?.id === dep.user_id);
                      const usernameVal = matchedUser?.username || 'n/a';
                      const isApproved = dep.status === 'approved' || dep.status === 'inactive' || dep.status === 'mining' || dep.status === 'completed';
                      return (
                        <tr 
                          key={dep.id} 
                          className="group hover:bg-white/[0.02] transition-colors cursor-pointer text-white"
                          onClick={() => { setSelectedTicket(dep); setTicketType('mining_upgrade'); }}
                        >
                          <td className="px-6 py-4 font-mono text-[10px] text-gray-400">
                            <span className="truncate max-w-[80px] block" title={dep.user_id}>{dep.user_id}</span>
                          </td>
                          <td className="px-6 py-4 text-xs font-bold uppercase truncate max-w-[120px]">{u.name}</td>
                          <td className="px-6 py-4 text-xs text-aura-lime font-mono truncate max-w-[100px]">@{usernameVal}</td>
                          <td className="px-6 py-4 text-xs text-aura-muted truncate max-w-[150px]">{u.email}</td>
                          <td className="px-6 py-4 text-xs font-black uppercase tracking-wider text-white truncate max-w-[180px]">{dep.machine_name || 'ASIC Miner'}</td>
                          <td className="px-6 py-4 text-sm font-black font-serif italic">{formatCurrency(dep.amount || dep.machine_price || 0)}</td>
                          <td className="px-6 py-4 text-[10px] text-gray-400">
                            {dep.created_at ? new Date(dep.created_at).toLocaleString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4">
                            <span className={cn("text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded", 
                              dep.status === 'pending' ? "bg-yellow-400/10 text-yellow-500" :
                              isApproved ? "bg-aura-lime/10 text-aura-lime" : "bg-red-400/10 text-red-100"
                            )}>{dep.status}</span>
                          </td>
                          <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                            {dep.status === 'pending' ? (
                              <div className="flex gap-2 justify-end">
                                <button onClick={() => declineMiningUpgrade(dep.id, dep.user_id, dep.machine_name || 'ASIC Miner')} className="p-2 bg-red-400/10 text-red-400 hover:bg-red-400 hover:text-white rounded-lg transition-all" title="Decline"><XCircle size={16} /></button>
                                <button onClick={() => approveMiningUpgrade(dep)} className="p-2 bg-aura-lime/10 text-aura-lime hover:bg-aura-lime hover:text-aura-black rounded-lg transition-all" title="Approve"><CheckCircle size={16} /></button>
                              </div>
                            ) : (
                              <span className="text-[10px] font-bold text-gray-500 uppercase">Processed</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'caimarketplace' && (
          <div className="space-y-8 animate-fade-in">
            {/* AI Marketplace Page Settings */}
            <div className="p-8 bg-white/5 border border-white/5 rounded-[40px] space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Wallet size={16} className="text-aura-lime" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-aura-lime">
                      AI Marketplace Page Settings
                    </span>
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">
                    Wallet Upgrade Payment
                  </h3>
                  <p className="text-xs text-aura-muted font-bold uppercase tracking-wider leading-relaxed">
                    Enable or disable wallet payments for AI Bot upgrades across the application.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    const nextVal = !enableWalletUpgradePayment;
                    setEnableWalletUpgradePayment(nextVal);
                    await updateEnableWalletUpgradePayment(nextVal);
                  }}
                  className={cn(
                    "px-6 py-2.5 rounded-xl text-[10px] uppercase font-black tracking-widest transition-all cursor-pointer select-none",
                    enableWalletUpgradePayment 
                      ? "bg-aura-lime text-aura-black shadow-[0_4px_12px_rgba(163,230,53,0.3)] hover:bg-lime-400" 
                      : "bg-white/5 text-aura-muted border border-white/10 hover:bg-white/10"
                  )}
                >
                  {enableWalletUpgradePayment ? "ON" : "OFF"}
                </button>
              </div>
            </div>

            <div className="flex bg-white/5 p-1 rounded-2xl w-fit border border-white/5">
               {['all', 'pending', 'approved', 'rejected'].map((f) => (
                 <button 
                   key={f}
                   onClick={() => setAiMarketplaceFilter(f as any)}
                   className={cn(
                     "px-6 py-2 rounded-xl text-[10px] uppercase font-black tracking-widest transition-all",
                     aiMarketplaceFilter === f ? "bg-white/10 text-white" : "text-aura-muted hover:text-white"
                   )}
                 >
                   {f}
                 </button>
               ))}
            </div>

            <div className="bg-white/5 border border-white/5 rounded-[40px] overflow-hidden overflow-x-auto">
              <table className="w-full text-left min-w-[1000px] border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.01]">
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-aura-muted">User</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-aura-muted">User ID</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-aura-muted">Selected AI Bot</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-aura-muted">Amount</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-aura-muted">Transaction ID</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-aura-muted">Date</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-aura-muted">Status</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-aura-muted text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.02]">
                  {aiUpgrades
                    .filter((tx: any) => {
                      const statusLower = (tx.status || '').toLowerCase();
                      if (aiMarketplaceFilter === 'all') return true;
                      if (aiMarketplaceFilter === 'pending') return statusLower === 'pending';
                      if (aiMarketplaceFilter === 'approved') return statusLower === 'active' || statusLower === 'approved';
                      if (aiMarketplaceFilter === 'rejected') return statusLower === 'rejected' || statusLower === 'declined';
                      return true;
                    })
                    .map((tx: any) => {
                      const u = getUserDetails(tx.user_id, tx.user_name);
                      const matchedUser = users.find((usr: any) => usr?.id === tx.user_id);
                      const usernameVal = matchedUser?.username || 'n/a';
                      const statusLower = (tx.status || '').toLowerCase();
                      const isPending = statusLower === 'pending';
                      const isActive = statusLower === 'active' || statusLower === 'approved';
                      const isRejected = statusLower === 'rejected' || statusLower === 'declined';
                      
                      let statusBadge = "Pending";
                      let statusBadgeColor = "bg-orange-500/10 text-orange-500 border border-orange-500/20";
                      if (isActive) {
                        statusBadge = "Active";
                        statusBadgeColor = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
                      } else if (isRejected) {
                        statusBadge = "Rejected";
                        statusBadgeColor = "bg-red-500/10 text-red-400 border border-red-500/20";
                      }

                      return (
                        <tr 
                          key={tx.id} 
                          className="group hover:bg-white/[0.02] transition-colors cursor-pointer text-white"
                        >
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-xs font-bold uppercase">{u.name}</span>
                              <span className="text-[10px] text-aura-lime font-mono">@{usernameVal}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-mono text-[10px] text-gray-400">
                            <span className="truncate max-w-[80px] block" title={tx.user_id}>{tx.user_id}</span>
                          </td>
                          <td className="px-6 py-4 text-xs font-black uppercase tracking-wider text-cyan-400 truncate max-w-[180px]">
                            {tx.robot_name || tx.selected_bot || 'AI Bot'}
                          </td>
                          <td className="px-6 py-4 text-sm font-black font-serif italic">{formatCurrency(tx.amount || 0)}</td>
                          <td className="px-6 py-4 font-mono text-[10px] text-gray-400">
                            <span className="truncate max-w-[100px] block" title={tx.reference || tx.id}>{tx.reference || tx.id}</span>
                          </td>
                          <td className="px-6 py-4 text-[10px] text-gray-400">
                            {tx.created_at ? new Date(tx.created_at).toLocaleString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4">
                            <span className={cn("text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded", statusBadgeColor)}>
                              {statusBadge}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                            {isPending ? (
                              <div className="flex gap-2 justify-end">
                                <button onClick={() => rejectAiUpgrade(tx.id)} className="p-2 bg-red-400/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-all" title="Reject"><X size={16} /></button>
                                <button onClick={() => approveAiUpgrade(tx)} className="p-2 bg-aura-lime/10 text-aura-lime hover:bg-emerald-500/20 rounded-lg transition-all" title="Approve"><CheckCircle size={16} /></button>
                              </div>
                            ) : (
                              <span className="text-[10px] font-bold text-gray-500 uppercase text-aura-muted">Processed</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'cwithdrawals' && (
          <div className="space-y-8">
            <div className="flex bg-white/5 p-1 rounded-2xl w-fit border border-white/5">
               {['all', 'pending', 'approved', 'rejected'].map((f) => (
                 <button 
                   key={f}
                   onClick={() => setWithdrawalFilter(f as any)}
                   className={cn(
                     "px-6 py-2 rounded-xl text-[10px] uppercase font-black tracking-widest transition-all",
                     withdrawalFilter === f ? "bg-white/10 text-white" : "text-aura-muted hover:text-white"
                   )}
                 >
                   {f}
                 </button>
               ))}
            </div>

            <div className="bg-white/5 border border-white/5 rounded-[40px] overflow-hidden overflow-x-auto">
              <table className="w-full text-left min-w-[1000px] border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.01]">
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-aura-muted">User ID</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-aura-muted">Full Name</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-aura-muted">Email</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-aura-muted">Amount</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-aura-muted">Type</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-aura-muted">Status</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-aura-muted">Date/Time</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-aura-muted">Method / Plan Details</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-aura-muted text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.02]">
                  {withdrawals
                    .filter((wit: any) => {
                      if (withdrawalFilter === 'all') return true;
                      if (withdrawalFilter === 'pending') return wit.status === 'pending';
                      if (withdrawalFilter === 'approved') return wit.status === 'approved';
                      if (withdrawalFilter === 'rejected') return wit.status === 'declined' || wit.status === 'rejected';
                      return true;
                    })
                    .map((wit: any) => {
                      const u = getUserDetails(wit.user_id, wit.user_name);
                      return (
                        <tr 
                          key={wit.id} 
                          className="group hover:bg-white/[0.02] transition-colors cursor-pointer text-white"
                          onClick={() => { setSelectedTicket(wit); setTicketType('withdrawal'); }}
                        >
                          <td className="px-6 py-4 font-mono text-[10px] text-gray-400">
                            <span className="truncate max-w-[80px] block" title={u.id}>{u.id}</span>
                          </td>
                          <td className="px-6 py-4 text-xs font-bold uppercase truncate max-w-[120px]">{u.name}</td>
                          <td className="px-6 py-4 text-xs text-aura-muted truncate max-w-[150px]">{u.email}</td>
                          <td className="px-6 py-4 text-sm font-black font-serif italic">{formatCurrency(wit.amount || 0)}</td>
                          <td className="px-6 py-4">
                            <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Withdrawal</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={cn("text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded", 
                              wit.status === 'pending' ? "bg-yellow-400/10 text-yellow-500" :
                              wit.status === 'approved' ? "bg-aura-lime/10 text-aura-lime" : "bg-red-400/10 text-red-100"
                            )}>{wit.status}</span>
                          </td>
                          <td className="px-6 py-4 text-[10px] text-gray-400">
                            {wit.created_at ? new Date(wit.created_at).toLocaleString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-xs" onClick={(e) => e.stopPropagation()}>
                            {wit.method === 'bank' ? (
                              <div className="space-y-1 py-1 max-w-[280px]">
                                <div className="flex items-center gap-2">
                                  <span className="text-[8px] font-black bg-blue-400/10 text-blue-400 border border-blue-400/15 px-1.5 py-0.5 rounded-md">Fiat</span>
                                  <span className="font-bold uppercase text-[10px]">{wit.details?.bankName || 'Bank'}</span>
                                </div>
                                <div className="text-[10px] text-aura-muted flex items-center gap-1.5 font-mono">
                                  <span>{wit.details?.accNum || 'N/A'}</span>
                                  <button 
                                    onClick={() => {
                                      navigator.clipboard.writeText(wit.details?.accNum || '');
                                      toast.success("Account copied");
                                    }}
                                    className="hover:text-aura-lime text-gray-500 hover:scale-105 transition-all"
                                  >
                                    <Copy size={10} />
                                  </button>
                                </div>
                                <div className="text-[9px] text-gray-500 italic max-w-[200px] truncate">{wit.details?.accName || 'N/A'}</div>
                              </div>
                            ) : (
                              <div className="space-y-1 py-1 max-w-[280px]">
                                <div className="flex items-center gap-2">
                                  <span className="text-[8px] font-black bg-purple-400/10 text-purple-400 border border-purple-400/15 px-1.5 py-0.5 rounded-md">Cyber</span>
                                  <span className="font-bold uppercase text-[10px]">{wit.details?.type?.toUpperCase() || 'USDT'}</span>
                                </div>
                                <div className="text-[10px] text-aura-muted flex items-center gap-1.5 font-mono animate-fade-in">
                                  <span className="truncate max-w-[124px]" title={wit.details?.address}>{wit.details?.address || 'N/A'}</span>
                                  <button 
                                    onClick={() => {
                                      navigator.clipboard.writeText(wit.details?.address || '');
                                      toast.success("Address copied");
                                    }}
                                    className="hover:text-aura-lime text-gray-500 hover:scale-105 transition-all"
                                  >
                                    <Copy size={10} />
                                  </button>
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                            {wit.status === 'pending' ? (
                              <div className="flex gap-2 justify-end">
                                <button onClick={() => declineWithdrawal(wit)} className="p-2 bg-red-400/10 text-red-400 hover:bg-red-400 hover:text-white rounded-lg transition-all" title="Decline"><XCircle size={16} /></button>
                                <button onClick={() => approveWithdrawal(wit)} className="p-2 bg-aura-lime/10 text-aura-lime hover:bg-aura-lime hover:text-aura-black rounded-lg transition-all" title="Approve"><CheckCircle size={16} /></button>
                              </div>
                            ) : (
                              <span className="text-[10px] font-bold text-gray-500 uppercase">Processed</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'cinvestments' && (
          <div className="space-y-8">
            <div className="flex bg-white/5 p-1 rounded-2xl w-fit border border-white/5">
               {['all', 'pending', 'approved', 'rejected'].map((f) => (
                 <button 
                   key={f}
                   onClick={() => setInvestFilter(f as any)}
                   className={cn(
                     "px-6 py-2 rounded-xl text-[10px] uppercase font-black tracking-widest transition-all",
                     investFilter === f ? "bg-white/10 text-white" : "text-aura-muted hover:text-white"
                   )}
                 >
                   {f}
                 </button>
               ))}
            </div>

            <div className="bg-white/5 border border-white/5 rounded-[40px] overflow-hidden overflow-x-auto">
              <table className="w-full text-left min-w-[1000px] border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.01]">
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-aura-muted">User ID</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-aura-muted">Full Name</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-aura-muted">Email</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-aura-muted">Amount</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-aura-muted">Type</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-aura-muted">Status</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-aura-muted">Date/Time</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-aura-muted">Method / Plan</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-aura-muted text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.02]">
                  {investments
                    .filter(inv => {
                      if (investFilter === 'all') return true;
                      if (investFilter === 'pending') return inv.status === 'pending';
                      if (investFilter === 'approved') return inv.status === 'inactive' || inv.status === 'active' || inv.status === 'completed';
                      if (investFilter === 'rejected') return inv.status === 'rejected';
                      return true;
                    })
                    .map((inv: any) => {
                      const u = getUserDetails(inv.user_id, inv.user_name);
                      return (
                        <tr 
                          key={inv.id} 
                          className="group hover:bg-white/[0.02] transition-colors cursor-pointer text-white"
                          onClick={() => { setSelectedTicket(inv); setTicketType('investment'); }}
                        >
                          <td className="px-6 py-4 font-mono text-[10px] text-gray-400">
                            <span className="truncate max-w-[80px] block" title={u.id}>{u.id}</span>
                          </td>
                          <td className="px-6 py-4 text-xs font-bold uppercase truncate max-w-[120px]">{u.name}</td>
                          <td className="px-6 py-4 text-xs text-aura-muted truncate max-w-[150px]">{u.email}</td>
                          <td className="px-6 py-4 text-sm font-black font-serif italic">{formatCurrency(inv.amount || 0)}</td>
                          <td className="px-6 py-4">
                            <span className="text-[10px] font-bold text-aura-lime uppercase tracking-widest">Investment</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={cn("text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded", 
                               inv.status === 'active' ? "bg-aura-lime/10 text-aura-lime" : 
                               inv.status === 'inactive' ? "bg-blue-400/10 text-blue-400" :
                               inv.status === 'rejected' ? "bg-red-400/10 text-red-400" :
                               "bg-white/10 text-aura-muted"
                            )}>{inv.status}</span>
                          </td>
                          <td className="px-6 py-4 text-[10px] text-gray-400">
                            {inv.created_at ? new Date(inv.created_at).toLocaleString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-xs uppercase font-black tracking-wider text-aura-lime">
                            {inv.plan_name || 'Regular'} Node
                          </td>
                          <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex gap-4 justify-end">
                              {inv.status === 'pending' && (
                                <>
                                  <button onClick={() => rejectInvestment(inv.id)} className="text-[10px] font-black uppercase tracking-widest text-red-400 hover:underline">Reject</button>
                                  <button onClick={() => approveInvestment(inv)} className="text-[10px] font-black uppercase tracking-widest text-aura-lime hover:underline">Approve</button>
                                </>
                              )}
                              {(inv.status === 'active' || inv.status === 'inactive') && (
                                 <button onClick={() => stopInvestment(inv)} className="text-[10px] font-black uppercase tracking-widest text-red-400 hover:underline">Stop</button>
                              )}
                              {inv.status === 'completed' && (
                                <span className="text-[10px] text-gray-500 uppercase font-black">Completed</span>
                              )}
                              {inv.status === 'rejected' && (
                                <span className="text-[10px] text-red-500 uppercase font-black">Rejected</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {(activeTab === 'cuser' || activeTab === 'cinactiveusers') && (
          <div className="space-y-8 pb-20">
            {/* TOP SUB-TAB NAVIGATION BAR */}
            <div className="border-b border-white/5 pb-4 mb-2">
              {/* Desktop version */}
              <div className="hidden md:flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/5 w-fit">
                {[
                  { id: 'new_registrations', label: 'New Registrations', icon: <UserPlus size={14} /> },
                  { id: 'users_dashboard', label: 'Users Dashboard', icon: <Users size={14} /> },
                  { id: 'activities_engine', label: 'Users Activities Engine', icon: <Activity size={14} /> },
                  { id: 'roi_engine', label: 'Users ROI Engine', icon: <Zap size={14} /> }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setUsersSubTab(tab.id as any);
                      setIsDetailView(false);
                      setFocusedActivityUserId(null);
                    }}
                    className={cn(
                      "px-6 py-2.5 rounded-xl text-[10px] uppercase font-black tracking-widest transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer select-none",
                      usersSubTab === tab.id 
                        ? "bg-aura-lime text-aura-black shadow-[0_4px_12px_rgba(168,251,60,0.2)]" 
                        : "text-aura-muted hover:text-white hover:bg-white/5"
                    )}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Mobile responsive dropdown */}
              <div className="block md:hidden">
                <label className="text-[9px] font-black uppercase text-aura-muted tracking-widest mb-2 block">Choose Users Category Tab</label>
                <div className="relative">
                  <select
                    value={usersSubTab}
                    onChange={(e) => {
                      setUsersSubTab(e.target.value as any);
                      setIsDetailView(false);
                      setFocusedActivityUserId(null);
                    }}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4.5 px-5 text-xs font-black uppercase tracking-widest text-white outline-none appearance-none cursor-pointer"
                  >
                    <option value="new_registrations" className="bg-[#090b10] text-white">New Registrations</option>
                    <option value="users_dashboard" className="bg-[#090b10] text-white">Users Dashboard (All / Active / Inactive / Suspended / Banned)</option>
                    <option value="activities_engine" className="bg-[#090b10] text-white">Users Activities Engine</option>
                    <option value="roi_engine" className="bg-[#090b10] text-white">Users ROI Engine</option>
                  </select>
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-white/50">
                    <ChevronRight size={16} className="rotate-90" />
                  </div>
                </div>
              </div>
            </div>

            {!isDetailView ? (
              <div className="space-y-12">
                
                {/* SECTION 1 — NEW REGISTRATIONS */}
                {usersSubTab === 'new_registrations' && (
                  <div className="space-y-6 animate-fade-in pb-10">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-white/5">
                      <div>
                        <h2 className="text-lg font-black uppercase tracking-[0.2em] text-white flex items-center gap-2">
                          <UserPlus size={20} className="text-aura-lime animate-pulse" /> New Registrations
                        </h2>
                        <p className="text-[9px] text-aura-muted uppercase tracking-widest mt-1">Real-time chronicle of newly registered terminal identities</p>
                      </div>
                      <span className="text-[9px] font-black uppercase text-aura-muted tracking-widest bg-white/5 px-2.5 py-1 rounded">Live Stream</span>
                    </div>

                    <div className="space-y-4">
                      {newlyRegisteredUsers.length === 0 ? (
                        <div className="p-12 text-center text-xs font-bold uppercase text-aura-muted tracking-widest bg-white/[0.01] border border-white/5 rounded-3xl">
                          No registered users found
                        </div>
                      ) : (
                        newlyRegisteredUsers.map((u: any) => {
                          const authStatus = u.banned ? 'Banned' : u.suspended ? 'Suspended' : 'Verified';
                          const joinedDate = u.created_at || u.joined_at;
                          return (
                            <div 
                              key={u.id}
                              onClick={() => {
                                setSelectedRegUser(u);
                                // Pre-fetch devices as well
                                setUserDevices([]);
                                const fetchUDecs = async () => {
                                  try {
                                    const snap = await getDocs(collection(db, `users/${u.id}/devices`));
                                    setUserDevices(snap.docs.map(d => d.data()));
                                  } catch (e) {
                                    console.error(e);
                                  }
                                };
                                fetchUDecs();
                              }}
                              className="p-5 bg-[#090b10] hover:bg-white/[0.02] border border-white/5 hover:border-aura-lime/30 rounded-2xl transition-all cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group"
                            >
                              <div className="flex items-center gap-4 min-w-0 flex-1">
                                <div className="w-12 h-12 rounded-xl bg-aura-lime/5 border border-aura-lime/10 flex items-center justify-center font-black text-sm text-aura-lime shrink-0">
                                  {u.name?.[0]?.toUpperCase() || 'U'}
                                </div>
                                <div className="min-w-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-1 flex-1">
                                  <div className="min-w-0">
                                    <p className="text-[8px] font-black text-aura-muted uppercase tracking-widest">Full Name</p>
                                    <h4 className="text-xs font-bold text-white truncate">{u.name || 'Anonymous'}</h4>
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-[8px] font-black text-aura-muted uppercase tracking-widest">Email Address</p>
                                    <p className="text-xs font-semibold text-white/80 truncate font-mono">{u.email}</p>
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-[8px] font-black text-aura-muted uppercase tracking-widest">Username</p>
                                    <p className="text-xs font-semibold text-white/80 truncate">@{u.username || u.name?.toLowerCase().replace(/\s+/g, '_') || 'user'}</p>
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-[8px] font-black text-aura-muted uppercase tracking-widest">UID</p>
                                    <p className="text-xs font-semibold text-white/50 truncate font-mono">{u.id}</p>
                                  </div>
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-6 justify-between md:justify-end shrink-0 w-full md:w-auto pt-3 md:pt-0 border-t border-white/[0.02] md:border-0 font-bold">
                                <div>
                                  <p className="text-[8px] font-black text-aura-muted uppercase tracking-widest md:text-right">Referral Code</p>
                                  <p className="text-xs font-mono font-black text-aura-lime md:text-right">{u.referral_code || '---'}</p>
                                </div>
                                <div>
                                  <p className="text-[8px] font-black text-aura-muted uppercase tracking-widest md:text-right">Registered On</p>
                                  <p className="text-xs font-sans font-bold text-white md:text-right">
                                    {joinedDate ? new Date(joinedDate).toLocaleDateString() : 'Recent'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[8px] font-black text-aura-muted uppercase tracking-widest md:text-right">Auth Status</p>
                                  <span className={cn(
                                    "text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded block text-center mt-1",
                                    authStatus === 'Banned' ? 'bg-red-500/10 text-red-500' : authStatus === 'Suspended' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-aura-lime/10 text-aura-lime'
                                  )}>
                                    {authStatus}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* REGISTRATION POPUP MODAL (Excludes all financial data metrics) */}
                    {selectedRegUser && (
                      <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
                        <div className="bg-[#090b10] border border-white/10 p-6 sm:p-8 rounded-[40px] w-full max-w-xl relative animate-scale-in space-y-6">
                          <button 
                            type="button"
                            onClick={() => setSelectedRegUser(null)}
                            className="absolute top-6 right-6 p-2 bg-white/5 border border-white/5 text-aura-muted hover:text-white rounded-xl transition-all cursor-pointer"
                          >
                            <X size={16} />
                          </button>

                          <div>
                            <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 bg-[#a855f7]/10 text-[#a855f7] rounded-full border border-[#a855f7]/20">
                              System Registry Audit Signature
                            </span>
                            <h3 className="text-xl font-black font-serif italic text-white mt-3">Identity Registration profile</h3>
                            <p className="text-[9px] text-aura-muted uppercase tracking-wide">Terminal hardware, authentication status, and indexing parameters</p>
                          </div>

                          <div className="space-y-4 divide-y divide-white/[0.04]">
                            <div className="grid grid-cols-2 gap-4 pt-1 text-white">
                              <div>
                                <p className="text-[8px] font-black text-aura-muted uppercase tracking-widest">Full Registered Name</p>
                                <p className="text-xs font-bold">{selectedRegUser.name || 'Anonymous'}</p>
                              </div>
                              <div>
                                <p className="text-[8px] font-black text-aura-muted uppercase tracking-widest">Email Address</p>
                                <p className="text-xs font-mono font-bold truncate">{selectedRegUser.email}</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-4 text-white">
                              <div>
                                <p className="text-[8px] font-black text-aura-muted uppercase tracking-widest">Chosen Username</p>
                                <p className="text-xs font-bold">@{selectedRegUser.username || selectedRegUser.name?.toLowerCase().replace(/\s+/g, '_') || 'user'}</p>
                              </div>
                              <div>
                                <p className="text-[8px] font-black text-aura-muted uppercase tracking-widest">Firestore uid Node</p>
                                <p className="text-xs font-mono text-aura-lime font-black truncate">{selectedRegUser.id}</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-4 text-white">
                              <div>
                                <p className="text-[8px] font-black text-aura-muted uppercase tracking-widest">Global Dashboard user ID</p>
                                <p className="text-xs font-mono font-bold">{selectedRegUser.id?.substring(0, 12).toUpperCase()}</p>
                              </div>
                              <div>
                                <p className="text-[8px] font-black text-aura-muted uppercase tracking-widest">Registration Timestamp</p>
                                <p className="text-xs font-mono font-bold">
                                  {selectedRegUser.created_at || selectedRegUser.joined_at 
                                    ? new Date(selectedRegUser.created_at || selectedRegUser.joined_at).toUTCString() 
                                    : 'N/A'
                                  }
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-4 text-white">
                              <div>
                                <p className="text-[8px] font-black text-aura-muted uppercase tracking-widest">Self Referral Code</p>
                                <p className="text-xs font-mono text-[#a855f7] font-black">{selectedRegUser.referral_code || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-[8px] font-black text-aura-muted uppercase tracking-widest">Referred By Code / Origin</p>
                                <p className="text-xs font-mono text-[#a855f7] font-black">{selectedRegUser.referred_by || 'Organic sign-up'}</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-4 text-white">
                              <div>
                                <p className="text-[8px] font-black text-aura-muted uppercase tracking-widest">Authentication Profile Level</p>
                                <span className={cn(
                                  "text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded w-fit block mt-1",
                                  selectedRegUser.banned ? 'bg-red-500/10 text-red-500' : selectedRegUser.suspended ? 'bg-yellow-500/10 text-yellow-500' : 'bg-aura-lime/10 text-aura-lime'
                                )}>
                                  {selectedRegUser.banned ? 'Banned' : selectedRegUser.suspended ? 'Suspended' : 'Verified Client'}
                                </span>
                              </div>
                              <div>
                                <p className="text-[8px] font-black text-aura-muted uppercase tracking-widest">Logged Devices Signature</p>
                                <p className="text-xs font-semibold text-white/70">
                                  {userDevices.length > 0 
                                    ? `${userDevices.length} Terminal Signature${userDevices.length !== 1 ? 's' : ''} Synced`
                                    : '1 Standard Session Registered'
                                  }
                                </p>
                              </div>
                            </div>

                            {userDevices.length > 0 && (
                              <div className="pt-4 max-h-[100px] overflow-y-auto space-y-1 scrollbar-none">
                                <p className="text-[8px] font-black text-aura-muted uppercase tracking-widest mb-1.5">Hardware handshake parameters</p>
                                {userDevices.map((dev: any, idx: number) => (
                                  <div key={idx} className="p-2 bg-white/5 rounded-lg border border-white/5 text-[9px] font-mono text-white/60 flex justify-between gap-4">
                                    <span>{dev.browser || 'Unknown Browser'} ({dev.os || 'Unknown OS'})</span>
                                    <span className="text-aura-lime font-black">{dev.ip || 'Local Node'}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="pt-4 border-t border-white/5 flex gap-3">
                            <button
                              type="button"
                              onClick={() => setSelectedRegUser(null)}
                              className="flex-1 py-3.5 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all cursor-pointer"
                            >
                              Exit Audit
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. USERS DASHBOARD PAGE */}
                {usersSubTab === 'users_dashboard' && (
                  <div className="space-y-6 animate-fade-in">
                    <section id="users-dashboard" className="p-6 sm:p-8 bg-white/[0.02] border border-white/5 rounded-[32px] sm:rounded-[40px] space-y-6">
                      <div className="flex flex-col gap-6">
                        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between pb-4 border-b border-white/5">
                          <div className="flex items-center gap-2">
                            <Users size={18} className="text-aura-lime" />
                            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white">Users Dashboard</h2>
                          </div>

                          <div className="flex items-center gap-4 bg-white/5 border border-white/5 rounded-2xl px-4 py-2 w-full md:w-80">
                            <Search size={16} className="text-aura-muted" />
                            <input 
                              type="text" 
                              placeholder="Search Identity..." 
                              className="bg-transparent border-none outline-none text-[10px] font-bold tracking-widest uppercase text-white w-full"
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 overflow-x-auto max-w-full">
                          {[
                            { key: 'all', label: 'All Users' },
                            { key: 'active', label: 'Active Users' },
                            { key: 'inactive', label: 'Inactive Users' },
                            { key: 'suspended', label: 'Suspended Users ONLY' },
                            { key: 'banned', label: 'Banned Users ONLY' }
                          ].map((f) => (
                            <button 
                              key={f.key}
                              onClick={() => {
                                if (activeTab === 'cinactiveusers' && f.key !== 'inactive') {
                                  handleTabChange('cuser');
                                }
                                setUserFilter(f.key as any);
                              }}
                              className={cn(
                                "px-6 py-2 rounded-xl text-[10px] uppercase font-black tracking-widest transition-all whitespace-nowrap cursor-pointer select-none",
                                effectiveFilter === f.key ? "bg-white/10 text-white" : "text-aura-muted hover:text-white"
                              )}
                            >
                              {f.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="bg-[#090b10] border border-white/5 rounded-[32px] overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left">
                            <thead>
                              <tr className="border-b border-white/5">
                                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-aura-muted">Identity</th>
                                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-aura-muted">Balances</th>
                                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-aura-muted text-center">Nodes / Plan Details</th>
                                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-aura-muted">Status</th>
                                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-aura-muted text-right">Access</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.02]">
                              {filteredUsers.length === 0 ? (
                                <tr>
                                  <td colSpan={5} className="px-6 py-8 text-center text-xs font-bold uppercase text-aura-muted tracking-widest bg-white/[0.01]">
                                    No {effectiveFilter !== 'all' ? `${effectiveFilter}` : ''} users currently indexed
                                  </td>
                                </tr>
                              ) : (
                                filteredUsers.map((u: any) => {
                                  const userActiveInvestments = investments.filter(i => i.user_id === u.id && i.status === 'active');
                                  const isActiveNodeUser = userActiveInvestments.length > 0;
                                  
                                  return (
                                    <tr 
                                      key={u.id} 
                                      className="group hover:bg-white/[0.02] transition-colors cursor-pointer" 
                                      onClick={() => { 
                                        setSelectedUser(u); 
                                        setIsDetailView(true); 
                                      }}
                                    >
                                      <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                          {u.photoURL ? (
                                            <img src={u.photoURL} className="w-9 h-9 rounded-xl object-cover border border-white/10" alt="" />
                                          ) : (
                                            <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-black text-xs text-aura-lime shrink-0">
                                              {u.name?.[0]?.toUpperCase() || 'U'}
                                            </div>
                                          )}
                                          <div className="min-w-0">
                                            <p className="text-xs font-bold tracking-tight text-white truncate max-w-[150px]">{u.name || 'Anonymous'}</p>
                                            <p className="text-[9px] text-aura-muted font-bold truncate max-w-[150px] uppercase tracking-widest font-mono">{u.email}</p>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="px-6 py-4">
                                        <p className="text-xs font-black font-serif italic text-white">{formatCurrency(u.available_balance || 0)}</p>
                                        <p className="text-[8px] text-aura-muted font-bold uppercase tracking-widest">Total: {formatCurrency((u.available_balance || 0) + (u.funding_balance || 0))}</p>
                                      </td>
                                      <td className="px-6 py-4 text-center">
                                        {isActiveNodeUser ? (
                                          <div className="flex flex-col items-center gap-1">
                                            <span className="text-[9px] font-black text-aura-lime bg-aura-lime/10 px-2.5 py-1 rounded-full border border-aura-lime/20 flex items-center gap-1">
                                              <Zap size={10} className="animate-pulse" /> {userActiveInvestments.length} Active Plan{userActiveInvestments.length > 1 ? 's' : ''}
                                            </span>
                                            <div className="flex flex-wrap gap-1 justify-center max-w-[200px] mt-1">
                                              {userActiveInvestments.map((inv: any) => (
                                                <span key={inv.id} className="text-[8px] font-bold uppercase bg-white/5 px-2 py-0.5 rounded text-[#a855f7] border border-white/5">
                                                  {inv.plan_name}: ${inv.amount.toLocaleString()} ({inv.status})
                                                </span>
                                              ))}
                                            </div>
                                          </div>
                                        ) : (
                                          <span className="text-[8px] font-black text-gray-500 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/5">
                                            No Active Nodes
                                          </span>
                                        )}
                                      </td>
                                      <td className="px-6 py-4">
                                        {u.banned ? (
                                          <span className="text-[8px] font-black uppercase tracking-widest px-2.5 py-0.5 bg-red-500/10 text-red-500 rounded-full flex items-center gap-1 w-fit"><Ban size={10} /> Banned</span>
                                        ) : u.suspended ? (
                                          <span className="text-[8px] font-black uppercase tracking-widest px-2.5 py-0.5 bg-yellow-500/10 text-yellow-500 rounded-full flex items-center gap-1 w-fit"><Pause size={10} /> Suspended</span>
                                        ) : (
                                          <span className="text-[8px] font-black uppercase tracking-widest px-2.5 py-0.5 bg-aura-lime/10 text-aura-lime rounded-full flex items-center gap-1 w-fit"><ShieldCheck size={10} /> Verified</span>
                                        )}
                                      </td>
                                      <td className="px-6 py-4 text-right text-aura-muted group-hover:text-aura-lime transition-all">
                                        <ChevronRight size={14} className="inline" />
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </section>
                  </div>
                )}

                {/* 3. USER ACTIVITIES ENGINE PAGE */}
                {usersSubTab === 'activities_engine' && (
                  <div className="space-y-6 animate-fade-in pb-10">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-white/5">
                      <div>
                        <h2 className="text-lg font-black uppercase tracking-[0.2em] text-white flex items-center gap-2">
                          <Activity size={20} className="text-aura-lime animate-pulse" /> Users Activities Engine
                        </h2>
                        <p className="text-[9px] text-aura-muted uppercase tracking-widest mt-1">Real-time chronicle of interactive user operations & handshakes</p>
                      </div>
                      <span className="text-[9px] font-black uppercase text-aura-muted tracking-widest bg-white/5 px-2.5 py-1 rounded">Live Activities Matrix</span>
                    </div>

                    {focusedActivityUserId ? (
                      // FOCUSED USER DETAILED TIMELINE
                      <div className="p-6 sm:p-8 bg-[#090b10] border border-white/5 rounded-3xl space-y-6">
                        {(() => {
                          const item = activeUsersWithActivities.find(x => x.user.id === focusedActivityUserId);
                          if (!item) {
                            return (
                              <div className="space-y-4">
                                <button 
                                  onClick={() => setFocusedActivityUserId(null)}
                                  className="text-[10px] font-black uppercase text-aura-lime hover:underline tracking-widest flex items-center gap-1 cursor-pointer"
                                >
                                  <ArrowLeft size={12} /> Back to User Feed
                                </button>
                                <p className="text-xs text-aura-muted">No activities recorded for this user.</p>
                              </div>
                            );
                          }
                          
                          return (
                            <div className="space-y-6 animate-fade-in">
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4 font-bold">
                                <div className="flex items-center gap-3">
                                  <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-black text-xs text-aura-lime shrink-0">
                                    {item.user.name?.[0]?.toUpperCase() || 'U'}
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-bold text-white">{item.user.name || 'Anonymous'}</h4>
                                    <p className="text-[10px] text-aura-muted font-bold font-mono uppercase">{item.user.email}</p>
                                  </div>
                                </div>
                                <button 
                                  onClick={() => setFocusedActivityUserId(null)}
                                  className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all flex items-center gap-1 cursor-pointer"
                                >
                                  <ArrowLeft size={12} /> View All Audits
                                </button>
                              </div>

                              <div className="space-y-4">
                                <div className="text-[9px] font-black uppercase text-aura-muted tracking-widest">
                                  Chronological Activities Sequence ({item.activities.length} signals)
                                </div>
                                <div className="relative pl-4 border-l border-white/10 space-y-6 ml-2 pt-2">
                                  {item.activities.map((act: any) => {
                                    const isSecLog = !act.amount;
                                    return (
                                      <div key={act.id} className="relative group">
                                        <div className={cn(
                                          "absolute -left-[22px] top-1.5 w-3 h-3 rounded-full ring-[4px] ring-[#090b10] transition-colors",
                                          isSecLog ? "bg-purple-500 group-hover:bg-purple-400" : "bg-aura-lime group-hover:bg-[#bbfb60]"
                                        )} />
                                        <div className="p-4 bg-white/[0.01] border border-white/5 group-hover:bg-white/[0.02] group-hover:border-white/10 rounded-2xl space-y-1.5 transition-all">
                                          <div className="flex items-center justify-between gap-4 font-bold">
                                            <span className="text-[10px] font-black uppercase text-white tracking-wider">
                                              {act.action?.replace(/_/g, ' ')}
                                            </span>
                                            {act.amount > 0 && (
                                              <span className="text-[10px] font-black text-aura-lime px-2 py-0.5 rounded bg-aura-lime/10">
                                                +{formatCurrency(act.amount)}
                                              </span>
                                            )}
                                          </div>
                                          <p className="text-xs text-aura-muted font-medium">{act.description}</p>
                                          <p className="text-[8px] text-aura-muted/40 font-bold font-mono tracking-wider italic">
                                            {new Date(act.timestamp).toLocaleString()}
                                          </p>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      // CARDS FEED
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activeUsersWithActivities.map((item: any) => {
                      const now = new Date().getTime();
                      const elapsedMin = (now - item.latestTime) / (1000 * 60);
                      const isOnlineNow = elapsedMin < 10;
                      const isRecent = elapsedMin < 60;

                      return (
                        <div 
                          key={item.user.id}
                          className={cn(
                            "p-5 border rounded-3xl transition-all relative overflow-hidden flex flex-col justify-between",
                            expandedActivityUserId === item.user.id 
                              ? "bg-white/[0.04] border-aura-lime/40" 
                              : "bg-white/[0.01] border-white/5 hover:border-white/10"
                          )}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-black text-xs text-aura-lime shrink-0">
                                {item.user.name?.[0]?.toUpperCase() || 'U'}
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-xs font-bold text-white truncate max-w-[120px]">{item.user.name || 'Anonymous'}</h4>
                                <p className="text-[9px] text-aura-muted font-bold truncate max-w-[120px] uppercase font-mono">{item.user.email}</p>
                              </div>
                            </div>

                            {/* Signal Pulser Dot */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              <div className={cn(
                                "w-2.5 h-2.5 rounded-full relative",
                                isOnlineNow ? "bg-green-500 animate-pulse-green shadow-[0_0_10px_rgba(34,197,94,0.5)]" : isRecent ? "bg-blue-505 bg-blue-500" : "bg-gray-600"
                              )}>
                                {isOnlineNow && (
                                  <span className="absolute -inset-0.5 rounded-full bg-green-500/50 animate-ping" />
                                )}
                                {isRecent && !isOnlineNow && (
                                  <span className="absolute -inset-0.5 rounded-full bg-blue-500/50 animate-ping text-[6px]" />
                                )}
                              </div>
                              <span className="text-[8px] font-bold text-aura-muted uppercase tracking-widest font-mono">
                                {isOnlineNow ? 'Active' : isRecent ? 'Recent' : 'Idle'}
                              </span>
                            </div>
                          </div>

                          <div className="mt-4 flex items-center justify-between text-[10px] font-bold text-aura-muted border-t border-white/[0.02] pt-3">
                            <span className="truncate max-w-[120px] font-mono">
                              Last Action: {item.activities[0]?.action?.replace(/_/g, ' ')}
                            </span>
                            <button 
                              onClick={() => setExpandedActivityUserId(expandedActivityUserId === item.user.id ? null : item.user.id)}
                              className="text-[9px] font-black uppercase text-aura-lime hover:underline tracking-widest flex items-center gap-1"
                            >
                              {expandedActivityUserId === item.user.id ? 'Close' : 'View Logs'}
                              <ChevronRight size={10} className={cn("transition-transform", expandedActivityUserId === item.user.id ? "rotate-90" : "")} />
                            </button>
                          </div>

                          {/* TIMELINE SEQUENCE EXPANSION */}
                          {expandedActivityUserId === item.user.id && (
                            <div className="mt-4 p-4 bg-black/60 border border-white/5 rounded-2xl space-y-4 max-h-[250px] overflow-y-auto">
                              <div className="text-[8px] font-black uppercase text-aura-muted tracking-widest border-b border-white/5 pb-2">
                                Activity Sequences ({item.activities.length} signals)
                              </div>
                              <div className="relative pl-3 border-l border-white/10 space-y-4">
                                {item.activities.map((act: any) => {
                                  const isSecLog = !act.amount;
                                  return (
                                    <div key={act.id} className="relative">
                                      <div className={cn(
                                        "absolute -left-[16px] top-1 w-2.5 h-2.5 rounded-full ring-2 ring-[#090b10]",
                                        isSecLog ? "bg-blue-500" : "bg-aura-lime"
                                      )} />
                                      <div className="space-y-0.5">
                                        <div className="flex items-center gap-1.5 justify-between">
                                          <span className="text-[9px] font-black uppercase text-white tracking-wide">
                                            {act.action?.replace(/_/g, ' ')}
                                          </span>
                                          {act.amount > 0 && (
                                            <span className="text-[9px] font-black text-aura-lime px-1 rounded bg-aura-lime/10">
                                              +{formatCurrency(act.amount)}
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-[9px] text-aura-muted font-mono">{act.description}</p>
                                        <p className="text-[7px] text-aura-muted/60 font-mono italic">
                                          {new Date(act.timestamp).toLocaleString()}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    </div>
                    )}
                  </div>
                )}

                {/* 4. USER ROI ENGINE PAGE */}
                {usersSubTab === 'roi_engine' && (
                  <div className="space-y-6 animate-fade-in pb-10">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-white/5">
                      <div>
                        <h2 className="text-lg font-black uppercase tracking-[0.2em] text-white flex items-center gap-2">
                          <Zap size={20} className="text-aura-lime animate-bounce" /> Users ROI Engine
                        </h2>
                        <p className="text-[9px] text-aura-muted uppercase tracking-widest mt-1">Real-time compilation of system active yield node accumulators</p>
                      </div>
                      <span className="text-[9px] font-black uppercase text-aura-muted tracking-widest bg-white/5 px-2.5 py-1 rounded">Accumulator Matrix</span>
                    </div>

                    <GlobalRoiControls roiConfig={roiConfig} onSave={handleSaveGlobalRoi} />

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {users.filter(u => investments.some(inv => inv.user_id === u.id && inv.status === 'active')).length === 0 ? (
                        <div className="col-span-full p-12 text-center text-xs font-bold uppercase text-aura-muted tracking-widest bg-white/[0.01] border border-white/5 rounded-3xl">
                          No active ROI investments currently running
                        </div>
                      ) : (
                        users
                          .filter(u => investments.some(inv => inv.user_id === u.id && inv.status === 'active'))
                          .map((u: any) => {
                            const userActiveInvestments = investments.filter(inv => inv.user_id === u.id && inv.status === 'active');
                            return (
                              <AdminROIEngineCard 
                                key={u.id}
                                userValue={u}
                                userInvestments={userActiveInvestments}
                                plans={plans}
                                onSaveOverride={handleSaveUserOverride}
                                globalRoiConfig={roiConfig}
                              />
                            );
                          })
                      )}
                    </div>
                  </div>
                )}

              </div>
            ) : (
              // USER DETAIL PANEL
              <div className="space-y-8 pb-20">
                 <button onClick={() => setIsDetailView(false)} className="flex items-center gap-2 text-aura-muted hover:text-white transition-all text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                    <ArrowLeft size={14} /> Back to Registry
                 </button>

                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* LEFT COL: Profile & Status */}
                    <div className="lg:col-span-1 space-y-6">
                       <div className="p-8 bg-white/5 border border-white/5 rounded-[40px] text-center space-y-4">
                          <div className="relative inline-block mx-auto">
                             {selectedUser.photoURL ? (
                               <img src={selectedUser.photoURL} className="w-24 h-24 rounded-[32px] object-cover border-2 border-aura-lime shadow-2xl shadow-aura-lime/20" alt="" />
                             ) : (
                               <div className="w-24 h-24 rounded-[32px] bg-white/5 border border-white/10 flex items-center justify-center font-black text-3xl text-aura-lime">{selectedUser.name?.[0]}</div>
                             )}
                             <div className={cn(
                               "absolute -bottom-2 -right-2 p-2 rounded-full border-2 border-aura-black shadow-lg",
                               selectedUser.banned ? "bg-red-500" : selectedUser.suspended ? "bg-yellow-500" : "bg-aura-lime"
                             )}>
                               {selectedUser.banned ? <Ban size={14} className="text-white" /> : selectedUser.suspended ? <Pause size={14} className="text-white" /> : <ShieldCheck size={14} className="text-aura-black" />}
                             </div>
                          </div>
                          <div>
                             <h3 className="text-2xl font-black font-serif italic text-white">{selectedUser.name}</h3>
                             <p className="text-[10px] text-aura-muted font-bold uppercase tracking-[0.2em]">{selectedUser.email}</p>
                             <p className="text-[8px] text-aura-lime font-black uppercase tracking-widest mt-2">ID: {selectedUser.id}</p>
                          </div>

                          <div className="pt-6 border-t border-white/5 grid grid-cols-2 gap-2">
                             <button 
                               onClick={() => toggleUserStatus(selectedUser.id, 'suspended', !selectedUser.suspended)}
                               className={cn(
                                 "flex items-center justify-center gap-2 py-3 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all",
                                 selectedUser.suspended ? "bg-yellow-500 text-aura-black" : "bg-white/5 text-yellow-500 border border-yellow-500/20 hover:bg-yellow-500/10"
                               )}
                             >
                                <Pause size={12} /> {selectedUser.suspended ? 'Unsuspend' : 'Suspend'}
                             </button>
                             <button 
                               onClick={() => toggleUserStatus(selectedUser.id, 'banned', !selectedUser.banned)}
                               className={cn(
                                 "flex items-center justify-center gap-2 py-3 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all",
                                 selectedUser.banned ? "bg-red-500 text-white" : "bg-white/5 text-red-500 border border-red-500/20 hover:bg-red-500/10"
                               )}
                             >
                                <Ban size={12} /> {selectedUser.banned ? 'Unban' : 'Ban Access'}
                             </button>
                          </div>
                          
                          <div className="space-y-2">
                             <button 
                               onClick={() => toggleUserStatus(selectedUser.id, 'roi_disabled', !selectedUser.roi_disabled)}
                               className={cn(
                                 "flex items-center justify-center gap-2 w-full py-3 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all border",
                                 selectedUser.roi_disabled ? "bg-blue-500 text-white border-blue-500" : "bg-white/5 text-blue-400 border-blue-400/20 hover:bg-blue-400/10"
                               )}
                             >
                                {selectedUser.roi_disabled ? <Play size={12} /> : <Pause size={12} />}
                                {selectedUser.roi_disabled ? 'Enable ROI Engine' : 'Disable ROI Engine'}
                             </button>
                             <div className="grid grid-cols-2 gap-2">
                                <button 
                                  onClick={() => toggleUserStatus(selectedUser.id, 'withdrawals_frozen', !selectedUser.withdrawals_frozen)}
                                  className={cn(
                                    "flex items-center justify-center gap-2 py-3 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all border",
                                    selectedUser.withdrawals_frozen ? "bg-orange-500 text-white border-orange-500" : "bg-white/5 text-orange-400 border-orange-400/20 hover:bg-orange-400/10"
                                  )}
                                >
                                   <Lock size={12} /> {selectedUser.withdrawals_frozen ? 'Unfreeze Payout' : 'Freeze Payout'}
                                </button>
                                <button 
                                  onClick={() => toggleUserStatus(selectedUser.id, 'transfers_frozen', !selectedUser.transfers_frozen)}
                                  className={cn(
                                    "flex items-center justify-center gap-2 py-3 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all border",
                                    selectedUser.transfers_frozen ? "bg-purple-500 text-white border-purple-500" : "bg-white/5 text-purple-400 border-purple-400/20 hover:bg-purple-400/10"
                                  )}
                                >
                                   <RefreshCw size={12} /> {selectedUser.transfers_frozen ? 'Unfreeze Transfer' : 'Freeze Transfer'}
                                </button>
                             </div>
                          </div>
                       </div>

                       <div className="p-6 bg-white/5 border border-white/5 rounded-3xl space-y-4">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-aura-muted flex items-center gap-2"><MapPin size={12} /> Geographic Metadata</h4>
                        </div>

                        <IndividualRoiOverride userValue={liveUser} onSaveOverride={handleSaveUserOverride} />

                        <div className="p-6 bg-white/5 border border-white/5 rounded-3xl space-y-4">
                          <div className="space-y-3">
                             <div className="flex justify-between items-center text-[10px] font-bold uppercase text-white/60">
                                <span>Country</span>
                                <span>{selectedUser.countryName || 'Global Access'}</span>
                             </div>
                             <div className="flex justify-between items-center text-[10px] font-bold uppercase text-white/60">
                                <span>Last Sync</span>
                                <span className="font-mono text-[9px]">{selectedUser.last_login ? new Date(selectedUser.last_login).toLocaleString() : 'N/A'}</span>
                             </div>
                          </div>
                       </div>
                    </div>

                    {/* RIGHT COL: Financials & History */}
                    <div className="lg:col-span-2 space-y-8">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {[
                            { field: 'available_balance', label: 'Available', value: selectedUser.available_balance || 0, icon: Wallet, color: 'text-secondary' },
                            { field: 'funding_balance', label: 'Funding', value: selectedUser.funding_balance || 0, icon: CreditCard, color: 'text-blue-400' },
                            { field: 'total_earnings', label: 'Total Earnings', value: selectedUser.total_earnings || 0, icon: TrendingUp, color: 'text-purple-400' },
                            { field: 'total_invested', label: 'Total Invested', value: selectedUser.total_invested || 0, icon: Zap, color: 'text-orange-400' },
                            { field: 'referral_earnings', label: 'Referrals', value: selectedUser.referral_earnings || 0, icon: UserPlus, color: 'text-aura-lime' },
                          ].map((item) => (
                             <div key={item.field} className="p-6 bg-white/5 border border-white/5 rounded-3xl group">
                                <div className="flex justify-between items-start mb-4">
                                   <item.icon size={18} className={item.color} />
                                   <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button 
                                        onClick={() => {
                                          const amt = prompt("Amount to ADD?");
                                          if (amt) updateUserBalance(selectedUser.id, item.field, parseFloat(amt), 'add');
                                        }}
                                        className="p-1 hover:bg-white/10 rounded text-[9px] font-black text-aura-lime"
                                      >+ ADD</button>
                                      <button 
                                        onClick={() => {
                                          const amt = prompt("Amount to SET?");
                                          if (amt) updateUserBalance(selectedUser.id, item.field, parseFloat(amt), 'set');
                                        }}
                                        className="p-1 hover:bg-white/10 rounded text-[9px] font-black text-white"
                                      >EDIT</button>
                                       <button 
                                        onClick={() => updateUserBalance(selectedUser.id, item.field, 0, 'set')}
                                        className="p-1 hover:bg-white/10 rounded text-[9px] font-black text-red-400"
                                      >RESET</button>
                                   </div>
                                </div>
                                <p className="text-3xl font-black font-serif italic mb-1">{formatCurrency(item.value)}</p>
                                <p className="text-[10px] font-bold text-aura-muted uppercase tracking-widest">{item.label}</p>
                             </div>
                          ))}
                       </div>

                       <div className="space-y-6">
                          <h3 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2"><History size={16} className="text-aura-lime" /> Registry Logs</h3>
                          <div className="bg-white/5 border border-white/5 rounded-[40px] overflow-hidden">
                             <table className="w-full text-left">
                                <thead>
                                   <tr className="border-b border-white/5">
                                      <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-aura-muted">Event</th>
                                      <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-aura-muted">Value</th>
                                      <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-aura-muted text-right">Timestamp</th>
                                   </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.02]">
                                   {investments.filter(inv => inv.user_id === selectedUser.id).slice(0, 5).map((inv: any) => (
                                     <tr key={inv.id}>
                                       <td className="px-8 py-4">
                                          <p className="text-[10px] font-bold text-white uppercase">{inv.plan_name} Node Activated</p>
                                       </td>
                                       <td className="px-8 py-4">
                                          <p className="text-[10px] font-black text-aura-lime tracking-widest">{formatCurrency(inv.amount)}</p>
                                       </td>
                                       <td className="px-8 py-4 text-right">
                                          <p className="text-[10px] text-aura-muted font-bold font-mono uppercase italic">{new Date(inv.created_at).toLocaleDateString()}</p>
                                       </td>
                                     </tr>
                                   ))}
                                </tbody>
                             </table>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'ctransactions' && (
          <div className="bg-white/5 border border-white/5 rounded-[40px] overflow-hidden">
             <table className="w-full text-left">
                <thead>
                   <tr className="border-b border-white/5 text-[9px] font-black uppercase tracking-widest text-aura-muted">
                      <th className="px-8 py-6">Operation</th>
                      <th className="px-8 py-6">Subject</th>
                      <th className="px-8 py-6 text-right">Value</th>
                      <th className="px-8 py-6 text-right">Sequence</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.02]">
                   {transactions.map(tx => (
                     <tr key={tx.id} className="hover:bg-white/[0.01]">
                        <td className="px-8 py-6">
                           <p className="text-[10px] font-bold text-white uppercase">{tx.type?.replace(/_/g, ' ')}</p>
                           <p className="text-[8px] italic text-aura-muted">{tx.description || '-'}</p>
                        </td>
                        <td className="px-8 py-6">
                           <p className="text-xs font-mono text-aura-muted">{tx.user_id?.substring(0, 8)}...</p>
                        </td>
                        <td className="px-8 py-6 text-right">
                           <p className="text-sm font-black font-serif italic text-white">{formatCurrency(tx.amount)}</p>
                        </td>
                        <td className="px-8 py-6 text-right">
                           <p className="text-[9px] font-bold text-aura-muted uppercase">{tx.created_at ? new Date(tx.created_at).toLocaleString() : 'just now'}</p>
                        </td>
                     </tr>
                   ))}
                </tbody>
             </table>
          </div>
        )}

        {activeTab === 'ctwn_token' && (
          <div className="space-y-8">
            {/* Header info card */}
            <div className="p-8 bg-white/5 border border-white/5 rounded-[40px] flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden backdrop-blur-xl">
              <div className="space-y-1.5 relative z-10">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-aura-lime flex items-center gap-2">
                  <Coins size={16} /> TWN Token Operations Center
                </h3>
                <p className="text-[10px] text-aura-muted uppercase tracking-widest font-black">Isolate, review, and disburse blockchain ledger movements</p>
              </div>

              {/* Sub tab selectors */}
              <div className="flex flex-wrap gap-2 relative z-10">
                {[
                  { id: 'all', label: 'All Activities' },
                  { id: 'pending', label: 'Pending Approvals' },
                  { id: 'completed', label: 'Processed' },
                  { id: 'rejected', label: 'Declined' }
                ].map(sub => (
                  <button
                    key={sub.id}
                    onClick={() => setTwnSubTab(sub.id as any)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer border",
                      twnSubTab === sub.id 
                        ? "bg-aura-lime text-aura-black border-aura-lime font-black" 
                        : "bg-white/5 border-transparent text-slate-300 hover:text-white"
                    )}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>
            </div>

            {/* List Table */}
            <div className="bg-white/5 border border-white/5 rounded-[40px] overflow-hidden">
               <table className="w-full text-left">
                  <thead>
                     <tr className="border-b border-white/5 text-[9px] font-black uppercase tracking-widest text-aura-muted">
                        <th className="px-8 py-6">Operation / Reference ID</th>
                        <th className="px-8 py-6">User Account Details</th>
                        <th className="px-8 py-6 text-right">USD Val / TWN Quantity</th>
                        <th className="px-8 py-6 text-right">Index Pricing Details</th>
                        <th className="px-8 py-6 text-center">Protocol Actions</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.02]">
                     {transactions
                       .filter((tx: any) => tx.is_twn_activity === true)
                       .filter((tx: any) => {
                         if (twnSubTab === 'pending' && tx.status !== 'pending') return false;
                         if (twnSubTab === 'completed' && tx.status !== 'approved' && tx.status !== 'completed') return false;
                         if (twnSubTab === 'rejected' && tx.status !== 'rejected' && tx.status !== 'declined') return false;
                         return true;
                       })
                       .length === 0 ? (
                         <tr>
                           <td colSpan={5} className="px-8 py-16 text-center">
                             <Coins size={32} className="mx-auto mb-4 text-slate-600 stroke-[1.5px] animate-pulse" />
                             <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">No isolated token activities match selection filters.</p>
                           </td>
                         </tr>
                       ) : (
                         transactions
                           .filter((tx: any) => tx.is_twn_activity === true)
                           .filter((tx: any) => {
                             if (twnSubTab === 'pending' && tx.status !== 'pending') return false;
                             if (twnSubTab === 'completed' && tx.status !== 'approved' && tx.status !== 'completed') return false;
                             if (twnSubTab === 'rejected' && tx.status !== 'rejected' && tx.status !== 'declined') return false;
                             return true;
                           })
                           .map((tx: any) => {
                             const isIncoming = tx.type === 'twn_purchase' || tx.type === 'twn_transfer_received';
                             const isWithdrawal = tx.type === 'twn_withdrawal_request';
                             
                             return (
                               <tr key={tx.id} className="hover:bg-white/[0.01] transition-all">
                                  {/* Operation / ID */}
                                  <td className="px-8 py-6">
                                     <span className={cn(
                                       "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded leading-none w-fit mb-1 block",
                                       tx.type === 'twn_purchase' 
                                         ? "bg-purple-500/10 text-purple-400" 
                                         : tx.type === 'twn_withdrawal_request'
                                           ? "bg-amber-500/10 text-amber-400"
                                           : "bg-blue-500/10 text-blue-400"
                                     )}>
                                       {tx.type === 'twn_purchase' 
                                         ? "TOKEN PURCHASE" 
                                         : tx.type === 'twn_withdrawal_request'
                                           ? "ESCROW WITHDRAWAL"
                                           : tx.type?.replace(/_/g, ' ')
                                       }
                                     </span>
                                     <p className="text-[10px] font-bold text-white font-mono tracking-wider">Ref: {tx.id?.substring(0, 10)}...</p>
                                     {tx.reference && <p className="text-[8px] text-slate-400 font-mono italic">Hash: {tx.reference}</p>}
                                     {tx.wallet_address && <p className="text-[8px] text-purple-300 font-mono">Address: {tx.wallet_address}</p>}
                                  </td>

                                  {/* User Details */}
                                  <td className="px-8 py-6">
                                     <p className="text-[10px] font-black text-white uppercase">{tx.user_name || 'User'}</p>
                                     <p className="text-[8px] italic text-aura-muted font-semibold">{tx.user_email || tx.user_id}</p>
                                     <p className="text-[7px] text-slate-500 font-bold uppercase">{tx.created_at ? new Date(tx.created_at).toLocaleString() : 'N/A'}</p>
                                  </td>

                                  {/* USD / TWN Amounts */}
                                  <td className="px-8 py-6 text-right">
                                     <p className="text-xs font-black font-mono text-white">{(tx.twn_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} TWN</p>
                                     <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{formatCurrency(tx.amount || 0)} <span className="text-[7px]">USD</span></p>
                                     {tx.source_balance && <span className="text-[7px] text-amber-500 font-black uppercase tracking-widest">{tx.source_balance} Wallet</span>}
                                  </td>

                                  {/* Reference conversion metrics */}
                                  <td className="px-8 py-6 text-right font-mono">
                                     <p className="text-[10px] font-black text-rose-400">${tx.twn_price ? tx.twn_price.toFixed(5) : '0.00446'}</p>
                                     <p className="text-[7px] text-slate-500 uppercase tracking-widest font-sans font-bold">Trading Index Price</p>
                                  </td>

                                  {/* Actions */}
                                  <td className="px-8 py-6">
                                     <div className="flex items-center justify-center gap-2">
                                        {tx.status === 'pending' ? (
                                          <>
                                            <button 
                                              onClick={() => approveTwnTransaction(tx)}
                                              className="px-3 py-1.5 bg-[#009e42] hover:bg-[#02d147] active:bg-[#008236] active:scale-95 duration-200 transition-all text-white font-black text-[9px] uppercase tracking-widest rounded-lg cursor-pointer"
                                            >
                                              Approve ✅
                                            </button>
                                            <button 
                                              onClick={() => declineTwnTransaction(tx)}
                                              className="px-3 py-1.5 bg-red-500 hover:bg-red-600 active:scale-95 duration-200 transition-all text-white font-black text-[9px] uppercase tracking-widest rounded-lg cursor-pointer"
                                            >
                                              Decline ❌
                                            </button>
                                          </>
                                        ) : (
                                          <span className={cn(
                                            "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded leading-none w-fit",
                                            tx.status === 'approved' || tx.status === 'completed'
                                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                              : "bg-red-500/10 text-red-400 border border-red-500/25"
                                          )}>
                                            {tx.status === 'approved' || tx.status === 'completed' ? 'Verified / Success' : 'Declined'}
                                          </span>
                                        )}
                                     </div>
                                  </td>
                               </tr>
                             );
                           })
                       )}
                  </tbody>
               </table>
            </div>
          </div>
        )}

        {activeTab === 'csupport_tickets' && (
          <div className="space-y-8">
            {/* Header info card */}
            <div className="p-8 bg-white/5 border border-white/5 rounded-[40px] flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden backdrop-blur-xl">
              <div className="space-y-1.5 relative z-10">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-aura-lime flex items-center gap-2">
                  <MessageSquare size={16} /> User Support Ticket Operations
                </h3>
                <p className="text-[10px] text-aura-muted uppercase tracking-widest font-black">
                  Monitor, review, and handle customer complaints and questions in real-time
                </p>
              </div>

              {/* Stats highlights */}
              <div className="flex gap-4 relative z-10">
                <div className="px-4 py-2 bg-white/5 border border-white/5 rounded-2xl">
                  <span className="text-[8px] font-black uppercase tracking-widest text-[#ffffff60] block">Open Tickets</span>
                  <span className="text-xl font-black text-rose-400 font-mono">
                    {supportTickets.filter(t => t.status === 'open' || t.status === 'in-progress').length}
                  </span>
                </div>
                <div className="px-4 py-2 bg-white/5 border border-white/5 rounded-2xl">
                  <span className="text-[8px] font-black uppercase tracking-widest text-[#ffffff60] block">Resolved</span>
                  <span className="text-xl font-black text-emerald-400 font-mono">
                    {supportTickets.filter(t => t.status === 'resolved').length}
                  </span>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-85 h-85 bg-aura-lime/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-85 h-85 bg-blue-500/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl pointer-events-none" />
            </div>

            {/* List and Details Layout */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
              {/* Left column - Tickets List */}
              <div className="xl:col-span-7 space-y-4">
                <div className="flex justify-between items-center bg-white/5 border border-white/5 p-4 rounded-3xl">
                  <span className="text-xs font-black uppercase tracking-widest text-white/90">Tickets queue ({supportTickets.length})</span>
                  {supportTickets.length > 0 && (
                    <button 
                      onClick={() => {
                        const allIds = supportTickets.map(t => t.id);
                        setSeenSupportTicketIds(allIds);
                        localStorage.setItem('seen_support_ticket_ids', JSON.stringify(allIds));
                        toast.success("All tickets marked as read");
                      }}
                      className="text-[10px] font-black uppercase tracking-widest text-aura-lime hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                {supportTickets.length === 0 ? (
                  <div className="p-16 text-center border border-dashed border-white/15 rounded-[40px] bg-white/[0.01]">
                    <MessageSquare className="mx-auto text-white/10 mb-4 animate-bounce" size={48} />
                    <p className="text-sm font-semibold text-white/40">No priority support tickets found</p>
                    <p className="text-[10px] text-white/20 mt-1 uppercase tracking-widest leading-none font-bold">Inbox clear</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[700px] overflow-y-auto pr-2 scrollbar-none">
                    {supportTickets.map((ticket) => {
                      const isUnseen = !seenSupportTicketIds.includes(ticket.id) && ticket.status === 'open';
                      const createdStr = ticket.created_at ? 
                        (ticket.created_at.toDate ? ticket.created_at.toDate().toLocaleString() : new Date(ticket.created_at.seconds ? ticket.created_at.seconds * 1000 : ticket.created_at).toLocaleString()) 
                        : "No date";
                      
                      return (
                        <div 
                          key={ticket.id}
                          onClick={() => {
                            setSelectedSupportTicket(ticket);
                            if (!seenSupportTicketIds.includes(ticket.id)) {
                              const updated = [...seenSupportTicketIds, ticket.id];
                              setSeenSupportTicketIds(updated);
                              localStorage.setItem('seen_support_ticket_ids', JSON.stringify(updated));
                            }
                          }}
                          className={cn(
                            "p-5 border rounded-3xl transition-all duration-300 cursor-pointer text-left relative overflow-hidden flex flex-col gap-3",
                            selectedSupportTicket?.id === ticket.id
                              ? "bg-white/10 border-aura-lime/40 ring-1 ring-aura-lime/20"
                              : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10"
                          )}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                {isUnseen && <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />}
                                Ticket ID: <span className="font-mono bg-white/5 px-1.5 py-0.5 rounded text-white">{ticket.id.substring(0, 8)}...</span>
                              </span>
                              <h4 className="text-sm font-bold text-white leading-snug tracking-tight mt-1">
                                {ticket.subject || ticket.message.substring(0, 40) + '...'}
                              </h4>
                            </div>

                            <span className={cn(
                              "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border leading-none",
                              ticket.status === 'resolved' 
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : ticket.status === 'in-progress'
                                  ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                  : "bg-red-500/10 text-red-400 border-red-500/20 animate-pulse"
                            )}>
                              {ticket.status || 'open'}
                            </span>
                          </div>

                          <p className="text-xs text-white/60 line-clamp-2 leading-relaxed">
                            {ticket.message}
                          </p>

                          <div className="flex justify-between items-center pt-2 border-t border-white/5 text-[9px] font-bold text-white/45">
                            <div className="flex items-center gap-2">
                              <span className="text-aura-lime">@{ticket.username || 'user'}</span>
                              <span className="text-white/20">•</span>
                              <span>{ticket.email}</span>
                            </div>
                            <span className="font-mono text-[8px]">{createdStr}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right column - Ticket Details */}
              <div className="xl:col-span-5">
                {selectedSupportTicket ? (
                  <div className="bg-white/5 border border-white/5 p-6 rounded-[36px] space-y-6 relative overflow-hidden backdrop-blur-xl">
                    <div className="flex items-center justify-between border-b border-white/5 pb-4">
                      <div>
                        <span className="text-[8px] font-black uppercase tracking-widest text-aura-muted">Active Ticket File</span>
                        <h3 className="text-md font-bold text-white mt-1">
                          Subject: {selectedSupportTicket.subject || 'Platform Support Request'}
                        </h3>
                      </div>
                      <button 
                        onClick={() => setSelectedSupportTicket(null)}
                        className="p-1 px-2.5 bg-white/20 border border-white/20 rounded-xl text-xs text-slate-300 hover:bg-white/30"
                      >
                        Clear
                      </button>
                    </div>

                    {/* Quick user meta info card */}
                    <div className="space-y-3 bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-[#ffffff50] border-b border-white/5 pb-1.5">User Profile</h4>
                      
                      <div className="grid grid-cols-2 gap-3 text-xs leading-none">
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-[#ffffff30] mb-1">Username</p>
                          <p className="font-bold text-white">@{selectedSupportTicket.username || 'user'}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-[#ffffff30] mb-1">Account Public ID</p>
                          <p className="font-bold text-white font-mono">{selectedSupportTicket.publicId || selectedSupportTicket.userId || 'N/A'}</p>
                        </div>
                      </div>

                      <div className="pt-2">
                        <p className="text-[9px] font-black uppercase tracking-widest text-[#ffffff30] mb-1">Email</p>
                        <p className="font-bold text-white break-all">{selectedSupportTicket.email}</p>
                      </div>
                    </div>

                    {/* Timestamp Info */}
                    <div className="grid grid-cols-2 gap-3 bg-white/[0.02] border border-white/5 p-4 rounded-2xl text-xs leading-none">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-[#ffffff30] mb-1">Created Date</p>
                        <p className="font-bold text-white font-mono">
                          {selectedSupportTicket.created_at ? 
                            (selectedSupportTicket.created_at.toDate ? selectedSupportTicket.created_at.toDate().toLocaleDateString() : new Date(selectedSupportTicket.created_at.seconds ? selectedSupportTicket.created_at.seconds * 1000 : selectedSupportTicket.created_at).toLocaleDateString()) 
                            : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-[#ffffff30] mb-1">Created Time</p>
                        <p className="font-bold text-white font-mono">
                          {selectedSupportTicket.created_at ? 
                            (selectedSupportTicket.created_at.toDate ? selectedSupportTicket.created_at.toDate().toLocaleTimeString() : new Date(selectedSupportTicket.created_at.seconds ? selectedSupportTicket.created_at.seconds * 1000 : selectedSupportTicket.created_at).toLocaleTimeString()) 
                            : 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* Query Message Description */}
                    <div className="space-y-2">
                      <p className="text-[9px] font-black uppercase tracking-widest text-[#ffffff30] ml-1">Message Description</p>
                      <div className="p-5 bg-white/5 border border-white/5 rounded-3xl text-sm font-medium text-slate-200 leading-relaxed whitespace-pre-wrap">
                        {selectedSupportTicket.message}
                      </div>
                    </div>

                    {/* Screenshot Attachment if exists */}
                    {selectedSupportTicket.screenshot && (
                      <div className="space-y-2">
                        <p className="text-[9px] font-black uppercase tracking-widest text-[#ffffff30] ml-1">Attached Screenshot / Photo</p>
                        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 p-2 max-h-[300px] flex items-center justify-center">
                          <img 
                            src={selectedSupportTicket.screenshot} 
                            alt="Ticket Attachment" 
                            className="max-w-full max-h-[284px] object-contain rounded-lg"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      </div>
                    )}

                    {/* Support history matching emails/usernames */}
                    <div className="space-y-2">
                      <p className="text-[9px] font-black uppercase tracking-widest text-[#ffffff30] ml-1">User Support History</p>
                      {supportTickets.filter(t => t.email === selectedSupportTicket.email && t.id !== selectedSupportTicket.id).length === 0 ? (
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest ml-1">No prior tickets for this user.</p>
                      ) : (
                        <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                          {supportTickets
                            .filter(t => t.email === selectedSupportTicket.email && t.id !== selectedSupportTicket.id)
                            .map(prevTicket => (
                              <div 
                                key={prevTicket.id}
                                onClick={() => setSelectedSupportTicket(prevTicket)}
                                className="p-3 bg-white/[0.01] border border-white/5 rounded-xl flex justify-between items-center hover:bg-white/[0.03] cursor-pointer"
                              >
                                <div className="space-y-0.5">
                                  <p className="text-xs font-bold text-white truncate max-w-[200px]">{prevTicket.subject || prevTicket.message}</p>
                                  <p className="text-[8px] font-black uppercase font-mono text-slate-500">Doc ID: {prevTicket.id.substring(0,8)}</p>
                                </div>
                                <span className={cn(
                                  "text-[7px] font-black uppercase px-2 py-0.5 rounded leading-none border",
                                  prevTicket.status === 'resolved' 
                                    ? "bg-emerald-500/10 text-emerald-450 border-emerald-500/15" 
                                    : "bg-red-500/10 text-red-500 border-red-500/15"
                                )}>
                                  {prevTicket.status || 'open'}
                                </span>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>

                    {/* Action Controls for Status */}
                    <div className="space-y-3 pt-4 border-t border-white/5">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ffffff50] ml-1">Update Status</p>
                      <div className="grid grid-cols-3 gap-3">
                        <button 
                          onClick={async () => {
                            try {
                              await updateDoc(doc(db, 'support_tickets', selectedSupportTicket.id), { status: 'open' });
                              setSelectedSupportTicket(prev => ({ ...prev, status: 'open' }));
                              toast.success("Updated status to open");
                            } catch (err: any) {
                              toast.error("Failed to update status: " + err.message);
                            }
                          }}
                          className={cn(
                            "py-3 rounded-xl font-bold uppercase tracking-widest text-[9px] transition-all",
                            selectedSupportTicket.status === 'open'
                              ? "bg-rose-500 text-white"
                              : "bg-white/5 border border-white/5 text-rose-400 hover:bg-white/10"
                          )}
                        >
                          Open
                        </button>
                        <button 
                          onClick={async () => {
                            try {
                              await updateDoc(doc(db, 'support_tickets', selectedSupportTicket.id), { status: 'in-progress' });
                              setSelectedSupportTicket(prev => ({ ...prev, status: 'in-progress' }));
                              toast.success("Updated status to in-progress");
                            } catch (err: any) {
                              toast.error("Failed to update status: " + err.message);
                            }
                          }}
                          className={cn(
                            "py-3 rounded-xl font-bold uppercase tracking-widest text-[9px] transition-all",
                            selectedSupportTicket.status === 'in-progress'
                              ? "bg-amber-500 text-white"
                              : "bg-white/5 border border-white/5 text-amber-400 hover:bg-white/10"
                          )}
                        >
                          In Progress
                        </button>
                        <button 
                          onClick={async () => {
                            try {
                              await updateDoc(doc(db, 'support_tickets', selectedSupportTicket.id), { status: 'resolved' });
                              setSelectedSupportTicket(prev => ({ ...prev, status: 'resolved' }));
                              toast.success("Updated status to resolved");
                            } catch (err: any) {
                              toast.error("Failed to update status: " + err.message);
                            }
                          }}
                          className={cn(
                            "py-3 rounded-xl font-bold uppercase tracking-widest text-[9px] transition-all",
                            selectedSupportTicket.status === 'resolved'
                              ? "bg-emerald-500 text-white"
                              : "bg-white/5 border border-white/5 text-emerald-400 hover:bg-white/10"
                          )}
                        >
                          Resolved
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-16 text-center border border-dashed border-white/10 rounded-[40px] bg-white/[0.01]">
                    <MessageSquare className="mx-auto text-white/5 mb-4 animate-pulse" size={48} />
                    <p className="text-sm font-semibold text-white/30">Select a support ticket to audit details & responses</p>
                    <p className="text-[9px] text-white/15 mt-1 uppercase tracking-widest font-bold">Awaiting Selection</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'csettings' && (
          <div className="max-w-4xl space-y-12">
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-aura-lime mb-6 flex items-center gap-2">
                <Shield size={16} /> Security Architecture
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="p-8 bg-white/5 border border-white/5 rounded-[40px] space-y-6">
                    <div className="flex items-center gap-4">
                       <div className="p-3 bg-aura-lime/10 rounded-2xl text-aura-lime"><Lock size={24} /></div>
                       <div>
                          <h4 className="text-sm font-black uppercase">Terminus Session</h4>
                          <p className="text-[10px] text-aura-muted font-bold uppercase tracking-widest">Active root session: {profile?.name || 'Cipher'}</p>
                       </div>
                    </div>
                    
                    <div className="space-y-3 pt-4 border-t border-white/5">
                       <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                          <span className="text-aura-muted">Auth Level</span>
                          <span className="text-white">Admin Alpha</span>
                       </div>
                       <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                          <span className="text-aura-muted">Encryption</span>
                          <span className="text-white">AES-256-GCM</span>
                       </div>
                       <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                          <span className="text-aura-muted">Last Handshake</span>
                          <span className="font-mono text-white">{new Date().toLocaleTimeString()}</span>
                       </div>
                    </div>

                    <button 
                      onClick={async () => { await logout(); navigate('/welcome'); }}
                      className="w-full py-4 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white transition-all rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2"
                    >
                       <LogOut size={16} /> Terminate All Sessions
                    </button>
                 </div>

                 <div className="p-8 bg-white/5 border border-white/5 rounded-[40px] space-y-6">
                    <div className="flex items-center gap-4">
                       <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500"><ShieldCheck size={24} /></div>
                       <div>
                          <h4 className="text-sm font-black uppercase">MFA & Access</h4>
                          <p className="text-[10px] text-aura-muted font-bold uppercase tracking-widest">System multi-factor settings</p>
                       </div>
                    </div>
                    
                    <div className="flex flex-col gap-3 pt-4 border-t border-white/5">
                       <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-widest text-white/40 italic">2FA Status</span>
                          <span className="text-[8px] font-black uppercase tracking-widest px-2 py-1 bg-white/10 text-aura-muted rounded">Coming Soon</span>
                       </div>
                       <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-widest text-white/40 italic">Audit Log</span>
                          <span className="text-[8px] font-black uppercase tracking-widest px-2 py-1 bg-aura-lime/10 text-aura-lime rounded">Synced</span>
                       </div>
                    </div>
                 </div>
              </div>
            </div>

            <div className="p-8 bg-white/5 border border-white/5 rounded-[40px] space-y-6">
               <h3 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
                 <Building2 size={16} className="text-red-400" /> Withdrawal Exchange Rate
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                     <label className="text-[10px] font-black uppercase tracking-widest text-aura-muted ml-2">USD to NGN Withdrawal Rate</label>
                     <div className="flex gap-3">
                        <div className="relative flex-1">
                           <div className="absolute inset-y-0 left-6 flex items-center text-red-400 font-bold">₦</div>
                           <input 
                              type="number" 
                              value={withdrawExchangeRate}
                              onChange={(e) => setWithdrawExchangeRate(parseFloat(e.target.value) || 0)}
                              placeholder="1400"
                              className="w-full bg-aura-black border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-base font-bold outline-none focus:border-red-500/50 transition-all text-white"
                           />
                        </div>
                        <button 
                           onClick={() => updateWithdrawExchangeRate(withdrawExchangeRate)}
                           className="px-8 py-4 bg-red-400 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl hover:scale-[1.02] transition-all"
                        >
                           Update Rate
                        </button>
                     </div>
                     <p className="text-[8px] text-aura-muted font-bold uppercase tracking-widest ml-2 italic underline underline-offset-4 decoration-red-500/30">Used specifically for User Withdrawals and Conversion calculations</p>
                  </div>
               </div>
            </div>

            <div className="p-8 bg-white/5 border border-white/5 rounded-[40px] space-y-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
                  <Settings size={16} className="text-red-400" /> Withdrawal Controls
                </h3>
                <div className="space-y-6">
                   <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-white/[0.02] border border-white/5 rounded-2xl">
                      <div>
                         <h4 className="text-sm font-black uppercase font-sans text-white">Withdrawal System Busy</h4>
                         <p className="text-[10px] text-aura-muted font-bold uppercase tracking-widest">
                            {withdrawalSystemBusy ? "ON - BLOCKS ALL WITHDRAWALS WITH SYSTEM BUSY MESSAGE" : "OFF - SYSTEM WITHDRAWALS WORK NORMALLY"}
                         </p>
                      </div>
                      <button
                         type="button"
                         onClick={async () => {
                            const nextVal = !withdrawalSystemBusy;
                            setWithdrawalSystemBusy(nextVal);
                            await updateWithdrawalSystemBusy(nextVal);
                         }}
                         className={cn(
                            "px-6 py-2.5 rounded-xl text-[10px] uppercase font-black tracking-widest transition-all cursor-pointer select-none",
                            withdrawalSystemBusy 
                               ? "bg-red-500 text-white shadow-[0_4px_12px_rgba(239,68,68,0.3)] hover:bg-red-600" 
                               : "bg-white/5 text-red-500 border border-red-500/20 hover:bg-red-500/10"
                         )}
                      >
                         {withdrawalSystemBusy ? "ON" : "OFF"}
                      </button>
                   </div>
                </div>
            </div>

            <div className="p-8 bg-white/5 border border-white/5 rounded-[40px] space-y-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
                  <Settings size={16} className="text-purple-400 animate-spin [animation-duration:10s]" /> System Maintenance mode
                </h3>
                <div className="space-y-6">
                   <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-white/[0.02] border border-white/5 rounded-2xl">
                      <div>
                         <h4 className="text-sm font-black uppercase">Maintenance Protocol</h4>
                         <p className="text-[10px] text-aura-muted font-bold uppercase tracking-widest">
                            {maintenanceMode ? "ONLINE USERS BLOCKED SECURELY" : "APP ONLINE WITH GENERAL ACCESS ENFORCED"}
                         </p>
                      </div>
                      <button
                         type="button"
                         onClick={() => {
                            const nextMode = !maintenanceMode;
                            setMaintenanceMode(nextMode);
                            updateMaintenanceSettings(nextMode, maintenanceTitle, maintenanceMessage, maintenanceEta);
                         }}
                         className={cn(
                            "px-6 py-2.5 rounded-xl text-[10px] uppercase font-black tracking-widest transition-all cursor-pointer select-none",
                            maintenanceMode 
                               ? "bg-purple-500 text-white shadow-[0_4px_12px_rgba(168,85,247,0.3)] hover:bg-purple-600" 
                               : "bg-white/5 text-purple-400 border border-purple-500/20 hover:bg-purple-500/10"
                         )}
                      >
                         {maintenanceMode ? "Deactivate Mode" : "Activate Mode"}
                      </button>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-widest text-aura-muted ml-2">Maintenance Title</label>
                         <input 
                            type="text" 
                            value={maintenanceTitle}
                            onChange={(e) => setMaintenanceTitle(e.target.value)}
                            className="w-full bg-aura-black border border-white/10 rounded-2xl py-3 px-4 text-xs font-bold outline-none focus:border-purple-500/50 transition-all text-white"
                            placeholder="System Upgrading"
                         />
                      </div>

                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-widest text-aura-muted ml-2">Estimated Return Time (optional)</label>
                         <input 
                            type="text" 
                            value={maintenanceEta}
                            onChange={(e) => setMaintenanceEta(e.target.value)}
                            className="w-full bg-aura-black border border-white/10 rounded-2xl py-3 px-4 text-xs font-bold font-mono outline-none focus:border-purple-500/50 transition-all text-white"
                            placeholder="e.g. 2 Hours, May 27th, 14:00 UTC"
                         />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                         <label className="text-[10px] font-black uppercase tracking-widest text-aura-muted ml-2">Maintenance Message / Body</label>
                         <textarea 
                            value={maintenanceMessage}
                            onChange={(e) => setMaintenanceMessage(e.target.value)}
                            rows={3}
                            className="w-full bg-aura-black border border-white/10 rounded-2xl py-3 px-4 text-xs font-medium outline-none focus:border-purple-500/50 transition-all text-white leading-relaxed resize-none"
                            placeholder="Provide details about the maintenance operation..."
                         />
                      </div>
                   </div>

                   <div className="flex justify-end pt-2 border-t border-white/5">
                      <button 
                         type="button"
                         onClick={() => updateMaintenanceSettings(maintenanceMode, maintenanceTitle, maintenanceMessage, maintenanceEta)}
                         className="px-8 py-3.5 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl hover:scale-[1.01] transition-all cursor-pointer"
                      >
                         Save Maintenance Parameters
                      </button>
                   </div>
                </div>
             </div>

            <div className="p-8 bg-white/5 border border-white/5 rounded-[40px] space-y-6">
               <h3 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
                 <Activity size={16} className="text-aura-lime" /> Terminal Integrity
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { label: 'Latency', value: '14ms', status: 'Optimal' },
                    { label: 'Db Sync', value: 'Real-time', status: 'Healthy' },
                    { label: 'Uptime', value: '99.99%', status: 'Stable' },
                  ].map((s, i) => (
                    <div key={i} className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl text-center">
                       <p className="text-[8px] font-black uppercase tracking-widest text-aura-muted mb-2">{s.label}</p>
                       <p className="text-2xl font-black font-serif italic mb-1">{s.value}</p>
                       <span className="text-[8px] font-black uppercase tracking-widest text-aura-lime">{s.status}</span>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        )}

        {activeTab === 'cadverts' && (
          <div className="space-y-12">
            {/* Header / Intro */}
            <div className="p-8 bg-white/5 border border-white/5 rounded-[40px] flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 bg-aura-lime/10 text-aura-lime rounded-full border border-aura-lime/20">
                  Adverts Protocol v1.4
                </span>
                <h2 className="text-3xl font-black font-serif italic mt-2">Marketing & Bulletin Dispatcher</h2>
                <p className="text-xs text-aura-muted font-bold uppercase tracking-wider mt-1">Configure and target high-yield premium pop-ups throughout user feeds globally</p>
              </div>
              <button
                onClick={handleResetAdvertForm}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs uppercase font-black tracking-widest border border-white/5 transition-all inline-flex items-center gap-2 active:scale-95"
              >
                <Plus size={14} />
                Create New Advert
              </button>
            </div>

            {/* Core Section: Split Form + Live Preview */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
              {/* Creator Form */}
              <div className="p-8 bg-white/5 border border-white/5 rounded-[40px] space-y-8">
                <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                  <Megaphone className="text-aura-lime" size={20} />
                  <h3 className="text-base font-black uppercase tracking-wider text-white">
                    {editingAdvertId ? `Edit Advert (ID: ${editingAdvertId})` : "Create New Campaign"}
                  </h3>
                </div>

                <div className="space-y-6">
                  {/* Title & Message */}
                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-aura-muted ml-2">Advert Title</label>
                      <input
                        type="text"
                        value={advTitle}
                        onChange={(e) => setAdvTitle(e.target.value)}
                        placeholder="e.g. Exclusive High-Yield Event"
                        className="w-full bg-aura-black border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:border-aura-lime transition-all text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-aura-muted ml-2">Message / Content Body</label>
                      <textarea
                        value={advMessage}
                        onChange={(e) => setAdvMessage(e.target.value)}
                        placeholder="Detail the event advantages, requirements, and timing limits here..."
                        rows={4}
                        className="w-full bg-aura-black border border-white/10 rounded-2xl py-4 px-6 text-xs font-semibold outline-none focus:border-aura-lime transition-all text-white leading-relaxed resize-none"
                      />
                    </div>
                  </div>

                  {/* Image & CTA Link */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-aura-muted ml-2">Advert Image URL</label>
                      <input
                        type="text"
                        value={advImageUrl}
                        onChange={(e) => setAdvImageUrl(e.target.value)}
                        placeholder="https://i.imgur.com/example.png"
                        className="w-full bg-aura-black border border-white/10 rounded-2xl py-4 px-6 text-xs font-semibold outline-none focus:border-aura-lime transition-all text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-aura-muted ml-2">Redirect Link / Destination URL</label>
                      <input
                        type="text"
                        value={advRedirectLink}
                        onChange={(e) => setAdvRedirectLink(e.target.value)}
                        placeholder="/invest?plan=gold"
                        className="w-full bg-aura-black border border-white/10 rounded-2xl py-4 px-6 text-xs font-semibold outline-none focus:border-aura-lime transition-all text-white"
                      />
                    </div>
                  </div>

                  {/* Button CTA text & Style Template */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-aura-muted ml-2">CTA Button Text</label>
                      <input
                        type="text"
                        value={advCtaText}
                        onChange={(e) => setAdvCtaText(e.target.value)}
                        placeholder="Claim Bonus Now"
                        className="w-full bg-aura-black border border-white/10 rounded-2xl py-4 px-6 text-xs font-bold outline-none focus:border-aura-lime transition-all text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-aura-muted ml-2">Advert Style Template</label>
                      <select
                        value={advStyleTemplate}
                        onChange={(e) => setAdvStyleTemplate(e.target.value)}
                        className="w-full bg-aura-black border border-white/10 rounded-2xl py-4 px-6 text-xs font-bold outline-none focus:border-aura-lime transition-all text-white cursor-pointer"
                      >
                        <option value="glass">Glassmorphism Default</option>
                        <option value="neon">Neon Cyber (High Contrast)</option>
                        <option value="minimal">Minimal Stark Slate</option>
                        <option value="brutalist">Mono Brutalist Craft</option>
                        <option value="warm">Amber Aurora Gold</option>
                      </select>
                    </div>
                  </div>

                  {/* DISPLAY TYPE & SIZE */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-aura-muted ml-2">Popup / Display Type</label>
                      <select
                        value={advPopupType}
                        onChange={(e) => setAdvPopupType(e.target.value)}
                        className="w-full bg-aura-black border border-white/10 rounded-2xl py-4 px-6 text-xs font-bold outline-none focus:border-aura-lime transition-all text-white cursor-pointer"
                      >
                        <option value="center">Center Pop-up</option>
                        <option value="floating-corner">Floating Corner Card</option>
                        <option value="bottom-slide">Bottom Slide Toast</option>
                        <option value="top-banner">Top Header Banner</option>
                        <option value="side-floating">Side Floating Badge</option>
                        <option value="mini-notification">Mini Notification toast</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-aura-muted ml-2">Scale / Size Category</label>
                      <select
                        value={advSize}
                        onChange={(e) => setAdvSize(e.target.value)}
                        className="w-full bg-aura-black border border-white/10 rounded-2xl py-4 px-6 text-xs font-bold outline-none focus:border-aura-lime transition-all text-white cursor-pointer"
                      >
                        <option value="small">Small Compact (Max 360px)</option>
                        <option value="medium">Medium Standard (Max 480px)</option>
                        <option value="large">Large Premium (Max 600px)</option>
                      </select>
                    </div>
                  </div>

                  {/* Position & Height/Width Limits */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-aura-muted ml-2">UI Screen Position</label>
                      <select
                        value={advPosition}
                        onChange={(e) => setAdvPosition(e.target.value)}
                        className="w-full bg-aura-black border border-white/10 rounded-2xl py-4 px-6 text-xs font-bold outline-none focus:border-aura-lime transition-all text-white cursor-pointer"
                      >
                        <option value="center">Center</option>
                        <option value="top-left">Top Left</option>
                        <option value="top-right">Top Right</option>
                        <option value="bottom-left">Bottom Left</option>
                        <option value="bottom-right">Bottom Right</option>
                        <option value="top-center">Top Center</option>
                        <option value="bottom-center">Bottom Center</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-aura-muted ml-2">Custom Width (e.g. 400px)</label>
                      <input
                        type="text"
                        value={advWidth}
                        onChange={(e) => setAdvWidth(e.target.value)}
                        placeholder="Leave blank for auto"
                        className="w-full bg-aura-black border border-white/10 rounded-2xl py-4 px-6 text-xs font-semibold outline-none focus:border-aura-lime transition-all text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-aura-muted ml-2">Custom Height (e.g. 320px)</label>
                      <input
                        type="text"
                        value={advHeight}
                        onChange={(e) => setAdvHeight(e.target.value)}
                        placeholder="Leave blank for auto"
                        className="w-full bg-aura-black border border-white/10 rounded-2xl py-4 px-6 text-xs font-semibold outline-none focus:border-aura-lime transition-all text-white"
                      />
                    </div>
                  </div>

                  {/* SCHEDULING OPTIONS */}
                  <div className="p-5 bg-white/[0.02] border border-white/5 rounded-3xl space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-white/75 italic">Time Scheduling Rules</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[8px] font-black uppercase tracking-widest text-aura-muted ml-1">Trigger Frequency</label>
                        <select
                          value={advSchedulingType}
                          onChange={(e) => setAdvSchedulingType(e.target.value)}
                          className="w-full bg-aura-black border border-white/10 rounded-xl py-3 px-4 text-xs font-bold outline-none focus:border-aura-lime transition-all text-white"
                        >
                          <option value="every-refresh">Show Every Refresh</option>
                          <option value="once-daily">Show Once Daily</option>
                          <option value="every-login">Show Every Session Login</option>
                          <option value="custom-interval">Show Recurring Interval</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[8px] font-black uppercase tracking-widest text-aura-muted ml-1">Interval Minutes (if recurring)</label>
                        <input
                          type="number"
                          disabled={advSchedulingType !== 'custom-interval'}
                          value={advIntervalMinutes}
                          onChange={(e) => setAdvIntervalMinutes(parseInt(e.target.value) || 30)}
                          className="w-full bg-aura-black disabled:opacity-40 border border-white/10 rounded-xl py-3 px-4 text-xs font-mono outline-none focus:border-aura-lime transition-all text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[8px] font-black uppercase tracking-widest text-aura-muted ml-1">Campaign Start Date</label>
                        <input
                          type="datetime-local"
                          value={advStartDate}
                          onChange={(e) => setAdvStartDate(e.target.value)}
                          className="w-full bg-aura-black border border-white/10 rounded-xl py-3 px-4 text-xs font-mono outline-none text-white focus:border-aura-lime"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[8px] font-black uppercase tracking-widest text-aura-muted ml-1">Campaign End Date</label>
                        <input
                          type="datetime-local"
                          value={advEndDate}
                          onChange={(e) => setAdvEndDate(e.target.value)}
                          className="w-full bg-aura-black border border-white/10 rounded-xl py-3 px-4 text-xs font-mono outline-none text-white focus:border-aura-lime"
                        />
                      </div>
                    </div>
                  </div>

                  {/* TARGET PAGE CODES */}
                  <div className="p-5 bg-white/[0.02] border border-white/5 rounded-3xl space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-white/75 italic">Location Node Target</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[8px] font-black uppercase tracking-widest text-aura-muted ml-1">Active Page Destination</label>
                        <select
                          value={advPageTargetingType}
                          onChange={(e) => setAdvPageTargetingType(e.target.value)}
                          className="w-full bg-aura-black border border-white/10 rounded-xl py-3 px-4 text-xs font-bold outline-none focus:border-aura-lime transition-all text-white"
                        >
                          <option value="all">Entire Application (All Feeds)</option>
                          <option value="dashboard">Dashboard / Home Panel</option>
                          <option value="rewards">Rewards & Quests Page</option>
                          <option value="invest">Investment Terminal</option>
                          <option value="profile">Profile & Security Panel</option>
                          <option value="fund">Fund & Withdrawal Gateway</option>
                          <option value="custom">Custom Specified Router Path</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[8px] font-black uppercase tracking-widest text-aura-muted ml-1">Custom Specified Path (if chosen)</label>
                        <input
                          type="text"
                          disabled={advPageTargetingType !== 'custom'}
                          value={advCustomPath}
                          onChange={(e) => setAdvCustomPath(e.target.value)}
                          placeholder="e.g. /token"
                          className="w-full bg-aura-black disabled:opacity-40 border border-white/10 rounded-xl py-3 px-4 text-xs font-bold outline-none focus:border-aura-lime transition-all text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Active Toggle & Submission Controls */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/5">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setAdvIsActive(!advIsActive)}
                        className={cn(
                          "w-12 h-6 rounded-full p-1 transition-colors duration-300 focus:outline-none",
                          advIsActive ? "bg-aura-lime" : "bg-white/10"
                        )}
                      >
                        <div
                          className={cn(
                            "w-4 h-4 rounded-full bg-aura-black transition-transform duration-300",
                            advIsActive ? "translate-x-6" : "translate-x-0"
                          )}
                        />
                      </button>
                      <span className="text-[10px] font-black uppercase tracking-widest text-white">
                        {advIsActive ? "Publish Campaign Active" : "Publish Campaign Paused"}
                      </span>
                    </div>

                    <div className="flex gap-4 w-full sm:w-auto justify-end">
                      {editingAdvertId && (
                        <button
                          onClick={handleResetAdvertForm}
                          className="px-6 py-4 bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest text-[9px] rounded-2xl hover:bg-white/10 transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        onClick={handleSaveAdvert}
                        className="px-8 py-4 bg-aura-lime text-aura-black font-black uppercase tracking-widest text-[9px] rounded-2xl hover:scale-[1.02] shadow-lg active:scale-95 transition-all cursor-pointer"
                      >
                        {editingAdvertId ? "Update Campaign" : "Publish Campaign"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Real-time Live Preview Panel */}
              <div className="p-8 bg-white/5 border border-white/5 rounded-[40px] flex flex-col justify-between space-y-8 min-h-[500px]">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div className="flex items-center gap-3">
                    <Eye className="text-purple-400" size={18} />
                    <h3 className="text-base font-black uppercase tracking-wider text-white">Real-time Visual Sandbox</h3>
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-widest text-aura-muted px-2 py-1 bg-white/5 rounded">Iframe Emulation</span>
                </div>

                <div className="flex-1 flex items-center justify-center p-6 bg-[#030406] border border-white/5 rounded-3xl relative overflow-hidden min-h-[350px]">
                  {/* Background grids */}
                  <div className="absolute inset-0 bg-[radial-gradient(#ffffff03_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

                  {/* Render simulated pop-up based on style template and positioning preview */}
                  <div 
                    style={{ 
                      width: advWidth || (advSize === 'small' ? '280px' : advSize === 'large' ? '460px' : '380px'),
                      height: advHeight || 'auto'
                    }}
                    className={cn(
                      "relative rounded-[24px] p-6 text-center overflow-hidden border transition-all duration-300 font-sans shadow-2xl",
                      // styles
                      advStyleTemplate === 'glass' && "bg-white/[0.03] backdrop-blur-xl border-white/10 text-white shadow-[0_30px_60px_rgba(0,0,0,0.8)]",
                      advStyleTemplate === 'neon' && "bg-[#0b031c] border-purple-500 text-purple-100 shadow-[0_0_30px_rgba(168,85,247,0.30)]",
                      advStyleTemplate === 'minimal' && "bg-[#111215] border-white/15 text-gray-200",
                      advStyleTemplate === 'brutalist' && "bg-black border-4 border-white text-white font-mono rounded-none",
                      advStyleTemplate === 'warm' && "bg-gradient-to-tr from-[#130d07] to-[#1a100a] border-amber-600/30 text-amber-50 shadow-[0_30px_50px_rgba(245,158,11,0.05)]",
                    )}
                  >
                    {/* Style Decorator Overlay elements */}
                    {advStyleTemplate === 'neon' && (
                      <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
                    )}
                    {advStyleTemplate === 'warm' && (
                      <div className="absolute top-[-30%] left-[-30%] w-[60%] h-[60%] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
                    )}

                    {/* Badge popup styling helper notification */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 pointer-events-none">
                      <span className={cn(
                        "text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded",
                        advStyleTemplate === 'brutalist' ? "bg-white text-black font-mono" : "bg-white/10 text-white/40"
                      )}>
                        {advPopupType.replace('-', ' ')}
                      </span>
                    </div>

                    <div className="space-y-5 mt-4">
                      {/* Optional Image */}
                      {advImageUrl && (
                        <div className={cn("overflow-hidden mx-auto", advStyleTemplate === 'brutalist' ? "border-2 border-white rounded-none w-full h-32" : "rounded-2xl w-full h-32 bg-white/5 border border-white/5")}>
                          <img 
                            referrerPolicy="no-referrer"
                            src={advImageUrl} 
                            alt="Advert Banner Preview" 
                            className="w-full h-full object-cover" 
                          />
                        </div>
                      )}

                      <div className="space-y-2">
                        <h4 className={cn(
                          "font-serif tracking-tight font-black uppercase italic leading-tight",
                          advSize === 'small' ? "text-base" : advSize === 'large' ? "text-xl-plus text-xl" : "text-lg",
                          advStyleTemplate === 'neon' && "text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 not-italic font-sans font-extrabold tracking-wide",
                          advStyleTemplate === 'brutalist' && "font-mono not-italic tracking-normal text-left"
                        )}>
                          {advTitle || "EVENT TITLE PLACEHOLDER"}
                        </h4>
                        
                        {advStyleTemplate === 'brutalist' ? (
                          <div className="w-full h-0.5 bg-white" />
                        ) : (
                          <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-aura-lime/30 to-transparent mx-auto" />
                        )}

                        <p className={cn(
                          "text-xs leading-relaxed opacity-70 px-1",
                          advStyleTemplate === 'brutalist' && "font-mono text-left opacity-100 text-xs"
                        )}>
                          {advMessage || "Provide high-end message text inside the dispatcher form. This emulates standard terminal layouts precisely."}
                        </p>
                      </div>

                      <button
                        className={cn(
                          "w-full py-3.5 text-[10px] uppercase font-black tracking-widest transition-all",
                          advStyleTemplate === 'glass' && "bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10",
                          advStyleTemplate === 'neon' && "bg-gradient-to-r from-purple-600 to-cyan-500 text-white rounded-md shadow-lg hover:brightness-110",
                          advStyleTemplate === 'minimal' && "bg-white/10 text-white rounded-lg hover:bg-white/15",
                          advStyleTemplate === 'brutalist' && "bg-white text-black border-2 border-white rounded-none hover:bg-black hover:text-white",
                          advStyleTemplate === 'warm' && "bg-amber-600 text-white rounded-xl hover:bg-amber-500",
                        )}
                      >
                        {advCtaText || "Continue"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Simulated Positioning Indicator */}
                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between text-[10px] uppercase font-black tracking-wider text-aura-muted">
                  <div className="flex gap-2">
                    <span>Positioning:</span>
                    <span className="text-white font-mono">{advPosition}</span>
                  </div>
                  <div className="flex gap-2">
                    <span>Active Target:</span>
                    <span className="text-aura-lime">{advPageTargetingType}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* List of Active & Paused Campaigns */}
            <div className="p-8 bg-white/5 border border-white/5 rounded-[40px] space-y-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                  <Megaphone className="text-aura-lime" size={18} />
                  <h3 className="text-base font-black uppercase tracking-wider text-white">Adverts Campaigns Directory</h3>
                </div>
                <div className="text-[8px] font-black uppercase tracking-widest text-aura-muted px-2 py-1 bg-white/5 rounded">
                  {adverts.length} Active Node(s)
                </div>
              </div>

              {isAdvertsLoading ? (
                <div className="py-12 text-center text-xs font-mono text-aura-muted animate-pulse">
                  DOWNLOADING DISPATCH NODES...
                </div>
              ) : adverts.length === 0 ? (
                <div className="py-12 text-center text-xs font-bold uppercase tracking-wider text-aura-muted">
                  No campaigns published. Click "Create New Advert" above to initiate.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/5 text-[8px] font-black uppercase tracking-[0.2em] text-aura-muted">
                        <th className="pb-4">Preview</th>
                        <th className="pb-4">Campaign Core</th>
                        <th className="pb-4">Rendering UI</th>
                        <th className="pb-4">Schedule Rule</th>
                        <th className="pb-4">Page Target</th>
                        <th className="pb-4 text-center">Active Status</th>
                        <th className="pb-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.02] text-xs">
                      {adverts.map((v) => (
                        <tr key={v.id} className="group hover:bg-white/[0.01]">
                          <td className="py-4">
                            {v.imageUrl ? (
                              <img 
                                referrerPolicy="no-referrer"
                                src={v.imageUrl} 
                                alt="" 
                                className="w-10 h-10 object-cover rounded-lg bg-white/5 border border-white/10" 
                              />
                            ) : (
                              <div className="w-10 h-10 bg-white/5 rounded-lg border border-white/5 flex items-center justify-center">
                                <ImageIcon size={14} className="opacity-30" />
                              </div>
                            )}
                          </td>
                          <td className="py-4 pr-4">
                            <p className="font-bold text-white uppercase">{v.title}</p>
                            <p className="text-[10px] text-aura-muted line-clamp-1 max-w-[200px]" title={v.message}>{v.message}</p>
                          </td>
                          <td className="py-4 font-mono text-[10px]">
                            <span className="text-purple-400 capitalize">{v.popupType}</span>
                            <span className="text-neutral-500 mx-1">•</span>
                            <span className="text-sky-400 capitalize">{v.styleTemplate}</span>
                          </td>
                          <td className="py-4 font-mono text-[10px] text-white/80">
                            <p className="capitalize text-indigo-400">{v.scheduling?.type?.replace('-', ' ')}</p>
                            {v.scheduling?.type === 'custom-interval' && (
                              <p className="text-[8px] text-aura-muted">Frequency: {v.scheduling?.intervalMinutes} mins</p>
                            )}
                          </td>
                          <td className="py-4 text-[10px]">
                            <span className="px-2 py-0.5 bg-white/5 border border-white/5 text-neutral-300 font-mono tracking-wider rounded uppercase">
                              {v.pageTargeting?.type === 'custom' ? v.pageTargeting?.customPath : v.pageTargeting?.type}
                            </span>
                          </td>
                          <td className="py-4 text-center">
                            <button
                              onClick={() => handleToggleAdvertStatus(v.id, v.active !== false)}
                              className={cn(
                                "text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md transition-all border",
                                v.active !== false 
                                  ? "bg-aura-lime/10 text-aura-lime border-aura-lime/20" 
                                  : "bg-white/5 text-neutral-400 border-white/10"
                              )}
                            >
                              {v.active !== false ? "Active" : "Paused"}
                            </button>
                          </td>
                          <td className="py-4 text-right space-x-2">
                            <button
                              onClick={() => handleEditAdvert(v)}
                              className="p-1 px-2.5 bg-white/5 border border-white/10 rounded-md text-[9px] font-black uppercase tracking-widest text-neutral-300 hover:text-white hover:bg-white/10 transition-all inline-flex items-center gap-1 active:scale-95"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteAdvert(v.id)}
                              className="p-1.5 bg-red-400/10 border border-red-500/10 rounded md text-red-400 hover:bg-red-400/20 transition-all inline-flex items-center active:scale-95"
                            >
                              <Trash2 size={12} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'cui_editor' && (
          <div className="space-y-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="p-8 bg-white/5 border border-white/10 rounded-[40px] space-y-8">
                  <div className="flex items-center justify-between">
                     <h3 className="text-xl font-bold uppercase tracking-tight italic font-serif">Deployment Studio</h3>
                     <div className="flex gap-4">
                        <button 
                          onClick={async () => {
                            await addDoc(collection(db, 'ui_versions'), {
                              config: uiConfig,
                              timestamp: new Date(),
                              author: profile?.email,
                              description: 'Snapshot'
                            });
                            toast.success("State Sequenced");
                          }}
                          className="px-6 py-2 bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all"
                        >
                          Snapshot
                        </button>
                        <button 
                          onClick={async () => {
                            try {
                              await setDoc(doc(db, 'settings', 'ui_config'), uiConfig);
                              toast.success("UI Pipeline Re-synchronized. Changes Live.");
                            } catch (err) {
                              toast.error("Deployment Interrupted");
                            }
                          }}
                          className="px-6 py-2 bg-aura-lime text-aura-black text-[10px] font-black uppercase tracking-widest rounded-xl brutalist-shadow"
                        >
                          Deploy Live
                        </button>
                     </div>
                  </div>

                  <div className="space-y-4">
                     <p className="text-[10px] font-black uppercase tracking-widest text-aura-muted">Global UI Parameters</p>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <label className="text-[9px] font-bold uppercase text-white/40">Primary Color (Hex)</label>
                           <input 
                             type="text" 
                             value={uiConfig.primaryColor || '#a3e635'} 
                             onChange={(e) => setUiConfig({...uiConfig, primaryColor: e.target.value})}
                             className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono"
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[9px] font-bold uppercase text-white/40">Platform Title</label>
                           <input 
                             type="text" 
                             value={uiConfig.platformTitle || 'Capital Growth Alliance'} 
                             onChange={(e) => setUiConfig({...uiConfig, platformTitle: e.target.value})}
                             className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm"
                           />
                        </div>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[9px] font-bold uppercase text-white/40">Annoucement Banner</label>
                        <textarea 
                          value={uiConfig.announcement || ''} 
                          onChange={(e) => setUiConfig({...uiConfig, announcement: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm h-32"
                          placeholder="Welcome to the future of institutional trading..."
                        />
                     </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-1 space-y-6">
                <div className="p-8 bg-white/5 border border-white/10 rounded-[40px] space-y-6">
                   <h3 className="text-xs font-black uppercase tracking-widest text-aura-lime">Version Topology</h3>
                   <div className="space-y-4 overflow-y-auto max-h-[500px] pr-2">
                      {uiVersions.length === 0 ? (
                        <div className="text-center py-10 text-aura-muted text-[10px] font-bold uppercase tracking-widest">No previous versions detected</div>
                      ) : (
                        uiVersions.map((v, i) => (
                          <div key={v.id} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-2 group hover:border-aura-lime/30 transition-all">
                             <div className="flex justify-between items-start">
                                <span className="text-[8px] font-black uppercase tracking-widest text-aura-muted">V_{uiVersions.length - i}</span>
                                <span className="text-[8px] font-mono text-white/40">{new Date(v.timestamp.seconds * 1000).toLocaleString()}</span>
                             </div>
                             <p className="text-[10px] text-white font-bold uppercase tracking-tight line-clamp-1">{v.description || 'System Update'}</p>
                             <button 
                               onClick={async () => {
                                 if (confirm("Restore this UI configuration state? Current state will be backed up.")) {
                                    await addDoc(collection(db, 'ui_versions'), {
                                      config: uiConfig,
                                      timestamp: new Date(),
                                      description: `Pre-rollback to V_${uiVersions.length - i}`
                                    });
                                    await setDoc(doc(db, 'settings', 'ui_config'), v.config);
                                    toast.success("UI Rollback Successful");
                                 }
                               }}
                               className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-lg text-[8px] font-black uppercase tracking-widest text-aura-lime transition-all"
                             >
                               Rollback to this state
                             </button>
                          </div>
                        ))
                      )}
                   </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'cplans' && (
           <CipherPlansEditor plans={plans} />
        )}

        {activeTab === 'cnotifications' && (
          <div className="space-y-8 text-white">
            {/* Header & Status bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-6">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 bg-aura-lime/10 text-aura-lime rounded-full border border-aura-lime/20">
                  Cipher Alert Network Protocols
                </span>
                <h2 className="text-3xl font-black font-serif italic mt-2">Broadcast Control Center</h2>
              </div>
              <div className="flex gap-4 items-center">
                <span className="text-[10px] font-mono text-aura-muted uppercase bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                  Connected Node Directory: {users.length} Clients
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* LEFT COLUMN: COMPOSER (lg:col-span-5) */}
              <div className="lg:col-span-[5] bg-white/[0.02] border border-white/5 rounded-[40px] p-6 sm:p-8 space-y-6">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-aura-lime flex items-center gap-2 mb-1">
                    <Mail size={16} /> Broadcast Composer
                  </h3>
                  <p className="text-[9px] text-aura-muted uppercase tracking-wider">Configure dispatch parameters for client terminal display notifications.</p>
                </div>

                {/* Form fields */}
                <div className="space-y-4">
                  {/* Title */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-aura-muted block">Message Title</label>
                    <input 
                      type="text"
                      value={notifTitle}
                      onChange={(e) => setNotifTitle(e.target.value)}
                      placeholder="e.g. Security Update Node Activation"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-aura-lime/40 outline-none transition-all placeholder:text-white/20 font-bold"
                    />
                  </div>

                  {/* Body */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-aura-muted block">Message Body Details</label>
                    <textarea 
                      value={notifMessage}
                      onChange={(e) => setNotifMessage(e.target.value)}
                      placeholder="Enter specific broadcast statement here..."
                      rows={5}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-aura-lime/40 outline-none transition-all placeholder:text-white/20 font-medium"
                    />
                  </div>

                  {/* Targeting Selection */}
                  <div className="space-y-2 pt-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-aura-muted block mb-2">Recipient Scope Targeting</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'all', label: 'Send to All', desc: 'Deliver broadcast instantly to every user.', count: users.length },
                        { id: 'selected', label: `Send to Selected`, desc: 'Target specifically ticked accounts.', count: selectedUserIds.length },
                        { id: 'active_users', label: 'Active Users', desc: 'Target clients with running nodes.', count: users.filter(u => investments.some(i => i.user_id === u.id && i.status === 'active')).length },
                        { id: 'inactive_users', label: 'Inactive Users', desc: 'Target clients without active investments.', count: users.filter(u => !investments.some(i => i.user_id === u.id && i.status === 'active')).length }
                      ].map((scope) => (
                        <button
                          key={scope.id}
                          type="button"
                          onClick={() => setNotifTarget(scope.id as any)}
                          className={cn(
                            "p-3 rounded-xl border text-left flex flex-col justify-between transition-all duration-300 min-h-[100px]",
                            notifTarget === scope.id 
                              ? "bg-aura-lime/10 border-aura-lime text-white" 
                              : "bg-white/[0.01] border-white/5 text-gray-400 hover:border-white/10"
                          )}
                        >
                          <div>
                            <p className={cn("text-xs font-black uppercase tracking-wider", notifTarget === scope.id ? "text-aura-lime" : "text-white")}>
                              {scope.label}
                            </p>
                            <p className="text-[8px] text-gray-500 mt-1 leading-normal uppercase">{scope.desc}</p>
                          </div>
                          <span className="text-[10px] font-mono font-bold mt-2 self-end px-2 py-0.5 bg-white/5 rounded">
                            {scope.count} target{scope.count !== 1 ? 's' : ''}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5">
                  <button
                    onClick={sendNotifications}
                    disabled={isSendingNotif}
                    className="w-full py-4 bg-aura-lime hover:bg-aura-lime/90 disabled:bg-white/5 text-black disabled:text-aura-muted font-black text-xs uppercase tracking-widest transition-all rounded-xl shadow-lg flex items-center justify-center gap-2"
                  >
                    {isSendingNotif ? (
                      <>
                        <RefreshCw className="animate-spin" size={16} /> Dispersing Alerts...
                      </>
                    ) : (
                      <>
                        <Play size={14} fill="currentColor" /> Dispatch Protocol Message
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* RIGHT COLUMN: RECIPIENT LIST TARGETING (lg:col-span-12 items direction) */}
              <div className="lg:col-span-[7] bg-white/[0.02] border border-white/5 rounded-[40px] p-6 sm:p-8 space-y-6 flex flex-col h-[700px]">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-aura-lime flex items-center gap-2 mb-1">
                      <Search size={16} /> Audience Directory Filters
                    </h3>
                    <p className="text-[9px] text-aura-muted uppercase tracking-wider">Browse, filter, and manually select clients for custom target alert dispatches.</p>
                  </div>
                  {/* Bulk Select all displayed */}
                  <button 
                    onClick={() => {
                      // Get all currently visible matching users
                      const visibleUsers = users.filter(u => {
                        const matchesSearch = u.name?.toLowerCase().includes(notifSearchTerm.toLowerCase()) || u.email?.toLowerCase().includes(notifSearchTerm.toLowerCase()) || u.id?.toLowerCase().includes(notifSearchTerm.toLowerCase());
                        const hasActiveNode = investments.some(i => i.user_id === u.id && i.status === 'active');
                        
                        if (notifUserFilter === 'active_users') {
                          if (!hasActiveNode) return false;
                        } else if (notifUserFilter === 'inactive_users') {
                          if (hasActiveNode) return false;
                        }
                        return matchesSearch;
                      });
                      
                      const visibleIds = visibleUsers.map(u => u.id);
                      const allSelected = visibleIds.every(id => selectedUserIds.includes(id));
                      if (allSelected) {
                        // De-select Visible
                        setSelectedUserIds(selectedUserIds.filter(id => !visibleIds.includes(id)));
                      } else {
                        // Select Visible
                        setSelectedUserIds(Array.from(new Set([...selectedUserIds, ...visibleIds])));
                      }
                    }}
                    className="text-[9px] font-black uppercase tracking-widest text-aura-lime bg-aura-lime/5 px-3 py-1.5 rounded-lg border border-aura-lime/10 hover:bg-aura-lime hover:text-black transition-all"
                  >
                    Toggle Select All Filtered
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Category toggle tabs */}
                  <div className="flex bg-white/5 p-1 rounded-xl">
                    {[
                      { id: 'all', label: 'All Users' },
                      { id: 'active_users', label: 'Active Users' },
                      { id: 'inactive_users', label: 'Inactive Users' }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setNotifUserFilter(tab.id as any)}
                        className={cn(
                          "px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                          notifUserFilter === tab.id ? "bg-aura-lime text-black" : "text-aura-muted hover:text-white"
                        )}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Search filter input */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" size={14} />
                    <input 
                      type="text"
                      placeholder="Search by name, email, or id..."
                      value={notifSearchTerm}
                      onChange={(e) => setNotifSearchTerm(e.target.value)}
                      className="w-full bg-black/40 border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-xs outline-none focus:border-white/10 placeholder:text-white/20 font-bold"
                    />
                  </div>
                </div>

                {/* Directory list scroll screen */}
                <div className="flex-1 overflow-y-auto pr-2 divide-y divide-white/5 scrollbar-none space-y-2">
                  {users
                    .filter(u => {
                      const matchesSearch = u.name?.toLowerCase().includes(notifSearchTerm.toLowerCase()) || u.email?.toLowerCase().includes(notifSearchTerm.toLowerCase()) || u.id?.toLowerCase().includes(notifSearchTerm.toLowerCase());
                      const hasActiveNode = investments.some(i => i.user_id === u.id && i.status === 'active');
                      
                      if (notifUserFilter === 'active_users') {
                        if (!hasActiveNode) return false;
                      } else if (notifUserFilter === 'inactive_users') {
                        if (hasActiveNode) return false;
                      }
                      return matchesSearch;
                    })
                    .map((u) => {
                      const isSelected = selectedUserIds.includes(u.id);
                      const activeNodesCount = investments.filter(i => i.user_id === u.id && i.status === 'active').length;
                      const totalNodesCount = investments.filter(i => i.user_id === u.id).length;

                      return (
                        <div 
                          key={u.id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedUserIds(selectedUserIds.filter(id => id !== u.id));
                            } else {
                              setSelectedUserIds([...selectedUserIds, u.id]);
                            }
                          }}
                          className={cn(
                            "py-3 px-4 rounded-xl flex items-center justify-between cursor-pointer transition-all duration-200 border",
                            isSelected 
                              ? "bg-aura-lime/[0.03] border-aura-lime/20" 
                              : "border-transparent hover:bg-white/[0.01]"
                          )}
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            {/* Checkbox */}
                            <input 
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}} // toggled by outer parent click helper
                              className="w-3.5 h-3.5 accent-aura-lime cursor-pointer bg-white/10"
                            />
                            {/* Avatar */}
                            <div className="w-9 h-9 font-black text-xs text-black bg-aura-lime rounded-lg flex items-center justify-center shrink-0 uppercase w-9 h-9">
                              {u.name?.[0] || 'U'}
                            </div>
                            
                            {/* Details layout */}
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black uppercase text-white truncate max-w-[120px] block" title={u.name}>{u.name || 'Anonymous client'}</span>
                                <span className="text-[8px] font-mono text-aura-muted shrink-0">@{u.username || 'no_uname'}</span>
                              </div>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2 text-[8px] text-gray-400 font-mono">
                                <span className="truncate max-w-[100px]" title={u?.id}>ID: {u.id}</span>
                                <span className="hidden sm:inline text-gray-600">|</span>
                                <span className="truncate max-w-[150px]" title={u?.email}>{u.email || 'no-email'}</span>
                              </div>
                            </div>
                          </div>

                          {/* Node Investment Status tracking */}
                          <div className="text-right shrink-0 pl-2">
                            {activeNodesCount > 0 ? (
                              <div className="text-[9px] font-black uppercase tracking-wider text-aura-lime bg-aura-lime/10 px-2.5 py-1 rounded">
                                {activeNodesCount} Running Node{activeNodesCount !== 1 ? 's' : ''}
                              </div>
                            ) : (
                              <div className="text-[9px] font-black uppercase tracking-wider text-red-400 bg-red-400/10 px-2.5 py-1 rounded">
                                Inactive User
                              </div>
                            )}
                            <div className="text-[7px] text-aura-muted uppercase tracking-widest font-black mt-1">
                              History Nodes: {totalNodesCount}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                  {users.filter(u => {
                    const matchesSearch = u.name?.toLowerCase().includes(notifSearchTerm.toLowerCase()) || u.email?.toLowerCase().includes(notifSearchTerm.toLowerCase()) || u.id?.toLowerCase().includes(notifSearchTerm.toLowerCase());
                    const activeNodesCount = investments.filter(i => i.user_id === u.id && i.status === 'active').length;
                    const totalNodesCount = investments.filter(i => i.user_id === u.id).length;
                    
                    if (notifUserFilter === 'inactive') {
                      if (activeNodesCount > 0) return false;
                    } else if (notifUserFilter === 'inactive_investors') {
                      if (activeNodesCount > 0 || totalNodesCount === 0) return false;
                    }
                    return matchesSearch;
                  }).length === 0 && (
                    <div className="text-center py-20">
                      <p className="text-[10px] uppercase font-black tracking-widest text-aura-muted">No Clients Found matching Filter Parameters</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'csecurity' && (
          <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-8 bg-white/5 border border-white/5 rounded-[40px] space-y-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
                  <ShieldCheck size={18} className="text-aura-lime" /> Protocol Integrity
                </h3>
                <div className="space-y-4">
                  {[
                    { label: 'Platform Encryption', value: 'AES-256', status: 'ACTIVE' },
                    { label: 'Access Control', value: 'RBAC_LEVEL_4', status: 'ACTIVE' },
                    { label: 'Threat Monitoring', value: 'ML_ANOMALY', status: 'ACTIVE' },
                  ].map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white">{p.label}</p>
                        <p className="text-[8px] font-bold uppercase tracking-widest text-aura-muted">{p.value}</p>
                      </div>
                      <span className="text-[8px] font-black uppercase tracking-widest text-aura-lime px-2 py-1 bg-aura-lime/10 rounded">{p.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-8 bg-white/5 border border-white/5 rounded-[40px] flex flex-col justify-center text-center space-y-4">
                <Shield size={48} className="mx-auto text-aura-lime animate-pulse" />
                <h3 className="text-xl font-bold uppercase tracking-tight italic font-serif tracking-tighter">Security Handshake</h3>
                <p className="text-aura-muted text-[10px] uppercase font-bold tracking-widest max-w-xs mx-auto leading-relaxed">
                  The terminal is currently operating under institutional security parameters. All attempts at invalid access are logged and blocked automatically.
                </p>
                <div className="pt-4 flex items-center justify-center gap-4">
                  <div className="text-center">
                    <p className="text-xl font-black">{stats.securityAlerts}</p>
                    <p className="text-[8px] font-bold text-aura-muted uppercase">Active Alerts</p>
                  </div>
                  <div className="h-8 w-px bg-white/5"></div>
                  <div className="text-center">
                    <p className="text-xl font-black text-aura-lime">99.9%</p>
                    <p className="text-[8px] font-bold text-aura-muted uppercase">Prevention Rate</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 bg-white/5 border border-white/5 rounded-[40px] space-y-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-white">System-Wide Audit Logs</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-aura-muted">Event Descriptor</th>
                      <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-aura-muted">Subject ID</th>
                      <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-aura-muted">Status</th>
                      <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-aura-muted text-right">Z-Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.02]">
                    {securityLogs.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-aura-muted text-[10px] font-bold uppercase tracking-widest">No audit signals detected in current window</td>
                      </tr>
                    ) : (
                      securityLogs.map(log => (
                        <tr key={log.id} className="group hover:bg-white/[0.01]">
                          <td className="px-6 py-4">
                            <p className="text-[10px] font-bold text-white uppercase">{log.action?.replace(/_/g, ' ')}</p>
                            <p className="text-[8px] font-bold text-aura-muted uppercase truncate max-w-[200px]">Device: {log.deviceId?.substring(0, 12)}...</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-[9px] font-mono text-aura-muted truncate">{log.user_id}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded",
                              log.action?.includes('failed') ? "bg-red-500/10 text-red-400" :
                              log.action?.includes('mfa') ? "bg-blue-500/10 text-blue-400" : "bg-aura-lime/10 text-aura-lime"
                            )}>
                              {log.action?.includes('failed') ? 'DENIED' : 'AUTHORIZED'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <p className="text-[9px] text-aura-muted font-bold font-mono uppercase italic">
                              {log.timestamp ? new Date(log.timestamp.seconds * 1000).toLocaleTimeString() : 'now'}
                            </p>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'cnewsletter' && (
          <div className="space-y-12">
            {recentNewsletterNotifications.length > 0 && (
              <div className="p-6 bg-white/[0.01] border border-[#10b981]/20 rounded-[32px] space-y-4 animate-fadeIn">
                <div className="flex items-center gap-2">
                  <Bell size={16} className="text-[#34d399]" />
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-white">System Alerts: New Newsletter Subscriptions</h3>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {recentNewsletterNotifications.map(notif => (
                    <AdminNotificationItem
                      key={notif.id}
                      email={notif.email}
                      date={notif.date}
                      type="newsletter"
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="p-8 bg-white/5 border border-white/5 rounded-[40px] space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold uppercase tracking-tight italic font-serif">Newsletter Dashboard</h3>
                  <p className="text-[10px] font-black text-aura-muted uppercase tracking-[0.3em] mt-1">
                    Showing {subscribers.length} total subscribers registered to the network
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-aura-muted">Email Address</th>
                      <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-aura-muted">Subscription Date</th>
                      <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-aura-muted text-right">Subscription Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.02]">
                    {subscribers.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-6 py-12 text-center text-aura-muted text-[10px] font-bold uppercase tracking-widest">
                          No newsletter subscribers loaded on this node
                        </td>
                      </tr>
                    ) : (
                      subscribers.map((sub, index) => {
                        const dateObj = sub.created_at ? new Date(sub.created_at.seconds ? sub.created_at.seconds * 1000 : sub.created_at) : new Date();
                        const subDate = dateObj.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
                        const subTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

                        return (
                          <tr key={sub.id || index} className="group hover:bg-white/[0.01]">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-bold text-white font-sans">{sub.email}</span>
                                <button
                                  onClick={async () => {
                                    try {
                                      await navigator.clipboard.writeText(sub.email);
                                      toast.success(`Copied: ${sub.email}`);
                                    } catch (err) {
                                      toast.error("Failed to copy email.");
                                    }
                                  }}
                                  className="p-1.5 px-3 rounded-lg bg-white/[0.05] border border-white/10 text-[10px] text-aura-muted hover:text-white hover:bg-primary/20 hover:border-primary/40 flex items-center gap-1.5 transition-all shadow-sm"
                                  title="Copy subscriber email"
                                >
                                  <Copy size={11} />
                                  <span>Copy</span>
                                </button>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-sm text-white/95 font-sans">{subDate}</p>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <p className="text-[10px] text-aura-muted font-bold font-mono uppercase italic">
                                {subTime}
                              </p>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'cretirement' && (
          <CipherRetirementAdmin currentUserEmail={user?.email || 'cipher_root'} />
        )}

        {activeTab === 'cloans' && (
          <CipherLoansAdmin currentUserEmail={user?.email || 'cipher_root'} />
        )}

        {activeTab === 'csecurities' && (
          <CipherSecuritiesReports currentUserEmail={user?.email || 'cipher_root'} />
        )}
      </main>

      {/* CIPHER TICKET OVERLAY DETAILED RECEIPT */}
      <AnimatePresence>
        {selectedTicket && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#020202]/90 backdrop-blur-md z-[9999] flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setSelectedTicket(null)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-[#0c0c0e] border border-white/10 rounded-[40px] w-full max-w-2xl p-8 space-y-8 relative my-8 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button 
                onClick={() => setSelectedTicket(null)}
                className="absolute top-6 right-6 p-2 text-aura-muted hover:text-white hover:bg-white/5 rounded-full transition-all"
              >
                <X size={20} />
              </button>

              {/* Header */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-aura-lime/10 text-aura-lime rounded-full border border-aura-lime/20">
                    Cipher Secure Protocol
                  </span>
                  <span className="text-[10px] font-mono text-aura-muted">
                    ID: {selectedTicket.id?.substring(0, 16)}...
                  </span>
                </div>
                <h3 className="text-2xl font-black font-serif italic text-white capitalize">
                  {ticketType === 'mining_upgrade' ? 'ASIC Purchase' : ticketType} Ticket
                </h3>
              </div>

              {/* Split Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-white">
                {/* Left Column: Transaction Metadata */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-aura-muted border-b border-white/5 pb-2">
                    Transaction Specification
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-aura-muted uppercase font-bold text-[10px]">Reference:</span>
                      <span className="font-mono text-white text-xs">{selectedTicket.reference || selectedTicket.id || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-aura-muted uppercase font-bold text-[10px]">Amount:</span>
                      <span className="text-lg font-black text-white font-serif italic">
                        {formatCurrency(selectedTicket.amount || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-aura-muted uppercase font-bold text-[10px]">Status:</span>
                      <span className={cn(
                        "text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded",
                        selectedTicket.status === 'pending' ? "bg-yellow-400/10 text-yellow-500" :
                        selectedTicket.status === 'approved' || selectedTicket.status === 'active' ? "bg-aura-lime/10 text-aura-lime" :
                        "bg-red-400/10 text-red-500"
                      )}>
                        {selectedTicket.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-aura-muted uppercase font-bold text-[10px]">Timestamp:</span>
                      <span className="text-white text-xs">
                        {selectedTicket.created_at ? new Date(selectedTicket.created_at).toLocaleString() : 'N/A'}
                      </span>
                    </div>
                    {/* Sub-details depending on method/type */}
                    {ticketType === 'investment' && (
                      <div className="flex justify-between items-center text-xs pt-1">
                        <span className="text-aura-muted uppercase font-bold text-[10px]">Investment Plan:</span>
                        <span className="text-aura-lime uppercase font-black tracking-widest text-[10px]">
                          {selectedTicket.plan_name || 'Regular'} Node
                        </span>
                      </div>
                    )}
                    {ticketType === 'mining_upgrade' && (
                      <div className="flex justify-between items-center text-xs pt-1">
                        <span className="text-aura-muted uppercase font-bold text-[10px]">ASIC Model Name:</span>
                        <span className="text-aura-lime uppercase font-black tracking-widest text-[10px]">
                          {selectedTicket.machine_name || 'ASIC Miner'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Settlement specifications for withdrawals or deposits */}
                  {ticketType === 'withdrawal' && (
                    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-2 mt-4 text-white">
                      <p className="text-[8px] font-black uppercase tracking-widest text-aura-muted">Destination Details</p>
                      {selectedTicket.method === 'bank' ? (
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px]">
                            <span className="text-aura-muted">Bank Name:</span>
                            <span className="text-white font-bold">{selectedTicket.details?.bankName || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between text-[10px]">
                            <span className="text-aura-muted">Account Number:</span>
                            <div className="flex items-center gap-1">
                              <span className="text-white font-mono">{selectedTicket.details?.accNum || 'N/A'}</span>
                              <button 
                                onClick={() => {
                                  navigator.clipboard.writeText(selectedTicket.details?.accNum || '');
                                  toast.success("Account copied");
                                }}
                                className="text-aura-lime hover:text-white"
                              >
                                <Copy size={10} />
                              </button>
                            </div>
                          </div>
                          <div className="flex justify-between text-[10px]">
                            <span className="text-aura-muted">Holder Name:</span>
                            <span className="text-white">{selectedTicket.details?.accName || 'N/A'}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px]">
                            <span className="text-aura-muted">Network Protocol:</span>
                            <span className="text-white font-bold">{selectedTicket.details?.type?.toUpperCase() || 'USDT'}</span>
                          </div>
                          <div className="flex justify-between text-[10px]">
                            <span className="text-aura-muted">Wallet Location:</span>
                            <div className="flex items-center gap-1">
                              <span className="text-white font-mono text-[9px] truncate max-w-[140px] block" title={selectedTicket.details?.address}>{selectedTicket.details?.address || 'N/A'}</span>
                              <button 
                                onClick={() => {
                                  navigator.clipboard.writeText(selectedTicket.details?.address || '');
                                  toast.success("Address copied");
                                }}
                                className="text-aura-lime hover:text-white"
                              >
                                <Copy size={10} />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Right Column: User Profile Identification */}
                {(() => {
                  const matchedUser = users.find(u => u.id === selectedTicket.user_id);
                  return (
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-aura-muted border-b border-white/5 pb-2">
                        User Identification Credentials
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-aura-muted uppercase font-bold text-[10px]">User Account ID:</span>
                          <span className="font-mono text-white text-[10px] truncate max-w-[140px] block" title={selectedTicket.user_id}>
                            {selectedTicket.user_id || 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-aura-muted uppercase font-bold text-[10px]">Full Name:</span>
                          <span className="text-white font-bold uppercase text-xs">{matchedUser?.name || selectedTicket.user_name || 'Anonymous User'}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-aura-muted uppercase font-bold text-[10px]">Email Address:</span>
                          <span className="text-white text-xs truncate max-w-[150px] block" title={matchedUser?.email}>{matchedUser?.email || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-aura-muted uppercase font-bold text-[10px]">Geographic Origin:</span>
                          <span className="text-white font-bold text-xs uppercase">{matchedUser?.countryName || matchedUser?.country || 'Global/Undefined'}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-aura-muted uppercase font-bold text-[10px]">Available Balance:</span>
                          <span className="text-aura-lime font-mono font-bold text-xs">
                            {formatCurrency(matchedUser?.available_balance || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-aura-muted uppercase font-bold text-[10px]">Investment Value:</span>
                          <span className="text-cyan-400 font-mono font-bold text-xs">
                            {formatCurrency(matchedUser?.total_invested || 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Footer Controls / Actions */}
              <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row gap-3 justify-end">
                <button 
                  onClick={() => setSelectedTicket(null)}
                  className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs uppercase font-black tracking-widest transition-all"
                >
                  Close Verification Panel
                </button>
                
                {selectedTicket.status === 'pending' && (
                  <div className="flex gap-3">
                    <button 
                      onClick={() => {
                        if (ticketType === 'deposit') declineDeposit(selectedTicket.id);
                        if (ticketType === 'withdrawal') declineWithdrawal(selectedTicket);
                        if (ticketType === 'investment') rejectInvestment(selectedTicket.id);
                        if (ticketType === 'mining_upgrade') declineMiningUpgrade(selectedTicket.id, selectedTicket.user_id, selectedTicket.machine_name || 'ASIC Miner');
                        setSelectedTicket(null);
                      }}
                      className="px-6 py-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl text-xs uppercase font-black tracking-widest transition-all border border-red-500/20"
                    >
                      Decline/Reject
                    </button>
                    <button 
                      onClick={() => {
                        if (ticketType === 'deposit') approveDeposit(selectedTicket);
                        if (ticketType === 'withdrawal') approveWithdrawal(selectedTicket);
                        if (ticketType === 'investment') approveInvestment(selectedTicket);
                        if (ticketType === 'mining_upgrade') approveMiningUpgrade(selectedTicket);
                        setSelectedTicket(null);
                      }}
                      className="px-6 py-3 bg-aura-lime text-aura-black hover:bg-aura-lime/95 rounded-xl text-xs uppercase font-black tracking-widest transition-all"
                    >
                      Authorize & Approve
                    </button>
                  </div>
                )}

                {ticketType === 'investment' && (selectedTicket.status === 'active' || selectedTicket.status === 'inactive') ? (
                  <button 
                    onClick={() => {
                      stopInvestment(selectedTicket);
                      setSelectedTicket(null);
                    }}
                    className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs uppercase font-black tracking-widest transition-all"
                  >
                    Emergency Stop Investment Node
                  </button>
                ) : null}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* INVESTMENTS PREVIEW OVERLAY */}
      <AnimatePresence>
        {investmentPreviewType && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#020202]/95 backdrop-blur-md z-[9999] flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setInvestmentPreviewType(null)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-[#0c0c0e] border border-white/10 rounded-[40px] w-full max-w-4xl p-8 space-y-8 relative my-8"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button 
                onClick={() => setInvestmentPreviewType(null)}
                className="absolute top-6 right-6 p-2 text-aura-muted hover:text-white hover:bg-white/5 rounded-full transition-all"
              >
                <X size={20} />
              </button>

              {/* Header */}
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-aura-lime/10 text-aura-lime rounded-full border border-aura-lime/20">
                  Cipher Real-time Monitoring
                </span>
                <h3 className="text-2xl font-black font-serif italic text-white">
                  {investmentPreviewType === 'active' ? 'Active investments' : 'Inactive investments'} Preview List
                </h3>
              </div>

              {/* List Table */}
              <div className="bg-white/[0.02] border border-white/5 rounded-[24px] overflow-hidden overflow-x-auto min-h-[200px] max-h-[450px]">
                <table className="w-full text-left min-w-[700px] border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.01]">
                      <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-aura-muted">User ID</th>
                      <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-aura-muted">Full Name / Username</th>
                      <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-aura-muted">Email</th>
                      <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-aura-muted">Investment Plan</th>
                      <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-aura-muted">Amount</th>
                      <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-aura-muted">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.02] text-white">
                    {(investmentPreviewType === 'active' 
                      ? investments.filter((i: any) => i.status === 'active')
                      : investments.filter((i: any) => i.status === 'inactive' || i.status === 'stopped' || i.status === 'completed' || i.status === 'rejected')
                    ).map((inv: any) => {
                      const u = getUserDetails(inv.user_id, inv.user_name);
                      const matchedUser = users.find(x => x.id === inv.user_id);
                      return (
                        <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-3 font-mono text-[10px] text-gray-400">
                            <span className="truncate max-w-[100px] block font-mono font-bold" title={inv.user_id}>{inv.user_id}</span>
                          </td>
                          <td className="px-6 py-3">
                            <div className="text-xs font-bold uppercase">{u.name}</div>
                            <div className="text-[9px] text-gray-500 font-mono">@{matchedUser?.username || 'no_uname'}</div>
                          </td>
                          <td className="px-6 py-3 text-xs text-aura-muted font-mono">{matchedUser?.email || u.email}</td>
                          <td className="px-6 py-3">
                            <span className="text-[10px] font-black uppercase tracking-wider text-aura-lime bg-aura-lime/5 px-2 py-0.5 rounded border border-aura-lime/10">
                              {inv.plan_name || 'Regular'} Node
                            </span>
                          </td>
                          <td className="px-6 py-3 text-sm font-black font-serif italic text-white/90">
                            {formatCurrency(inv.amount || 0)}
                          </td>
                          <td className="px-6 py-3">
                            <span className={cn("text-[8px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded", 
                              inv.status === 'active' ? "bg-aura-lime/10 text-aura-lime" : 
                              inv.status === 'inactive' ? "bg-blue-400/10 text-blue-400" :
                              inv.status === 'completed' ? "bg-green-400/10 text-green-400" :
                              "bg-red-400/10 text-red-500"
                            )}>
                              {inv.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {(investmentPreviewType === 'active' 
                      ? investments.filter((i: any) => i.status === 'active').length 
                      : investments.filter((i: any) => i.status === 'inactive' || i.status === 'stopped' || i.status === 'completed' || i.status === 'rejected').length
                    ) === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center px-6 py-12 text-xs font-bold uppercase tracking-widest text-aura-muted">
                          No {investmentPreviewType} investments detected in real-time sync.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-4 border-t border-white/5">
                <button 
                  onClick={() => setInvestmentPreviewType(null)}
                  className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs uppercase font-black tracking-widest transition-all"
                >
                  Close Monitor Panel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface CipherPlansEditorProps {
  plans: any[];
}

export function CipherPlansEditor({ plans }: CipherPlansEditorProps) {
  const [localPlans, setLocalPlans] = useState<any[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    if (plans && plans.length > 0) {
      setLocalPlans(plans.map(p => ({
        ...p,
        roiPercent: (p.roi * 100).toString(),
        weekday_roiPercent: ((p.weekday_roi !== undefined ? p.weekday_roi : p.roi) * 100).toString(),
        weekend_roiPercent: ((p.weekend_roi !== undefined ? p.weekend_roi : (p.roi * 0.6)) * 100).toString(),
        minStr: p.min.toString(),
        maxStr: p.max.toString(),
        minWithdrawalStr: (p.minWithdrawal || 0).toString(),
        durationStr: (p.duration || 1).toString(),
        cycleDurationStr: (p.cycle_duration_hours !== undefined ? p.cycle_duration_hours : 24).toString()
      })));
    }
  }, [plans]);

  const handleChangeField = (id: string, field: string, value: any) => {
    setLocalPlans(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, [field]: value };
      }
      return p;
    }));
  };

  const handleSavePlan = async (id: string) => {
    const plan = localPlans.find(p => p.id === id);
    if (!plan) return;

    setLoadingId(id);
    try {
      const weekdayRoiPercentVal = parseFloat(plan.weekday_roiPercent);
      const weekendRoiPercentVal = parseFloat(plan.weekend_roiPercent);
      const weekdayRoiNum = weekdayRoiPercentVal / 100;
      const weekendRoiNum = weekendRoiPercentVal / 100;
      const minNum = parseFloat(plan.minStr);
      const maxNum = parseFloat(plan.maxStr);
      const durationNum = parseInt(plan.durationStr) || 1;
      const cycleDurationNum = parseInt(plan.cycleDurationStr) || 24;
      const minWithdrawalNum = parseFloat(plan.minWithdrawalStr) || 0;

      if (isNaN(weekdayRoiNum) || isNaN(weekendRoiNum) || isNaN(cycleDurationNum) || isNaN(minNum) || isNaN(maxNum)) {
        toast.error("Please provide valid numeric fields.");
        return;
      }

      const docRef = doc(db, 'investment_plans', id);
      const updatePayload = {
        name: plan.name,
        description: plan.description || '',
        roi: weekdayRoiNum,
        weekday_roi: weekdayRoiNum,
        weekend_roi: weekendRoiNum,
        cycle_duration_hours: cycleDurationNum,
        min: minNum,
        max: maxNum,
        duration: durationNum,
        minWithdrawal: minWithdrawalNum,
        active_status: plan.active_status !== false,
        card_background: plan.card_background || '',
        card_border: plan.card_border || '',
        accent_color: plan.accent_color || '',
        updated_at: new Date().toISOString()
      };

      await setDoc(docRef, updatePayload, { merge: true });
      toast.success(`${plan.name} configuration saved successfully!`);
      
      await logAudit('update_investment_plan', `Updated ${plan.name} (Weekday ROI: ${plan.weekday_roiPercent}%, Weekend ROI: ${plan.weekend_roiPercent}%, cycle: ${cycleDurationNum}h, min: ${minNum}, max: ${maxNum})`);
    } catch (err: any) {
      toast.error(`Error saving plan: ${err?.message || err}`);
    } finally {
      setLoadingId(null);
    }
  };

  const handleInitializeDefaults = async () => {
    if (!window.confirm("Initialize or recover factory fallback investment plans? This resets all changes.")) return;
    setResetting(true);
    try {
      const DEFAULT_PLANS = [
        {
          id: 'regular',
          name: 'Regular Plan',
          min: 100,
          max: 90000,
          roi: 0.02,
          weekday_roi: 0.02,
          weekend_roi: 0.01,
          cycle_duration_hours: 24,
          minWithdrawal: 3,
          description: 'Steady growth for smart investors',
          color: 'text-lime-400',
          accentColor: '#009e42',
          borderColor: 'border-lime-500/20',
          bgColor: 'bg-black/40',
          buttonColor: 'bg-[#009e42] hover:bg-[#02d147] active:bg-[#008236]',
          gradient: 'from-lime-500/20 to-emerald-500/10',
          duration: 1,
          active_status: true
        },
        {
          id: 'premium',
          name: 'Premium Plan',
          min: 100000,
          max: 900000,
          roi: 0.025,
          weekday_roi: 0.025,
          weekend_roi: 0.015,
          cycle_duration_hours: 24,
          minWithdrawal: 15000,
          description: 'Higher returns with optimal balance',
          color: 'text-lime-400',
          accentColor: '#009e42',
          borderColor: 'border-lime-500/20',
          bgColor: 'bg-black/50',
          buttonColor: 'bg-[#009e42] hover:bg-[#02d147] active:bg-[#008236]',
          gradient: 'from-lime-500/20 to-teal-500/10',
          duration: 3,
          active_status: true
        },
        {
          id: 'elite',
          name: 'Elite Plan',
          min: 1000000,
          max: 50000000,
          roi: 0.03,
          weekday_roi: 0.03,
          weekend_roi: 0.015,
          cycle_duration_hours: 24,
          minWithdrawal: 30000,
          description: 'Maximum returns for elite investors',
          color: 'text-lime-400',
          accentColor: '#009e42',
          borderColor: 'border-lime-500/20',
          bgColor: 'bg-black/40',
          buttonColor: 'bg-[#009e42] hover:bg-[#02d147] active:bg-[#008236]',
          gradient: 'from-lime-500/20 to-purple-500/20',
          duration: 7,
          active_status: true
        }
      ];

      for (const plan of DEFAULT_PLANS) {
        const docRef = doc(db, 'investment_plans', plan.id);
        await setDoc(docRef, {
          ...plan,
          updated_at: new Date().toISOString()
        });
      }
      toast.success("Default plans mounted and synchronized successfully!");
    } catch (err: any) {
      toast.error(`Restore failed: ${err?.message || err}`);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-8 text-white">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-6">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 bg-aura-lime/10 text-aura-lime rounded-full border border-aura-lime/20">
            Cipher ROI Index Protocols
          </span>
          <h2 className="text-3xl font-black font-serif italic mt-2">Yield Engine Controllers</h2>
        </div>
        <div>
          <button 
            disabled={resetting}
            onClick={handleInitializeDefaults}
            className="px-5 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs uppercase font-black tracking-widest border border-white/5 transition-all inline-flex items-center gap-2 active:scale-95 disabled:opacity-50"
          >
            <RefreshCw size={14} className={cn(resetting && "animate-spin")} />
            Reset Factory Defaults
          </button>
        </div>
      </div>

      {localPlans.length === 0 ? (
        <div className="p-16 text-center bg-white/[0.01] border border-white/5 rounded-[40px] space-y-4">
          <Zap size={32} className="mx-auto text-aura-muted animate-pulse" />
          <h3 className="text-sm font-black uppercase tracking-widest text-aura-muted">No Live Plans Initialized</h3>
          <p className="text-[10px] text-aura-muted uppercase tracking-wider max-w-xs mx-auto">Click "Reset Factory Defaults" above to quickly seed the standard Regular, Premium, and Elite tiers on Firestore.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          {localPlans.map((plan) => {
            const customCardStyle: React.CSSProperties = {};
            if (plan.card_background) customCardStyle.backgroundColor = plan.card_background;
            if (plan.card_border) customCardStyle.borderColor = plan.card_border;
            if (plan.accent_color) customCardStyle.boxShadow = `0 10px 40px -10px ${plan.accent_color}66`;

            return (
              <div 
                key={plan.id}
                className="bg-white/[0.02] border border-white/5 rounded-[40px] p-6 sm:p-8 space-y-6"
              >
                <div className="flex justify-between items-center border-b border-white/5 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-aura-lime animate-ping" />
                    <h3 className="text-sm font-black uppercase tracking-wider">
                      Tier Key: <span className="font-mono text-aura-lime font-bold">{plan.id}</span>
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-aura-muted font-bold">Active Status</label>
                    <button 
                      onClick={() => handleChangeField(plan.id, 'active_status', plan.active_status === false ? true : false)}
                      className={cn(
                        "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all select-none border",
                        plan.active_status !== false 
                          ? "bg-aura-lime/10 border-aura-lime/30 text-aura-lime" 
                          : "bg-white/5 border-white/10 text-aura-muted"
                      )}
                    >
                      {plan.active_status !== false ? "Enabled" : "Disabled"}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-aura-muted mb-1.5 block">Tier Name</label>
                      <input 
                        type="text"
                        value={plan.name || ''}
                        onChange={(e) => handleChangeField(plan.id, 'name', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-black text-white outline-none focus:border-aura-lime focus:bg-white/10 transition-all font-sans"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-aura-muted mb-1.5 block">Weekday Yield % (e.g., 2.5)</label>
                      <input 
                        type="number"
                        step="0.1"
                        value={plan.weekday_roiPercent || ''}
                        onChange={(e) => handleChangeField(plan.id, 'weekday_roiPercent', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-white outline-none focus:border-aura-lime focus:bg-white/10 transition-all font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-aura-muted mb-1.5 block">Weekend Yield % (e.g., 1.5)</label>
                      <input 
                        type="number"
                        step="0.1"
                        value={plan.weekend_roiPercent || ''}
                        onChange={(e) => handleChangeField(plan.id, 'weekend_roiPercent', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-white outline-none focus:border-aura-lime focus:bg-white/10 transition-all font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-aura-muted mb-1.5 block">Cycle Duration (Hours)</label>
                      <input 
                        type="number"
                        value={plan.cycleDurationStr || ''}
                        onChange={(e) => handleChangeField(plan.id, 'cycleDurationStr', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-white outline-none focus:border-aura-lime focus:bg-white/10 transition-all font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-aura-muted mb-1.5 block">Minimum Deposit ($)</label>
                      <input 
                        type="number"
                        value={plan.minStr || ''}
                        onChange={(e) => handleChangeField(plan.id, 'minStr', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-white outline-none focus:border-aura-lime focus:bg-white/10 transition-all font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-aura-muted mb-1.5 block">Maximum Deposit ($)</label>
                      <input 
                        type="number"
                        value={plan.maxStr || ''}
                        onChange={(e) => handleChangeField(plan.id, 'maxStr', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-white outline-none focus:border-aura-lime focus:bg-white/10 transition-all font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-aura-muted mb-1.5 block">Duration Days (Cycles)</label>
                      <input 
                        type="number"
                        value={plan.durationStr || ''}
                        onChange={(e) => handleChangeField(plan.id, 'durationStr', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-white outline-none focus:border-aura-lime focus:bg-white/10 transition-all font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-aura-muted mb-1.5 block">Minimum Withdrawal Limit ($)</label>
                      <input 
                        type="number"
                        value={plan.minWithdrawalStr || ''}
                        onChange={(e) => handleChangeField(plan.id, 'minWithdrawalStr', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-white outline-none focus:border-aura-lime focus:bg-white/10 transition-all font-bold"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-aura-muted mb-1.5 block">Descriptive Bio</label>
                      <input 
                        type="text"
                        value={plan.description || ''}
                        onChange={(e) => handleChangeField(plan.id, 'description', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-sans text-white outline-none focus:border-aura-lime focus:bg-white/10 transition-all font-semibold"
                      />
                    </div>

                    <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-white/5 pt-4 mt-2">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-aura-muted mb-1.5 block">Card Background CSS/Hex</label>
                        <div className="flex gap-2">
                          <input 
                            type="text"
                            placeholder="e.g., #0b0f19"
                            value={plan.card_background || ''}
                            onChange={(e) => handleChangeField(plan.id, 'card_background', e.target.value)}
                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[11px] font-mono text-white outline-none focus:border-aura-lime focus:bg-white/10 transition-all font-bold"
                          />
                          <div 
                            className="w-8 h-8 rounded-lg border border-white/10 flex-shrink-0"
                            style={{ backgroundColor: plan.card_background || '#000000' }}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-aura-muted mb-1.5 block">Card Border CSS/Hex</label>
                        <div className="flex gap-2">
                          <input 
                            type="text"
                            placeholder="e.g., #1e293b"
                            value={plan.card_border || ''}
                            onChange={(e) => handleChangeField(plan.id, 'card_border', e.target.value)}
                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[11px] font-mono text-white outline-none focus:border-aura-lime focus:bg-white/10 transition-all font-bold"
                          />
                          <div 
                            className="w-8 h-8 rounded-lg border border-white/10 flex-shrink-0"
                            style={{ backgroundColor: plan.card_border || '#000000' }}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-aura-muted mb-1.5 block">Aura Glow Color Hex</label>
                        <div className="flex gap-2">
                          <input 
                            type="text"
                            placeholder="e.g., #3b82f6"
                            value={plan.accent_color || ''}
                            onChange={(e) => handleChangeField(plan.id, 'accent_color', e.target.value)}
                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[11px] font-mono text-white outline-none focus:border-aura-lime focus:bg-white/10 transition-all font-bold"
                          />
                          <div 
                            className="w-8 h-8 rounded-lg border border-white/10 flex-shrink-0"
                            style={{ backgroundColor: plan.accent_color || '#000000' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-4 flex flex-col justify-between bg-black/40 border border-white/[0.03] rounded-3xl p-5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br opacity-5 blur-xl -z-0" style={{ background: plan.accent_color || '#3b82f6' }} />
                    
                    <div className="z-10 space-y-4">
                      <div>
                        <span className="text-[7px] font-black uppercase tracking-[0.2em] px-2 py-0.5 bg-white/10 text-white rounded-full font-bold">
                          Live UI Preview Aura
                        </span>
                        <p className="text-[8px] text-aura-muted mt-1 uppercase tracking-wider font-semibold">Simulates user card rendering parameters.</p>
                      </div>

                      <div 
                        className={cn(
                          "border rounded-3xl flex flex-col p-5 shadow-lg transition-all duration-300 relative overflow-hidden min-h-[220px] max-w-[240px] mx-auto",
                          !plan.card_border && "border-white/5",
                          !plan.card_background && "bg-[#090b10]"
                        )}
                        style={customCardStyle}
                      >
                        <div className="relative z-10 flex-1 flex flex-col justify-between">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-base font-black italic font-serif" style={plan.accent_color ? { color: plan.accent_color } : { color: '#ffffff' }}>
                              {plan.name || 'Tier Name'}
                            </h4>
                            <div 
                              className="inline-flex items-center justify-center p-1.5 rounded-lg"
                              style={{ backgroundColor: `${plan.accent_color || '#fff'}22`, border: `1px solid ${plan.accent_color || '#fff'}33` }}
                            >
                              <Zap size={10} className="text-white" />
                            </div>
                          </div>

                          <div className="border-t border-white/5 pt-2 my-2 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[7px] font-black text-aura-muted uppercase tracking-widest font-bold">Weekday Yield</span>
                              <span className="text-xs font-black italic font-serif font-bold text-white">
                                {plan.weekday_roiPercent || '0.0'}%
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[7px] font-black text-aura-muted uppercase tracking-widest font-bold">Weekend Yield</span>
                              <span className="text-xs font-black italic font-serif font-bold text-white">
                                {plan.weekend_roiPercent || '0.0'}%
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[7px] font-black text-aura-muted uppercase tracking-widest font-bold">Cycle Duration</span>
                              <span className="text-xs font-mono font-bold text-white">
                                {plan.cycleDurationStr || '24'}h
                              </span>
                            </div>
                          </div>

                          <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-1.5 p-1.5 rounded-lg border border-white/5 bg-white/5 text-[8px] font-bold text-white uppercase tracking-wider">
                              <CreditCard size={8} />
                              {formatCurrency(parseFloat(plan.minStr || '0'))} - {formatCurrency(parseFloat(plan.maxStr || '0'))}
                            </div>
                          </div>

                          <button 
                            disabled 
                            className="w-full py-2 rounded-lg text-white font-black text-[7px] uppercase tracking-widest opacity-60 pointer-events-none font-bold"
                            style={{ backgroundColor: plan.accent_color || '#22c55e' }}
                          >
                            Initialize Node
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6">
                      <button 
                        disabled={loadingId !== null}
                        onClick={() => handleSavePlan(plan.id)}
                        className="w-full py-3 bg-aura-lime hover:bg-opacity-80 active:scale-[0.98] text-black font-black text-[9px] uppercase tracking-[0.2em] transition-all rounded-xl shadow-lg flex items-center justify-center gap-2 font-bold"
                      >
                        {loadingId === plan.id ? (
                          <RefreshCw size={12} className="animate-spin" />
                        ) : (
                          <ShieldCheck size={12} />
                        )}
                        Save {plan.name || 'Tier'} Configurations
                      </button>
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
}
