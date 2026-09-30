import React, { useState, useEffect } from 'react';
import { Shield, Scale, FileText, ChevronLeft, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Footer from './Footer';
import { cn } from '../lib/utils';

const TermsOfService = () => {
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
              <Scale size={16} className="text-primary" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Legal Center</span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="py-20 border-b border-white/5 bg-gradient-to-b from-[#080a0f] to-[#050608]">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-4xl md:text-6xl font-black text-white italic font-serif leading-tight mb-6">
            Terms of <span className="text-aura-lime">Service</span>
          </h1>
          <p className="text-aura-muted text-lg max-w-2xl leading-relaxed">
            Last updated: May 14, 2026. Please read these terms carefully before accessing or using the Capital Growth Alliance ecosystem.
          </p>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-16 space-y-16">
        <section className="space-y-6">
          <div className="flex items-center gap-4 text-aura-lime">
            <FileText size={20} />
            <h2 className="text-sm font-black uppercase tracking-[0.3em]">1. Acceptance of Terms</h2>
          </div>
          <p className="text-aura-muted leading-relaxed">
            By accessing or using the Capital Growth Alliance ("CGA Trades," "we," "us," or "our") platform, services, and associated applications, you agree to be bound by these Terms of Service. If you do not agree to these terms, you must immediately cease all use of our services.
          </p>
        </section>

        <section className="space-y-6 p-8 bg-white/5 border border-white/10 rounded-2xl">
          <div className="flex items-center gap-4 text-aura-lime">
            <Shield size={20} />
            <h2 className="text-sm font-black uppercase tracking-[0.3em]">2. Eligibility & Compliance</h2>
          </div>
          <p className="text-aura-muted leading-relaxed">
            You represent and warrant that you are at least 18 years of age and possess the legal authority to enter into this agreement. You must comply with all local, state, national, and international laws, including financial regulations and anti-money laundering (AML) statutes applicable in your jurisdiction.
          </p>
        </section>

        <section className="space-y-10">
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white tracking-tight">3. Platform Services</h3>
            <p className="text-aura-muted leading-relaxed text-sm">
              Capital Growth Alliance provides an institutional-grade digital asset management and algorithmic trading interface. Our services include but are not limited to:
            </p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                "Strategic ROI accumulation engines",
                "Neural-link investment optimization",
                "High-frequency algorithmic execution",
                "Secured cross-chain fund transfers"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-aura-muted text-sm border-l border-aura-lime/30 pl-4 py-2">
                  <span className="w-1.5 h-1.5 bg-aura-lime rounded-full" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4 border-t border-white/5 pt-10">
            <h3 className="text-xl font-bold text-white tracking-tight">4. Risk Disclosure</h3>
            <p className="text-aura-muted leading-relaxed">
              Financial markets involve substantial risk. Past performance is not indicative of future results. Capital Growth Alliance does not guarantee profits or specific ROI percentages. Users are responsible for their investment decisions and should only utilize capital they can afford to lose.
            </p>
          </div>

          <div className="space-y-4 border-t border-white/5 pt-10">
            <h3 className="text-xl font-bold text-white tracking-tight">5. Prohibited Activities</h3>
            <p className="text-aura-muted leading-relaxed">
              Users are strictly prohibited from utilizing the platform for:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 text-xs">
              <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-xl space-y-2">
                <span className="font-bold text-red-500 uppercase tracking-widest">Criminal Intent</span>
                <p className="text-white/40">Money laundering, terrorist financing, or fraudulent transactions.</p>
              </div>
              <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-xl space-y-2">
                <span className="font-bold text-red-500 uppercase tracking-widest">System Manipulation</span>
                <p className="text-white/40">Reverse engineering, DDoS attacks, or exploiting smart contracts.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-8 py-10 border-y border-white/5">
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white tracking-tight">6. Intellectual Property</h3>
            <p className="text-aura-muted leading-relaxed">
              All proprietary algorithms, UI designs, brand marks, and technical documentation are the exclusive property of Capital Growth Alliance. No license is granted to users except for the express purpose of utilizing provided services.
            </p>
          </div>
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white tracking-tight">7. Limitation of Liability</h3>
            <p className="text-aura-muted leading-relaxed">
              Capital Growth Alliance shall not be liable for any indirect, incidental, or consequential damages arising from the use or inability to use the platform, including hardware failures, network outages, or volatility in the digital asset markets.
            </p>
          </div>
        </section>

        <Footer />
      </main>
    </div>
  );
};

export default TermsOfService;
