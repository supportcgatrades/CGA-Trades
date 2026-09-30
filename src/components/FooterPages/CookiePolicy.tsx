import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Info, FileText } from 'lucide-react';

export default function CookiePolicy() {
  return (
    <div className="min-h-screen bg-[#050608] pt-24 pb-20 px-6">
      <div className="max-w-4xl mx-auto space-y-12">
        <header className="space-y-6 pb-12 border-b border-white/5">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 text-primary"
          >
            <ShieldCheck size={24} />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Protocol Documentation</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl lg:text-7xl font-black italic font-serif text-white uppercase tracking-tighter"
          >
            Cookie <span className="text-primary">Policy</span>
          </motion.h1>
          <p className="text-aura-muted text-sm font-medium leading-relaxed tracking-wide uppercase">
            Last Updated: May 14, 2026 • Version 2.8.4
          </p>
        </header>

        <div className="prose prose-invert prose-aura space-y-12 pb-20">
          <section className="space-y-4">
             <h3 className="text-xl font-black italic font-serif text-white uppercase flex items-center gap-3">
                <div className="w-1.5 h-6 bg-primary" /> 01. Integration Logic
             </h3>
             <p className="text-aura-muted text-sm leading-[1.8] font-medium tracking-wide">
                Capital Growth Alliance uses "Cookies" and similar tracking technologies to facilitate secure neural synchronization and persistent session management. These telemetry nodes are essential for maintaining the integrity of our high-frequency execution environment.
             </p>
          </section>

          <section className="space-y-4">
             <h3 className="text-xl font-black italic font-serif text-white uppercase flex items-center gap-3">
                <div className="w-1.5 h-6 bg-primary" /> 02. Essential Clusters
             </h3>
             <p className="text-aura-muted text-sm leading-[1.8] font-medium tracking-wide">
                Certain cookies are strictly necessary for the technical architecture of our platform. These include security handshake tokens, multi-factor authentication persistence, and routing vectors that ensure your requests are handled by the lowest-latency node cluster.
             </p>
          </section>

          <section className="space-y-8">
             <h3 className="text-xl font-black italic font-serif text-white uppercase flex items-center gap-3">
                <div className="w-1.5 h-6 bg-primary" /> 03. Telemetry Classification
             </h3>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 bg-white/5 border border-white/5 rounded-3xl space-y-2">
                   <h4 className="text-sm font-black text-white uppercase">Authentication</h4>
                   <p className="text-xs text-aura-muted leading-relaxed uppercase tracking-widest font-medium">Maintains secure link to the Neural Core during your session.</p>
                </div>
                <div className="p-6 bg-white/5 border border-white/5 rounded-3xl space-y-2">
                   <h4 className="text-sm font-black text-white uppercase">Performance</h4>
                   <p className="text-xs text-aura-muted leading-relaxed uppercase tracking-widest font-medium">Tracks latency metrics and network throughput to optimize UI rendering.</p>
                </div>
                <div className="p-6 bg-white/5 border border-white/5 rounded-3xl space-y-2">
                   <h4 className="text-sm font-black text-white uppercase">Personalization</h4>
                   <p className="text-xs text-aura-muted leading-relaxed uppercase tracking-widest font-medium">Retains your terminal configuration and language preferences.</p>
                </div>
                <div className="p-6 bg-white/5 border border-white/5 rounded-3xl space-y-2">
                   <h4 className="text-sm font-black text-white uppercase">Analytics</h4>
                   <p className="text-xs text-aura-muted leading-relaxed uppercase tracking-widest font-medium">Anonymized dataset ingestion for platform-wide UX optimization.</p>
                </div>
             </div>
          </section>

          <section className="space-y-4">
             <h3 className="text-xl font-black italic font-serif text-white uppercase flex items-center gap-3">
                <div className="w-1.5 h-6 bg-primary" /> 04. Neural Termination
             </h3>
             <p className="text-aura-muted text-sm leading-[1.8] font-medium tracking-wide">
                You may choose to disable telemetry through your browser terminal. However, please be advised that deactivating Essential Clusters will result in a "Link Loss" state, preventing access to secure trade execution areas and the Cipher Admin panel.
             </p>
          </section>

          <section className="space-y-4">
             <h3 className="text-xl font-black italic font-serif text-white uppercase flex items-center gap-3">
                <div className="w-1.5 h-6 bg-primary" /> 05. Compliance Sync
             </h3>
             <p className="text-aura-muted text-sm leading-[1.8] font-medium tracking-wide">
                This policy is subject to real-time updates as the Capital Growth Alliance architecture evolves. We recommend reviewing this document periodically through your Support Terminal.
             </p>
          </section>
        </div>

        <div className="p-10 bg-white/5 border border-white/5 rounded-[40px] flex items-center gap-6 shadow-2xl">
           <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner">
              <FileText size={32} />
           </div>
           <div>
              <h4 className="text-lg font-black text-white uppercase italic font-serif">Legal Disclosure</h4>
              <p className="text-[10px] font-black text-aura-muted uppercase tracking-[0.2em] mt-1">Full legal framework is available upon institutional request via support@cgatrades.com</p>
           </div>
        </div>
      </div>
    </div>
  );
}
