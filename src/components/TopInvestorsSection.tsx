import React from 'react';
import { motion } from 'motion/react';
import { Trophy, Crown, ArrowUpRight, Globe, Zap } from 'lucide-react';
import { TOP_INVESTORS, Investor } from '../constants/landingData';
import { cn, formatCurrency, getFlagEmoji } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

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

const InvestorPodium = React.memo(({ investor, rank }: { investor: Investor, rank: number }) => {
  const isFirst = rank === 1;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "100px" }}
      transition={{ delay: rank * 0.1 }}
      style={{ willChange: 'transform, opacity' }}
      className={cn(
        "flex flex-col items-center relative transition-all duration-700",
        isFirst ? "z-30 translate-y-[-0.25rem] scale-105 md:translate-y-[-1rem]" : "z-20 scale-90"
      )}
    >
      <div className="relative group">
        {isFirst && (
          <div className="absolute -top-10 md:top-[-3.5rem] left-1/2 -translate-x-1/2 text-primary animate-[pulse_3s_ease-in-out_infinite]">
            <Crown size={32} className="md:w-10 md:h-10 drop-shadow-[0_0_20px_rgba(var(--primary),0.8)] filter brightness-125" />
          </div>
        )}
        
        <div className={cn(
          "relative p-1 rounded-full bg-gradient-to-b transition-all duration-500",
          isFirst ? "from-primary via-primary/50 to-transparent p-[2px]" : "from-white/20 to-transparent p-[1px]"
        )}>
          <div className={cn(
            "w-20 h-20 md:w-28 md:h-28 rounded-full flex items-center justify-center relative overflow-hidden transition-all duration-700 group-hover:rotate-3",
            "bg-[#0a0c10] border border-white/5"
          )}>
            <img 
              src={getAvatarForUser(investor)} 
              alt={investor.name} 
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500" 
            />
            
            {/* Rank Badge */}
            <div className={cn(
              "absolute -bottom-1 left-1/2 -translate-x-1/2 w-7 h-7 md:w-9 md:h-9 rounded-full flex items-center justify-center font-black text-[10px] md:text-sm text-black shadow-2xl z-10",
              isFirst ? "bg-primary" : (rank === 2 ? "bg-slate-300" : "bg-orange-400")
            )}>
              {rank}
            </div>
          </div>

          {/* Glow backdrop for #1 */}
          {isFirst && (
            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full -z-10 group-hover:bg-primary/30 transition-all duration-700" />
          )}
        </div>
      </div>

      <div className="mt-5 md:mt-8 text-center px-1">
        <h4 className={cn(
          "text-[9px] md:text-sm font-black uppercase tracking-[0.1em] leading-tight flex items-center justify-center gap-1",
          isFirst ? "text-primary text-[11px] md:text-lg" : "text-white/80"
        )}>
          <span className="text-xs md:text-xl">{getFlagEmoji(investor.countryCode)}</span>
          <span>{investor.name}</span>
        </h4>
        <div className="mt-1 flex flex-col items-center">
          <p className={cn(
            "text-[10px] md:text-lg font-black italic font-serif tracking-tight text-emerald-400"
          )}>
            {formatCurrency(investor.amount)}
          </p>
        </div>
      </div>
    </motion.div>
  );
});

const LeaderboardRow = React.memo(({ investor }: { investor: Investor }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "50px" }}
      style={{ willChange: 'transform, opacity' }}
      className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4 bg-[#0a0c10]/60 backdrop-blur-xl border border-white/5 rounded-2xl md:rounded-3xl hover:bg-[#0c0e14]/80 hover:border-primary/30 transition-all group relative overflow-hidden shadow-xl"
    >
      {/* Premium Border Glow */}
      <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/[0.02] transition-colors" />
      <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-primary/0 group-hover:bg-primary transition-all duration-500" />
      
      <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0 relative z-10">
        {/* Avatar + Rank Badge (Compact/Overlapping) */}
        <div className="relative shrink-0">
          <div className="w-10 h-10 md:w-14 md:h-14 bg-white/5 rounded-xl md:rounded-2xl overflow-hidden flex items-center justify-center border border-white/10 group-hover:border-primary/20 transition-all duration-500 shadow-xl group-hover:scale-105">
            <img 
              src={getAvatarForUser(investor)} 
              alt={investor.name} 
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500" 
            />
          </div>
          {/* Overlapping Rank Badge */}
          <div className="absolute -top-1.5 -left-1.5 w-5 h-5 md:w-7 md:h-7 bg-[#050608] border border-primary/40 rounded-md md:rounded-lg flex items-center justify-center font-black text-[8px] md:text-xs text-primary shadow-[0_4px_10px_rgba(0,0,0,0.5)] z-20">
            #{investor.rank}
          </div>
        </div>
        
        {/* Name & Country */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h5 className="text-[10px] md:text-base font-black text-white/90 uppercase tracking-tight truncate leading-none group-hover:text-white transition-colors">{investor.name}</h5>
          </div>
          <div className="flex items-center gap-1 mt-1 md:mt-1.5">
            <span className="text-xs md:text-sm leading-none">{getFlagEmoji(investor.countryCode)}</span>
            <p className="text-[6px] md:text-[9px] font-bold text-white/30 uppercase tracking-[0.1em] truncate">
              {investor.countryName}
            </p>
          </div>
        </div>
      </div>

      {/* Right Side: Financial Info */}
      <div className="flex flex-col items-end gap-1 md:gap-1.5 relative z-10 shrink-0">
        <div className="flex items-center gap-1 md:gap-1.5 bg-emerald-500/5 px-2 py-0.5 rounded-full border border-emerald-500/10">
          <div className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
          <p className="text-[6px] md:text-[8px] font-black text-emerald-400 uppercase tracking-[0.1em] leading-none">
            Verified
          </p>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[9px] md:text-lg font-black text-primary italic font-serif tracking-tighter leading-none group-hover:scale-105 transition-transform origin-right">
            +{formatCurrency(investor.dailyRoi)}
          </span>
          <span className="text-[7px] md:text-[11px] font-bold text-emerald-400/60 uppercase tracking-tighter mt-1 leading-none">
             {formatCurrency(investor.amount)}
          </span>
        </div>
      </div>
    </motion.div>
  );
});

export default function TopInvestorsSection() {
  const navigate = useNavigate();
  const top1 = TOP_INVESTORS.find(i => i.rank === 1)!;
  const top2 = TOP_INVESTORS.find(i => i.rank === 2)!;
  const top3 = TOP_INVESTORS.find(i => i.rank === 3)!;
  const others = TOP_INVESTORS.filter(i => i.rank > 3 && i.rank <= 7); // Only show few on home

  return (
    <section className="w-full bg-[#050608] py-16 md:py-24 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-primary/5 blur-[80px] rounded-full pointer-events-none" />
      
      <div className="max-w-6xl mx-auto px-1 md:px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-white mb-4">
            CGA <span className="text-primary italic font-serif">Leaderboard</span>
          </h2>
        </div>

        {/* Top 3 Podium Card */}
        <div className="relative max-w-4xl mx-auto mb-16 p-2 md:p-12 rounded-[2.5rem] md:rounded-[3rem] overflow-hidden border border-white/5 shadow-2xl group/podium">
          {/* Custom Premium Background */}
          <div className="absolute inset-0 bg-[#080a0e]/90 backdrop-blur-md" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(var(--primary-rgb),0.2),transparent_70%)]" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.05] mix-blend-overlay" />
          
          {/* Dynamic Glows */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] bg-primary/5 blur-[70px] animate-pulse rounded-full" />
          
          <div className="relative z-10 grid grid-cols-3 gap-1 md:gap-12 items-end pt-14 md:pt-16" style={{ transform: 'translateZ(0)' }}>
            <InvestorPodium investor={top2} rank={2} />
            <InvestorPodium investor={top1} rank={1} />
            <InvestorPodium investor={top3} rank={3} />
          </div>
        </div>

        {/* Leaderboard List - Header */}
        <div className="max-w-4xl mx-auto mb-6 px-4 flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em] text-primary">Active Masters</span>
            <span className="text-[7px] md:text-[8px] font-bold uppercase tracking-[0.1em] text-white/20 mt-0.5">Tier 2 Verified Nodes</span>
          </div>
          <div className="flex items-center gap-2 md:gap-3 bg-white/5 py-1.5 md:py-2 px-3 md:px-4 rounded-full border border-white/5">
            <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(var(--primary-rgb),0.8)]" />
            <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Live Feed</span>
          </div>
        </div>

        {/* Leaderboard Individual Cards */}
        <div className="max-w-4xl mx-auto space-y-3 mb-12">
          {others.map(investor => (
            <LeaderboardRow key={investor.id} investor={investor} />
          ))}
        </div>

        <div className="flex justify-center">
          <button 
            onClick={() => navigate('/top-investors')}
            className="group flex items-center gap-3 px-8 py-4 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] text-white hover:bg-white/10 transition-all hover:scale-[1.02]"
          >
            Access Full Archive <ArrowUpRight size={14} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </button>
        </div>
      </div>
    </section>
  );
}
