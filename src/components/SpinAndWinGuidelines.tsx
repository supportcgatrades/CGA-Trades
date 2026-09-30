import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  Coins, 
  HelpCircle, 
  Sparkles, 
  Trophy, 
  Wallet,
  Zap
} from 'lucide-react';

export default function SpinAndWinGuidelines() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#05060d] text-gray-100 py-10 px-4 sm:px-6 md:px-8 relative overflow-hidden font-sans">
      {/* Premium Background Radiance */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-purple-900/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-3xl mx-auto relative z-10 space-y-8">
        
        {/* Navigation / Header Area */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
          <button 
            onClick={() => navigate('/spin')}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold text-white/70 hover:text-white bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.08] transition-all duration-200 cursor-pointer"
          >
            <ArrowLeft size={14} className="text-amber-400" />
            <span>Back to Spin Page</span>
          </button>
          
          <div className="flex items-center gap-1.5 text-xs text-amber-400/80 font-mono font-black uppercase tracking-wider">
            <Trophy size={14} className="text-amber-400 animate-pulse" />
            <span>PROMOTIONAL EVENT</span>
          </div>
        </div>

        {/* Hero Announcement Banner */}
        <div className="relative rounded-3xl border border-white/[0.08] bg-slate-950/40 p-6 sm:p-8 backdrop-blur-2xl overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-44 h-44 bg-gradient-to-br from-amber-400/10 to-indigo-500/0 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 space-y-4">
            <div className="inline-flex p-3 rounded-2xl bg-amber-400/10 border border-amber-400/20 text-amber-400 mb-2">
              <Sparkles size={24} className="animate-spin" style={{ animationDuration: '6s' }} />
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-amber-300 uppercase tracking-tight">
              Spin & Win Guidelines
            </h1>
            
            <p className="text-sm text-gray-400 leading-relaxed max-w-2xl font-medium">
              Welcome to the CGA Trades high-yield promotional system. 
              Each rotation is verified and secured on an isolated financial ledger. 
              Read how transaction allocation and entry parameters are prioritized below.
            </p>
          </div>
        </div>

        {/* Structured Grid of Policies */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* POLICY 1: Entry Fee */}
          <div className="bg-slate-950/60 border border-white/[0.08] rounded-2xl p-6 backdrop-blur-xl hover:border-white/[0.12] transition-colors duration-200">
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400 shrink-0">
                <Coins size={18} />
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                  ENTRY FEE DETAILS
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed font-sans">
                  Each rotation requires an entry fee of <span className="text-amber-300 font-extrabold">$1.00 USD</span>. 
                  This is debited programmatically directly from your eligible wallet balance upon spin verification.
                </p>
              </div>
            </div>
          </div>

          {/* POLICY 2: Balance Priority */}
          <div className="bg-slate-950/60 border border-white/[0.08] rounded-2xl p-6 backdrop-blur-xl hover:border-white/[0.12] transition-colors duration-200">
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-indigo-400/10 border border-indigo-400/20 text-indigo-400 shrink-0">
                <Wallet size={18} />
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                  BALANCE PRIORITY SYSTEM
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed font-sans">
                  The system follows a strict, sequential balance hierarchy:
                </p>
                <div className="space-y-1.5 pl-1.5 border-l border-white/[0.08] mt-1 text-[11px] text-gray-300 font-sans">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-indigo-400" />
                    <span><strong className="text-white">1. Available Balance</strong> is checked & debited first.</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-indigo-400 mt-1.5" />
                    <span><strong className="text-white">2. Reward Balance</strong> is auto-checked and charged seamlessly as fallback if Available is depleted.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* POLICY 3: Free Spin Mechanism */}
          <div className="bg-slate-950/60 border border-white/[0.08] rounded-2xl p-6 backdrop-blur-xl hover:border-white/[0.12] transition-colors duration-200">
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-green-400/10 border border-green-400/20 text-green-400 shrink-0">
                <Zap size={18} />
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                  FREE SPIN MECHANISM
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed font-sans">
                  In special cases where a <span className="text-green-400 font-bold">Free Spin</span> is granted:
                </p>
                <ul className="space-y-1 pl-1.5 mt-1 list-disc list-inside text-[11px] text-gray-300">
                  <li>Your numeric balance is <strong className="text-white">NOT</strong> deducted.</li>
                  <li>You receive an additional complimentary spin instantly.</li>
                  <li>This does not affect Available or Reward balances.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* POLICY 4: Technical Automation */}
          <div className="bg-slate-950/60 border border-white/[0.08] rounded-2xl p-6 backdrop-blur-xl hover:border-white/[0.12] transition-colors duration-200">
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-purple-400/10 border border-purple-400/20 text-purple-400 shrink-0">
                <HelpCircle size={18} />
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                  PAYMENT AUTOMATION
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed font-sans">
                  All transaction executions are processed instantly at spin initialization. 
                  If both Available and Reward balances are insufficient, the transaction is declined instantly with clear status logs. No manual approvals are ever required.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Elegant Footer Details */}
        <div className="p-5 rounded-2xl bg-slate-950/30 border border-white/[0.04] text-center text-[11px] text-gray-500 leading-relaxed space-y-1">
          <p>CGA Trades Promotional Event. Participation is subject to general Terms of Service.</p>
          <p className="font-mono text-[9px] uppercase tracking-wider text-amber-500/50">SYSTEM_LEDGER_PROTOCOL_v2.0.4</p>
        </div>

      </div>
    </div>
  );
}
