import React from 'react';
import { motion } from 'motion/react';
import { Cpu, Server, Activity, Shield, Zap, Database, Layers, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';

const NODES = [
  { 
    name: 'Neural Core One', 
    type: 'Primary Execution', 
    uptime: '99.99%', 
    latency: '1.2ms', 
    capacity: '84%', 
    location: 'Zurich Cluster',
    icon: Cpu 
  },
  { 
    name: 'Atlas Liquidity Bridge', 
    type: 'Cross-Chain Relay', 
    uptime: '99.98%', 
    latency: '0.8ms', 
    capacity: '42%', 
    location: 'Singapore Hub',
    icon: Layers 
  },
  { 
    name: 'Sentinel Risk Engine', 
    type: 'Defensive Protocol', 
    uptime: '100.0%', 
    latency: '1.5ms', 
    capacity: '12%', 
    location: 'Deep Cold Vault',
    icon: Shield 
  },
  { 
    name: 'Oracle Sync Layer', 
    type: 'External Data Ingest', 
    uptime: '99.95%', 
    latency: '4.2ms', 
    capacity: '68%', 
    location: 'Multi-Region Mesh',
    icon: Database 
  }
];

export default function StrategicNodes() {
  return (
    <div className="min-h-screen bg-[#050608] pt-24 pb-20 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Hero Section */}
        <div className="relative py-20 px-8 lg:px-12 bg-white/5 border border-white/5 rounded-[64px] overflow-hidden">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4" />
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-3xl flex items-center justify-center p-0.5 shadow-2xl"
              >
                <div className="w-full h-full bg-[#050608] rounded-[22px] flex items-center justify-center text-primary">
                  <Server size={32} />
                </div>
              </motion.div>
              
              <div className="space-y-4">
                <h1 className="text-5xl lg:text-7xl font-black italic font-serif text-white uppercase tracking-tighter leading-none">
                  Strategic <span className="text-primary block">Nodes</span>
                </h1>
                <p className="text-aura-muted text-sm font-medium tracking-wide leading-relaxed max-w-lg">
                  Decentralized infrastructure backbone for the Capital Growth Alliance ecosystem. 
                  Independently verified validator nodes performing high-frequency computation and state-transition verification.
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <div className="px-6 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                   <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">All Clusters Online</span>
                </div>
                <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-full flex items-center gap-2 text-aura-muted">
                   <Activity size={14} />
                   <span className="text-[10px] font-black uppercase tracking-widest">Global Sync Active</span>
                </div>
              </div>
            </div>

            <div className="relative flex justify-center">
               <motion.div 
                 animate={{ 
                   y: [0, -20, 0],
                   rotate: [0, 2, 0]
                 }}
                 transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                 className="relative w-80 h-80 flex items-center justify-center"
               >
                  <div className="absolute inset-0 rounded-[80px] bg-primary/20 animate-pulse blur-3xl opacity-20" />
                  <div className="w-64 h-64 border-2 border-white/5 rounded-full absolute animate-[spin_12s_linear_infinite]" />
                  <div className="w-48 h-48 border-2 border-primary/20 rounded-full absolute animate-[spin_8s_linear_infinite_reverse]" />
                  <Cpu size={120} className="text-primary shadow-[0_0_50px_rgba(124,58,237,0.3)]" />
               </motion.div>
            </div>
          </div>
        </div>

        {/* Node Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {NODES.map((node, i) => (
            <motion.div
              key={node.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-8 lg:p-12 bg-[#11141b] border border-white/5 rounded-[48px] group hover:border-primary/20 transition-all shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-all transform group-hover:scale-110">
                <node.icon size={120} />
              </div>

              <div className="flex justify-between items-start mb-12">
                <div className="space-y-4">
                   <div className="w-12 h-12 bg-primary/5 border border-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner">
                      <node.icon size={24} />
                   </div>
                   <div>
                      <h3 className="text-2xl font-black italic font-serif text-white">{node.name}</h3>
                      <p className="text-[10px] font-black text-aura-muted uppercase tracking-widest mt-1">{node.type}</p>
                   </div>
                </div>
                <div className="text-right">
                   <div className="flex items-center gap-1 justify-end text-emerald-500 mb-1">
                      <CheckCircle2 size={12} />
                      <span className="text-[9px] font-black uppercase tracking-widest">Active</span>
                   </div>
                   <p className="text-xl font-black text-white font-mono">{node.uptime}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                 <div className="p-6 bg-white/5 border border-white/5 rounded-[24px] shadow-inner">
                    <p className="text-[8px] font-black text-aura-muted uppercase tracking-widest mb-2">Network Latency</p>
                    <p className="text-lg font-black text-white font-mono">{node.latency}</p>
                 </div>
                 <div className="p-6 bg-white/5 border border-white/5 rounded-[24px] shadow-inner">
                    <p className="text-[8px] font-black text-aura-muted uppercase tracking-widest mb-2">Load Capacity</p>
                    <div className="flex items-center justify-between gap-4">
                       <p className="text-lg font-black text-white font-mono">{node.capacity}</p>
                       <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: node.capacity }} />
                       </div>
                    </div>
                 </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Infrastructure Specs */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-12 border border-white/5 bg-[#11141b] rounded-[56px] shadow-2xl relative"
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="space-y-4">
               <Zap className="text-primary mb-6" size={40} />
               <h4 className="text-xl font-black italic font-serif text-white uppercase">Lightning Execution</h4>
               <p className="text-aura-muted text-xs leading-relaxed uppercase tracking-widest font-medium">
                 Sub-millisecond trade execution powered by high-frequency proprietary hardware nodes colocated with major digital exchanges.
               </p>
            </div>
            <div className="space-y-4">
               <Shield className="text-primary mb-6" size={40} />
               <h4 className="text-xl font-black italic font-serif text-white uppercase">Sovereign Security</h4>
               <p className="text-aura-muted text-xs leading-relaxed uppercase tracking-widest font-medium">
                 Every node operation is secured by multi-signature validation and sovereign compute layers, ensuring absolute asset integrity.
               </p>
            </div>
            <div className="space-y-4">
               <Activity className="text-primary mb-6" size={40} />
               <h4 className="text-xl font-black italic font-serif text-white uppercase">Dynamic Mesh</h4>
               <p className="text-aura-muted text-xs leading-relaxed uppercase tracking-widest font-medium">
                 Our global mesh infrastructure reconfigures in real-time to avoid network congestion and optimize for lowest possible latency.
               </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
