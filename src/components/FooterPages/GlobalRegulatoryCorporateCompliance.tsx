import React from 'react';
import { motion } from 'motion/react';
import { Shield, Globe, Landmark, Scale, ShieldCheck, CheckCircle2, ChevronRight, FileText } from 'lucide-react';

export default function GlobalRegulatoryCorporateCompliance() {
  const jurisdictions = [
    {
      country: "United States",
      flag: "🇺🇸",
      intro: "Capital Growth Alliance maintains corporate registration in the United States in accordance with applicable federal and state laws. Our operations are supported by internal compliance procedures covering corporate governance, AML controls, recordkeeping, taxation, and risk management.",
      registrations: [
        { authority: "U.S. Securities and Exchange Commission (SEC)", function: "Regulates investment advisers, broker-dealers, investment companies, securities offerings." },
        { authority: "Financial Industry Regulatory Authority (FINRA)", function: "Required for broker-dealers." },
        { authority: "State Securities Regulators", function: "State-level licensing depending on business activities." }
      ]
    },
    {
      country: "United Kingdom",
      flag: "🇬🇧",
      intro: "Our UK corporate entity operates in accordance with applicable company legislation and maintains internal governance procedures designed to support transparency, accountability, and regulatory compliance.",
      registrations: [
        { authority: "Financial Conduct Authority (FCA)", function: "Authorizes investment firms, asset managers, payment firms, brokers and advisers." }
      ]
    },
    {
      country: "United Arab Emirates",
      flag: "🇦🇪",
      intro: "Our UAE operations are established under the applicable corporate framework and supported by compliance policies covering governance, AML procedures, operational controls, and corporate reporting.",
      registrations: [
        { authority: "Securities and Commodities Authority (SCA)", function: "Federal securities regulator." },
        { authority: "Dubai Financial Services Authority (DFSA)", function: "Regulator for firms in DIFC." },
        { authority: "Financial Services Regulatory Authority (FSRA)", function: "Regulator for firms in ADGM." }
      ]
    },
    {
      country: "Canada",
      flag: "🇨🇦",
      intro: "Capital Growth Alliance's Canadian operations are supported by corporate governance standards and compliance procedures aligned with applicable legal and regulatory requirements.",
      registrations: [
        { authority: "Canadian Securities Administrators (CSA)", function: "Coordinates securities regulation nationally." },
        { authority: "Provincial Securities Commissions", function: "Licensing occurs provincially (e.g., Ontario Securities Commission)." }
      ]
    },
    {
      country: "Australia",
      flag: "🇦🇺",
      intro: "Our Australian corporate structure is supported by policies designed to maintain accountability, financial integrity, and compliance with applicable corporate obligations.",
      registrations: [
        { authority: "Australian Securities and Investments Commission (ASIC)", function: "Issues Australian Financial Services Licence (AFSL)." }
      ]
    },
    {
      country: "Singapore",
      flag: "🇸🇬",
      intro: "Singapore remains an important jurisdiction within our international corporate structure, supported by governance, compliance, and internal risk management policies.",
      registrations: [
        { authority: "Monetary Authority of Singapore (MAS)", function: "Licenses fund managers, advisers, payment firms and brokers." }
      ]
    },
    {
      country: "Switzerland",
      flag: "🇨🇭",
      intro: "Our Swiss corporate presence reflects our commitment to responsible corporate governance and internationally recognized compliance standards.",
      registrations: [
        { authority: "Swiss Financial Market Supervisory Authority (FINMA)", function: "Supervises banks, securities firms, asset managers and fintech firms." }
      ]
    },
    {
      country: "Spain",
      flag: "🇪🇸",
      intro: "Capital Growth Alliance maintains its corporate presence in Spain in accordance with applicable corporate requirements and internal compliance policies.",
      registrations: [
        { authority: "Comisión Nacional del Mercado de Valores (CNMV)", function: "Licenses investment firms and fund managers." }
      ]
    },
    {
      country: "Italy",
      flag: "🇮🇹",
      intro: "Our Italian corporate operations are supported by governance frameworks that promote transparency, operational integrity, and responsible business practices.",
      registrations: [
        { authority: "Commissione Nazionale per le Società e la Borsa (CONSOB)", function: "Regulates investment firms and securities markets." }
      ]
    },
    {
      country: "Portugal",
      flag: "🇵🇹",
      intro: "Capital Growth Alliance's Portuguese operations form part of our broader international corporate network and are supported by comprehensive compliance procedures.",
      registrations: [
        { authority: "Comissão do Mercado de Valores Mobiliários (CMVM)", function: "Regulates securities and investment firms." }
      ]
    },
    {
      country: "Kuwait",
      flag: "🇰🇼",
      intro: "Our Kuwait operations are conducted within the applicable corporate framework and supported by internal governance, compliance monitoring, and risk management practices.",
      registrations: [
        { authority: "Capital Markets Authority (CMA Kuwait)", function: "Licenses investment companies, asset managers and securities firms." }
      ]
    }
  ];

  const compliancePillars = [
    "Anti-Money Laundering (AML)",
    "Know Your Customer (KYC)",
    "Customer Due Diligence (CDD)",
    "Corporate Governance",
    "Internal Risk Management",
    "Financial Recordkeeping",
    "Data Protection & Information Security",
    "Operational Transparency",
    "Ethical Business Conduct",
    "Ongoing Compliance Monitoring"
  ];

  return (
    <div className="min-h-screen bg-[#050608] pt-24 pb-20 px-4 md:px-6 relative overflow-hidden">
      {/* Ambient background decorative elements */}
      <div className="absolute top-0 left-1/4 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[250px] h-[250px] bg-secondary/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-5xl mx-auto space-y-12 relative z-10">
        
        {/* HEADER SECTION */}
        <header className="flex flex-row items-center gap-4 sm:gap-8 pb-8 border-b border-white/5 text-left bg-transparent">
          {/* Left Side: Spinning Globe */}
          <div className="flex-shrink-0 flex items-center justify-center">
            <div className="relative w-16 h-16 sm:w-28 sm:h-28 flex items-center justify-center">
              {/* Outer Glow Halo */}
              <div className="absolute inset-0 bg-[#009e42]/5 blur-2xl rounded-full" />
              
              {/* Spinning/Rolling Realistic Globe Graphics */}
              <div className="w-full h-full relative">
                {/* 3D sphere background with realistic depth gradient */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#020304] via-[#083d20]/30 to-[#009e42]/20 border border-[#009e42]/20 shadow-[inset_0_0_15px_rgba(0,158,66,0.25)]" />
                
                {/* Spinning longitude and latitude grid (realistic digital globe) */}
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
                >
                  <svg viewBox="0 0 100 100" className="w-[90%] h-[90%] text-[#009e42]/75">
                    {/* Latitude grid lines */}
                    <path d="M 10 50 Q 50 65 90 50" fill="none" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.4" />
                    <path d="M 10 50 Q 50 35 90 50" fill="none" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.4" />
                    <path d="M 15 30 Q 50 42 85 30" fill="none" stroke="currentColor" strokeWidth="0.6" strokeOpacity="0.3" />
                    <path d="M 15 70 Q 50 58 85 70" fill="none" stroke="currentColor" strokeWidth="0.6" strokeOpacity="0.3" />
                    
                    {/* Longitude grid lines */}
                    <path d="M 50 5 Q 35 50 50 95" fill="none" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.4" />
                    <path d="M 50 5 Q 65 50 50 95" fill="none" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.4" />
                    <path d="M 50 5 Q 20 50 50 95" fill="none" stroke="currentColor" strokeWidth="0.6" strokeOpacity="0.3" />
                    <path d="M 50 5 Q 80 50 50 95" fill="none" stroke="currentColor" strokeWidth="0.6" strokeOpacity="0.3" />

                    {/* Outer frame */}
                    <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="1" strokeOpacity="0.2" />
                  </svg>
                </motion.div>

                {/* Second layer rotating in reverse (digital node grid & connections) */}
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  animate={{ rotate: -360 }}
                  transition={{ repeat: Infinity, duration: 18, ease: "linear" }}
                >
                  <svg viewBox="0 0 100 100" className="w-[92%] h-[92%] text-emerald-400">
                    {/* Tech dots representing cities/nodes */}
                    <circle cx="30" cy="40" r="1.5" fill="currentColor" className="animate-pulse" style={{ animationDelay: '0s' }} />
                    <circle cx="70" cy="45" r="1.2" fill="currentColor" className="animate-pulse" style={{ animationDelay: '0.3s' }} />
                    <circle cx="45" cy="25" r="1.5" fill="currentColor" className="animate-pulse" style={{ animationDelay: '0.6s' }} />
                    <circle cx="55" cy="75" r="1.2" fill="currentColor" className="animate-pulse" style={{ animationDelay: '0.9s' }} />
                    <circle cx="20" cy="60" r="1.5" fill="currentColor" className="animate-pulse" style={{ animationDelay: '1.2s' }} />
                    <circle cx="80" cy="55" r="1.2" fill="currentColor" className="animate-pulse" style={{ animationDelay: '1.5s' }} />

                    {/* Faint network connection lines between nodes */}
                    <path d="M 30 40 L 45 25 M 70 45 L 80 55 M 20 60 L 55 75" fill="none" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.2" />
                    
                    {/* Ring scanner segment */}
                    <circle cx="50" cy="50" r="48" fill="none" stroke="#009e42" strokeWidth="1.2" strokeDasharray="30 150" strokeOpacity="0.6" />
                  </svg>
                </motion.div>

                {/* Subtle outer scanning HUD circle */}
                <motion.div
                  className="absolute inset-0"
                  animate={{ scale: [0.97, 1.03, 0.97] }}
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                >
                  <div className="w-full h-full rounded-full border border-emerald-500/15" />
                </motion.div>
              </div>
            </div>
          </div>

          {/* Right Side: Title - Side by side layout, keeping it clean and without any unrequested write-ups */}
          <div className="flex-1">
            <motion.h1 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-lg sm:text-3xl font-black italic font-serif text-white uppercase tracking-tight leading-tight"
            >
              Global Regulatory <span className="text-[#009e42]">&</span> Corporate Compliance
            </motion.h1>
          </div>
        </header>

        {/* INTRODUCTION BLOCK */}
        <div className="p-6 sm:p-10 rounded-3xl bg-white/[0.02] border border-white/5 space-y-4 text-left">
          <p className="text-sm text-gray-300 leading-relaxed font-medium">
            At Capital Growth Alliance (CGA Trades), compliance, transparency, and corporate governance are fundamental to our global operations. We maintain corporate registrations and regulatory compliance in multiple international jurisdictions in accordance with the applicable laws and regulatory frameworks governing our business activities.
          </p>
          <p className="text-sm text-gray-300 leading-relaxed font-medium">
            Our compliance program is designed to uphold internationally recognized standards for corporate governance, anti-money laundering (AML), know-your-customer (KYC) procedures, financial integrity, risk management, data protection, and ethical business conduct.
          </p>
          <p className="text-sm text-gray-400 leading-relaxed font-bold">
            The information below summarizes our international corporate presence. Supporting registration certificates, licenses, and compliance documentation are available upon request where appropriate and subject to applicable legal and confidentiality requirements.
          </p>
        </div>

        {/* JURISDICTIONS DIRECTORY */}
        <div className="space-y-8">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <Globe className="text-[#009e42]" size={20} />
            <h2 className="text-xl font-bold uppercase tracking-wider text-white italic font-serif">International Corporate Registry</h2>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {jurisdictions.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-[#0c0f16] to-[#040608] border border-white/5 hover:border-[#009e42]/20 transition-all duration-300 space-y-6 text-left shadow-xl"
              >
                {/* Jurisdiction Title Banner */}
                <div className="flex items-center gap-3">
                  <span className="text-2xl sm:text-3xl select-none" role="img" aria-label={item.country}>{item.flag}</span>
                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight">{item.country}</h3>
                    <span className="text-[9px] font-mono tracking-widest text-[#009e42] uppercase font-bold">CORPORATE REGISTRATION</span>
                  </div>
                </div>

                {/* Registry Details Table/List */}
                <div className="overflow-x-auto rounded-xl border border-white/5 bg-black/30">
                  <table className="w-full text-left text-xs border-collapse min-w-[500px] sm:min-w-0">
                    <thead>
                      <tr className="border-b border-white/5 bg-white/[0.02]">
                        <th className="px-4 py-3 font-mono text-[10px] text-[#009e42] uppercase font-black tracking-widest w-1/2">Code / Regulatory Authority</th>
                        <th className="px-4 py-3 font-mono text-[10px] text-[#009e42] uppercase font-black tracking-widest w-1/2">Function / Scope</th>
                      </tr>
                    </thead>
                    <tbody>
                      {item.registrations.map((reg, regIdx) => (
                        <tr key={regIdx} className="border-b border-white/5 last:border-0 hover:bg-white/[0.01] transition-colors">
                          <td className="px-4 py-3 font-bold text-white flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#009e42]" />
                            {reg.authority}
                          </td>
                          <td className="px-4 py-3 text-gray-400 font-medium leading-relaxed">{reg.function}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Intro Description */}
                <p className="text-xs sm:text-sm text-gray-400 leading-relaxed font-medium">
                  {item.intro}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* GLOBAL COMPLIANCE FRAMEWORK */}
        <section className="space-y-6 text-left">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <Scale className="text-[#009e42]" size={20} />
            <h2 className="text-xl font-bold uppercase tracking-wider text-white italic font-serif">Global Compliance Framework</h2>
          </div>

          <div className="p-6 sm:p-10 rounded-[32px] bg-gradient-to-br from-[#0c0f16]/90 to-[#040608]/95 border border-white/5 space-y-6">
            <p className="text-xs sm:text-sm text-gray-400 font-bold">
              Across our international operations, Capital Growth Alliance maintains internal policies and procedures that support:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {compliancePillars.map((pillar, index) => (
                <div key={index} className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/[0.01] border border-white/5 hover:border-white/10 transition-colors">
                  <div className="w-7 h-7 rounded-lg bg-[#009e42]/10 border border-[#009e42]/20 flex items-center justify-center text-[#009e42] font-mono text-[10px] font-black">
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  <span className="text-xs sm:text-sm text-white font-black uppercase tracking-tight">{pillar}</span>
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-500 leading-relaxed font-bold pt-4 border-t border-white/5">
              These policies are intended to promote responsible corporate operations and support compliance with the laws and regulations applicable to our business activities in each jurisdiction where we operate.
            </p>
          </div>
        </section>

        {/* OUR COMMITMENT */}
        <section className="p-8 sm:p-12 rounded-[40px] bg-gradient-to-br from-[#0c0f16]/95 to-[#040608]/98 border border-[#009e42]/20 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-[#009e42]/5 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <div className="w-12 h-12 rounded-2xl bg-[#009e42]/10 border border-[#009e42]/20 flex items-center justify-center mx-auto">
              <ShieldCheck className="text-[#009e42]" size={24} />
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-black italic font-serif text-white uppercase tracking-tight">Our Commitment</h2>
            
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed font-medium">
              Capital Growth Alliance (CGA Trades) is committed to maintaining high standards of corporate responsibility, operational integrity, and regulatory compliance. We continually review our governance frameworks and internal controls to support sustainable international operations while respecting the legal and regulatory requirements of the jurisdictions in which we maintain a corporate presence.
            </p>

            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed font-bold italic border-t border-white/5 pt-6">
              "We believe that transparency, accountability, and responsible business practices are essential to earning and maintaining the confidence of our clients, partners, and stakeholders worldwide."
            </p>
          </div>
        </section>

      </div>
    </div>
  );
}
