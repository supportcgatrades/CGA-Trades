import React from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Target, 
  Shield, 
  TrendingUp, 
  Globe, 
  Zap,
  CheckCircle2,
  Lock,
  Eye,
  Award,
  ArrowLeft
} from 'lucide-react';
import { cn } from '../lib/utils';
import aboutHeaderBg from '../assets/images/about_header_bg_1783957706304.jpg';
import { useLanguage } from '../contexts/LanguageContext';

const SectionHeader = ({ title, subtitle, icon: Icon, color = "primary" }: { title: string; subtitle?: string; icon: any; color?: string }) => {
  const { t } = useLanguage();
  return (
    <div className="space-y-4 mb-12">
      <div className={cn(
        "inline-flex items-center gap-2 px-4 py-2 rounded-full border",
        color === "primary" ? "bg-primary/10 border-primary/20 text-primary" : "bg-secondary/10 border-secondary/20 text-secondary"
      )}>
        <Icon size={14} />
        <span className="text-[10px] font-black uppercase tracking-[0.2em]">{t(title)}</span>
      </div>
      {subtitle && (
        <h2 className="text-3xl md:text-4xl font-black italic tracking-tighter uppercase leading-tight">
          {t(subtitle)}
        </h2>
      )}
    </div>
  );
};

const About = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { scrollY } = useScroll();

  const scale = useTransform(scrollY, [0, 400], [1, 1.15]);
  const yOffset = useTransform(scrollY, [0, 400], [0, 50]);
  const opacity = useTransform(scrollY, [0, 400], [1, 0.5]);
  const textY = useTransform(scrollY, [0, 400], [0, -15]);

  return (
    <div className="min-h-screen bg-[#050608] text-white relative overflow-hidden">
      {/* Edge-to-Edge Premium Header Banner with Image Background & Parallax Zoom */}
      <div className="w-full h-[180px] sm:h-[220px] md:h-[260px] mb-16 relative overflow-hidden bg-[#050608] border-b border-white/5">
        <motion.div 
          style={{ scale, y: yOffset, opacity }}
          className="absolute inset-0 w-full h-full"
        >
          <img 
            src={aboutHeaderBg} 
            alt="About Us Header" 
            className="w-full h-full object-cover select-none brightness-[0.7] contrast-[1.05]"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050608] via-transparent to-black/30" />
        </motion.div>
        
        {/* Content Overlaid */}
        <div className="absolute inset-0 flex flex-col justify-center items-center z-20">
          <motion.div 
            style={{ y: textY }}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center px-4"
          >
            <h1 className="hero-banner-title about-header-title text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-[0.2em] text-white font-sans filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
              {t("About Us")}
            </h1>
            <div className="mt-2.5 w-12 h-[3px] bg-[#009e42] mx-auto rounded-full shadow-[0_0_12px_#009e42]" />
          </motion.div>
        </div>
      </div>

      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-[150px] translate-y-1/2 -translate-x-1/2" />

      <div className="px-6 pb-20 max-w-6xl mx-auto relative z-10">
        {/* Hero Section */}
        <div className="text-center space-y-8 mb-32">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-full backdrop-blur-sm"
          >
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-black uppercase tracking-[0.3em]">CGA Trades</span>
          </motion.div>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-aura-muted text-lg md:text-xl max-w-3xl mx-auto font-medium leading-relaxed"
          >
            {t("CGA Trades is a modern digital investment and asset management platform founded by Anthony Willis, created to provide individuals with access to professionally managed financial opportunities across global markets.")}
          </motion.p>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-aura-muted text-sm md:text-base max-w-2xl mx-auto font-medium leading-relaxed opacity-80"
          >
            {t("Built with a vision of combining innovation, accessibility, and institutional-grade financial management, CGA Trades empowers users to participate confidently in modern investment ecosystems through secure and structured investment solutions.")}
          </motion.p>
        </div>

        {/* Vision Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-20 mb-32 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <SectionHeader 
              title="Founder & Vision" 
              subtitle="Anthony Willis" 
              icon={Users}
            />
            <div className="space-y-6 text-aura-muted font-medium leading-relaxed">
              <p>
                {t("Anthony Willis founded CGA Trades with a clear and ambitious vision:")} 
                <span className="block text-white text-xl font-bold italic mt-4 mb-4">
                  {t('"To simplify investing while maintaining the professional standards typically reserved for institutional investors."')}
                </span>
                {t("With a deep interest in global financial markets and emerging digital assets, Anthony recognized early the growing demand for a platform capable of combining strategic trading, technology, and accessibility for everyday investors.")}
              </p>
              <p>
                {t("His goal was to build a financial ecosystem where users could participate in professionally managed investment opportunities without requiring advanced trading knowledge or institutional capital.")}
              </p>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="aspect-square bg-gradient-to-br from-primary/20 to-secondary/20 rounded-[64px] border border-white/5 overflow-hidden flex items-center justify-center group">
              <Award size={120} className="text-white/20 group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#050608_70%)]" />
            </div>
            {/* Stats Overlay */}
            <div className="absolute -bottom-10 -right-10 bg-[#0A0B0E] border border-white/5 p-8 rounded-[32px] shadow-2xl backdrop-blur-xl">
               <p className="text-3xl font-black text-primary italic leading-none">24/7</p>
               <p className="text-[10px] font-black uppercase tracking-widest text-aura-muted mt-2">{t("Active Monitoring")}</p>
            </div>
          </motion.div>
        </div>

        {/* The Early Foundation */}
        <div className="mb-32 p-12 bg-white/5 border border-white/5 rounded-[48px] relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-12 text-primary/5 -translate-y-4 translate-x-4">
             <TrendingUp size={160} />
           </div>
           <div className="relative z-10 max-w-3xl space-y-8">
              <SectionHeader title="History" subtitle="The Early Foundation" icon={TrendingUp} />
              <div className="space-y-6 text-aura-muted font-medium leading-relaxed">
                <p>
                  {t("The foundation of CGA Trades was heavily influenced by the transformation of global financial markets, especially the rise of digital assets alongside traditional instruments such as forex and commodities.")}
                </p>
                <p>
                  {t("This strategic positioning enabled the platform to adopt a hybrid investment structure capable of leveraging both established and emerging financial opportunities across multiple sectors.")}
                </p>
                <p>
                  {t("As financial technology evolved, CGA Trades continued refining its systems to align with modern market dynamics while maintaining stability, transparency, and long-term sustainability.")}
                </p>
              </div>
           </div>
        </div>

        {/* Philosophy Cards */}
        <div className="mb-32">
          <div className="text-center mb-16">
            <h3 className="text-xs font-black uppercase tracking-[0.4em] text-aura-muted mb-4">{t("Our Investment Philosophy")}</h3>
            <div className="flex items-center justify-center gap-4 text-2xl md:text-4xl font-black italic uppercase tracking-tighter">
              <span>{t("You Invest")}</span>
              <span className="text-primary">•</span>
              <span>{t("We Manage")}</span>
              <span className="text-primary">•</span>
              <span>{t("You Earn")}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { icon: Shield, title: "Sustainable performance", desc: "Long-term growth focus" },
              { icon: Zap, title: "Strategic diversification", desc: "Multi-market presence" },
              { icon: Eye, title: "Long-term value creation", desc: "Wealth accumulation" },
              { icon: Target, title: "Responsible capital management", desc: "Risk control first" }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 bg-white/5 border border-white/5 rounded-[32px] hover:bg-white/10 transition-all duration-300"
              >
                <item.icon className="text-primary mb-6" size={32} />
                <h4 className="text-sm font-black uppercase tracking-widest text-white mb-2">{t(item.title)}</h4>
                <p className="text-xs font-bold text-aura-muted uppercase tracking-widest opacity-60">{t(item.desc)}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Markets We Operate In */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-32">
           <div className="p-12 bg-[#0A0B0E] border border-white/5 rounded-[48px] space-y-8">
              <SectionHeader title="Markets" subtitle="Markets We Operate In" icon={Globe} />
              <p className="text-aura-muted font-medium leading-relaxed">
                {t("CGA Trades maintains a diversified investment approach across several global financial sectors, including Foreign Exchange (Forex), Cryptocurrencies, Commodities, and Global Financial Instruments.")}
              </p>
              <div className="grid grid-cols-2 gap-4">
                {['Forex', 'Crypto', 'Commodities', 'Global Stocks'].map((tag) => (
                  <div key={tag} className="flex items-center gap-3 px-6 py-4 bg-white/5 rounded-2xl border border-white/5 font-bold text-sm tracking-tight">
                    <CheckCircle2 size={16} className="text-primary" />
                    {t(tag)}
                  </div>
                ))}
              </div>
           </div>

           <div className="p-12 bg-primary/5 border border-primary/20 rounded-[48px] space-y-8">
              <SectionHeader title="Security" subtitle="Security & Transparency" icon={Lock} />
              <p className="text-aura-muted font-medium leading-relaxed">
                {t("Security and transparency remain fundamental pillars. Our infrastructure integrates secure authentication, encrypted data, and real-time dashboard monitoring.")}
              </p>
              <ul className="space-y-4">
                {[
                  "Secure authentication systems",
                  "Encrypted data processing",
                  "Real-time dashboard monitoring",
                  "Transparent investment tracking",
                  "Secure wallet management protocols"
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm font-black uppercase tracking-widest italic">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {t(item)}
                  </li>
                ))}
              </ul>
           </div>
        </div>

        {/* Experience & Strategic Execution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-32">
           <div className="space-y-12">
              <SectionHeader title="Execution" subtitle="Experience & Strategic Execution" icon={Zap} />
              <div className="space-y-6 text-aura-muted font-medium leading-relaxed">
                <p>{t("Our team combines years of market experience across trading, analytics, and financial operations. We focus heavily on strategic trade execution and risk-controlled investment systems.")}</p>
                <div className="grid grid-cols-1 gap-4">
                  {[
                    "Strategic trade execution",
                    "Risk-controlled investment systems",
                    "Continuous market monitoring",
                    "Adaptive financial strategies",
                    "Portfolio optimization techniques"
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-4 group">
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <CheckCircle2 size={14} className="text-primary" />
                      </div>
                      <span className="text-sm font-bold uppercase tracking-widest">{t(item)}</span>
                    </div>
                  ))}
                </div>
              </div>
           </div>
           
           <div className="p-12 bg-white/5 border border-white/5 rounded-[48px] flex flex-col justify-center text-center space-y-6">
              <div className="w-20 h-20 bg-secondary/10 rounded-full flex items-center justify-center mx-auto border border-secondary/20">
                <Globe size={32} className="text-secondary" />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tighter">{t("Growing Global Community")}</h3>
              <p className="text-aura-muted font-medium leading-relaxed">
                {t("CGA Trades continues expanding its presence across a growing international user base. Our commitment to transparency, operational reliability, and user satisfaction has positioned CGA Trades as a trusted platform.")}
              </p>
           </div>
        </div>

        {/* Innovation & Future Growth */}
        <div className="mb-32 p-12 border border-white/10 rounded-[64px] bg-gradient-to-br from-[#0A0B0E] via-[#050608] to-[#0A0B0E]">
            <div className="max-w-3xl mx-auto text-center space-y-12">
               <SectionHeader title="Future" subtitle="Innovation & Future Growth" icon={Zap} color="secondary" />
               <p className="text-lg text-aura-muted font-medium leading-relaxed">
                 {t("Under the leadership of Anthony Willis, CGA Trades remains focused on financial innovation, technological advancement, and strategic adaptability. As global financial markets continue evolving, we remain committed to integrating emerging technologies and refining operational strategies.")}
               </p>
            </div>
        </div>

        {/* Mission Bottom */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center space-y-8 bg-gradient-to-t from-primary/20 to-transparent p-16 rounded-[64px] border-t border-primary/20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary">
            <Target size={14} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{t("Our Mission")}</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black italic tracking-tighter uppercase leading-tight max-w-3xl mx-auto">
            {t("To provide a secure, transparent, and efficient pathway for financial growth in today’s evolving global economy.")}
          </h2>
          <p className="text-aura-muted font-medium max-w-2xl mx-auto">
            {t("CGA Trades is committed to helping individuals access modern financial opportunities through professionally managed investment systems built on trust, security, and long-term sustainability.")}
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default About;
