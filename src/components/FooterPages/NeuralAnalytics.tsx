import React from 'react';
import { motion } from 'motion/react';
import { Brain, Cpu, Zap, Activity, Globe, Compass, Target, Database } from 'lucide-react';
import { cn } from '../../lib/utils';

const METRICS = [
  { label: 'Neural Synapse Load', value: '74.2%', sub: 'Computing capacity', icon: Brain },
  { label: 'Predictive Accuracy', value: '98.4%', sub: 'Historical accuracy', icon: Target },
  { label: 'Data Processing', value: '1.2 PB', sub: 'Weekly data volume', icon: Database },
  { label: 'Decision Latency', value: '0.4ms', sub: 'Average response time', icon: Zap },
];

export default function NeuralAnalytics() {
  return (
    <div className="min-h-screen bg-[#050608] pt-24 pb-20 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Hero Section */}
        <div className="relative py-24 border-b border-white/5">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[150px] -translate-y-1/2" />
          
          <div className="relative z-10 max-w-4xl space-y-8">
            <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20"
            >
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                <span className="text-[10px] font-black uppercase tracking-widest text-primary">Neural Link Active</span>
            </motion.div>
            
            <h1 className="text-6xl lg:text-9xl font-black italic font-serif text-white uppercase tracking-tighter leading-[0.8]">
              Neural <span className="text-primary block">Analytics</span>
            </h1>
            
            <p className="text-aura-muted text-lg font-medium leading-relaxed max-w-2xl tracking-wide">
              Harness the power of high-frequency predictive modeling. 
              Our neural network processes billions of global data points in real-time to identify alpha opportunities before they materialize in the public order books.
            </p>

            <div className="flex gap-6">
               <button className="px-8 py-5 bg-primary text-white font-black uppercase tracking-[0.3em] text-[10px] rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 transition-all">
                  Access Raw Stream
               </button>
               <button className="px-8 py-5 bg-white/5 text-white font-black uppercase tracking-[0.3em] text-[10px] rounded-2xl border border-white/10 hover:bg-white/10 transition-all">
                  Documentation
               </button>
            </div>
          </div>
        </div>

        {/* Real-time Visualization Mockup */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 space-y-6">
             {/* Mobile Headings - Outside Card */}
             <div className="lg:hidden space-y-1">
               <h3 className="text-2xl font-black italic font-serif text-white tracking-tight">Global Neural Pulse</h3>
               <p className="text-[10px] font-black text-aura-muted uppercase tracking-[0.2em]">Cross-regional sentiment mapping</p>
             </div>

             <motion.div 
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               className="aspect-square md:aspect-video bg-[#11141b] border border-white/5 rounded-[40px] md:rounded-[48px] relative overflow-hidden shadow-2xl p-6 md:p-8"
             >
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                 <Globe size={240} className="md:hidden text-primary animate-[spin_60s_linear_infinite]" />
                 <Globe size={400} className="hidden md:block text-primary animate-[spin_60s_linear_infinite]" />
              </div>

              <div className="relative z-10 h-full flex flex-col justify-between">
                 <div className="flex items-center justify-between">
                     <div className="hidden lg:block">
                       <h3 className="text-xl font-black italic font-serif text-white">Global Neural Pulse</h3>
                       <p className="text-[9px] font-black text-aura-muted uppercase tracking-[0.2em] mt-1">Cross-regional sentiment mapping</p>
                     </div>
                     <div className="flex gap-2 w-full lg:w-auto justify-end lg:justify-start">
                        <div className="px-3 py-1 bg-white/5 border border-white/10 rounded text-[8px] font-black text-white uppercase tracking-widest uppercase">Live</div>
                        <div className="px-3 py-1 bg-primary/20 border border-primary/30 rounded text-[8px] font-black text-primary uppercase tracking-widest uppercase">Encrypted</div>
                     </div>
                 </div>

                 {/* Simulated Graph Lines (Wave Effect) */}
                 <div className="flex-1 my-10 md:my-12 flex items-end justify-between gap-1 md:gap-2 px-2 md:px-4">
                    {[...Array(40)].map((_, i) => (
                      <motion.div 
                        key={i}
                        animate={{ height: [ 20 + Math.random() * 80 + '%', 10 + Math.random() * 90 + '%', 20 + Math.random() * 80 + '%'] }}
                        transition={{ duration: 2 + Math.random() * 2, repeat: Infinity, ease: 'easeInOut' }}
                        className={cn(
                          "w-full bg-gradient-to-t from-primary/40 to-primary rounded-full max-w-[3px] md:max-w-[4px]",
                          i > 25 && "hidden md:block"
                        )}
                      />
                    ))}
                 </div>

                 <div className="hidden lg:flex items-center justify-between text-aura-muted">
                    <div className="flex items-center gap-2">
                       <Compass size={14} />
                       <span className="text-[9px] font-black uppercase tracking-widest">Tracking 142 Global Exchanges</span>
                    </div>
                    <span className="text-[9px] font-mono">HASH: 0x82...f9a4</span>
                 </div>
              </div>
           </motion.div>

           {/* Mobile Details - Outside Card */}
           <div className="lg:hidden flex flex-col md:flex-row md:items-center justify-between gap-4 text-aura-muted px-2 pt-2">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center text-primary">
                  <Compass size={16} />
                 </div>
                 <span className="text-[10px] font-black uppercase tracking-[0.15em]">Tracking 142 Global Exchanges</span>
              </div>
              <div className="flex items-center justify-between md:justify-end gap-4 border-t border-white/5 pt-4 md:border-0 md:pt-0">
                <span className="text-[11px] font-black uppercase tracking-widest text-aura-muted/60">Node Status: Active</span>
                <span className="text-[10px] font-mono bg-white/5 px-3 py-1 rounded-md">HASH: 0x82...f9a4</span>
              </div>
           </div>
        </div>

        <div className="space-y-8 flex flex-col">
              {METRICS.map((metric, i) => (
                <motion.div
                  key={metric.label}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-8 bg-[#11141b] border border-white/5 rounded-[32px] flex-1 flex flex-col justify-between group hover:border-primary/20 transition-all relative overflow-hidden"
                >
                   <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-all">
                      <metric.icon size={48} />
                   </div>
                   <p className="text-[9px] font-black text-aura-muted uppercase tracking-[0.3em] mb-2">{metric.label}</p>
                   <div>
                      <h4 className="text-4xl font-black italic font-serif text-white">{metric.value}</h4>
                      <p className="text-[8px] font-bold text-aura-muted uppercase tracking-[0.1em] mt-1">{metric.sub}</p>
                   </div>
                </motion.div>
              ))}
           </div>
        </div>

        {/* Feature Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 py-16">
           <div className="space-y-6 p-8 bg-white/5 border border-white/5 rounded-[40px] hover:bg-white/[0.08] transition-all">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner">
                 <Brain size={28} />
              </div>
              <h3 className="text-xl font-black italic font-serif text-white uppercase italic">Memory Pools</h3>
              <p className="text-aura-muted text-xs leading-relaxed uppercase tracking-widest">
                Deep historical pattern recognition engine. Analyzes the last decade of market architecture to identify recurring fractal behaviors.
              </p>
           </div>
           
           <div className="space-y-6 p-8 bg-white/5 border border-white/5 rounded-[40px] hover:bg-white/[0.08] transition-all">
              <div className="w-14 h-14 bg-secondary/10 rounded-2xl flex items-center justify-center text-secondary shadow-inner">
                 <Zap size={28} />
              </div>
              <h3 className="text-xl font-black italic font-serif text-white uppercase italic">Quantum Risk Assessment</h3>
              <p className="text-aura-muted text-xs leading-relaxed uppercase tracking-widest">
                Dynamic risk shielding evaluated per millisecond. Adjusts cluster positions instantly to hedge against tail-risk events.
              </p>
           </div>

           <div className="space-y-6 p-8 bg-white/5 border border-white/5 rounded-[40px] hover:bg-white/[0.08] transition-all">
              <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 shadow-inner">
                 <Activity size={28} />
              </div>
              <h3 className="text-xl font-black italic font-serif text-white uppercase italic">Sentiment Flux</h3>
              <p className="text-aura-muted text-xs leading-relaxed uppercase tracking-widest">
                Proprietary NLP engine scraping global social clusters and news terminals to quantify market emotion and directional bias.
              </p>
           </div>
        </div>

        {/* Footer info */}
        <div className="p-12 bg-primary rounded-[48px] flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
           <div className="space-y-2">
              <h4 className="text-2xl font-black italic font-serif text-white uppercase italic">Scale with CGA Trades AI</h4>
              <p className="text-white/60 text-[10px] font-bold uppercase tracking-[0.2em]">Institutional API access available for eligible clusters.</p>
           </div>
           <button className="px-8 py-4 bg-white text-primary font-black uppercase tracking-[0.3em] text-[10px] rounded-xl hover:scale-105 transition-all">
              Request API Specs
           </button>
        </div>
      </div>
    </div>
  );
}
