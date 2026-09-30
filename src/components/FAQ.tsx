import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Minus, 
  Search, 
  HelpCircle, 
  ShieldCheck, 
  Zap, 
  Wallet, 
  ArrowRight, 
  MessageSquare, 
  Globe, 
  Scale, 
  BarChart3,
  Mail,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';
import { cn } from '../lib/utils';
import faqHeader from '../assets/images/faq_header_1783943690663.jpg';
import { useLanguage } from '../contexts/LanguageContext';

interface FAQItem {
  id: string;
  question: string;
  answer: React.ReactNode;
  icon: any;
}

const faqs: FAQItem[] = [
  {
    id: 'how-it-works',
    question: 'How does CGA work?',
    icon: Zap,
    answer: (
      <p>
        CGA is a professional managed assets management/trading platform powered by AI. Our expert systems and trading teams leverage advanced quantitative strategies across Forex, cryptocurrency markets, and commodities. By pooling investor capital, we execute high-volume institutional-grade trades and distribute returns to investors according to their selected investment tier.
      </p>
    )
  },
  {
    id: 'investment-plans',
    question: 'What are the available investment plans?',
    icon: BarChart3,
    answer: (
      <div className="space-y-4">
        <p>We offer three specialized investment tiers designed for different financial goals and investment capacities:</p>
        <ul className="space-y-2">
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span className="font-bold">Regular Plan</span> — Entry-level tier for new and growing investors
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span className="font-bold">Premium Plan</span> — Mid-level plan designed for accelerated wealth accumulation
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span className="font-bold">Elite Plan</span> — Institutional-grade tier tailored for high-net-worth investors
          </li>
        </ul>
        <p>Each plan includes unique investment thresholds, ROI structures, and strategic benefits.</p>
      </div>
    )
  },
  {
    id: 'deposit-process',
    question: 'How do I deposit funds and begin investing?',
    icon: Wallet,
    answer: (
      <p>
        Deposits can be initiated securely through your dashboard using our supported payment methods. After funding your account, you must manually navigate to the <span className="text-primary font-bold">Investments</span> section and activate your preferred investment plan. Returns are generated only from active investment deployments.
      </p>
    )
  },
  {
    id: 'withdrawal-process',
    question: 'What is the withdrawal process?',
    icon: ArrowRight,
    answer: (
      <p>
        Withdrawals are streamlined for speed and efficiency. Each investment tier features a minimum withdrawal threshold and a specific processing timeframe. Once your <span className="font-bold">Withdrawable Profit</span> balance reaches the required threshold, you can request a transfer directly to your registered wallet or bank account.
      </p>
    )
  },
  {
    id: 'security',
    question: 'Is my investment secure with CGA?',
    icon: ShieldCheck,
    answer: (
      <div className="space-y-4">
        <p>Security remains a core foundation of CGA Trades. We implement:</p>
        <ul className="space-y-2">
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
            <span>Multi-signature cold storage systems for digital assets</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
            <span>Bank-grade SSL encryption for all transactions and communications</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
            <span>Advanced risk management frameworks</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
            <span>Internal reserve protocols designed to mitigate market volatility exposure</span>
          </li>
        </ul>
        <p>Our infrastructure is built to maintain institutional-grade protection standards.</p>
      </div>
    )
  },
  {
    id: 'multiple-plans',
    question: 'Can I maintain multiple active investment plans simultaneously?',
    icon: HelpCircle,
    answer: (
      <p>
        Yes. Investors are encouraged to diversify their portfolio allocations by operating multiple investment plans simultaneously. You may run any combination of Regular Plans, Premium Plans, and Elite Plans under a single verified account.
      </p>
    )
  },
  {
    id: 'deposit-timeframe',
    question: 'How long does it take for my deposit to reflect?',
    icon: Globe,
    answer: (
      <p>
        Digital asset deposits are typically confirmed within <span className="font-black text-primary italic">10–30 minutes</span>, depending on blockchain network congestion. Traditional bank transfers may require additional processing time based on banking schedules and verification windows. Your dashboard updates automatically once your transaction is verified successfully.
      </p>
    )
  },
  {
    id: 'forgot-to-activate',
    question: 'What happens if I forget to activate my investment after depositing?',
    icon: MessageSquare,
    answer: (
      <p>
        Funds deposited but not assigned to an active investment plan remain safely stored inside your <span className="font-bold">Wallet Balance</span>. However, ROI generation does not begin until funds are committed to an active investment cycle.
      </p>
    )
  },
  {
    id: 'contact-support',
    question: 'How do I contact professional support?',
    icon: Mail,
    answer: (
      <div className="space-y-4">
        <p>Our support infrastructure operates <span className="text-secondary font-black italic">24/7</span>. You can reach our dedicated support team through:</p>
        <ul className="space-y-2">
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
            <span>The in-app <span className="font-bold">Support Portal</span></span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
            <span>The dashboard support section</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
            <span>Direct email assistance</span>
          </li>
        </ul>
        <p>
          For priority technical assistance, contact:{' '}
          <a href="mailto:capitalgrowthalliance@support.com" className="text-primary font-black italic underline hover:text-primary/80 transition-colors">
            capitalgrowthalliance@support.com
          </a>
        </p>
      </div>
    )
  },
  {
    id: 'regulation',
    question: 'Is CGA Trades regulated in my country?',
    icon: Scale,
    answer: (
      <p>
        Yes, CGA Trades operates in compliance with applicable regulatory requirements and is duly registered with the USA, Canada, United Kingdom, Australia, United Arab Emirates, Spain, Kuwait regulatory authorities, alongside adherence to relevant industry standards and operational compliance frameworks.
      </p>
    )
  }
];

const FAQAccordion = ({ item, isOpen, onClick }: { item: FAQItem; isOpen: boolean; onClick: () => void }) => {
  const Icon = item.icon;
  const { t } = useLanguage();

  return (
    <div 
      className={cn(
        "group relative border border-white/5 bg-[#0A0B0E] rounded-[32px] overflow-hidden transition-all duration-500",
        isOpen ? "shadow-[0_20px_50px_rgba(139,92,246,0.1)] border-primary/20" : "hover:border-white/10"
      )}
    >
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between p-8 text-left"
      >
        <div className="flex items-center gap-6">
          <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500",
            isOpen ? "bg-primary text-white rotate-12 scale-110 shadow-lg shadow-primary/20" : "bg-white/5 text-aura-muted group-hover:bg-white/10 group-hover:text-white"
          )}>
            <Icon size={20} />
          </div>
          <span className={cn(
            "text-lg font-bold tracking-tight transition-colors duration-300",
            isOpen ? "text-white" : "text-white/70 group-hover:text-white"
          )}>
            {t(item.question)}
          </span>
        </div>
        <div className={cn(
          "w-8 h-8 rounded-full border border-white/10 flex items-center justify-center transition-all duration-500",
          isOpen ? "bg-white text-black rotate-180 border-white" : "text-white/30"
        )}>
          {isOpen ? <Minus size={14} /> : <Plus size={14} />}
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          >
            <div className="pl-8 md:pl-[104px] pr-8 md:pr-16 pb-10 text-aura-muted text-sm md:text-base leading-relaxed font-medium">
              {item.answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FAQ = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { t } = useLanguage();

  const filteredFaqs = useMemo(() => {
    return faqs.filter(faq => 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (typeof faq.answer === 'string' && faq.answer.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-[#050608] text-white relative overflow-hidden">
      {/* Edge-to-Edge Super Slim Premium Header Banner with Image Background */}
      <div className="w-full h-[100px] sm:h-[130px] md:h-[160px] mb-10 relative overflow-hidden bg-[#050608] border-b border-white/10 shadow-sm select-none">
        <img 
          src={faqHeader} 
          alt="FAQ Header" 
          className="w-full h-full object-cover object-center block select-none brightness-[0.95] contrast-[1.05]"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050608]/40 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-[150px] translate-y-1/2 -translate-x-1/2" />

      <div className="px-6 pb-20 w-full max-w-7xl mx-auto relative z-10 md:px-10">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8 flex justify-start"
        >
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-slate-400 hover:text-[#009e42] font-semibold text-xs tracking-wider uppercase transition-colors cursor-pointer group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Back to previous page
          </button>
        </motion.div>

        {/* Search Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative max-w-3xl mx-auto mb-20"
        >
          <div className="absolute inset-y-0 left-6 flex items-center text-aura-muted">
            <Search size={22} />
          </div>
          <input 
            type="text"
            placeholder="Search FAQs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0A0B0E] border border-white/5 rounded-[32px] py-7 pl-16 pr-8 text-white text-lg focus:border-primary/50 outline-none transition-all duration-300 placeholder:text-white/20 font-medium shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
          />
        </motion.div>

        {/* FAQ Grid */}
        <div className="flex flex-col gap-5">
          <AnimatePresence mode="popLayout">
            {filteredFaqs.map((faq, index) => (
              <motion.div
                key={faq.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="w-full"
              >
                <FAQAccordion 
                  item={faq} 
                  isOpen={openId === faq.id}
                  onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
          
          {filteredFaqs.length === 0 && (
            <div className="text-center py-20">
              <p className="text-aura-muted font-black uppercase tracking-widest text-xs">No matching questions found</p>
            </div>
          )}
        </div>

        {/* Support Section */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-24 p-8 sm:p-12 bg-[#090a0d] border border-white/10 rounded-2xl text-center space-y-6 relative overflow-hidden group shadow-2xl"
        >
          <div className="absolute top-0 right-0 p-8 text-white/[0.02] -translate-y-4 translate-x-4 group-hover:scale-105 transition-transform duration-700 pointer-events-none">
            <MessageSquare size={140} />
          </div>
          
          <div className="space-y-3 relative z-10">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Additional Information</h2>
            <p className="text-slate-400 text-xs sm:text-sm font-medium max-w-xl mx-auto leading-relaxed">
              If you require further assistance regarding investments, withdrawals, security, account verification, or technical support, please contact our support team through the official support channels.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4 relative z-10 pt-2">
            <button 
              onClick={() => navigate('/help')}
              className="flex items-center gap-2.5 px-6 py-3 bg-[#009e42] hover:bg-[#02d147] text-white font-semibold text-xs rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg cursor-pointer"
            >
              <Mail size={14} />
              Contact
            </button>
            <div className="flex items-center gap-2.5 px-6 py-3 bg-white/[0.03] border border-white/10 text-slate-300 font-medium text-xs rounded-xl">
              <Globe size={14} className="text-[#009e42]" />
              24/7 Support Active
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default FAQ;
