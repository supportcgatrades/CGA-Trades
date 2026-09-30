import React from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, Fingerprint, Search, Globe, FileCheck } from 'lucide-react';

export default function AMLPolicy() {
  return (
    <div className="min-h-screen bg-[#050608] pt-24 pb-20 px-6">
      <div className="max-w-4xl mx-auto space-y-12">
        <header className="space-y-6 pb-12 border-b border-white/5">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 text-secondary"
          >
            <ShieldAlert size={24} />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Compliance Framework</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl lg:text-7xl font-black italic font-serif text-white uppercase tracking-tighter leading-none"
          >
            AML & KYC <span className="text-secondary">Framework</span>
          </motion.h1>
          <div className="flex items-center gap-4 text-aura-muted text-[10px] font-black tracking-widest uppercase">
            <span>Global Standard v4.0.1</span>
            <span className="w-1 h-1 bg-white/20 rounded-full" />
            <span>Last Sync: May 2026</span>
          </div>
        </header>

        <div className="space-y-16 pb-20">
          <section className="space-y-6">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-secondary/10 rounded-2xl flex items-center justify-center text-secondary shadow-inner">
                   <Fingerprint size={24} />
                </div>
                <h3 className="text-2xl font-black italic font-serif text-white uppercase italic">Anti-Money Laundering</h3>
             </div>
             <p className="text-aura-muted text-sm leading-[1.8] font-medium tracking-wide">
                Capital Growth Alliance maintains the highest standards of financial integrity. Our Anti-Money Laundering (AML) and Counter-Terrorism Financing (CTF) protocols are integrated directly into our neural execution environment, screening every transmission for anomalous patterns or high-risk origin vectors.
             </p>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="p-8 bg-white/5 border border-white/5 rounded-[40px] space-y-4 shadow-2xl group hover:border-secondary/20 transition-all">
                <Search size={32} className="text-secondary" />
                <h4 className="text-lg font-black text-white uppercase italic font-serif">Monitoring</h4>
                <p className="text-[11px] text-aura-muted leading-relaxed uppercase tracking-widest font-medium">
                  Real-time transactional analysis using AI-driven heuristics to detect and block suspicious asset flows before settlement.
                </p>
             </div>
             <div className="p-8 bg-white/5 border border-white/5 rounded-[40px] space-y-4 shadow-2xl group hover:border-secondary/20 transition-all">
                <Globe size={32} className="text-secondary" />
                <h4 className="text-lg font-black text-white uppercase italic font-serif">Verification</h4>
                <p className="text-[11px] text-aura-muted leading-relaxed uppercase tracking-widest font-medium">
                  Biometric-integrated Know Your Customer (KYC) procedures ensuring that all liquidity participants are verified against global watchlists.
                </p>
             </div>
          </div>

          <section className="space-y-8">
             <div className="p-8 lg:p-12 bg-[#11141b] border border-white/5 rounded-[48px] shadow-2xl ring-1 ring-white/5">
                <h3 className="text-xl font-black italic font-serif text-white uppercase mb-8 flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                  Compliance Pillars
                </h3>
                
                <div className="space-y-6">
                   {[
                     { title: 'Identity Intelligence', desc: 'Sourcing data from 180+ global jurisdictions to verify UBO (Ultimate Beneficial Owner) status.' },
                     { title: 'Transaction Forensic', desc: 'Deep chain-analysis for every digital asset entry to ensure zero exposure to sanctioned addresses.' },
                     { title: 'Regulatory Sync', desc: 'Instant adaptation to evolving FATF guidelines and regional digital asset regulations.' },
                     { title: 'Risk Tiering', desc: 'Dynamic assignment of risk profiles based on institutional behavior and source of funds documentation.' }
                   ].map((item, i) => (
                     <div key={i} className="flex gap-6 pb-6 border-b border-white/5 last:border-0 last:pb-0">
                        <div className="text-secondary font-mono text-sm">0{i+1}</div>
                        <div className="space-y-1">
                           <h4 className="text-sm font-black text-white uppercase tracking-tight">{item.title}</h4>
                           <p className="text-xs text-aura-muted uppercase tracking-widest leading-relaxed">{item.desc}</p>
                        </div>
                     </div>
                   ))}
                </div>
             </div>
          </section>

          <section className="space-y-6">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-secondary/10 rounded-2xl flex items-center justify-center text-secondary shadow-inner">
                   <FileCheck size={24} />
                </div>
                <h3 className="text-2xl font-black italic font-serif text-white uppercase italic">Institutional Reporting</h3>
             </div>
             <p className="text-aura-muted text-sm leading-[1.8] font-medium tracking-wide">
                We cooperate fully with international financial intelligence units and law enforcement agencies. Our platform is designed with "Compliance by Design" philosophy, facilitating seamless reporting of STRs (Suspicious Transaction Reports) where mandatory, without compromising the security of legitimate institutional clusters.
             </p>
          </section>
        </div>

        <div className="p-10 bg-secondary rounded-[40px] text-[#050608] flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
           <div className="space-y-2">
              <h4 className="text-2xl font-black italic font-serif uppercase leading-tight">Compliance Verification</h4>
              <p className="text-black/60 text-[10px] font-bold uppercase tracking-[0.2em]">Contact our compliance terminal for institutional onboarding specs.</p>
           </div>
           <button className="px-8 py-4 bg-white text-secondary font-black uppercase tracking-[0.3em] text-[10px] rounded-xl hover:scale-105 transition-all">
              Contact Compliance
           </button>
        </div>
      </div>
    </div>
  );
}
