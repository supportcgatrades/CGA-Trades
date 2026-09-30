import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Zap, Award, Globe, Search, Crown, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TOP_INVESTORS, Investor } from '../constants/landingData';
import { cn, formatCurrency, getFlagEmoji } from '../lib/utils';
import Footer from './Footer';

const ALL_AVATARS = [
  'https://api.dicebear.com/7.x/notionists/svg?seed=Jack',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Oliver',
  'https://api.dicebear.com/7.x/notionists/svg?seed=James',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Leo',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Ryan',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Alex',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Ben',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Chris',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Eric',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Dan',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Sarah',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Lily',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Ada',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Eva',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Mia',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Chloe',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Zoe',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Ruby',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Ivy',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Maya',
];

const getAvatarForUser = (investor: Investor) => {
  const key = investor.id || investor.name || '';
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = key.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % ALL_AVATARS.length;
  return ALL_AVATARS[index];
};

const InvestorPodium: React.FC<{ investor: Investor, rank: number }> = ({ investor, rank }) => {
  const isFirst = rank === 1;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.1 }}
      className={cn(
        "flex flex-col items-center relative transition-all duration-700",
        isFirst ? "z-30 translate-y-[-0.25rem] scale-105 md:translate-y-[-1rem]" : "z-20 scale-90"
      )}
    >
      <div className="relative group">
        {isFirst && (
          <div className="absolute -top-10 md:top-[-4rem] left-1/2 -translate-x-1/2 text-primary animate-[pulse_3s_ease-in-out_infinite]">
            <Crown size={32} className="md:w-11 md:h-11 drop-shadow-[0_0_20px_rgba(var(--primary),0.8)] filter brightness-125" />
          </div>
        )}
        
        <div className={cn(
          "relative p-1 rounded-full bg-gradient-to-b transition-all duration-500",
          isFirst ? "from-primary via-primary/50 to-transparent p-[2px]" : "from-white/20 to-transparent p-[1px]"
        )}>
          <div className={cn(
            "w-20 h-20 md:w-32 md:h-32 rounded-full flex items-center justify-center relative overflow-hidden transition-all duration-700 group-hover:rotate-3",
            "bg-[#0a0c10] border border-white/5 shadow-2xl"
          )}>
            <img 
              src={getAvatarForUser(investor)} 
              alt={investor.name} 
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500" 
            />
            
            {/* Rank Badge */}
            <div className={cn(
              "absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-black text-xs md:text-base text-black shadow-2xl z-10",
              isFirst ? "bg-primary" : (rank === 2 ? "bg-slate-300" : "bg-orange-400")
            )}>
              {rank}
            </div>
          </div>

          {/* Glow backdrop for #1 */}
          {isFirst && (
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full -z-10 group-hover:bg-primary/30 transition-all duration-700" />
          )}
        </div>
      </div>

      <div className="mt-5 md:mt-10 text-center px-1">
        <h4 className={cn(
          "text-[9px] md:text-2xl font-black uppercase tracking-tight leading-tight flex items-center justify-center gap-1",
          isFirst ? "text-primary text-[10px] md:text-2xl" : "text-white/80"
        )}>
          <span className="text-xs md:text-2xl">{getFlagEmoji(investor.countryCode)}</span>
          <span>{investor.name}</span>
        </h4>
        <div className="mt-1 md:mt-3 flex flex-col items-center">
          <p className={cn(
            "text-[10px] md:text-2xl font-black italic font-serif tracking-tight text-emerald-400"
          )}>
            {formatCurrency(investor.amount)}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

const ExtendedLeaderboardRow: React.FC<{ investor: Investor }> = ({ investor }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group relative"
    >
      <div className="relative flex items-center justify-between p-4 bg-[#0a0c10]/40 border border-white/5 rounded-2xl md:rounded-3xl transition-all duration-500 group-hover:border-primary/40 shadow-2xl overflow-hidden gap-4 backdrop-blur-2xl group-hover:bg-[#0c0e14]/80">
        
        {/* Glow Effect */}
        <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/[0.03] transition-colors duration-500 pointer-events-none" />
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-0 group-hover:h-3/4 bg-primary transition-all duration-500 rounded-full" />

        {/* Left Side: Identity */}
        <div className="flex items-center gap-3 md:gap-6 min-w-0 flex-1 relative z-10">
          {/* Avatar + Rank Badge */}
          <div className="relative shrink-0">
            <div className="w-12 h-12 md:w-20 md:h-20 bg-white/5 rounded-2xl md:rounded-3xl overflow-hidden flex items-center justify-center border border-white/10 group-hover:border-primary/30 transition-all duration-500 shadow-xl group-hover:scale-105">
              <img 
                src={getAvatarForUser(investor)} 
                alt={investor.name} 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500" 
              />
            </div>
            {/* Overlapping Rank Badge */}
            <div className="absolute -top-1.5 -left-1.5 w-6 h-6 md:w-9 md:h-9 bg-[#050608] border border-primary/40 rounded-lg flex items-center justify-center font-black text-[9px] md:text-sm text-primary shadow-[0_4px_10px_rgba(0,0,0,0.5)] z-20">
              #{investor.rank}
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 md:mb-2">
              <h4 className="text-xs md:text-2xl font-black text-white/90 uppercase tracking-tighter leading-none group-hover:text-white transition-colors truncate">
                {investor.name}
              </h4>
            </div>
            <div className="flex items-center gap-1.5 md:gap-3">
              <span className="text-[10px] md:text-lg leading-none">
                {getFlagEmoji(investor.countryCode)}
              </span>
              <p className="text-[7px] md:text-xs font-bold text-white/30 uppercase tracking-[0.2em] truncate">
                {investor.countryName}
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Financial Data */}
        <div className="flex flex-col items-end gap-1.5 md:gap-3 text-right relative z-10 shrink-0">
          <div className="flex items-center gap-1 md:gap-2 px-2 py-0.5 md:px-3 md:py-1 rounded-full bg-emerald-500/5 border border-emerald-500/10">
            <div className="w-1 md:w-1.5 h-1 md:h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
            <span className="text-[6px] md:text-[10px] font-black text-emerald-400 uppercase tracking-[0.1em]">
              Verified
            </span>
          </div>
          
          <div className="flex flex-col items-end">
            <span className="text-[10px] md:text-xl font-black text-primary italic font-serif leading-none tracking-tighter group-hover:scale-105 transition-transform origin-right">
              +{formatCurrency(investor.dailyRoi)}
            </span>
            <span className="text-[8px] md:text-sm font-bold text-emerald-400/60 uppercase tracking-tighter mt-0.5 md:mt-2 leading-none whitespace-nowrap">
              {formatCurrency(investor.amount)}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function TopInvestorsPage() {
  const navigate = useNavigate();
  const top1 = TOP_INVESTORS.find(i => i.rank === 1)!;
  const top2 = TOP_INVESTORS.find(i => i.rank === 2)!;
  const top3 = TOP_INVESTORS.find(i => i.rank === 3)!;
  const others = TOP_INVESTORS.filter(i => i.rank > 3);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#050608] text-white selection:bg-primary selection:text-white pb-0">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-30">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[130px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-secondary/5 blur-[160px] rounded-full" />
      </div>

      <nav className="fixed top-0 inset-x-0 h-20 md:h-24 z-50 flex items-center justify-between px-6 md:px-12 backdrop-blur-md border-b border-primary/20">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-aura-muted hover:text-white transition-all group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back Home
        </button>
        <div className="flex items-center gap-3">
          <img src="https://i.imgur.com/nRbbYnS.png" alt="CGA Logo" className="w-8 h-8 md:w-10 md:h-10 object-contain" />
          <span className="text-lg md:text-xl font-black uppercase tracking-tighter hidden md:inline leading-none">CGA</span>
        </div>
        <div className="w-10" /> {/* Spacer */}
      </nav>

      <main className="relative z-10 pt-32 pb-24 px-1 md:px-8 max-w-5xl mx-auto">
        <div className="mb-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="inline-block py-1.5 px-4 rounded-full bg-white/5 border border-white/10 mb-6 backdrop-blur-sm shadow-xl">
              <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-aura-lime uppercase tracking-widest">Archive v.2030</span>
            </div>
            <h1 className="text-4xl md:text-7xl font-black uppercase tracking-tighter text-white leading-none mb-6">
              CGA <span className="text-primary italic font-serif">Leaderboard</span>
            </h1>
            <p className="max-w-xl mx-auto text-aura-muted text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] leading-relaxed opacity-40">
              The definitive record of institutional excellence. decentralized, and immutable node orchestration leaders.
            </p>
          </motion.div>
        </div>

        {/* Top 3 Podium on Page */}
        <div className="relative max-w-4xl mx-auto mb-20 p-2 md:p-16 rounded-[2.5rem] md:rounded-[3.5rem] overflow-hidden border border-white/5 shadow-2xl group/podium">
          {/* Custom Premium Background */}
          <div className="absolute inset-0 bg-[#080a0e]/90 backdrop-blur-md" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(var(--primary-rgb),0.2),transparent_70%)]" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.015] mix-blend-overlay" />
          
          {/* Dynamic Glows */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-primary/5 blur-[100px] animate-pulse rounded-full" />
          
          <div className="relative z-10 grid grid-cols-3 gap-1 md:gap-16 items-end pt-14 md:pt-16">
            <InvestorPodium investor={top2} rank={2} />
            <InvestorPodium investor={top1} rank={1} />
            <InvestorPodium investor={top3} rank={3} />
          </div>
        </div>

        {/* Search Bar */}
        <div className="max-w-md mx-auto mb-16 relative group">
          <div className="absolute inset-y-0 left-5 flex items-center text-white/20 group-focus-within:text-primary transition-colors">
            <Search size={18} />
          </div>
          <input 
            type="text" 
            placeholder="Query Node Name..." 
            className="w-full bg-white/[0.02] border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-xs font-mono tracking-widest outline-none focus:border-primary/30 focus:bg-white/[0.05] transition-all text-white placeholder:text-white/10 shadow-2xl"
          />
        </div>

        <div className="space-y-4">
          {others.map((investor) => (
            <ExtendedLeaderboardRow key={investor.id} investor={investor} />
          ))}
        </div>

        {/* Bottom Call to Action */}
        <div className="mt-24 p-8 md:p-16 bg-gradient-to-br from-primary/10 to-transparent rounded-[2.5rem] border border-white/5 text-center space-y-6 relative overflow-hidden">
          <h2 className="text-2xl md:text-5xl font-black uppercase tracking-tighter text-white">
            Ready to <span className="text-primary italic font-serif">Ascend</span>?
          </h2>
          <p className="text-aura-muted text-[10px] md:text-sm uppercase font-bold tracking-[0.1em] max-w-sm mx-auto opacity-50">
            Activate your node and start climbing the global leaderboard.
          </p>
          <button 
            onClick={() => navigate('/welcome')}
            className="px-10 py-5 bg-white text-black font-black uppercase tracking-[0.3em] text-[10px] rounded-xl hover:bg-aura-lime transition-all hover:scale-105"
          >
            Initialize Node
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
