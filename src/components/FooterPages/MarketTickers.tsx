import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, TrendingDown, Activity, Globe, Zap, ArrowUpRight, BarChart3, Search } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const MOCK_DATA = [
  { time: '00:00', value: 42000 },
  { time: '04:00', value: 41500 },
  { time: '08:00', value: 43200 },
  { time: '12:00', value: 42800 },
  { time: '16:00', value: 44500 },
  { time: '20:00', value: 43900 },
  { time: '23:59', value: 45200 },
];

const TICKERS = [
  { symbol: 'BTC/USD', price: '64,231.50', change: '+2.45%', up: true, trend: [40, 60, 45, 70, 55, 80] },
  { symbol: 'ETH/USD', price: '3,421.12', change: '+1.12%', up: true, trend: [30, 40, 35, 50, 45, 60] },
  { symbol: 'SOL/USD', price: '145.89', change: '-0.85%', up: false, trend: [80, 70, 75, 60, 65, 50] },
  { symbol: 'AAPL', price: '189.45', change: '+0.54%', up: true, trend: [20, 25, 22, 30, 28, 35] },
  { symbol: 'TSLA', price: '175.22', change: '-4.21%', up: false, trend: [90, 80, 85, 70, 75, 60] },
  { symbol: 'NVDA', price: '892.11', change: '+5.67%', up: true, trend: [10, 30, 25, 60, 55, 90] },
];

export default function MarketTickers() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="min-h-screen bg-[#050608] pt-24 pb-20 px-6">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 py-12 border-b border-white/5">
          <div className="space-y-4">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2"
            >
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Live Nexus Feed</span>
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl lg:text-7xl font-black italic font-serif text-white tracking-tighter uppercase"
            >
              Market <span className="text-primary">Tickers</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="max-w-xl text-aura-muted text-sm font-medium tracking-wide leading-relaxed"
            >
              High-fidelity real-time asset tracking across global indices and decentralized liquidity zones. 
              Sub-millisecond synchronization powered by CGA Neural Core.
            </motion.p>
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="relative"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
            <input 
              type="text" 
              placeholder="Filter Assets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold text-white focus:border-primary/50 outline-none w-full lg:w-80 transition-all placeholder:text-white/20"
            />
          </motion.div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Global Volatility', value: '1.24%', icon: Activity, color: 'text-primary' },
            { label: 'Network Throughput', value: '8.4M tps', icon: Zap, color: 'text-secondary' },
            { label: 'Asset coverage', value: '14,203+', icon: Globe, color: 'text-emerald-500' },
            { label: 'Sync Status', value: 'Nominal', icon: Shield, color: 'text-blue-500' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + (i * 0.1) }}
              className="p-8 bg-[#11141b] border border-white/5 rounded-[32px] relative overflow-hidden group shadow-2xl"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <stat.icon size={48} />
              </div>
              <p className="text-[9px] font-black text-aura-muted uppercase tracking-[0.3em] mb-2">{stat.label}</p>
              <h3 className="text-3xl font-black text-white italic font-serif tracking-tight">{stat.value}</h3>
            </motion.div>
          ))}
        </div>

        {/* Main Tickers List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="lg:col-span-2 p-8 lg:p-12 bg-[#11141b] border border-white/5 rounded-[48px] shadow-2xl overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 p-12 opacity-[0.02]">
              <BarChart3 size={240} />
            </div>

            <div className="flex items-center justify-between mb-12">
               <div>
                 <h2 className="text-2xl font-black italic font-serif text-white">Aggregated Performance</h2>
                 <p className="text-[9px] font-black text-aura-muted uppercase tracking-widest mt-1">24h Neural Composite Index</p>
               </div>
               <div className="flex gap-2">
                 {['1H', '4H', '1D', '1W'].map(t => (
                   <button key={t} className="px-4 py-2 text-[8px] font-black bg-white/5 border border-white/10 rounded-lg hover:bg-primary hover:text-white transition-all">
                     {t}
                   </button>
                 ))}
               </div>
            </div>

            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={MOCK_DATA}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#7C3AED" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#11141b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff', fontSize: '10px', fontWeight: 'bold' }}
                    labelStyle={{ display: 'none' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#7C3AED" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {TICKERS.filter(t => t.symbol.toLowerCase().includes(searchTerm.toLowerCase())).map((ticker, i) => (
            <motion.div
              key={ticker.symbol}
              initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 + (i * 0.1) }}
              className="p-8 bg-[#11141b] border border-white/5 rounded-[32px] group hover:border-primary/20 transition-all shadow-xl flex items-center justify-between"
            >
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform shadow-inner">
                   <span className="text-xs font-black text-white italic">{ticker.symbol.slice(0, 1)}</span>
                </div>
                <div>
                   <h4 className="text-xl font-black text-white italic font-serif leading-none">{ticker.symbol}</h4>
                   <p className="text-[9px] font-black text-aura-muted uppercase tracking-[0.2em] mt-2">Global Aggregate</p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-xl font-black text-white tracking-tight">${ticker.price}</p>
                <div className={cn(
                  "flex items-center gap-1 justify-end mt-1 text-[10px] font-bold uppercase tracking-widest",
                  ticker.up ? "text-emerald-500" : "text-red-500"
                )}>
                  {ticker.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {ticker.change}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Action Banner */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="p-12 bg-primary rounded-[48px] relative overflow-hidden group flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left shadow-2xl"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Globe size={120} />
          </div>
          <div className="space-y-2 relative z-10">
             <h3 className="text-3xl font-black text-white italic font-serif uppercase leading-tight">Ready to Execute?</h3>
             <p className="text-white/60 text-xs font-bold uppercase tracking-[0.2em]">Scale your portfolio with institutional neural strategies.</p>
          </div>
          <button className="px-8 py-5 bg-white text-primary font-black uppercase tracking-[0.3em] text-[10px] rounded-2xl shadow-xl hover:scale-105 transition-all relative z-10">
            Initialize Position
          </button>
        </motion.div>
      </div>
    </div>
  );
}

import { cn } from '../../lib/utils';
import { Shield } from 'lucide-react';
