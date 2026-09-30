import React, { useState } from 'react';
import { cn } from '../lib/utils';
import { 
  PlusCircle, 
  MinusCircle, 
  RefreshCw, 
  Zap, 
  Calendar,
  Clock,
  Tag,
  CreditCard,
  User,
  DollarSign,
  X,
  Copy,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TransactionTicketProps {
  tx: {
    id: string;
    type: string;
    amount: number;
    status: string;
    created_at: string;
    method?: string;
    plan_name?: string;
    reference?: string;
    type_detail?: string;
    sender_id?: string;
    receiver_id?: string;
    user_name?: string;
    description?: string;
    fee?: number;
    final_amount?: number;
    details?: any;
  };
  currentUserId?: string;
  variant?: 'fund' | 'dashboard';
}

const formatTitleCase = (text: string): string => {
  if (!text) return '';
  const uppercaseAcronyms = ['roi', 'pts', 'usd', 'ai', 'cga', 'twn', 'btc', 'usdt', 'erc20'];
  return text
    .split(/[\s_-]+/)
    .map(word => {
      const lower = word.toLowerCase();
      if (uppercaseAcronyms.includes(lower)) {
        return word.toUpperCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
};

export const TransactionTicket: React.FC<TransactionTicketProps> = ({ tx, currentUserId, variant = 'fund' }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  const dateObj = new Date(tx.created_at);
  const dateFormatted = isNaN(dateObj.getTime()) 
    ? '-' 
    : dateObj.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  const timeFormatted = isNaN(dateObj.getTime())
    ? '-'
    : dateObj.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  // Determine normalized ticket type in Title Case per user request
  let displayType = tx.type || '';
  const typeLower = displayType.toLowerCase();

  if (typeLower === 'transfer') {
    if (tx.type_detail === 'internal_transfer') {
      displayType = 'Internal Transfer';
    } else if (tx.sender_id === currentUserId) {
      displayType = 'Transfer Sent';
    } else {
      displayType = 'Transfer Received';
    }
  } else if (typeLower === 'deposit') {
    if (tx.is_mining_subscription || tx.machine_id || tx.machine_name) {
      displayType = tx.title || tx.plan_name || (tx.machine_name ? `${tx.machine_name} Purchase` : 'Mining Upgrade');
    } else {
      displayType = 'Capital Deposit';
    }
  } else if (typeLower === 'mining_upgrade') {
    displayType = tx.title || tx.plan_name || (tx.machine_name ? `${tx.machine_name} Purchase` : 'Mining Upgrade');
  } else if (typeLower === 'withdrawal') {
    displayType = 'Liquidity Withdrawal';
  } else if (typeLower === 'investment') {
    const planNameLower = (tx.plan_name || '').toLowerCase();
    if (planNameLower.includes('premium')) {
      displayType = 'Investment Premium Plan';
    } else {
      displayType = 'Investment Regular Plan';
    }
  } else if (typeLower === 'points_gain') {
    displayType = 'Daily Check-In Claim';
  } else if (typeLower === 'investment_reward') {
    displayType = 'Investment Bonus Claim';
  } else if (typeLower === 'rewards_conversion') {
    displayType = 'PTS to USD Conversion';
  } else if (typeLower === 'signup_bonus') {
    displayType = 'Signup Welcome Bonus';
  } else if (typeLower === 'fee') {
    displayType = tx.description ? formatTitleCase(tx.description) : 'System Protocol Fee';
  } else if (typeLower === 'ai_upgrade' || typeLower === 'ai_bot_upgrade') {
    displayType = 'Ai Bot Upgrade';
  } else if (typeLower === 'roi_harvest') {
    displayType = 'ROI Harvest';
  } else if (typeLower === 'compound') {
    displayType = 'Compound';
  } else {
    displayType = formatTitleCase(displayType);
  }

  // Ensure overall title case formatting
  displayType = formatTitleCase(displayType);

  // Determine status display and behavior
  const statusLower = (tx.status || '').toLowerCase();
  
  let statusText = tx.status || 'Pending';
  if (statusLower === 'approved') statusText = 'Approved';
  else if (statusLower === 'pending') statusText = 'Pending';
  else if (statusLower === 'completed') statusText = 'Completed';
  else if (statusLower === 'active') {
    statusText = (tx.type === 'investment' || tx.type === 'ai_upgrade' || tx.type === 'ai_bot_upgrade') ? 'Active' : 'Approved';
  } else if (statusLower === 'inactive') {
    statusText = 'Inactive';
  } else if (statusLower === 'declined' || statusLower === 'rejected') {
    statusText = 'Rejected';
  } else if (statusLower === 'terminated') {
    statusText = 'Terminated';
  }

  // Override status text for specific reward claim actions
  if (tx.type === 'points_gain' || tx.type === 'investment_reward') {
    if (statusLower === 'approved' || statusLower === 'completed' || statusLower === 'active') {
      statusText = 'Claimed';
    }
  }
  
  // STATUS COLORS:
  let statusBg = 'bg-yellow-400/10 text-yellow-400 border border-[0.5px] border-yellow-400/30';
  
  if (statusLower === 'pending' || statusLower === 'inactive') {
    statusBg = 'bg-yellow-400/10 text-yellow-400 border border-[0.5px] border-yellow-400/30';
  } else if (statusLower === 'approved' || statusLower === 'completed' || statusLower === 'active') {
    if (tx.type === 'withdrawal') {
      statusBg = 'bg-red-500/10 text-red-500 border border-[0.5px] border-red-500/30';
    } else {
      statusBg = 'bg-emerald-500/10 text-emerald-500 border border-[0.5px] border-emerald-500/30';
    }
  } else if (statusLower === 'declined' || statusLower === 'terminated' || statusLower === 'rejected') {
    statusBg = 'bg-red-500/10 text-red-500 border border-[0.5px] border-red-500/30';
  }

  // Get matching icon and icon bg colors
  let iconComponent = <Zap size={12} />;
  let iconBg = 'bg-white/5 text-blue-400';
  if (tx.type === 'deposit') {
    if (tx.is_mining_subscription || tx.machine_id || tx.machine_name) {
      iconComponent = <Zap size={12} />;
      iconBg = 'bg-cyan-500/10 text-cyan-400';
    } else {
      iconComponent = <PlusCircle size={12} />;
      iconBg = 'bg-emerald-500/10 text-emerald-400';
    }
  } else if (tx.type === 'mining_upgrade') {
    iconComponent = <Zap size={12} />;
    iconBg = 'bg-cyan-500/10 text-cyan-400';
  } else if (tx.type === 'withdrawal') {
    iconComponent = <MinusCircle size={12} />;
    iconBg = 'bg-red-500/10 text-red-500';
  } else if (tx.type === 'transfer') {
    iconComponent = <RefreshCw size={12} />;
    iconBg = 'bg-blue-500/10 text-blue-400';
  } else if (tx.type === 'investment') {
    iconComponent = <Zap size={12} />;
    iconBg = 'bg-purple-500/10 text-purple-400';
  } else if (tx.type === 'points_gain') {
    iconComponent = <PlusCircle size={12} />;
    iconBg = 'bg-emerald-500/10 text-emerald-400';
  } else if (tx.type === 'investment_reward') {
    iconComponent = <Zap size={12} />;
    iconBg = 'bg-emerald-500/10 text-emerald-400';
  } else if (tx.type === 'rewards_conversion') {
    iconComponent = <RefreshCw size={12} />;
    iconBg = 'bg-purple-500/10 text-purple-400';
  } else if (tx.type === 'fee') {
    iconComponent = <MinusCircle size={12} />;
    iconBg = 'bg-red-500/10 text-red-500';
  } else if (tx.type === 'ai_upgrade' || tx.type === 'ai_bot_upgrade') {
    iconComponent = <Zap size={12} />;
    iconBg = 'bg-amber-500/10 text-amber-400';
  } else if (tx.type === 'roi_harvest') {
    iconComponent = <Zap size={12} />;
    iconBg = 'bg-amber-500/10 text-amber-400';
  } else if (tx.type === 'compound') {
    iconComponent = <RefreshCw size={12} />;
    iconBg = 'bg-purple-500/10 text-purple-400';
  }

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsModalOpen(true);
  };

  const isPointsGain = tx.type === 'points_gain';
  const isWithType = tx.type === 'withdrawal' || tx.type === 'fee';
  const displaySign = isWithType ? '-' : '+';
  const displayAmount = isPointsGain ? `${tx.amount} PTS` : formatCurrency(Math.abs(tx.amount));

  const handleCopyReference = (refText: string) => {
    navigator.clipboard.writeText(refText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <>
      <div 
        id={`tx-card-${tx.id}`}
        onClick={handleCardClick}
        className={cn(
          "bg-[#11141b]/90 border border-white/5 rounded-2xl hover:border-white/10 hover:bg-[#141822] transition-all duration-300 cursor-pointer select-none overflow-hidden",
          variant === 'dashboard' ? "py-3 px-4" : "py-2.5 px-3.5"
        )}
      >
        <div id={`tx-header-${tx.id}`} className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div id={`tx-icon-frame-${tx.id}`} className={cn("w-7 h-7 rounded-lg flex items-center justify-center transition-transform duration-200", iconBg)}>
              {iconComponent}
            </div>
            <div>
              <p id={`tx-display-type-${tx.id}`} className="text-[10px] md:text-[11px] font-bold text-white tracking-wide">
                {displayType}
              </p>
              <p id={`tx-date-short-${tx.id}`} className="text-[8px] text-white/40 font-bold uppercase tracking-tight">
                {dateFormatted}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p id={`tx-amount-${tx.id}`} className={cn(
                "text-xs md:text-sm font-black tracking-tight mb-0.5 italic font-serif",
                isWithType ? "text-red-400" : "text-[#009e42]"
              )}>
                {displaySign}{displayAmount}
              </p>
              <div id={`tx-status-badge-${tx.id}`} className={cn("inline-block px-2 py-0.5 rounded-full text-[6px] font-black uppercase tracking-widest", statusBg)}>
                {statusText}
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4">
            {/* Backdrop Blur overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Modal Card content */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-sm bg-white dark:bg-[#0e1118] border border-slate-200 dark:border-white/10 rounded-[28px] p-6 shadow-2xl overflow-hidden text-left"
            >
              {/* Subtle top ambient glow */}
              <div className="absolute top-0 inset-x-0 h-[80px] bg-gradient-to-b from-[#009e42]/5 to-transparent pointer-events-none" />

              {/* Close Button */}
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/5 rounded-full transition-colors cursor-pointer text-slate-500 hover:text-slate-900 dark:text-white/60 dark:hover:text-white"
              >
                <X size={14} />
              </button>

              <div className="space-y-5 pt-2 relative z-10">
                {/* Large Central Icon */}
                <div className="flex flex-col items-center justify-center">
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg mb-3", iconBg)}>
                    {React.cloneElement(iconComponent, { size: 20 })}
                  </div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white text-center uppercase tracking-wider">
                    {displayType}
                  </h3>
                  <span className="text-[9px] text-slate-400 dark:text-white/40 uppercase tracking-widest font-black mt-1">
                    Transaction Receipt
                  </span>
                </div>

                {/* Amount Display */}
                <div className="py-4 bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-2xl text-center">
                  <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/40 mb-1">
                    Amount Settled
                  </p>
                  <p className={cn(
                    "text-xl sm:text-2xl font-black italic font-serif tracking-tight",
                    isWithType ? "text-red-500 dark:text-red-400" : "text-[#009e42]"
                  )}>
                    {displaySign}{displayAmount}
                  </p>
                  <div className="mt-2 flex justify-center">
                    <span className={cn("px-2.5 py-0.5 rounded-full text-[7px] font-black uppercase tracking-wider", statusBg)}>
                      {statusText}
                    </span>
                  </div>
                </div>

                {/* Details list */}
                <div className="space-y-2.5">
                  <h4 className="text-[8px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-white/40 pb-1 border-b border-slate-100 dark:border-white/5">
                    Transaction Details
                  </h4>
                  
                  {/* Common details */}
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-500 dark:text-white/40 uppercase tracking-wider font-bold">Type</span>
                    <span className="text-slate-900 dark:text-white font-bold">{tx.type === 'investment' ? 'Investment' : displayType}</span>
                  </div>

                  {/* Specific fields */}
                  {tx.type === 'investment' && (
                    <>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-500 dark:text-white/40 uppercase tracking-wider font-bold">Plan</span>
                        <span className="text-slate-900 dark:text-white font-bold">{tx.plan_name ? formatTitleCase(tx.plan_name) : 'Premium Plan'}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-500 dark:text-white/40 uppercase tracking-wider font-bold">Asset Class</span>
                        <span className="text-slate-900 dark:text-white font-bold">Asset balance</span>
                      </div>
                    </>
                  )}

                  {tx.type === 'deposit' && (
                    <>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-500 dark:text-white/40 uppercase tracking-wider font-bold">Deposit Route</span>
                        <span className="text-slate-900 dark:text-white font-bold uppercase">{tx.method || 'Crypto Ledger'}</span>
                      </div>
                    </>
                  )}

                  {tx.type === 'withdrawal' && (
                    <>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-500 dark:text-white/40 uppercase tracking-wider font-bold">Withdrawal Route</span>
                        <span className="text-slate-900 dark:text-white font-bold uppercase">{tx.method || 'Crypto Wallet'}</span>
                      </div>
                    </>
                  )}

                  {tx.type_detail === 'internal_transfer' && (
                    <>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-500 dark:text-white/40 uppercase tracking-wider font-bold">Transfer Mode</span>
                        <span className="text-slate-900 dark:text-white font-bold uppercase">Internal Balance Swap</span>
                      </div>
                    </>
                  )}

                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-500 dark:text-white/40 uppercase tracking-wider font-bold">Date</span>
                    <span className="text-slate-900 dark:text-white font-bold">{dateFormatted}</span>
                  </div>

                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-500 dark:text-white/40 uppercase tracking-wider font-bold">Time</span>
                    <span className="text-slate-900 dark:text-white font-bold font-mono">{timeFormatted}</span>
                  </div>

                  {tx.fee !== undefined && tx.fee > 0 && (
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-500 dark:text-white/40 uppercase tracking-wider font-bold">Network Gas Fee</span>
                      <span className="text-red-500 dark:text-red-400 font-bold">{formatCurrency(tx.fee)}</span>
                    </div>
                  )}

                  {tx.description && (
                    <div className="pt-2 border-t border-slate-100 dark:border-white/5 text-[10px]">
                      <span className="text-slate-500 dark:text-white/40 uppercase tracking-wider font-bold block mb-0.5">Description</span>
                      <span className="text-slate-700 dark:text-white/80 font-medium leading-normal block">{tx.description}</span>
                    </div>
                  )}

                  {/* Transaction reference signature */}
                  {tx.reference && (
                    <div className="pt-2.5 border-t border-slate-100 dark:border-white/5 space-y-1.5">
                      <span className="text-slate-500 dark:text-white/40 uppercase tracking-wider font-bold text-[8px] block">
                        Transaction Signature
                      </span>
                      <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-xl px-3 py-2 flex items-center justify-between gap-3">
                        <code className="text-[9px] font-mono text-slate-700 dark:text-white/70 truncate max-w-[200px]">
                          {tx.reference}
                        </code>
                        <button 
                          onClick={() => handleCopyReference(tx.reference!)}
                          className="p-1 hover:bg-slate-200 dark:hover:bg-white/5 rounded transition-colors text-slate-400 hover:text-slate-700 dark:text-white/60 dark:hover:text-[#009e42] cursor-pointer shrink-0"
                          title="Copy Signature"
                        >
                          {isCopied ? <Check size={12} className="text-[#009e42]" /> : <Copy size={12} />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* OK Button */}
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="w-full mt-4 py-3 bg-[#009e42] text-white font-black uppercase tracking-[0.2em] text-[9px] rounded-xl hover:bg-[#02d147] active:scale-[0.98] transition-all cursor-pointer text-center"
                >
                  OK
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
