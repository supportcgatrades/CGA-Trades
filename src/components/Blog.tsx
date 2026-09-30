import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  BookOpen, 
  Calendar, 
  Clock, 
  User, 
  Search, 
  Share2, 
  Heart,
  ChevronRight,
  TrendingUp,
  Award,
  Lock
} from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: 'Crypto' | 'Forex' | 'Commodities' | 'Stocks';
  image: string;
  author: string;
  readTime: string;
  date: string;
  likes: number;
}

const ARTICLES_DATA: Article[] = [
  {
    id: 'art-1',
    title: 'The Solvency Paradox: Decoupling Layer 2 Value in Institutional Assets',
    excerpt: 'An inside look at how global multi-sig treasuries are rebalancing risk across decentralized secondary networks to construct secure high-yield portfolios.',
    content: `In the rapidly evolving landscape of digital finance, the interplay between security and yield has reached a critical evolutionary junction. Institutional grade investors are increasingly looking beyond simple base-layer assets to orchestrate yield. Layer 2 networks are no longer merely testing grounds for retail scale transaction speeds; they have transformed into the core liquidity corridors for billion-dollar capital flows.\n\nAnthony Willis, founder of CGA Trades, recently highlights this shift: "Modern portfolio construction requires decoupling base-layer asset risk from execution-layer opportunity. By deploying secure multi-sig smart vaults over Layer 2 corridors, we are achieving latency and transactional efficiencies that were previously strictly domain of interbank dark pools."\n\nTo construct solid yields, investment desks must navigate the consensus overhead of Layer 1 while avoiding the execution vectors of under-collateralized networks. The solutions deployed by CGA Trades center around deep mathematical validation, real-time liquidity checking, and state-of-the-art smart-contract safety gates. By ensuring absolute transparency, CGA Trades provides its institutional clients with unmatched stability in high-yield staking and node operations.`,
    category: 'Crypto',
    image: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?q=80&w=600',
    author: 'Elena Rostova',
    readTime: '6 min read',
    date: 'May 21, 2026',
    likes: 142
  },
  {
    id: 'art-2',
    title: 'Interbank Liquidity & Fluid Rate Adjustments in G10 Currencies',
    excerpt: 'Analyzing the macroeconomic triggers that are compressing spreads across international trading desks and the synthetic hedges keeping yield secure.',
    content: `The global monetary policy landscape continues to segment as central banking systems seek narrow pathways toward economic equilibrium. For foreign exchange desks operating in the G10 space, this divergence has introduced unprecedented structural pressure on traditional spread trading models.\n\nAs volatility returns to G10 rate differentials, sovereign hedging desks are forced to seek more dynamic liquidity layers. CGA Trades' latest research reveals a strong correlation between interbank liquidity compression and the emergence of blockchain-based settlement frameworks. By utilizing automated market makers and collateralized liquidity pools, cross-border treasury operations can bypass settlement delays and secure rate spreads natively.\n\n"Forex is no longer just a game of geographic speed," says head analyst Harold Vance. "It is a battle of spatial-arbitrage efficiency. Converting cross-border currency pools into digitized collateral assets allows us to execute synthetic swaps on capital pipelines in microseconds instead of days."`,
    category: 'Forex',
    image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=600',
    author: 'Harold Vance',
    readTime: '8 min read',
    date: 'May 18, 2026',
    likes: 98
  },
  {
    id: 'art-3',
    title: 'Precision Hedging: Synthetic Yield Orchestration in Real-World Spot Metals',
    excerpt: 'Deploying algorithmic smart-contract strategies to hedge physical gold, silver, and copper portfolios against short-term credit supply shocks.',
    content: `Commodity markets have long stood as the gold standard for long-term inflation preservation, yet physical custody constraints and static yields often limit their suitability in rapid growth portfolios. Through synthetic tokenization and automated hedging, spot metal markets are undergoing a major digital renaissance.\n\nApplying cryptographic node systems to commodity storage accounts solves the underlying static yield problem. By mapping physical asset receipts directly to collateral vaults on the ledger, CGA Trades enables users to tap into liquid trading lines. These lines are actively managed using dynamic risk-mitigation algorithms that shift physical exposures into short-term synthetic futures during credit contractions.\n\nThis level of orchestration is physical trading's final frontier: bridging concrete material stores with real-time algorithmic settlement pipelines to generate compounding ROI for the preservation-oriented investor.`,
    category: 'Commodities',
    image: 'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?q=80&w=600',
    author: 'Marcus Sterling',
    readTime: '5 min read',
    date: 'May 14, 2026',
    likes: 115
  },
  {
    id: 'art-4',
    title: 'Algorithmic Leverage & High-Yield Index Rebalancing in S&P 500 Subdivisions',
    excerpt: 'How AI-driven predictive networks are restructuring traditional index models to capture premium returns while establishing safety buffers.',
    content: `Traditional buy-and-hold methodologies for stock index funds are facing a major challenge from active mathematical rebalancing. Automated analytics networks now parse vast quantities of alternative data—ranging from supply chain shipping logs to social sentiment APIs—to optimize stock weighting models inside narrow subdivisions of the S&P 500.\n\nBy dynamically boosting exposure to rapid technology sectors while shorting lagging raw materials, automated algorithms can harvest alpha that standard indices entirely miss. The critical component of this systematic process is the buffer layer: ensuring that any leveraged deployment is paired with hard programmatic circuit-breakers to protect capital during flash-crashes.\n\nCGA Trades' proprietary system monitors index risk profiles on a millisecond scale, providing clients with the peace of mind that their equity exposure is systematically insulated against systemic tail risk.`,
    category: 'Stocks',
    image: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?q=80&w=600',
    author: 'Sarah Jenkins',
    readTime: '7 min read',
    date: 'May 09, 2026',
    likes: 210
  }
];

export default function Blog() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Crypto' | 'Forex' | 'Commodities' | 'Stocks'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [likedArticles, setLikedArticles] = useState<string[]>([]);

  const toggleLike = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (likedArticles.includes(id)) {
      setLikedArticles(prev => prev.filter(item => item !== id));
      toast.info("Removed article from bookmarks");
    } else {
      setLikedArticles(prev => [...prev, id]);
      toast.success("Article bookmarked!");
    }
  };

  const handleShare = (title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`${window.location.origin}/blog?share=${encodeURIComponent(title)}`);
    toast.success("Link copied to clipboard. Share with your networks!");
  };

  const filteredArticles = ARTICLES_DATA.filter(article => {
    const matchesCategory = selectedCategory === 'All' || article.category === selectedCategory;
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          article.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          article.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#050608] text-white relative overflow-hidden font-sans">
      {/* Background Decor */}
      <div className="absolute top-0 right-[-10%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-[-10%] w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Header */}
      <header className="fixed top-0 inset-x-0 h-20 bg-[#050608]/80 backdrop-blur-md border-b border-white/5 z-50 flex items-center justify-between px-6 lg:px-20">
        <button 
          onClick={() => navigate('/welcome')}
          className="flex items-center gap-2 group text-[10px] font-bold uppercase tracking-widest text-[#ffffff60] hover:text-white transition-colors"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span>Back to CGA Trades</span>
        </button>

        <div className="flex items-center gap-3">
          <BookOpen className="text-primary" size={20} />
          <span className="text-sm font-black uppercase tracking-[0.2em] italic font-serif">CGA Intel</span>
        </div>

        <button 
          onClick={() => navigate('/welcome')}
          className="px-5 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-[10px] font-bold uppercase tracking-widest text-white transition-all"
        >
          Portal
        </button>
      </header>

      {/* Hero Header Section */}
      <div className="relative pt-36 pb-16 px-6 lg:px-20 max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Category Tag */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/10 text-primary mb-6">
          <Award size={14} />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Ecosystem Broadcast</span>
        </div>

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-sans font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-indigo-100 uppercase mb-6 max-w-4xl">
          CGA Trades Journal
        </h1>
        <p className="text-aura-muted text-sm md:text-base max-w-2xl mx-auto font-medium leading-relaxed uppercase tracking-wider">
          Fintech Insights, Algorithmic Analysis, and Institutional Asset Orchestration
        </p>
        <div className="h-[2px] w-40 bg-gradient-to-r from-transparent via-primary/50 to-transparent mt-6" />
      </div>

      {/* Search & Categories Bar */}
      <div className="max-w-7xl mx-auto px-6 mb-12">
        <div className="flex flex-col md:flex-row gap-6 items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-3xl backdrop-blur-xl">
          {/* Categories Selector */}
          <div className="flex flex-wrap gap-2 items-center justify-center">
            {(['All', 'Crypto', 'Forex', 'Commodities', 'Stocks'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all",
                  selectedCategory === cat
                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                    : "bg-white/[0.04] border border-white/5 text-white/60 hover:text-white hover:bg-white/10"
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={14} />
            <input
              type="text"
              placeholder="Search platform index..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-11 pr-4 rounded-xl bg-white/[0.03] border border-white/10 text-[11px] font-bold text-white placeholder-white/30 tracking-wider uppercase focus:outline-none focus:border-secondary transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Articles Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-24">
        {filteredArticles.length === 0 ? (
          <div className="text-center py-24 bg-white/[0.01] border border-white/5 rounded-[40px] space-y-4">
            <p className="text-sm uppercase tracking-widest text-aura-muted font-bold font-mono">No analysis registers found for "{searchQuery}"</p>
            <button 
              onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
              className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white hover:bg-white/10"
            >
              Reset Index Search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filteredArticles.map((article) => (
              <motion.article
                layoutId={`card-${article.id}`}
                key={article.id}
                onClick={() => setSelectedArticle(article)}
                className="group cursor-pointer relative bg-[#050608] border border-white/5 rounded-[32px] overflow-hidden flex flex-col justify-between hover:border-primary/30 transition-all duration-500 shadow-xl"
              >
                {/* Background lighting */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                <div>
                  {/* Photo Container */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-[#0a0b0f] border-b border-white/5">
                    <img 
                      src={article.image} 
                      alt={article.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 select-none"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050608] via-transparent to-transparent opacity-80" />
                    
                    {/* Category Label */}
                    <div className="absolute top-6 left-6 px-3 py-1.5 rounded-lg bg-[#050608]/80 backdrop-blur-md border border-white/10 text-[9px] font-black uppercase tracking-widest text-primary">
                      {article.category}
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="p-8 space-y-4">
                    <div className="flex items-center gap-4 text-[10px] text-aura-muted font-bold tracking-wider upper-case">
                      <span className="flex items-center gap-1.5"><Calendar size={12} /> {article.date}</span>
                      <span className="flex items-center gap-1.5"><Clock size={12} /> {article.readTime}</span>
                    </div>

                    <h3 className="text-lg lg:text-xl font-extrabold tracking-tight group-hover:text-primary transition-colors font-sans uppercase leading-snug line-clamp-2">
                      {article.title}
                    </h3>

                    <p className="text-aura-muted text-[11px] leading-relaxed line-clamp-3">
                      {article.excerpt}
                    </p>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="px-8 pb-8 pt-4 border-t border-white/[0.02] flex items-center justify-between">
                  <span className="text-[10px] font-bold text-white/50 lowercase tracking-wider flex items-center gap-2">
                    <User size={12} className="text-primary" /> {article.author}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => toggleLike(article.id, e)}
                      className={cn(
                        "p-2.5 rounded-xl border border-white/5 transition-colors",
                        likedArticles.includes(article.id)
                          ? "bg-red-500/10 text-red-500 border-red-500/20"
                          : "bg-white/[0.02] hover:bg-white/10 text-white/60 hover:text-white"
                      )}
                    >
                      <Heart size={14} fill={likedArticles.includes(article.id) ? "currentColor" : "none"} />
                    </button>
                    <button
                      onClick={(e) => handleShare(article.title, e)}
                      className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                    >
                      <Share2 size={14} />
                    </button>
                    <div className="h-9 w-9 rounded-xl bg-white/5 flex items-center justify-center text-white/60 group-hover:bg-primary group-hover:text-white transition-all ml-2">
                      <ChevronRight size={16} />
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </div>

      {/* Reader Modal (Full Page Overlay for immersive editorial read) */}
      <AnimatePresence>
        {selectedArticle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#050608] z-[150] overflow-y-auto"
          >
            {/* Immersive Photo Header with parallax glow */}
            <div className="relative w-full h-[40vh] md:h-[50vh] bg-[#0a0b0f] overflow-hidden">
              <img 
                src={selectedArticle.image} 
                alt={selectedArticle.title} 
                className="w-full h-full object-cover select-none"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050608] via-[#050608]/30 to-[#050608]/70" />
              
              {/* Back controls on floating header */}
              <div className="absolute top-0 inset-x-0 h-24 flex items-center justify-between px-6 lg:px-20">
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#050608]/60 backdrop-blur-md rounded-full border border-white/10 text-[10px] font-bold uppercase tracking-widest text-[#ffffff80] hover:text-white transition-all hover:scale-105"
                >
                  <ArrowLeft size={14} />
                  <span>Return to Journal</span>
                </button>

                <div className="px-4 py-2 bg-[#050608]/60 backdrop-blur-md rounded-full border border-white/10 text-[9px] font-black uppercase tracking-widest text-primary">
                  {selectedArticle.category}
                </div>
              </div>

              {/* Central Title Details */}
              <div className="absolute bottom-10 left-0 right-0 max-w-4xl mx-auto px-6 space-y-4">
                <div className="flex gap-4 text-[10px] text-primary font-bold uppercase tracking-widest">
                  <span className="flex items-center gap-1.5"><Calendar size={12} /> {selectedArticle.date}</span>
                  <span className="flex items-center gap-1.5"><Clock size={12} /> {selectedArticle.readTime}</span>
                </div>
                <h2 className="text-2xl md:text-3xl lg:text-4xl text-white font-extrabold tracking-tight uppercase leading-snug">
                  {selectedArticle.title}
                </h2>
              </div>
            </div>

            {/* Content Container */}
            <div className="max-w-4xl mx-auto px-6 py-16 space-y-12 pb-32">
              {/* Text Body */}
              <div className="space-y-6 text-white/80 text-sm md:text-base leading-relaxed whitespace-pre-line font-medium">
                {selectedArticle.content}
              </div>

              <div className="h-[1px] bg-white/5" />

              {/* Author / Sign-off block with gold seal */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-8 bg-white/[0.02] border border-white/5 rounded-3xl">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg select-none">
                    {selectedArticle.author.charAt(0)}
                  </div>
                  <div>
                    <span className="text-[10px] text-aura-muted font-black uppercase tracking-[0.2em] block">Principal Analyst</span>
                    <span className="text-white text-sm font-bold uppercase tracking-wider">{selectedArticle.author}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={(e) => toggleLike(selectedArticle.id, e)}
                    className={cn(
                      "px-5 py-3 rounded-2xl border text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95",
                      likedArticles.includes(selectedArticle.id)
                        ? "bg-red-500/10 text-red-500 border-red-500/20"
                        : "bg-white/[0.02] border-white/5 text-white/60 hover:text-white"
                    )}
                  >
                    <Heart size={14} fill={likedArticles.includes(selectedArticle.id) ? "currentColor" : "none"} />
                    <span>{likedArticles.includes(selectedArticle.id) ? 'Bookmarked' : 'Add to Bookmarks'}</span>
                  </button>

                  <button
                    onClick={(e) => handleShare(selectedArticle.title, e)}
                    className="px-5 py-3 rounded-2xl bg-primary hover:bg-primary/95 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-primary/20"
                  >
                    <Share2 size={14} />
                    <span>Share Index</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
