import React, { useState, useEffect } from 'react';
import { Lock, Eye, ShieldCheck, ChevronLeft, Globe, Fingerprint, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import Footer from './Footer';

const PrivacyPolicy = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#050608] text-white font-sans selection:bg-aura-lime/30">
      {/* Header */}
      <header className={cn(
        "fixed top-0 inset-x-0 transition-all duration-500 z-[100] border-b backdrop-blur-md",
        isScrolled ? "h-14 bg-aura-black/80 border-white/10" : "h-20 lg:h-24 bg-transparent border-transparent",
        "border-white/5"
      )}>
        <div className="max-w-4xl mx-auto px-6 h-full flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-aura-muted hover:text-white transition-all group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest">Back</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center">
              <Lock size={16} className="text-primary" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Security Center</span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="py-20 border-b border-white/5 bg-gradient-to-b from-[#080a0f] to-[#050608]">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-4xl md:text-6xl font-black text-white italic font-serif leading-tight mb-6">
            Privacy & <span className="text-aura-lime">Security</span>
          </h1>
          <p className="text-aura-muted text-lg max-w-2xl leading-relaxed">
            Protecting your neural data and financial assets is our primary mandate. This protocol outlines how Capital Growth Alliance handles and secures your information.
          </p>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-16 space-y-20">
        <section className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 text-aura-lime mb-4">
              <Eye size={20} />
              <h2 className="text-xs font-black uppercase tracking-[0.3em]">Visibility</h2>
            </div>
            <h3 className="text-xl font-bold mb-4 tracking-tight">Transparency Commitment</h3>
            <p className="text-aura-muted text-sm leading-relaxed">
              We operate with full transparency regarding data collection. Your assets are never pooled with operational funds.
            </p>
          </div>
          <div className="md:col-span-2 space-y-6">
            <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-aura-muted uppercase tracking-widest">Protocol Alpha</span>
                <Globe size={14} className="text-aura-muted" />
              </div>
              <h4 className="text-lg font-bold">Data Collection & Storage</h4>
              <p className="text-aura-muted text-sm leading-relaxed">
                We collect essential information to facilitate secure transactions and account management. This includes identity verification documents, device signatures, and transaction history. All data is encrypted using military-grade AES-256 protocols before storage.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-10">
          <div className="flex items-center gap-4 text-aura-lime">
            <Fingerprint size={20} />
            <h2 className="text-sm font-black uppercase tracking-[0.3em]">Biometric & Neural Security</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-lg font-bold">Two-Factor Authentication</h3>
              <p className="text-aura-muted text-sm leading-relaxed">
                Access to significant account mutations requires mandatory multi-factor authentication. We support hardware security keys (FIDO2) and biometric signatures to prevent unauthorized entry.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-bold">Session Integrity</h3>
              <p className="text-aura-muted text-sm leading-relaxed">
                Automated session termination occurs after 15 minutes of inactivity. Neural link signatures are monitored for pattern anomalies, triggering immediate lock-down if suspicious activity is detected.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-aura-lime/5 border border-aura-lime/20 rounded-3xl p-10 space-y-8">
          <div className="flex items-center gap-4 text-aura-lime">
            <ShieldCheck size={24} />
            <h2 className="text-lg font-black uppercase tracking-[0.3em]">Zero-Knowledge Policy</h2>
          </div>
          <div className="space-y-6">
            <p className="text-white/80 leading-relaxed">
              Capital Growth Alliance adheres to a strict zero-knowledge architecture for sensitive financial keys. We do not store your private keys or unencrypted seed phrases on our servers. You remain the sole custodian of your digital asset signatures.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              <div className="text-center p-4">
                <p className="text-2xl font-black text-white italic mb-1">99.9%</p>
                <p className="text-[10px] text-aura-muted uppercase tracking-widest">Uptime Record</p>
              </div>
              <div className="text-center p-4 border-x border-white/10">
                <p className="text-2xl font-black text-white italic mb-1">256-Bit</p>
                <p className="text-[10px] text-aura-muted uppercase tracking-widest">Encryption</p>
              </div>
              <div className="text-center p-4">
                <p className="text-2xl font-black text-white italic mb-1">2FA</p>
                <p className="text-[10px] text-aura-muted uppercase tracking-widest">Mandatory</p>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-8">
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white tracking-tight">Third-Party Disclosure</h3>
            <p className="text-aura-muted leading-relaxed text-sm">
              We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties. This does not include trusted third parties who assist us in operating our platform, conducting our business, or serving our users, provided those parties agree to keep this information confidential.
            </p>
          </div>
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white tracking-tight">Financial Secrecy</h3>
            <p className="text-aura-muted leading-relaxed text-sm">
              We comply with international banking secrecy guidelines where applicable. Information is only disclosed to legal authorities when compelled by a valid subpoena or court order in a jurisdiction where Capital Growth Alliance operates.
            </p>
          </div>
        </section>

        <Footer />
      </main>
    </div>
  );
};

export default PrivacyPolicy;
