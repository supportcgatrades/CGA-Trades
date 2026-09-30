import React from 'react';
import { motion } from 'motion/react';
import { Wallet, TrendingUp, Info, ArrowUpRight, Droplets, Filter, RefreshCw, BarChart3 } from 'lucide-react';
import { cn } from '../../lib/utils';

const POOLS = [
  {
    name: 'Neural Growth Pool',
    tvl: '1.4B',
    apy: '24.2%',
    risk: 'Medium',
    assets: ['BTC', 'ETH', 'SOL'],
    color: 'from-primary/20 to-secondary/10',
    description: 'Autonomous neural optimization across major blue-chip digital assets.'
  },
  {
    name: 'Stable Yield Nexus',
    tvl: '840M',
    apy: '12.4%',
    risk: 'Low',
    assets: ['USDT', 'USDC', 'DAI'],
    color: 'from-emerald-500/20 to-teal-500/10',
    description: 'Delta-neutral strategies focused on absolute stability and consistent cash flow.'
  },
  {
    name: 'Alpha Capture V5',
    tvl: '320M',
    apy: '48.9%',
    risk: 'High',
    assets: ['AVAX', 'LINK', 'FET'],
    color: 'from-orange-500/20 to-red-500/10',
    description: 'Aggressive algorithmic targeting of emerging market trends and AI sector volatility.'
  }
];

export default function LiquidityPools() {
  return (
    <div className="min-h-screen bg-[#050608] pt-24 pb-20 px-6">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12 border-b border-white/5 pb-16">
          <div className="space-y-6">
             <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10"
             >
                <Droplets size={14} className="text-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest text-aura-muted">Ecosystem Liquidity</span>
             </motion.div>
             <motion.h1 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="text-6xl lg:text-8xl font-black italic font-serif text-white uppercase tracking-tighter"
             >
               Liquidity <span className="text-secondary block lg:inline">Pools</span>
             </motion.h1>
             <p className="max-w-2xl text-aura-muted text-sm font-medium leading-relaxed tracking-wide">
               Institutional liquidity clusters optimized by CGA Trades' Smart-Zero algo. 
               Direct participation in global automated market making and arbitrage nodes.
             </p>
          </div>

          <div className="flex flex-wrap gap-4">
             <div className="p-6 bg-[#11141b] border border-white/5 rounded-[32px] flex items-center gap-4 shadow-xl">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                   <Wallet size={20} />
                </div>
                <div>
                   <p className="text-[8px] font-black text-aura-muted uppercase tracking-widest mb-1">Total Value Locked</p>
                   <p className="text-2xl font-black text-white italic font-serif">$2.56B</p>
                </div>
             </div>
             <div className="p-6 bg-[#11141b] border border-white/5 rounded-[32px] flex items-center gap-4 shadow-xl">
                <div className="w-12 h-12 bg-secondary/10 rounded-2xl flex items-center justify-center text-secondary">
                   <TrendingUp size={20} />
                </div>
                <div>
                   <p className="text-[8px] font-black text-aura-muted uppercase tracking-widest mb-1">Avg Network APY</p>
                   <p className="text-2xl font-black text-white italic font-serif">18.4%</p>
                </div>
             </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between gap-4 py-4">
           <div className="flex items-center gap-4">
              <button className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white transition-all">
                <Filter size={14} /> Filter
              </button>
              <button className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white transition-all">
                <RefreshCw size={14} /> Refresh
              </button>
           </div>
           <p className="hidden md:block text-[10px] font-black text-aura-muted uppercase tracking-[0.2em]">Showing {POOLS.length} Optimized Clusters</p>
        </div>

        {/* Pool Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {POOLS.map((pool, i) => (
             <motion.div
               key={pool.name}
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ delay: i * 0.1 }}
               className="flex flex-col bg-[#11141b] border border-white/5 rounded-[48px] overflow-hidden group hover:border-primary/20 transition-all shadow-2xl"
             >
                <div className={cn("h-48 relative overflow-hidden bg-gradient-to-br", pool.color)}>
                   <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
                   <div className="absolute top-0 right-0 p-8">
                      <div className="px-4 py-2 bg-black/20 backdrop-blur-md border border-white/10 rounded-full">
                         <span className={cn(
                           "text-[9px] font-black uppercase tracking-widest",
                           pool.risk === 'Low' ? "text-emerald-400" : pool.risk === 'Medium' ? "text-primary" : "text-orange-400"
                         )}>{pool.risk} Risk</span>
                      </div>
                   </div>
                   <div className="absolute bottom-0 left-0 p-8 space-y-2">
                      <h3 className="text-2xl font-black italic font-serif text-white tracking-tight uppercase leading-none">{pool.name}</h3>
                      <div className="flex gap-2">
                        {pool.assets.map(asset => (
                          <span key={asset} className="text-[8px] font-black text-white/60 bg-white/5 px-2 py-0.5 rounded border border-white/10">{asset}</span>
                        ))}
                      </div>
                   </div>
                </div>

                <div className="p-8 flex-1 flex flex-col justify-between space-y-8">
                   <p className="text-xs font-medium text-aura-muted leading-relaxed uppercase tracking-widest">{pool.description}</p>
                   
                   <div className="grid grid-cols-2 gap-4">
                      <div className="p-6 bg-white/5 border border-white/5 rounded-[32px] shadow-inner text-center">
                         <p className="text-[8px] font-black text-aura-muted uppercase tracking-widest mb-1">Cluster TVL</p>
                         <p className="text-2xl font-black text-white">${pool.tvl}</p>
                      </div>
                      <div className="p-6 bg-white/5 border border-white/5 rounded-[32px] shadow-inner text-center">
                         <p className="text-[8px] font-black text-aura-muted uppercase tracking-widest mb-1">Target APY</p>
                         <p className="text-2xl font-black text-emerald-500 italic font-serif">{pool.apy}</p>
                      </div>
                   </div>

                   <button className="w-full py-5 bg-white text-[#050608] font-black uppercase tracking-[0.3em] text-[10px] rounded-2xl shadow-xl group-hover:bg-primary group-hover:text-white transition-all flex items-center justify-center gap-3">
                      Supply Liquidity <ArrowUpRight size={16} />
                   </button>
                </div>
             </motion.div>
           ))}
        </div>

        {/* Tech Banner */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="p-12 lg:p-20 bg-white/5 border border-white/5 rounded-[64px] relative overflow-hidden"
        >
           <div className="absolute top-0 right-0 p-12 opacity-[0.03]">
              <BarChart3 size={320} />
           </div>
           <div className="max-w-3xl space-y-8 relative z-10">
              <h2 className="text-4xl lg:text-6xl font-black italic font-serif text-white tracking-tighter uppercase leading-none">
                Automated <span className="text-primary block">Arbitrage Nodes</span>
              </h2>
              <p className="text-aura-muted text-sm font-medium leading-relaxed uppercase tracking-widest">
                Our pools aren't just static vaults. They are dynamic participants in a global high-frequency market mesh.
                Every millisecond, our neural clusters evaluate thousands of liquidity paths to capture slippage and arbitrage spreads.
              </p>
              <div className="flex gap-4">
                 <button className="flex items-center gap-2 text-white font-black uppercase tracking-[0.3em] text-[10px] group">
                    View Network Stats <ChevronRight size={14} className="group-hover:translate-x-2 transition-transform text-primary" />
                 </button>
              </div>
           </div>
        </motion.div>

        {/* Footer info */}
        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                 <Info size={16} />
              </div>
              <p className="text-[10px] font-black text-aura-muted uppercase tracking-widest max-w-xs leading-relaxed">
                Liquidity provision involves risks. Historical performance does not guarantee future results.
              </p>
           </div>
           <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Institutional Grade Protocol v2.4.0</p>
        </div>
      </div>
    </div>
  );
}

import { ChevronRight } from 'lucide-react';
