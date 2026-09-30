import React from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  Hourglass, 
  Lock, 
  Sparkles, 
  ShieldCheck, 
  ArrowLeft,
  Coins,
  Scale,
  CalendarCheck,
  Award,
  ChevronRight
} from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

export default function AssetMultiplierPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-[#050608] text-white relative overflow-hidden pb-16 font-sans">
      {/* Premium ambient glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-20 left-0 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Breadcrumb/Back button bar */}
      <div className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between border-b border-white/5 relative z-10">
        <button
          onClick={handleBack}
          className="group flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 text-xs font-bold uppercase tracking-wider text-aura-muted hover:text-white transition-all cursor-pointer"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to Dashboard
        </button>
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-emerald-400" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">Wealth Management Premium</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12 relative z-10">
        {/* Page Hero */}
        <div className="text-center space-y-4 mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest"
          >
            <Award size={12} />
            Exclusive Portfolio Integration
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-5xl font-black tracking-tight text-white uppercase"
          >
            Asset Multiplier Upgrade
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-aura-muted max-w-2xl mx-auto text-sm md:text-base leading-relaxed"
          >
            A high-performance wealth optimization framework structured deliberately for legacy investors who focus on long-term compound strategy, portfolio longevity, and sustainable yield outcomes.
          </motion.p>
        </div>

        {/* Core Principles Grid / Premium Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl border border-white/5 bg-white/[0.01] p-8 flex flex-col gap-4 hover:border-emerald-500/10 hover:bg-white/[0.02] transition-all"
          >
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
              <TrendingUp size={20} />
            </div>
            <h3 className="text-lg font-black uppercase tracking-wide text-white">Long-Term Portfolio Growth</h3>
            <p className="text-xs text-aura-muted leading-relaxed font-light">
              The Asset Multiplier Upgrade is built exclusively with a long-term capital preservation and expansion mandate. Instead of prioritizing immediate high velocity transactions, this framework secures user balances and establishes a reliable baseline for disciplined wealth building.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl border border-white/5 bg-white/[0.01] p-8 flex flex-col gap-4 hover:border-emerald-500/10 hover:bg-white/[0.02] transition-all"
          >
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
              <Scale size={20} />
            </div>
            <h3 className="text-lg font-black uppercase tracking-wide text-white">Sustainable Wealth Building</h3>
            <p className="text-xs text-aura-muted leading-relaxed font-light">
              We structure our advanced multiplier around the core tenets of portfolio longevity. It is not engineered for short-term gratification, but rather for users focused on cultivating sustainable, generational assets with a steady and predictable lifecycle.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl border border-white/5 bg-white/[0.01] p-8 flex flex-col gap-4 hover:border-emerald-500/10 hover:bg-white/[0.02] transition-all"
          >
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
              <Coins size={20} />
            </div>
            <h3 className="text-lg font-black uppercase tracking-wide text-white">Expanded Asset Earning Base</h3>
            <p className="text-xs text-aura-muted leading-relaxed font-light">
              By upgrading your eligible portfolio balance to 300% (minus historical withdrawals), you initiate a wider core asset base that drives steady dividends over time. All future yield percentages reflect this expanded, high-capacity portfolio configuration.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl border border-white/5 bg-white/[0.01] p-8 flex flex-col gap-4 hover:border-emerald-500/10 hover:bg-white/[0.02] transition-all"
          >
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
              <Hourglass size={20} />
            </div>
            <h3 className="text-lg font-black uppercase tracking-wide text-white">Gradual, Secure Payout Lifecycle</h3>
            <p className="text-xs text-aura-muted leading-relaxed font-light">
              Under the upgrade program, earnings continue gradually and securely over the lifecycle of the upgraded asset pool. Payouts are made daily, ensuring systematic, verified micro-credits that reduce the remaining upgraded pool without introducing liquidity strain.
            </p>
          </motion.div>

        </div>

        {/* Comprehensive Framework Analysis */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="rounded-3xl border border-white/5 bg-gradient-to-r from-emerald-500/[0.03] to-purple-500/[0.03] bg-white/[0.01] p-8 md:p-10 mb-16"
        >
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="space-y-4 flex-1">
              <div className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-[#009e42]">
                <ShieldCheck size={12} />
                Financial Architecture System
              </div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-white leading-tight">
                Disciplined Longevity & Capital Optimization
              </h2>
              <p className="text-xs text-aura-muted leading-relaxed font-medium">
                Modern markets require systematic discipline rather than speculative volatility. The Asset Multiplier Upgrade incentivizes extended platform involvement by allowing users to construct massive baseline reserves.
              </p>
              <p className="text-xs text-aura-muted leading-relaxed font-medium">
                Long-term participants benefit most from this structure, as every daily cycle deposits continuous 0.5% ROI directly to the available wallet balance, systematically diminishing the remaining upgraded asset cap until completion.
              </p>
            </div>
            
            <div className="w-full md:w-auto flex flex-col gap-3 min-w-[200px]">
              <div className="bg-white/5 rounded-2xl border border-white/5 p-4 text-center">
                <span className="block text-[10px] text-aura-muted uppercase tracking-wider font-semibold">Yield Rate</span>
                <span className="block text-2xl font-black font-mono text-[#009e42] mt-1">0.5% Daily</span>
              </div>
              
              <div className="bg-white/5 rounded-2xl border border-white/5 p-4 text-center">
                <span className="block text-[10px] text-aura-muted uppercase tracking-wider font-semibold">Asset Scaling</span>
                <span className="block text-2xl font-black font-mono text-[#009e42] mt-1">3.0x Multiplier</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Footer info message */}
        <div className="text-center">
          <p className="text-[10px] text-aura-muted uppercase tracking-widest font-semibold mb-6">
            Intended exclusively for authorized legacy participants
          </p>
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-[#009e42] hover:bg-[#02d147] active:bg-[#008236] text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-[#009e42]/20 cursor-pointer transition-all"
          >
            Return to Dashboard
            <ChevronRight size={14} />
          </button>
        </div>

      </div>
    </div>
  );
}
