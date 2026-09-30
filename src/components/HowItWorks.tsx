import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Zap, 
  Shield, 
  Cpu, 
  TrendingUp, 
  LineChart, 
  ArrowRight, 
  CheckCircle2, 
  Lock, 
  Signal, 
  BarChart3,
  Bot,
  Activity,
  Search,
  PieChart,
  Navigation,
  Globe,
  ArrowLeft
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useMode } from '../contexts/ModeContext';
import { applyRegionalPlanLimits } from '../utils/regionalLimits';

const PLAN_ICONS: Record<string, React.ReactNode> = {
  regular: <BarChart3 className="w-6 h-6" />,
  premium: <Zap className="w-6 h-6" />,
  elite: <Cpu className="w-6 h-6" />,
};

const getPlanIcon = (id: string) => PLAN_ICONS[id] || <Cpu className="w-6 h-6" />;

const SectionHeader = ({ title, subtitle, icon: Icon, badge }: { title: string; subtitle: string; icon?: any; badge?: string }) => (
  <div className="space-y-4 mb-16">
    {badge && (
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary mb-4">
        <span className="text-[10px] font-black uppercase tracking-[0.2em]">{badge}</span>
      </div>
    )}
    <h2 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase leading-tight">
      {title}
    </h2>
    <p className="text-aura-muted text-lg max-w-2xl font-medium leading-relaxed">
      {subtitle}
    </p>
  </div>
);

const HowItWorks = () => {
  const { profile, plans } = useAuth();
  const { isLite } = useMode();
  const effectivePlans = useMemo(() => applyRegionalPlanLimits(plans, profile, isLite), [plans, profile, isLite]);
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#050608] text-white relative overflow-hidden">
      {/* Edge-to-Edge Premium Header Banner with Sleek Waves & Typography */}
      <div className="w-full h-[240px] md:h-[340px] mb-16 relative overflow-hidden bg-gradient-to-b from-[#090f1d] via-[#050608] to-[#050608] border-b border-white/5 flex items-center justify-center select-none">
        {/* Background Grid Accent */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff01_1px,transparent_1px),linear-gradient(to_bottom,#ffffff01_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        
        {/* Futuristic Glowing Orbs */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-64 h-64 bg-[#009e42]/10 rounded-full blur-[90px] pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-72 h-72 bg-blue-500/5 rounded-full blur-[110px] pointer-events-none" />
        
        {/* Smooth SVG Waves representing Wave Network */}
        <div className="absolute bottom-0 left-0 right-0 h-40 overflow-hidden pointer-events-none opacity-40">
          <svg className="w-full h-full" viewBox="0 0 1440 160" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path 
              d="M0,96 C240,112 480,128 720,112 C960,96 1200,48 1440,32 L1440,160 L0,160 Z" 
              fill="url(#wave-gradient-1)" 
            />
            <path 
              d="M0,64 C240,48 480,96 720,80 C960,64 1200,16 1440,48 L1440,160 L0,160 Z" 
              fill="url(#wave-gradient-2)" 
              opacity="0.5" 
            />
            <defs>
              <linearGradient id="wave-gradient-1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#009e42" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#050608" stopOpacity="0.4" />
              </linearGradient>
              <linearGradient id="wave-gradient-2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.05" />
                <stop offset="100%" stopColor="#050608" stopOpacity="0.3" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Content Overlay */}
        <div className="relative z-10 px-6 max-w-7xl mx-auto w-full flex flex-col items-center text-center space-y-4">
          <motion.div 
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="px-3.5 py-1.5 bg-[#009e42]/10 border border-[#009e42]/20 rounded-full flex items-center gap-2"
          >
            <Cpu size={12} className="text-[#009e42] animate-pulse" />
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.25em] text-[#009e42]">Algoprint Mechanics</span>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="space-y-2 md:space-y-3"
          >
            <h1 className="text-3xl sm:text-5xl md:text-7xl font-black italic tracking-tighter uppercase font-sans text-white">
              HOW IT <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#009e42] via-[#02d147] to-white font-serif">WORKS</span>
            </h1>
            <p className="text-[9px] sm:text-xs font-black uppercase tracking-[0.3em] text-slate-400">
              The Architecture of Decoupled Algorithmic Yield
            </p>
          </motion.div>
        </div>
      </div>

      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-[150px] translate-y-1/2 -translate-x-1/2" />

      <div className="px-6 pb-20 max-w-7xl mx-auto relative z-10">
        
        {/* 1. Hero Section */}
        <section className="text-center space-y-12 mb-40">
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6"
          >
            <Link to="/invest" className="group relative px-10 py-5 bg-primary rounded-2xl overflow-hidden active:scale-95 transition-all shadow-2xl shadow-primary/20">
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              <span className="relative z-10 text-xs font-black uppercase tracking-[0.3em] flex items-center gap-2">
                Get Started Now <ArrowRight size={16} />
              </span>
            </Link>
            <Link to="/help" className="px-10 py-5 border border-white/10 rounded-2xl hover:bg-white/5 transition-all text-xs font-black uppercase tracking-[0.3em] backdrop-blur-md">
              Contact Us Now
            </Link>
          </motion.div>

          {/* Animated Hero Visuals */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-20 relative"
          >
            <div className="aspect-[16/9] md:aspect-[21/9] w-full bg-[#0A0B0E] border border-white/5 rounded-[32px] md:rounded-[48px] overflow-hidden relative group">
               <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 opacity-50" />
               <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full h-full p-6 md:p-12 flex flex-col justify-between">
                     <div className="flex justify-between items-start">
                        <div className="space-y-2 md:space-y-4">
                           <div className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-[8px] md:text-xs">
                              <Signal size={16} className="animate-pulse" />
                              Network Active: CGA Trades Mainnet
                           </div>
                           <div className="text-xl md:text-4xl font-black italic tracking-tighter uppercase font-serif">Algorithmic Precision</div>
                        </div>
                        <div className="p-3 md:p-4 bg-white/5 border border-white/10 rounded-xl md:rounded-2xl backdrop-blur-md hidden sm:block">
                           <Cpu size={32} className="text-primary animate-pulse w-6 h-6 md:w-8 md:h-8" />
                        </div>
                     </div>
                     <div className="flex justify-between items-end">
                        <div className="flex gap-1 items-end h-16 md:h-32">
                           {[40, 70, 45, 90, 65, 80, 50, 95, 75, 85].map((h, i) => (
                             <motion.div 
                                key={i}
                                initial={{ height: 0 }}
                                animate={{ height: `${h}%` }}
                                transition={{ delay: 1 + (i * 0.1), duration: 1 }}
                                className="w-1 md:w-2 bg-primary/40 rounded-t-full"
                             />
                           ))}
                        </div>
                        <div className="text-right space-y-1 md:space-y-2">
                           <p className="text-[7px] md:text-[10px] font-black text-aura-muted uppercase tracking-widest">Global Synchronization</p>
                           <p className="text-sm md:text-xl font-black text-white italic font-serif uppercase tracking-tight">READY // 0.003ms Latency</p>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          </motion.div>
        </section>

        {/* 2. AI Intelligence Section */}
        <section className="mb-40 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <SectionHeader 
              badge="Neural Engine"
              title="AI Intelligence" 
              subtitle="The CGA Trades core utilizes high-frequency neural clusters to execute predictive market analysis across global liquidity pools."
            />
            <div className="grid grid-cols-1 gap-4 sm:gap-6">
               {[
                 { icon: Search, title: "Market Scanning", desc: "Constant surveillance of global markets for yield opportunities." },
                 { icon: LineChart, title: "Predictive Analytics", desc: "Modeling future price action with deep learning algorithms." },
                 { icon: Activity, title: "Risk Mitigation", desc: "Real-time volatility dampening to preserve capital integrity." }
               ].map((item, i) => (
                 <div key={i} className="flex flex-col sm:flex-row gap-4 sm:gap-6 p-6 bg-[#0A0B0E] border border-white/5 rounded-3xl group hover:border-primary/30 transition-all">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex-shrink-0 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                       <item.icon size={24} />
                    </div>
                    <div className="space-y-1">
                       <h4 className="text-sm font-black uppercase tracking-widest text-white">{item.title}</h4>
                       <p className="text-xs font-medium text-aura-muted leading-relaxed">{item.desc}</p>
                    </div>
                 </div>
               ))}
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative"
          >
             {/* Stat Card Overlay - Adjusted for mobile */}
             <div className="absolute -top-6 -right-2 sm:-top-10 sm:-right-10 z-20 bg-[#0A0B0E] border border-primary/30 p-4 sm:p-8 rounded-2xl sm:rounded-[32px] shadow-2xl backdrop-blur-xl animate-bounce-slow">
                <p className="text-2xl sm:text-4xl font-black text-primary italic leading-none">+165%</p>
                <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-white mt-2">Accuracy Matrix Enabled</p>
             </div>

             <div className="aspect-square bg-gradient-to-br from-primary/20 via-transparent to-secondary/20 rounded-[40px] sm:rounded-[64px] border border-white/10 overflow-hidden relative p-6 sm:p-12">
                <div className="absolute inset-0 bg-[#050608]/40 backdrop-blur-sm" />
                <div className="relative z-10 w-full h-full flex flex-col justify-center">
                   <div className="space-y-6 sm:space-y-8">
                      <div className="flex items-center justify-between">
                         <div className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-aura-muted">Neural Syncing...</div>
                         <Bot className="text-primary animate-pulse w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <div className="h-40 sm:h-64 flex items-end gap-1 sm:gap-2 overflow-hidden px-2 sm:px-4">
                         {Array.from({ length: 15 }).map((_, i) => (
                           <motion.div 
                               key={i}
                               initial={{ height: 0 }}
                               animate={{ height: `${Math.random() * 80 + 20}%` }}
                               transition={{ repeat: Infinity, duration: 2, repeatType: 'reverse', delay: i * 0.1 }}
                               className="flex-1 bg-gradient-to-t from-primary/40 to-primary rounded-t-sm sm:rounded-t-md"
                           />
                         ))}
                      </div>
                      <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-4 sm:pt-8">
                         <div className="text-center p-2 sm:p-4 bg-white/5 rounded-xl sm:rounded-2xl">
                            <p className="text-[10px] sm:text-xs font-black text-white">4.2ms</p>
                            <p className="text-[7px] sm:text-[8px] font-black uppercase text-aura-muted tracking-widest">Execution</p>
                         </div>
                         <div className="text-center p-2 sm:p-4 bg-white/5 rounded-xl sm:rounded-2xl border border-primary/20">
                            <p className="text-[10px] sm:text-xs font-black text-primary">Live</p>
                            <p className="text-[7px] sm:text-[8px] font-black uppercase text-aura-muted tracking-widest">Feed Status</p>
                         </div>
                         <div className="text-center p-2 sm:p-4 bg-white/5 rounded-xl sm:rounded-2xl">
                            <p className="text-[10px] sm:text-xs font-black text-white">99.9%</p>
                            <p className="text-[7px] sm:text-[8px] font-black uppercase text-aura-muted tracking-widest">Uptime</p>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          </motion.div>
        </section>

        {/* 3. Trade Execution Section */}
        <section className="mb-40">
           <div className="text-center mb-20 max-w-3xl mx-auto">
              <SectionHeader 
                badge="Seamless Orchestration"
                title="Precision Trade Execution" 
                subtitle="Every trade is executed with millisecond precision through our direct bridge to institutional liquidity providers."
              />
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { icon: Zap, title: "High-Speed Trading", desc: "Capitalizing on micro-trends that human traders simply cannot see." },
                { icon: Navigation, title: "Precision Targeting", desc: "Exact entry and exit points calculated through volumetric data analysis." },
                { icon: PieChart, title: "Portfolio Diversification", desc: "Spreading risk automatically across forex, crypto, and commodity markets." }
              ].map((card, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="group p-10 bg-[#0A0B0E] border border-white/5 rounded-[40px] hover:border-primary/40 transition-all relative overflow-hidden"
                >
                   <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-colors" />
                   <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-primary mb-8 group-hover:scale-110 transition-transform border border-white/5">
                      <card.icon size={32} />
                   </div>
                   <h4 className="text-2xl font-black italic tracking-tight uppercase mb-4">{card.title}</h4>
                   <p className="text-aura-muted text-sm font-medium leading-relaxed">{card.desc}</p>
                </motion.div>
              ))}
           </div>
        </section>

        {/* 4. Professional Oversight Section */}
        <section className="-mx-6 md:mx-0 mb-40 p-6 sm:p-12 lg:p-20 bg-[#0A0B0E] border-y md:border border-white/5 md:rounded-[64px] relative overflow-hidden">
           <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-50" />
           
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center relative z-10">
              <div className="space-y-8">
                 <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-500">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Professional Monitoring Active</span>
                 </div>
                 <h2 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase leading-tight">
                    Human Oversight <br />AI Efficiency
                 </h2>
                 <p className="text-aura-muted text-base md:text-lg font-medium leading-relaxed">
                    While our AI handles the speed, our team of expert financial analysts maintain continuous professional oversight. We ensure the network operates within strict institutional risk parameters at all times.
                 </p>
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <p className="text-3xl font-black text-white italic font-serif leading-none">24/7</p>
                       <p className="text-[10px] font-black uppercase tracking-widest text-aura-muted">System Surveillance</p>
                    </div>
                    <div className="space-y-2">
                       <p className="text-3xl font-black text-white italic font-serif leading-none">0.0%</p>
                       <p className="text-[10px] font-black uppercase tracking-widest text-aura-muted">Unmonitored Trades</p>
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:gap-6">
                 {[
                   { label: "Stability Matrix", value: "Verified", status: "ok" },
                   { label: "Liquidity Bridge", value: "Optimal", status: "ok" },
                   { label: "Risk Threshold", value: "Managed", status: "ok" },
                   { label: "Network Pulse", value: "Active", status: "ok" }
                 ].map((stat, i) => (
                   <div key={i} className="p-4 sm:p-8 bg-white/5 border border-white/10 rounded-2xl sm:rounded-[32px] backdrop-blur-md space-y-2 sm:space-y-4">
                      <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-aura-muted">{stat.label}</p>
                      <div className="flex items-center justify-between">
                         <span className="text-sm sm:text-lg font-black text-white italic font-serif">{stat.value}</span>
                         <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </section>

        {/* 5. ROI & Investment Plans Section */}
        <section className="mb-40">
           <div className="text-center mb-20 max-w-3xl mx-auto">
              <SectionHeader 
                badge="Equity Growth"
                title="Investment Plans" 
                subtitle="Select a strategic tier based on your capital allocation goals. Each plan leverages the full power of CGA Trades."
              />
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {(effectivePlans || []).filter((p: any) => p.active_status !== false).map((plan: any, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={cn(
                    "relative p-10 rounded-[48px] border transition-all group overflow-hidden flex flex-col h-full",
                    !plan.card_border && plan.borderColor,
                    !plan.card_background && plan.bgColor
                  )}
                  style={{
                    backgroundColor: plan.card_background || undefined,
                    borderColor: plan.card_border || undefined,
                    boxShadow: plan.accent_color ? `0 10px 40px -10px ${plan.accent_color}66` : undefined
                  }}
                >
                   <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-white/10 to-transparent opacity-10 blur-2xl" />
                   
                   <div className="mb-8 flex items-center justify-between">
                      <h4 className={cn("text-3xl font-black italic tracking-tighter uppercase font-serif", !plan.accent_color && plan.color)} style={plan.accent_color ? { color: plan.accent_color } : {}}>{plan.name}</h4>
                      <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white border border-white/10">
                         {getPlanIcon(plan.id)}
                      </div>
                   </div>

                   <p className="text-aura-muted text-sm font-medium mb-10 flex-1">{plan.description}</p>

                   <div className="space-y-6 mb-10">
                      <div className="flex items-center justify-between border-b border-white/5 pb-4">
                         <span className="text-[10px] font-black uppercase tracking-widest text-aura-muted">Daily Yield</span>
                         <span className={cn("text-2xl font-black italic font-serif", !plan.accent_color && plan.color)} style={plan.accent_color ? { color: plan.accent_color } : {}}>{((plan.weekday_roi || plan.roi) * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-white/5 pb-4">
                         <span className="text-[10px] font-black uppercase tracking-widest text-aura-muted">Minimum</span>
                         <span className="text-lg font-black text-white italic font-serif">{formatCurrency(plan.min)}</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-white/5 pb-4">
                         <span className="text-[10px] font-black uppercase tracking-widest text-aura-muted">Maximum</span>
                         <span className="text-lg font-black text-white italic font-serif">{formatCurrency(plan.max)}</span>
                      </div>
                   </div>

                   <Link to="/invest" className="w-full py-5 bg-white/5 border border-white/10 rounded-2xl text-center text-[10px] font-black uppercase tracking-[0.3em] hover:bg-white/10 transition-all">
                      Select Plan
                   </Link>
                </motion.div>
              ))}
           </div>
        </section>

        {/* 6. Security & Technology Section */}
        <section className="mb-40 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
           <motion.div 
             initial={{ opacity: 0, x: -30 }}
             whileInView={{ opacity: 1, x: 0 }}
             viewport={{ once: true }}
             className="relative order-2 lg:order-1"
           >
              <div className="aspect-[4/3] bg-[#0A0B0E] border border-white/10 rounded-[64px] overflow-hidden relative group">
                 <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent" />
                 <div className="absolute inset-0 flex flex-col items-center justify-center p-12 space-y-8">
                    <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-primary border border-primary/20">
                       <Shield size={48} className="animate-pulse" />
                    </div>
                    <div className="text-center space-y-2">
                       <h3 className="text-2xl font-black uppercase tracking-tighter italic font-serif">Military-Grade Encryption</h3>
                       <p className="text-[10px] font-black uppercase tracking-widest text-aura-muted">Protocol: CGA_SECURED_ENDPOINT_1024</p>
                    </div>
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                       <motion.div 
                          initial={{ width: 0 }}
                          whileInView={{ width: '100%' }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="h-full bg-primary"
                       />
                    </div>
                 </div>
              </div>
           </motion.div>

           <div className="space-y-12 order-1 lg:order-2">
              <SectionHeader 
                badge="Fortified Infrastructure"
                title="Security & Technology" 
                subtitle="Your assets and data are protected by multiple layers of institutional security protocols."
              />
              <div className="grid grid-cols-1 gap-6">
                 {[
                   { icon: Lock, title: "Data Encryption", desc: "All user data and communications are encrypted with AES-256 bank-level security." },
                   { icon: Shield, title: "2FA Security", desc: "Mandatory multi-factor authentication for all sensitive account operations." },
                   { icon: Navigation, title: "System Redundancy", desc: "Distributed server nodes across multiple continents to ensure 100% operational uptime." }
                 ].map((item, i) => (
                   <div key={i} className="flex items-center gap-6 p-6 bg-[#0A0B0E] border border-white/5 rounded-3xl">
                      <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-primary border border-white/5">
                         <item.icon size={24} />
                      </div>
                      <div className="space-y-1">
                         <h4 className="text-sm font-black uppercase tracking-widest text-white">{item.title}</h4>
                         <p className="text-xs font-medium text-aura-muted leading-relaxed opacity-70">{item.desc}</p>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </section>

        {/* 7. Interactive Reporting Section */}
        <section className="mb-40">
           <div className="p-6 sm:p-12 lg:p-20 bg-gradient-to-b from-[#0A0B0E] to-[#050608] border border-white/5 rounded-[40px] md:rounded-[64px] relative overflow-hidden">
              <div className="text-center mb-16 md:mb-20 max-w-3xl mx-auto">
                 <SectionHeader 
                   badge="Deep Insights"
                   title="Interactive Reporting" 
                   subtitle="Gain complete visibility into your portfolio performance with real-time analytics and predictive insights."
                 />
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                 {[
                   { title: "Live Analytics", value: "Real-time Update", icon: Activity },
                   { title: "Performance Graph", value: "Historical Data", icon: LineChart },
                   { title: "Predictive Insights", value: "AI Forecasts", icon: Bot },
                   { title: "Network Status", value: "Active Synchronization", icon: Globe }
                 ].map((card, i) => (
                   <motion.div
                     key={i}
                     initial={{ opacity: 0, y: 20 }}
                     whileInView={{ opacity: 1, y: 0 }}
                     viewport={{ once: true }}
                     className="p-4 sm:p-8 bg-white/5 border border-white/5 rounded-2xl sm:rounded-[32px] hover:bg-white/10 transition-all text-center space-y-3 sm:space-y-4 backdrop-blur-sm"
                   >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-xl sm:rounded-2xl flex items-center justify-center text-primary mx-auto mb-2">
                         <card.icon size={20} className="sm:w-6 sm:h-6" />
                      </div>
                      <h4 className="text-[10px] sm:text-sm font-black uppercase tracking-widest text-white leading-tight">{card.title}</h4>
                      <p className="text-[7px] sm:text-[10px] font-black uppercase tracking-widest text-aura-muted opacity-60 leading-tight">{card.value}</p>
                   </motion.div>
                 ))}
              </div>
           </div>
        </section>

        {/* 8. Getting Started Timeline */}
        <section className="mb-20">
           <div className="text-center mb-16 md:mb-20 max-w-3xl mx-auto">
              <SectionHeader 
                badge="Onboarding"
                title="Getting Started" 
                subtitle="Join CGA Trades in five simple steps and start leveraging institutional intelligence."
              />
           </div>

           <div className="relative">
              {/* Connection Line */}
              <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/5 -translate-y-1/2 hidden lg:block" />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 sm:gap-8 relative z-10">
                 {[
                   { step: "01", title: "Sign Up", desc: "Create your secure institutional account." },
                   { step: "02", title: "Deposit", desc: "Fund your wallet through bank or crypto." },
                   { step: "03", title: "Choose Plan", desc: "Select a yield tier matching your goal." },
                   { step: "04", title: "AI Trades", desc: "Our neural engine begins market operations." },
                   { step: "05", title: "Withdraw", desc: "Harvest your rewards at your convenience." }
                 ].map((item, i) => (
                   <motion.div
                     key={i}
                     initial={{ opacity: 0, y: 30 }}
                     whileInView={{ opacity: 1, y: 0 }}
                     viewport={{ once: true }}
                     transition={{ delay: i * 0.1 }}
                     className="p-8 md:p-0 bg-white/[0.02] md:bg-transparent border md:border-0 border-white/5 rounded-3xl space-y-6 text-center lg:text-left group hover:bg-white/[0.05] md:hover:bg-transparent transition-colors"
                   >
                      <div className="flex flex-col items-center lg:items-start space-y-6">
                         <div className="w-16 h-16 bg-[#050608] border-2 border-primary/40 rounded-full flex items-center justify-center text-xl font-black text-primary italic font-serif group-hover:bg-primary group-hover:text-white transition-all shadow-[0_0_20px_rgba(var(--primary),0.3)]">
                            {item.step}
                         </div>
                         <div className="space-y-2">
                            <h4 className="text-xl font-black italic tracking-tighter uppercase font-serif text-white">{item.title}</h4>
                            <p className="text-xs font-medium text-aura-muted leading-relaxed opacity-70">{item.desc}</p>
                         </div>
                      </div>
                   </motion.div>
                 ))}
              </div>
           </div>
        </section>

        {/* Final CTA */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="-mx-6 md:mx-0 mt-40 p-10 md:p-20 bg-primary/10 border-y md:border border-primary/20 md:rounded-[64px] text-center relative overflow-hidden group"
        >
           <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-50" />
           <div className="relative z-10 max-w-4xl mx-auto space-y-10">
              <h2 className="text-3xl md:text-7xl font-black italic tracking-tighter uppercase leading-tight">
                 Ready to start with <span className="text-primary italic">CGA Trades</span>?
              </h2>
              <p className="text-base md:text-xl text-aura-muted font-medium mb-12">
                 Join thousands of global investors leveraging high-frequency neural networks for consistent financial growth.
              </p>
              <Link to="/register" className="inline-flex items-center gap-2 px-10 py-5 sm:px-12 sm:py-6 bg-primary text-white rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] shadow-2xl shadow-primary/40 hover:scale-105 active:scale-95 transition-all w-full sm:w-auto justify-center">
                 Initialize Your Node Now <ArrowRight size={18} />
              </Link>
           </div>
        </motion.div>

      </div>
    </div>
  );
};

export default HowItWorks;
