import React from 'react';
import { motion } from 'motion/react';
import { 
  Building2, 
  ShieldCheck, 
  Zap, 
  Globe, 
  BarChart3, 
  CheckCircle2,
  ExternalLink,
  Cpu,
  Lock,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { cn } from '../lib/utils';

interface PartnerTheme {
  bg: string;
  border: string;
  accent: string;
  glow: string;
  badge: string;
  iconBg: string;
  textAccent: string;
}

interface Partner {
  name: string;
  category: string;
  logo: string;
  established: string;
  partneredSince: string;
  description: string;
  highlights: string[];
  theme: PartnerTheme;
}

const PARTNERS: Partner[] = [
  {
    name: "Binance",
    category: "Crypto Exchange",
    logo: "https://i.imgur.com/cw8TspJ.png",
    established: "2017",
    partneredSince: "2018",
    description: "Binance is the world's leading cryptocurrency exchange by trading volume, providing a robust ecosystem for digital asset trading, decentralized finance (DeFi), and blockchain innovation.",
    highlights: ["Deepest global liquidity pools", "Advanced API integrations", "Institutional-grade security infrastructure"],
    theme: {
      bg: "bg-[#090B0D]",
      border: "hover:border-[#F0B90B]/40",
      accent: "#F0B90B",
      glow: "from-[#F0B90B]/5 to-transparent",
      badge: "bg-[#F0B90B]/10 text-[#F0B90B] border-[#F0B90B]/20",
      iconBg: "bg-[#F0B90B]/5 border-[#F0B90B]/10",
      textAccent: "text-[#F0B90B]"
    }
  },
  {
    name: "TradingView",
    category: "Financial Charting & Analysis",
    logo: "https://i.imgur.com/NWkNPQ0.png",
    established: "2011",
    partneredSince: "2012",
    description: "TradingView is a globally renowned charting platform and social network used by millions of traders and investors to spot opportunities across global markets.",
    highlights: ["Advanced technical analysis tools", "Real-time global market data", "Custom Pine Script indicators"],
    theme: {
      bg: "bg-[#070A14]",
      border: "hover:border-[#2962FF]/40",
      accent: "#2962FF",
      glow: "from-[#2962FF]/5 to-transparent",
      badge: "bg-[#2962FF]/10 text-[#2962FF] border-[#2962FF]/20",
      iconBg: "bg-[#2962FF]/5 border-[#2962FF]/10",
      textAccent: "text-[#2962FF]"
    }
  },
  {
    name: "Headway",
    category: "Forex Broker",
    logo: "https://i.imgur.com/8vKO6iz.png",
    established: "2023",
    partneredSince: "2024",
    description: "Headway is an innovative international broker offering seamless access to global financial markets with a focus on transparency, low latency, and client-centric conditions.",
    highlights: ["Ultra-fast execution speeds", "Diverse asset classes", "Robust regulatory compliance"],
    theme: {
      bg: "bg-[#060D09]",
      border: "hover:border-[#00E676]/40",
      accent: "#00E676",
      glow: "from-[#00E676]/5 to-transparent",
      badge: "bg-[#00E676]/10 text-[#00E676] border-[#00E676]/20",
      iconBg: "bg-[#00E676]/5 border-[#00E676]/10",
      textAccent: "text-[#00E676]"
    }
  },
  {
    name: "Exness",
    category: "Multi-Asset Broker",
    logo: "https://i.imgur.com/MqPWaJG.png",
    established: "2008",
    partneredSince: "2009",
    description: "Exness is a premier multi-asset broker known for its scientific approach to trading, offering some of the most stable and reliable trading conditions in the industry.",
    highlights: ["Proprietary algorithmic pricing", "Instant automated withdrawals", "Transparent historical tick data"],
    theme: {
      bg: "bg-[#0F0A06]",
      border: "hover:border-[#FFB300]/40",
      accent: "#FFB300",
      glow: "from-[#FFB300]/5 to-transparent",
      badge: "bg-[#FFB300]/10 text-[#FFB300] border-[#FFB300]/20",
      iconBg: "bg-[#FFB300]/5 border-[#FFB300]/10",
      textAccent: "text-[#FFB300]"
    }
  },
  {
    name: "OANDA",
    category: "Forex Broker & Data Provider",
    logo: "https://i.imgur.com/ov9LA63.png",
    established: "1996",
    partneredSince: "1997",
    description: "OANDA is a trusted global leader in online multi-asset trading services, currency data, and analytics, serving retail and corporate clients worldwide.",
    highlights: ["Institutional-grade execution", "Award-winning trading platforms", "Precise currency data APIs"],
    theme: {
      bg: "bg-[#0B0912]",
      border: "hover:border-[#FF3B30]/40",
      accent: "#FF3B30",
      glow: "from-[#FF3B30]/5 to-transparent",
      badge: "bg-[#FF3B30]/10 text-[#FF3B30] border-[#FF3B30]/20",
      iconBg: "bg-[#FF3B30]/5 border-[#FF3B30]/10",
      textAccent: "text-[#FF3B30]"
    }
  },
  {
    name: "Coinbase",
    category: "Crypto Exchange",
    logo: "https://i.imgur.com/Ru5K2G5.png",
    established: "2012",
    partneredSince: "2013",
    description: "Coinbase is a secure, publicly traded platform that makes it easy to buy, sell, and store cryptocurrency, serving as a primary gateway for institutional adoption.",
    highlights: ["Strict regulatory compliance", "Coinbase Prime for institutions", "Secure cold storage infrastructure"],
    theme: {
      bg: "bg-[#060B1A]",
      border: "hover:border-[#0052FF]/40",
      accent: "#0052FF",
      glow: "from-[#0052FF]/5 to-transparent",
      badge: "bg-[#0052FF]/10 text-[#0052FF] border-[#0052FF]/20",
      iconBg: "bg-[#0052FF]/5 border-[#0052FF]/10",
      textAccent: "text-[#0052FF]"
    }
  },
  {
    name: "KuCoin",
    category: "Crypto Exchange",
    logo: "https://i.imgur.com/9LoVvQX.png",
    established: "2017",
    partneredSince: "2018",
    description: "Known as the \"People's Exchange,\" KuCoin is a global cryptocurrency exchange that provides a wide array of digital assets, advanced trading features, and community-driven growth.",
    highlights: ["Extensive altcoin selection", "High-performance matching engine", "Robust security protocols"],
    theme: {
      bg: "bg-[#05140F]",
      border: "hover:border-[#12C57B]/40",
      accent: "#12C57B",
      glow: "from-[#12C57B]/5 to-transparent",
      badge: "bg-[#12C57B]/10 text-[#12C57B] border-[#12C57B]/20",
      iconBg: "bg-[#12C57B]/5 border-[#12C57B]/10",
      textAccent: "text-[#12C57B]"
    }
  },
  {
    name: "OKX",
    category: "Crypto Exchange & Web3",
    logo: "https://i.imgur.com/9B9PkRl.png",
    established: "2017",
    partneredSince: "2018",
    description: "OKX is a leading global cryptocurrency spot and derivatives exchange and Web3 ecosystem, offering advanced financial services to traders globally.",
    highlights: ["Comprehensive derivatives market", "Advanced Web3 wallet integration", "Deep cross-pair liquidity"],
    theme: {
      bg: "bg-[#090909]",
      border: "hover:border-white/30",
      accent: "#FFFFFF",
      glow: "from-white/5 to-transparent",
      badge: "bg-white/10 text-white border-white/20",
      iconBg: "bg-white/5 border-white/10",
      textAccent: "text-white"
    }
  },
  {
    name: "IC Markets",
    category: "Forex CFD Provider",
    logo: "https://i.imgur.com/6iFyC8F.png",
    established: "2007",
    partneredSince: "2008",
    description: "IC Markets is one of the world's largest True ECN forex brokers, providing trading solutions for active day traders and scalpers as well as novices.",
    highlights: ["Raw spread connectivity", "Enterprise-grade hardware", "Minimal latency routing"],
    theme: {
      bg: "bg-[#060D17]",
      border: "hover:border-[#009BFF]/40",
      accent: "#009BFF",
      glow: "from-[#009BFF]/5 to-transparent",
      badge: "bg-[#009BFF]/10 text-[#009BFF] border-[#009BFF]/20",
      iconBg: "bg-[#009BFF]/5 border-[#009BFF]/10",
      textAccent: "text-[#009BFF]"
    }
  },
  {
    name: "OctaFX",
    category: "Forex Broker",
    logo: "https://i.imgur.com/I4jk3sM.png",
    established: "2011",
    partneredSince: "2012",
    description: "OctaFX is a globally recognized forex broker providing state-of-the-art trading platforms, tight spreads, and a commitment to helping traders achieve goals.",
    highlights: ["No-dealing desk execution", "Comprehensive educational resources", "Localized global support"],
    theme: {
      bg: "bg-[#050D1D]",
      border: "hover:border-[#0081FF]/40",
      accent: "#0081FF",
      glow: "from-[#0081FF]/5 to-transparent",
      badge: "bg-[#0081FF]/10 text-[#0081FF] border-[#0081FF]/20",
      iconBg: "bg-[#0081FF]/5 border-[#0081FF]/10",
      textAccent: "text-[#0081FF]"
    }
  }
];

const Partners = () => {
  return (
    <div className="min-h-screen bg-[#050608] text-white pt-32 pb-20 px-6 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-[150px] translate-y-1/2 -translate-x-1/2" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center space-y-6 mb-20 lg:mb-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary"
          >
            <Globe size={14} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Global Ecosystem</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase leading-none"
          >
            Our <span className="text-primary">Partners</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-aura-muted text-base md:text-lg max-w-2xl mx-auto font-medium"
          >
            We collaborate with the world's leading financial institutions, exchanges, and technology providers to deliver unparalleled liquidity, security, and execution speed.
          </motion.p>
        </div>

        {/* Cohesive, responsive grid layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
          {PARTNERS.map((partner, index) => {
            const theme = partner.theme;
            return (
              <motion.div
                key={partner.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                style={{
                  '--brand-accent': theme.accent,
                  '--brand-accent-glow': `${theme.accent}12`,
                } as React.CSSProperties}
                className={cn(
                  "group border rounded-[32px] p-6 lg:p-8 transition-all duration-500 overflow-hidden relative flex flex-col justify-between h-full select-none",
                  theme.bg,
                  "border-white/5 hover:border-[var(--brand-accent)]/30 hover:shadow-[0_0_35px_var(--brand-accent-glow)] bg-[#0A0B0E]"
                )}
              >
                {/* Embedded brand visual background glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--brand-accent)]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                
                <div className="space-y-6 relative z-10 h-full flex flex-col justify-between">
                  {/* Top Section: Logo, Name, Category */}
                  <div className="space-y-5">
                    {/* Perfect Logo container guaranteeing 0% clipping, clean padding, and alignment */}
                    <div className="w-full h-24 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center p-4 relative overflow-hidden backdrop-blur-md group-hover:scale-[1.02] group-hover:bg-white/[0.08] transition-all duration-300">
                      <img 
                        src={partner.logo} 
                        alt={`${partner.name} Logo`} 
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain filter transition-transform duration-500 max-h-16" 
                      />
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-black italic tracking-tight uppercase leading-none mb-1 text-white">
                        {partner.name}
                      </h3>
                      {/* Premium category badge dynamically styled based on partner brand colors */}
                      <span className="px-2.5 py-1 bg-[var(--brand-accent-glow)] border border-[var(--brand-accent)]/20 text-[9px] font-black uppercase tracking-wider rounded-md text-[var(--brand-accent)] inline-block w-fit mt-1">
                        {partner.category}
                      </span>
                    </div>
                  </div>

                  {/* Operational Stats badging */}
                  <div className="grid grid-cols-2 gap-3 py-4 border-y border-white/5 text-[10px]">
                    <div className="space-y-1">
                      <span className="text-[8px] font-black uppercase tracking-widest text-[#ffffff50] block">Established</span>
                      <span className="font-mono font-bold text-white/80 flex items-center gap-1.5 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg w-fit">
                        <Calendar size={10} className="text-white/40" />
                        {partner.established}
                      </span>
                    </div>
                    <div className="space-y-1 flex flex-col items-end">
                      <span className="text-[8px] font-black uppercase tracking-widest text-[#ffffff50] block">TWN Partner Since</span>
                      <span className="font-mono font-bold text-[var(--brand-accent)] flex items-center gap-1.5 bg-[var(--brand-accent-glow)] border border-[var(--brand-accent)]/20 px-2.5 py-1 rounded-lg w-fit">
                        <Layers size={10} />
                        {partner.partneredSince}
                      </span>
                    </div>
                  </div>

                  {/* Core description */}
                  <p className="text-[11px] text-aura-muted font-medium leading-relaxed flex-grow">
                    {partner.description}
                  </p>

                  {/* Highlights styled with custom bullet icons of partner brand color */}
                  <div className="space-y-3 pt-5 border-t border-white/5">
                    <p className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em] flex items-center gap-1.5">
                      <Sparkles size={10} className="text-[var(--brand-accent)]" /> Key Highlights
                    </p>
                    <ul className="space-y-2">
                      {partner.highlights.map((h) => (
                        <li key={h} className="flex items-start gap-2 text-[10px] font-bold text-white/80">
                          <CheckCircle2 size={12} className="text-[var(--brand-accent)] shrink-0 mt-0.5" />
                          <span className="leading-tight">{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Footer Compliance and Routing Information */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-30 lg:mt-32 p-10 lg:p-12 bg-[#0A0B0E] border border-white/5 rounded-[48px] text-center space-y-6 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-50 pointer-events-none" />
          <div className="relative z-10 max-w-3xl mx-auto">
            <p className="text-xs md:text-sm font-bold text-aura-muted leading-relaxed italic">
              "We trade with No-Dealing Desk (NDD) brokers: Straight Through Processing (STP). STP brokers route their clients' orders directly to liquidity providers and we also are solidified by our liquidity pool on <a href="https://www.binance.com/en/swap/pool" target="_blank" rel="noreferrer" className="text-primary hover:underline">https://www.binance.com/en/swap/pool</a> web3 built on coinbase, kucoin.com and okx.com"
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Partners;
